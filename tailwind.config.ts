import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          50: "#fff0f0",
          100: "#ffe0e0",
          200: "#ffc0c0",
          300: "#ff9090",
          400: "#ff5050",
          500: "#ff2020",
          600: "#e00000",
          700: "#b91c1c",
          800: "#8B0000",
          900: "#5a0000",
          950: "#350000",
        },
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        parchment: {
          50: "#fdf8f0",
          100: "#faf0e0",
          200: "#f5e0c0",
          300: "#edca90",
          400: "#e2ac58",
          500: "#d4914a",
          600: "#c07030",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(212, 175, 55, 0.4)" },
          "50%": { boxShadow: "0 0 24px rgba(212, 175, 55, 0.8)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.6", filter: "brightness(1)" },
          "50%": { opacity: "1", filter: "brightness(1.3)" },
        },
      },
      backgroundImage: {
        "gold-shimmer":
          "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 50%, transparent 100%)",
        "crimson-gradient":
          "linear-gradient(135deg, #8B0000 0%, #B91C1C 50%, #7F1D1D 100%)",
        "dark-gradient":
          "linear-gradient(180deg, #0A0A0A 0%, #111111 50%, #0D0D0D 100%)",
        "gold-gradient":
          "linear-gradient(135deg, #D4AF37 0%, #F59E0B 50%, #B45309 100%)",
      },
      boxShadow: {
        gold: "0 0 20px rgba(212, 175, 55, 0.3)",
        "gold-lg": "0 0 40px rgba(212, 175, 55, 0.5)",
        crimson: "0 0 20px rgba(139, 0, 0, 0.4)",
        "inner-gold": "inset 0 0 20px rgba(212, 175, 55, 0.15)",
        card: "0 4px 24px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.4)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
