const nodemailer = require("nodemailer");

let transporterPromise = null;
let lastSentMail = null;

function hasSmtpConfiguration() {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );
}

async function getTransporter() {
    if (!hasSmtpConfiguration()) {
        return null;
    }

    if (!transporterPromise) {
        transporterPromise =
            nodemailer
                .createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT),
                    secure:
                        String(
                            process.env.SMTP_SECURE || ""
                        ).toLowerCase() === "true",
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                })
                .verify()
                .then(() =>
                    nodemailer.createTransport({
                        host: process.env.SMTP_HOST,
                        port: Number(process.env.SMTP_PORT),
                        secure:
                            String(
                                process.env.SMTP_SECURE || ""
                            ).toLowerCase() === "true",
                        auth: {
                            user: process.env.SMTP_USER,
                            pass: process.env.SMTP_PASS
                        }
                    })
                );
    }

    return transporterPromise;
}

function isProduction() {
    return process.env.NODE_ENV === "production";
}

function canSendRealMail() {
    return (
        isProduction() &&
        hasSmtpConfiguration()
    );
}

function getFromAddress() {
    return (
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        "no-reply@carcare.local"
    );
}

async function sendPasswordResetCode({
    to,
    fullName,
    code,
    expiresInMinutes
}) {
    const message = {
        from: getFromAddress(),
        to,
        subject: "CarCare password reset code",
        text:
            `Hi ${fullName || "there"},\n\n` +
            `Your CarCare password reset code is ${code}.\n` +
            `This code will expire in ${expiresInMinutes} minutes.\n\n` +
            "If you did not request this, you can ignore this email.",
        html:
            `<p>Hi ${fullName || "there"},</p>` +
            `<p>Your <strong>CarCare</strong> password reset code is:</p>` +
            `<p style="font-size:28px;font-weight:800;letter-spacing:0.2em;">${code}</p>` +
            `<p>This code will expire in ${expiresInMinutes} minutes.</p>` +
            "<p>If you did not request this, you can ignore this email.</p>"
    };

    lastSentMail = {
        to,
        subject: message.subject,
        code
    };

    try {
        if (!canSendRealMail()) {
            console.log(
                `[mail:dev] Password reset code for ${to}: ${code}`
            );

            return {
                delivered: false,
                fallback: true,
                mode: "log"
            };
        }

        const transporter = await getTransporter();

        await transporter.sendMail(message);

        return {
            delivered: true,
            fallback: false,
            mode: "smtp"
        };
    } catch (error) {
        transporterPromise = null;

        if (isProduction()) {
            throw error;
        }

        console.warn(
            `[mail:dev] SMTP send failed for ${to}. Falling back to debug code.`,
            error.message
        );

        console.log(
            `[mail:dev] Password reset code for ${to}: ${code}`
        );

        return {
            delivered: false,
            fallback: true,
            mode: "log",
            error: error.message
        };
    }
}

function renderReminderDocumentLine(
    documentRecord
) {
    const timingText =
        documentRecord.daysRemaining < 0
            ? `${Math.abs(documentRecord.daysRemaining)} days overdue`
            : `${documentRecord.daysRemaining} days remaining`;

    return (
        `<li><strong>${documentRecord.title}</strong> for ` +
        `${documentRecord.vehicleLabel} expires on ` +
        `${documentRecord.expiryDate} (${timingText}).</li>`
    );
}

function renderReminderPlanLine(plan) {
    const dueParts = [];

    if (
        plan.nextDueMileage !== null &&
        plan.nextDueMileage !== undefined
    ) {
        dueParts.push(
            `${Number(plan.nextDueMileage).toLocaleString("en-US")} km`
        );
    }

    if (plan.nextDueDate) {
        dueParts.push(plan.nextDueDate);
    }

    const dueText =
        dueParts.length > 0
            ? dueParts.join(" / ")
            : "baseline required";

    return (
        `<li><strong>${plan.name}</strong> for ` +
        `${plan.vehicleLabel} is ${plan.status.replaceAll("_", " ")}. ` +
        `Next due: ${dueText}.</li>`
    );
}

async function sendReminderDigestEmail({
    to,
    fullName,
    summary
}) {
    const textParts = [
        `Hi ${fullName || "there"},`,
        "",
        "Here is your CarCare reminder summary."
    ];

    if (summary.documents.length > 0) {
        textParts.push("", "Document reminders:");

        summary.documents.forEach((documentRecord) => {
            const timingText =
                documentRecord.daysRemaining < 0
                    ? `${Math.abs(documentRecord.daysRemaining)} days overdue`
                    : `${documentRecord.daysRemaining} days remaining`;

            textParts.push(
                `- ${documentRecord.title} for ${documentRecord.vehicleLabel}: ${documentRecord.expiryDate} (${timingText})`
            );
        });
    }

    if (summary.maintenancePlans.length > 0) {
        textParts.push("", "Maintenance alerts:");

        summary.maintenancePlans.forEach((plan) => {
            const dueParts = [];

            if (
                plan.nextDueMileage !== null &&
                plan.nextDueMileage !== undefined
            ) {
                dueParts.push(
                    `${Number(plan.nextDueMileage).toLocaleString("en-US")} km`
                );
            }

            if (plan.nextDueDate) {
                dueParts.push(plan.nextDueDate);
            }

            textParts.push(
                `- ${plan.name} for ${plan.vehicleLabel}: ${plan.status.replaceAll("_", " ")}${dueParts.length > 0 ? `, next due ${dueParts.join(" / ")}` : ""}`
            );
        });
    }

    textParts.push(
        "",
        "Open CarCare to review and update your records."
    );

    const message = {
        from: getFromAddress(),
        to,
        subject: "CarCare reminder summary",
        text: textParts.join("\n"),
        html:
            `<p>Hi ${fullName || "there"},</p>` +
            "<p>Here is your <strong>CarCare</strong> reminder summary.</p>" +
            (summary.documents.length > 0
                ? `<h3>Document reminders</h3><ul>${summary.documents
                    .map(renderReminderDocumentLine)
                    .join("")}</ul>`
                : "") +
            (summary.maintenancePlans.length > 0
                ? `<h3>Maintenance alerts</h3><ul>${summary.maintenancePlans
                    .map(renderReminderPlanLine)
                    .join("")}</ul>`
                : "") +
            "<p>Open CarCare to review and update your records.</p>"
    };

    if (!canSendRealMail()) {
        console.log(
            `[mail:dev] Reminder summary prepared for ${to}.`
        );

        return {
            delivered: false,
            fallback: true,
            mode: "log"
        };
    }

    const transporter = await getTransporter();

    await transporter.sendMail(message);

    return {
        delivered: true,
        fallback: false,
        mode: "smtp"
    };
}

function getLastSentMail() {
    return lastSentMail;
}

module.exports = {
    hasSmtpConfiguration,
    sendPasswordResetCode,
    sendReminderDigestEmail,
    getLastSentMail
};
