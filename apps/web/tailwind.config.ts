import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FFFFFF',
          100: '#F4F7FB',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8'
        },
        ivory: {
          50: '#FFFFFF',
          100: '#F4F7FB',
          200: '#E2E8F0',
          300: '#CBD5E1'
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
          200: '#F9D6A9',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B8560A',
          700: '#92400E'
        },
        forest: {
          50: '#ECF6F2',
          100: '#D0EAE0',
          500: '#1D7A5E',
          600: '#17624B',
          700: '#114B39'
        },
        amberwarm: {
          50: '#FEF7EE',
          100: '#FDECD5',
          300: '#F9D6A9',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B8560A',
          700: '#92400E'
        },
        tealcare: {
          50: '#ECF6F2',
          100: '#D0EAE0',
          500: '#1D7A5E',
          600: '#17624B',
          700: '#114B39'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-tamil)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-jakarta)', 'var(--font-tamil)', 'system-ui', 'sans-serif'],
        tamil: ['var(--font-tamil)', 'var(--font-inter)', 'sans-serif']
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        preloaderBar: {
          '0%': { transform: 'translateX(-110%)' },
          '100%': { transform: 'translateX(220%)' }
        }
      },
      animation: {
        marquee: 'marquee 44s linear infinite',
        shimmer: 'shimmer 1.7s ease-in-out infinite',
        fadeInUp: 'fadeInUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        preloaderBar: 'preloaderBar 1.15s cubic-bezier(0.4, 0, 0.2, 1) infinite'
      }
    }
  },
  plugins: []
};

export default config;
