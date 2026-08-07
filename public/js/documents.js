const accountName = window.document.querySelector(
    "#account-name"
);

const logoutButton = window.document.querySelector(
    "#logout-button"
);

const documentForm = window.document.querySelector(
    "#document-form"
);

const documentFormHeading =
    window.document.querySelector(
        "#document-form-heading"
    );

const documentFormDescription =
    window.document.querySelector(
        "#document-form-description"
    );

const documentFormMessage =
    window.document.querySelector(
        "#document-form-message"
    );

const documentSubmitButton =
    window.document.querySelector(
        "#document-submit-button"
    );

const cancelDocumentEditButton =
    window.document.querySelector(
        "#cancel-document-edit"
    );

const vehicleSelect =
    window.document.querySelector(
        "#document-vehicle"
    );

const documentTypeSelect =
    window.document.querySelector(
        "#document-type"
    );

const titleInput =
    window.document.querySelector(
        "#document-title"
    );

const providerInput =
    window.document.querySelector(
        "#document-provider"
    );

const documentNumberInput =
    window.document.querySelector(
        "#document-number"
    );

const documentFileInput =
    window.document.querySelector(
        "#document-file"
    );

const documentFileHelp =
    window.document.querySelector(
        "#document-file-help"
    );

const startDateInput =
    window.document.querySelector(
        "#document-start-date"
    );

const expiryDateInput =
    window.document.querySelector(
        "#document-expiry-date"
    );

const reminderDaysInput =
    window.document.querySelector(
        "#reminder-days"
    );

const notesInput =
    window.document.querySelector(
        "#document-notes"
    );

const vehicleFilter =
    window.document.querySelector(
        "#document-vehicle-filter"
    );

const statusFilter =
    window.document.querySelector(
        "#document-status-filter"
    );

const documentList =
    window.document.querySelector(
        "#document-list"
    );

const passportList =
    window.document.querySelector(
        "#passport-list"
    );

const noVehicleWarning =
    window.document.querySelector(
        "#no-vehicle-warning"
    );

const totalDocumentCount =
    window.document.querySelector(
        "#total-document-count"
    );

const validDocumentCount =
    window.document.querySelector(
        "#valid-document-count"
    );

const dueSoonCount =
    window.document.querySelector(
        "#due-soon-count"
    );

const expiredDocumentCount =
    window.document.querySelector(
        "#expired-document-count"
    );

let vehicles = [];
let documentRecords = [];

let editingDocumentId = null;
let generatedTitle = "";
let uploadedFilePayload = null;

const documentTypeNames = {
    registration: "Vehicle registration",

    inspection: "Vehicle inspection",

    insurance: "Traffic insurance",

    casco:
        "Comprehensive insurance",

    emission:
        "Emission inspection",

    tax: "Vehicle tax",

    warranty: "Warranty",

    other: "Other"
};

const statusInformation = {
    valid: {
        label: "Valid"
    },

    due_soon: {
        label: "Due soon"
    },

    expired: {
        label: "Expired"
    }
};

const ownershipStatusInformation = {
    not_started: {
        label: "No plate"
    },

    unverified: {
        label: "Unverified"
    },

    verified: {
        label: "Verified"
    },

    failed: {
        label: "Needs retry"
    }
};

function createElement(
    tagName,
    className,
    text
) {
    const element =
        window.document.createElement(
            tagName
        );

    if (className) {
        element.className =
            className;
    }

    if (text !== undefined) {
        element.textContent =
            text;
    }

    return element;
}

function showMessage(
    message,
    type = "error"
) {
    documentFormMessage.textContent =
        message;

    documentFormMessage.className =
        `form-message ${type}`;
}

function clearMessage() {
    documentFormMessage.textContent =
        "";

    documentFormMessage.className =
        "form-message";
}

function getDisplayName(user) {
    return (
        user.preferred_name ||
        user.full_name ||
        "Driver"
    );
}

