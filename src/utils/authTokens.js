const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const ACCESS_COOKIE_NAME = "carcare.at";
const REFRESH_COOKIE_NAME = "carcare.rt";
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS =
    30 * 24 * 60 * 60 * 1000;
const TOKEN_ISSUER = "carcare";
const TOKEN_AUDIENCE = "carcare-app";

function getRequiredEnv(name) {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `${name} is required for JWT authentication.`
        );
    }

    return value;
}

function getCookieBaseOptions() {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure:
            process.env.NODE_ENV ===
            "production",
        path: "/"
    };
}

function createAccessToken(
    userId,
    authTokenVersion
) {
    return jwt.sign(
        {
            type: "access",
            authTokenVersion
        },
        getRequiredEnv("JWT_SECRET"),
        {
            subject: String(userId),
            expiresIn: Math.floor(
                ACCESS_TOKEN_TTL_MS / 1000
            ),
            issuer: TOKEN_ISSUER,
            audience: TOKEN_AUDIENCE
        }
    );
}

function createRefreshToken(
    userId,
    authTokenVersion
) {
    return jwt.sign(
        {
            type: "refresh",
            authTokenVersion
        },
        getRequiredEnv(
            "JWT_REFRESH_SECRET"
        ),
        {
            subject: String(userId),
            jwtid: crypto.randomUUID(),
            expiresIn: Math.floor(
                REFRESH_TOKEN_TTL_MS / 1000
            ),
            issuer: TOKEN_ISSUER,
            audience: TOKEN_AUDIENCE
        }
    );
}

function verifyAccessToken(token) {
    return jwt.verify(
        token,
        getRequiredEnv("JWT_SECRET"),
        {
            issuer: TOKEN_ISSUER,
            audience: TOKEN_AUDIENCE
        }
    );
}

function verifyRefreshToken(token) {
    return jwt.verify(
        token,
        getRequiredEnv(
            "JWT_REFRESH_SECRET"
        ),
        {
            issuer: TOKEN_ISSUER,
            audience: TOKEN_AUDIENCE
        }
    );
}

function parseCookies(req) {
    const cookieHeader =
        req.headers.cookie || "";

    return cookieHeader
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce((cookies, part) => {
            const separatorIndex =
                part.indexOf("=");

            if (separatorIndex === -1) {
                return cookies;
            }

            const name = part.slice(
                0,
                separatorIndex
            );
            const value = part.slice(
                separatorIndex + 1
            );

            cookies[name] = decodeURIComponent(
                value
            );

            return cookies;
        }, {});
}

function getBearerToken(req) {
    const authorization =
        req.headers.authorization;

    if (
        typeof authorization !== "string" ||
        !authorization.startsWith("Bearer ")
    ) {
        return "";
    }

    return authorization
        .slice("Bearer ".length)
        .trim();
}

function getAccessTokenFromRequest(req) {
    const cookies = parseCookies(req);

    return (
        cookies[ACCESS_COOKIE_NAME] ||
        getBearerToken(req)
    );
}

function getRefreshTokenFromRequest(req) {
    const cookies = parseCookies(req);

    return cookies[REFRESH_COOKIE_NAME] || "";
}

function setAuthCookies(
    res,
    { accessToken, refreshToken }
) {
    const baseOptions = getCookieBaseOptions();

    res.cookie(ACCESS_COOKIE_NAME, accessToken, {
        ...baseOptions,
        maxAge: ACCESS_TOKEN_TTL_MS
    });

    res.cookie(
        REFRESH_COOKIE_NAME,
        refreshToken,
        {
            ...baseOptions,
            maxAge: REFRESH_TOKEN_TTL_MS
        }
    );
}

function clearAuthCookies(res) {
    const baseOptions = getCookieBaseOptions();

    res.clearCookie(
        ACCESS_COOKIE_NAME,
        baseOptions
    );
    res.clearCookie(
        REFRESH_COOKIE_NAME,
        baseOptions
    );
}

function hashToken(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

function getTokenExpiryDate(payload) {
    return new Date(payload.exp * 1000);
}

module.exports = {
    ACCESS_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
    createAccessToken,
    createRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    getAccessTokenFromRequest,
    getRefreshTokenFromRequest,
    setAuthCookies,
    clearAuthCookies,
    hashToken,
    getTokenExpiryDate
};
