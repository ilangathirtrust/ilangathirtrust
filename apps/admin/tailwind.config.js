/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#F7F5F0',
          100: '#EFECE4',
          200: '#E3DDD0',
          300: '#D2C8B6'
        },
        brand: {
          50: '#EEF2F8',
          100: '#DAE3F0',
          200: '#B5C7E0',
          500: '#254C86',
          600: '#1A3A6B',
          700: '#13294B',
          800: '#0F203C',
          900: '#0B182E',
          950: '#070F1E'
        },
        saffron: {
          50: '#FEF7EE',
          100: '#FDECD5',
          500: '#D97706',
          600: '#B8560A',
          700: '#92400E'
        }
      }
    }
  },
  plugins: []
};
