const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const messageElement = document.querySelector("#form-message");
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

function showMessage(message, type = "error") {
    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.className = `form-message ${type}`;
}

function setSubmitting(form, submitting) {
    const button = form.querySelector('button[type="submit"]');

    button.disabled = submitting;
    button.textContent = submitting
        ? t("Please wait...")
        : button.dataset.defaultText;
}

attachPasswordToggles();

if (loginForm) {
    const button = loginForm.querySelector('button[type="submit"]');
    button.dataset.defaultText = t("Log in");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;

        showMessage("");
        setSubmitting(loginForm, true);

        try {
            await window.apiRequest("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password
                })
            });

            showMessage(t("Login successful."), "success");

            window.location.href = "/";
        } catch (error) {
            showMessage(error.message);
        } finally {
            setSubmitting(loginForm, false);
        }
    });
}

if (registerForm) {
    const button = registerForm.querySelector('button[type="submit"]');
    button.dataset.defaultText = t("Create account");

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = registerForm.fullName.value.trim();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value;
        const passwordConfirmation =
            registerForm.passwordConfirmation.value;

        showMessage("");

        if (password !== passwordConfirmation) {
            showMessage(t("Passwords do not match."));
            return;
        }

        const passwordError =
            getPasswordValidationError(password);

        if (passwordError) {
            showMessage(
                `${t(passwordError)} ${t(passwordRequirementsMessage)}`
            );
            return;
        }

        setSubmitting(registerForm, true);

        try {
            await window.apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    fullName,
                    email,
                    password
                })
            });

            showMessage(
                t("Your account was created successfully."),
                "success"
            );

            window.location.href = "/";
        } catch (error) {
            showMessage(error.message);
        } finally {
            setSubmitting(registerForm, false);
        }
    });
}
