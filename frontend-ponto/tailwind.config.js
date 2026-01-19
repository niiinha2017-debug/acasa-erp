/** @type {import('tailwindcss').Config} */
export default {
  // ESSA LINHA É A CHAVE:
  darkMode: 'class', 
  
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Garantindo que o Indigo seja o da sua marca
      colors: {
        indigo: {
          600: '#4f46e5', 
        }
      }
    },
  },
  plugins: [],
}