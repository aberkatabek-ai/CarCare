const {
    normalizeLicensePlate
} = require("./vehicleOwnership");

function normalizeSearchText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
}

function normalizeCompactText(value) {
    return normalizeSearchText(value).replace(
        /[^A-Z0-9]/g,
        ""
    );
}

function tokenizeName(value) {
    return normalizeSearchText(value)
        .replace(/[^A-Z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 2);
}

function calculateNameScore(
    accountName,
    ocrText
) {
    const tokens = tokenizeName(accountName);

    if (tokens.length === 0) {
        return {
            score: 0,
            matchedTokens: []
        };
    }

    const normalizedText =
        normalizeSearchText(ocrText);

    const matchedTokens = tokens.filter((token) =>
        normalizedText.includes(token)
    );

    return {
        score: Math.round(
            (matchedTokens.length / tokens.length) * 30
        ),
        matchedTokens
    };
}

function calculateQualityScore(ocrText) {
    const compactText =
        normalizeCompactText(ocrText);

    if (compactText.length >= 80) {
        return 10;
    }

    if (compactText.length >= 30) {
        return 5;
    }

    return 0;
}

function evaluateOwnershipVerification({
    accountName,
    licensePlate,
    ocrText
}) {
    const normalizedPlate =
        normalizeLicensePlate(licensePlate);

    const compactText =
        normalizeCompactText(ocrText);

    const plateMatch = Boolean(
        normalizedPlate.key &&
        compactText.includes(normalizedPlate.key)
    );

    const nameResult = calculateNameScore(
        accountName,
        ocrText
    );

    const qualityScore =
        calculateQualityScore(ocrText);

    const totalScore =
        (plateMatch ? 60 : 0) +
        nameResult.score +
        qualityScore;

    let status = "failed";
    let message =
        "The uploaded registration document could not be matched to this account.";

    if (
        plateMatch &&
        nameResult.matchedTokens.length >= 2 &&
        totalScore >= 85
    ) {
        status = "verified";
        message =
            "Ownership was verified from the uploaded registration document.";
    } else if (plateMatch && totalScore >= 60) {
        status = "needs_retry";
        message =
            "The plate was found, but the owner name could not be matched strongly enough. Upload a clearer registration image.";
    } else if (!plateMatch) {
        message =
            "The plate on the uploaded document did not match this vehicle.";
    }

    return {
        status,
        totalScore,
        plateMatch,
        matchedNameTokens:
            nameResult.matchedTokens,
        qualityScore,
        message
    };
}

module.exports = {
    evaluateOwnershipVerification
};
