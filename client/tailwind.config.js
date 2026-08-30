/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#000000",
        surface: "#0A0A0A",
        ink: {
          900: "#F8FAFC",
          800: "#F1F5F9",
          700: "#E2E8F0",
          500: "#94A3B8",
          400: "#64748B",
          300: "#475569",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          soft: "rgba(255, 255, 255, 0.05)",
        },
        accent: {
          DEFAULT: "#6366F1",
          50: "rgba(99, 102, 241, 0.1)",
          100: "rgba(99, 102, 241, 0.2)",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        success: {
          DEFAULT: "#10B981",
          50: "rgba(16, 185, 129, 0.1)",
          100: "rgba(16, 185, 129, 0.2)",
          600: "#059669",
          700: "#047857",
        },
        warning: {
          DEFAULT: "#F59E0B",
          50: "rgba(245, 158, 11, 0.1)",
          100: "rgba(245, 158, 11, 0.2)",
          600: "#D97706",
          700: "#B45309",
        },
        danger: {
          DEFAULT: "#F43F5E",
          50: "rgba(244, 63, 94, 0.1)",
          100: "rgba(244, 63, 94, 0.2)",
          600: "#E11D48",
          700: "#BE123C",
        },
        navy: {
          950: "#000000",
          900: "#040404",
          800: "#0A0A0A",
          700: "#141414",
        },
      },
      fontFamily: {
        display: ["'Geist'", "'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        sans: ["'Geist'", "'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.5), 0 1px 12px rgba(0, 0, 0, 0.5)",
        popover: "0 12px 32px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.5)",
        glow: "0 0 0 4px rgba(99, 102, 241, 0.15)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        pulseTravel: {
          "0%": { offsetDistance: "0%", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { offsetDistance: "100%", opacity: "0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.35s ease-out both",
        scaleIn: "scaleIn 0.18s ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
