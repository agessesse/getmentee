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
        // ─── Purple: the Mentable brand system ───────────────────────────
        // Derived from the official logo ("Halo Orbit"). Three tones are the
        // asset's own colours and must not drift:
        //   700  #4717CA  the mentor dot
        //   500  #785AF7  the mentee dot
        //   200  #D9CFFB  the reversed lavender
        // The rest of the ramp is interpolated in OKLab along the hue path the
        // logo itself travels (-78.6° deep → -64.5° light), with the darkest
        // steps pulled toward the logo's ink #15131A so 900 reads as a near
        // black with a whisper of purple rather than as "purple text".
        //
        // Every step was measured against the navy scale it replaces and meets
        // or beats it on contrast, so the rename was a safe drop-in:
        //   900 on cream 15.89:1 · 700 on cream 9.09:1 · 600 on cream 6.25:1
        //   white on 700 9.36:1 · 400 on 900 5.25:1 · 200 on 700 6.36:1
        purple: {
          50:  '#f6f4ff',
          100: '#e7e3f9',
          200: '#D9CFFB',
          300: '#b3a2fb',
          400: '#9580f9',
          500: '#785AF7',
          600: '#5f3ee1',
          700: '#4717CA',
          800: '#3a1d87',
          900: '#24193e',
          950: '#1b1629',
        },
        // Warm neutral ground. Deliberately warmer than the logo sheet's
        // ivory: a warm paper against a cool accent is what stops the system
        // reading as a stock purple SaaS template.
        cream: {
          50: '#fffbf7',
          100: '#fef8f3',
        },
        // Sage is NOT a brand colour. It is the product's success/completion
        // state, the way red means error, and it never appears on marketing.
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
