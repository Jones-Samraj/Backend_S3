const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");
const { v4: uuidv4 } = require("uuid");

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, deviceId, deviceModel, devicePlatform, appVersion } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if user exists
    const [existing] = await db.promise().query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.promise().query(
      `INSERT INTO users (email, password, device_id, device_model, device_platform, app_version) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, deviceId, deviceModel, devicePlatform, appVersion]
    );

    const token = generateToken({ id: result.insertId, role: "user" });

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
      token
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const [users] = await db.promise().query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({ id: user.id, role: user.role });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// Register device (for anonymous reporting)
exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, deviceModel, devicePlatform, appVersion } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: "Device ID is required" });
    }

    // Check if device already registered
    const [existing] = await db.promise().query(
      "SELECT id, email FROM users WHERE device_id = ?",
      [deviceId]
    );

    if (existing.length > 0) {
      const token = generateToken({ id: existing[0].id, role: "user" });
      return res.json({
        message: "Device already registered",
        userId: existing[0].id,
        token,
        isNew: false
      });
    }

    // Create anonymous user
    const anonymousEmail = `device_${deviceId}@anonymous.pothole`;
    const randomPassword = uuidv4();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const [result] = await db.promise().query(
      `INSERT INTO users (email, password, device_id, device_model, device_platform, app_version) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [anonymousEmail, hashedPassword, deviceId, deviceModel, devicePlatform, appVersion]
    );

    const token = generateToken({ id: result.insertId, role: "user" });

    res.status(201).json({
      message: "Device registered successfully",
      userId: result.insertId,
      token,
      isNew: true
    });
  } catch (error) {
    console.error("Device register error:", error);
    res.status(500).json({ message: "Device registration failed", error: error.message });
  }
};
