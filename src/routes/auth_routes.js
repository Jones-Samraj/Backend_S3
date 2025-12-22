const router = require("express").Router();
const authController = require("../controllers/auth_controller");

// Register new user
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Register device (anonymous user)
router.post("/register-device", authController.registerDevice);

module.exports = router;
