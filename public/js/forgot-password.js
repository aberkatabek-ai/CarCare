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
