const forgotPasswordForm = document.querySelector(
    "#forgot-password-form"
);
const resetPasswordForm = document.querySelector(
    "#reset-password-form"
);
const resetSection = document.querySelector(
    "#reset-section"
);
const forgotMessage = document.querySelector(
    "#forgot-message"
);
const resetMessage = document.querySelector(
    "#reset-message"
);
const t = (value) =>
    typeof window.translateAppText === "function"
        ? window.translateAppText(value)
        : value;
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

function attachPasswordToggles(root = document) {
    root.querySelectorAll("[data-password-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
            const wrapper = button.closest(
                ".password-input-wrapper"
            );
            const input =
                wrapper?.querySelector(
                    'input[type="password"], input[type="text"]'
                );

            if (!input) {
                return;
            }

            const shouldShow =
                input.type === "password";

            input.type = shouldShow
                ? "text"
                : "password";

            button.textContent = shouldShow
                ? t("Hide")
                : t("Show");

            button.setAttribute(
                "aria-label",
                shouldShow
                    ? t("Hide password")
                    : t("Show password")
            );

            button.setAttribute(
                "aria-pressed",
                shouldShow ? "true" : "false"
            );
        });
    });
}

function showFormMessage(
    element,
    message,
    type = "error"
) {
    if (!element) {
        return;
    }

    element.textContent = message;
    element.className = `form-message ${type}`;
}

function setSubmitting(form, submitting) {
    const button = form.querySelector(
        'button[type="submit"]'
    );

    button.disabled = submitting;
    button.textContent = submitting
        ? t("Please wait...")
        : button.dataset.defaultText;
}

function normalizeVerificationCodeInput() {
    if (!resetPasswordForm?.code) {
        return;
    }

    resetPasswordForm.code.addEventListener(
        "input",
        () => {
            resetPasswordForm.code.value =
                resetPasswordForm.code.value
                    .replace(/\D/g, "")
                    .slice(0, 6);
        }
    );
}

attachPasswordToggles();
normalizeVerificationCodeInput();

if (forgotPasswordForm) {
    const button =
        forgotPasswordForm.querySelector(
            'button[type="submit"]'
        );

    button.dataset.defaultText = t(
        "Send verification code"
    );

    forgotPasswordForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const email =
                forgotPasswordForm.email.value.trim();

            showFormMessage(forgotMessage, "");
            setSubmitting(
                forgotPasswordForm,
                true
            );

            try {
                const response =
                    await window.apiRequest(
                        "/api/auth/forgot-password",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                email
                            })
                        }
                    );

                resetSection.hidden = false;
                resetPasswordForm.email.value = email;
                resetPasswordForm.code.focus();

                showFormMessage(
                    forgotMessage,
                    response.debugCode
                        ? `${response.message} ${t("Verification code")}: ${response.debugCode}`
                        : response.message,
                    "success"
                );
            } catch (error) {
                showFormMessage(
                    forgotMessage,
                    error.message
                );
            } finally {
                setSubmitting(
                    forgotPasswordForm,
                    false
                );
            }
        }
    );
}

if (resetPasswordForm) {
    const button =
        resetPasswordForm.querySelector(
            'button[type="submit"]'
        );

    button.dataset.defaultText = t(
        "Reset password"
    );

    resetPasswordForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const email =
                resetPasswordForm.email.value.trim();
            const code =
                resetPasswordForm.code.value.trim();
            const newPassword =
                resetPasswordForm.newPassword.value;
            const confirmPassword =
                resetPasswordForm.confirmPassword.value;

            showFormMessage(resetMessage, "");

            if (newPassword !== confirmPassword) {
                showFormMessage(
                    resetMessage,
                    t("Passwords do not match.")
                );
                return;
            }

            if (code.length !== 6) {
                showFormMessage(
                    resetMessage,
                    t(
                        "Verification code must contain 6 digits."
                    )
                );
                return;
            }

            const passwordError =
                getPasswordValidationError(
                    newPassword,
                    t("New password")
                );

            if (passwordError) {
                showFormMessage(
                    resetMessage,
                    `${t(passwordError)} ${t(passwordRequirementsMessage)}`
                );
                return;
            }

            setSubmitting(
                resetPasswordForm,
                true
            );

            try {
                const response =
                    await window.apiRequest(
                        "/api/auth/reset-password",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                email,
                                code,
                                newPassword
                            })
                        }
                    );

                showFormMessage(
                    resetMessage,
                    response.message,
                    "success"
                );

                resetPasswordForm.reset();

                window.setTimeout(() => {
                    window.location.href =
                        "/login";
                }, 1200);
            } catch (error) {
                showFormMessage(
                    resetMessage,
                    error.message
                );
            } finally {
                setSubmitting(
                    resetPasswordForm,
                    false
                );
            }
        }
    );
}
