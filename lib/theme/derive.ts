/**
 * Tenant theming: four colours in, a full token set out.
 *
 * WHY FOUR AND NOT FORTY. A white-label editor is a late-stage institutional
 * feature and a liability this early: every extra knob is another combination
 * nobody has looked at, and most of them are illegible. So a tenant supplies
 * exactly four roles, and everything else in the design system is DERIVED
 * from them by the functions below. That is the whole contract.
 *
 *   surface  the page ground            Mentable ivory      Carolina white
 *   ink      text and high contrast     Mentable ink        Carolina navy
 *   primary  institutional identity     Mentable purple     Carolina blue
 *   wash     soft tinted surface        Mentable lavender   Carolina wash
 *
 * THE CONTRAST GUARD, AND WHY IT EXISTS. Carolina Blue (#7BAFD4) is about
 * 1.9:1 on white. It is a beautiful institutional colour and completely
 * unusable for text or for a button that carries a white label. Rather than
 * trust whoever fills in the form, the derivation measures. `brandText` and
 * `brandLine` are darkened until they actually clear 4.5:1 and 3:1 against
 * that tenant's own surface, and the action fill is the tenant's ink, which
 * is guaranteed to carry a white label. A tenant cannot configure its way
 * into unreadable text.
 *
 * Pure maths, no secrets, no I/O: importable from server or client. The
 * Mentable default does NOT pass through here at all, it is the literal set
 * in app/globals.css, so the platform's own appearance cannot drift when this
 * file changes.
 */

export interface TenantPalette {
  /** Page ground. */
  surface: string;
  /** Text and high-contrast controls. */
  ink: string;
  /** Institutional identity: accent, progress, selection. */
  primary: string;
  /** Soft tinted surface. */
  wash: string;
}

/** Every themeable token, as "R G B" channel triplets. */
export type TokenSet = Record<string, string>;

// ── colour maths ────────────────────────────────────────────────────────────

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const h = hex.trim().replace(/^#/, '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`not a hex colour: ${hex}`);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Tailwind consumes these as `rgb(var(--token) / <alpha-value>)`. */
export function channels(c: RGB): string {
  return `${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])}`;
}

/** WCAG 2.1 relative luminance. */
export function luminance(c: RGB): number {
  const lin = c.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** WCAG 2.1 contrast ratio, 1..21. */
export function contrast(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Linear mix: `amount` of `b` into `a`. */
export function mix(a: RGB, b: RGB, amount: number): RGB {
  const t = Math.min(1, Math.max(0, amount));
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

const BLACK: RGB = [0, 0, 0];
const WHITE: RGB = [255, 255, 255];

/**
 * Darken `c` toward black until it clears `target` against `bg`.
 *
 * Returns the first step that passes, so a colour already passing is returned
 * untouched and keeps all of its chroma. If even black cannot reach the target
 * the background is too dark for this to be a text colour at all, and the
 * caller's fallback is used instead.
 */
export function darkenToContrast(c: RGB, bg: RGB, target: number): RGB | null {
  for (let step = 0; step <= 100; step += 2) {
    const candidate = mix(c, BLACK, step / 100);
    if (contrast(candidate, bg) >= target) return candidate;
  }
  return null;
}

// ── derivation ──────────────────────────────────────────────────────────────

/**
 * The full token set for a tenant.
 *
 * Token names match the `halo` scale in tailwind.config.ts one for one, so a
 * component written against `bg-halo-veil` re-themes with no edit. The three
 * `brand*` tokens are new in this pass and carry the institutional identity
 * at three different contrast floors, because one accent colour cannot be a
 * 2px indicator, a button fill and body text at the same time.
 */
export function deriveTokens(p: TenantPalette): TokenSet {
  const surface = hexToRgb(p.surface);
  const ink = hexToRgb(p.ink);
  const primary = hexToRgb(p.primary);
  const wash = hexToRgb(p.wash);

  // Identity at three contrast floors.
  //   brand       no floor. Fills and surfaces only, never a mark on the ground.
  //   brand-line  3:1. Indicators, icons, meaningful borders.
  //   brand-text  4.5:1. Accent text and links. Falls back to ink, which is
  //               the tenant's own high-contrast colour, if the identity
  //               colour cannot be darkened far enough to qualify.
  const brandLine = darkenToContrast(primary, surface, 3) ?? ink;
  const brandText = darkenToContrast(primary, surface, 4.5) ?? ink;

  /*
    The action fill, which must carry a WHITE label at 4.5:1.

    Every primary button in the product is `bg-halo-purple text-white`, so the
    fill is constrained by its label rather than by the page behind it. Three
    candidates, in order of how much institutional character they keep:

      1. ink      Carolina lands here, which is also what the brief asks for:
                  navy for high-contrast actions, Carolina Blue for identity.
      2. primary, darkened until white passes. For a tenant whose ink is
                  LIGHT (a dark-ground theme), ink fails as a fill and the
                  identity colour darkened is the better answer anyway.
      3. ink darkened toward black. Terminal fallback; black always passes,
                  so this cannot return nothing.

    This was wrong in the first draft, which used ink unconditionally. The
    regression suite's dark-ground tenant caught it: white on a near-white
    fill measured 1.09:1, an invisible button on every screen.

    KNOWN LIMIT, stated rather than hidden: a dark-surface tenant gets a dark
    action fill, which has less separation from its ground than it should.
    The real fix is a light fill with a dark label, and that needs components
    to stop hard-coding text-white. No dark-ground tenant exists yet; when one
    does, that is the change to make, not a fourth candidate here.
  */
  const actionFill =
    (contrast(WHITE, ink) >= 4.5 ? ink : null) ??
    darkenToContrast(primary, WHITE, 4.5) ??
    darkenToContrast(ink, WHITE, 4.5) ??
    BLACK;

  return {
    // grounds
    'ivory': channels(surface),
    'veil': channels(wash),
    'bone': channels(mix(wash, ink, 0.09)),
    'rule': channels(mix(surface, ink, 0.13)),
    // text, stepping away from ink toward the ground
    'ink': channels(ink),
    'heather': channels(mix(ink, surface, 0.22)),
    'mist-body': channels(mix(ink, surface, 0.34)),
    'mist-strong': channels(mix(ink, surface, 0.44)),
    'mist': channels(mix(ink, surface, 0.56)),
    /*
      The action fill, chosen above against the white label it carries.

      Carolina Blue gives 1.9:1 with white, so a Carolina-blue button is a
      button with no readable label. The identity colour is spent instead on
      what it can carry: progress, selection, active state and surfaces.
    */
    'purple': channels(actionFill),
    // Hover. Darker than the fill, which can only raise contrast with the
    // white label, so the hover state cannot be the one that fails.
    'purple-d': channels(mix(actionFill, BLACK, 0.22)),
    'lavender': channels(mix(primary, surface, 0.45)),
    // dark surfaces
    'deep': channels(ink),
    'black': channels(mix(ink, BLACK, 0.6)),
    // institutional identity
    'brand': channels(primary),
    'brand-line': channels(brandLine),
    'brand-text': channels(brandText),
  };
}

/** The token set as inline CSS custom properties for a shell wrapper. */
export function tokenStyle(tokens: TokenSet): Record<string, string> {
  const style: Record<string, string> = {};
  for (const [name, value] of Object.entries(tokens)) {
    style[`--halo-${name}`] = value;
  }
  return style;
}
