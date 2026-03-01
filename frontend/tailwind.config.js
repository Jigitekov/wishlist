/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#fff1f3", 100: "#ffe4e8", 200: "#ffcdd5", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48" },
        warm: { 50: "#fffbeb", 400: "#fbbf24", 500: "#f59e0b" }
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
    },
  },
  plugins: [],
}
