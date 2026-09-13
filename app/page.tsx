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
import ProblemSection from '@/components/marketing/ProblemSection';
import ProductDemo from '@/components/marketing/ProductDemo';
import Flywheel from '@/components/marketing/Flywheel';
import Wordmark, { BRAND_DEFINITION, BRAND_PRONUNCIATION } from '@/components/ui/Wordmark';

// ─── Data ─────────────────────────────────────────────────────────────────────

const OUTCOMES = [
  { label: 'Clarity', description: 'Know what the path actually looks like, not how it’s described in a brochure.' },
  { label: 'Confidence', description: 'Walk into rooms with context you didn’t have before.' },
  { label: 'Opportunity', description: 'Preparation is what turns an introduction into a possibility.' },
  { label: 'Accountability', description: 'Turn conversations into commitments someone else is watching.' },
  { label: 'Perspective', description: 'Borrow lessons that took someone else a decade to learn.' },
  { label: 'Reciprocity', description: 'Eventually become the person you once needed.' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream-50">
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {/* Cinematic intro for first-time visitors */}
      <IntroSequence />

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-50/90 backdrop-blur-sm border-b border-gray-100/80">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Wordmark className="text-navy-900" />
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

      {/* ── 01. Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 sm:pt-36 pb-16 sm:pb-20 px-6 lg:px-10" aria-labelledby="hero-heading">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-12 lg:gap-16 items-center">

            {/* Text */}
            <div>
              {/* Dictionary treatment — makes the name self-explaining */}
              <div className="mb-9 pb-7 border-b border-gray-200/80 max-w-lg">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                  <span className="font-serif text-navy-900 text-[26px] sm:text-[30px] leading-none">
                    Mentable
                  </span>
                  <span className="text-gray-400 text-sm font-light">
                    {BRAND_PRONUNCIATION}
                  </span>
                  <span className="text-gray-400 text-sm italic font-light">adjective</span>
                </div>
                <p className="text-navy-700 text-[15px] font-light">
                  {BRAND_DEFINITION}
                </p>
              </div>

              <h1
                id="hero-heading"
                className="font-serif text-navy-900 leading-[0.98] tracking-tight mb-7 max-w-3xl"
                style={{ fontSize: 'clamp(2.6rem, 7vw, 5.2rem)' }}
              >
                The right mentor<br />
                can change your<br />
                trajectory.
              </h1>

              <p className="text-lg sm:text-xl text-gray-500 font-light leading-relaxed max-w-lg mb-10">
                Mentable connects ambitious students with people who have walked
                the path ahead — and chose to come back.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2.5 bg-navy-900 text-white px-8 py-4 text-[15px] font-medium hover:bg-navy-800 transition-colors rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
                >
                  Find your mentor
                  <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
                </Link>
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 text-navy-700 font-medium hover:text-navy-900 transition-colors py-4 text-[15px] border-b border-gray-200 hover:border-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-sm"
                >
                  Become a mentor
                  <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Two sides of the relationship, made literal */}
            <div className="hidden lg:block" aria-hidden="true">
              <div className="relative h-[380px] w-full">
                {/* Mentor — above */}
                <div className="absolute top-0 right-2 w-[196px] h-[268px] rounded-2xl overflow-hidden shadow-2xl rotate-[2.5deg] border-[3px] border-white">
                  <Image
                    src="/people/christopher-floyd.jpg"
                    alt=""
                    fill
                    className="object-cover"
                    style={{ objectPosition: '50% 5%' }}
                    sizes="196px"
                    priority
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10">
                    <p className="text-[9px] font-semibold text-white/70 uppercase tracking-[0.22em]">
                      Willing to teach
                    </p>
                    <p className="text-[11px] font-bold text-white leading-tight mt-0.5">
                      Christopher Floyd, CFA
                    </p>
                    <p className="text-[10px] text-white/70 mt-0.5 font-light">
                      Head of Institutional Sales
                    </p>
                  </div>
                </div>

                {/* Student — below */}
                <div className="absolute bottom-0 left-2 w-[168px] h-[232px] rounded-2xl overflow-hidden shadow-2xl rotate-[-2.5deg] border-[3px] border-white">
                  <Image
                    src="/people/abel-gessesse.jpg"
                    alt=""
                    fill
                    className="object-cover"
                    style={{ objectPosition: '50% 15%' }}
                    sizes="168px"
                    priority
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10">
                    <p className="text-[9px] font-semibold text-white/70 uppercase tracking-[0.22em]">
                      Ready to learn
                    </p>
                    <p className="text-[11px] font-bold text-white leading-tight mt-0.5">
                      Abel Gessesse
                    </p>
                    <p className="text-[10px] text-white/70 mt-0.5 font-light">
                      UNC Kenan-Flagler
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 02. The problem ──────────────────────────────────────────────────── */}
      <ProblemSection />

      {/* ── 03. Mentors — who could I learn from? ────────────────────────────── */}
      <MentorCarousel />
      <FirmMarquee />

      {/* ── 04. Mentable students — who is this built for? ───────────────────── */}
      <MenteeCarousel />

      {/* ── 05. Product — how does it actually help? ─────────────────────────── */}
      <ProductDemo />

      {/* ── 06. Flywheel — what happens over time? ───────────────────────────── */}
      <Flywheel />

      {/* ── 07. Outcomes — why does this matter? ─────────────────────────────── */}
      <section
        className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50 border-t border-gray-100"
        aria-labelledby="outcomes-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 max-w-xl">
            <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-5">
              What it produces
            </p>
            <h2
              id="outcomes-heading"
              className="font-serif text-navy-900 leading-[1.05] mb-5"
              style={{ fontSize: 'clamp(2.1rem, 5vw, 3.4rem)' }}
            >
              What you actually walk away with.
            </h2>
            <p className="text-gray-500 font-light leading-relaxed text-[15px] max-w-lg">
              None of this arrives in a single conversation. It compounds across
              every one that follows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
            {OUTCOMES.map((outcome) => (
              <div
                key={outcome.label}
                className="bg-cream-50 p-7 sm:p-8 hover:bg-white transition-colors"
              >
                <p className="font-serif text-navy-900 text-[22px] leading-none mb-2.5">
                  {outcome.label}
                </p>
                <p className="text-gray-500 font-light text-[14px] leading-relaxed">
                  {outcome.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 08. Opportunity Fund ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-6 lg:px-10 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-[0.22em] mb-5">
                Beyond advice
              </p>
              <h2
                className="font-serif text-navy-900 leading-[1.08] mb-5"
                style={{ fontSize: 'clamp(1.9rem, 4.2vw, 2.8rem)' }}
              >
                Preparation shouldn&apos;t<br />depend on a budget.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4 font-light text-[15px]">
                Great mentorship can open a door. For students with demonstrated
                financial need, Mentable is building an Opportunity Fund to remove
                the practical barriers that stand between guidance and action.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-7">
                The Opportunity Fund is in its pilot phase. We are building
                partnerships to fund the first cohort.
              </p>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors border-b border-gray-200 hover:border-navy-400 pb-0.5"
              >
                Learn about the Opportunity Fund
                <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
              </Link>
            </div>

            <div className="divide-y divide-gray-100 lg:pt-2">
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

      {/* ── 09. Final CTA ────────────────────────────────────────────────────── */}
      <section
        className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50 border-t border-gray-100"
        aria-labelledby="cta-heading"
      >
        <div className="max-w-6xl mx-auto">
          <h2
            id="cta-heading"
            className="font-serif text-navy-900 leading-[1.03] mb-6 max-w-2xl"
            style={{ fontSize: 'clamp(2.3rem, 5.5vw, 4.2rem)' }}
          >
            Someone helped them get there.<br />Now they&apos;re here for you.
          </h2>
          <p className="text-gray-500 font-light mb-9 max-w-md text-[15px] leading-relaxed">
            Tell us where you are and what you&apos;re trying to figure out.
            The rest starts with one conversation.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2.5 bg-navy-900 text-white px-8 py-4 text-[15px] font-semibold hover:bg-navy-800 transition-colors rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
            >
              Find your mentor
              <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
            </Link>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 text-navy-700 font-medium hover:text-navy-900 transition-colors py-4 text-[15px] border-b border-gray-200 hover:border-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-sm"
            >
              Become a mentor
              <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
            </Link>
          </div>
          <p className="text-gray-400 text-sm mt-6">
            Free to join. Know someone worth learning from?{' '}
            <button
              onClick={() => setInviteOpen(true)}
              className="text-navy-600 underline underline-offset-2 hover:text-navy-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-sm"
            >
              Invite them
            </button>
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-14 px-6 lg:px-10 bg-navy-900">
        <div className="max-w-6xl mx-auto">
          <div className="mb-9">
            <Wordmark size="lg" className="text-white" />
            <p className="text-navy-500 font-light mt-2 max-w-xs text-sm leading-relaxed">
              Find someone worth learning from. Become someone worth mentoring.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pt-7 border-t border-navy-800">
            <div className="flex gap-7 text-sm text-navy-500">
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/signup" className="hover:text-white transition-colors">Create account</Link>
            </div>
            <p className="text-sm text-navy-700">&copy; 2026 Mentable. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
