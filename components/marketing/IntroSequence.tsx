'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BRAND_DEFINITION } from '@/components/ui/Wordmark';
import { WORDMARK } from '@/components/marketing/intro-wordmark';
import { INTRO_SESSION_KEY, INTRO_COVER_CLASS } from '@/components/marketing/intro-session';
import {
  EASE, LEAD_BG, REVEAL_PANEL_MS, REVEAL_LEAD_DELAY_MS,
} from '@/components/marketing/motion';

/**
 * The Mentable entrance.
 *
 * WHAT IT DOES, in five beats. The wordmark draws itself on as outlines. A
 * solid fill wipes across it right to left. It then becomes a few thousand
 * particles, which lift off their letter positions and travel along a fan of
 * dashed ellipses, turning from ivory to Mentable purple as they go. They
 * collapse into the vertical centre line. Then the whole surface lifts and
 * leaves through the top of the screen.
 *
 * WHY THE EXIT IS VERTICAL WHERE PAGE NAVIGATION IS HORIZONTAL. It reads as two
 * different jobs, which they are. Rising out through the top is arriving: the
 * site is underneath the whole time and the curtain lifts off it. The
 * horizontal wipe between Mentee, Mentor and About is travelling sideways
 * through a site you are already inside. Same curve, same panel pair, same
 * 80ms lag between them; only the axis changes, and it changes with the
 * meaning.
 *
 * WHAT CARRIED OVER. The concept is unchanged: the name resolves, and
 * TEACHABLE. COACHABLE. READY TO GROW. answers it. Session behaviour, the
 * ?intro replay, dev replay, reduced motion and the shared exit all work as
 * they did. The storage key moved to v7 because the animation itself changed
 * substantially and returning visitors should see it once.
 *
 * WHAT IS NEW BESIDES THE ANIMATION. Any click, key, scroll or touch
 * fast-forwards to the end in 200ms, so nobody is ever held hostage by it.
 *
 * HOW IT IS BUILT. Two layers, swapped at T.swap. Before the swap it is SVG:
 * stroke-dashoffset drives the outline draw and a clip rect drives the fill.
 * After the swap it is a single canvas: the wordmark is rasterised offscreen
 * once, filled pixels are sampled on a grid, and each sample is bound to the
 * nearest point on the nearest ellipse so it has somewhere to travel. No
 * animation library, and the canvas work only exists for about 800ms.
 */

/* ── timeline, ms ─────────────────────────────────────────────────────────── */
const T = {
  outlineStart: 0,
  outlineEnd: 800,
  letterDraw: 480,
  letterStaggerMax: 110,
  subpathJitter: 55,
  fillStart: 800,
  fillEnd: 1340,
  /** The definition lands once the name has fully resolved, never competing. */
  definitionAt: 1340,
  swap: 1760,
  curvesFadeIn: 1900,
  travelStart: 1760,
  travelEnd: 2280,
  collapseStart: 2280,
  collapseEnd: 2540,
  /** The lift. Same curve and lag as the page wipe, rotated to vertical. */
  sweepAt: 2560,
  skipDuration: 200,
  get end() {
    return this.sweepAt + REVEAL_PANEL_MS + REVEAL_LEAD_DELAY_MS + 60;
  },
};

/* ── look. Every colour is an existing Halo token. ────────────────────────── */
const C = {
  bg: '#0A0A0F',        // halo-black, the structural dark surface
  ink: '#FBFAF8',       // halo-ivory
  accent: '#785AF7',    // halo-purple
  capRatio: 0.118,
  capRatioMobile: 0.085,
  widthRatio: 0.44,
  widthRatioMobile: 0.78,
  centerX: 0.5,
  centerY: 0.455,
  strokeWidth: 1.3,
  curveCount: 14,
  curveSamples: 600,
  curveDash: [1, 7] as [number, number],
  curveAlpha: 0.4,
  colorLerpEnd: 0.4,
  travelSpan: 1.2,
  haloScale: 3.2,
  haloAlpha: 0.17,
  sampleGrid: 2,
  maxParticles: 4000,
  particleSize: 1.5,
  alphaTiers: 4,
  from: [251, 250, 248] as const, // halo-ivory
  to: [120, 90, 247] as const,    // halo-purple
};

