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
        //
        // `ui` pointed at Space Grotesk until the labels were reviewed. Two
        // things were wrong with that. Space Grotesk is a geometric face with
        // very open apertures, and next to Newsreader it read as a different
        // project rather than a third voice in the same one. It is also the
        // single most over-used typeface in generated startup interfaces, which
        // is exactly the impression the uppercase labels were giving.
        //
        // It now points at Plex, the face the body copy already uses. Sharing a
        // family between prose and its labels is ordinary editorial practice,
        // and Plex has enough humanist detail at 10-11px uppercase to read as a
        // deliberate small-caps treatment. No new font was added; one was
        // removed.
        display: ['var(--font-newsreader)', 'Georgia', 'serif'],
        body: ['var(--font-plex)', 'system-ui', 'sans-serif'],
        ui: ['var(--font-plex)', 'system-ui', 'sans-serif'],
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
         * Reserved CTA accent (the old green, kept for the portal only).
         *
         * The marketing accent is halo-purple below. Its text rule: primary
         * buttons, plus the hero thesis, and nothing else. Never headings,
         * icons, general links or decoration, because the moment it decorates
         * something it stops meaning "act here".
         *
         * The hero now carries TWO accent runs, not one. That is a deliberate
         * revision of the earlier rule, which said a second run would break it.
         * The two are a matched pair, "worth learning from" and "worth
         * mentoring", and the symmetry is the point being made: the same person
         * on both ends of the exchange. A parallel construction reads as one
         * rhetorical figure, not as two emphases competing. A third run, or two
         * that were not mirrored, would break it for real.
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
         * TENANT THEMING. Every value below is a CSS custom property holding
         * "R G B" channels, consumed as rgb(var(...) / <alpha-value>) so that
         * opacity modifiers (bg-halo-veil/60, bg-halo-ink/40) keep working
         * exactly as before. The defaults live in app/globals.css on :root and
         * are the same literal hexes this block used to hold, so Mentable's own
         * appearance is byte-identical. An organisation with a theme overrides
         * the properties on the app shell subtree, and every component written
         * against these names re-themes with no edit.
         *
         * THE THREE BANS SURVIVE THE MOVE, because they are properties of the
         * ROLE, not of one palette, and lib/theme/derive.ts enforces the same
         * floors by measurement for any tenant:
         *
         *   mist          decoration only, never text, no size
         *   mist-strong   icons and borders only (>=3:1)
         *   purple        a FILL, a ring and a hover state; accent TEXT uses
         *                 purple-d, or brand-text in the new shell
         *
         * Button labels stay pure white: the derivation guarantees the action
         * fill carries white at >=4.5:1 for every tenant.
         */
        halo: {
          // grounds
          ivory: 'rgb(var(--halo-ivory) / <alpha-value>)',
          veil: 'rgb(var(--halo-veil) / <alpha-value>)',
          bone: 'rgb(var(--halo-bone) / <alpha-value>)',
          rule: 'rgb(var(--halo-rule) / <alpha-value>)',
          // text
          ink: 'rgb(var(--halo-ink) / <alpha-value>)',
          heather: 'rgb(var(--halo-heather) / <alpha-value>)',
          'mist-body': 'rgb(var(--halo-mist-body) / <alpha-value>)',
          'mist-strong': 'rgb(var(--halo-mist-strong) / <alpha-value>)',
          mist: 'rgb(var(--halo-mist) / <alpha-value>)',
          // the action accent
          purple: 'rgb(var(--halo-purple) / <alpha-value>)',
          'purple-d': 'rgb(var(--halo-purple-d) / <alpha-value>)',
          lavender: 'rgb(var(--halo-lavender) / <alpha-value>)',
          'lav-wash': 'rgb(var(--halo-purple) / 0.06)',
          /*
           * INSTITUTIONAL IDENTITY, new in the tenant-theming pass.
           *
           * One accent colour cannot be a 2px indicator, a button fill and
           * body text at once. Carolina Blue is 1.9:1 on white: fine as a
           * progress fill, illegible as a label. So identity is three tokens
           * at three contrast floors, and the shell picks by role.
           *
           *   brand       no floor. Fills, surfaces, progress, selection.
           *   brand-line  >=3:1.   Indicators, icons, meaningful borders.
           *   brand-text  >=4.5:1. Accent text and links.
           *
           * For Mentable all three resolve to the existing purple pair, so
           * nothing changes; for a tenant they are measured and darkened.
           */
          brand: 'rgb(var(--halo-brand) / <alpha-value>)',
          'brand-line': 'rgb(var(--halo-brand-line) / <alpha-value>)',
          'brand-text': 'rgb(var(--halo-brand-text) / <alpha-value>)',
          // dark surfaces. Surfaces only, never text.
          deep: 'rgb(var(--halo-deep) / <alpha-value>)',
          'deep-panel': 'rgb(var(--halo-ivory) / 0.08)',
          'deep-rule': 'rgb(var(--halo-ivory) / 0.18)',
          black: 'rgb(var(--halo-black) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
