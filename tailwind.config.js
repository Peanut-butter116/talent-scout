/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f3f5f9',
          100: '#e4e8f0',
          200: '#c7cfdf',
          300: '#9ba8c4',
          400: '#6b7ca3',
          500: '#4a5b85',
          600: '#37466b',
          700: '#2a3756',
          800: '#1c2640',
          900: '#121a2e',
          950: '#0b1120',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        moved: {
          '0%': { backgroundColor: 'rgb(204 251 241)' },
          '100%': { backgroundColor: 'transparent' },
        },
        match: {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.96)' },
          '12%': { opacity: '1', transform: 'translateY(0) scale(1.02)' },
          '20%': { transform: 'scale(1)' },
          '85%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(8px)' },
        },
      },
      animation: {
        moved: 'moved 1.6s ease-out',
        match: 'match 2.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
