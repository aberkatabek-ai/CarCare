const accountName = window.document.querySelector("#account-name");
const logoutButton = window.document.querySelector("#logout-button");

const totalOwnershipCost = window.document.querySelector("#total-ownership-cost");
const totalFuelCost = window.document.querySelector("#total-fuel-cost");
const totalServiceCost = window.document.querySelector("#total-service-cost");
const totalExpenseCost = window.document.querySelector("#total-expense-cost");
const fillUpSummary = window.document.querySelector("#fill-up-summary");
const serviceSummary = window.document.querySelector("#service-summary");
const expenseSummary = window.document.querySelector("#expense-summary");

const noVehicleWarning = window.document.querySelector("#no-vehicle-warning");
const fuelForm = window.document.querySelector("#fuel-form");
const fuelFormMessage = window.document.querySelector("#fuel-form-message");
const fuelVehicleSelect = window.document.querySelector("#fuel-vehicle");
const fuelDateInput = window.document.querySelector("#fuel-date");
const fuelOdometerInput = window.document.querySelector("#fuel-odometer");
const fuelLitersInput = window.document.querySelector("#fuel-liters");
const fuelTotalCostInput = window.document.querySelector("#fuel-total-cost");
const fullTankInput = window.document.querySelector("#is-full-tank");
const fuelPricePreview = window.document.querySelector("#fuel-price-preview");

const expenseForm = window.document.querySelector("#expense-form");
const expenseFormMessage = window.document.querySelector("#expense-form-message");
const expenseVehicleSelect = window.document.querySelector("#expense-vehicle");
const expenseTypeSelect = window.document.querySelector("#expense-type");
const expenseTitleInput = window.document.querySelector("#expense-title");
const expenseDateInput = window.document.querySelector("#expense-date");
const expenseOdometerInput = window.document.querySelector("#expense-odometer");

const vehicleFilter = window.document.querySelector("#cost-vehicle-filter");
const fuelList = window.document.querySelector("#fuel-entry-list");
const expenseList = window.document.querySelector("#expense-entry-list");
const fuelEntryCount = window.document.querySelector("#fuel-entry-count");
const expenseEntryCount = window.document.querySelector("#expense-entry-count");

let vehicles = [];
let fuelEntries = [];
let expenses = [];
let costSummary = {};
let generatedExpenseTitle = "";

const expenseTypeNames = {
    insurance: "Traffic insurance",
    casco: "Comprehensive insurance",
    tax: "Vehicle tax",
    inspection: "Vehicle inspection",
    emission: "Emission inspection",
    parking: "Parking",
    toll: "Road toll",
    wash: "Car wash",
    accessory: "Vehicle accessory",
    fine: "Traffic fine",
    other: "Other expense"
};

function createElement(tagName, className, text) {
    const element = window.document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function showMessage(element, message, type = "error") {
    element.textContent = message;
    element.className = `form-message ${type}`;
}

function clearMessage(element) {
    element.textContent = "";
    element.className = "form-message";
}

function formatCurrency(value) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 2
    }).format(Number(value) || 0);
}

function formatNumber(value, maximumFractionDigits = 2) {
    return Number(value).toLocaleString("en-US", {
        maximumFractionDigits
    });
}

function formatMileage(value) {
    if (value === null || value === undefined) {
        return "Not specified";
    }

    return `${formatNumber(value, 0)} km`;
}

