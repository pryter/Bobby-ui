/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Primary brand colour — driven by CSS vars in app/globals.css ──
        // Change the --primary-* ramp there to re-theme; opacity modifiers
        // (bg-primary/40, ring-primary/30, …) work via <alpha-value>.
        primary: {
          DEFAULT: "rgb(var(--primary-400) / <alpha-value>)",
          300: "rgb(var(--primary-300) / <alpha-value>)",
          400: "rgb(var(--primary-400) / <alpha-value>)",
          600: "rgb(var(--primary-600) / <alpha-value>)",
          700: "rgb(var(--primary-700) / <alpha-value>)",
          800: "rgb(var(--primary-800) / <alpha-value>)",
          900: "rgb(var(--primary-900) / <alpha-value>)",
        },
        "t-blue": "#a2d2ff",
        "t-blue-2": "#bde0fe",
        "t-pink": "#ffafcc",
        "t-pink-2": "#ffc8dd",
        "t-purple": "#cdb4db",
        // ── Bobby theme ────────────────────────────────────────────────
        // Tile palette from the landing hero (app/page.tsx TILE_CONFIGS)
        bobby: {
          green:  "#1db954", // code tile
          orange: "#f5a623", // bobby tile
          blue:   "#2563eb", // rocket tile
          red:    "#f04e30", // bolt tile
          purple: "#7c3aed", // shield tile
          // Brand accent (`primary`, top-level) now lives in the CSS-var ramp.
          bg:      "#0d0d0f", // page background (dark)
          surface: "#17171a", // nav pill / elevated surfaces
        },
      },
      keyframes: {
        orbFloat: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(40px, -60px) scale(1.08)" },
          "66%": { transform: "translate(-30px, 30px) scale(0.94)" },
        },
        orbFloat2: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(-50px, 40px) scale(1.05)" },
          "66%": { transform: "translate(25px, -35px) scale(0.96)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
      animation: {
        "orb-1": "orbFloat 10s ease-in-out infinite",
        "orb-2": "orbFloat2 14s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
}
