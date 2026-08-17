const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL was not loaded from .env");
}

if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET was not loaded from .env");
}

if (
    !(
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
        "[mail] No email provider is configured. Add RESEND_API_KEY or SMTP_* variables if forgot-password emails should reach real inboxes."
    );
}

const app = require("./src/app");
const {
    scheduleReminderLoop
} = require("./src/services/reminderService");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`CarCare server is running at http://localhost:${PORT}`);
    scheduleReminderLoop();
});