function formatDate(value) {
    if (!value) {
        return "Unknown date";
    }

    const normalizedValue = String(value).slice(0, 10);
    const date = new Date(`${normalizedValue}T00:00:00`);

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getVehicleName(vehicle) {
    if (vehicle.nickname) {
        return `${vehicle.nickname} — ${vehicle.brand} ${vehicle.model}`;
    }

    return `${vehicle.brand} ${vehicle.model}`;
}

function getRecordVehicleName(record) {
    if (record.nickname) {
        return `${record.nickname} — ${record.brand} ${record.model}`;
    }

    return `${record.brand} ${record.model}`;
}

function createDetail(label, value) {
    const detail = createElement("div", "cost-detail");

    detail.append(
        createElement("span", "cost-detail-label", label),
        createElement("strong", "", value)
    );

    return detail;
}

function setDefaultDates() {
    const today = new Date().toISOString().slice(0, 10);

    fuelDateInput.max = today;
    expenseDateInput.max = today;

    if (!fuelDateInput.value) {
        fuelDateInput.value = today;
    }

    if (!expenseDateInput.value) {
        expenseDateInput.value = today;
    }
}

function populateVehicleSelections() {
    const previousFilter = vehicleFilter.value || "all";

    fuelVehicleSelect.innerHTML = "";
    expenseVehicleSelect.innerHTML = "";
    vehicleFilter.innerHTML = "";

    const emptyFuelOption = window.document.createElement("option");
    emptyFuelOption.value = "";
    emptyFuelOption.textContent = "Select a vehicle";
    fuelVehicleSelect.append(emptyFuelOption);

    const emptyExpenseOption = window.document.createElement("option");
    emptyExpenseOption.value = "";
    emptyExpenseOption.textContent = "Select a vehicle";
    expenseVehicleSelect.append(emptyExpenseOption);

    const allOption = window.document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All vehicles";
    vehicleFilter.append(allOption);

    vehicles.forEach((vehicle) => {
        const fuelOption = window.document.createElement("option");
        fuelOption.value = String(vehicle.id);
        fuelOption.textContent = getVehicleName(vehicle);
        fuelVehicleSelect.append(fuelOption);

        const expenseOption = window.document.createElement("option");
        expenseOption.value = String(vehicle.id);
        expenseOption.textContent = getVehicleName(vehicle);
        expenseVehicleSelect.append(expenseOption);

        const filterOption = window.document.createElement("option");
        filterOption.value = String(vehicle.id);
        filterOption.textContent = getVehicleName(vehicle);
        vehicleFilter.append(filterOption);
    });

    if (vehicles.some((vehicle) => String(vehicle.id) === previousFilter)) {
        vehicleFilter.value = previousFilter;
    } else {
        vehicleFilter.value = "all";
    }

    const hasVehicles = vehicles.length > 0;
    noVehicleWarning.hidden = hasVehicles;

    [fuelForm, expenseForm].forEach((form) => {
        form.querySelectorAll("input, select, textarea, button")
            .forEach((element) => {
                element.disabled = !hasVehicles;
            });
    });

    if (hasVehicles) {
        if (!fuelVehicleSelect.value) {
            fuelVehicleSelect.value = String(vehicles[0].id);
        }

        if (!expenseVehicleSelect.value) {
            expenseVehicleSelect.value = String(vehicles[0].id);
        }

        updateFuelOdometerSuggestion();
        updateExpenseOdometerSuggestion();
    }
}

function updateFuelOdometerSuggestion() {
    const vehicle = vehicles.find(
        (item) => String(item.id) === fuelVehicleSelect.value
    );

    if (vehicle) {
        fuelOdometerInput.value = String(vehicle.current_mileage);
        fuelOdometerInput.min = "0";
    }
}

function updateExpenseOdometerSuggestion() {
    const vehicle = vehicles.find(
        (item) => String(item.id) === expenseVehicleSelect.value
    );

    if (vehicle) {
        expenseOdometerInput.placeholder = String(vehicle.current_mileage);
    }
}

function updateFuelPricePreview() {
    const liters = Number(fuelLitersInput.value);
    const totalCost = Number(fuelTotalCostInput.value);

    if (liters > 0 && totalCost > 0) {
        fuelPricePreview.textContent =
            `${formatCurrency(totalCost / liters)} per litre`;
        fuelPricePreview.classList.add("calculated");
    } else {
        fuelPricePreview.textContent =
            "Enter litres and total cost to calculate the unit price.";
        fuelPricePreview.classList.remove("calculated");
    }
}

function renderSummary() {
    totalOwnershipCost.textContent = formatCurrency(
        costSummary.totalOwnershipCost
    );

    totalFuelCost.textContent = formatCurrency(
        costSummary.totalFuelCost
    );

    totalServiceCost.textContent = formatCurrency(
        costSummary.totalServiceCost
    );

    totalExpenseCost.textContent = formatCurrency(
        costSummary.totalExpenseCost
    );

    fillUpSummary.textContent =
        `${Number(costSummary.fillUpCount) || 0} fill-ups • ` +
        `${formatNumber(costSummary.totalLiters || 0)} litres`;

    serviceSummary.textContent =
        `${Number(costSummary.serviceCount) || 0} completed services`;

    expenseSummary.textContent =
        `${Number(costSummary.expenseCount) || 0} additional expenses`;
}

function createEmptyState(icon, title, description) {
    const emptyState = createElement("div", "cost-empty-state");

    emptyState.append(
        createElement("div", "cost-empty-icon", icon),
        createElement("h3", "", title),
        createElement("p", "", description)
    );

    return emptyState;
}

function renderFuelEntries() {
    fuelList.innerHTML = "";

    const selectedVehicle = vehicleFilter.value;
    const filteredEntries = fuelEntries.filter(
        (entry) =>
            selectedVehicle === "all" ||
            String(entry.vehicle_id) === selectedVehicle
    );

    fuelEntryCount.textContent =
        filteredEntries.length === 1
            ? "1 entry"
            : `${filteredEntries.length} entries`;

    if (filteredEntries.length === 0) {
        fuelList.append(
            createEmptyState(
                "F",
                "No fuel entries",
                "Record a fill-up to begin calculating fuel spending and consumption."
            )
        );
        return;
    }

    filteredEntries.forEach((entry) => {
        const card = createElement("article", "cost-entry-card fuel-entry-card");
        const heading = createElement("div", "cost-entry-heading");
        const titleArea = window.document.createElement("div");

        titleArea.append(
            createElement("span", "cost-entry-category", entry.is_full_tank ? "Full tank" : "Partial fill"),
            createElement("h3", "", entry.station || "Fuel fill-up"),
            createElement("p", "cost-entry-vehicle", getRecordVehicleName(entry))
        );

        heading.append(
            titleArea,
            createElement("span", "cost-entry-price", formatCurrency(entry.total_cost))
        );

        const details = createElement("div", "cost-details-grid");

        details.append(
            createDetail("Date", formatDate(entry.filled_at)),
            createDetail("Odometer", formatMileage(entry.odometer_km)),
            createDetail("Fuel", `${formatNumber(entry.liters, 3)} L`),
            createDetail("Price per litre", formatCurrency(entry.price_per_liter))
        );

        const consumption = createElement("div", "consumption-box");

        if (entry.consumption_l_per_100km !== null) {
            consumption.classList.add("calculated");
            consumption.append(
                createElement("span", "", "Calculated consumption"),
                createElement("strong", "", `${formatNumber(entry.consumption_l_per_100km)} L/100 km`),
                createElement("small", "", `${formatMileage(entry.distance_since_full_tank)} since the previous full tank`)
            );
        } else {
            consumption.append(
                createElement("span", "", "Consumption pending"),
                createElement("strong", "", "Another full tank is required")
            );
        }

        card.append(heading, details, consumption);

        if (entry.notes) {
            card.append(createElement("p", "cost-entry-notes", entry.notes));
        }

        const actions = createElement("div", "cost-entry-actions");
        const deleteButton = createElement("button", "danger-button", "Delete");
        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => deleteFuelEntry(entry.id));
        actions.append(deleteButton);
        card.append(actions);
        fuelList.append(card);
    });
}

