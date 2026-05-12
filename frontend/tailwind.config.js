/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f4',
          100: '#dcf1e6',
          200: '#bbe3cf',
          300: '#8acead',
          400: '#56b285',
          500: '#33965f',
          600: '#24784a',
          700: '#1d5f3c',
          800: '#1a4c31',
          900: '#163f29',
          950: '#0b2318',
        },
        accent: {
          400: '#f59e0b',
          500: '#d97706',
        },
        surface: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans Devanagari"', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
