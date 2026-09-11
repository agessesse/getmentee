'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Circle, CheckCircle, Plus } from 'lucide-react';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'discover', label: 'Discover', url: 'discover' },
  { id: 'request', label: 'Request', url: 'requests' },
  { id: 'goals', label: 'Goals', url: 'goals' },
  { id: 'sessions', label: 'Sessions', url: 'schedule' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Demo panels ─────────────────────────────────────────────────────────────

function DiscoverPanel() {
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* Mentor card */}
      <div className="w-full sm:w-72 flex-none bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="relative h-44 bg-gray-100">
          <Image
            src="/people/christopher-floyd.jpg"
            alt="Christopher Floyd, CFA"
            fill
            className="object-cover"
            style={{ objectPosition: '50% 5%' }}
            sizes="(max-width: 640px) 100vw, 288px"
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-[9px] font-semibold text-white/70 uppercase tracking-[0.18em]">Mentor</p>
            <p className="text-sm font-bold text-white leading-tight">Christopher Floyd, CFA</p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-[11px] text-gray-500 mb-3 font-light">Head of Institutional Sales · Bondway.ai</p>
          <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-2">Can help with</p>
          <div className="flex flex-wrap gap-1.5">
            {['Fixed Income', 'Capital Markets', 'Career Development'].map((tag) => (
              <span key={tag} className="text-[10px] font-medium text-navy-700 bg-navy-50 rounded-full px-2.5 py-0.5">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="w-full bg-navy-900 text-white rounded-xl py-2.5 text-xs font-medium text-center select-none">
              Request mentorship
            </div>
          </div>
        </div>
      </div>

      {/* Context */}
      <div className="flex-1 pt-2">
        <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-3">How discovery works</p>
        <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">
          Browse mentors filtered by industry, career stage, and the specific areas they can help
          you navigate. See exactly why each one is relevant before you reach out.
        </p>
        <p className="text-sm text-gray-400 font-light leading-relaxed">
          Every mentor profile shows their background, expertise, and what brought them to Mentee
          — so your first message isn&apos;t cold. It&apos;s informed.
        </p>
      </div>
    </div>
  );
}

function RequestPanel() {
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* Request card */}
      <div className="w-full sm:w-72 flex-none bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        {/* Recipient */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="relative w-9 h-9 rounded-full overflow-hidden flex-none bg-gray-100">
            <Image
              src="/people/christopher-floyd.jpg"
              alt="Christopher Floyd"
              fill
              className="object-cover"
              style={{ objectPosition: '50% 5%' }}
              sizes="36px"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-navy-900 truncate">Christopher Floyd, CFA</p>
            <p className="text-[10px] text-gray-400 font-light truncate">Bondway.ai</p>
          </div>
          <span className="ml-auto flex-none text-[10px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
            Pending
          </span>
        </div>

        {/* Message */}
        <div>
          <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-1.5">Your message</p>
          <p className="text-[11px] text-gray-600 font-light leading-relaxed bg-gray-50 rounded-xl p-3">
            &ldquo;I&rsquo;m studying economics at UNC and hoping to build a career in fixed income. I&rsquo;d love to learn from your path navigating institutional markets.&rdquo;
          </p>
        </div>

        {/* Goal */}
        <div>
          <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-1.5">Working toward</p>
          <p className="text-[11px] text-gray-600 font-light bg-gray-50 rounded-xl p-3">
            A career in fixed-income markets after graduation.
          </p>
        </div>

        <p className="text-[10px] text-gray-300 text-center pt-1">Sent January 12, 2026</p>
      </div>

      {/* Context */}
      <div className="flex-1 pt-2">
        <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-3">How requesting works</p>
        <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">
          When you request mentorship, you share what you&apos;re working toward and why this person
          specifically makes sense for you. Context replaces cold outreach.
        </p>
        <p className="text-sm text-gray-400 font-light leading-relaxed">
          Mentors see your profile, your goals, and your message before deciding whether to accept.
          Every connection starts with purpose.
        </p>
      </div>
    </div>
  );
}

