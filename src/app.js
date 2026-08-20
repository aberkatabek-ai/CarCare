const express = require("express");
const path = require("path");
const helmet = require("helmet");

const db = require("./config/db");

const authRoutes = require(
    "./routes/authRoutes"
);

const vehicleRoutes = require(
    "./routes/vehicleRoutes"
);

const maintenanceRoutes = require(
    "./routes/maintenanceRoutes"
);

const serviceRoutes = require(
    "./routes/serviceRoutes"
);

const issueRoutes = require(
    "./routes/issueRoutes"
);

const documentRoutes = require(
    "./routes/documentRoutes"
);

const costRoutes = require(
    "./routes/costRoutes"
);
const aiRoutes = require(
    "./routes/aiRoutes"
);
const {
    getSharedVehicleProfile
} = require(
    "./controllers/vehicleController"
);

const {
    notFound,
    errorHandler
} = require(
    "./middleware/errorMiddleware"
);
const {
    createRateLimiter
} = require(
    "./middleware/rateLimitMiddleware"
);

const app = express();
const publicDirectory = path.join(
    __dirname,
    "..",
    "public"
);
const staticPagePaths = new Set([
    "/",
    "/buyer-package",
    "/costs",
    "/documents",
    "/forgot-password",
    "/health",
    "/login",
    "/maintenance",
    "/register",
    "/service-history",
    "/settings",
    "/share",
    "/swagger",
    "/vehicle"
]);
const generalApiLimiter = createRateLimiter({
    keyPrefix: "api-general",
    windowMs: 60 * 1000,
    maxRequests: 240,
    message:
        "Too many requests. Please slow down and try again shortly."
});

if (
    process.env.NODE_ENV ===
    "production"
) {
    app.set("trust proxy", 1);
}

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

app.use(
    express.json({
        limit: "6mb"
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: "6mb"
    })
);

app.use("/api", generalApiLimiter);

app.use((req, res, next) => {
    if (
        req.method !== "GET" &&
        req.method !== "HEAD"
    ) {
        next();
        return;
    }

    if (!req.path.endsWith(".html")) {
        next();
        return;
    }

    const normalizedPath =
        req.path === "/index.html"
            ? "/"
            : req.path.slice(0, -5);

    if (!staticPagePaths.has(normalizedPath)) {
        next();
        return;
    }

    const queryIndex =
        req.originalUrl.indexOf("?");
    const query =
        queryIndex >= 0
            ? req.originalUrl.slice(queryIndex)
            : "";

    res.redirect(
        301,
        `${normalizedPath}${query}`
    );
});

app.use(
    express.static(
        publicDirectory,
        {
            extensions: ["html"]
        }
    )
);

app.get("/api/docs", (req, res) => {
    res.redirect("/swagger");
});

app.get(
    "/api/health",
    async (req, res, next) => {
        try {
            const result =
                await db.query(
                    `SELECT
                        NOW()
                        AS database_time`
                );

            res.json({
                success: true,

                message:
                    "CarCare backend is connected to Neon.",

                databaseTime:
                    result.rows[0]
                        .database_time
            });
        } catch (error) {
            next(error);
        }
    }
);

app.get(
    "/api/public/vehicle-share/:token",
    getSharedVehicleProfile
);

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/vehicles",
    vehicleRoutes
);

app.use(
    "/api/maintenance-plans",
    maintenanceRoutes
);

app.use(
    "/api/service-history",
    serviceRoutes
);

app.use(
    "/api/issues",
    issueRoutes
);

app.use(
    "/api/documents",
    documentRoutes
);

app.use(
    "/api/costs",
    costRoutes
);

app.use(
    "/api/ai",
    aiRoutes
);

app.use(notFound);

app.use(errorHandler);

module.exports = app;