function formatDate(value) {
    if (!value) {
        return "Not specified";
    }

    const normalizedValue =
        String(value).slice(0, 10);

    const date = new Date(
        `${normalizedValue}T00:00:00`
    );

    if (
        Number.isNaN(date.getTime())
    ) {
        return "Not specified";
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}

function getVehicleName(vehicle) {
    if (vehicle.nickname) {
        return (
            `${vehicle.nickname} — ` +
            `${vehicle.brand} ` +
            `${vehicle.model}`
        );
    }

    return (
        `${vehicle.brand} ` +
        `${vehicle.model}`
    );
}

function getDocumentVehicleName(
    documentRecord
) {
    if (documentRecord.nickname) {
        return (
            `${documentRecord.nickname} — ` +
            `${documentRecord.brand} ` +
            `${documentRecord.model}`
        );
    }

    return (
        `${documentRecord.brand} ` +
        `${documentRecord.model}`
    );
}

function getDeadlineMessage(
    documentRecord
) {
    const remainingDays =
        Number(
            documentRecord
                .days_remaining
        );

    if (
        documentRecord
            .renewal_status ===
        "expired"
    ) {
        const expiredDays =
            Math.abs(remainingDays);

        if (expiredDays === 0) {
            return "Expires today";
        }

        if (expiredDays === 1) {
            return "Expired 1 day ago";
        }

        return (
            `Expired ${expiredDays} ` +
            `days ago`
        );
    }

    if (remainingDays === 0) {
        return "Expires today";
    }

    if (remainingDays === 1) {
        return "1 day remaining";
    }

    return (
        `${remainingDays} ` +
        `days remaining`
    );
}

function createInformation(
    label,
    value
) {
    const information =
        createElement(
            "div",
            "document-information"
        );

    information.append(
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

    return information;
}

function getOwnershipStatusLabel(record) {
    return (
        ownershipStatusInformation[
            record.ownership_status
        ]?.label || "Unknown"
    );
}

function populateVehicleSelections() {
    vehicleSelect.innerHTML = "";
    vehicleFilter.innerHTML = "";

    const defaultOption =
        window.document.createElement(
            "option"
        );

    defaultOption.value = "";

    defaultOption.textContent =
        "Select a vehicle";

    vehicleSelect.append(
        defaultOption
    );

    const allOption =
        window.document.createElement(
            "option"
        );

    allOption.value = "all";

    allOption.textContent =
        "All vehicles";

    vehicleFilter.append(
        allOption
    );

    vehicles.forEach((vehicle) => {
        const formOption =
            window.document
                .createElement(
                    "option"
                );

        formOption.value =
            String(vehicle.id);

        formOption.textContent =
            getVehicleName(vehicle);

        vehicleSelect.append(
            formOption
        );

        const filterOption =
            window.document
                .createElement(
                    "option"
                );

        filterOption.value =
            String(vehicle.id);

        filterOption.textContent =
            getVehicleName(vehicle);

        vehicleFilter.append(
            filterOption
        );
    });

    const hasVehicles =
        vehicles.length > 0;

    documentForm
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
    totalDocumentCount.textContent =
        String(
            documentRecords.length
        );

    const validRecords =
        documentRecords.filter(
            (documentRecord) =>
                documentRecord
                    .renewal_status ===
                "valid"
        );

    const dueSoonRecords =
        documentRecords.filter(
            (documentRecord) =>
                documentRecord
                    .renewal_status ===
                "due_soon"
        );

    const expiredRecords =
        documentRecords.filter(
            (documentRecord) =>
                documentRecord
                    .renewal_status ===
                "expired"
        );

    validDocumentCount.textContent =
        String(validRecords.length);

    dueSoonCount.textContent =
        String(dueSoonRecords.length);

    expiredDocumentCount.textContent =
        String(expiredRecords.length);
}

function createEmptyState() {
    const emptyState =
        createElement(
            "div",
            "document-empty-state"
        );

    emptyState.append(
        createElement(
            "div",
            "document-empty-icon",
            "📄"
        ),

        createElement(
            "h3",
            "",
            "No documents yet"
        ),

        createElement(
            "p",
            "",
            "Add your first stored document and set its renewal alert."
        )
    );

    return emptyState;
}

function createPassportEmptyState() {
    const emptyState =
        createElement(
            "div",
            "document-empty-state"
        );

    emptyState.append(
        createElement(
            "div",
            "document-empty-icon",
            "P"
        ),

        createElement(
            "h3",
            "",
            "No vehicle passports"
        ),

        createElement(
            "p",
            "",
            "Add a vehicle from the dashboard to open its passport from the document center."
        )
    );

    return emptyState;
}

function renderPassports() {
    passportList.innerHTML = "";

    const selectedVehicle =
        vehicleFilter.value;

    const filteredVehicles =
        vehicles.filter((vehicle) =>
            selectedVehicle === "all"
                ? true
                : String(vehicle.id) ===
                    selectedVehicle
        );

    if (filteredVehicles.length === 0) {
        passportList.append(
            createPassportEmptyState()
        );

        return;
    }

    const passportGrid =
        createElement(
            "div",
            "passport-preview-grid"
        );

    filteredVehicles.forEach((vehicle) => {
        const passportCard =
            createElement(
                "article",
                "passport-preview-card"
            );

        const title =
            vehicle.nickname ||
            `${vehicle.brand} ${vehicle.model}`;

        const subtitle =
            vehicle.nickname
                ? `${vehicle.brand} ${vehicle.model}`
                : "Vehicle passport";

        const heading =
            createElement(
                "div",
                "passport-preview-heading"
            );

        const headingText =
            window.document.createElement(
                "div"
            );

        headingText.append(
            createElement(
                "span",
                "document-type",
                "Vehicle passport"
            ),
            createElement(
                "h3",
                "",
                title
            ),
            createElement(
                "p",
                "document-vehicle-name",
                subtitle
            )
        );

        const passportBadge =
            createElement(
                "span",
                "passport-preview-badge",
                "Live report"
            );

        heading.append(
            headingText,
            passportBadge
        );

        const details =
            createElement(
                "div",
                "document-information-grid"
            );

        details.append(
            createInformation(
                "Model year",
                vehicle.model_year ||
                    "Not specified"
            ),
            createInformation(
                "License plate",
                vehicle.license_plate ||
                    "Not specified"
            ),
            createInformation(
                "Ownership",
                getOwnershipStatusLabel(vehicle)
            ),
            createInformation(
                "Mileage",
                `${Number(
                    vehicle.current_mileage || 0
                ).toLocaleString("en-US")} km`
            ),
            createInformation(
                "Nickname",
                vehicle.nickname ||
                    "Not specified"
            )
        );

        const actions =
            createElement(
                "div",
                "document-actions passport-preview-actions"
            );

        const viewPassportButton =
            window.document.createElement(
                "button"
            );

        viewPassportButton.type =
            "button";

        viewPassportButton.className =
            "primary-button passport-open-button";

        viewPassportButton.textContent =
            "View passport";

        viewPassportButton.addEventListener(
            "click",
            () => {
                window.location.href =
                    `/vehicle.html?id=${vehicle.id}`;
            }
        );

        const openVehicleButton =
            window.document.createElement(
                "button"
            );

        openVehicleButton.type =
            "button";

        openVehicleButton.className =
            "secondary-button";

        openVehicleButton.textContent =
            "Open vehicle";

        openVehicleButton.addEventListener(
            "click",
            () => {
                window.location.href =
                    `/vehicle.html?id=${vehicle.id}`;
            }
        );

        actions.append(
            viewPassportButton,
            openVehicleButton
        );

        passportCard.append(
            heading,
            details,
            actions
        );

        passportGrid.append(
            passportCard
        );
    });

    passportList.append(
        passportGrid
    );
}

function renderDocuments() {
    documentList.innerHTML = "";

    renderStatistics();
    renderPassports();

    const selectedVehicle =
        vehicleFilter.value;

    const selectedStatus =
        statusFilter.value;

    const filteredDocuments =
        documentRecords
            .filter(
                (documentRecord) => {
                    const matchesVehicle =
                        selectedVehicle ===
                            "all" ||
                        String(
                            documentRecord
                                .vehicle_id
                        ) ===
                            selectedVehicle;

                    const matchesStatus =
                        selectedStatus ===
                            "all" ||
                        documentRecord
                            .renewal_status ===
                            selectedStatus;

                    return (
                        matchesVehicle &&
                        matchesStatus
                    );
                }
            )
            .sort(
                (
                    firstDocument,
                    secondDocument
                ) =>
                    Number(
                        firstDocument
                            .days_remaining
                    ) -
                    Number(
                        secondDocument
                            .days_remaining
                    )
            );

    if (
        filteredDocuments.length === 0
    ) {
        documentList.append(
            createEmptyState()
        );

        return;
    }

    const grid = createElement(
        "div",
        "document-grid"
    );

    filteredDocuments.forEach(
        (documentRecord) => {
            const status =
                documentRecord
                    .renewal_status;

            const statusDetails =
                statusInformation[
                    status
                ] ||
                statusInformation.valid;

            const card = createElement(
                "article",
                `document-card ` +
                    `status-${status}`
            );

            const heading =
                createElement(
                    "div",
                    "document-card-heading"
                );

            const titleArea =
                window.document
                    .createElement(
                        "div"
                    );

            titleArea.append(
                createElement(
                    "span",
                    "document-type",
                    documentTypeNames[
                        documentRecord
                            .document_type
                    ] || "Other"
                ),

                createElement(
                    "h3",
                    "",
                    documentRecord.title
                ),

                createElement(
                    "p",
                    "document-vehicle-name",
                    getDocumentVehicleName(
                        documentRecord
                    )
                )
            );

            const statusBadge =
                createElement(
                    "span",
                    `document-status-badge ` +
                        `${status}`,
                    statusDetails.label
                );

            heading.append(
                titleArea,
                statusBadge
            );

            const deadline =
                createElement(
                    "div",
                    `document-deadline ` +
                        `${status}`
                );

            deadline.append(
                createElement(
                    "span",
                    "",
                    `Expires ` +
                        `${formatDate(
                            documentRecord
                                .expiry_date
                        )}`
                ),

                createElement(
                    "strong",
                    "",
                    getDeadlineMessage(
                        documentRecord
                    )
                )
            );

            const informationGrid =
                createElement(
                    "div",
                    "document-information-grid"
                );

            informationGrid.append(
                createInformation(
                    "Ownership",
                    getOwnershipStatusLabel(
                        documentRecord
                    )
                ),
                createInformation(
                    "Provider",
                    documentRecord
                        .provider ||
                        "Not specified"
                ),

                createInformation(
                    "Document number",
                    documentRecord
                        .document_number ||
                        "Not specified"
                ),

                createInformation(
                    "Start date",
                    formatDate(
                        documentRecord
                            .start_date
                    )
                ),

                createInformation(
                    "Reminder",
                    `${documentRecord
                        .reminder_days} ` +
                        `days before`
                )
            );

            card.append(
                heading,
                deadline,
                informationGrid
            );

            if (
                documentRecord.original_file_name
            ) {
                const fileBox =
                    createElement(
                        "div",
                        "document-file-box"
                    );

                const fileLink =
                    createElement(
                        "a",
                        "document-file-link",
                        `Download file: ${documentRecord.original_file_name}`
                    );

                fileLink.href =
                    `/api/documents/${documentRecord.id}/file`;

                fileBox.append(fileLink);
                card.append(fileBox);
            }

            if (documentRecord.notes) {
                const notes =
                    createElement(
                        "div",
                        "document-notes"
                    );

                notes.append(
                    createElement(
                        "span",
                        "",
                        "Notes"
                    ),

                    createElement(
                        "p",
                        "",
                        documentRecord
                            .notes
                    )
                );

                card.append(notes);
            }

            const footer =
                createElement(
                    "div",
                    "document-card-footer"
                );

            const actions =
                createElement(
                    "div",
                    "document-actions"
                );

            const viewVehicleButton =
                window.document
                    .createElement(
                        "button"
                    );

            viewVehicleButton.type =
                "button";

            viewVehicleButton.className =
                "secondary-button";

            viewVehicleButton.textContent =
                "View vehicle";

            viewVehicleButton
                .addEventListener(
                    "click",
                    () => {
                        window.location.href =
                            `/vehicle.html?id=` +
                            `${documentRecord
                                .vehicle_id}`;
                    }
                );

            const editButton =
                window.document
                    .createElement(
                        "button"
                    );

            editButton.type =
                "button";

            editButton.className =
                "secondary-button";

            editButton.textContent =
                "Edit";

            editButton.addEventListener(
                "click",
                () => {
                    startEditingDocument(
                        documentRecord.id
                    );
                }
            );

            if (
                documentRecord.document_type ===
                    "registration" &&
                documentRecord.original_file_name &&
                documentRecord.license_plate
            ) {
                const verifyButton =
                    window.document.createElement(
                        "button"
                    );

                verifyButton.type =
                    "button";

                verifyButton.className =
                    "primary-button";

                verifyButton.textContent =
                    "Verify ownership";

                verifyButton.addEventListener(
                    "click",
                    () => {
                        verifyOwnershipFromDocument(
                            documentRecord
                        );
                    }
                );

                actions.append(verifyButton);
            }

            const deleteButton =
                window.document
                    .createElement(
                        "button"
                    );

            deleteButton.type =
                "button";

            deleteButton.className =
                "danger-button";

            deleteButton.textContent =
                "Delete";

            deleteButton.addEventListener(
                "click",
                () => {
                    deleteDocumentRecord(
                        documentRecord.id
                    );
                }
            );

            actions.append(
                viewVehicleButton
            );

            if (
                documentRecord.vehicle_status ===
                    "active" ||
                !documentRecord.vehicle_status
            ) {
                actions.append(editButton);
            }

            actions.append(deleteButton);

            footer.append(actions);

            card.append(footer);

            grid.append(card);
        }
    );

    documentList.append(grid);
}

function resetDocumentForm() {
    editingDocumentId = null;

    documentForm.reset();

    reminderDaysInput.value =
        "30";

    startDateInput.removeAttribute(
        "max"
    );

    documentFormHeading.textContent =
        "Add a document record";

    documentFormDescription.textContent =
        "Save the document itself here, then configure when CarCare should warn you about renewal.";

    documentSubmitButton.textContent =
        "Save document";

    cancelDocumentEditButton.hidden =
        true;

    generatedTitle = "";
    uploadedFilePayload = null;
    documentFileHelp.textContent =
        "No file selected.";

    clearMessage();
}

function startEditingDocument(
    documentId
) {
    const selectedDocument =
        documentRecords.find(
            (documentRecord) =>
                documentRecord.id ===
                documentId
        );

    if (!selectedDocument) {
        return;
    }

    editingDocumentId =
        documentId;

    vehicleSelect.value =
        String(
            selectedDocument
                .vehicle_id
        );

    documentTypeSelect.value =
        selectedDocument
            .document_type;

    titleInput.value =
        selectedDocument.title;

    providerInput.value =
        selectedDocument
            .provider || "";

    documentNumberInput.value =
        selectedDocument
            .document_number || "";

    startDateInput.value =
        selectedDocument
            .start_date || "";

    expiryDateInput.value =
        selectedDocument
            .expiry_date || "";

    reminderDaysInput.value =
        String(
            selectedDocument
                .reminder_days
        );

    notesInput.value =
        selectedDocument.notes || "";

    if (expiryDateInput.value) {
        startDateInput.max =
            expiryDateInput.value;
    }

    documentFormHeading.textContent =
        "Update document record";

    documentFormDescription.textContent =
        "Change the document details or adjust its renewal alert settings.";

    documentSubmitButton.textContent =
        "Save changes";

    cancelDocumentEditButton.hidden =
        false;

    generatedTitle = "";
    uploadedFilePayload = null;
    documentFileHelp.textContent =
        selectedDocument.original_file_name
            ? `Current file: ${selectedDocument.original_file_name}`
            : "No file selected.";

    clearMessage();

    documentForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    titleInput.focus();
}

function replaceDocumentRecord(
    updatedDocument
) {
    documentRecords =
        documentRecords.map(
            (documentRecord) =>
                documentRecord.id ===
                updatedDocument.id
                    ? updatedDocument
                    : documentRecord
        );
}

async function verifyOwnershipFromDocument(
    documentRecord
) {
    const confirmed =
        window.confirm(
            `Run OCR ownership verification for ${getDocumentVehicleName(
                documentRecord
            )}?\n\nUse a clear registration image for the best result.`
        );

    if (!confirmed) {
        return;
    }

    try {
        const data =
            await window.apiRequest(
                `/api/vehicles/${documentRecord.vehicle_id}/verify-ownership`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        documentId:
                            documentRecord.id
                    })
                }
            );

        vehicles = vehicles.map((vehicle) =>
            vehicle.id === data.vehicle.id
                ? {
                    ...vehicle,
                    ...data.vehicle
                }
                : vehicle
        );

        documentRecords = documentRecords.map(
            (record) =>
                record.vehicle_id ===
                documentRecord.vehicle_id
                    ? {
                        ...record,
                        ownership_status:
                            data.vehicle
                                .ownership_status
                    }
                    : record
        );

        renderDocuments();

        showMessage(
            `${data.message} Score: ${data.verification.score}`,
            data.verification.status ===
                "verified"
                ? "success"
                : "error"
        );
    } catch (error) {
        showMessage(error.message);
    }
}

