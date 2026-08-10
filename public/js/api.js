async function apiRequest(
    url,
    options = {}
) {
    const response = await fetch(
        url,
        {
            ...options,

            credentials:
                "same-origin",

            headers: {
                "Content-Type":
                    "application/json",

                ...(options.headers || {})
            }
        }
    );

    const data = await response
        .json()
        .catch(() => ({
            success: false,

            message:
                "The server returned an invalid response."
        }));

    if (!response.ok) {
        const error = new Error(
            data.message ||
            "Request failed."
        );

        error.status = response.status;
        error.payload = data;

        throw error;
    }

    return data;
}

function isUnauthorizedError(error) {
    return Number(error?.status) === 401;
}

function handlePageLoadError(
    error,
    fallbackMessage
) {
    console.error(error);

    if (isUnauthorizedError(error)) {
        window.location.href = "/login.html";
        return true;
    }

    if (fallbackMessage) {
        window.alert(
            `${fallbackMessage}\n\n${error.message}`
        );
    }

    return false;
}

const navigationItems = [
    {
        href: "/index.html",
        label: "Dashboard"
    },

    {
        href: "/maintenance.html",
        label: "Maintenance"
    },

    {
        href: "/health.html",
        label: "Health center"
    },

    {
        href: "/service-history.html",
        label: "Service history"
    },

    {
        href: "/documents.html",
        label: "Documents"
    },

    {
        href: "/settings.html",
        label: "Settings"
    },

    {
        href: "/costs.html",
        label: "Costs"
    }
];

function getCurrentPath() {
    const pathname =
        window.location.pathname;

    if (
        pathname === "/" ||
        pathname === ""
    ) {
        return "/index.html";
    }

    return pathname;
}

function ensureMobileNavigationToggle() {
    const header =
        window.document.querySelector(
            ".dashboard-header"
        );

    const headerContent =
        window.document.querySelector(
            ".dashboard-header-content"
        );

    const headerActions =
        window.document.querySelector(
            ".header-actions"
        );

    if (
        !header ||
        !headerContent ||
        !headerActions
    ) {
        return;
    }

    let toggleButton =
        headerContent.querySelector(
            ".nav-toggle"
        );

    if (!toggleButton) {
        toggleButton =
            window.document.createElement(
                "button"
            );

        toggleButton.type = "button";
        toggleButton.className = "nav-toggle";
        toggleButton.setAttribute(
            "aria-controls",
            "header-actions"
        );

        headerActions.id =
            headerActions.id ||
            "header-actions";

        headerContent.appendChild(
            toggleButton
        );
    }

    function syncMenuState(isOpen) {
        header.classList.toggle(
            "menu-open",
            isOpen
        );

        toggleButton.textContent = isOpen
            ? "Close"
            : "Menu";

        toggleButton.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );

        toggleButton.setAttribute(
            "aria-label",
            isOpen
                ? "Close navigation menu"
                : "Open navigation menu"
        );
    }

    if (!toggleButton.dataset.bound) {
        toggleButton.addEventListener(
            "click",
            () => {
                const isOpen =
                    !header.classList.contains(
                        "menu-open"
                    );

                syncMenuState(isOpen);
            }
        );

        headerActions.addEventListener(
            "click",
            (event) => {
                if (
                    event.target instanceof
                        window.HTMLAnchorElement &&
                    window.innerWidth <= 720
                ) {
                    syncMenuState(false);
                }
            }
        );

        window.addEventListener(
            "resize",
            () => {
                if (window.innerWidth > 720) {
                    syncMenuState(false);
                }
            }
        );

        toggleButton.dataset.bound =
            "true";
    }

    syncMenuState(false);
}

function enhanceNavigation() {
    const headerActions =
        window.document.querySelector(
            ".header-actions"
        );

    if (!headerActions) {
        return;
    }

    const logoutButton =
        headerActions.querySelector(
            "#logout-button"
        );

    navigationItems.forEach(
        (navigationItem) => {
            let link =
                headerActions.querySelector(
                    `a[href="${navigationItem.href}"]`
                );

            if (!link) {
                link =
                    window.document
                        .createElement(
                            "a"
                        );
            }

            link.href =
                navigationItem.href;

            link.className =
                "nav-link";

            link.textContent =
                navigationItem.label;

            headerActions.insertBefore(
                link,
                logoutButton || null
            );
        }
    );

    const currentPath =
        getCurrentPath();

    headerActions
        .querySelectorAll(
            ".nav-link"
        )
        .forEach((link) => {
            const linkPath =
                link.getAttribute(
                    "href"
                );

            const isActive =
                linkPath ===
                currentPath;

            link.classList.toggle(
                "active",
                isActive
            );

            if (isActive) {
                link.setAttribute(
                    "aria-current",
                    "page"
                );
            } else {
                link.removeAttribute(
                    "aria-current"
                );
            }
        });

    ensureMobileNavigationToggle();
}

window.apiRequest = apiRequest;
window.isUnauthorizedError =
    isUnauthorizedError;
window.handlePageLoadError =
    handlePageLoadError;

if (
    window.document.readyState ===
    "loading"
) {
    window.document.addEventListener(
        "DOMContentLoaded",
        enhanceNavigation
    );
} else {
    enhanceNavigation();
}
