'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Shirt, Users, Plane, GraduationCap } from 'lucide-react';
import IntroSequence from '@/components/marketing/IntroSequence';
import LandingNav from '@/components/marketing/LandingNav';
import HeroReveal from '@/components/marketing/HeroReveal';
import HeroPair from '@/components/marketing/HeroPair';
import MentorCarousel from '@/components/marketing/MentorCarousel';
import MenteeCarousel from '@/components/marketing/MenteeCarousel';
import CredibilityRail from '@/components/marketing/CredibilityRail';
import ProblemSection from '@/components/marketing/ProblemSection';
import ProductDemo from '@/components/marketing/ProductDemo';
import TrajectoryViz from '@/components/marketing/TrajectoryViz';
import Flywheel from '@/components/marketing/Flywheel';
import InviteModal from '@/components/marketing/InviteModal';
import Wordmark from '@/components/ui/Wordmark';
import { trackLandingEvent } from '@/lib/landing-analytics';

// Four outcomes, weighted: two carry the section, each with one supporting
// idea. Six equally sized cards read as filler and blunted all of them.
const LEAD_OUTCOMES = [
  { label: 'Clarity', body: 'See what the work is really like before you commit years to it.' },
  { label: 'Opportunity', body: 'An introduction only helps if you are ready for it.' },
];

const SUPPORTING_OUTCOMES = [
  { label: 'Accountability', body: 'Someone notices when you do not follow through.' },
  { label: 'Reciprocity', body: 'Eventually become the person you once needed.' },
];

const FUND_ITEMS = [
  { icon: Shirt, label: 'Professional Attire', detail: 'Interview suit, tailoring, footwear' },
  { icon: Users, label: 'Networking', detail: 'Coffee chats, industry events' },
  { icon: Plane, label: 'Travel', detail: 'Interviews, career fairs, office visits' },
  { icon: GraduationCap, label: 'Career Development', detail: 'Certifications, prep resources' },
];

