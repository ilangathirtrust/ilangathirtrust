/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#2e41e8',
          600: '#1727d8',
          700: '#101c9e',
          900: '#0c154a',
          950: '#070c2e'
        }
      }
    }
  },
  plugins: []
};
