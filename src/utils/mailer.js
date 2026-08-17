const nodemailer = require("nodemailer");
const dns = require("dns");

let transporterPromise = null;
let lastSentMail = null;
let gmailAccessTokenPromise = null;

function getEnvValue(name) {
    const rawValue = process.env[name];

    if (rawValue === undefined || rawValue === null) {
        return "";
    }

    const trimmedValue =
        String(rawValue).trim();

    if (
        trimmedValue.length >= 2 &&
        ((trimmedValue.startsWith('"') &&
            trimmedValue.endsWith('"')) ||
            (trimmedValue.startsWith("'") &&
                trimmedValue.endsWith("'")))
    ) {
        return trimmedValue.slice(1, -1);
    }

    return trimmedValue;
}

function getMailProviderPreference() {
    return (
        getEnvValue("EMAIL_PROVIDER") ||
        "auto"
    ).toLowerCase();
}

function normalizeProviderName(name) {
    return String(name || "")
        .trim()
        .toLowerCase()
        .replaceAll("-", "_");
}

function isGmailHost(host) {
    return host === "smtp.gmail.com";
}

function getSmtpAuth() {
    const user = getEnvValue("SMTP_USER");
    let pass = getEnvValue("SMTP_PASS");
    const host = getEnvValue("SMTP_HOST");

    if (isGmailHost(host)) {
        pass = pass.replace(/\s+/g, "");
    }

    return {
        user,
        pass
    };
}

function getTransportOptions(
    overrides = {}
) {
    const host =
        overrides.host ||
        getEnvValue("SMTP_HOST");
    const port =
        Number(
            overrides.port ??
                getEnvValue("SMTP_PORT")
        ) || 587;
    const secure =
        overrides.secure ??
        (getEnvValue(
            "SMTP_SECURE"
        ).toLowerCase() === "true");
    const auth = getSmtpAuth();

    return {
        host,
        name: host,
        port,
        secure,
        family: 4,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        requireTLS: !secure && port === 587,
        lookup(lookupHost, _options, callback) {
            dns.lookup(
                lookupHost,
                {
                    family: 4
                },
                callback
            );
        },
        tls: {
            servername: host,
            minVersion: "TLSv1.2"
        },
        auth
    };
}

function hasSmtpConfiguration() {
    const auth = getSmtpAuth();

    return Boolean(
        getEnvValue("SMTP_HOST") &&
        getEnvValue("SMTP_PORT") &&
        auth.user &&
        auth.pass
    );
}

function hasResendConfiguration() {
    return Boolean(
        getEnvValue("RESEND_API_KEY") &&
        getFromAddress()
    );
}

function hasGmailApiConfiguration() {
    return Boolean(
        getEnvValue("GMAIL_API_CLIENT_ID") &&
        getEnvValue("GMAIL_API_CLIENT_SECRET") &&
        getEnvValue("GMAIL_API_REFRESH_TOKEN") &&
        getGmailApiSenderEmail()
    );
}

function getGmailApiSenderEmail() {
    return (
        getEnvValue(
            "GMAIL_API_SENDER_EMAIL"
        ) ||
        getEnvValue("SMTP_USER")
    );
}

function getConfiguredMailProvider() {
    const preference = normalizeProviderName(
        getMailProviderPreference()
    );

    if (preference === "gmail_api") {
        return hasGmailApiConfiguration()
            ? "gmail_api"
            : null;
    }

    if (preference === "resend") {
        return hasResendConfiguration()
            ? "resend"
            : null;
    }

    if (preference === "smtp") {
        return hasSmtpConfiguration()
            ? "smtp"
            : null;
    }

    if (hasGmailApiConfiguration()) {
        return "gmail_api";
    }

    if (hasResendConfiguration()) {
        return "resend";
    }

    if (hasSmtpConfiguration()) {
        return "smtp";
    }

    return null;
}

async function getTransporter() {
    if (!hasSmtpConfiguration()) {
        return null;
    }

    if (!transporterPromise) {
        const transporter =
            nodemailer.createTransport(
                getTransportOptions()
            );

        transporterPromise =
            transporter
                .verify()
                .then(() => transporter)
                .catch((error) => {
                    transporterPromise = null;
                    throw error;
                });
    }

    return transporterPromise;
}

