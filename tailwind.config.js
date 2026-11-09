/** @type {import('tailwindcss').Config} */
// Talent Scout's own design tokens (see CLAUDE.md → STYLE): calm white layout, neutral
// greys (`ink`; `navy`/`slate` map to it), ONE deep-indigo accent, Inter font.
// `teal` and `rose` are status colours only (good / not supported).
const ink = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#71717a',
  500: '#52525b',
  600: '#3f3f46',
  700: '#27272a',
  800: '#1f1f23',
  900: '#18181b',
  950: '#09090b',
};

// The one accent: deep indigo for primary buttons, links, toggles and focus rings.
const accent = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
};

// Status colours only (never decoration): muted green = good, red = flag / not supported.
const good = {
  50: '#eef5f0',
  100: '#dcebe1',
  300: '#9cc3a8',
  500: '#4f8a65',
  600: '#3f7d5a',
  700: '#2f6b4a',
  800: '#245a3d',
  900: '#1c4630',
};
const red = {
  50: '#fbeeee',
  100: '#f6dcdb',
  500: '#cb4644',
  600: '#b83c3a',
  700: '#9c3230',
};

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: ink,
        slate: ink,
        ink,
        accent,
        teal: good,
        rose: red,
      },
      fontFamily: {
        sans: [
          '"Inter Variable"',
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
        tightish: '-0.02em',
        display: '-0.035em',
      },
      keyframes: {
        moved: {
          '0%': { backgroundColor: 'rgb(251 243 220)' },
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
