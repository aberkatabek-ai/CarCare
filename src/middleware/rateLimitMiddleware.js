const rateLimitBuckets = new Map();

function getClientIp(req) {
    const forwardedFor = req.headers["x-forwarded-for"];

    if (
        typeof forwardedFor === "string" &&
        forwardedFor.trim()
    ) {
        return forwardedFor
            .split(",")[0]
            .trim();
    }

    return (
        req.ip ||
        req.connection?.remoteAddress ||
        "unknown"
    );
}

function cleanupBucket(bucketKey, windowMs) {
    const bucket = rateLimitBuckets.get(bucketKey);

    if (!bucket) {
        return;
    }

    const cutoff = Date.now() - windowMs;
    bucket.timestamps = bucket.timestamps.filter(
        (timestamp) => timestamp > cutoff
    );

    if (bucket.timestamps.length === 0) {
        rateLimitBuckets.delete(bucketKey);
    }
}

function createRateLimiter({
    keyPrefix,
    windowMs,
    maxRequests,
    message,
    keyGenerator
}) {
    return (req, res, next) => {
        const keySuffix = keyGenerator
            ? keyGenerator(req)
            : getClientIp(req);

        const bucketKey =
            `${keyPrefix}:${keySuffix}`;

        cleanupBucket(bucketKey, windowMs);

        const bucket =
            rateLimitBuckets.get(bucketKey) || {
                timestamps: []
            };

        const now = Date.now();
        const cutoff = now - windowMs;

        bucket.timestamps = bucket.timestamps.filter(
            (timestamp) => timestamp > cutoff
        );

        if (
            bucket.timestamps.length >= maxRequests
        ) {
            const oldestTimestamp =
                bucket.timestamps[0];

            const retryAfterSeconds = Math.max(
                1,
                Math.ceil(
                    (oldestTimestamp + windowMs - now) /
                    1000
                )
            );

            res.setHeader(
                "Retry-After",
                String(retryAfterSeconds)
            );

            return res.status(429).json({
                success: false,
                message
            });
        }

        bucket.timestamps.push(now);
        rateLimitBuckets.set(bucketKey, bucket);

        next();
    };
}

module.exports = {
    createRateLimiter
};
