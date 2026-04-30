/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{tsx,ts}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#00BD7D", hover: "#009E68", light: "#E6F9F2" },
        neutral: { 100: "#F3F4F6", 700: "#374151", 900: "#111827" },
        surface: "#FFFFFF",
        danger: "#DC2626",
        success: "#16A34A",
        warning: "#D97706",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        display: ["Oswald", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        perspective: "0 10px 15px -3px rgba(0,0,0,0.1)",
        layered: "0 20px 25px -5px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [],
}