function createTransporter(
    overrides = {}
) {
    return nodemailer.createTransport(
        getTransportOptions(overrides)
    );
}

function isProduction() {
    return process.env.NODE_ENV === "production";
}

function canSendRealMail() {
    return Boolean(
        getConfiguredMailProvider()
    );
}

function getFromAddress() {
    return (
        getEnvValue("EMAIL_FROM") ||
        getEnvValue(
            "GMAIL_API_SENDER_EMAIL"
        ) ||
        getEnvValue("SMTP_FROM") ||
        getEnvValue("SMTP_USER") ||
        "no-reply@carcare.local"
    );
}

function getMailConfigurationErrorMessage(
    mailType
) {
    const preference =
        getMailProviderPreference();

    if (preference === "resend") {
        return `Resend is not configured for production ${mailType} delivery.`;
    }

    if (
        normalizeProviderName(preference) ===
        "gmail_api"
    ) {
        return `Gmail API is not configured for production ${mailType} delivery.`;
    }

    if (preference === "smtp") {
        return `SMTP is not configured for production ${mailType} delivery.`;
    }

    return `No email provider is configured for production ${mailType} delivery. Add Gmail API, RESEND_API_KEY, or SMTP_* variables.`;
}

function isGmailSmtpFallbackCandidate(
    error
) {
    if (
        getEnvValue("SMTP_HOST") !==
        "smtp.gmail.com"
    ) {
        return false;
    }

    if (
        Number(getEnvValue("SMTP_PORT")) !==
        587
    ) {
        return false;
    }

    if (
        getEnvValue(
            "SMTP_SECURE"
        ).toLowerCase() === "true"
    ) {
        return false;
    }

    const message = String(
        error?.message || ""
    ).toLowerCase();
    const code = String(
        error?.code || ""
    ).toUpperCase();

    if (code === "EAUTH") {
        return false;
    }

    return (
        code === "ETIMEDOUT" ||
        code === "ESOCKET" ||
        code === "ECONNECTION" ||
        message.includes("timed out") ||
        message.includes("enetunreach")
    );
}

async function sendMailWithFallback(
    message
) {
    const transporter =
        await getTransporter();

    try {
        return await transporter.sendMail(
            message
        );
    } catch (error) {
        transporterPromise = null;

        if (
            !isGmailSmtpFallbackCandidate(
                error
            )
        ) {
            throw error;
        }

        const fallbackTransporter =
            createTransporter({
                port: 465,
                secure: true
            });

        await fallbackTransporter.verify();

        return fallbackTransporter.sendMail(
            message
        );
    }
}

