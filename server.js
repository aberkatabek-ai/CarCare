const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL was not loaded from .env");
}

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET was not loaded from .env");
}

if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error(
        "JWT_REFRESH_SECRET was not loaded from .env"
    );
}

if (
    !(
        (
            process.env.GMAIL_API_CLIENT_ID &&
            process.env.GMAIL_API_CLIENT_SECRET &&
            process.env.GMAIL_API_REFRESH_TOKEN &&
            (
                process.env.GMAIL_API_SENDER_EMAIL ||
                process.env.EMAIL_FROM
            )
        ) ||
        process.env.RESEND_API_KEY ||
        (
            process.env.SMTP_HOST &&
            process.env.SMTP_PORT &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS
        )
    )
) {
    console.warn(
        "[mail] No email provider is configured. Add Gmail API, RESEND_API_KEY, or SMTP_* variables if forgot-password emails should reach real inboxes."
    );
}

const app = require("./src/app");
const {
    scheduleReminderLoop
} = require("./src/services/reminderService");
const {
    ensureAuthTables
} = require("./src/services/authSessionService");

const PORT = process.env.PORT || 3000;

(async () => {
    await ensureAuthTables();

    app.listen(PORT, () => {
        console.log(`CarCare server is running at http://localhost:${PORT}`);
        scheduleReminderLoop();
    });
})().catch((error) => {
    console.error(
        "Server bootstrap failed:",
        error
    );
    process.exit(1);
});
