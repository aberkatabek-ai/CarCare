const express = require("express");
const path = require("path");
const helmet = require("helmet");
const session = require("express-session");

const connectPgSimple = require(
    "connect-pg-simple"
);

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
const generalApiLimiter = createRateLimiter({
    keyPrefix: "api-general",
    windowMs: 60 * 1000,
    maxRequests: 240,
    message:
        "Too many requests. Please slow down and try again shortly."
});

const PgSession =
    connectPgSimple(session);

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

app.use(
    session({
        store: new PgSession({
            pool: db,
            tableName: "user_sessions",
            createTableIfMissing: true
        }),

        name: "carcare.sid",

        secret:
            process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,

            secure:
                process.env.NODE_ENV ===
                "production",

            sameSite: "lax",

            maxAge:
                7 *
                24 *
                60 *
                60 *
                1000
        }
    })
);

app.use(
    express.static(
        path.join(
            __dirname,
            "..",
            "public"
        )
    )
);

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