const MOBILE_BP = 768;
const SESSION_KEY = INTRO_SESSION_KEY;
const RETIRED_KEYS = [
  'mentee_intro_shown', 'mentee_intro_v2', 'mentee_intro_v3',
  'mentee_intro_v4', 'mentable_intro_v5', 'mentable_intro_v6',
];
const SEED = 2654435769;

/* ── helpers ──────────────────────────────────────────────────────────────── */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 1831565813) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInQuad = (t: number) => t * t;
const easeInCubic = (t: number) => t * t * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Newton-free bezier solve, good enough at 24 bisections. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 24; i++) {
      const v = X(t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return Y(t);
  };
}
const drawEase = cubicBezier(0.33, 0, 0.2, 1);
// The same curve the wipe uses, so the fill and the sweep feel related.
const fillEase = cubicBezier(0.65, 0, 0.35, 1);

/* ── layout ───────────────────────────────────────────────────────────────── */
type Layout = { scale: number; originX: number; baselineY: number };

function layout(w: number, h: number): Layout {
  const mobile = w < MOBILE_BP;
  const maxW = w * (mobile ? C.widthRatioMobile : C.widthRatio);
  const capTarget = h * (mobile ? C.capRatioMobile : C.capRatio);
  const bw = WORDMARK.bbox.maxX - WORDMARK.bbox.minX;
  // Fit to width, but never so tall that a short viewport clips it.
  const scale = Math.min(maxW / bw, capTarget / WORDMARK.capHeight);
  const runWidth = bw * scale;
  return {
    scale,
    originX: w * C.centerX - runWidth / 2 - WORDMARK.bbox.minX * scale,
    baselineY: h * C.centerY,
  };
}

const splitSubpaths = (d: string) => {
  const parts = d.split(/(?=M)/g).filter((p) => p.trim().length > 1);
  return parts.length ? parts : [d];
};

/* ── curves ───────────────────────────────────────────────────────────────── */
type Curve = { pts: Float32Array; nrm: Float32Array };

/** A fan of tilted ellipses, resampled to equal arc length so particles move evenly. */
function buildCurves(w: number, h: number): Curve[] {
  const rand = rng(SEED ^ 24378);
  const r = (a: number, b: number) => a + rand() * (b - a);
  const N = C.curveSamples;
  const curves: Curve[] = [];

  for (let i = 0; i < C.curveCount; i++) {
    const a = (i + 0.5) / C.curveCount;
    const angle = (a - 0.5) * 1.15 + r(-0.1, 0.1);
    const rx = w * 0.062 * r(0.75, 1.25);
    const ry = h * 0.44 * r(0.8, 1.15);
    const cx = w * 0.5 + (a - 0.5) * w * 0.75;
    const cy = h * 0.46 + r(-0.037, 0.037) * h;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const pts = new Float32Array(N * 2);
    const nrm = new Float32Array(N * 2);

    const at = (th: number) => {
      const k = Math.cos(th), s = Math.sin(th);
      return [
        cx + rx * k * cos - ry * s * sin,
        cy + rx * k * sin + ry * s * cos,
        -rx * s * cos - ry * k * sin,
        -rx * s * sin + ry * k * cos,
      ];
    };

    const M = N * 8;
    const len = new Float64Array(M + 1);
    let [px, py] = at(0);
    for (let j = 1; j <= M; j++) {
      const [x, y] = at((j / M) * Math.PI * 2);
      len[j] = len[j - 1] + Math.hypot(x - px, y - py);
      px = x; py = y;
    }
    const total = len[M];
    let seg = 1;
    for (let j = 0; j < N; j++) {
      const target = (j / N) * total;
      while (seg < M && len[seg] < target) seg++;
      const sl = len[seg] - len[seg - 1] || 1;
      const u = (seg - 1 + (target - len[seg - 1]) / sl) / M;
      const [x, y, dx, dy] = at(u * Math.PI * 2);
      pts[j * 2] = x; pts[j * 2 + 1] = y;
      const l = Math.hypot(dx, dy) || 1;
      nrm[j * 2] = -dy / l; nrm[j * 2 + 1] = dx / l;
    }
    curves.push({ pts, nrm });
  }
  return curves;
}

/* ── particles ────────────────────────────────────────────────────────────── */
type Particles = {
  homeX: Float32Array; homeY: Float32Array; curve: Int16Array; u0: Float32Array;
  lateral: Float32Array; speed: Float32Array; alpha: Float32Array; count: number;
};
const emptyParticles = (): Particles => ({
  homeX: new Float32Array(0), homeY: new Float32Array(0), curve: new Int16Array(0),
  u0: new Float32Array(0), lateral: new Float32Array(0), speed: new Float32Array(0),
  alpha: new Float32Array(0), count: 0,
});

