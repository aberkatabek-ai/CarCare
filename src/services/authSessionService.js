const db = require("../config/db");
const {
    hashToken
} = require("../utils/authTokens");

async function ensureAuthTables() {
    await db.query(
        `ALTER TABLE users
         ADD COLUMN IF NOT EXISTS auth_token_version
         INTEGER NOT NULL DEFAULT 0`
    );

    await db.query(
        `CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
            id BIGSERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_id UUID NOT NULL UNIQUE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            revoked_at TIMESTAMPTZ,
            last_used_at TIMESTAMPTZ,
            user_agent TEXT,
            ip_address TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`
    );

    await db.query(
        `CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_user_active
         ON auth_refresh_tokens(user_id, expires_at DESC)
         WHERE revoked_at IS NULL`
    );
}

function normalizeOptionalText(value) {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 1000) : null;
}

function getRequestMetadata(req) {
    const forwardedFor =
        req.headers["x-forwarded-for"];
    const ipAddress =
        typeof forwardedFor === "string"
            ? forwardedFor
                .split(",")[0]
                .trim()
            : req.ip || null;

    return {
        userAgent: normalizeOptionalText(
            req.headers["user-agent"]
        ),
        ipAddress: normalizeOptionalText(
            ipAddress
        )
    };
}

async function storeRefreshToken({
    userId,
    tokenId,
    token,
    expiresAt,
    userAgent,
    ipAddress
}) {
    await db.query(
        `INSERT INTO auth_refresh_tokens (
            user_id,
            token_id,
            token_hash,
            expires_at,
            user_agent,
            ip_address
        )
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
            userId,
            tokenId,
            hashToken(token),
            expiresAt,
            userAgent,
            ipAddress
        ]
    );
}

async function consumeRefreshToken({
    token
}) {
    const tokenHash = hashToken(token);
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `UPDATE auth_refresh_tokens
             SET revoked_at = NOW(),
                 last_used_at = NOW()
             WHERE token_hash = $1
               AND revoked_at IS NULL
               AND expires_at > NOW()
             RETURNING user_id, token_id`,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");
            return null;
        }

        await client.query("COMMIT");
        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function revokeRefreshToken(token) {
    await db.query(
        `UPDATE auth_refresh_tokens
         SET revoked_at = NOW()
         WHERE token_hash = $1
           AND revoked_at IS NULL`,
        [hashToken(token)]
    );
}

async function revokeRefreshTokensForUser(
    userId
) {
    await db.query(
        `UPDATE auth_refresh_tokens
         SET revoked_at = NOW()
         WHERE user_id = $1
           AND revoked_at IS NULL`,
        [userId]
    );
}

async function getUserAuthState(userId) {
    const result = await db.query(
        `SELECT id, auth_token_version
         FROM users
         WHERE id = $1`,
        [userId]
    );

    return result.rows[0] || null;
}

async function bumpUserAuthTokenVersion(
    userId
) {
    const result = await db.query(
        `UPDATE users
         SET auth_token_version =
             auth_token_version + 1
         WHERE id = $1
         RETURNING auth_token_version`,
        [userId]
    );

    return result.rows[0] || null;
}

module.exports = {
    ensureAuthTables,
    getRequestMetadata,
    storeRefreshToken,
    consumeRefreshToken,
    revokeRefreshToken,
    revokeRefreshTokensForUser,
    getUserAuthState,
    bumpUserAuthTokenVersion
};
