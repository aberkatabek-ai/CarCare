const express = require("express");

const {
    getFuelEntries,
    createFuelEntry,
    deleteFuelEntry,
    getExpenses,
    createExpense,
    deleteExpense,
    getCostSummary
} = require(
    "../controllers/costController"
);

const {
    requireAuth
} = require(
    "../middleware/authMiddleware"
);

const router = express.Router();

router.use(requireAuth);

router.get(
    "/summary",
    getCostSummary
);

router.get(
    "/fuel",
    getFuelEntries
);

router.post(
    "/fuel",
    createFuelEntry
);

router.delete(
    "/fuel/:id",
    deleteFuelEntry
);

router.get(
    "/expenses",
    getExpenses
);

router.post(
    "/expenses",
    createExpense
);

router.delete(
    "/expenses/:id",
    deleteExpense
);

module.exports = router;