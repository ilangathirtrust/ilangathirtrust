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
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          500: '#2e41e8',
          600: '#1727d8',
          700: '#101c9e',
          900: '#0c154a',
          950: '#070c2e'
        },
        amberwarm: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706'
        },
        tealcare: {
          50: '#f0fdfa',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e'
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
        marquee: 'marquee 42s linear infinite',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        fadeInUp: 'fadeInUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }
    }
  },
  plugins: []
};

export default config;