/** Rasterise the wordmark offscreen, sample its filled pixels, bind each to a curve. */
function buildParticles(w: number, h: number, L: Layout, curves: Curve[]): Particles {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  if (!ctx) return emptyParticles();
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#fff';
  ctx.save();
  ctx.translate(L.originX, L.baselineY);
  ctx.scale(L.scale, L.scale);
  for (const letter of WORDMARK.letters) ctx.fill(new Path2D(letter.d));
  ctx.restore();

  const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const rand = rng(SEED ^ 4660);

  // Coarsen the grid until the count fits the budget, rather than truncating.
  let grid = C.sampleGrid;
  let hits: number[] = [];
  for (let attempt = 0; attempt < 4; attempt++) {
    hits = [];
    for (let y = 0; y < h; y += grid) {
      for (let x = 0; x < w; x += grid) {
        const idx = (Math.round(y * dpr) * cv.width + Math.round(x * dpr)) * 4 + 3;
        if (data[idx] > 128) hits.push(x, y);
      }
    }
    if (hits.length / 2 <= C.maxParticles) break;
    grid += 1;
  }

  const n = hits.length / 2;
  const p: Particles = {
    homeX: new Float32Array(n), homeY: new Float32Array(n), curve: new Int16Array(n),
    u0: new Float32Array(n), lateral: new Float32Array(n), speed: new Float32Array(n),
    alpha: new Float32Array(n), count: n,
  };
  const S = C.curveSamples, STEP = 8;

  for (let i = 0; i < n; i++) {
    const x = hits[i * 2] + (rand() * 2 - 1);
    const y = hits[i * 2 + 1] + (rand() * 2 - 1);
    p.homeX[i] = x; p.homeY[i] = y;
    p.speed[i] = 0.08 + Math.pow(rand(), 1.6) * 1.25;
    p.alpha[i] = 0.55 + rand() * 0.45;

    // Coarse pass over every curve, then a fine pass around the winner.
    let best = 0, bestIdx = 0, bestD = Infinity;
    for (let c = 0; c < curves.length; c++) {
      const pts = curves[c].pts;
      for (let j = 0; j < S; j += STEP) {
        const dx = pts[j * 2] - x, dy = pts[j * 2 + 1] - y, d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = c; bestIdx = j; }
      }
    }
    const pts = curves[best].pts;
    bestD = Infinity;
    let fine = bestIdx;
    for (let k = bestIdx - STEP; k <= bestIdx + STEP; k++) {
      const j = (k + S) % S;
      const dx = pts[j * 2] - x, dy = pts[j * 2 + 1] - y, d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; fine = j; }
    }
    p.curve[i] = best;
    p.u0[i] = (fine / S) * Math.PI * 2;
    const nx = curves[best].nrm[fine * 2], ny = curves[best].nrm[fine * 2 + 1];
    p.lateral[i] = (x - pts[fine * 2]) * nx + (y - pts[fine * 2 + 1]) * ny;
  }
  return p;
}

function sampleCurve(c: Curve, theta: number, out: { x: number; y: number; nx: number; ny: number }) {
  const N = C.curveSamples;
  let s = Math.floor((theta / (Math.PI * 2)) * N) % N;
  if (s < 0) s += N;
  out.x = c.pts[s * 2]; out.y = c.pts[s * 2 + 1];
  out.nx = c.nrm[s * 2]; out.ny = c.nrm[s * 2 + 1];
}

