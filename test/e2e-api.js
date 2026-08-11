const fs = require("fs");

const baseUrl = "http://localhost:3000";

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

class SessionClient {
    constructor() {
        this.cookie = "";
    }

    async request(path, options = {}) {
        const response = await fetch(
            `${baseUrl}${path}`,
            {
                ...options,
                headers: {
                    "Content-Type":
                        "application/json",
                    ...(this.cookie
                        ? {
                            Cookie: this.cookie
                        }
                        : {}),
                    ...(options.headers || {})
                }
            }
        );

        const setCookie =
            response.headers.get("set-cookie");

        if (setCookie) {
            this.cookie = setCookie
                .split(",")
                .map((cookiePart) =>
                    cookiePart.split(";")[0]
                )
                .find((cookiePart) =>
                    cookiePart.startsWith(
                        "carcare.sid="
                    )
                ) || this.cookie;
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
    const resetPasswordValue = "ResetPass2@";

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
                    notes: "Annual renewal test"
                })
            }
        );

    assert(
        createDocument.status === 201,
        `Document create failed: ${JSON.stringify(createDocument.data)}`
    );

    const documentId =
        createDocument.data.document.id;

    const downloadMissingFile =
        await client.request(
            `/api/documents/${documentId}/file`
        );

    assert(
        downloadMissingFile.status === 404,
        "Document missing-file guard failed."
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
                    newPassword: resetPasswordValue
                })
            }
        );

    assert(
        resetPassword.status === 200,
        `Password reset failed: ${JSON.stringify(resetPassword.data)}`
    );

    const loginAfterReset =
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
        loginAfterReset.status === 200,
        `Login after password reset failed: ${JSON.stringify(loginAfterReset.data)}`
    );

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
