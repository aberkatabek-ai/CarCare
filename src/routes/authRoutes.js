const express = require("express");

const {
    register,
    login,
    refreshSession,
    logout,
    getCurrentUser,
    updateProfile,
    updatePassword,
    updateReminderSettings,
    deleteAccount,
    requestPasswordReset,
    resetPassword
} = require("../controllers/authController");

const {
    requireAuth
} = require("../middleware/authMiddleware");
const {
    createRateLimiter
} = require("../middleware/rateLimitMiddleware");

const router = express.Router();
const authWriteLimiter = createRateLimiter({
    keyPrefix: "auth-write",
    windowMs: 10 * 60 * 1000,
    maxRequests: 10,
    message:
        "Too many authentication attempts. Please wait a few minutes and try again."
});

const forgotPasswordLimiter = createRateLimiter({
    keyPrefix: "forgot-password",
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message:
        "Too many reset requests. Please wait before requesting another code."
});

router.post("/register", authWriteLimiter, register);
router.post("/login", authWriteLimiter, login);
router.post("/refresh", refreshSession);
router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    requestPasswordReset
);
router.post("/reset-password", authWriteLimiter, resetPassword);
router.post("/logout", logout);
router.get("/me", requireAuth, getCurrentUser);
router.patch("/profile", requireAuth, updateProfile);
router.patch(
    "/password",
    requireAuth,
    authWriteLimiter,
    updatePassword
);
router.patch(
    "/reminder-settings",
    requireAuth,
    updateReminderSettings
);
router.delete(
    "/account",
    requireAuth,
    authWriteLimiter,
    deleteAccount
);

module.exports = router;
