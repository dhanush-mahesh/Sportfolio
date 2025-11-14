/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'brand': {
          'light': '#0a0a0a',
          'DEFAULT': '#000000',
          'dark': '#000000',
        },
        'highlight': {
          'light': '#262626',
          'DEFAULT': '#171717',
          'dark': '#0d0d0d',
        }
      }
    },
  },
  plugins: [],
}

