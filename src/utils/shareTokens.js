const crypto = require("crypto");

function getShareSecret() {
    return (
        process.env.SHARE_TOKEN_SECRET ||
        process.env.JWT_SECRET ||
        "carcare-local-share-secret"
    );
}

function createSignature(payload) {
    return crypto
        .createHmac("sha256", getShareSecret())
        .update(payload)
        .digest("base64url");
}

function createVehicleShareToken(vehicleId) {
    const payload = `vehicle:${vehicleId}`;
    const signature = createSignature(payload);

    return Buffer.from(
        `${payload}:${signature}`,
        "utf8"
    ).toString("base64url");
}

function verifyVehicleShareToken(token) {
    if (
        typeof token !== "string" ||
        !token.trim()
    ) {
        return null;
    }

    let decoded;

    try {
        decoded = Buffer.from(
            token,
            "base64url"
        ).toString("utf8");
    } catch (error) {
        return null;
    }

    const parts = decoded.split(":");

    if (parts.length !== 3) {
        return null;
    }

    const [resourceType, vehicleIdText, signature] =
        parts;

    if (resourceType !== "vehicle") {
        return null;
    }

    const vehicleId = Number(vehicleIdText);

    if (
        !Number.isInteger(vehicleId) ||
        vehicleId <= 0
    ) {
        return null;
    }

    const expectedSignature =
        createSignature(
            `vehicle:${vehicleId}`
        );

    const signatureBuffer = Buffer.from(
        signature,
        "utf8"
    );
    const expectedBuffer = Buffer.from(
        expectedSignature,
        "utf8"
    );

    if (
        signatureBuffer.length !==
        expectedBuffer.length
    ) {
        return null;
    }

    if (
        !crypto.timingSafeEqual(
            signatureBuffer,
            expectedBuffer
        )
    ) {
        return null;
    }

    return {
        vehicleId
    };
}

module.exports = {
    createVehicleShareToken,
    verifyVehicleShareToken
};