async function sendMailWithResend(
    message
) {
    const response = await fetch(
        "https://api.resend.com/emails",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getEnvValue("RESEND_API_KEY")}`,
                "Content-Type":
                    "application/json",
                "User-Agent":
                    "CarCare/1.0"
            },
            body: JSON.stringify({
                from: message.from,
                to: [message.to],
                subject: message.subject,
                html: message.html,
                text: message.text
            })
        }
    );

    const rawBody =
        await response.text();
    let payload = null;

    try {
        payload = rawBody
            ? JSON.parse(rawBody)
            : null;
    } catch (_error) {
        payload = null;
    }

    if (!response.ok) {
        throw new Error(
            payload?.message ||
                payload?.error ||
                `Resend API returned ${response.status}.`
        );
    }

    return {
        provider: "resend",
        id: payload?.id || null
    };
}

async function getGmailApiAccessToken() {
    if (!hasGmailApiConfiguration()) {
        throw new Error(
            "Gmail API credentials are incomplete."
        );
    }

    if (!gmailAccessTokenPromise) {
        gmailAccessTokenPromise = fetch(
            "https://oauth2.googleapis.com/token",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",
                    "User-Agent":
                        "CarCare/1.0"
                },
                body: new URLSearchParams({
                    client_id:
                        getEnvValue(
                            "GMAIL_API_CLIENT_ID"
                        ),
                    client_secret:
                        getEnvValue(
                            "GMAIL_API_CLIENT_SECRET"
                        ),
                    refresh_token:
                        getEnvValue(
                            "GMAIL_API_REFRESH_TOKEN"
                        ),
                    grant_type:
                        "refresh_token"
                }).toString()
            }
        )
            .then(async (response) => {
                const payload =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        payload?.error_description ||
                            payload?.error ||
                            `OAuth token request returned ${response.status}.`
                    );
                }

                return payload.access_token;
            })
            .catch((error) => {
                gmailAccessTokenPromise = null;
                throw error;
            });
    }

    return gmailAccessTokenPromise;
}

function createBoundary() {
    return `carcare_${Date.now()}_${Math.random()
        .toString(16)
        .slice(2)}`;
}

function encodeHeaderValue(value) {
    return String(value || "")
        .replaceAll("\r", "")
        .replaceAll("\n", " ");
}

function createRawMimeMessage(message) {
    const boundary = createBoundary();
    const lines = [
        `From: ${encodeHeaderValue(
            message.from
        )}`,
        `To: ${encodeHeaderValue(
            message.to
        )}`,
        `Subject: ${encodeHeaderValue(
            message.subject
        )}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "Content-Transfer-Encoding: 7bit",
        "",
        message.text || "",
        "",
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        "Content-Transfer-Encoding: 7bit",
        "",
        message.html || "",
        "",
        `--${boundary}--`
    ];

    return Buffer.from(
        lines.join("\r\n"),
        "utf8"
    )
        .toString("base64")
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/u, "");
}

async function sendMailWithGmailApi(
    message
) {
    const accessToken =
        await getGmailApiAccessToken();
    const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type":
                    "application/json",
                "User-Agent":
                    "CarCare/1.0"
            },
            body: JSON.stringify({
                raw: createRawMimeMessage({
                    ...message,
                    from:
                        message.from ||
                        getGmailApiSenderEmail()
                })
            })
        }
    );

    const payload =
        await response.json();

    if (!response.ok) {
        gmailAccessTokenPromise = null;
        throw new Error(
            payload?.error?.message ||
                `Gmail API returned ${response.status}.`
        );
    }

    return {
        provider: "gmail_api",
        id: payload?.id || null
    };
}

async function sendMail(message) {
    const provider =
        getConfiguredMailProvider();

    if (provider === "gmail_api") {
        return sendMailWithGmailApi(
            message
        );
    }

    if (provider === "resend") {
        return sendMailWithResend(
            message
        );
    }

    if (provider === "smtp") {
        return sendMailWithFallback(
            message
        );
    }

    throw new Error(
        "No configured email provider is available."
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
            if (isProduction()) {
                throw new Error(
                    getMailConfigurationErrorMessage(
                        "password reset"
                    )
                );
            }

            console.log(
                `[mail:dev] Password reset code for ${to}: ${code}`
            );

            return {
                delivered: false,
                fallback: true,
                mode: "log"
            };
        }

        const deliveryResult =
            await sendMail(message);

        return {
            delivered: true,
            fallback: false,
            mode:
                getConfiguredMailProvider() ||
                "unknown",
            provider:
                deliveryResult?.provider ||
                getConfiguredMailProvider()
        };
    } catch (error) {
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
        if (isProduction()) {
            throw new Error(
                getMailConfigurationErrorMessage(
                    "reminder"
                )
            );
        }

        console.log(
            `[mail:dev] Reminder summary prepared for ${to}.`
        );

        return {
            delivered: false,
            fallback: true,
            mode: "log"
        };
    }

    const deliveryResult =
        await sendMail(message);

    return {
        delivered: true,
        fallback: false,
        mode:
            getConfiguredMailProvider() ||
            "unknown",
        provider:
            deliveryResult?.provider ||
            getConfiguredMailProvider()
    };
}

function getLastSentMail() {
    return lastSentMail;
}

module.exports = {
    canSendRealMail,
    getConfiguredMailProvider,
    getGmailApiSenderEmail,
    getSmtpAuth,
    hasGmailApiConfiguration,
    hasSmtpConfiguration,
    hasResendConfiguration,
    sendPasswordResetCode,
    sendReminderDigestEmail,
    getLastSentMail
};
