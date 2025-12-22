const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const controller = require("../controllers/admin_controller");

// Dashboard
router.get("/dashboard", auth, role("admin"), controller.dashboard);

// Users management
router.get("/users", auth, role("admin"), controller.getAllUsers);

// Reports management
router.get("/reports", auth, role("admin"), controller.getAllReports);

// Potholes management
router.get("/potholes", auth, role("admin"), controller.getPotholeDetections);
router.get("/potholes/grouped", auth, role("admin"), controller.getPotholesGrouped);

// Contractors management
router.get("/contractors", auth, role("admin"), controller.getContractors);
router.post("/contractors", auth, role("admin"), controller.createContractor);

// Assignment
router.post("/assign", auth, role("admin"), controller.assignToContractor);
router.post("/assign/batch", auth, role("admin"), controller.batchAssign);
router.get("/assignments", auth, role("admin"), controller.getAssignments);

// Verification
router.post("/verify/:locationId", auth, role("admin"), controller.verifyWork);
router.post("/verify/batch", auth, role("admin"), controller.batchVerify);
router.post("/verify/:locationId/reject", auth, role("admin"), controller.rejectVerification);

// Map data
router.get("/map/points", auth, role("admin"), controller.getMapPoints);

// History
router.get("/history", auth, role("admin"), controller.getHistory);

module.exports = router;
