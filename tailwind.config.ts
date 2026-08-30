import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#1a1f3a',
          800: '#2d3668',
          700: '#3d4a8f',
          600: '#5265b0',
          500: '#6b84c8',
          100: '#dde3f5',
          50: '#f0f2fb',
        },
        cream: {
          50: '#fffbf7',
          100: '#fef8f3',
        },
      },
    },
  },
  plugins: [],
};

export default config;
