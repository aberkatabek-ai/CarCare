const bcrypt = require("bcrypt");
const db = require("../config/db");
const {
    removeStoredDocument
} = require("../utils/documentUpload");
const {
    normalizeEmail,
    normalizeName,
    validateRegistration,
    validateProfileUpdate,
    validatePasswordUpdate,
    validateDeleteAccount,
    validateForgotPasswordRequest,
    validatePasswordReset
} = require("../utils/profileValidation");
const {
    createPasswordResetCode,
    consumePasswordResetCode
} = require("../utils/passwordReset");
const {
    sendPasswordResetCode
} = require("../utils/mailer");
const {
    shouldExposePasswordResetCode
} = require("../utils/passwordResetDelivery");

let preferredNameColumnState = null;
let remindersEnabledColumnState = null;

async function hasPreferredNameColumn() {
    if (preferredNameColumnState !== null) {
        return preferredNameColumnState;
    }

    const result = await db.query(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
              AND column_name = 'preferred_name'
        ) AS has_preferred_name`
    );

    preferredNameColumnState = Boolean(
        result.rows[0]?.has_preferred_name
    );

    return preferredNameColumnState;
}

async function hasRemindersEnabledColumn() {
    if (remindersEnabledColumnState !== null) {
        return remindersEnabledColumnState;
    }

    const result = await db.query(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
              AND column_name = 'reminders_enabled'
        ) AS has_reminders_enabled`
    );

    remindersEnabledColumnState = Boolean(
        result.rows[0]?.has_reminders_enabled
    );

    return remindersEnabledColumnState;
}

async function getUserById(userId) {
    const includePreferredName =
        await hasPreferredNameColumn();
    const includeRemindersEnabled =
        await hasRemindersEnabledColumn();

    const result = await db.query(
        includePreferredName &&
        includeRemindersEnabled
            ? `SELECT
                id,
                full_name,
                preferred_name,
                email,
                reminders_enabled,
                created_at
               FROM users
               WHERE id = $1`
            : includePreferredName
                ? `SELECT
                id,
                full_name,
                preferred_name,
                email,
                TRUE AS reminders_enabled,
                created_at
               FROM users
               WHERE id = $1`
                : includeRemindersEnabled
                    ? `SELECT
                id,
                full_name,
                NULL AS preferred_name,
                email,
                reminders_enabled,
                created_at
               FROM users
               WHERE id = $1`
            : `SELECT
                id,
                full_name,
                NULL AS preferred_name,
                email,
                TRUE AS reminders_enabled,
                created_at
               FROM users
               WHERE id = $1`,
        [userId]
    );

    return result.rows[0] || null;
}

function createUserSession(req, userId) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => {
            if (error) {
                return reject(error);
            }

            req.session.userId = userId;

            req.session.save((saveError) => {
                if (saveError) {
                    return reject(saveError);
                }

                resolve();
            });
        });
    });
}

function destroyUserSession(req) {
    return new Promise((resolve, reject) => {
        req.session.destroy((error) => {
            if (error) {
                return reject(error);
            }

            resolve();
        });
    });
}

