import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', ...defaultTheme.fontFamily.sans],
        fantasy: ['"Playfair Display"', ...defaultTheme.fontFamily.serif],
      },
      colors: {
        surface: '#f8fafc',
        ink: '#0f172a',
        accent: {
          light: '#fef3c7',
          DEFAULT: '#fb923c',
          dark: '#0f172a',
        },
        slate: {
          950: '#020617',
        },
      },
      boxShadow: {
        'soft-card': '0 20px 60px -25px rgba(15,23,42,0.35)',
      },
      animation: {
        orbit: 'orbit 18s linear infinite',
        marquee: 'marquee 40s linear infinite',
      },
      keyframes: {
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(0)' },
          '100%': { transform: 'rotate(360deg) translateX(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
