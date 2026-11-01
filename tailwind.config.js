/** @type {import('tailwindcss').Config} */
// Design tokens (see CLAUDE.md → STYLE). Calm, airy, white; near-black ink; one accent (teal).
// `navy` and `slate` are remapped to neutral greys so the whole app reads as ink-on-white.
const ink = {
  50: '#f7f7f7',
  100: '#efefef',
  200: '#e4e4e4',
  300: '#cfcfcf',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#3a3a3a',
  800: '#222222',
  900: '#111111',
  950: '#0a0a0a',
};

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: ink,
        slate: ink,
        ink,
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Inter',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tightish: '-0.015em',
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
