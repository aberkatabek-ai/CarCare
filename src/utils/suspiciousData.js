function normalizeComparableText(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function isMileageJumpSuspicious({
    previousMileage,
    nextMileage,
    maxJump = 5000
}) {
    const previous = Number(previousMileage);
    const next = Number(nextMileage);

    if (
        !Number.isFinite(previous) ||
        !Number.isFinite(next)
    ) {
        return false;
    }

    return next > previous + maxJump;
}

module.exports = {
    normalizeComparableText,
    isMileageJumpSuspicious
};
