const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const watchRoots = [
    path.join(projectRoot, "public"),
    path.join(projectRoot, "src"),
    path.join(projectRoot, "server.js"),
    path.join(projectRoot, ".env")
];

let server = null;
let reloading = false;
let reloadTimer = null;

function clearProjectCache() {
    Object.keys(require.cache).forEach((cacheKey) => {
        if (
            cacheKey.startsWith(projectRoot) &&
            !cacheKey.includes(
                `${path.sep}node_modules${path.sep}`
            )
        ) {
            delete require.cache[cacheKey];
        }
    });
}

function loadEnv() {
    const dotenvPath = path.join(projectRoot, ".env");

    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.SHARE_TOKEN_SECRET;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    delete process.env.EMAIL_PROVIDER;
    delete process.env.EMAIL_FROM;
    delete process.env.GMAIL_API_CLIENT_ID;
    delete process.env.GMAIL_API_CLIENT_SECRET;
    delete process.env.GMAIL_API_REFRESH_TOKEN;
    delete process.env.GMAIL_API_SENDER_EMAIL;
    delete process.env.RESEND_API_KEY;

    require("dotenv").config({
        path: dotenvPath,
        override: true
    });
}

async function startServer() {
    loadEnv();

    if (!process.env.DATABASE_URL) {
        throw new Error(
            "DATABASE_URL was not loaded from .env"
        );
    }

    if (!process.env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET was not loaded from .env"
        );
    }

    if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error(
            "JWT_REFRESH_SECRET was not loaded from .env"
        );
    }

    if (
        !(
            (
                process.env.GMAIL_API_CLIENT_ID &&
                process.env.GMAIL_API_CLIENT_SECRET &&
                process.env.GMAIL_API_REFRESH_TOKEN &&
                (
                    process.env.GMAIL_API_SENDER_EMAIL ||
                    process.env.EMAIL_FROM
                )
            ) ||
            process.env.RESEND_API_KEY ||
            (
                process.env.SMTP_HOST &&
                process.env.SMTP_PORT &&
                process.env.SMTP_USER &&
                process.env.SMTP_PASS
            )
        )
    ) {
        console.warn(
            "[mail] No email provider is configured. Add Gmail API, RESEND_API_KEY, or SMTP_* variables if forgot-password emails should reach real inboxes."
        );
    }

    const app = require("../src/app");
    const {
        ensureAuthTables
    } = require("../src/services/authSessionService");
    const port = process.env.PORT || 3000;

    await ensureAuthTables();

    return new Promise((resolve, reject) => {
        const instance = app.listen(
            port,
            () => {
                console.log(
                    `[dev] CarCare server is running at http://localhost:${port}`
                );
                resolve(instance);
            }
        );

        instance.on("error", reject);
    });
}

async function stopServer() {
    if (!server) {
        return;
    }

    const instance = server;
    server = null;

    if (!instance.listening) {
        return;
    }

    await new Promise((resolve, reject) => {
        instance.close((error) => {
            if (
                error &&
                error.code !==
                    "ERR_SERVER_NOT_RUNNING"
            ) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

async function reloadServer(reason) {
    if (reloading) {
        return;
    }

    reloading = true;
    console.log(`[dev] Reloading (${reason})`);

    try {
        await stopServer();

        clearProjectCache();
        server = await startServer();
    } catch (error) {
        console.error(
            "[dev] Reload failed:",
            error.stack || error.message
        );
    } finally {
        reloading = false;
    }
}

function scheduleReload(reason) {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
        reloadServer(reason);
    }, 150);
}

function watchTarget(targetPath) {
    const targetName = path.relative(
        projectRoot,
        targetPath
    ) || path.basename(targetPath);

    try {
        fs.watch(
            targetPath,
            {
                recursive: true
            },
            (_eventType, filename) => {
                const changedName =
                    filename || targetName;
                scheduleReload(changedName);
            }
        );
    } catch (error) {
        console.warn(
            `[dev] Watch setup skipped for ${targetName}: ${error.message}`
        );
    }
}

watchRoots.forEach((watchRoot) => {
    if (fs.existsSync(watchRoot)) {
        watchTarget(watchRoot);
    }
});

reloadServer("initial start");

process.on("SIGINT", async () => {
    await stopServer();

    process.exit(0);
});
