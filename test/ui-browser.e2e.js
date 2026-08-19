const path = require("path");
const assert = require("node:assert/strict");
const {
    chromium
} = require("playwright-core");

const baseUrl =
    process.env.BASE_URL ||
    "http://localhost:3000";
const browserCandidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
];

function getBrowserExecutablePath() {
    const configuredPath =
        process.env.CHROME_PATH;

    if (configuredPath) {
        return configuredPath;
    }

    const foundPath =
        browserCandidates.find((candidate) =>
            require("fs").existsSync(candidate)
        );

    if (!foundPath) {
        throw new Error(
            "No Chrome or Edge executable was found for UI regression testing."
        );
    }

    return foundPath;
}

async function expectTitle(page, title) {
    await page.waitForFunction(
        (expectedTitle) =>
            document.title === expectedTitle,
        title
    );
}

async function main() {
    const browser = await chromium.launch({
        executablePath:
            getBrowserExecutablePath(),
        headless: true
    });

    const context = await browser.newContext({
        locale: "en-US",
        viewport: {
            width: 1440,
            height: 960
        }
    });
    const page = await context.newPage();
    const email =
        `ui-regression-${Date.now()}@example.com`;
    const password = "StrongPass1!";

    try {
        await page.goto(`${baseUrl}/register.html`, {
            waitUntil: "networkidle"
        });
        await expectTitle(
            page,
            "Register | CarCare"
        );

        await page.fill(
            "#full-name",
            "UI Regression User"
        );
        await page.fill("#email", email);
        await page.fill("#password", password);
        await page.fill(
            "#password-confirmation",
            password
        );
        await Promise.all([
            page.waitForURL(
                `${baseUrl}/index.html`
            ),
            page.click(
                '#register-form button[type="submit"]'
            )
        ]);

        await expectTitle(
            page,
            "Dashboard | CarCare"
        );
        await page.waitForSelector("#user-email");
        await page.waitForFunction(
            (expectedEmail) =>
                document
                    .querySelector("#user-email")
                    ?.textContent.includes(
                        expectedEmail
                    ),
            email
        );

        await page.fill("#brand", "BMW");
        await page.fill("#model", "320i");
        await page.fill("#model-year", "2026");
        await page.fill("#nickname", "Browser Car");
        await page.fill(
            "#license-plate",
            "34UI123"
        );
        await page.fill(
            "#current-mileage",
            "5000"
        );
        await page.click(
            '#vehicle-form button[type="submit"]'
        );
        await page.waitForFunction(() => {
            const vehicleCount =
                document.querySelector(
                    "#vehicle-count"
                )?.textContent || "";
            const statVehicleCount =
                document.querySelector(
                    "#stat-vehicle-count"
                )?.textContent || "";

            return (
                vehicleCount.includes("1") ||
                statVehicleCount.includes("1")
            );
        });

        await page.click(
            'a[href="/settings.html"]'
        );
        await page.waitForURL(
            `${baseUrl}/settings.html`
        );
        await expectTitle(
            page,
            "Settings | CarCare"
        );

        await page.fill(
            "#profile-preferred-name",
            "Browser"
        );
        await page.click(
            '#profile-form button[type="submit"]'
        );
        await page.waitForFunction(() =>
            document
                .querySelector("#profile-message")
                ?.textContent.includes(
                    "updated successfully"
                )
        );

        await page.check("#reminders-enabled");
        await page.click(
            '#reminder-settings-form button[type="submit"]'
        );
        await page.waitForFunction(() => {
            const message =
                document.querySelector(
                    "#reminder-settings-message"
                )?.textContent || "";

            return (
                message.includes(
                    "Email reminders"
                ) ||
                message.includes("paused")
            );
        });

        const localeChecks = [
            {
                value: "tr",
                title: "Ayarlar | CarCare",
                text: "Profil ve güvenlik ayarları"
            },
            {
                value: "ru",
                title: "Настройки | CarCare",
                text: "Настройки профиля и безопасности"
            },
            {
                value: "es",
                title: "Configuración | CarCare",
                text: "Configuración de perfil y seguridad"
            },
            {
                value: "en",
                title: "Settings | CarCare",
                text: "Profile and security settings"
            }
        ];

        for (const localeCheck of localeChecks) {
            await page.selectOption(
                "#locale-select",
                localeCheck.value
            );
            await page.waitForLoadState(
                "networkidle"
            );
            await page.waitForFunction(
                (expectedState) =>
                    document.title ===
                        expectedState.title &&
                    document.body.innerText.includes(
                        expectedState.text
                    ) &&
                    window.localStorage.getItem(
                        "carcare.locale"
                    ) === expectedState.value,
                localeCheck
            );
        }

        const pageChecks = [
            {
                href: "/index.html",
                title: "Dashboard | CarCare",
                text: "Vehicle overview"
            },
            {
                href: "/maintenance.html",
                title: "Maintenance | CarCare",
                text: "Maintenance plans"
            },
            {
                href: "/health.html",
                title: "Health Center | CarCare",
                text: "Vehicle issues"
            },
            {
                href: "/service-history.html",
                title: "Service History | CarCare",
                text: "Service history"
            },
            {
                href: "/documents.html",
                title: "Documents | CarCare",
                text: "Your documents"
            },
            {
                href: "/costs.html",
                title: "Cost Center | CarCare",
                text: "Fuel and expenses"
            }
        ];

        for (const pageCheck of pageChecks) {
            await page.click(
                `a[href="${pageCheck.href}"]`
            );
            await page.waitForURL(
                `${baseUrl}${pageCheck.href}`
            );
            await expectTitle(
                page,
                pageCheck.title
            );
            await page.waitForFunction(
                (expectedText) =>
                    document.body.innerText.includes(
                        expectedText
                    ),
                pageCheck.text
            );
        }

        await page.goto(`${baseUrl}/swagger.html`, {
            waitUntil: "domcontentloaded"
        });
        await expectTitle(
            page,
            "CarCare API Docs"
        );
        await page.waitForFunction(() =>
            document.body.innerText.includes(
                "Login first with /api/auth/login"
            )
        );

        await page.goto(`${baseUrl}/costs.html`, {
            waitUntil: "networkidle"
        });
        await page.click("#logout-button");
        await page.waitForURL(
            `${baseUrl}/login.html`
        );
        await expectTitle(
            page,
            "Login | CarCare"
        );

        await page.fill("#email", email);
        await page.fill("#password", password);
        await Promise.all([
            page.waitForURL(
                `${baseUrl}/index.html`
            ),
            page.click(
                '#login-form button[type="submit"]'
            )
        ]);
        await expectTitle(
            page,
            "Dashboard | CarCare"
        );

        console.log(
            JSON.stringify(
                {
                    success: true,
                    testedUser: email,
                    browser: path.basename(
                        getBrowserExecutablePath()
                    )
                },
                null,
                2
            )
        );
    } finally {
        await context.close();
        await browser.close();
    }
}

main().catch((error) => {
    console.error(error.stack || error);
    process.exit(1);
});
