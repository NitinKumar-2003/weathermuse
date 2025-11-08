/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // 🌫️ Custom shadows and blur
      boxShadow: {
        glass: "0 10px 30px rgba(0,0,0,0.25)",
      },
      backdropBlur: {
        xs: "2px",
      },

      // 🎨 Brand color palette
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

      // 🎬 Keyframe animations for WeatherMuse scenes
      keyframes: {
        moveClouds: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(120vw)" },
        },
        orbit: {
          "0%": { transform: "translateX(-50%) rotate(0deg)" },
          "100%": { transform: "translateX(-50%) rotate(360deg)" },
        },
        birdFlap: {
          "0%, 100%": { transform: "rotate(45deg)" },
          "50%": { transform: "rotate(35deg)" },
        },
        flyRight: {
          "0%": { transform: "translateX(-10vw) translateY(0)" },
          "100%": { transform: "translateX(120vw) translateY(-18vh)" },
        },
        owlBlink: {
          "0%, 90%, 100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(0.1)" },
        },
      },

      // 🌀 Named animation utilities
      animation: {
        moveClouds: "moveClouds 60s linear infinite",
        orbit: "orbit 80s linear infinite",
        birdFlap: "birdFlap 2s ease-in-out infinite",
        flyRight: "flyRight 45s linear infinite",
        owlBlink: "owlBlink 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
