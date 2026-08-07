const db = require("../config/db");
const {
    hasSmtpConfiguration,
    sendReminderDigestEmail
} = require("../utils/mailer");

const REMINDER_FREQUENCY =
    15 * 60 * 1000;

let reminderLoopHandle = null;
let reminderRunPromise = null;

function formatVehicleName(record) {
    if (record.nickname) {
        return `${record.nickname} (${record.brand} ${record.model})`;
    }

    return `${record.brand} ${record.model}`;
}

function formatPlateLabel(record) {
    return record.license_plate
        ? `${formatVehicleName(record)} • ${record.license_plate}`
        : formatVehicleName(record);
}

function calculateMaintenanceStatus(plan) {
    const currentMileage = Number(plan.current_mileage);
    const intervalKm =
        plan.interval_km === null
            ? null
            : Number(plan.interval_km);
    const lastServiceKm =
        plan.last_service_km === null
            ? null
            : Number(plan.last_service_km);

    let nextDueMileage = null;
    let nextDueDate = null;

    if (intervalKm !== null && lastServiceKm !== null) {
        nextDueMileage = lastServiceKm + intervalKm;
    }

    if (
        plan.interval_months !== null &&
        plan.last_service_date
    ) {
        const lastServiceDate = new Date(
            plan.last_service_date
        );
        const dueDate = new Date(lastServiceDate);

        dueDate.setUTCMonth(
            dueDate.getUTCMonth() +
            Number(plan.interval_months)
        );

        nextDueDate = dueDate
            .toISOString()
            .slice(0, 10);
    }

    const todayText = new Date()
        .toISOString()
        .slice(0, 10);

    const overdueByMileage =
        nextDueMileage !== null &&
        currentMileage >= nextDueMileage;

    const overdueByDate =
        nextDueDate !== null &&
        todayText >= nextDueDate;

    const dueSoonByMileage =
        nextDueMileage !== null &&
        currentMileage >= nextDueMileage - 1000;

    let dueSoonByDate = false;

    if (nextDueDate !== null) {
        const today = new Date(`${todayText}T00:00:00Z`);
        const dueDate = new Date(
            `${nextDueDate}T00:00:00Z`
        );

        const remainingDays = Math.ceil(
            (dueDate - today) /
            (24 * 60 * 60 * 1000)
        );

        dueSoonByDate =
            remainingDays >= 0 &&
            remainingDays <= 30;
    }

    let status = "ok";

    if (overdueByMileage || overdueByDate) {
        status = "overdue";
    } else if (
        dueSoonByMileage ||
        dueSoonByDate
    ) {
        status = "due_soon";
    } else if (
        nextDueMileage === null &&
        nextDueDate === null
    ) {
        status = "not_scheduled";
    }

    return {
        ...plan,
        next_due_mileage: nextDueMileage,
        next_due_date: nextDueDate,
        status
    };
}

async function getReminderCandidates() {
    const usersResult = await db.query(
        `SELECT
            id,
            full_name,
            email
         FROM users
         WHERE reminders_enabled = TRUE`
    );

    const documentResult = await db.query(
        `SELECT
            u.id AS user_id,
            d.id,
            d.title,
            d.document_type,
            TO_CHAR(d.expiry_date, 'YYYY-MM-DD') AS expiry_date,
            d.reminder_days,
            (d.expiry_date - CURRENT_DATE)::INTEGER AS days_remaining,
            v.brand,
            v.model,
            v.nickname,
            v.license_plate
         FROM users u
         INNER JOIN vehicles v
            ON v.user_id = u.id
         INNER JOIN vehicle_documents d
            ON d.vehicle_id = v.id
         WHERE u.reminders_enabled = TRUE
           AND v.vehicle_status = 'active'
           AND d.expiry_date <= CURRENT_DATE + d.reminder_days
         ORDER BY d.expiry_date ASC`
    );

    const plansResult = await db.query(
        `SELECT
            u.id AS user_id,
            mp.id,
            mp.name,
            mp.category,
            mp.interval_km,
            mp.interval_months,
            mp.last_service_km,
            TO_CHAR(mp.last_service_date, 'YYYY-MM-DD') AS last_service_date,
            v.brand,
            v.model,
            v.nickname,
            v.license_plate,
            v.current_mileage
         FROM users u
         INNER JOIN vehicles v
            ON v.user_id = u.id
         INNER JOIN maintenance_plans mp
            ON mp.vehicle_id = v.id
         WHERE u.reminders_enabled = TRUE
           AND v.vehicle_status = 'active'
           AND mp.is_active = TRUE`
    );

    return {
        users: usersResult.rows,
        documents: documentResult.rows,
        maintenancePlans:
            plansResult.rows.map(
                calculateMaintenanceStatus
            )
    };
}