async function deleteDocumentRecord(
    documentId
) {
    const selectedDocument =
        documentRecords.find(
            (documentRecord) =>
                documentRecord.id ===
                documentId
        );

    if (!selectedDocument) {
        return;
    }

    const confirmed =
        window.confirm(
            `Delete "${selectedDocument.title}"?\n\n` +
            `This document record and its renewal alert will be permanently removed.`
        );

    if (!confirmed) {
        return;
    }

    try {
        await window.apiRequest(
            `/api/documents/` +
                `${documentId}`,
            {
                method: "DELETE"
            }
        );

        documentRecords =
            documentRecords.filter(
                (documentRecord) =>
                    documentRecord.id !==
                    documentId
            );

        if (
            editingDocumentId ===
            documentId
        ) {
            resetDocumentForm();
        }

        renderDocuments();
    } catch (error) {
        window.alert(
            error.message
        );
    }
}

documentTypeSelect.addEventListener(
    "change",
    () => {
        const selectedType =
            documentTypeSelect.value;

        const suggestedTitle =
            documentTypeNames[
                selectedType
            ] || "";

        if (
            !titleInput.value.trim() ||
            titleInput.value ===
                generatedTitle
        ) {
            titleInput.value =
                suggestedTitle;

            generatedTitle =
                suggestedTitle;
        }
    }
);

