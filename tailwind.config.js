/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        glass: "0 10px 30px rgba(0,0,0,0.25)",
      },
      colors: {
        brand: {
          50: "#f6f8ff",
          100: "#eef1ff",
          200: "#d9e0ff",
          300: "#b8c5ff",
          400: "#8ea2ff",
          500: "#6c86ff",
          600: "#4f69f2",
          700: "#3e53c7",
          800: "#3344a0",
          900: "#2b3982",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}
