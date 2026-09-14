import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
      },
      colors: {
        navy: {
          900: '#1a1f3a',
          800: '#2d3668',
          700: '#3d4a8f',
          600: '#5265b0',
          500: '#6b84c8',
          400: '#879bd3',
          300: '#a4b3de',
          200: '#c0cbe9',
          100: '#dde3f5',
          50: '#f0f2fb',
        },
        cream: {
          50: '#fffbf7',
          100: '#fef8f3',
        },
        // Sage: the third brand colour, and the only one with a job.
        // Navy carries trust, cream carries warmth; sage means forward motion
        // — progress, completion, an active mentorship. Hue sits around 100°
        // at low chroma, which is warm enough to sit beside cream without the
        // clash a teal or emerald would create against navy's blue-violet.
        // Seven tones, each earning its place:
        //   50/100 surfaces and badge fills
        //   200    borders on light
        //   300    text and strokes on navy          (8.11:1 on navy-900)
        //   400    graphics and bar fills on light   (3.32:1 white, 3.22:1 cream)
        //   600    text and icons on light           (6.21:1 white, 6.03:1 cream)
        //   700    hover and emphasis                (8.56:1 white)
        sage: {
          50: '#f4f7f2',
          100: '#e7eee3',
          200: '#ccdac5',
          300: '#a9be9f',
          400: '#7c9470',
          600: '#516748',
          700: '#405139',
        },
      },
    },
  },
  plugins: [],
};

export default config;
