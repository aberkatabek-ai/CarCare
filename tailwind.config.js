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
                canvas: "#f3ede2",
                surface: "#fbf7ef",
                ink: "#1d2528",
                accent: {
                    DEFAULT: "#23463f",
                    soft: "#dde6dd",
                    strong: "#162f2a"
                },
                border: "#cdbfa8",
                sand: "#ece2d0"
            },
            fontFamily: {
                sans: [
                    "\"Aptos\"",
                    "\"Segoe UI\"",
                    "system-ui",
                    "sans-serif"
                ],
                display: [
                    "\"Iowan Old Style\"",
                    "\"Palatino Linotype\"",
                    "\"Book Antiqua\"",
                    "Georgia",
                    "serif"
                ]
            },
            boxShadow: {
                panel: "0 22px 46px rgba(31, 27, 18, 0.11)"
            },
            borderRadius: {
                panel: "24px"
            }
        }
    },
    plugins: []
};
