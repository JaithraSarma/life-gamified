/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        warm: {
          50: "#FFFBF5",
          100: "#FFF3E0",
          200: "#FFE0B2",
          300: "#FFCC80",
          400: "#FFB74D",
          500: "#FFA726",
          600: "#FB8C00",
          700: "#E65100",
          800: "#BF360C",
          900: "#3E2723",
        },
        cream: "#FFFDF8",
        coral: "#FF8A80",
        ember: "#FF6E40",
        gold: "#FFD54F",
        sage: "#A5D6A7",
        frost: "#81D4FA",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      animation: {
        "flame": "flame 1.5s ease-in-out infinite",
        "gem-bounce": "gemBounce 0.5s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        flame: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
        },
        gemBounce: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
