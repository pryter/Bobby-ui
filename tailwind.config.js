/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "t-blue": "#a2d2ff",
        "t-blue-2": "#bde0fe",
        "t-pink": "#ffafcc",
        "t-pink-2": "#ffc8dd",
        "t-purple": "#cdb4db"
      }
    }
  },
  plugins: []
}
