'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Calendar, MessageSquare, TrendingUp, Shield, Users } from 'lucide-react';
import IntroSequence from '@/components/marketing/IntroSequence';
import MentorSection from '@/components/marketing/MentorSection';
import MenteeCarousel from '@/components/marketing/MenteeCarousel';
import MatchPreview from '@/components/marketing/MatchPreview';
import LifecycleSection from '@/components/marketing/LifecycleSection';
import InviteModal from '@/components/marketing/InviteModal';

// ─── Data ────────────────────────────────────────────────────────────────────

// PLACEHOLDER: Firm names reflect where mentors/demo data work.
// They do NOT imply partnership, endorsement, or affiliation.
// Replace with verified mentor employer data before public launch.
const MENTOR_FIRMS = [
  'Goldman Sachs',
  'McKinsey & Company',
  'Blackstone',
  'Sequoia Capital',
  'JPMorgan',
  'BCG',
  'KKR',
  'Google',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create your profile',
    description: 'Tell us about your background, goals, and where you want to be. Takes under 5 minutes.',
  },
  {
    step: '02',
    title: 'Get matched',
    description: 'Our algorithm surfaces mentors based on your specific goals, industry, and career stage.',
  },
  {
    step: '03',
    title: 'Send a request',
    description: 'Reach out with a personalized note about why you want to connect.',
  },
  {
    step: '04',
    title: 'Start growing',
    description: 'Meet 1:1, work through goals, track action items, and build a relationship that lasts.',
  },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Curated mentor network',
    description: 'Mentors are professionals at leading firms — not random freelancers.',
  },
  {
    icon: TrendingUp,
    title: 'Matching that explains itself',
    description: 'We surface mentors based on your goals, school, industry, and career stage — and show you exactly why they match.',
  },
  {
    icon: Calendar,
    title: 'Structured sessions',
    description: 'Set agendas, track goals, capture action items. Every session moves you forward.',
  },
  {
    icon: MessageSquare,
    title: 'Async messaging',
    description: 'Ask questions between sessions. Your mentor is in your corner throughout the process.',
  },
  {
    icon: CheckCircle,
    title: 'Goal tracking',
    description: 'Define your goals, set milestones, and see your progress over time.',
  },
  {
    icon: Shield,
    title: 'Private and secure',
    description: 'Your conversations stay between you and your mentor. Always.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {/* A — Cinematic intro (client, session-gated, aria-hidden) */}
      <IntroSequence />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-navy-900 tracking-tight">Mentee</span>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-navy-900 transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-navy-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy-800 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* B — Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-navy-600 uppercase tracking-[0.18em] mb-8">
            Mentorship changes trajectories
          </p>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-navy-900 leading-[1.05] tracking-tight mb-8">
            Find the mentor{' '}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">who changes</span>
              <span
                aria-hidden="true"
                className="absolute bottom-2 left-0 right-0 h-3 bg-navy-100 -z-10 -rotate-1"
              />
            </span>{' '}
            everything.
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8 font-light">
            Mentee connects ambitious students and early-career professionals
            with people who have already traveled the path ahead of them.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-navy-900 text-white px-8 py-4 rounded-xl font-medium text-base hover:bg-navy-800 transition-colors"
            >
              Find your mentor
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 text-navy-900 px-8 py-4 rounded-xl font-medium text-base hover:bg-gray-50 transition-colors"
            >
              Become a mentor
            </Link>
          </div>
        </div>
      </section>

      {/* C — Employer credibility strip */}
      <section className="py-8 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-6">
            Our mentors work at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {MENTOR_FIRMS.map((firm) => (
              <span
                key={firm}
                className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-default"
              >
                {firm}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* D + E + F — Philosophy intro → six mentor profiles */}
      <MentorSection />

      {/* G — Current mentees carousel */}
      <MenteeCarousel />

      {/* H — Intelligent matching */}
      <section className="py-16 px-6 bg-navy-900">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-navy-400 uppercase tracking-[0.15em] mb-4">
                Intelligent matching
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                More than a search bar.
              </h2>
              <p className="text-navy-300 font-light leading-relaxed mb-8">
                Mentee doesn&apos;t just list mentors. It surfaces exactly why a
                person could be relevant to your goals — so your first message
                isn&apos;t cold, it&apos;s informed.
              </p>
              <ul className="space-y-3">
                {[
                  'Match on industry, school, goals, and career stage',
                  'See a clear explanation of why each mentor fits',
                  'Filter by availability, format, and focus area',
                  'Save mentors you want to revisit',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm text-navy-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center lg:justify-end">
              <MatchPreview />
            </div>
          </div>
        </div>
      </section>

      {/* G — Relationship lifecycle */}
      <LifecycleSection />

      {/* G — How it works */}
      <section className="py-16 px-6 bg-navy-900 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-navy-300 text-lg font-light">
              From signup to your first session in under a week.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step}>
                <div className="text-6xl font-bold text-navy-700 mb-4 leading-none">{step.step}</div>
                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-navy-300 text-sm leading-relaxed font-light">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* G — Platform features */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">
              Built for serious outcomes
            </h2>
            <p className="text-gray-500 text-lg font-light max-w-xl mx-auto">
              Not a directory. Not a marketplace. A platform designed for
              meaningful, long-term mentor relationships.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl border border-gray-100 hover:border-navy-100 hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-navy-700" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-navy-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* I — Beyond Advice / Opportunity Fund */}
      <section className="py-16 px-6 bg-gray-50/60 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-[0.18em] mb-4">
                Beyond advice
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-6 leading-tight">
                Access doesn&apos;t stop at the introduction.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4 font-light">
                Great mentorship can identify the next opportunity. For students with demonstrated financial need,
                Mentee is building an Opportunity Fund designed to help remove practical barriers —
                professional attire, networking, travel, and career-development expenses that stand
                between guidance and action.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                The Opportunity Fund is in its pilot phase. We are building partnerships to fund the first cohort.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors"
              >
                Learn about the Opportunity Fund
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Professional Attire', detail: 'Interview suit, tailoring, professional footwear' },
                { label: 'Networking', detail: 'Coffee chats, industry events, professional meetups' },
                { label: 'Travel', detail: 'Interviews, career fairs, office visits, conferences' },
                { label: 'Career Development', detail: 'Certifications, prep resources, professional materials' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-4"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* J — Final CTA */}
      <section className="py-20 px-6 bg-navy-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-navy-400 uppercase tracking-[0.18em] mb-8">
            Get started
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to find your mentor?
          </h2>
          <p className="text-navy-300 text-lg font-light mb-8 max-w-xl mx-auto">
            Join students and professionals building relationships with mentors
            who have already traveled their path.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-navy-900 px-10 py-4 rounded-xl font-semibold text-base hover:bg-gray-100 transition-colors"
          >
            Get started — it&apos;s free
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <p className="text-navy-500 text-sm mt-6">No credit card required.</p>
          <p className="text-navy-600 text-sm mt-4">
            Know someone who would make a great mentor?{' '}
            <button
              onClick={() => setInviteOpen(true)}
              className="text-white underline underline-offset-2 hover:text-navy-200 transition-colors"
            >
              Invite them →
            </button>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-navy-900 tracking-tight">Mentee</span>
          <div className="flex gap-8 text-sm text-gray-400">
            <Link href="/login" className="hover:text-navy-900 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-navy-900 transition-colors">Create account</Link>
          </div>
          <p className="text-sm text-gray-400">&copy; 2026 Mentee. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