function renderExpenses() {
    expenseList.innerHTML = "";

    const selectedVehicle = vehicleFilter.value;
    const filteredExpenses = expenses.filter(
        (expenseRecord) =>
            selectedVehicle === "all" ||
            String(expenseRecord.vehicle_id) === selectedVehicle
    );

    expenseEntryCount.textContent =
        filteredExpenses.length === 1
            ? "1 entry"
            : `${filteredExpenses.length} entries`;

    if (filteredExpenses.length === 0) {
        expenseList.append(
            createEmptyState(
                "₺",
                "No additional expenses",
                "Insurance, tax, parking and other vehicle costs will appear here."
            )
        );
        return;
    }

    filteredExpenses.forEach((expenseRecord) => {
        const card = createElement("article", "cost-entry-card expense-entry-card");
        const heading = createElement("div", "cost-entry-heading");
        const titleArea = window.document.createElement("div");

        titleArea.append(
            createElement("span", "cost-entry-category", expenseTypeNames[expenseRecord.expense_type] || "Other"),
            createElement("h3", "", expenseRecord.title),
            createElement("p", "cost-entry-vehicle", getRecordVehicleName(expenseRecord))
        );

        heading.append(
            titleArea,
            createElement("span", "cost-entry-price", formatCurrency(expenseRecord.amount))
        );

        const details = createElement("div", "cost-details-grid");
        details.append(
            createDetail("Date", formatDate(expenseRecord.expense_date)),
            createDetail("Provider", expenseRecord.provider || "Not specified"),
            createDetail("Odometer", formatMileage(expenseRecord.odometer_km)),
            createDetail("Category", expenseTypeNames[expenseRecord.expense_type] || "Other")
        );

        card.append(heading, details);

        if (expenseRecord.notes) {
            card.append(createElement("p", "cost-entry-notes", expenseRecord.notes));
        }

        const actions = createElement("div", "cost-entry-actions");
        const deleteButton = createElement("button", "danger-button", "Delete");
        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => deleteExpense(expenseRecord.id));
        actions.append(deleteButton);
        card.append(actions);
        expenseList.append(card);
    });
}

