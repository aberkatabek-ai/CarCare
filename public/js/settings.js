(function initializeSettingsPage() {
const logoutButton = document.querySelector(
    "#logout-button"
);

const settingsAccountBadge =
    document.querySelector(
        "#settings-account-badge"
    );

const profileForm = document.querySelector(
    "#profile-form"
);

const passwordForm = document.querySelector(
    "#password-form"
);

const profileMessage = document.querySelector(
    "#profile-message"
);

const passwordMessage = document.querySelector(
    "#password-message"
);

const reminderSettingsForm = document.querySelector(
    "#reminder-settings-form"
);

const remindersEnabledInput = document.querySelector(
    "#reminders-enabled"
);

const reminderSettingsMessage = document.querySelector(
    "#reminder-settings-message"
);
const deleteAccountForm = document.querySelector(
    "#delete-account-form"
);
const deleteAccountMessage = document.querySelector(
    "#delete-account-message"
);
const deleteAccountConfirmationInput =
    document.querySelector(
        "#delete-account-confirmation"
    );
const passwordRequirementsMessage =
    "Use at least 8 characters, including uppercase, lowercase, a number, and a special character, with no spaces.";

function getPasswordValidationError(
    password,
    label = "Password"
) {
    if (password.length < 8) {
        return `${label} must contain at least 8 characters.`;
    }

    if (/\s/.test(password)) {
        return `${label} cannot contain spaces.`;
    }

    if (!/[A-Z]/.test(password)) {
        return `${label} must contain at least one uppercase letter.`;
    }

    if (!/[a-z]/.test(password)) {
        return `${label} must contain at least one lowercase letter.`;
    }

    if (!/\d/.test(password)) {
        return `${label} must contain at least one number.`;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return `${label} must contain at least one special character.`;
    }

    return null;
}
})();

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

function getDisplayName(user) {
    return (
        user.preferred_name ||
        user.full_name ||
        "Driver"
    );
}

async function loadSettings() {
    try {
        const data = await window.apiRequest(
            "/api/auth/me"
        );

        const user = data.user;

        settingsAccountBadge.textContent =
            `${getDisplayName(user)} • ${user.email}`;

        profileForm.elements.fullName.value =
            user.full_name || "";

        profileForm.elements.preferredName.value =
            user.preferred_name || "";

        profileForm.elements.email.value =
            user.email || "";

        if (remindersEnabledInput) {
            remindersEnabledInput.checked =
                user.reminders_enabled !== false;
        }
    } catch (error) {
        window.handlePageLoadError(
            error,
            "Settings page could not be loaded."
        );
    }
}

profileForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();
        clearMessage(profileMessage);

        const submitButton =
            profileForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;
        submitButton.textContent =
            "Saving...";

        const formData = new FormData(
            profileForm
        );

        try {
            const data =
                await window.apiRequest(
                    "/api/auth/profile",
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            fullName:
                                formData.get(
                                    "fullName"
                                ),
                            preferredName:
                                formData.get(
                                    "preferredName"
                                ),
                            email:
                                formData.get(
                                    "email"
                                )
                        })
                    }
                );

            settingsAccountBadge.textContent =
                `${getDisplayName(
                    data.user
                )} • ${data.user.email}`;

            showMessage(
                profileMessage,
                data.message,
                "success"
            );
        } catch (error) {
            showMessage(
                profileMessage,
                error.message
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent =
                "Save profile";
        }
    }
);

passwordForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();
        clearMessage(passwordMessage);

        const formData = new FormData(
            passwordForm
        );

        if (
            formData.get("newPassword") !==
            formData.get("confirmPassword")
        ) {
            showMessage(
                passwordMessage,
                "New password and confirmation do not match."
            );

            return;
        }

        const passwordError =
            getPasswordValidationError(
                String(formData.get("newPassword") || ""),
                "New password"
            );

        if (passwordError) {
            showMessage(
                passwordMessage,
                `${passwordError} ${passwordRequirementsMessage}`
            );
            return;
        }

        const submitButton =
            passwordForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;
        submitButton.textContent =
            "Updating...";

        try {
            const data =
                await window.apiRequest(
                    "/api/auth/password",
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            currentPassword:
                                formData.get(
                                    "currentPassword"
                                ),
                            newPassword:
                                formData.get(
                                    "newPassword"
                                )
                        })
                    }
                );

            passwordForm.reset();

            showMessage(
                passwordMessage,
                data.message,
                "success"
            );
        } catch (error) {
            showMessage(
                passwordMessage,
                error.message
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent =
                "Update password";
        }
    }
);

if (reminderSettingsForm) {
    reminderSettingsForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();
            clearMessage(
                reminderSettingsMessage
            );

            const submitButton =
                reminderSettingsForm.querySelector(
                    'button[type="submit"]'
                );

            submitButton.disabled = true;
            submitButton.textContent =
                "Saving...";

            try {
                const data =
                    await window.apiRequest(
                        "/api/auth/reminder-settings",
                        {
                            method: "PATCH",
                            body: JSON.stringify({
                                remindersEnabled:
                                    remindersEnabledInput.checked
                            })
                        }
                    );

                remindersEnabledInput.checked =
                    data.user.reminders_enabled !==
                    false;

                showMessage(
                    reminderSettingsMessage,
                    data.message,
                    "success"
                );
            } catch (error) {
                showMessage(
                    reminderSettingsMessage,
                    error.message
                );
            } finally {
                submitButton.disabled = false;
                submitButton.textContent =
                    "Save reminder settings";
            }
        }
    );
}

logoutButton.addEventListener(
    "click",
    async () => {
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

            window.alert(error.message);
        }
    }
);

loadSettings();

if (deleteAccountForm) {
    deleteAccountForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();
            clearMessage(
                deleteAccountMessage
            );

            const confirmation =
                window.confirm(
                    "Delete your account permanently? This will remove all vehicles, documents and account history."
                );

            if (!confirmation) {
                return;
            }

            const submitButton =
                deleteAccountForm.querySelector(
                    'button[type="submit"]'
                );

            const formData = new FormData(
                deleteAccountForm
            );

            if (
                !deleteAccountConfirmationInput ||
                !deleteAccountConfirmationInput.checked
            ) {
                showMessage(
                    deleteAccountMessage,
                    "You must confirm that account deletion is permanent."
                );
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent =
                "Deleting...";

            try {
                const data =
                    await window.apiRequest(
                        "/api/auth/account",
                        {
                            method: "DELETE",
                            body: JSON.stringify({
                                currentPassword:
                                    formData.get(
                                        "currentPassword"
                                    )
                            })
                        }
                    );

                window.alert(data.message);
                window.location.href =
                    "/register.html";
            } catch (error) {
                showMessage(
                    deleteAccountMessage,
                    error.message
                );
            } finally {
                submitButton.disabled = false;
                submitButton.textContent =
                    "Delete account";
            }
        }
    );
}