async function register(req, res, next) {
    try {
        const validation =
            validateRegistration(req.body);

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const registrationData =
            validation.value;

        const existingUser = await db.query(
            "SELECT id FROM users WHERE email = $1",
            [registrationData.email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account already exists with this email."
            });
        }

        const passwordHash = await bcrypt.hash(
            registrationData.password,
            12
        );

        const result = await db.query(
            `INSERT INTO users (
                full_name,
                email,
                password_hash
            )
            VALUES ($1, $2, $3)
            RETURNING id, full_name, email, created_at`,
            [
                registrationData.fullName,
                registrationData.email,
                passwordHash
            ]
        );

        const user = result.rows[0];

        await createUserSession(req, user.id);

        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            user
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "An account already exists with this email."
            });
        }

        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        const normalizedEmail =
            normalizeEmail(email);

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const result = await db.query(
            `SELECT
                id,
                full_name,
                email,
                password_hash,
                created_at
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Email or password is incorrect."
            });
        }

        const user = result.rows[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Email or password is incorrect."
            });
        }

        await createUserSession(req, user.id);

        res.json({
            success: true,
            message: "Login successful.",
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        next(error);
    }
}

async function logout(req, res, next) {
    try {
        req.session.destroy((error) => {
            if (error) {
                return next(error);
            }

            res.clearCookie("carcare.sid");

            res.json({
                success: true,
                message: "Logout successful."
            });
        });
    } catch (error) {
        next(error);
    }
}

async function getCurrentUser(req, res, next) {
    try {
        const user = await getUserById(
            req.session.userId
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User was not found."
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
}

async function updateProfile(req, res, next) {
    try {
        const validation =
            validateProfileUpdate(req.body);

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const profileData = validation.value;

        const existingUser = await db.query(
            `SELECT id
             FROM users
             WHERE email = $1
               AND id <> $2`,
            [
                profileData.email,
                req.session.userId
            ]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Another account already uses this email address."
            });
        }

        const result = await db.query(
            await hasPreferredNameColumn()
                ? `UPDATE users
                   SET
                      full_name = $1,
                      preferred_name = $2,
                      email = $3
                   WHERE id = $4`
                : `UPDATE users
                   SET
                      full_name = $1,
                      email = $2
                   WHERE id = $3`,
            await hasPreferredNameColumn()
                ? [
                    profileData.fullName,
                    profileData.preferredName,
                    profileData.email,
                    req.session.userId
                ]
                : [
                    profileData.fullName,
                    profileData.email,
                    req.session.userId
                ]
        );

        const user = await getUserById(
            req.session.userId
        );

        res.json({
            success: true,
            message:
                "Profile settings updated successfully.",
            user
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message:
                    "Another account already uses this email address."
            });
        }

        next(error);
    }
}

async function updatePassword(req, res, next) {
    try {
        const validation =
            validatePasswordUpdate(req.body);

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const passwordData = validation.value;

        const result = await db.query(
            `SELECT id, password_hash
             FROM users
             WHERE id = $1`,
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User was not found."
            });
        }

        const user = result.rows[0];

        const passwordMatches =
            await bcrypt.compare(
                passwordData.currentPassword,
                user.password_hash
            );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message:
                    "Current password is incorrect."
            });
        }

        const passwordHash =
            await bcrypt.hash(
                passwordData.newPassword,
                12
            );

        await db.query(
            `UPDATE users
             SET password_hash = $1
             WHERE id = $2`,
            [
                passwordHash,
                req.session.userId
            ]
        );

        res.json({
            success: true,
            message:
                "Password updated successfully."
        });
    } catch (error) {
        next(error);
    }
}

async function updateReminderSettings(
    req,
    res,
    next
) {
    try {
        const remindersEnabled =
            req.body.remindersEnabled;

        if (
            typeof remindersEnabled !== "boolean"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reminder preference must be true or false."
            });
        }

        if (
            !(
                await hasRemindersEnabledColumn()
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reminder settings are not available yet. Apply the latest database schema first."
            });
        }

        await db.query(
            `UPDATE users
             SET reminders_enabled = $1
             WHERE id = $2`,
            [
                remindersEnabled,
                req.session.userId
            ]
        );

        const user = await getUserById(
            req.session.userId
        );

        res.json({
            success: true,
            message:
                remindersEnabled
                    ? "Email reminders enabled."
                    : "Email reminders paused.",
            user
        });
    } catch (error) {
        next(error);
    }
}

async function deleteAccount(req, res, next) {
    const client = await db.connect();
    let shouldReleaseClient = true;
    let transactionStarted = false;

    try {
        const validation =
            validateDeleteAccount(req.body);

        if (validation.error) {
            shouldReleaseClient = false;
            client.release();
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const { currentPassword } =
            validation.value;

        const userResult = await client.query(
            `SELECT id, password_hash
             FROM users
             WHERE id = $1`,
            [req.session.userId]
        );

        if (userResult.rows.length === 0) {
            shouldReleaseClient = false;
            client.release();
            return res.status(404).json({
                success: false,
                message: "User was not found."
            });
        }

        const user = userResult.rows[0];
        const passwordMatches =
            await bcrypt.compare(
                currentPassword,
                user.password_hash
            );

        if (!passwordMatches) {
            shouldReleaseClient = false;
            client.release();
            return res.status(401).json({
                success: false,
                message:
                    "Current password is incorrect."
            });
        }

        const fileResult = await client.query(
            `SELECT stored_file_name
             FROM vehicle_documents
             WHERE vehicle_id IN (
                SELECT id
                FROM vehicles
                WHERE user_id = $1
             )
               AND stored_file_name IS NOT NULL

             UNION ALL

             SELECT media.stored_file_name
             FROM vehicle_issue_media media
             INNER JOIN vehicle_issues issue
                ON issue.id = media.issue_id
             WHERE issue.user_id = $1

             UNION ALL

             SELECT ownership_stored_file_name
             FROM vehicles
             WHERE user_id = $1
               AND ownership_stored_file_name IS NOT NULL`,
            [req.session.userId]
        );

        await client.query("BEGIN");
        transactionStarted = true;

        const deleteResult = await client.query(
            `DELETE FROM users
             WHERE id = $1
             RETURNING id`,
            [req.session.userId]
        );

        if (deleteResult.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            shouldReleaseClient = false;
            client.release();
            return res.status(404).json({
                success: false,
                message: "User was not found."
            });
        }

        await client.query("COMMIT");
        transactionStarted = false;
        shouldReleaseClient = false;
        client.release();

        await destroyUserSession(req);
        res.clearCookie("carcare.sid");

        for (const row of fileResult.rows) {
            await removeStoredDocument(
                row.stored_file_name
            );
        }

        res.json({
            success: true,
            message:
                "Account deleted successfully."
        });
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        if (shouldReleaseClient) {
            client.release();
        }

        next(error);
    }
}

async function requestPasswordReset(
    req,
    res,
    next
) {
    try {
        const validation =
            validateForgotPasswordRequest(req.body);

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const { email } = validation.value;

        const result = await db.query(
            `SELECT id, full_name, email
             FROM users
             WHERE email = $1`,
            [email]
        );

        const user = result.rows[0] || null;
        let debugCode = undefined;
        let responseMessage =
            "If that email exists, a verification code has been sent.";
        const allowResetCodeFallback =
            process.env
                .ALLOW_PASSWORD_RESET_CODE_FALLBACK ===
            "true";
        let deliveryFailed = false;

        if (user) {
            const resetCode =
                await createPasswordResetCode({
                    userId: user.id,
                    email: user.email
                });

            try {
                await sendPasswordResetCode({
                    to: user.email,
                    fullName: user.full_name,
                    code: resetCode.code,
                    expiresInMinutes:
                        resetCode.expiresInMinutes
                });
            } catch (deliveryError) {
                console.error(
                    "Password reset mail delivery failed:",
                    deliveryError.message
                );
                deliveryFailed = true;

                if (
                    shouldExposePasswordResetCode({
                        nodeEnv:
                            process.env.NODE_ENV,
                        fallbackEnabled:
                            allowResetCodeFallback,
                        deliveryFailed
                    })
                ) {
                    debugCode =
                        resetCode.code;
                    responseMessage =
                        "Email delivery is temporarily unavailable. Use the verification code shown below to reset your password.";
                }
            }

            if (
                shouldExposePasswordResetCode({
                    nodeEnv:
                        process.env.NODE_ENV,
                    fallbackEnabled:
                        allowResetCodeFallback,
                    deliveryFailed
                }) &&
                !debugCode
            ) {
                debugCode = resetCode.code;
            }
        }

        res.json({
            success: true,
            message: responseMessage,
            ...(debugCode
                ? {
                    debugCode
                }
                : {})
        });
    } catch (error) {
        next(error);
    }
}

async function resetPassword(
    req,
    res,
    next
) {
    try {
        const validation =
            validatePasswordReset(req.body);

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const passwordResetData =
            validation.value;

        const consumedCode =
            await consumePasswordResetCode({
                email: passwordResetData.email,
                code: passwordResetData.code
            });

        if (!consumedCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Verification code is invalid or expired."
            });
        }

        const passwordHash =
            await bcrypt.hash(
                passwordResetData.newPassword,
                12
            );

        await db.query(
            `UPDATE users
             SET password_hash = $1
             WHERE id = $2`,
            [
                passwordHash,
                consumedCode.user_id
            ]
        );

        res.json({
            success: true,
            message:
                "Password has been reset successfully."
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile,
    updatePassword,
    updateReminderSettings,
    deleteAccount,
    requestPasswordReset,
    resetPassword
};