function renderCostCenter() {
    renderSummary();
    renderFuelEntries();
    renderExpenses();
}

async function refreshCostData() {
    const [vehicleData, fuelData, expenseData, summaryData] =
        await Promise.all([
            window.apiRequest("/api/vehicles"),
            window.apiRequest("/api/costs/fuel"),
            window.apiRequest("/api/costs/expenses"),
            window.apiRequest("/api/costs/summary")
        ]);

    vehicles = vehicleData.vehicles;
    fuelEntries = fuelData.fuelEntries;
    expenses = expenseData.expenses;
    costSummary = summaryData.summary;

    populateVehicleSelections();
    renderCostCenter();
}

fuelForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(fuelFormMessage);

    const formData = new FormData(fuelForm);
    const payload = {
        vehicleId: formData.get("vehicleId"),
        filledAt: formData.get("filledAt"),
        odometerKm: formData.get("odometerKm"),
        liters: formData.get("liters"),
        totalCost: formData.get("totalCost"),
        isFullTank: fullTankInput.checked,
        station: formData.get("station"),
        notes: formData.get("notes")
    };

    const submitButton = fuelForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Adding fill-up...";

    try {
        const data = await window.apiRequest("/api/costs/fuel", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        fuelForm.reset();
        fullTankInput.checked = true;
        setDefaultDates();
        updateFuelPricePreview();
        await refreshCostData();
        showMessage(fuelFormMessage, data.message, "success");
    } catch (error) {
        showMessage(fuelFormMessage, error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Add fuel entry";
    }
});

expenseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(expenseFormMessage);

    const formData = new FormData(expenseForm);
    const payload = {
        vehicleId: formData.get("vehicleId"),
        expenseType: formData.get("expenseType"),
        title: formData.get("title"),
        amount: formData.get("amount"),
        expenseDate: formData.get("expenseDate"),
        odometerKm: formData.get("odometerKm"),
        provider: formData.get("provider"),
        notes: formData.get("notes")
    };

    const submitButton = expenseForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Adding expense...";

    try {
        const data = await window.apiRequest("/api/costs/expenses", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        expenseForm.reset();
        generatedExpenseTitle = "";
        setDefaultDates();
        await refreshCostData();
        showMessage(expenseFormMessage, data.message, "success");
    } catch (error) {
        showMessage(expenseFormMessage, error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Add expense";
    }
});

async function deleteFuelEntry(entryId) {
    if (!window.confirm("Delete this fuel entry?\n\nThe vehicle mileage will not be reduced.")) {
        return;
    }

    try {
        await window.apiRequest(`/api/costs/fuel/${entryId}`, {
            method: "DELETE"
        });
        await refreshCostData();
    } catch (error) {
        window.alert(error.message);
    }
}

async function deleteExpense(expenseId) {
    if (!window.confirm("Delete this expense record?")) {
        return;
    }

    try {
        await window.apiRequest(`/api/costs/expenses/${expenseId}`, {
            method: "DELETE"
        });
        await refreshCostData();
    } catch (error) {
        window.alert(error.message);
    }
}

fuelVehicleSelect.addEventListener("change", updateFuelOdometerSuggestion);
expenseVehicleSelect.addEventListener("change", updateExpenseOdometerSuggestion);
fuelLitersInput.addEventListener("input", updateFuelPricePreview);
fuelTotalCostInput.addEventListener("input", updateFuelPricePreview);
vehicleFilter.addEventListener("change", renderCostCenter);

expenseTypeSelect.addEventListener("change", () => {
    const suggestedTitle = expenseTypeNames[expenseTypeSelect.value] || "";

    if (!expenseTitleInput.value.trim() || expenseTitleInput.value === generatedExpenseTitle) {
        expenseTitleInput.value = suggestedTitle;
        generatedExpenseTitle = suggestedTitle;
    }
});

async function logout() {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging out...";

    try {
        await window.apiRequest("/api/auth/logout", {
            method: "POST"
        });
        window.location.href = "/login.html";
    } catch (error) {
        logoutButton.disabled = false;
        logoutButton.textContent = "Log out";
        window.alert(error.message);
    }
}

logoutButton.addEventListener("click", logout);

async function loadCostCenter() {
    try {
        setDefaultDates();
        updateFuelPricePreview();

        const userData = await window.apiRequest("/api/auth/me");
        accountName.textContent = userData.user.full_name;

        await refreshCostData();
    } catch (error) {
        window.handlePageLoadError(
            error,
            "Cost center could not be loaded."
        );
    }
}

loadCostCenter();
