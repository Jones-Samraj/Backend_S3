const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const controller = require("../controllers/user_controller");

// User profile
router.get("/profile", auth, role("user", "admin"), controller.profile);

// User's reports
router.get("/reports", auth, role("user", "admin"), controller.getMyReports);

// User settings
router.get("/settings", auth, role("user", "admin"), controller.getSettings);
router.put("/settings", auth, role("user", "admin"), controller.updateSettings);

// User statistics
router.get("/stats", auth, role("user", "admin"), controller.getStats);

module.exports = router;
