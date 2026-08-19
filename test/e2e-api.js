const fs = require("fs");

const baseUrl =
    process.env.BASE_URL ||
    "http://localhost:3000";

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

class SessionClient {
    constructor() {
        this.cookies = new Map();
    }

    clone() {
        const cloned = new SessionClient();
        cloned.cookies = new Map(
            this.cookies
        );
        return cloned;
    }

    getCookie(name) {
        return this.cookies.get(name) || "";
    }

    async request(path, options = {}) {
        const cookieHeader =
            Array.from(
                this.cookies.entries()
            )
                .map(
                    ([name, value]) =>
                        `${name}=${value}`
                )
                .join("; ");
        const response = await fetch(
            `${baseUrl}${path}`,
            {
                ...options,
                headers: {
                    "Content-Type":
                        "application/json",
                    ...(cookieHeader
                        ? {
                            Cookie: cookieHeader
                        }
                        : {}),
                    ...(options.headers || {})
                }
            }
        );

        const setCookies =
            typeof response.headers
                .getSetCookie === "function"
                ? response.headers.getSetCookie()
                : [];

        for (const cookieValue of setCookies) {
            const [cookiePair] =
                cookieValue.split(";");

            if (!cookiePair) {
                continue;
            }

            const separatorIndex =
                cookiePair.indexOf("=");

            if (separatorIndex === -1) {
                continue;
            }

            const name = cookiePair.slice(
                0,
                separatorIndex
            );
            const value = cookiePair.slice(
                separatorIndex + 1
            );

            if (!name.startsWith("carcare.")) {
                continue;
            }

            if (value) {
                this.cookies.set(name, value);
            } else {
                this.cookies.delete(name);
            }
        }

        const text = await response.text();
        let data = null;

        try {
            data = text ? JSON.parse(text) : null;
        } catch (error) {
            data = {
                raw: text
            };
        }

        return {
            status: response.status,
            ok: response.ok,
            data
        };
    }
}

