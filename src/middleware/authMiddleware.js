const {
    getAccessTokenFromRequest,
    verifyAccessToken
} = require("../utils/authTokens");
const {
    getUserAuthState
} = require("../services/authSessionService");

async function requireAuth(
    req,
    res,
    next
) {
    const token =
        getAccessTokenFromRequest(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "You must log in."
        });
    }

    try {
        const payload =
            verifyAccessToken(token);
        const userId = Number(payload.sub);

        if (!Number.isInteger(userId)) {
            throw new Error(
                "JWT subject is invalid."
            );
        }

        const authState =
            await getUserAuthState(userId);

        if (
            !authState ||
            Number(
                payload.authTokenVersion
            ) !==
                Number(
                    authState.auth_token_version
                )
        ) {
            throw new Error(
                "JWT auth version is invalid."
            );
        }

        req.auth = {
            userId,
            tokenType: payload.type,
            authTokenVersion:
                Number(
                    authState.auth_token_version
                )
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message:
                "Your session is invalid or has expired."
        });
    }
}

module.exports = {
    requireAuth
};
