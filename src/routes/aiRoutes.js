const express = require("express");

const {
    requireAuth
} = require("../middleware/authMiddleware");
const {
    aiChatLimiter,
    chatWithGarageAi,
    saveGarageAiFeedback,
    getGarageAiHistory,
    exportGarageAiDataset
} = require("../controllers/aiController");

const router = express.Router();

router.use(requireAuth);

router.post(
    "/chat",
    aiChatLimiter,
    chatWithGarageAi
);

router.get("/history", getGarageAiHistory);
router.get("/dataset", exportGarageAiDataset);
router.post(
    "/conversations/:id/feedback",
    saveGarageAiFeedback
);

module.exports = router;
