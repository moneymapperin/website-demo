/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0a14",
        card: {
          DEFAULT: "#15131f",
          border: "rgba(255, 255, 255, 0.08)",
        },
        brand: {
          purple: "#8b5cf6",
          violet: "#a855f7",
          magenta: "#d946ef",
        },
        success: {
          DEFAULT: "#22c55e",
          green: "#22c55e",
        },
        gold: {
          DEFAULT: "#f59e0b",
          amber: "#eab308",
          bright: "#f59e0b",
          logo: "#f2c14e",
        },
        amber: {
          gold: "#eab308",
        },
        logo: {
          navy: "#0d1b3e",
          teal: "#2fa89a",
          gold: "#f2c14e",
        },
        // MoneyMapper App Theme Tokens
        mm: {
          primary: '#4F46E5',
          secondary: '#10B981',
          success: '#10B981',
          vibrantGreen: '#00E676',
          accent: '#8B5CF6',
          warning: '#F59E0B',
          danger: '#EF4444',
          headerPurple: '#2E1065',
          headerPurpleDark: '#1E0A45',
          background: '#F9FAFB',
          card: '#FFFFFF',
          borderLight: '#E5E7EB',
          textPrimaryLight: '#111827',
          textSecondaryLight: '#4B5563',
          darkBackground: '#09090B',
          darkCard: '#0D0E15',
          darkBorder: '#27272A',
          textPrimaryDark: '#FAFAFA',
          textSecondaryDark: '#A1A1AA',
        },
      },
      borderRadius: {
        mm: {
          card: '24px',
          input: '16px',
          button: '16px',
        },
      },
      borderColor: {
        "card-border": "rgba(255, 255, 255, 0.08)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(to right, #8b5cf6, #a855f7, #d946ef)",
        "brand-gradient-hover": "linear-gradient(to right, #7c3aed, #9333ea, #c026d3)",
      },
      animation: {
        "modal-in": "modalIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 200ms ease-out forwards",
      },
      keyframes: {
        modalIn: {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
