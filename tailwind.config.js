/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", 
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFC107', 
          hover: '#FFB300',
        },
        secondary: '#EF4444',
        'gray-light': '#F3F4F6',
        'gray-custom': '#6B7280',
        border: '#E5E7EB',
        black: '#1F2937',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")], 
}