'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import IntroSequence from '@/components/marketing/IntroSequence';
import MentorCarousel from '@/components/marketing/MentorCarousel';
import MenteeCarousel from '@/components/marketing/MenteeCarousel';
import MatchPreview from '@/components/marketing/MatchPreview';
import LifecycleSection from '@/components/marketing/LifecycleSection';
import InviteModal from '@/components/marketing/InviteModal';
import FirmMarquee from '@/components/marketing/FirmMarquee';
import TabsSection from '@/components/marketing/TabsSection';

// ─── Data ────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create your profile',
    description: 'Tell us about your background, goals, and where you want to be. Takes under 5 minutes.',
  },
  {
    step: '02',
    title: 'Get matched',
    description: 'Mentee surfaces mentors based on your specific goals, industry, and career stage.',
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [inviteOpen, setInviteOpen] = useState(false);

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
              className="text-sm text-gray-500 hover:text-navy-900 transition-colors font-medium"
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

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-6 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-12 lg:gap-20 items-center">

            {/* Text */}
            <div>
              <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-8">
                Mentorship changes trajectories
              </p>

              <h1
                className="font-bold text-navy-900 leading-[0.96] tracking-tight mb-10 max-w-4xl"
                style={{ fontSize: 'clamp(2.9rem, 8.5vw, 6.5rem)' }}
              >
                The right mentor<br />
                changes your<br />
                trajectory.
              </h1>

              <p className="text-xl text-gray-500 font-light leading-relaxed max-w-lg mb-12">
                Mentee connects ambitious students and early-career professionals
                with people who have already traveled the path ahead.
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

            {/* Portrait stack — mentor behind, mentee in front */}
            <div className="hidden lg:block relative h-[420px]" aria-hidden="true">
              {/* Mentor card — behind, rotated right */}
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
                  <p className="text-[9px] font-semibold text-white/60 uppercase tracking-[0.22em]">Mentor</p>
                  <p className="text-[11px] font-bold text-white leading-tight">Christopher Floyd, CFA</p>
                  <p className="text-[9px] text-white/55 mt-0.5 font-light">Head of Institutional Sales</p>
                </div>
              </div>

              {/* Mentee card — front, rotated left */}
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
                  <p className="text-[9px] font-semibold text-white/60 uppercase tracking-[0.22em]">Mentee</p>
                  <p className="text-[11px] font-bold text-white leading-tight">Abel Gessesse</p>
                  <p className="text-[9px] text-white/55 mt-0.5 font-light">UNC Kenan-Flagler</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Firm marquee ─────────────────────────────────────────────────────── */}
      <FirmMarquee />

      {/* ── Mentor carousel ─────────────────────────────────────────────────── */}
      <MentorCarousel />

      {/* ── Bridge: experience flows forward ────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="border-t border-gray-100 pt-8 pb-2">
          <p className="text-[13px] text-gray-400 font-light italic">
            And the people whose trajectories they&apos;re shaping.
          </p>
        </div>
      </div>

      {/* ── Mentee carousel ─────────────────────────────────────────────────── */}
      <MenteeCarousel />

      {/* ── Mentorship flywheel ─────────────────────────────────────────────── */}
      <LifecycleSection />

      {/* ── Intelligent matching (dark) ──────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-10 bg-navy-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.2em] mb-6">
                Intelligent matching
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                More than a search bar.
              </h2>
              <p className="text-navy-300 font-light leading-relaxed mb-10 text-[15px]">
                Mentee doesn&apos;t just list mentors. It surfaces exactly why a
                person could be relevant to your goals — so your first message
                isn&apos;t cold, it&apos;s informed.
              </p>
              <ul className="space-y-4">
                {[
                  'Match on industry, school, goals, and career stage',
                  'See a clear explanation of why each mentor fits',
                  'Filter by availability, format, and focus area',
                  'Save mentors you want to revisit',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-4">
                    <span className="text-navy-600 flex-shrink-0 mt-1 select-none font-light text-lg leading-none">—</span>
                    <span className="text-sm text-navy-300 font-light">{point}</span>
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

      {/* ── How it works (numbered editorial) ──────────────────────────────── */}
      <section className="py-20 px-6 lg:px-10 bg-navy-900 border-t border-navy-800">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">How it works</h2>
            <p className="text-navy-500 font-light">From signup to your first session in under a week.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step}>
                <div
                  className="font-bold text-navy-800 leading-none mb-5 select-none"
                  style={{ fontSize: 'clamp(4rem, 8vw, 5.5rem)' }}
                  aria-hidden="true"
                >
                  {step.step}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-navy-400 text-sm leading-relaxed font-light">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tabs section (For mentees / For mentors / The platform) ─────────── */}
      <TabsSection />

      {/* ── Opportunity Fund (editorial) ────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-10 border-t border-gray-100 bg-gray-50/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-[0.22em] mb-6">
                Beyond advice
              </p>
              <h2
                className="font-bold text-navy-900 leading-tight mb-6"
                style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}
              >
                Access doesn&apos;t stop<br />at the introduction.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4 font-light text-[15px]">
                Great mentorship can identify the next opportunity. For students with
                demonstrated financial need, Mentee is building an Opportunity Fund
                designed to remove practical barriers — professional attire, networking,
                travel, and career-development expenses that stand between guidance and action.
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

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-10 bg-navy-900 text-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-semibold text-navy-600 uppercase tracking-[0.22em] mb-8">
            Get started
          </p>
          <h2
            className="font-bold text-white leading-tight mb-6 max-w-2xl"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
          >
            Ready to find<br />your mentor?
          </h2>
          <p className="text-navy-400 font-light mb-10 max-w-md text-[15px] leading-relaxed">
            Join students and professionals building relationships with mentors
            who have already traveled their path.
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
              Helping ambitious people find the mentors who can change their trajectory.
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
