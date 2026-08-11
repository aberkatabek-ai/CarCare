const nodemailer = require("nodemailer");
const dns = require("dns");
const net = require("net");
const tls = require("tls");

let transporterPromise = null;
let lastSentMail = null;

function openSmtpSocket(host, port, secure) {
    return new Promise((resolve, reject) => {
        function connectWithAddresses(addresses) {
            const ipv4Addresses = Array.isArray(addresses)
                ? addresses.filter(Boolean)
                : [];

            if (ipv4Addresses.length === 0) {
                reject(
                    new Error(
                        `No IPv4 SMTP addresses were found for ${host}.`
                    )
                );
                return;
            }

            let currentIndex = 0;

            function tryNextAddress(lastError) {
                if (
                    currentIndex >=
                    ipv4Addresses.length
                ) {
                    reject(
                        lastError ||
                            new Error(
                                `Could not connect to any IPv4 SMTP address for ${host}.`
                            )
                    );
                    return;
                }

                const address =
                    ipv4Addresses[currentIndex];

                currentIndex += 1;

                const socket = secure
                    ? tls.connect({
                        host: address,
                        port,
                        family: 4,
                        servername: host
                    })
                    : net.connect({
                        host: address,
                        port,
                        family: 4
                    });

                const timeoutMs = 15000;

                socket.setTimeout(timeoutMs);

                const handleFailure = (error) => {
                    socket.destroy();
                    tryNextAddress(error);
                };

                socket.once(
                    "error",
                    handleFailure
                );

                socket.once("timeout", () => {
                    handleFailure(
                        new Error(
                            `SMTP connection timed out after ${timeoutMs} ms.`
                        )
                    );
                });

                if (secure) {
                    socket.once(
                        "secureConnect",
                        () => {
                            socket.removeListener(
                                "error",
                                handleFailure
                            );
                            socket.setTimeout(0);
                            resolve(socket);
                        }
                    );
                } else {
                    socket.once("connect", () => {
                        socket.removeListener(
                            "error",
                            handleFailure
                        );
                        socket.setTimeout(0);
                        resolve(socket);
                    });
                }
            }

            tryNextAddress();
        }

        dns.resolve4(host, (dnsError, addresses) => {
            if (
                !dnsError &&
                Array.isArray(addresses) &&
                addresses.length > 0
            ) {
                connectWithAddresses(addresses);
                return;
            }

            dns.lookup(
                host,
                {
                    family: 4,
                    all: true
                },
                (lookupError, records) => {
                    if (lookupError) {
                        reject(
                            dnsError || lookupError
                        );
                        return;
                    }

                    const lookupAddresses =
                        Array.isArray(records)
                            ? records.map(
                                (record) =>
                                    record.address
                            )
                            : [];

                    if (
                        lookupAddresses.length === 0
                    ) {
                        reject(
                            dnsError ||
                                new Error(
                                    `No IPv4 SMTP addresses were found for ${host}.`
                                )
                        );
                        return;
                    }

                    connectWithAddresses(
                        lookupAddresses
                    );
                }
            );
        });
    });
}

function getSmtpSocket(options, callback) {
    openSmtpSocket(
        options.host,
        Number(options.port),
        options.secure
    )
        .then((connection) =>
            callback(null, {
                connection,
                secured: Boolean(
                    options.secure
                )
            })
        )
        .catch((error) => callback(error));
}

function getTransportOptions(
    overrides = {}
) {
    return {
        host:
            overrides.host ||
            process.env.SMTP_HOST,
        port:
            Number(
                overrides.port ??
                    process.env.SMTP_PORT
            ) || 587,
        secure:
            overrides.secure ??
            (String(
                process.env.SMTP_SECURE || ""
            ).toLowerCase() === "true"),
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        dnsTimeout: 10000,
        tls: {
            servername:
                overrides.host ||
                process.env.SMTP_HOST
        },
        getSocket: getSmtpSocket,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };
}

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
        transporterPromise = Promise.resolve(
            nodemailer.createTransport(
                getTransportOptions()
            )
        );
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
    return hasSmtpConfiguration();
}

function getFromAddress() {
    return (
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        "no-reply@carcare.local"
    );
}

function isGmailSmtpFallbackCandidate(
    error
) {
    if (
        process.env.SMTP_HOST !==
        "smtp.gmail.com"
    ) {
        return false;
    }

    if (
        Number(process.env.SMTP_PORT) !==
        587
    ) {
        return false;
    }

    if (
        String(
            process.env.SMTP_SECURE || ""
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

        return fallbackTransporter.sendMail(
            message
        );
    }
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
                    "SMTP is not configured for production password reset delivery."
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

        await sendMailWithFallback(
            message
        );

        return {
            delivered: true,
            fallback: false,
            mode: "smtp"
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
                "SMTP is not configured for production reminder delivery."
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

    await sendMailWithFallback(message);

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
