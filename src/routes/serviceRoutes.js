const express = require("express");

const {
    getServiceHistory,
    completeMaintenance
} = require("../controllers/serviceController");

const {
    requireAuth
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);

router.get("/", getServiceHistory);

router.post(
    "/complete/:planId",
    completeMaintenance
);

module.exports = router;