function shouldExposePasswordResetCode({
    nodeEnv,
    fallbackEnabled,
    deliveryFailed
}) {
    if (nodeEnv !== "production") {
        return true;
    }

    return fallbackEnabled && deliveryFailed;
}

module.exports = {
    shouldExposePasswordResetCode
};
