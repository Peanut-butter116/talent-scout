/** @type {import('tailwindcss').Config} */
// Design tokens matched to glot.com (see CLAUDE.md → STYLE): white page, #111 ink, warm greys,
// black pill buttons, Plus Jakarta Sans. `navy`/`slate` map to the warm `ink` scale;
// `teal` is a muted status green and `rose` is Glot's red — both used for status only.
const ink = {
  50: '#f7f7f5',
  100: '#f2f2f0',
  200: '#e6e6e3',
  300: '#cfcfcb',
  400: '#6e6e6a',
  500: '#5e5e5a',
  600: '#52524f',
  700: '#3a3a37',
  800: '#1a1a19',
  900: '#111111',
  950: '#0a0a0a',
};

// Status colours only (never decoration): muted green = good, Glot red = flag / not supported.
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
const glotRed = {
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
        teal: good,
        rose: glotRed,
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans Variable"',
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
