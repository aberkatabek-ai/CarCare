const workflowStyle = document.createElement("style");

workflowStyle.textContent = `
    .health-workflow-dialog {
        width: min(620px, calc(100% - 30px));
    }

    .workflow-summary {
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin: 0 0 20px;
        padding: 14px;
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: var(--radius-small);
    }

    .workflow-summary span {
        color: var(--muted);
        font-size: 13px;
    }

    .workflow-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0 16px;
    }

    .workflow-full-width {
        grid-column: 1 / -1;
    }

    .workflow-notice {
        margin-bottom: 20px;
        padding: 13px;
        color: #166534;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: var(--radius-small);
        font-size: 13px;
        line-height: 1.55;
    }

    .workflow-form textarea {
        width: 100%;
        min-height: 120px;
        padding: 13px 14px;
        color: var(--text);
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: var(--radius-small);
        outline: none;
        font: inherit;
        resize: vertical;
    }

    .workflow-form textarea:focus {
        background: white;
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
    }

    .repair-button {
        padding: 11px 15px;
        color: #047857;
        background: #d1fae5;
        border: 0;
        border-radius: var(--radius-small);
        cursor: pointer;
        font: inherit;
        font-weight: 700;
    }

    .repair-button:hover {
        background: #a7f3d0;
    }

    .issue-actions {
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    @media (max-width: 640px) {
        .workflow-grid {
            grid-template-columns: 1fr;
        }

        .workflow-full-width {
            grid-column: auto;
        }
    }
`;

document.head.append(workflowStyle);

