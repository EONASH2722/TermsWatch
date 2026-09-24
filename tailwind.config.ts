import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#071016',
        panel: '#0b171f',
        raised: '#10212b',
        line: '#203641',
        muted: '#8ca0ae',
        cyan: '#41e6df',
      },
      boxShadow: {
        panel: '0 18px 48px rgba(0, 0, 0, 0.28)',
        focus: '0 0 0 3px rgba(65, 230, 223, 0.14)',
      },
    },
  },
  plugins: [],
} satisfies Config;