documentFileInput.addEventListener(
    "change",
    async () => {
        const [selectedFile] =
            documentFileInput.files || [];

        uploadedFilePayload = null;

        if (!selectedFile) {
            documentFileHelp.textContent =
                editingDocumentId === null
                    ? "No file selected."
                    : "No new file selected. Existing file will be kept.";
            return;
        }

        if (
            selectedFile.size >
            5 * 1024 * 1024
        ) {
            documentFileInput.value = "";

            showMessage(
                "Uploaded file must be 5 MB or smaller."
            );

            documentFileHelp.textContent =
                "No file selected.";

            return;
        }

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
                                    "Selected file could not be read."
                                )
                            );

                            return;
                        }

                        resolve(base64);
                    };

                    reader.onerror = () => {
                        reject(
                            new Error(
                                "Selected file could not be read."
                            )
                        );
                    };

                    reader.readAsDataURL(
                        selectedFile
                    );
                }
            ).catch((error) => {
                showMessage(
                    error.message
                );

                return null;
            });

        if (!contentBase64) {
            documentFileInput.value = "";
            documentFileHelp.textContent =
                "No file selected.";
            return;
        }

        uploadedFilePayload = {
            name: selectedFile.name,
            type: selectedFile.type,
            contentBase64
        };

        documentFileHelp.textContent =
            `${selectedFile.name} selected (${Math.ceil(
                selectedFile.size / 1024
            )} KB)`;
    }
);

