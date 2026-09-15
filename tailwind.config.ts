import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        /*
         * sans and serif are the OLD system and stay pointed at the old faces.
         *
         * Do not repoint `sans`. The root <body> carries `font-sans`, and every
         * signed-in portal route inherits it. Changing this one line would
         * restyle 20+ pages that are explicitly out of scope.
         *
         * `serif` has no portal usage and could safely be repointed, but is
         * left alone so there is never a moment where some old names mean the
         * new system and others mean the old one. Marketing migrates onto the
         * three explicit names below; `serif` is deleted once nothing uses it.
         */
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],

        // Halo. display = every h1/h2/h3, body = all prose, ui = eyebrows,
        // numerals, small caps and nav.
        display: ['var(--font-newsreader)', 'Georgia', 'serif'],
        body: ['var(--font-plex)', 'system-ui', 'sans-serif'],
        ui: ['var(--font-grotesk)', 'system-ui', 'sans-serif'],
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
        /*
         * Halo. Added alongside navy/cream/accent rather than replacing them:
         * the portal shares this file and needs the real navy values, and
         * `navy-900` is not even a one-to-one swap because it is BOTH ink
         * (text-navy-900) and a dark ground (bg-navy-900). One token cannot
         * become two colours.
         *
         * THREE BANS, measured, not assumed. The source system assigns these
         * colours to roles they cannot carry:
         *
         *   mist        #9A93A8  2.83:1 on ivory. Fails even the 3.0 non-text
         *                        floor. DECORATION ONLY, never text, no size.
         *                        The spec assigns it to numerals: numerals are
         *                        text, so they use mist-body or darker.
         *   mist-strong #7C7488  4.27:1 on ivory. Fails 4.5. The spec assigns
         *                        it to eyebrows and labels. Legal for icons and
         *                        borders (>=3:1) and nothing else.
         *   purple      #785AF7  4.37:1 on ivory. Fails 4.5 as text. It is a
         *                        button FILL, a ring, and a hover state. Inline
         *                        links and the hero accent phrase use purple-d
         *                        (8.97:1).
         *
         * Button labels stay pure white. White on purple is 4.56:1; ivory on
         * purple is about 4.45:1, which is under the line.
         */
        halo: {
          // grounds
          ivory: '#FBFAF8',
          veil: '#F2EEF8',
          bone: '#EAE5F0',
          rule: '#E2DDE8',
          // text
          ink: '#15131A',
          heather: '#5A5366',
          'mist-body': '#6B6478',
          'mist-strong': '#7C7488',
          mist: '#9A93A8',
          // the only accent
          purple: '#785AF7',
          'purple-d': '#4717CA',
          lavender: '#D9CFFB',
          'lav-wash': 'rgba(124,93,255,0.06)',
          // dark surfaces. `deep` is the purple band, `black` the structural
          // one. deep-panel and deep-rule exist because the source system has
          // no ramp between the ground and its text, and the fund cards and
          // hairlines that sit on the band need somewhere to live. Surfaces
          // only, never text.
          deep: '#4717CA',
          'deep-panel': 'rgba(251,250,248,0.08)',
          'deep-rule': 'rgba(251,250,248,0.18)',
          black: '#0A0A0F',
        },
      },
    },
  },
  plugins: [],
};

export default config;
