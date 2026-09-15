'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Circle, CheckCircle2, ArrowRight, Calendar, Target, Send, Search } from 'lucide-react';
import { trackLandingEvent } from '@/lib/landing-analytics';
import CtaButton from '@/components/marketing/CtaButton';

const STAGES = [
  { id: 'discover', label: 'Discover', icon: Search,   url: 'discover' },
  { id: 'request',  label: 'Request',  icon: Send,     url: 'requests' },
  { id: 'goals',    label: 'Goals',    icon: Target,   url: 'goals' },
  { id: 'session',  label: 'Sessions', icon: Calendar, url: 'schedule' },
] as const;

type StageId = (typeof STAGES)[number]['id'];

const MENTOR = {
  name: 'Christopher Floyd, CFA',
  role: 'Head of Institutional Sales · Bondway.ai',
  photo: '/people/christopher-floyd.jpg',
  helps: ['Fixed Income', 'Capital Markets'],
};

// ─── Stage 1: Discover ────────────────────────────────────────────────────────

function Discover({ onPick }: { onPick: () => void }) {
  return (
    <div className="space-y-3">
      <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.18em]">
        Mentors matching fixed income
      </p>

      <button
        onClick={onPick}
        className="w-full flex items-center gap-4 p-3.5 bg-white rounded-xl border border-halo-rule hover:border-halo-purple hover:shadow-md transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
      >
        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-none bg-halo-bone">
          <Image src={MENTOR.photo} alt="" fill className="object-cover" style={{ objectPosition: '50% 5%' }} sizes="56px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-halo-ink truncate">{MENTOR.name}</p>
          <p className="text-[11px] text-halo-mist-body font-light truncate">{MENTOR.role}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {MENTOR.helps.map((t) => (
              <span key={t} className="text-[10px] font-medium text-halo-heather bg-halo-lav-wash rounded-full px-2 py-0.5">{t}</span>
            ))}
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-halo-mist-body group-hover:text-halo-purple-d group-hover:translate-x-0.5 transition-all flex-none" aria-hidden="true" />
      </button>

      {[
        { n: 'Tiffany Lakey', r: 'Chief of Staff, CIB · Wells Fargo' },
        { n: 'Will Alston', r: 'Head of Corporate Banking · Wells Fargo' },
      ].map((m) => (
        // opacity-80 on the wrapper pulled the role line under 4.5:1 even
        // though text-halo-mist-body passes on its own. These rows are meant to read
        // as secondary options, so the de-emphasis moves to the surface — a
        // recessed background instead of dimmed text.
        <div key={m.n} className="flex items-center gap-4 p-3.5 bg-halo-veil rounded-xl border border-halo-rule">
          <div className="w-14 h-14 rounded-xl flex-none bg-halo-lav-wash" />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-halo-ink truncate">{m.n}</p>
            <p className="text-[11px] text-halo-heather font-light truncate">{m.r}</p>
          </div>
        </div>
      ))}

      <p className="text-[10px] text-halo-purple-d font-medium pt-1">↑ Pick Christopher to continue</p>
    </div>
  );
}

// ─── Stage 2: Request ─────────────────────────────────────────────────────────

function Request({ onSend }: { onSend: () => void }) {
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(onSend, 750);
    return () => clearTimeout(t);
  }, [sent, onSend]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3.5 border-b border-halo-rule">
        <div className="relative w-9 h-9 rounded-full overflow-hidden flex-none bg-halo-bone">
          <Image src={MENTOR.photo} alt="" fill className="object-cover" style={{ objectPosition: '50% 5%' }} sizes="36px" />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-halo-ink truncate">{MENTOR.name}</p>
          <p className="text-[10px] text-halo-mist-body font-light">Requesting mentorship</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-halo-purple-d uppercase tracking-wider mb-1.5">
          What are you hoping to learn?
        </p>
        <div className="text-[12px] text-halo-heather bg-halo-veil rounded-xl px-3.5 py-2.5 border border-halo-rule">
          Fixed-income strategy and how markets desks actually work
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-halo-purple-d uppercase tracking-wider mb-1.5">
          Why Christopher?
        </p>
        <div className="text-[12px] text-halo-heather bg-halo-veil rounded-xl px-3.5 py-2.5 border border-halo-rule leading-relaxed">
          Three decades in institutional fixed income. That is the path I am trying to understand.
        </div>
      </div>

      <button
        onClick={() => setSent(true)}
        disabled={sent}
        className={`w-full rounded-xl py-2.5 text-[12px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${
          sent ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-halo-purple text-white hover:bg-halo-purple-d'
        }`}
      >
        {sent ? 'Request sent. Christopher accepted.' : 'Request mentorship'}
      </button>
      <p className="text-[11px] text-halo-mist-body text-center">Nothing is sent from this preview.</p>
    </div>
  );
}