async function hasReminderBeenSentToday(userId) {
    const result = await db.query(
        `SELECT 1
         FROM reminder_deliveries
         WHERE user_id = $1
           AND reminder_kind = 'daily_digest'
           AND reminder_date = CURRENT_DATE
         LIMIT 1`,
        [userId]
    );

    return result.rows.length > 0;
}

async function recordReminderDelivery(
    userId,
    summary
) {
    await db.query(
        `INSERT INTO reminder_deliveries (
            user_id,
            reminder_kind,
            reminder_reference,
            reminder_date,
            payload
        )
        VALUES (
            $1,
            'daily_digest',
            $2,
            CURRENT_DATE,
            $3::JSONB
        )`,
        [
            userId,
            `daily:${new Date()
                .toISOString()
                .slice(0, 10)}`,
            JSON.stringify(summary)
        ]
    );
}

function buildUserReminderSummary(
    user,
    documents,
    maintenancePlans
) {
    const relevantDocuments = documents
        .filter(
            (documentRecord) =>
                Number(documentRecord.user_id) ===
                Number(user.id)
        )
        .map((documentRecord) => ({
            title: documentRecord.title,
            documentType:
                documentRecord.document_type,
            expiryDate:
                documentRecord.expiry_date,
            daysRemaining: Number(
                documentRecord.days_remaining
            ),
            vehicleLabel:
                formatPlateLabel(documentRecord)
        }));

    const relevantPlans = maintenancePlans
        .filter(
            (plan) =>
                Number(plan.user_id) ===
                    Number(user.id) &&
                (
                    plan.status === "overdue" ||
                    plan.status === "due_soon"
                )
        )
        .map((plan) => ({
            name: plan.name,
            category: plan.category,
            status: plan.status,
            nextDueMileage:
                plan.next_due_mileage,
            nextDueDate:
                plan.next_due_date,
            currentMileage: Number(
                plan.current_mileage
            ),
            vehicleLabel: formatPlateLabel(plan)
        }));

    return {
        documents: relevantDocuments,
        maintenancePlans: relevantPlans
    };
}

async function runReminderCycle() {
    if (!hasSmtpConfiguration()) {
        return;
    }

    const {
        users,
        documents,
        maintenancePlans
    } = await getReminderCandidates();

    for (const user of users) {
        const summary = buildUserReminderSummary(
            user,
            documents,
            maintenancePlans
        );

        const hasAnythingToSend =
            summary.documents.length > 0 ||
            summary.maintenancePlans.length > 0;

        if (!hasAnythingToSend) {
            continue;
        }

        if (
            await hasReminderBeenSentToday(
                user.id
            )
        ) {
            continue;
        }

        await sendReminderDigestEmail({
            to: user.email,
            fullName: user.full_name,
            summary
        });

        await recordReminderDelivery(
            user.id,
            summary
        );
    }
}

function scheduleReminderLoop() {
    if (reminderLoopHandle) {
        return;
    }

    const safeRun = async () => {
        if (reminderRunPromise) {
            return reminderRunPromise;
        }

        reminderRunPromise = runReminderCycle()
            .catch((error) => {
                console.error(
                    "[reminders] reminder cycle failed",
                    error
                );
            })
            .finally(() => {
                reminderRunPromise = null;
            });

        return reminderRunPromise;
    };

    reminderLoopHandle = setInterval(
        safeRun,
        REMINDER_FREQUENCY
    );

    if (
        typeof reminderLoopHandle.unref ===
        "function"
    ) {
        reminderLoopHandle.unref();
    }

    safeRun();
}

module.exports = {
    scheduleReminderLoop,
    runReminderCycle
};
