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
        /**
         * Reserved CTA accent. Primary buttons, plus ONE phrase in the hero
         * thesis. Never headings, icons, links or general decoration — the
         * moment it decorates something it stops meaning "act here".
         *
         * The hero exception is deliberate and is the only one: the accent
         * carries the five words that answer "is this just a list of names?"
         * and nothing else on the page. If a second run of accent text ever
         * appears, both stop working and this rule has been broken.
         *
         * The page alternates cream (#fffbf7) and navy (#1a1f3a) grounds, so
         * the accent must clear 3:1 against BOTH while its label clears 4.5:1.
         * That rules out most bright greens: lime-400 and lime-500 look right
         * on navy but fall to 1.5-1.9:1 on cream, leaving the button with no
         * edge, and a lime dark enough to pass on cream turns olive.
         *
         * #15803d passes on both with a white label: 5.02:1 label,
         * 4.87:1 on cream, 3.22:1 on navy.
         */
        accent: {
          DEFAULT: '#15803d',
          hover: '#166534',
        },
      },
    },
  },
  plugins: [],
};

export default config;