async function main() {
    const client = new SessionClient();
    const email =
        `codex-e2e-${Date.now()}@example.com`;
    const initialPassword = "StrongPass1!";
    const changedPassword = "ChangedPass3#";
    const resetPasswordValue = "ResetPass2@";
    const samplePdfBase64 = Buffer.from(
        "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF",
        "utf8"
    ).toString("base64");

    const health = await client.request(
        "/api/health"
    );

    assert(
        health.status === 200,
        `Health failed: ${JSON.stringify(health.data)}`
    );

    const docsPage = await client.request(
        "/api/docs"
    );

    assert(
        docsPage.status === 200,
        "Swagger docs redirect failed."
    );

    const swaggerPage =
        await client.request(
            "/swagger.html"
        );

    assert(
        swaggerPage.status === 200 &&
            typeof swaggerPage.data.raw ===
                "string" &&
            swaggerPage.data.raw.includes(
                "SwaggerUIBundle"
            ),
        "Swagger HTML did not load."
    );

    const openApi = await client.request(
        "/openapi.json"
    );

    assert(
        openApi.status === 200 &&
            openApi.data?.openapi === "3.0.3",
        "OpenAPI document failed."
    );

    const unauthorizedMe =
        await client.request(
            "/api/auth/me"
        );

    assert(
        unauthorizedMe.status === 401,
        "Unauthenticated /me should be rejected."
    );

    const register = await client.request(
        "/api/auth/register",
        {
            method: "POST",
            body: JSON.stringify({
                fullName: "Codex E2E",
                email,
                password: initialPassword
            })
        }
    );

    assert(
        register.status === 201,
        `Register failed: ${JSON.stringify(register.data)}`
    );

    const me = await client.request(
        "/api/auth/me"
    );

    assert(
        me.status === 200,
        `Auth session failed: ${JSON.stringify(me.data)}`
    );

    assert(
        me.data.user.email === email,
        "Current user email mismatch."
    );

    const updateProfile =
        await client.request(
            "/api/auth/profile",
            {
                method: "PATCH",
                body: JSON.stringify({
                    fullName:
                        "Codex E2E Updated",
                    preferredName: "Codex",
                    email
                })
            }
        );

    assert(
        updateProfile.status === 200,
        `Profile update failed: ${JSON.stringify(updateProfile.data)}`
    );

    const reminderSettings =
        await client.request(
            "/api/auth/reminder-settings",
            {
                method: "PATCH",
                body: JSON.stringify({
                    remindersEnabled: false
                })
            }
        );

    assert(
        reminderSettings.status === 200,
        `Reminder settings failed: ${JSON.stringify(reminderSettings.data)}`
    );

    const emptyVehicles =
        await client.request("/api/vehicles");

    assert(
        emptyVehicles.status === 200 &&
            Array.isArray(
                emptyVehicles.data.vehicles
            ) &&
            emptyVehicles.data.vehicles
                .length === 0,
        "Vehicles should start empty."
    );

    const refreshTokenBeforeRotation =
        client.getCookie("carcare.rt");
    const staleRefreshClient =
        client.clone();

    const refresh = await client.request(
        "/api/auth/refresh",
        {
            method: "POST"
        }
    );

    assert(
        refresh.status === 200,
        `Refresh failed: ${JSON.stringify(refresh.data)}`
    );

    const refreshTokenAfterRotation =
        client.getCookie("carcare.rt");

    assert(
        refreshTokenBeforeRotation &&
            refreshTokenAfterRotation &&
            refreshTokenBeforeRotation !==
                refreshTokenAfterRotation,
        "Refresh token rotation failed."
    );

    const staleRefreshAttempt =
        await staleRefreshClient.request(
            "/api/auth/refresh",
            {
                method: "POST"
            }
        );

    assert(
        staleRefreshAttempt.status === 401,
        `Stale refresh token was accepted: ${JSON.stringify(staleRefreshAttempt.data)}`
    );

    const createVehicle =
        await client.request(
            "/api/vehicles",
            {
                method: "POST",
                body: JSON.stringify({
                    brand: "BMW",
                    model: "420 Competition",
                    modelYear: 2026,
                    nickname: "Beast",
                    licensePlate: "06BMV06",
                    currentMileage: 6000
                })
            }
        );

    assert(
        createVehicle.status === 201,
        `Vehicle create failed: ${JSON.stringify(createVehicle.data)}`
    );

    const vehicleId =
        createVehicle.data.vehicle.id;

    const vehiclesList =
        await client.request("/api/vehicles");

    assert(
        vehiclesList.status === 200 &&
            vehiclesList.data.vehicles.length ===
                1,
        "Vehicle list did not return created vehicle."
    );

    const vehicleDetail =
        await client.request(
            `/api/vehicles/${vehicleId}`
        );

    assert(
        vehicleDetail.status === 200 &&
            vehicleDetail.data.vehicle.id ===
                vehicleId,
        "Vehicle detail failed."
    );

    const patchVehicle =
        await client.request(
            `/api/vehicles/${vehicleId}`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    nickname: "Track Beast"
                })
            }
        );

    assert(
        patchVehicle.status === 200,
        `Vehicle patch failed: ${JSON.stringify(patchVehicle.data)}`
    );

    const badMileage =
        await client.request(
            `/api/vehicles/${vehicleId}/mileage`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    newMileage: 5000
                })
            }
        );

    assert(
        badMileage.status === 400,
        "Vehicle mileage validation failed."
    );

    const goodMileage =
        await client.request(
            `/api/vehicles/${vehicleId}/mileage`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    newMileage: 6500
                })
            }
        );

    assert(
        goodMileage.status === 200,
        `Vehicle mileage update failed: ${JSON.stringify(goodMileage.data)}`
    );

    const mileageHistory =
        await client.request(
            `/api/vehicles/${vehicleId}/mileage-history`
        );

    assert(
        mileageHistory.status === 200 &&
            Array.isArray(
                mileageHistory.data.mileageHistory
            ) &&
            mileageHistory.data
                .mileageHistory.length >= 1,
        "Mileage history failed."
    );

    const shareLink =
        await client.request(
            `/api/vehicles/${vehicleId}/share-link`
        );

    assert(
        shareLink.status === 200 &&
            typeof shareLink.data.token ===
                "string",
        "Vehicle share link failed."
    );

    const sharedProfile =
        await client.request(
            `/api/public/vehicle-share/${shareLink.data.token}`
        );

    assert(
        sharedProfile.status === 200 &&
            sharedProfile.data.profile
                .vehicle.id === vehicleId,
        "Shared vehicle profile failed."
    );

    const handoffPackage =
        await client.request(
            `/api/vehicles/${vehicleId}/handoff-package`
        );

    assert(
        handoffPackage.status === 200 &&
            handoffPackage.data.package,
        "Buyer handoff package failed."
    );

    const maintenance =
        await client.request(
            "/api/maintenance-plans",
            {
                method: "POST",
                body: JSON.stringify({
                    vehicleId,
                    name: "Oil change",
                    category: "engine",
                    intervalKm: 10000,
                    intervalMonths: 12,
                    lastServiceKm: 6000,
                    lastServiceDate: "2026-07-01",
                    estimatedCost: 3500,
                    isCritical: true
                })
            }
        );

    assert(
        maintenance.status === 201,
        `Maintenance create failed: ${JSON.stringify(maintenance.data)}`
    );

    const maintenancePlanId =
        maintenance.data.maintenancePlan.id;

    const maintenanceList =
        await client.request(
            `/api/maintenance-plans?vehicleId=${vehicleId}`
        );

    assert(
        maintenanceList.status === 200 &&
            maintenanceList.data
                .maintenancePlans.length === 1,
        "Maintenance list failed."
    );

    const completeMaintenance =
        await client.request(
            `/api/service-history/complete/${maintenancePlanId}`,
            {
                method: "POST",
                body: JSON.stringify({
                    completedAt: "2026-08-01",
                    completedAtMileage: 6400,
                    actualCost: 3300,
                    serviceProvider: "BMW Service",
                    notes: "Changed oil and filter"
                })
            }
        );

    assert(
        completeMaintenance.status === 201,
        `Maintenance completion failed: ${JSON.stringify(completeMaintenance.data)}`
    );

    const serviceHistory =
        await client.request(
            `/api/service-history?vehicleId=${vehicleId}`
        );

    assert(
        serviceHistory.status === 200 &&
            serviceHistory.data
                .serviceHistory.length >= 1,
        "Service history failed."
    );

    const createIssue =
        await client.request(
            "/api/issues",
            {
                method: "POST",
                body: JSON.stringify({
                    vehicleId,
                    issueTitle: "Brake vibration",
                    category: "brakes",
                    description:
                        "Brake pedal vibrates at high speed.",
                    occursWhen:
                        "During heavy braking",
                    severity: "moderate",
                    warningLight: "yellow",
                    canDriveNormally: true,
                    isWorsening: true
                })
            }
        );

    assert(
        createIssue.status === 201,
        `Issue create failed: ${JSON.stringify(createIssue.data)}`
    );

    const issueId =
        createIssue.data.issue.id;

    const issuesList =
        await client.request("/api/issues");

    assert(
        issuesList.status === 200 &&
            issuesList.data.issues.length === 1,
        "Issues list failed."
    );

    const issueDetail =
        await client.request(
            `/api/issues/${issueId}`
        );

    assert(
        issueDetail.status === 200 &&
            issueDetail.data.issue.id === issueId,
        "Issue detail failed."
    );

    const addDiagnosis =
        await client.request(
            `/api/issues/${issueId}/diagnosis`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    mechanicDiagnosis:
                        "Front discs are warped."
                })
            }
        );

    assert(
        addDiagnosis.status === 200,
        `Diagnosis failed: ${JSON.stringify(addDiagnosis.data)}`
    );

    const repairIssue =
        await client.request(
            `/api/issues/${issueId}/repair`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    completedAt: "2026-08-02",
                    completedAtMileage: 6500,
                    actualCost: 7200,
                    serviceProvider: "Brake Master",
                    resolutionNotes:
                        "Replaced front discs and pads."
                })
            }
        );

    assert(
        repairIssue.status === 201,
        `Repair failed: ${JSON.stringify(repairIssue.data)}`
    );

    const createDocument =
        await client.request(
            "/api/documents",
            {
                method: "POST",
                body: JSON.stringify({
                    vehicleId,
                    documentType: "insurance",
                    title: "Traffic insurance",
                    provider: "Acme Sigorta",
                    documentNumber: "TR-2026-1",
                    startDate: "2026-08-01",
                    expiryDate: "2027-08-01",
                    reminderDays: 30,
                    notes: "Annual renewal test",
                    file: {
                        name: "insurance.pdf",
                        type: "application/pdf",
                        contentBase64:
                            samplePdfBase64
                    }
                })
            }
        );

    assert(
        createDocument.status === 201,
        `Document create failed: ${JSON.stringify(createDocument.data)}`
    );

    const documentId =
        createDocument.data.document.id;

    const documentsList =
        await client.request(
            `/api/documents?vehicleId=${vehicleId}`
        );

    assert(
        documentsList.status === 200 &&
            documentsList.data.documents.length ===
                1,
        "Document list failed."
    );

    const documentDetail =
        await client.request(
            `/api/documents/${documentId}`
        );

    assert(
        documentDetail.status === 200 &&
            documentDetail.data.document.id ===
                documentId,
        "Document detail failed."
    );

    const downloadDocument =
        await client.request(
            `/api/documents/${documentId}/file`
        );

    assert(
        downloadDocument.status === 200,
        "Document download failed."
    );

    const updateDocument =
        await client.request(
            `/api/documents/${documentId}`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    title:
                        "Traffic insurance renewed",
                    removeFile: true
                })
            }
        );

    assert(
        updateDocument.status === 200,
        `Document update failed: ${JSON.stringify(updateDocument.data)}`
    );

    const downloadMissingFile =
        await client.request(
            `/api/documents/${documentId}/file`
        );

    assert(
        downloadMissingFile.status === 404,
        "Document file removal guard failed."
    );

    const extractWithoutFile =
        await client.request(
            "/api/documents/extract-details",
            {
                method: "POST",
                body: JSON.stringify({
                    documentType: "insurance"
                })
            }
        );

    assert(
        extractWithoutFile.status === 400,
        "Document extract should require file."
    );

    const fuelEntry =
        await client.request(
            "/api/costs/fuel",
            {
                method: "POST",
                body: JSON.stringify({
                    vehicleId,
                    filledAt: "2026-08-10",
                    odometerKm: 6600,
                    liters: 42.5,
                    totalCost: 2450,
                    isFullTank: true,
                    station: "Shell",
                    notes: "E2E fuel entry"
                })
            }
        );

    assert(
        fuelEntry.status === 201,
        `Fuel create failed: ${JSON.stringify(fuelEntry.data)}`
    );

    const fuelList =
        await client.request(
            `/api/costs/fuel?vehicleId=${vehicleId}`
        );

    assert(
        fuelList.status === 200 &&
            fuelList.data.fuelEntries.length ===
                1,
        "Fuel list failed."
    );

    const expense =
        await client.request(
            "/api/costs/expenses",
            {
                method: "POST",
                body: JSON.stringify({
                    vehicleId,
                    expenseType: "parking",
                    title: "Mall parking",
                    amount: 120,
                    expenseDate: "2026-08-10",
                    odometerKm: 6600,
                    provider: "Zorlu",
                    notes: "E2E expense"
                })
            }
        );

    assert(
        expense.status === 201,
        `Expense create failed: ${JSON.stringify(expense.data)}`
    );

    const expenseList =
        await client.request(
            `/api/costs/expenses?vehicleId=${vehicleId}`
        );

    assert(
        expenseList.status === 200 &&
            expenseList.data.expenses.length ===
                1,
        "Expense list failed."
    );

    const summary =
        await client.request(
            "/api/costs/summary"
        );

    assert(
        summary.status === 200,
        `Summary failed: ${JSON.stringify(summary.data)}`
    );

    assert(
        Number(
            summary.data.summary
                .totalOwnershipCost
        ) > 0,
        "Ownership summary did not accumulate."
    );

    const aiChat = await client.request(
        "/api/ai/chat",
        {
            method: "POST",
            body: JSON.stringify({
                message:
                    "What should I prioritize for this car?"
            })
        }
    );

    assert(
        aiChat.status === 200 &&
            typeof aiChat.data.reply ===
                "string" &&
            aiChat.data.conversation?.id,
        `AI chat failed: ${JSON.stringify(aiChat.data)}`
    );

    const aiHistory =
        await client.request(
            "/api/ai/history"
        );

    assert(
        aiHistory.status === 200 &&
            aiHistory.data.conversations.length >=
                1,
        "AI history failed."
    );

    const aiFeedback =
        await client.request(
            `/api/ai/conversations/${aiChat.data.conversation.id}/feedback`,
            {
                method: "POST",
                body: JSON.stringify({
                    feedbackStatus: "helpful",
                    feedbackNote:
                        "Regression test feedback."
                })
            }
        );

    assert(
        aiFeedback.status === 200,
        `AI feedback failed: ${JSON.stringify(aiFeedback.data)}`
    );

    const aiDataset =
        await client.request(
            "/api/ai/dataset?feedbackStatus=helpful"
        );

    assert(
        aiDataset.status === 200 &&
            (
                (
                    typeof aiDataset.data.raw ===
                        "string" &&
                    aiDataset.data.raw.includes(
                        '"feedbackStatus":"helpful"'
                    )
                ) ||
                aiDataset.data?.metadata
                    ?.feedbackStatus ===
                    "helpful"
            ),
        "AI dataset export failed."
    );

    const deleteFuel =
        await client.request(
            `/api/costs/fuel/${fuelEntry.data.fuelEntry.id}`,
            {
                method: "DELETE"
            }
        );

    assert(
        deleteFuel.status === 200,
        `Fuel delete failed: ${JSON.stringify(deleteFuel.data)}`
    );

    const deleteExpense =
        await client.request(
            `/api/costs/expenses/${expense.data.expense.id}`,
            {
                method: "DELETE"
            }
        );

    assert(
        deleteExpense.status === 200,
        `Expense delete failed: ${JSON.stringify(deleteExpense.data)}`
    );

    const deleteDocument =
        await client.request(
            `/api/documents/${documentId}`,
            {
                method: "DELETE"
            }
        );

    assert(
        deleteDocument.status === 200,
        `Document delete failed: ${JSON.stringify(deleteDocument.data)}`
    );

    const sellVehicle =
        await client.request(
            `/api/vehicles/${vehicleId}/sell`,
            {
                method: "PATCH"
            }
        );

    assert(
        sellVehicle.status === 200,
        `Vehicle sell failed: ${JSON.stringify(sellVehicle.data)}`
    );

    const activeVehiclesAfterSell =
        await client.request("/api/vehicles");

    assert(
        activeVehiclesAfterSell.status ===
            200 &&
            activeVehiclesAfterSell.data
                .vehicles.length === 0,
        "Sold vehicle should leave active list."
    );

    const archiveVehicles =
        await client.request(
            "/api/vehicles/archive"
        );

    assert(
        archiveVehicles.status === 200 &&
            archiveVehicles.data.vehicles.length ===
                1,
        "Vehicle archive failed."
    );

    const deleteVehicle =
        await client.request(
            `/api/vehicles/${vehicleId}`,
            {
                method: "DELETE"
            }
        );

    assert(
        deleteVehicle.status === 200,
        `Vehicle delete failed: ${JSON.stringify(deleteVehicle.data)}`
    );

    const staleAccessBeforePasswordChange =
        client.clone();

    const updatePassword =
        await client.request(
            "/api/auth/password",
            {
                method: "PATCH",
                body: JSON.stringify({
                    currentPassword:
                        initialPassword,
                    newPassword:
                        changedPassword
                })
            }
        );

    assert(
        updatePassword.status === 200,
        `Password change failed: ${JSON.stringify(updatePassword.data)}`
    );

    const meAfterPasswordChange =
        await client.request(
            "/api/auth/me"
        );

    assert(
        meAfterPasswordChange.status === 401,
        `Current session survived password change: ${JSON.stringify(meAfterPasswordChange.data)}`
    );

    const staleAccessAfterPasswordChange =
        await staleAccessBeforePasswordChange.request(
            "/api/auth/me"
        );

    assert(
        staleAccessAfterPasswordChange.status ===
            401,
        `Old access token survived password change: ${JSON.stringify(staleAccessAfterPasswordChange.data)}`
    );

    const staleRefreshAfterPasswordChange =
        await staleAccessBeforePasswordChange.request(
            "/api/auth/refresh",
            {
                method: "POST"
            }
        );

    assert(
        staleRefreshAfterPasswordChange.status ===
            401,
        `Old refresh token survived password change: ${JSON.stringify(staleRefreshAfterPasswordChange.data)}`
    );

    const loginWithOldPassword =
        await client.request(
            "/api/auth/login",
            {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password: initialPassword
                })
            }
        );

    assert(
        loginWithOldPassword.status === 401,
        `Old password still worked after password change: ${JSON.stringify(loginWithOldPassword.data)}`
    );

    const loginWithChangedPassword =
        await client.request(
            "/api/auth/login",
            {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password: changedPassword
                })
            }
        );

    assert(
        loginWithChangedPassword.status ===
            200,
        `Login with changed password failed: ${JSON.stringify(loginWithChangedPassword.data)}`
    );

    const staleAccessBeforeReset =
        client.clone();

    const forgotPassword =
        await client.request(
            "/api/auth/forgot-password",
            {
                method: "POST",
                body: JSON.stringify({
                    email
                })
            }
        );

    assert(
        forgotPassword.status === 200,
        `Forgot password failed: ${JSON.stringify(forgotPassword.data)}`
    );

    assert(
        typeof forgotPassword.data.debugCode ===
            "string" &&
            forgotPassword.data.debugCode.length === 6,
        "Forgot password did not expose debug code in development."
    );

    const resetPassword =
        await client.request(
            "/api/auth/reset-password",
            {
                method: "POST",
                body: JSON.stringify({
                    email,
                    code: forgotPassword.data.debugCode,
                    newPassword:
                        resetPasswordValue
                })
            }
        );

    assert(
        resetPassword.status === 200,
        `Password reset failed: ${JSON.stringify(resetPassword.data)}`
    );

    const staleAccessAfterReset =
        await staleAccessBeforeReset.request(
            "/api/auth/me"
        );

    assert(
        staleAccessAfterReset.status === 401,
        `Old access token survived password reset: ${JSON.stringify(staleAccessAfterReset.data)}`
    );

    const staleRefreshAfterReset =
        await staleAccessBeforeReset.request(
            "/api/auth/refresh",
            {
                method: "POST"
            }
        );

    assert(
        staleRefreshAfterReset.status === 401,
        `Old refresh token survived password reset: ${JSON.stringify(staleRefreshAfterReset.data)}`
    );

    const loginAfterReset =
        await client.request(
            "/api/auth/login",
            {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password:
                        resetPasswordValue
                })
            }
        );

    assert(
        loginAfterReset.status === 200,
        `Login after password reset failed: ${JSON.stringify(loginAfterReset.data)}`
    );

    const logout = await client.request(
        "/api/auth/logout",
        {
            method: "POST"
        }
    );

    assert(
        logout.status === 200,
        `Logout failed: ${JSON.stringify(logout.data)}`
    );

    const refreshAfterLogout =
        await client.request(
            "/api/auth/refresh",
            {
                method: "POST"
            }
        );

    assert(
        refreshAfterLogout.status === 401,
        `Refresh still worked after logout: ${JSON.stringify(refreshAfterLogout.data)}`
    );

    const loginBeforeDelete =
        await client.request(
            "/api/auth/login",
            {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password:
                        resetPasswordValue
                })
            }
        );

    assert(
        loginBeforeDelete.status === 200,
        `Login before account deletion failed: ${JSON.stringify(loginBeforeDelete.data)}`
    );

    const staleAccessBeforeDelete =
        client.clone();

    const deleteAccount =
        await client.request(
            "/api/auth/account",
            {
                method: "DELETE",
                body: JSON.stringify({
                    currentPassword:
                        resetPasswordValue
                })
            }
        );

    assert(
        deleteAccount.status === 200,
        `Delete account failed: ${JSON.stringify(deleteAccount.data)}`
    );

    const staleAccessAfterDelete =
        await staleAccessBeforeDelete.request(
            "/api/auth/me"
        );

    assert(
        staleAccessAfterDelete.status === 401,
        `Old access token survived account deletion: ${JSON.stringify(staleAccessAfterDelete.data)}`
    );

    const meAfterDelete =
        await client.request(
            "/api/auth/me"
        );

    assert(
        meAfterDelete.status === 401,
        `Session was not cleared after account deletion: ${JSON.stringify(meAfterDelete.data)}`
    );

    const loginAfterDelete =
        await client.request(
            "/api/auth/login",
            {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password: resetPasswordValue
                })
            }
        );

    assert(
        loginAfterDelete.status === 401,
        `Deleted account could still log in: ${JSON.stringify(loginAfterDelete.data)}`
    );

    console.log(
        JSON.stringify(
            {
                success: true,
                testedUser: email
            },
            null,
            2
        )
    );
}

main().catch((error) => {
    console.error(error.stack || error);
    process.exit(1);
});
