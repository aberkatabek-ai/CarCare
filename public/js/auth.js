const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const messageElement = document.querySelector("#form-message");

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
        ? "Please wait..."
        : button.dataset.defaultText;
}

attachPasswordToggles();

if (loginForm) {
    const button = loginForm.querySelector('button[type="submit"]');
    button.dataset.defaultText = button.textContent;

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

            showMessage("Login successful.", "success");

            window.location.href = "/index.html";
        } catch (error) {
            showMessage(error.message);
        } finally {
            setSubmitting(loginForm, false);
        }
    });
}

if (registerForm) {
    const button = registerForm.querySelector('button[type="submit"]');
    button.dataset.defaultText = button.textContent;

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = registerForm.fullName.value.trim();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value;
        const passwordConfirmation =
            registerForm.passwordConfirmation.value;

        showMessage("");

        if (password !== passwordConfirmation) {
            showMessage("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            showMessage(
                "Password must contain at least 8 characters."
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
                "Your account was created successfully.",
                "success"
            );

            window.location.href = "/index.html";
        } catch (error) {
            showMessage(error.message);
        } finally {
            setSubmitting(registerForm, false);
        }
    });
}
