const express = require("express");

const {
    getMaintenancePlans,
    createMaintenancePlan,
    deleteMaintenancePlan
} = require("../controllers/maintenanceController");

const {
    requireAuth
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);

router.get("/", getMaintenancePlans);
router.post("/", createMaintenancePlan);
router.delete("/:id", deleteMaintenancePlan);

module.exports = router;