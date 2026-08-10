const express = require("express");

const {
    requireAuth
} = require("../middleware/authMiddleware");
const {
    aiChatLimiter,
    chatWithGarageAi
} = require("../controllers/aiController");

const router = express.Router();

router.use(requireAuth);

router.post(
    "/chat",
    aiChatLimiter,
    chatWithGarageAi
);

module.exports = router;