expiryDateInput.addEventListener(
    "change",
    () => {
        if (expiryDateInput.value) {
            startDateInput.max =
                expiryDateInput.value;
        } else {
            startDateInput
                .removeAttribute(
                    "max"
                );
        }
    }
);

cancelDocumentEditButton
    .addEventListener(
        "click",
        resetDocumentForm
    );

documentForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        clearMessage();

        if (
            startDateInput.value &&
            expiryDateInput.value &&
            startDateInput.value >
                expiryDateInput.value
        ) {
            showMessage(
                "Start date cannot be later than the expiry date."
            );

            return;
        }

        const formData =
            new FormData(
                documentForm
            );

        const payload = {
            vehicleId:
                formData.get(
                    "vehicleId"
                ),

            documentType:
                formData.get(
                    "documentType"
                ),

            title:
                formData.get(
                    "title"
                ),

            provider:
                formData.get(
                    "provider"
                ),

            documentNumber:
                formData.get(
                    "documentNumber"
                ),

            startDate:
                formData.get(
                    "startDate"
                ),

            expiryDate:
                formData.get(
                    "expiryDate"
                ),

            reminderDays:
                formData.get(
                    "reminderDays"
                ),

            notes:
                formData.get(
                    "notes"
                ),

            file: uploadedFilePayload
        };

        const isEditing =
            editingDocumentId !==
            null;

        const requestUrl =
            isEditing
                ? `/api/documents/` +
                    `${editingDocumentId}`
                : "/api/documents";

        const requestMethod =
            isEditing
                ? "PATCH"
                : "POST";

        documentSubmitButton.disabled =
            true;

        documentSubmitButton.textContent =
            isEditing
                ? "Saving changes..."
                : "Saving document...";

        try {
            const data =
                await window.apiRequest(
                    requestUrl,
                    {
                        method:
                            requestMethod,

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            if (isEditing) {
                replaceDocumentRecord(
                    data.document
                );
            } else {
                documentRecords.push(
                    data.document
                );
            }

            resetDocumentForm();

            renderDocuments();

            showMessage(
                data.message,
                "success"
            );
        } catch (error) {
            showMessage(
                error.message
            );
        } finally {
            documentSubmitButton.disabled =
                false;

            documentSubmitButton.textContent =
                editingDocumentId ===
                null
                    ? "Save document"
                    : "Save changes";
        }
    }
);

vehicleFilter.addEventListener(
    "change",
    renderDocuments
);

statusFilter.addEventListener(
    "change",
    renderDocuments
);

async function loadDocumentCenter() {
    try {
        const [
            userData,
            vehicleData,
            documentData
        ] = await Promise.all([
            window.apiRequest(
                "/api/auth/me"
            ),

            window.apiRequest(
                "/api/vehicles"
            ),

            window.apiRequest(
                "/api/documents"
            )
        ]);

        accountName.textContent =
            getDisplayName(
                userData.user
            );

        vehicles =
            vehicleData.vehicles;

        documentRecords =
            documentData.documents;

        populateVehicleSelections();

        renderDocuments();
    } catch (error) {
        window.handlePageLoadError(
            error,
            "Document center could not be loaded."
        );
    }
}

async function logout() {
    logoutButton.disabled =
        true;

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
        logoutButton.disabled =
            false;

        logoutButton.textContent =
            "Log out";

        window.alert(
            error.message
        );
    }
}

logoutButton.addEventListener(
    "click",
    logout
);

loadDocumentCenter();
