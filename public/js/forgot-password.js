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
                ? "Hide"
                : "Show";

            button.setAttribute(
                "aria-label",
                shouldShow
                    ? "Hide password"
                    : "Show password"
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
        ? "Please wait..."
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

    button.dataset.defaultText =
        button.textContent;

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
                        ? `SMTP is not configured yet. Development code: ${response.debugCode}`
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

    button.dataset.defaultText =
        button.textContent;

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
                    "Passwords do not match."
                );
                return;
            }

            if (code.length !== 6) {
                showFormMessage(
                    resetMessage,
                    "Verification code must contain 6 digits."
                );
                return;
            }

            if (newPassword.length < 8) {
                showFormMessage(
                    resetMessage,
                    "New password must contain at least 8 characters."
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
                        "/login.html";
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