/* ── component ────────────────────────────────────────────────────────────── */
export default function IntroSequence() {
  const [mode, setMode] = useState<'pending' | 'full' | 'reduced' | 'off'>('pending');
  const [swept, setSwept] = useState(false);
  const [definitionIn, setDefinitionIn] = useState(false);
  // The particles collapse and vanish; the definition should go with them
  // rather than sitting alone on black waiting for the sweep.
  const [definitionOut, setDefinitionOut] = useState(false);
  const [size, setSize] = useState({ w: 1440, h: 816 });

  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outlineRefs = useRef<(SVGPathElement | null)[]>([]);
  const clipRectRef = useRef<SVGRectElement>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const skipRef = useRef<{ at: number; from: number } | null>(null);
  const doneRef = useRef(false);

  /*
    Decide once, on mount, before the browser paints.

    This was a useEffect, which runs after paint: the landing page was drawn,
    then the intro decided to play and covered it, so every first visit opened
    on a flash of the page the intro was meant to reveal. A layout effect
    decides before that paint. On a full page load the server-rendered page
    paints before any script can run at all, so the root layout also sets
    INTRO_COVER_CLASS from a blocking inline script, and the effect below hands
    over from that cover in the same frame the overlay appears.
  */
  useLayoutEffect(() => {
    try { RETIRED_KEYS.forEach((k) => localStorage.removeItem(k)); } catch { /* private browsing */ }

    const forced = new URLSearchParams(window.location.search).has('intro');
    const alwaysPlay = forced || process.env.NODE_ENV === 'development';
    let seen = false;
    try { seen = !!sessionStorage.getItem(SESSION_KEY); } catch { /* blocked storage */ }
    if (!alwaysPlay && seen) { setMode('off'); return; }

    setSize({ w: window.innerWidth, h: window.innerHeight });
    setMode(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full');
  }, []);

  const L = useMemo(() => layout(size.w, size.h), [size.w, size.h]);

  /** One entry per subpath, each with its own small delay. */
  const subpaths = useMemo(() => {
    const rand = rng(SEED);
    const out: { d: string; delay: number }[] = [];
    for (const letter of WORDMARK.letters) {
      const letterDelay = rand() * T.letterStaggerMax;
      for (const d of splitSubpaths(letter.d)) {
        out.push({ d, delay: letterDelay + rand() * T.subpathJitter });
      }
    }
    return out;
  }, []);

  const curves = useMemo(
    () => (mode === 'full' ? buildCurves(size.w, size.h) : null),
    [mode, size.w, size.h],
  );
  const particlesRef = useRef<Particles>(emptyParticles());

  const finishRef = useRef(() => {});
  finishRef.current = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* blocked storage */ }
    document.body.style.overflow = '';
    setMode('off');
  };

  /*
    Take over from the pre-paint cover. Once the decision is made, either the
    overlay is now in the DOM (full, reduced) or there is nothing to play (off),
    and in both cases the cover has done its job. Removing it here, before
    paint, means the overlay and the cover swap within a single frame.
  */
  useLayoutEffect(() => {
    if (mode === 'pending') return;
    document.documentElement.classList.remove(INTRO_COVER_CLASS);
  }, [mode]);

  /* Hold the page still while it plays. */
  useLayoutEffect(() => {
    if (mode !== 'full' && mode !== 'reduced') return;
    window.scrollTo(0, 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mode]);

  /* Reduced motion keeps the old shape: name, definition, then the same sweep. */
  useEffect(() => {
    if (mode !== 'reduced') return;
    const t1 = setTimeout(() => setDefinitionIn(true), 500);
    const t2 = setTimeout(() => setSwept(true), 1500);
    const t3 = setTimeout(() => finishRef.current(), 2100);
    return () => { [t1, t2, t3].forEach(clearTimeout); };
  }, [mode]);

  /* Any interaction fast-forwards rather than trapping the visitor. */
  useEffect(() => {
    if (mode !== 'full') return;
    const skip = () => {
      if (skipRef.current || doneRef.current || !startRef.current) return;
      const now = performance.now() - startRef.current;
      skipRef.current = { at: now, from: now };
    };
    const evts = ['click', 'keydown', 'scroll', 'wheel', 'touchstart'] as const;
    evts.forEach((e) => window.addEventListener(e, skip, { passive: true }));
    return () => evts.forEach((e) => window.removeEventListener(e, skip));
  }, [mode]);

  /* Main loop. */
  useEffect(() => {
    if (mode !== 'full' || !curves) return;
    const canvas = canvasRef.current, svg = svgRef.current;
    if (!canvas || !svg) return;

    let cancelled = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) { finishRef.current(); return; }
    ctx.scale(dpr, dpr);

    const lengths = outlineRefs.current.map((p) => {
      try { return p?.getTotalLength?.() ?? 0; } catch { return 0; }
    });
    outlineRefs.current.forEach((p, i) => {
      if (!p) return;
      p.style.strokeDasharray = `${lengths[i]}`;
      p.style.strokeDashoffset = `${lengths[i]}`;
    });

    const pt = { x: 0, y: 0, nx: 0, ny: 0 };
    let definitionFired = false;
    let definitionOutFired = false;
    let sweepFired = false;

    const render = (t: number) => {
      const svgPhase = t < T.swap;
      svg.style.visibility = svgPhase ? 'visible' : 'hidden';
      canvas.style.visibility = svgPhase ? 'hidden' : 'visible';

      if (!definitionFired && t >= T.definitionAt) { definitionFired = true; setDefinitionIn(true); }
      if (!definitionOutFired && t >= T.collapseStart) { definitionOutFired = true; setDefinitionOut(true); }
      if (!sweepFired && t >= T.sweepAt) { sweepFired = true; setSwept(true); }

      if (svgPhase) {
        for (let i = 0; i < outlineRefs.current.length; i++) {
          const path = outlineRefs.current[i];
          if (!path) continue;
          const k = clamp01((t - T.outlineStart - subpaths[i].delay) / T.letterDraw);
          path.style.strokeDashoffset = `${lengths[i] * (1 - drawEase(k))}`;
        }
        const f = fillEase(clamp01((t - T.fillStart) / (T.fillEnd - T.fillStart)));
        const rect = clipRectRef.current;
        if (rect) {
          const fw = size.w * f;
          rect.setAttribute('x', `${size.w - fw}`);
          rect.setAttribute('width', `${fw}`);
        }
        return;
      }

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, size.w, size.h);

      // Dashed ellipses fade in, hold, then fade with the collapse.
      let ca: number;
      if (t < T.curvesFadeIn) ca = C.curveAlpha * clamp01((t - T.swap) / (T.curvesFadeIn - T.swap));
      else if (t < T.collapseStart) ca = C.curveAlpha;
      else ca = C.curveAlpha * (1 - clamp01((t - T.collapseStart) / (T.collapseEnd - T.collapseStart)));
      if (ca > 0.002) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = ca;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 1;
        ctx.setLineDash(C.curveDash);
        for (const c of curves) {
          ctx.beginPath();
          ctx.moveTo(c.pts[0], c.pts[1]);
          for (let j = 1; j < C.curveSamples; j++) ctx.lineTo(c.pts[j * 2], c.pts[j * 2 + 1]);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      const P = particlesRef.current;
      if (!P.count) return;

      const travel = clamp01((t - T.travelStart) / (T.travelEnd - T.travelStart));
      const collapsing = t > T.collapseStart;
      const col = collapsing ? clamp01((t - T.collapseStart) / (T.collapseEnd - T.collapseStart)) : 0;
      const ck = clamp01(travel / C.colorLerpEnd);
      const r = Math.round(lerp(C.from[0], C.to[0], ck));
      const g = Math.round(lerp(C.from[1], C.to[1], ck));
      const b = Math.round(lerp(C.from[2], C.to[2], ck));
      const mix = easeInQuad(travel);
      const along = easeInQuad(travel) * C.travelSpan;
      const size0 = C.particleSize * (1 - 0.4 * col);
      const fade = 1 - easeInCubic(col);
      const centerX = size.w * 0.5;
      const colE = easeOutCubic(col);

      // Two passes: a wide dim halo, then the particle. Additive, so overlaps glow.
      ctx.globalCompositeOperation = 'lighter';
      for (let pass = 0; pass < 2; pass++) {
        const halo = pass === 0;
        for (let tier = 0; tier < C.alphaTiers; tier++) {
          const lo = tier / C.alphaTiers, hi = (tier + 1) / C.alphaTiers;
          const a = ((lo + hi) / 2) * fade * (halo ? C.haloAlpha : 1);
          if (a <= 0.004) continue;
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          const sz = halo ? size0 * C.haloScale : size0;
          const off = (sz - size0) / 2;
          for (let i = 0; i < P.count; i++) {
            const pa = P.alpha[i];
            if (pa < lo || pa >= hi) continue;
            sampleCurve(curves[P.curve[i]], P.u0[i] + P.speed[i] * along, pt);
            const lat = 1 - travel;
            const tx = pt.x + pt.nx * P.lateral[i] * lat;
            const ty = pt.y + pt.ny * P.lateral[i] * lat;
            let x = lerp(P.homeX[i], tx, mix);
            const y = lerp(P.homeY[i], ty, mix);
            if (collapsing) x = lerp(x, centerX, colE);
            ctx.fillRect(x - off, y - off, sz, sz);
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      if (t > T.collapseEnd) canvas.style.visibility = 'hidden';
    };

    const frame = () => {
      if (cancelled) return;
      const raw = performance.now() - startRef.current;
      let t = raw;
      if (skipRef.current) {
        const k = clamp01((raw - skipRef.current.from) / T.skipDuration);
        t = lerp(skipRef.current.at, T.end, k);
      }
      render(t);
      if (t >= T.end) { finishRef.current(); return; }
      rafRef.current = requestAnimationFrame(frame);
    };

    try {
      particlesRef.current = buildParticles(size.w, size.h, L, curves);
    } catch {
      finishRef.current();
      return;
    }
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(frame);

    return () => { cancelled = true; cancelAnimationFrame(rafRef.current); };
  }, [mode, curves, size.w, size.h, L, subpaths]);

  if (mode === 'pending' || mode === 'off') return null;

  const sweep = (delay: number): React.CSSProperties => ({
    transform: swept ? 'translateY(-100%)' : 'translateY(0%)',
    transition: swept ? `transform ${REVEAL_PANEL_MS}ms ${EASE} ${delay}ms` : 'none',
    willChange: 'transform',
  });

  return (
    <>
      {/* The trailing panel, mounted at rest so it has a value to animate from.
          The dark surface lifts first and this lavender one follows 80ms behind,
          the same pairing the page wipe uses, travelling up instead of across. */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 ${LEAD_BG}`}
        style={{ zIndex: 199, ...sweep(REVEAL_LEAD_DELAY_MS) }}
      />

      <div
        ref={rootRef}
        aria-hidden="true"
        role="presentation"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          backgroundColor: C.bg,
          overflow: 'hidden',
          pointerEvents: 'none',
          ...sweep(0),
        }}
      >
        {mode === 'full' && (
          <>
            <svg
              ref={svgRef}
              width={size.w}
              height={size.h}
              viewBox={`0 0 ${size.w} ${size.h}`}
              style={{ position: 'absolute', inset: 0, display: 'block' }}
            >
              <defs>
                <clipPath id="intro-fill-clip">
                  <rect ref={clipRectRef} x={size.w} y={0} width={0} height={size.h} />
                </clipPath>
              </defs>

              {/* Outlines, drawn on by stroke-dashoffset. */}
              <g
                transform={`translate(${L.originX} ${L.baselineY}) scale(${L.scale})`}
                fill="none"
                stroke={C.ink}
                strokeWidth={C.strokeWidth / L.scale}
              >
                {subpaths.map((sp, i) => (
                  <path
                    key={i}
                    ref={(el) => { if (el) outlineRefs.current[i] = el; }}
                    d={sp.d}
                  />
                ))}
              </g>

              {/* Solid fill, revealed right to left by the clip rect. */}
              <g clipPath="url(#intro-fill-clip)">
                <g transform={`translate(${L.originX} ${L.baselineY}) scale(${L.scale})`} fill={C.ink}>
                  {WORDMARK.letters.map((letter, i) => <path key={i} d={letter.d} />)}
                </g>
              </g>
            </svg>

            <canvas
              ref={canvasRef}
              style={{ position: 'absolute', inset: 0, display: 'block', visibility: 'hidden' }}
            />
          </>
        )}

        {/* Reduced motion never rasterises anything: the name is plain text. */}
        {mode === 'reduced' && (
          <div
            style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: '0 24px',
            }}
          >
            <span
              className="font-bold tracking-tight select-none"
              style={{ color: C.ink, fontSize: 'clamp(2.2rem, 9vw, 5rem)' }}
            >
              {WORDMARK.text}
            </span>
          </div>
        )}

        {/* The definition, unchanged in concept and casing. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `calc(${C.centerY * 100}% + clamp(34px, 7vw, 76px))`,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 24px',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              color: '#D9CFFB', // halo-lavender
              fontSize: 'clamp(0.72rem, 2.1vw, 0.95rem)',
              fontWeight: 300,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              opacity: definitionOut ? 0 : definitionIn ? 1 : 0,
              transform: definitionIn ? 'translateY(0)' : 'translateY(6px)',
              transition: definitionOut
                ? `opacity ${T.collapseEnd - T.collapseStart}ms ease-in`
                : 'opacity 420ms ease, transform 520ms cubic-bezier(0.16, 1, 0.3, 1)',
              userSelect: 'none',
              textAlign: 'center',
            }}
          >
            {BRAND_DEFINITION}
          </span>
        </div>
      </div>
    </>
  );
}
