const express = require("express");

const {
    getVehicles,
    getVehicleArchive,
    getVehicleById,
    exportBuyerHandoffPackage,
    getMileageHistory,
    createVehicle,
    updateVehicle,
    updateMileage,
    verifyVehicleOwnership,
    markVehicleAsSold,
    deleteVehicle
} = require("../controllers/vehicleController");

const {
    requireAuth
} = require("../middleware/authMiddleware");
const {
    createRateLimiter
} = require("../middleware/rateLimitMiddleware");

const router = express.Router();
const ownershipVerificationLimiter =
    createRateLimiter({
        keyPrefix: "ownership-verify",
        windowMs: 15 * 60 * 1000,
        maxRequests: 6,
        message:
            "Too many ownership verification attempts. Please wait before trying again."
    });

router.use(requireAuth);

router.get("/", getVehicles);
router.get("/archive", getVehicleArchive);
router.get(
    "/:id/handoff-package",
    exportBuyerHandoffPackage
);
router.post("/", createVehicle);
router.post(
    "/:id/verify-ownership",
    ownershipVerificationLimiter,
    verifyVehicleOwnership
);
router.patch("/:id/sell", markVehicleAsSold);
router.patch("/:id", updateVehicle);

router.get(
    "/:id/mileage-history",
    getMileageHistory
);

router.patch(
    "/:id/mileage",
    updateMileage
);

router.get("/:id", getVehicleById);
router.delete("/:id", deleteVehicle);

module.exports = router;
