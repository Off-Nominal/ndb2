/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/views/**/*.{tsx,jsx,html}"],
  theme: {
    screens: {
      sm: "480px",
      md: "768px",
      lg: "976px",
      xl: "1440px",
    },
    colors: {
      white: "#FFFFFF",
      black: "#000000",
      "moonstone-blue": "#73A6C4",
      "moss-green": "#8AA644",
      "moss-green-dark": "#6c8235",
      "silver-chalice-grey": "#B2AFA1",
      "deep-chestnut-red": "#B64E45",
      "california-gold": "#B2893A",
      "warning-yellow": "#facc15",
      "discord-purple": "#7983f5",
      transparent: "transparent",
      "discord-mention-foreground": "#c9cdfb",
      "discord-mention-background": "#5865f2",
      slate: {
        50: "#f8fafc",
        100: "#f1f5f9",
        200: "#e2e8f0",
        300: "#cbd5e1",
        400: "#94a3b8",
        500: "#64748b",
        600: "#475569",
        700: "#334155",
        800: "#1e293b",
        900: "#0f172a",
        950: "#020617",
      },
    },
    fontFamily: {
      header: ["urbane", "sans-serif"],
      sans: ["Helvetica Neue", "sans-serif"],
    },
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-in-out",
        "fade-out": "fade-out 0.3s ease-in-out",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0%" },
          "100%": { opacity: "100%" },
        },
        "fade-out": {
          "0%": { opacity: "100%" },
          "100%": { opacity: "0%" },
        },
      },
    },
  },
  plugins: [],
};