export default function LandingPage() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream-50 overflow-x-clip">
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <IntroSequence />
      <LandingNav />

      {/* Nav watches this to know when the hero has scrolled away */}
      <div id="nav-sentinel" className="absolute top-0 h-20 w-px" aria-hidden="true" />

      {/* ── 01. Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 sm:pt-36 pb-16 sm:pb-20 px-6 lg:px-10" aria-labelledby="hero-heading">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-12 lg:gap-16 items-center">
            <div>
              <HeroReveal />

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
                Find someone who has already done the work you want to do.
                Mentable helps you set goals together, meet regularly, and keep
                the relationship moving.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <Link
                  href="/signup"
                  onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'hero_find_your_mentor' })}
                  className="group inline-flex items-center gap-2.5 bg-navy-900 text-white px-8 py-4 text-[15px] font-medium hover:bg-navy-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all rounded-xl shadow-sm hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
                >
                  Find your mentor
                  <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
                </Link>
                <Link
                  href="/signup"
                  onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'hero_become_a_mentor' })}
                  className="group tap-target inline-flex items-center gap-2 text-navy-700 font-medium hover:text-navy-900 transition-colors py-4 text-[15px] border-b border-gray-200 hover:border-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-sm"
                >
                  Become a mentor
                  <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <HeroPair />
            </div>
          </div>
        </div>
      </section>

      {/* ── 02. Problem ──────────────────────────────────────────────────────── */}
      <ProblemSection />

      {/* ── 03. Mentors ──────────────────────────────────────────────────────── */}
      <MentorCarousel />
      <CredibilityRail />

      {/* ── 04. Product ──────────────────────────────────────────────────────── */}
      <ProductDemo />

      {/* ── 05. Students ─────────────────────────────────────────────────────── */}
      <MenteeCarousel />

      {/* ── 06. Trajectory ───────────────────────────────────────────────────── */}
      <TrajectoryViz />

      {/* ── 07. Flywheel ─────────────────────────────────────────────────────── */}
      <Flywheel />

      {/* ── 08. Outcomes ─────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-white border-t border-gray-100" aria-labelledby="outcomes-heading">
        <div className="max-w-6xl mx-auto">
          <h2
            id="outcomes-heading"
            className="font-serif text-navy-900 leading-[1.05] mb-14 max-w-xl"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            What comes out of it.
          </h2>

          {/* Two rows of lead + supporting. Hiding four short sentences behind
              hover cost more in discoverability than it saved in density, and
              the single-word left column left a large void beneath it. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 lg:gap-x-20 gap-y-12">
            {LEAD_OUTCOMES.map((lead, i) => (
              <div key={lead.label} className="contents">
                <div>
                  <p
                    className="font-serif text-navy-900 leading-none mb-3"
                    style={{ fontSize: 'clamp(2.1rem, 4.4vw, 3rem)' }}
                  >
                    {lead.label}
                  </p>
                  <p className="text-gray-500 text-[16px] leading-relaxed max-w-sm">
                    {lead.body}
                  </p>
                </div>
                <div className="md:pt-2">
                  <p className="font-serif text-navy-800 leading-none mb-3 text-[24px]">
                    {SUPPORTING_OUTCOMES[i].label}
                  </p>
                  <p className="text-gray-500 text-[16px] leading-relaxed max-w-sm">
                    {SUPPORTING_OUTCOMES[i].body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 09. Opportunity Fund ─────────────────────────────────────────────── */}
      <section
        className="py-20 sm:py-24 px-6 lg:px-10 bg-navy-900"
        aria-labelledby="fund-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-[0.22em] mb-5">
                A Mentable initiative
              </p>
              <h2
                id="fund-heading"
                className="font-serif text-white leading-[1.08] mb-5"
                style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
              >
                Preparation shouldn&apos;t<br />depend on a budget.
              </h2>
              <p className="text-navy-200 leading-relaxed mb-4 font-light text-[15px] max-w-md">
                For students with demonstrated financial need, we&apos;re building a
                fund to remove the practical barriers between guidance and action.
              </p>
              <p className="text-navy-300 text-[14px] leading-relaxed mb-7">
                In pilot. We&apos;re building partnerships to fund the first cohort.
              </p>
              <Link
                href="/signup"
                onClick={() => trackLandingEvent('opportunity_fund_clicked')}
                className="group tap-target inline-flex items-center gap-2 text-sm font-medium text-white hover:text-amber-300 transition-colors border-b border-navy-700 hover:border-amber-400 pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
              >
                Learn about the Opportunity Fund
                <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FUND_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="bg-navy-800/60 border border-navy-700/60 rounded-2xl p-4 hover:border-amber-400/40 hover:bg-navy-800 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-amber-400 mb-3" aria-hidden="true" />
                    <p className="text-[14px] font-semibold text-white leading-tight">{item.label}</p>
                    <p className="text-[12px] text-navy-300 mt-1 leading-snug">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50" aria-labelledby="cta-heading">
        <div className="max-w-6xl mx-auto">
          <h2
            id="cta-heading"
            className="font-serif text-navy-900 leading-[1.03] mb-8 max-w-2xl"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}
          >
            Someone helped them get there.<br />Now they&apos;re here for you.
          </h2>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <Link
              href="/signup"
              onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'final_find_your_mentor' })}
              className="group inline-flex items-center gap-2.5 bg-navy-900 text-white px-8 py-4 text-[15px] font-semibold hover:bg-navy-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all rounded-xl shadow-sm hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
            >
              Find your mentor
              <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
            </Link>
            <Link
              href="/signup"
              onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'final_i_want_to_mentor' })}
              className="group tap-target inline-flex items-center gap-2 text-navy-700 font-medium hover:text-navy-900 transition-colors py-4 text-[15px] border-b border-gray-200 hover:border-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-sm"
            >
              I want to mentor
              <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
            </Link>
          </div>
          <p className="text-gray-500 text-sm mt-6">
            Free to join. Know someone who should be here?{' '}
            <button
              onClick={() => setInviteOpen(true)}
              className="tap-target text-navy-600 underline underline-offset-2 hover:text-navy-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-sm"
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
            <p className="text-navy-300 font-light mt-2 max-w-xs text-sm leading-relaxed">
              Find someone worth learning from. Become someone worth mentoring.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pt-7 border-t border-navy-800">
            <div className="flex gap-7 text-sm text-navy-300">
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/signup" className="hover:text-white transition-colors">Create account</Link>
            </div>
            <p className="text-sm text-navy-400">&copy; 2026 Mentable. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