// ─── Stage 3: Goals ───────────────────────────────────────────────────────────

function Goals({ onNext }: { onNext: () => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({ a: true, b: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-halo-ink">Shared goal</p>
        <span className="text-[10px] font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5">Active</span>
      </div>

      <div className="bg-white rounded-xl border border-halo-rule p-4">
        <p className="text-[14px] font-semibold text-halo-ink leading-snug">
          Understand fixed-income career paths
        </p>
        <p className="text-[10px] text-halo-mist-body mt-1">Target: June 2027 · with Christopher</p>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-halo-purple-d uppercase tracking-wider mb-2">Next steps</p>
        <div className="space-y-1.5">
          {[
            { k: 'a', t: 'Read up on how a rates desk is structured' },
            { k: 'b', t: 'Prepare 3 questions before Thursday' },
          ].map((item) => (
            <button
              key={item.k}
              onClick={() => setDone((d) => ({ ...d, [item.k]: !d[item.k] }))}
              className="w-full flex items-center gap-2.5 text-left p-2 rounded-xl hover:bg-halo-veil transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
              aria-pressed={done[item.k]}
            >
              {done[item.k]
                ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-none" aria-hidden="true" />
                : <Circle className="w-4 h-4 text-halo-mist-body flex-none" aria-hidden="true" />}
              <span className={`text-[12px] ${done[item.k] ? 'text-halo-mist-body line-through font-light' : 'text-halo-heather'}`}>
                {item.t}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-halo-mist-body mt-2 pl-2">Try checking one off.</p>
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-xl py-2.5 text-[12px] font-semibold bg-halo-purple text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
      >
        See the upcoming session
      </button>
    </div>
  );
}

// ─── Stage 4: Session ─────────────────────────────────────────────────────────

function Session() {
  return (
    <div className="space-y-3.5">
      <div className="bg-halo-deep rounded-xl p-4">
        <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.18em] mb-3">Upcoming session</p>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-none ring-2 ring-halo-deep-rule">
            <Image src={MENTOR.photo} alt="" fill className="object-cover" style={{ objectPosition: '50% 5%' }} sizes="40px" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-white truncate">{MENTOR.name}</p>
            <p className="text-[11px] text-halo-lavender font-light">Thursday · 4:00 PM · 45 min</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-halo-rule p-4">
        <p className="text-[10px] font-semibold text-halo-purple-d uppercase tracking-wider mb-2.5">Prep</p>
        <ul className="space-y-1.5">
          {[
            'Questions on desk structure and day-to-day',
            'Progress against the shared goal',
            'What to read before the next session',
          ].map((t) => (
            <li key={t} className="flex items-start gap-2 text-[12px] text-halo-heather font-light">
              <span className="w-1 h-1 rounded-full bg-halo-mist mt-1.5 flex-none" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-halo-rule p-4">
        <p className="text-[10px] font-semibold text-halo-purple-d uppercase tracking-wider mb-2.5">
          Carried over from last session
        </p>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-none" aria-hidden="true" />
          <span className="text-[12px] text-halo-mist-body line-through font-light">Research fixed-income desk structure</span>
        </div>
      </div>

      <p className="text-[11px] text-halo-purple-d font-medium text-center pt-1">
        That loop is the product.
      </p>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export default function ProductDemo() {
  const [stage, setStage] = useState<StageId>('discover');
  const [visited, setVisited] = useState<Set<StageId>>(() => new Set<StageId>(['discover']));

  // Both events fire from the handler, never from render. An effect keyed on
  // `stage` also ran on mount, so merely loading the page recorded an
  // interaction that never happened.
  const go = (next: StageId) => {
    // Read the set before updating. A state updater is not a safe place for a
    // side effect: React invokes it twice under Strict Mode, which would log
    // the event twice for one click.
    const firstVisit = !visited.has(next);
    setStage(next);
    setVisited((v) => new Set(v).add(next));
    if (firstVisit) trackLandingEvent('product_demo_stage_viewed', { stage: next });
    trackLandingEvent('product_demo_interacted', { stage: next });
  };

  const activeIdx = STAGES.findIndex((s) => s.id === stage);
  const activeStage = STAGES[activeIdx];

  return (
    <section className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule" aria-labelledby="product-demo-heading">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.15fr] gap-10 lg:gap-16 items-start">

          {/* Left: framing + stage nav */}
          <div className="lg:sticky lg:top-24">
            <p className="font-ui text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.22em] mb-5">
              The product
            </p>
            <h2
              id="product-demo-heading"
              className="font-display text-halo-ink leading-[1.05] mb-5"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
            >
              Everything after<br />the introduction.
            </h2>
            <p className="text-halo-mist-body text-[16px] leading-relaxed mb-7 max-w-md">
              Requests, goals, sessions, and follow-up in one place. Click through the four steps.
            </p>

            {/*
              role="tablist" on the <ol> overrides the element's own list
              semantics, which orphaned all four <li> children and left each
              role="tab" without the tablist parent it requires. The list markup
              is what carries the "four ordered stages" meaning, so keep the
              <ol> and mark the <li> wrappers presentational — the tabs then sit
              directly under the tablist as far as assistive tech is concerned.
            */}
            <ol className="space-y-1" role="tablist" aria-label="Product stages">
              {STAGES.map((s, i) => {
                const isActive = s.id === stage;
                const seen = visited.has(s.id);
                const Icon = s.icon;
                return (
                  <li key={s.id} role="presentation">
                    <button
                      role="tab"
                      id={`demo-tab-${s.id}`}
                      aria-selected={isActive}
                      aria-controls="demo-panel"
                      onClick={() => go(s.id)}
                      className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${
                        isActive ? 'bg-halo-deep' : 'hover:bg-halo-veil'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex-none flex items-center justify-center transition-colors ${
                          isActive ? 'bg-white/15' : seen ? 'bg-halo-lav-wash' : 'bg-halo-bone'
                        }`}
                      >
                        <Icon
                          className={`w-3.5 h-3.5 ${isActive ? 'text-white' : seen ? 'text-halo-purple-d' : 'text-halo-mist-body'}`}
                          aria-hidden="true"
                        />
                      </span>
                      <span className={`text-[14px] font-medium ${isActive ? 'text-white' : 'text-halo-heather'}`}>
                        {s.label}
                      </span>
                      <span className={`ml-auto text-[10px] tabular-nums ${isActive ? 'text-white/70' : 'text-halo-mist-body'}`}>
                        0{i + 1}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <CtaButton
              href="/signup"
              onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'start_building_your_mentorship' })}
              variant="secondary"
              size="md"
              className="mt-7"
            >
              Start building your mentorship
            </CtaButton>
          </div>

          {/* Right: the app window */}
          <div>
            <div className="bg-halo-veil rounded-xl border border-halo-rule shadow-lg overflow-hidden">
              <div className="hidden sm:flex bg-white border-b border-halo-rule px-4 py-2.5 items-center gap-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  {[0, 1, 2].map((i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-gray-200" />)}
                </div>
                <div className="flex-1 bg-halo-veil rounded-xl border border-halo-rule px-3 py-1 text-[11px] text-halo-mist-body font-mono max-w-xs truncate">
                  mentable.com/{activeStage.url}
                </div>
              </div>

              <div
                id="demo-panel"
                role="tabpanel"
                aria-labelledby={`demo-tab-${stage}`}
                tabIndex={0}
                className="p-5 sm:p-6 min-h-[430px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
              >
                {stage === 'discover' && <Discover onPick={() => go('request')} />}
                {stage === 'request'  && <Request onSend={() => go('goals')} />}
                {stage === 'goals'    && <Goals onNext={() => go('session')} />}
                {stage === 'session'  && <Session />}
              </div>
            </div>

            <p aria-live="polite" className="sr-only">
              Showing stage {activeIdx + 1} of {STAGES.length}: {activeStage.label}
            </p>
            <p className="text-center text-[11px] text-halo-mist-body mt-3">
              A preview of the real product.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
