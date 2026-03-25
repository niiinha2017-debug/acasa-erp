/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#357CB0', // Azul principal da marca
        'brand-secondary': '#D9D9D9', // Cinza claro da marca
        'brand-dark': '#2c5a7d',
        'danger': '#ef4444',
      },
      zIndex: {
        'sticky': '1020',
        'dropdown': '1000',
        'modal': '1050',
      }
    },
  },
  plugins: [],
}