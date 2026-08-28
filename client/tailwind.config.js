/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F7FB",
        surface: "#FFFFFF",
        ink: {
          900: "#0B1120",
          800: "#111A2E",
          700: "#1E293B",
          500: "#475569",
          400: "#64748B",
          300: "#94A3B8",
        },
        border: {
          DEFAULT: "#E4E8F1",
          soft: "#EDF0F7",
        },
        accent: {
          DEFAULT: "#3B4CFF",
          50: "#EEF0FF",
          100: "#DFE3FF",
          400: "#6674FF",
          500: "#3B4CFF",
          600: "#2E3BDB",
          700: "#232CA8",
        },
        success: {
          DEFAULT: "#0E9F6E",
          50: "#E9FBF4",
          100: "#CFF6E7",
          600: "#0E9F6E",
          700: "#0B7F58",
        },
        warning: {
          DEFAULT: "#D28A0F",
          50: "#FDF5E6",
          100: "#FAE7C2",
          600: "#D28A0F",
          700: "#A96D0A",
        },
        danger: {
          DEFAULT: "#DC3545",
          50: "#FDEDEE",
          100: "#FAD3D6",
          600: "#DC3545",
          700: "#B3222F",
        },
        navy: {
          950: "#080B14",
          900: "#0B1120",
          800: "#111A2E",
          700: "#182238",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 17, 32, 0.04), 0 1px 12px rgba(11, 17, 32, 0.04)",
        popover: "0 12px 32px rgba(11, 17, 32, 0.14), 0 2px 8px rgba(11, 17, 32, 0.08)",
        glow: "0 0 0 4px rgba(59, 76, 255, 0.12)",
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