document.body.insertAdjacentHTML(
    "beforeend",
    `
    <dialog
        id="diagnosis-dialog"
        class="modal health-workflow-dialog"
    >
        <div class="modal-content">
            <div class="modal-heading">
                <div>
                    <p class="eyebrow">
                        Workshop assessment
                    </p>

                    <h2>Add mechanic diagnosis</h2>
                </div>

                <button
                    id="close-diagnosis-dialog"
                    class="icon-button"
                    type="button"
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            <div class="workflow-summary">
                <strong id="diagnosis-issue-title">
                    Issue
                </strong>

                <span id="diagnosis-vehicle-name">
                    Vehicle
                </span>
            </div>

            <form
                id="diagnosis-form"
                class="workflow-form"
            >
                <div class="form-group">
                    <label for="mechanic-diagnosis">
                        Mechanic diagnosis
                    </label>

                    <textarea
                        id="mechanic-diagnosis"
                        required
                    ></textarea>
                </div>

                <p
                    id="diagnosis-message"
                    class="form-message"
                    aria-live="polite"
                ></p>

                <div class="modal-actions">
                    <button
                        id="cancel-diagnosis-button"
                        class="secondary-button"
                        type="button"
                    >
                        Cancel
                    </button>

                    <button
                        class="primary-button modal-submit"
                        type="submit"
                    >
                        Save diagnosis
                    </button>
                </div>
            </form>
        </div>
    </dialog>

    <dialog
        id="repair-dialog"
        class="modal health-workflow-dialog"
    >
        <div class="modal-content">
            <div class="modal-heading">
                <div>
                    <p class="eyebrow">
                        Repair completion
                    </p>

                    <h2>Mark issue as repaired</h2>
                </div>

                <button
                    id="close-repair-dialog"
                    class="icon-button"
                    type="button"
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            <div class="workflow-summary">
                <strong id="repair-issue-title">
                    Issue
                </strong>

                <span id="repair-vehicle-name">
                    Vehicle
                </span>
            </div>

            <div class="workflow-notice">
                Completing this form will mark the issue
                as repaired and automatically create a
                permanent service history record.
            </div>

            <form
                id="repair-form"
                class="workflow-form"
            >
                <div class="workflow-grid">
                    <div class="form-group">
                        <label for="repair-date">
                            Repair date
                        </label>

                        <input
                            id="repair-date"
                            type="date"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="repair-mileage">
                            Repair mileage
                        </label>

                        <input
                            id="repair-mileage"
                            type="number"
                            min="0"
                            step="1"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="repair-cost">
                            Actual cost
                        </label>

                        <input
                            id="repair-cost"
                            type="number"
                            min="0"
                            step="0.01"
                        >
                    </div>

                    <div class="form-group">
                        <label for="repair-provider">
                            Service provider
                        </label>

                        <input
                            id="repair-provider"
                            type="text"
                        >
                    </div>

                    <div
                        class="form-group workflow-full-width"
                    >
                        <label for="resolution-notes">
                            Repair notes
                        </label>

                        <textarea
                            id="resolution-notes"
                        required
                        ></textarea>
                    </div>
                </div>

                <p
                    id="repair-message"
                    class="form-message"
                    aria-live="polite"
                ></p>

                <div class="modal-actions">
                    <button
                        id="cancel-repair-button"
                        class="secondary-button"
                        type="button"
                    >
                        Cancel
                    </button>

                    <button
                        class="primary-button modal-submit"
                        type="submit"
                    >
                        Complete repair
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

const issueForm = document.querySelector(
    "#issue-form"
);

const issueFormMessage = document.querySelector(
    "#issue-form-message"
);

const vehicleSelect = document.querySelector(
    "#issue-vehicle"
);

const categorySelect = document.querySelector(
    "#issue-category"
);

const severitySelect = document.querySelector(
    "#issue-severity"
);

const warningLightSelect = document.querySelector(
    "#warning-light"
);

const issuePhotosInput = document.querySelector(
    "#issue-photos"
);

const issuePhotoHelp = document.querySelector(
    "#issue-photo-help"
);

const issuePhotoPreview = document.querySelector(
    "#issue-photo-preview"
);

const canDriveNormallyInput =
    document.querySelector(
        "#can-drive-normally"
    );

const isWorseningInput = document.querySelector(
    "#is-worsening"
);

const riskPreview = document.querySelector(
    "#risk-preview"
);

const riskPreviewTitle = document.querySelector(
    "#risk-preview-title"
);

const riskPreviewMessage = document.querySelector(
    "#risk-preview-message"
);

const vehicleFilter = document.querySelector(
    "#issue-vehicle-filter"
);

const statusFilter = document.querySelector(
    "#issue-status-filter"
);

const issueList = document.querySelector(
    "#issue-list"
);

const noVehicleWarning = document.querySelector(
    "#no-vehicle-warning"
);

const openIssueCount = document.querySelector(
    "#open-issue-count"
);

const redIssueCount = document.querySelector(
    "#red-issue-count"
);

const orangeIssueCount = document.querySelector(
    "#orange-issue-count"
);

const repairedIssueCount = document.querySelector(
    "#repaired-issue-count"
);

const diagnosisDialog = document.querySelector(
    "#diagnosis-dialog"
);

const diagnosisForm = document.querySelector(
    "#diagnosis-form"
);

const diagnosisIssueTitle = document.querySelector(
    "#diagnosis-issue-title"
);

const diagnosisVehicleName =
    document.querySelector(
        "#diagnosis-vehicle-name"
    );

const mechanicDiagnosisInput =
    document.querySelector(
        "#mechanic-diagnosis"
    );

const diagnosisMessage = document.querySelector(
    "#diagnosis-message"
);

const closeDiagnosisDialogButton =
    document.querySelector(
        "#close-diagnosis-dialog"
    );

const cancelDiagnosisButton =
    document.querySelector(
        "#cancel-diagnosis-button"
    );

const repairDialog = document.querySelector(
    "#repair-dialog"
);

const repairForm = document.querySelector(
    "#repair-form"
);

const repairIssueTitle = document.querySelector(
    "#repair-issue-title"
);

const repairVehicleName = document.querySelector(
    "#repair-vehicle-name"
);

const repairDateInput = document.querySelector(
    "#repair-date"
);

const repairMileageInput = document.querySelector(
    "#repair-mileage"
);

const repairCostInput = document.querySelector(
    "#repair-cost"
);

const repairProviderInput = document.querySelector(
    "#repair-provider"
);

const resolutionNotesInput =
    document.querySelector(
        "#resolution-notes"
    );

const repairMessage = document.querySelector(
    "#repair-message"
);

const closeRepairDialogButton =
    document.querySelector(
        "#close-repair-dialog"
    );

const cancelRepairButton =
    document.querySelector(
        "#cancel-repair-button"
    );

let vehicles = [];
let issues = [];
let selectedIssueId = null;
let uploadedIssuePhotos = [];

const categoryNames = {
    engine: "Engine",
    brakes: "Brakes",
    steering: "Steering",
    suspension: "Suspension",
    transmission: "Transmission",
    electrical: "Electrical",
    cooling: "Cooling system",
    tires: "Tires",
    exhaust: "Exhaust",
    body: "Body",
    other: "Other"
};

const riskInformation = {
    green: {
        label: "Monitor",

        message:
            "No urgent warning signs are currently selected."
    },

    orange: {
        label: "Inspection recommended",

        message:
            "Arrange an inspection soon and avoid ignoring changes in the symptom."
    },

    red: {
        label: "Urgent attention",

        message:
            "Avoid driving the vehicle until it has been inspected by a qualified mechanic."
    }
};

function createElement(
    tagName,
    className,
    text
) {
    const element =
        document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function showMessage(
    element,
    message,
    type = "error"
) {
    element.textContent = message;

    element.className =
        `form-message ${type}`;
}

function clearMessage(element) {
    element.textContent = "";
    element.className = "form-message";
}

function formatDate(value) {
    return new Date(value)
        .toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
}

function formatMileage(value) {
    return (
        `${Number(value).toLocaleString(
            "en-US"
        )} km`
    );
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

function getIssueVehicleName(issue) {
    if (issue.nickname) {
        return (
            `${issue.nickname} — ` +
            `${issue.brand} ${issue.model}`
        );
    }

    return `${issue.brand} ${issue.model}`;
}

function calculateRiskLevel() {
    const category = categorySelect.value;
    const severity = severitySelect.value;

    const warningLight =
        warningLightSelect.value;

    const canDriveNormally =
        canDriveNormallyInput.checked;

    const isWorsening =
        isWorseningInput.checked;

    const criticalCategories = [
        "brakes",
        "steering",
        "tires"
    ];

    const isCriticalCategory =
        criticalCategories.includes(
            category
        );

    if (
        warningLight === "red" ||
        !canDriveNormally ||
        (
            isCriticalCategory &&
            severity === "severe"
        )
    ) {
        return "red";
    }

    if (
        severity === "severe" ||
        warningLight === "yellow" ||
        isWorsening ||
        (
            isCriticalCategory &&
            severity === "moderate"
        )
    ) {
        return "orange";
    }

    return "green";
}

function updateRiskPreview() {
    const riskLevel =
        calculateRiskLevel();

    const information =
        riskInformation[riskLevel];

    riskPreview.className =
        `risk-preview ${riskLevel}`;

    riskPreviewTitle.textContent =
        `Initial assessment: ` +
        `${information.label}`;

    riskPreviewMessage.textContent =
        information.message;
}

function populateVehicleSelections() {
    vehicleSelect.innerHTML = "";
    vehicleFilter.innerHTML = "";

    const defaultOption =
        document.createElement("option");

    defaultOption.value = "";

    defaultOption.textContent =
        "Select a vehicle";

    vehicleSelect.append(defaultOption);

    const allOption =
        document.createElement("option");

    allOption.value = "all";

    allOption.textContent =
        "All vehicles";

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

        vehicleFilter.append(
            filterOption
        );
    });

    const hasVehicles =
        vehicles.length > 0;

    issueForm
        .querySelectorAll(
            "input, select, textarea, button"
        )
        .forEach((element) => {
            element.disabled =
                !hasVehicles;
        });

    noVehicleWarning.hidden =
        hasVehicles;
}

function renderStatistics() {
    const openIssues = issues.filter(
        (issue) =>
            issue.status !== "repaired"
    );

    const redIssues = openIssues.filter(
        (issue) =>
            issue.risk_level === "red"
    );

    const orangeIssues =
        openIssues.filter(
            (issue) =>
                issue.risk_level ===
                    "orange"
        );

    const repairedIssues =
        issues.filter(
            (issue) =>
                issue.status === "repaired"
        );

    openIssueCount.textContent =
        String(openIssues.length);

    redIssueCount.textContent =
        String(redIssues.length);

    orangeIssueCount.textContent =
        String(orangeIssues.length);

    repairedIssueCount.textContent =
        String(repairedIssues.length);
}

function clearIssuePhotoSelection() {
    uploadedIssuePhotos = [];

    if (issuePhotosInput) {
        issuePhotosInput.value = "";
    }

    if (issuePhotoHelp) {
        issuePhotoHelp.textContent =
            "No photos selected.";
    }

    if (issuePhotoPreview) {
        issuePhotoPreview.innerHTML = "";
    }
}

function renderIssuePhotoPreview() {
    if (!issuePhotoPreview) {
        return;
    }

    issuePhotoPreview.innerHTML = "";

    uploadedIssuePhotos.forEach((photo) => {
        const image = createElement(
            "img",
            "issue-photo-thumb"
        );

        image.src = photo.previewUrl;
        image.alt = photo.name;

        issuePhotoPreview.append(image);
    });
}

function createIssueInformation(
    label,
    value
) {
    const item = createElement(
        "div",
        "issue-information"
    );

    item.append(
        createElement(
            "span",
            "",
            label
        ),

        createElement(
            "strong",
            "",
            value
        )
    );

    return item;
}

function createEmptyState() {
    const emptyState = createElement(
        "div",
        "health-empty-state"
    );

    emptyState.append(
        createElement(
            "span",
            "health-empty-icon",
            "✓"
        ),

        createElement(
            "h3",
            "",
            "No matching vehicle issues"
        ),

        createElement(
            "p",
            "",
            "Reported symptoms will appear here with their calculated urgency level."
        )
    );

    return emptyState;
}

function renderIssues() {
    issueList.innerHTML = "";

    renderStatistics();

    const selectedVehicle =
        vehicleFilter.value;

    const selectedStatus =
        statusFilter.value;

    const filteredIssues =
        issues.filter((issue) => {
            const matchesVehicle =
                selectedVehicle === "all" ||
                String(issue.vehicle_id) ===
                    selectedVehicle;

            const matchesStatus =
                selectedStatus === "all" ||
                issue.status ===
                    selectedStatus;

            return (
                matchesVehicle &&
                matchesStatus
            );
        });

    if (filteredIssues.length === 0) {
        issueList.append(
            createEmptyState()
        );

        return;
    }

    const grid = createElement(
        "div",
        "issue-grid"
    );

    filteredIssues.forEach((issue) => {
        let displayInformation;
        let accentColor;
        let badgeBackground;
        let guidanceBackground;

        if (issue.status === "repaired") {
            displayInformation = {
                label: "Repaired",

                message:
                    "This issue has been inspected, repaired and added to the vehicle's service history."
            };

            accentColor = "#16a34a";
            badgeBackground = "#dcfce7";
            guidanceBackground = "#f0fdf4";
        } else if (
            issue.status === "diagnosed"
        ) {
            displayInformation = {
                label: "Inspected",

                message:
                    "A mechanic diagnosis has been recorded. Mark the issue as repaired after the recommended work is completed."
            };

            accentColor = "#2563eb";
            badgeBackground = "#dbeafe";
            guidanceBackground = "#eff6ff";
        } else {
            displayInformation =
                riskInformation[
                    issue.risk_level
                ];

            const riskColors = {
                green: {
                    accent: "#16a34a",
                    badge: "#dcfce7",
                    guidance: "#f0fdf4"
                },

                orange: {
                    accent: "#ea580c",
                    badge: "#ffedd5",
                    guidance: "#fff7ed"
                },

                red: {
                    accent: "#dc2626",
                    badge: "#fee2e2",
                    guidance: "#fef2f2"
                }
            };

            const selectedColors =
                riskColors[
                    issue.risk_level
                ] || riskColors.orange;

            accentColor =
                selectedColors.accent;

            badgeBackground =
                selectedColors.badge;

            guidanceBackground =
                selectedColors.guidance;
        }

        const card = createElement(
            "article",
            `issue-card ` +
                `risk-${issue.risk_level}`
        );

        card.style.borderLeftColor =
            accentColor;

        const heading = createElement(
            "div",
            "issue-card-heading"
        );

        const titleArea =
            document.createElement("div");

        titleArea.append(
            createElement(
                "span",
                "issue-category",
                categoryNames[
                    issue.category
                ] || "Other"
            ),

            createElement(
                "h3",
                "",
                issue.issue_title
            ),

            createElement(
                "p",
                "",
                getIssueVehicleName(
                    issue
                )
            )
        );

        const riskBadge = createElement(
            "span",
            `issue-risk-badge ` +
                `${issue.risk_level}`,
            displayInformation.label
        );

        riskBadge.style.color =
            accentColor;

        riskBadge.style.background =
            badgeBackground;

        heading.append(
            titleArea,
            riskBadge
        );

        const description =
            createElement(
                "p",
                "issue-description",
                issue.description
            );

        const informationGrid =
            createElement(
                "div",
                "issue-information-grid"
            );

        informationGrid.append(
            createIssueInformation(
                "Reported at",
                formatMileage(
                    issue.current_mileage
                )
            ),

            createIssueInformation(
                "Severity",
                issue.severity
            ),

            createIssueInformation(
                "Warning light",
                issue.warning_light
            ),

            createIssueInformation(
                "Status",
                issue.status
            )
        );

        const guidance = createElement(
            "div",
            `issue-guidance ` +
                `${issue.risk_level}`
        );

        guidance.style.color =
            accentColor;

        guidance.style.background =
            guidanceBackground;

        guidance.append(
            createElement(
                "strong",
                "",
                displayInformation.label
            ),

            createElement(
                "p",
                "",
                displayInformation.message
            )
        );

        card.append(
            heading,
            description
        );

        if (issue.occurs_when) {
            card.append(
                createElement(
                    "div",
                    "occurs-when",
                    `Occurs when: ` +
                        `${issue.occurs_when}`
                )
            );
        }

        card.append(
            informationGrid,
            guidance
        );

        if (
            Array.isArray(issue.photos) &&
            issue.photos.length > 0
        ) {
            const photoGrid = createElement(
                "div",
                "issue-card-photo-grid"
            );

            issue.photos.forEach((photo) => {
                const link = createElement(
                    "a",
                    "issue-photo-link"
                );

                link.href = photo.file_url;
                link.target = "_blank";
                link.rel = "noreferrer";

                const image = createElement(
                    "img",
                    "issue-photo-thumb"
                );

                image.src = photo.file_url;
                image.alt =
                    photo.original_file_name ||
                    "Issue photo";

                link.append(image);
                photoGrid.append(link);
            });

            card.append(photoGrid);
        }

        if (issue.mechanic_diagnosis) {
            const diagnosis =
                createElement(
                    "div",
                    "issue-note-box"
                );

            diagnosis.append(
                createElement(
                    "span",
                    "",
                    "Mechanic diagnosis"
                ),

                createElement(
                    "p",
                    "",
                    issue.mechanic_diagnosis
                )
            );

            card.append(diagnosis);
        }

        if (issue.resolution_notes) {
            const resolution =
                createElement(
                    "div",
                    "issue-note-box resolution"
                );

            resolution.append(
                createElement(
                    "span",
                    "",
                    "Repair notes"
                ),

                createElement(
                    "p",
                    "",
                    issue.resolution_notes
                )
            );

            card.append(resolution);
        }

        const footer = createElement(
            "div",
            "issue-card-footer"
        );

        const reportedDate =
            createElement(
                "span",
                "issue-date",
                `Reported ${formatDate(
                    issue.created_at
                )}`
            );

        const actions = createElement(
            "div",
            "issue-actions"
        );

        if (
            issue.status !== "repaired"
        ) {
            const diagnosisButton =
                document.createElement(
                    "button"
                );

            diagnosisButton.type =
                "button";

            diagnosisButton.className =
                "secondary-button";

            diagnosisButton.textContent =
                issue.mechanic_diagnosis
                    ? "Update diagnosis"
                    : "Add diagnosis";

            diagnosisButton.addEventListener(
                "click",
                () => {
                    openDiagnosisDialog(
                        issue.id
                    );
                }
            );

            const repairButton =
                document.createElement(
                    "button"
                );

            repairButton.type =
                "button";

            repairButton.className =
                "repair-button";

            repairButton.textContent =
                "Mark as repaired";

            repairButton.addEventListener(
                "click",
                () => {
                    openRepairDialog(
                        issue.id
                    );
                }
            );

            actions.append(
                diagnosisButton,
                repairButton
            );
        }

        const vehicleButton =
            document.createElement(
                "button"
            );

        vehicleButton.type = "button";

        vehicleButton.className =
            "secondary-button";

        vehicleButton.textContent =
            "View vehicle";

        vehicleButton.addEventListener(
            "click",
            () => {
                window.location.href =
                    `/vehicle.html?id=` +
                    `${issue.vehicle_id}`;
            }
        );

        const deleteButton =
            document.createElement(
                "button"
            );

        deleteButton.type = "button";

        deleteButton.className =
            "danger-button";

        deleteButton.textContent =
            "Delete";

        deleteButton.addEventListener(
            "click",
            () => {
                deleteIssue(issue.id);
            }
        );

        actions.append(
            vehicleButton,
            deleteButton
        );

        footer.append(
            reportedDate,
            actions
        );

        card.append(footer);
        grid.append(card);
    });

    issueList.append(grid);
}

issueForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        clearMessage(
            issueFormMessage
        );

        const submitButton =
            issueForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;

        submitButton.textContent =
            "Assessing issue...";

        const formData =
            new FormData(issueForm);

        const payload = {
            vehicleId:
                formData.get(
                    "vehicleId"
                ),

            issueTitle:
                formData.get(
                    "issueTitle"
                ),

            category:
                formData.get(
                    "category"
                ),

            description:
                formData.get(
                    "description"
                ),

            occursWhen:
                formData.get(
                    "occursWhen"
                ),

            severity:
                formData.get(
                    "severity"
                ),

            warningLight:
                formData.get(
                    "warningLight"
                ),

            canDriveNormally:
                canDriveNormallyInput
                    .checked,

            isWorsening:
                isWorseningInput.checked,

            photos: uploadedIssuePhotos.map(
                (photo) => ({
                    name: photo.name,
                    type: photo.type,
                    contentBase64:
                        photo.contentBase64
                })
            )
        };

        try {
            const data =
                await window.apiRequest(
                    "/api/issues",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            issues.unshift(data.issue);

            issueForm.reset();

            canDriveNormallyInput.checked =
                true;

            clearIssuePhotoSelection();

            updateRiskPreview();

            showMessage(
                issueFormMessage,
                data.message,
                "success"
            );

            renderIssues();
        } catch (error) {
            showMessage(
                issueFormMessage,
                error.message
            );
        } finally {
            submitButton.disabled =
                false;

            submitButton.textContent =
                "Report issue";
        }
    }
);

if (issuePhotosInput) {
    issuePhotosInput.addEventListener(
        "change",
        async () => {
            clearMessage(issueFormMessage);

            const selectedFiles = Array.from(
                issuePhotosInput.files || []
            );

            if (selectedFiles.length === 0) {
                clearIssuePhotoSelection();
                return;
            }

            if (selectedFiles.length > 5) {
                clearIssuePhotoSelection();
                showMessage(
                    issueFormMessage,
                    "You can upload up to 5 issue photos."
                );
                return;
            }

            const nextPhotos = [];

            for (const selectedFile of selectedFiles) {
                const contentBase64 =
                    await new Promise(
                        (resolve, reject) => {
                            const reader =
                                new FileReader();

                            reader.onload = () => {
                                const result =
                                    typeof reader.result ===
                                    "string"
                                        ? reader.result
                                        : "";

                                const base64 =
                                    result.includes(",")
                                        ? result.split(",")[1]
                                        : "";

                                if (!base64) {
                                    reject(
                                        new Error(
                                            "Selected issue photo could not be read."
                                        )
                                    );
                                    return;
                                }

                                resolve(base64);
                            };

                            reader.onerror = () => {
                                reject(
                                    new Error(
                                        "Selected issue photo could not be read."
                                    )
                                );
                            };

                            reader.readAsDataURL(
                                selectedFile
                            );
                        }
                    ).catch((error) => {
                        showMessage(
                            issueFormMessage,
                            error.message
                        );
                        return null;
                    });

                if (!contentBase64) {
                    clearIssuePhotoSelection();
                    return;
                }

                nextPhotos.push({
                    name: selectedFile.name,
                    type: selectedFile.type,
                    contentBase64,
                    previewUrl:
                        URL.createObjectURL(
                            selectedFile
                        )
                });
            }

            uploadedIssuePhotos = nextPhotos;

            if (issuePhotoHelp) {
                issuePhotoHelp.textContent =
                    `${uploadedIssuePhotos.length} photo(s) selected.`;
            }

            renderIssuePhotoPreview();
        }
    );
}

function getSelectedIssue() {
    return issues.find(
        (issue) =>
            issue.id === selectedIssueId
    );
}

function replaceIssue(updatedIssue) {
    issues = issues.map(
        (issue) =>
            issue.id === updatedIssue.id
                ? updatedIssue
                : issue
    );
}

function openDiagnosisDialog(issueId) {
    const issue = issues.find(
        (item) => item.id === issueId
    );

    if (
        !issue ||
        issue.status === "repaired"
    ) {
        return;
    }

    selectedIssueId = issueId;

    diagnosisIssueTitle.textContent =
        issue.issue_title;

    diagnosisVehicleName.textContent =
        getIssueVehicleName(issue);

    mechanicDiagnosisInput.value =
        issue.mechanic_diagnosis || "";

    clearMessage(diagnosisMessage);

    diagnosisDialog.showModal();

    mechanicDiagnosisInput.focus();
}

function closeDiagnosisDialog() {
    selectedIssueId = null;

    diagnosisForm.reset();

    clearMessage(diagnosisMessage);

    diagnosisDialog.close();
}

function openRepairDialog(issueId) {
    const issue = issues.find(
        (item) => item.id === issueId
    );

    if (
        !issue ||
        issue.status === "repaired"
    ) {
        return;
    }

    selectedIssueId = issueId;

    repairIssueTitle.textContent =
        issue.issue_title;

    repairVehicleName.textContent =
        getIssueVehicleName(issue);

    const today = new Date()
        .toISOString()
        .slice(0, 10);

    repairDateInput.max = today;
    repairDateInput.value = today;

    repairMileageInput.max =
        Number(issue.current_mileage);

    repairMileageInput.value =
        Number(issue.current_mileage);

    repairCostInput.value = "";
    repairProviderInput.value = "";
    resolutionNotesInput.value = "";

    clearMessage(repairMessage);

    repairDialog.showModal();
}

function closeRepairDialog() {
    selectedIssueId = null;

    repairForm.reset();

    clearMessage(repairMessage);

    repairDialog.close();
}

closeDiagnosisDialogButton.addEventListener(
    "click",
    closeDiagnosisDialog
);

cancelDiagnosisButton.addEventListener(
    "click",
    closeDiagnosisDialog
);

closeRepairDialogButton.addEventListener(
    "click",
    closeRepairDialog
);

cancelRepairButton.addEventListener(
    "click",
    closeRepairDialog
);

diagnosisForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const issue = getSelectedIssue();

        if (!issue) {
            return;
        }

        clearMessage(diagnosisMessage);

        const submitButton =
            diagnosisForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;

        submitButton.textContent =
            "Saving diagnosis...";

        try {
            const data =
                await window.apiRequest(
                    `/api/issues/${issue.id}/diagnosis`,
                    {
                        method: "PATCH",

                        body: JSON.stringify({
                            mechanicDiagnosis:
                                mechanicDiagnosisInput
                                    .value
                        })
                    }
                );

            replaceIssue(data.issue);

            closeDiagnosisDialog();

            renderIssues();
        } catch (error) {
            showMessage(
                diagnosisMessage,
                error.message
            );
        } finally {
            submitButton.disabled =
                false;

            submitButton.textContent =
                "Save diagnosis";
        }
    }
);

repairForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const issue = getSelectedIssue();

        if (!issue) {
            return;
        }

        clearMessage(repairMessage);

        const submitButton =
            repairForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;

        submitButton.textContent =
            "Completing repair...";

        const payload = {
            completedAt:
                repairDateInput.value,

            completedAtMileage:
                repairMileageInput.value,

            actualCost:
                repairCostInput.value,

            serviceProvider:
                repairProviderInput.value,

            resolutionNotes:
                resolutionNotesInput.value
        };

        try {
            const data =
                await window.apiRequest(
                    `/api/issues/${issue.id}/repair`,
                    {
                        method: "PATCH",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            replaceIssue(data.issue);

            closeRepairDialog();

            renderIssues();

            window.alert(data.message);
        } catch (error) {
            showMessage(
                repairMessage,
                error.message
            );
        } finally {
            submitButton.disabled =
                false;

            submitButton.textContent =
                "Complete repair";
        }
    }
);

async function deleteIssue(issueId) {
    const issue = issues.find(
        (item) =>
            item.id === issueId
    );

    if (!issue) {
        return;
    }

    const confirmed =
        window.confirm(
            `Delete "${issue.issue_title}"?\n\n` +
            `This issue record will be permanently removed.`
        );

    if (!confirmed) {
        return;
    }

    try {
        await window.apiRequest(
            `/api/issues/${issueId}`,
            {
                method: "DELETE"
            }
        );

        issues = issues.filter(
            (item) =>
                item.id !== issueId
        );

        renderIssues();
    } catch (error) {
        alert(error.message);
    }
}

async function loadHealthCenter() {
    try {
        const [
            userData,
            vehicleData,
            issueData
        ] = await Promise.all([
            window.apiRequest(
                "/api/auth/me"
            ),

            window.apiRequest(
                "/api/vehicles"
            ),

            window.apiRequest(
                "/api/issues"
            )
        ]);

        accountName.textContent =
            userData.user.full_name;

        vehicles =
            vehicleData.vehicles;

        issues =
            issueData.issues;

        populateVehicleSelections();

        updateRiskPreview();

        renderIssues();
    } catch (error) {
        window.handlePageLoadError(
            error,
            "Health center could not be loaded."
        );
    }
}

[
    categorySelect,
    severitySelect,
    warningLightSelect,
    canDriveNormallyInput,
    isWorseningInput
].forEach((element) => {
    element.addEventListener(
        "change",
        updateRiskPreview
    );
});

vehicleFilter.addEventListener(
    "change",
    renderIssues
);

statusFilter.addEventListener(
    "change",
    renderIssues
);

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
            "/login.html";
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

loadHealthCenter();