function GoalsPanel() {
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* Goals card */}
      <div className="w-full sm:w-72 flex-none bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-navy-900">Goals</p>
          <span className="text-[10px] text-gray-400 font-light">With Christopher Floyd</span>
        </div>

        {/* Active goal */}
        <div className="border border-gray-100 rounded-xl p-4 hover:border-navy-100 transition-colors">
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-gray-200 flex-none mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-navy-900 leading-tight">Markets Internship Preparation</p>
              <p className="text-[10px] text-gray-400 mt-1">Target: June 2027</p>
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                Build the foundation to excel in a fixed-income markets role.
              </p>
              <span className="inline-block mt-2 text-[9px] font-semibold text-green-600 bg-green-50 rounded-full px-2 py-0.5">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Add goal */}
        <button className="mt-3 w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-[10px] text-gray-400 hover:border-navy-300 hover:text-navy-600 transition-colors flex items-center justify-center gap-1.5">
          <Plus className="w-3 h-3" aria-hidden="true" />
          Add a goal
        </button>

        <p className="text-[9px] text-gray-300 text-center mt-3">Example — illustrative</p>
      </div>

      {/* Context */}
      <div className="flex-1 pt-2">
        <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-3">How goals work</p>
        <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">
          Goals give your mentorship direction. Set them with your mentor, track your progress
          over time, and revisit them as your priorities evolve.
        </p>
        <p className="text-sm text-gray-400 font-light leading-relaxed">
          A goal with a deadline and a partner who checks in on it is fundamentally different
          from an ambition that lives in your notes.
        </p>
      </div>
    </div>
  );
}

function SessionsPanel() {
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* Session card */}
      <div className="w-full sm:w-72 flex-none space-y-3">
        {/* Upcoming session */}
        <div className="bg-navy-50 rounded-2xl p-4">
          <p className="text-[9px] font-semibold text-navy-400 uppercase tracking-wider mb-3">Upcoming session</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden flex-none bg-gray-200">
              <Image
                src="/people/christopher-floyd.jpg"
                alt="Christopher Floyd"
                fill
                className="object-cover"
                style={{ objectPosition: '50% 5%' }}
                sizes="36px"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-navy-900 truncate">Christopher Floyd, CFA</p>
              <p className="text-[10px] text-navy-500 font-light truncate">Head of Institutional Sales</p>
            </div>
          </div>
          <div className="space-y-1 text-[10px] text-navy-600 font-light">
            <p>Tuesday, June 3 · 2:00 PM</p>
            <p>60 min · Video call</p>
          </div>
        </div>

        {/* Action items */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Action items from last session
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-none" aria-hidden="true" />
              <p className="text-[11px] text-gray-400 line-through font-light">
                Research fixed-income desk structure
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Circle className="w-3.5 h-3.5 text-gray-300 flex-none" aria-hidden="true" />
              <p className="text-[11px] text-gray-600 font-light">
                Practice communicating bond pricing concepts
              </p>
            </div>
          </div>
        </div>

        <p className="text-[9px] text-gray-300 text-center">Example — illustrative</p>
      </div>

      {/* Context */}
      <div className="flex-1 pt-2">
        <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-3">How sessions work</p>
        <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">
          Schedule sessions with your mentor, set an agenda, and leave each one with action items
          you&apos;re both accountable to. Progress doesn&apos;t live in your inbox. It lives in the work.
        </p>
        <p className="text-sm text-gray-400 font-light leading-relaxed">
          Every session builds on the last. The relationship compounds because the record is there —
          what you discussed, what you committed to, and what changed as a result.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const PANELS: Record<TabId, React.ReactNode> = {
  discover: <DiscoverPanel />,
  request: <RequestPanel />,
  goals: <GoalsPanel />,
  sessions: <SessionsPanel />,
};

export default function ProductDemo() {
  const [activeId, setActiveId] = useState<TabId>('discover');
  const activeTab = TABS.find((t) => t.id === activeId)!;

  return (
    <section
      className="py-20 px-6 lg:px-10 bg-white border-t border-gray-100"
      aria-labelledby="product-demo-heading"
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-4">
            The platform
          </p>
          <h2
            id="product-demo-heading"
            className="font-bold text-navy-900 leading-tight mb-3"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}
          >
            Not a directory. A structured relationship.
          </h2>
          <p className="text-gray-400 text-sm font-light leading-relaxed max-w-md">
            From discovering who makes sense for you to tracking what you actually build together.
          </p>
        </div>

        {/* Tab navigation */}
        <div
          role="tablist"
          aria-label="Product feature tabs"
          className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-8 overflow-x-auto"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeId === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveId(tab.id)}
              className={`flex-none px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 ${
                activeId === tab.id
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Browser chrome + content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Minimal browser chrome — desktop only */}
          <div className="hidden sm:flex bg-gray-50 border-b border-gray-100 px-4 py-2.5 items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            </div>
            <div className="flex-1 bg-white rounded border border-gray-200 px-3 py-1 text-[11px] text-gray-400 font-mono max-w-xs">
              getmentee.com/{activeTab.url}
            </div>
          </div>

          {/* Panel content */}
          <div
            id={`panel-${activeId}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeId}`}
            className="p-6 sm:p-8"
          >
            {PANELS[activeId]}
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-300 mt-4">
          Illustrative example using real Mentee capabilities.
        </p>

      </div>
    </section>
  );
}
