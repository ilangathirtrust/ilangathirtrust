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
        ivory: {
          50: '#FDFCF9',
          100: '#FAF8F4',
          200: '#F3EFE6',
          300: '#E8E1D3'
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          500: '#2E41E8',
          600: '#1727D8',
          700: '#101C9E',
          900: '#0E1B4D',
          950: '#081030'
        },
        amberwarm: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309'
        },
        tealcare: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E'
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
        }
      },
      animation: {
        marquee: 'marquee 44s linear infinite',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        fadeInUp: 'fadeInUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }
    }
  },
  plugins: []
};

export default config;
