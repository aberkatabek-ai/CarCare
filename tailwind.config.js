/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./public/**/*.html",
        "./public/**/*.js",
        "./src/**/*.js"
    ],
    theme: {
        extend: {
            colors: {
                canvas: "#f8f4eb",
                surface: "#fff8ec",
                ink: "#1f2a2a",
                accent: {
                    DEFAULT: "#254f46",
                    soft: "#d9eadf",
                    strong: "#16352f"
                },
                border: "#cbbfa8",
                sand: "#efe4cf"
            },
            fontFamily: {
                sans: [
                    "\"Segoe UI\"",
                    "system-ui",
                    "sans-serif"
                ]
            },
            boxShadow: {
                panel: "0 18px 36px rgba(33, 28, 18, 0.10)"
            },
            borderRadius: {
                panel: "24px"
            }
        }
    },
    plugins: []
};
