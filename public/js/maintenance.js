const completionStyle = document.createElement("link");

completionStyle.rel = "stylesheet";
completionStyle.href = "/css/completion.css";

document.head.append(completionStyle);

document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog
        id="completion-dialog"
        class="modal completion-dialog"
    >
        <div class="modal-content">
            <div class="modal-heading">
                <div>
                    <p class="eyebrow">
                        Service completion
                    </p>

                    <h2>Complete maintenance</h2>
                </div>

                <button
                    id="close-completion-dialog"
                    class="icon-button"
                    type="button"
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            <div class="completion-summary">
                <strong id="completion-plan-name">
                    Maintenance
                </strong>

                <span id="completion-vehicle-name">
                    Vehicle
                </span>
            </div>

            <div class="completion-warning">
                <strong>
                    This creates a permanent service record.
                </strong>

                The maintenance plan's last service date and
                mileage will be updated automatically.
            </div>

            <form
                id="completion-form"
                class="completion-form"
            >
                <div class="completion-form-grid">
                    <div class="form-group">
                        <label for="completion-date">
                            Completion date
                        </label>

                        <input
                            type="date"
                            id="completion-date"
                            name="completedAt"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="completion-mileage">
                            Completion mileage
                        </label>

                        <input
                            type="number"
                            id="completion-mileage"
                            name="completedAtMileage"
                            min="0"
                            step="1"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="actual-cost">
                            Actual cost
                        </label>

                        <input
                            type="number"
                            id="actual-cost"
                            name="actualCost"
                            min="0"
                            step="0.01"
                        >
                    </div>

                    <div class="form-group">
                        <label for="service-provider">
                            Service provider
                        </label>

                        <input
                            type="text"
                            id="service-provider"
                            name="serviceProvider"
                        >
                    </div>

                    <div
                        class="form-group completion-full-width"
                    >
                        <label for="service-notes">
                            Notes
                        </label>

                        <textarea
                            id="service-notes"
                            name="notes"
                        ></textarea>
                    </div>
                </div>

                <p
                    id="completion-message"
                    class="form-message"
                    aria-live="polite"
                ></p>

                <div class="modal-actions">
                    <button
                        id="cancel-completion-button"
                        class="secondary-button"
                        type="button"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="primary-button modal-submit"
                    >
                        Save service record
                    </button>
                </div>
            </form>
        </div>
    </dialog>
    `
);

const accountName = document.querySelector(
    "#account-name"
);

const logoutButton = document.querySelector(
    "#logout-button"
);

const maintenanceForm = document.querySelector(
    "#maintenance-form"
);

const maintenanceMessage = document.querySelector(
    "#maintenance-message"
);

const vehicleSelect = document.querySelector(
    "#vehicle-id"
);

const vehicleFilter = document.querySelector(
    "#vehicle-filter"
);

const maintenanceList = document.querySelector(
    "#maintenance-list"
);

const noVehicleWarning = document.querySelector(
    "#no-vehicle-warning"
);

const lastServiceDateInput = document.querySelector(
    "#last-service-date"
);

const completionDialog = document.querySelector(
    "#completion-dialog"
);

const completionForm = document.querySelector(
    "#completion-form"
);

const completionPlanName = document.querySelector(
    "#completion-plan-name"
);

const completionVehicleName = document.querySelector(
    "#completion-vehicle-name"
);

const completionDate = document.querySelector(
    "#completion-date"
);

const completionMileage = document.querySelector(
    "#completion-mileage"
);

const actualCost = document.querySelector(
    "#actual-cost"
);

const serviceProvider = document.querySelector(
    "#service-provider"
);

const serviceNotes = document.querySelector(
    "#service-notes"
);

const completionMessage = document.querySelector(
    "#completion-message"
);

const closeCompletionDialogButton =
    document.querySelector(
        "#close-completion-dialog"
    );

const cancelCompletionButton =
    document.querySelector(
        "#cancel-completion-button"
    );

let vehicles = [];
let maintenancePlans = [];
let selectedPlanId = null;

function showMessage(element, message, type = "error") {
    element.textContent = message;
    element.className = `form-message ${type}`;
}

function clearMessage(element) {
    element.textContent = "";
    element.className = "form-message";
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function getVehicleName(vehicle) {
    if (vehicle.nickname) {
        return (
            `${vehicle.nickname} — ` +
            `${vehicle.brand} ${vehicle.model}`
        );
    }

    return `${vehicle.brand} ${vehicle.model}`;
}

function getPlanVehicleName(plan) {
    if (plan.nickname) {
        return (
            `${plan.nickname} — ` +
            `${plan.brand} ${plan.model}`
        );
    }

    return `${plan.brand} ${plan.model}`;
}

function formatMileage(value) {
    if (value === null || value === undefined) {
        return "Not scheduled";
    }

    return (
        `${window.formatAppNumber(value, {
            maximumFractionDigits: 0
        })} km`
    );
}

function formatDate(value) {
    if (!value) {
        return "Not scheduled";
    }

    return new Date(value).toLocaleDateString(
        window.getAppIntlLocale()
    );
}

function formatDateForInput(value) {
    if (!value) {
        return "";
    }

    return new Date(value)
        .toISOString()
        .slice(0, 10);
}

function formatCost(value) {
    if (value === null || value === undefined) {
        return "Not specified";
    }

    return window.formatAppCurrency(value);
}

function getStatusInformation(status) {
    const statuses = {
        overdue: {
            text: "Overdue",
            className: "status-overdue"
        },

        due_soon: {
            text: "Due soon",
            className: "status-due-soon"
        },

        ok: {
            text: "On schedule",
            className: "status-ok"
        },

        not_scheduled: {
            text: "Waiting for baseline",
            className: "status-unscheduled"
        }
    };

    return statuses[status] || statuses.not_scheduled;
}

function populateVehicleSelections() {
    vehicleSelect.innerHTML = "";

    const defaultOption =
        document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = "Select a vehicle";

    vehicleSelect.append(defaultOption);

    vehicleFilter.innerHTML = "";

    const allOption =
        document.createElement("option");

    allOption.value = "all";
    allOption.textContent = "All vehicles";

    vehicleFilter.append(allOption);

    vehicles.forEach((vehicle) => {
        const formOption =
            document.createElement("option");

        formOption.value = vehicle.id;
        formOption.textContent =
            getVehicleName(vehicle);

        vehicleSelect.append(formOption);

        const filterOption =
            document.createElement("option");

        filterOption.value = vehicle.id;
        filterOption.textContent =
            getVehicleName(vehicle);

        vehicleFilter.append(filterOption);
    });

    if (vehicles.length === 0) {
        maintenanceForm.classList.add(
            "disabled-form"
        );

        noVehicleWarning.classList.remove(
            "hidden"
        );

        maintenanceForm
            .querySelectorAll(
                "input, select, button"
            )
            .forEach((element) => {
                element.disabled = true;
            });

        return;
    }

    noVehicleWarning.classList.add("hidden");

    vehicleSelect.value =
        String(vehicles[0].id);
}

function createPlanDetail(label, value) {
    const detail = createElement(
        "div",
        "maintenance-detail"
    );

    detail.append(
        createElement(
            "span",
            "maintenance-detail-label",
            label
        ),

        createElement(
            "strong",
            "",
            value
        )
    );

    return detail;
}

function renderMaintenancePlans() {
    maintenanceList.innerHTML = "";

    const selectedVehicle =
        vehicleFilter.value;

    const filteredPlans =
        selectedVehicle === "all"
            ? maintenancePlans
            : maintenancePlans.filter(
                (plan) =>
                    String(plan.vehicle_id) ===
                    selectedVehicle
            );

    if (filteredPlans.length === 0) {
        const emptyState = createElement(
            "div",
            "empty-state"
        );

        emptyState.append(
            createElement(
                "div",
                "empty-icon",
                "🔧"
            ),

            createElement(
                "h2",
                "",
                "No maintenance plans"
            ),

            createElement(
                "p",
                "",
                "Create your first maintenance plan using the form above."
            )
        );

        maintenanceList.append(emptyState);
        return;
    }

    const grid = createElement(
        "div",
        "maintenance-grid"
    );

    filteredPlans.forEach((plan) => {
        const card = createElement(
            "article",
            "maintenance-card"
        );

        if (plan.is_critical) {
            card.classList.add("critical-card");
        }

        const header = createElement(
            "div",
            "maintenance-card-header"
        );

        const titleArea = createElement("div");

        titleArea.append(
            createElement(
                "p",
                "maintenance-category",
                plan.category
            ),

            createElement(
                "h3",
                "",
                plan.name
            ),

            createElement(
                "p",
                "maintenance-vehicle",
                getPlanVehicleName(plan)
            )
        );

        const badges = createElement(
            "div",
            "maintenance-badges"
        );

        const status =
            getStatusInformation(plan.status);

        badges.append(
            createElement(
                "span",
                `plan-status ${status.className}`,
                status.text
            )
        );

        if (plan.is_critical) {
            badges.append(
                createElement(
                    "span",
                    "critical-badge",
                    "Critical"
                )
            );
        }

        header.append(titleArea, badges);

        const details = createElement(
            "div",
            "maintenance-details"
        );

        const intervals = [];

        if (plan.interval_km !== null) {
            intervals.push(
                formatMileage(plan.interval_km)
            );
        }

        if (plan.interval_months !== null) {
            intervals.push(
                `${plan.interval_months} months`
            );
        }

        details.append(
            createPlanDetail(
                "Interval",
                intervals.join(" / ")
            ),

            createPlanDetail(
                "Last service mileage",
                formatMileage(plan.last_service_km)
            ),

            createPlanDetail(
                "Next due mileage",
                formatMileage(plan.next_due_mileage)
            ),

            createPlanDetail(
                "Next due date",
                formatDate(plan.next_due_date)
            ),

            createPlanDetail(
                "Estimated cost",
                formatCost(plan.estimated_cost)
            )
        );

        const actions = createElement(
            "div",
            "vehicle-actions"
        );

        const completeButton = createElement(
            "button",
            "primary-button complete-maintenance-button",
            "Complete maintenance"
        );

        completeButton.type = "button";

        completeButton.addEventListener(
            "click",
            () => {
                openCompletionDialog(plan.id);
            }
        );

        const deleteButton = createElement(
            "button",
            "danger-button",
            "Delete plan"
        );

        deleteButton.type = "button";

        deleteButton.addEventListener(
            "click",
            () => {
                deleteMaintenancePlan(plan.id);
            }
        );

        actions.append(
            completeButton,
            deleteButton
        );

        card.append(
            header,
            details,
            actions
        );

        grid.append(card);
    });

    maintenanceList.append(grid);
}

async function refreshMaintenancePlans() {
    const data = await window.apiRequest(
        "/api/maintenance-plans"
    );

    maintenancePlans = data.maintenancePlans;

    renderMaintenancePlans();
}

async function loadMaintenancePage() {
    try {
        const [
            userData,
            vehicleData,
            planData
        ] = await Promise.all([
            window.apiRequest("/api/auth/me"),
            window.apiRequest("/api/vehicles"),
            window.apiRequest(
                "/api/maintenance-plans"
            )
        ]);

        accountName.textContent =
            userData.user.full_name;

        vehicles = vehicleData.vehicles;
        maintenancePlans =
            planData.maintenancePlans;

        populateVehicleSelections();
        renderMaintenancePlans();
    } catch (error) {
        window.handlePageLoadError(
            error,
            "Maintenance page could not be loaded."
        );
    }
}

maintenanceForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        clearMessage(maintenanceMessage);

        const formData = new FormData(
            maintenanceForm
        );

        const selectedVehicleId =
            formData.get("vehicleId");

        const payload = {
            vehicleId: selectedVehicleId,
            name: formData.get("name"),
            category: formData.get("category"),

            intervalKm:
                formData.get("intervalKm"),

            intervalMonths:
                formData.get("intervalMonths"),

            lastServiceKm:
                formData.get("lastServiceKm"),

            lastServiceDate:
                formData.get("lastServiceDate"),

            estimatedCost:
                formData.get("estimatedCost"),

            isCritical:
                document.querySelector(
                    "#is-critical"
                ).checked
        };

        if (
            !payload.intervalKm &&
            !payload.intervalMonths
        ) {
            showMessage(
                maintenanceMessage,
                "Enter a mileage interval, a month interval, or both."
            );

            return;
        }

        const submitButton =
            maintenanceForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;
        submitButton.textContent =
            "Creating plan...";

        try {
            const data =
                await window.apiRequest(
                    "/api/maintenance-plans",
                    {
                        method: "POST",
                        body: JSON.stringify(payload)
                    }
                );

            maintenancePlans.unshift(
                data.maintenancePlan
            );

            maintenanceForm.reset();

            vehicleSelect.value =
                selectedVehicleId;

            showMessage(
                maintenanceMessage,
                data.message,
                "success"
            );

            renderMaintenancePlans();
        } catch (error) {
            showMessage(
                maintenanceMessage,
                error.message
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent =
                "Create maintenance plan";
        }
    }
);

vehicleFilter.addEventListener(
    "change",
    renderMaintenancePlans
);

function openCompletionDialog(planId) {
    const plan = maintenancePlans.find(
        (item) => item.id === planId
    );

    if (!plan) {
        return;
    }

    selectedPlanId = planId;

    completionPlanName.textContent =
        plan.name;

    completionVehicleName.textContent =
        getPlanVehicleName(plan);

    const today = new Date()
        .toISOString()
        .slice(0, 10);

    completionDate.max = today;
    completionDate.value = today;

    if (plan.last_service_date) {
        completionDate.min =
            formatDateForInput(
                plan.last_service_date
            );
    } else {
        completionDate.removeAttribute("min");
    }

    const minimumMileage =
        plan.last_service_km !== null
            ? Number(plan.last_service_km)
            : 0;

    completionMileage.min =
        String(minimumMileage);

    completionMileage.max =
        String(plan.current_mileage);

    completionMileage.value =
        String(plan.current_mileage);

    actualCost.value =
        plan.estimated_cost ?? "";

    serviceProvider.value = "";
    serviceNotes.value = "";

    clearMessage(completionMessage);

    completionDialog.showModal();
}

function closeCompletionDialog() {
    selectedPlanId = null;

    completionForm.reset();
    clearMessage(completionMessage);

    completionDialog.close();
}

closeCompletionDialogButton.addEventListener(
    "click",
    closeCompletionDialog
);

cancelCompletionButton.addEventListener(
    "click",
    closeCompletionDialog
);

completionForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const plan = maintenancePlans.find(
            (item) =>
                item.id === selectedPlanId
        );

        if (!plan) {
            return;
        }

        clearMessage(completionMessage);

        const payload = {
            completedAt:
                completionDate.value,

            completedAtMileage:
                completionMileage.value,

            actualCost:
                actualCost.value,

            serviceProvider:
                serviceProvider.value,

            notes:
                serviceNotes.value
        };

        const confirmed = window.confirm(
            `Complete "${plan.name}" at ` +
            `${formatMileage(payload.completedAtMileage)}?\n\n` +
            `This will create a permanent service record.`
        );

        if (!confirmed) {
            return;
        }

        const submitButton =
            completionForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;
        submitButton.textContent =
            "Saving service...";

        try {
            const data =
                await window.apiRequest(
                    `/api/service-history/complete/${plan.id}`,
                    {
                        method: "POST",
                        body: JSON.stringify(payload)
                    }
                );

            await refreshMaintenancePlans();

            closeCompletionDialog();

            showMessage(
                maintenanceMessage,
                data.message,
                "success"
            );
        } catch (error) {
            showMessage(
                completionMessage,
                error.message
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent =
                "Save service record";
        }
    }
);

async function deleteMaintenancePlan(planId) {
    const plan = maintenancePlans.find(
        (item) => item.id === planId
    );

    if (!plan) {
        return;
    }

    const confirmed = window.confirm(
        `Delete the "${plan.name}" maintenance plan?`
    );

    if (!confirmed) {
        return;
    }

    try {
        await window.apiRequest(
            `/api/maintenance-plans/${planId}`,
            {
                method: "DELETE"
            }
        );

        maintenancePlans =
            maintenancePlans.filter(
                (item) => item.id !== planId
            );

        renderMaintenancePlans();
    } catch (error) {
        alert(error.message);
    }
}

async function logout() {
    logoutButton.disabled = true;
    logoutButton.textContent =
        "Logging out...";

    try {
        await window.apiRequest(
            "/api/auth/logout",
            {
                method: "POST"
            }
        );

        window.location.href =
            "/login";
    } catch (error) {
        logoutButton.disabled = false;
        logoutButton.textContent =
            "Log out";

        alert(error.message);
    }
}

logoutButton.addEventListener(
    "click",
    logout
);

lastServiceDateInput.max = new Date()
    .toISOString()
    .slice(0, 10);

loadMaintenancePage();
