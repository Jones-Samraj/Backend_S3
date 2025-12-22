const db = require("../config/db");

// Get user profile
exports.profile = async (req, res) => {
  try {
    const [users] = await db.promise().query(
      `SELECT id, email, role, device_id, device_model, device_platform, app_version, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Failed to get profile", error: error.message });
  }
};

// Get user's reports
exports.getMyReports = async (req, res) => {
  try {
    const [reports] = await db.promise().query(
      `SELECT * FROM reports WHERE user_id = ? ORDER BY reported_at DESC`,
      [req.user.id]
    );

    res.json({ reports });
  } catch (error) {
    console.error("Get my reports error:", error);
    res.status(500).json({ message: "Failed to get reports", error: error.message });
  }
};

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    const [settings] = await db.promise().query(
      "SELECT * FROM app_settings WHERE user_id = ?",
      [req.user.id]
    );

    if (settings.length === 0) {
      // Return default settings
      return res.json({
        settings: {
          sensitivity: "medium",
          alerts_enabled: true,
          alert_sound: true,
          alert_vibration: true,
          data_usage: "wifi-and-mobile"
        }
      });
    }

    res.json({ settings: settings[0] });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ message: "Failed to get settings", error: error.message });
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const { sensitivity, alerts_enabled, alert_sound, alert_vibration, data_usage } = req.body;

    // Check if settings exist
    const [existing] = await db.promise().query(
      "SELECT id FROM app_settings WHERE user_id = ?",
      [req.user.id]
    );

    if (existing.length > 0) {
      await db.promise().query(
        `UPDATE app_settings 
         SET sensitivity = ?, alerts_enabled = ?, alert_sound = ?, alert_vibration = ?, data_usage = ?
         WHERE user_id = ?`,
        [sensitivity, alerts_enabled, alert_sound, alert_vibration, data_usage, req.user.id]
      );
    } else {
      await db.promise().query(
        `INSERT INTO app_settings (user_id, sensitivity, alerts_enabled, alert_sound, alert_vibration, data_usage)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.user.id, sensitivity, alerts_enabled, alert_sound, alert_vibration, data_usage]
      );
    }

    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ message: "Failed to update settings", error: error.message });
  }
};

// Get user statistics
exports.getStats = async (req, res) => {
  try {
    const [reports] = await db.promise().query(
      `SELECT COUNT(*) as total_reports, 
              SUM(total_potholes) as total_potholes,
              SUM(total_patchy_roads) as total_patchy,
              AVG(health_score) as avg_health_score
       FROM reports WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({ stats: reports[0] });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Failed to get stats", error: error.message });
  }
};
