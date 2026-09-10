'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import IntroSequence from '@/components/marketing/IntroSequence';
import MentorCarousel from '@/components/marketing/MentorCarousel';
import MenteeCarousel from '@/components/marketing/MenteeCarousel';
import InviteModal from '@/components/marketing/InviteModal';
import FirmMarquee from '@/components/marketing/FirmMarquee';

// ─── Data ─────────────────────────────────────────────────────────────────────

const JOURNEY_STEPS = [
  {
    n: '01',
    title: 'Build your profile',
    body: 'Share your background, goals, and where you want to go. Your profile shapes every conversation that follows.',
  },
  {
    n: '02',
    title: 'Find the right person',
    body: 'Browse mentors matched to your goals, industry, and career stage. See exactly why each one is relevant.',
  },
  {
    n: '03',
    title: 'Make the connection',
    body: "Send a note about what you're working toward. Your first message isn't cold — it's informed.",
  },
  {
    n: '04',
    title: 'Build something real',
    body: 'Set goals, meet regularly, track action items. Goals become progress. Progress becomes momentum.',
  },
];

const OUTCOMES = [
  { label: 'Clarity', description: 'A sharper picture of what you want and a realistic path to get there.' },
  { label: 'Capability', description: 'Skills and frameworks you can apply the next day.' },
  { label: 'Confidence', description: 'The kind that comes from someone who has done it telling you that you can.' },
  { label: 'Access', description: 'Introductions and context that would take years to find on your own.' },
  { label: 'Accountability', description: 'Someone invested in your progress who notices when you stop showing up.' },
  { label: 'Continuity', description: 'A relationship that outlasts the first conversation and compounds over time.' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="min-h-screen bg-cream-50">
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {/* A — Cinematic intro */}
      <IntroSequence />

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-50/90 backdrop-blur-sm border-b border-gray-100/80">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-navy-900 tracking-tight">Mentee</span>
          <div className="flex items-center gap-7">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-navy-900 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-navy-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 1. Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-6 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-12 lg:gap-20 items-center">

            {/* Text */}
            <div>
              <h1
                className="font-serif text-navy-900 leading-[0.96] tracking-tight mb-10 max-w-4xl"
                style={{ fontSize: 'clamp(2.9rem, 8.5vw, 6.5rem)' }}
              >
                The right mentor<br />
                changes your<br />
                trajectory.
              </h1>

              <p className="text-xl text-gray-500 font-light leading-relaxed max-w-lg mb-12">
                Mentee connects you with people who have walked the path you&apos;re on
                — and chose to come back.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2.5 bg-navy-900 text-white px-8 py-4 text-[15px] font-medium hover:bg-navy-800 transition-colors rounded-xl"
                >
                  Find your mentor
                  <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
                </Link>
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 text-navy-700 font-medium hover:text-navy-900 transition-colors py-4 text-[15px] border-b border-gray-200 hover:border-navy-400"
                >
                  Become a mentor
                  <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Portrait stack */}
            <div className="hidden lg:block relative h-[420px]" aria-hidden="true">
              <div className="absolute top-4 right-4 w-[200px] h-[285px] rounded-2xl overflow-hidden shadow-2xl rotate-[2.5deg] border-[3px] border-white">
                <Image
                  src="/people/christopher-floyd.jpg"
                  alt="Christopher Floyd, CFA — Mentor"
                  fill
                  className="object-cover"
                  style={{ objectPosition: '50% 5%' }}
                  sizes="200px"
                  priority
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-10">
                  <p className="text-[11px] font-semibold text-white/75 uppercase tracking-[0.22em]">Mentor</p>
                  <p className="text-[11px] font-bold text-white leading-tight">Christopher Floyd, CFA</p>
                  <p className="text-[11px] text-white/75 mt-0.5 font-light">Head of Institutional Sales</p>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 w-[172px] h-[245px] rounded-2xl overflow-hidden shadow-2xl rotate-[-2.5deg] border-[3px] border-white">
                <Image
                  src="/people/abel-gessesse.jpg"
                  alt="Abel Gessesse — Mentee"
                  fill
                  className="object-cover"
                  style={{ objectPosition: '50% 15%' }}
                  sizes="172px"
                  priority
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-10">
                  <p className="text-[11px] font-semibold text-white/75 uppercase tracking-[0.22em]">Mentee</p>
                  <p className="text-[11px] font-bold text-white leading-tight">Abel Gessesse</p>
                  <p className="text-[11px] text-white/75 mt-0.5 font-light">UNC Kenan-Flagler</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. Community — paired mentor + mentee carousels ─────────────────── */}
      <MentorCarousel />
      <MenteeCarousel />

      {/* ── 3. How it works — interactive step selector ──────────────────────── */}
      <section className="py-20 px-6 lg:px-10 bg-white border-t border-gray-100" aria-labelledby="hiw-heading">
        <div className="max-w-6xl mx-auto">

          <div className="mb-16">
            <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-4">
              Getting started
            </p>
            <h2
              id="hiw-heading"
              className="font-bold text-navy-900 leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}
            >
              How it works
            </h2>
            <p className="text-gray-400 text-sm font-light mt-2 leading-relaxed">
              From your first profile to a relationship that compounds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            {/* Step selectors */}
            <div>
              {JOURNEY_STEPS.map((step, i) => (
                <button
                  key={step.n}
                  onClick={() => setActiveStep(i)}
                  className="w-full text-left flex items-baseline gap-6 py-5 border-t border-gray-100 group transition-colors focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-navy-500"
                >
                  <span
                    className={`text-[11px] font-bold tabular-nums flex-none transition-colors ${
                      activeStep === i ? 'text-navy-500' : 'text-gray-200 group-hover:text-gray-300'
                    }`}
                  >
                    {step.n}
                  </span>
                  <span
                    className={`font-semibold text-[15px] leading-tight transition-colors ${
                      activeStep === i
                        ? 'text-navy-900'
                        : 'text-gray-400 group-hover:text-gray-700'
                    }`}
                  >
                    {step.title}
                  </span>
                  {activeStep === i && (
                    <ArrowRight
                      className="w-3.5 h-3.5 flex-none text-navy-400 ml-auto self-center"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
              <div className="border-t border-gray-100" />
            </div>

            {/* Active step detail */}
            <div className="lg:sticky lg:top-24">
              <p
                className="font-bold text-gray-100 leading-none mb-8 select-none"
                style={{ fontSize: 'clamp(5rem, 10vw, 7rem)' }}
                aria-hidden="true"
              >
                {JOURNEY_STEPS[activeStep].n}
              </p>
              <h3 className="text-2xl font-bold text-navy-900 mb-4 leading-tight">
                {JOURNEY_STEPS[activeStep].title}
              </h3>
              <p className="text-gray-500 font-light leading-relaxed text-[16px] max-w-sm">
                {JOURNEY_STEPS[activeStep].body}
              </p>
              <div className="mt-10">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors border-b border-gray-200 hover:border-navy-400 pb-0.5"
                >
                  Get started — it&apos;s free
                  <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. The reward of mentorship (dark) ──────────────────────────────── */}
      <section className="py-24 px-6 lg:px-10 bg-navy-900" aria-labelledby="reward-heading">
        <div className="max-w-6xl mx-auto">

          <div className="mb-16 max-w-2xl">
            <p className="text-[11px] font-semibold text-navy-600 uppercase tracking-[0.22em] mb-6">
              What it produces
            </p>
            <h2
              id="reward-heading"
              className="font-serif text-white leading-tight mb-6"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)' }}
            >
              The reward of<br />mentorship.
            </h2>
            <p className="text-navy-300 font-light leading-relaxed text-[15px] max-w-lg">
              Good mentorship doesn&apos;t produce a single outcome. It changes how you think,
              what you see as possible, and who you become.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-navy-800">
            {OUTCOMES.map((outcome) => (
              <div key={outcome.label} className="bg-navy-900 p-8 hover:bg-navy-800/60 transition-colors">
                <p className="text-white font-semibold text-base mb-2">{outcome.label}</p>
                <p className="text-navy-400 font-light text-[14px] leading-relaxed">{outcome.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 pt-10 border-t border-navy-800">
            <p className="text-navy-500 font-light text-[15px] max-w-xl leading-relaxed">
              None of these are guaranteed. All are possible when the right two people
              find each other. That&apos;s what Mentee is for.
            </p>
          </div>

        </div>
      </section>

      {/* ── 5. Where our mentors have worked — curated logo marquee ─────────── */}
      <FirmMarquee />

      {/* ── 6. Opportunity Fund ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-10 border-t border-gray-100 bg-gray-50/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-[0.22em] mb-6">
                Beyond advice
              </p>
              <h2
                className="font-serif text-navy-900 leading-tight mb-6"
                style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}
              >
                Access doesn&apos;t stop<br />at the introduction.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4 font-light text-[15px]">
                Great mentorship can open a door. For students with demonstrated
                financial need, Mentee is building an Opportunity Fund to remove
                the practical barriers that stand between guidance and action.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                The Opportunity Fund is in its pilot phase. We are building partnerships to fund the first cohort.
              </p>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors border-b border-gray-200 hover:border-navy-400 pb-0.5"
              >
                Learn about the Opportunity Fund
                <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
              </Link>
            </div>

            <div className="space-y-0 divide-y divide-gray-100">
              {[
                { label: 'Professional Attire', detail: 'Interview suit, tailoring, professional footwear' },
                { label: 'Networking', detail: 'Coffee chats, industry events, professional meetups' },
                { label: 'Travel', detail: 'Interviews, career fairs, office visits, conferences' },
                { label: 'Career Development', detail: 'Certifications, prep resources, professional materials' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-5 py-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-light">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-10 bg-navy-900 text-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-semibold text-navy-600 uppercase tracking-[0.22em] mb-8">
            Get started
          </p>
          <h2
            className="font-serif text-white leading-tight mb-6 max-w-2xl"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
          >
            Ready to find<br />your mentor?
          </h2>
          <p className="text-navy-400 font-light mb-10 max-w-md text-[15px] leading-relaxed">
            Create an account and take the first step. The right introduction
            starts with showing up.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2.5 bg-white text-navy-900 px-8 py-4 text-[15px] font-semibold hover:bg-gray-100 transition-colors rounded-xl"
            >
              Get started — it&apos;s free
              <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
            </Link>
          </div>
          <p className="text-navy-700 text-sm mt-6">No credit card required.</p>
          <p className="text-navy-700 text-sm mt-3">
            Know someone who would make a great mentor?{' '}
            <button
              onClick={() => setInviteOpen(true)}
              className="text-navy-400 underline underline-offset-2 hover:text-white transition-colors"
            >
              Invite them
            </button>
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-16 px-6 lg:px-10 bg-navy-900 border-t border-navy-800">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <span className="text-2xl font-bold text-white tracking-tight">Mentee</span>
            <p className="text-navy-500 font-light mt-2 max-w-xs text-sm leading-relaxed">
              Helping ambitious people find the mentors who change what&apos;s possible.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-8 border-t border-navy-800">
            <div className="flex gap-7 text-sm text-navy-500">
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/signup" className="hover:text-white transition-colors">Create account</Link>
            </div>
            <p className="text-sm text-navy-700">&copy; 2026 Mentee. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
