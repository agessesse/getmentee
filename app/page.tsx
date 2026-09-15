'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shirt, Users, Plane, GraduationCap } from 'lucide-react';
import IntroSequence from '@/components/marketing/IntroSequence';
import LandingNav from '@/components/marketing/LandingNav';
import HeroReveal from '@/components/marketing/HeroReveal';
import HeroPair from '@/components/marketing/HeroPair';
import MentorCarousel from '@/components/marketing/MentorCarousel';
import MenteeCarousel from '@/components/marketing/MenteeCarousel';
import ProblemSection from '@/components/marketing/ProblemSection';
import ProductDemo from '@/components/marketing/ProductDemo';
import TrajectoryViz from '@/components/marketing/TrajectoryViz';
import Flywheel from '@/components/marketing/Flywheel';
import InviteModal from '@/components/marketing/InviteModal';
import Wordmark from '@/components/ui/Wordmark';
import { trackLandingEvent } from '@/lib/landing-analytics';
import CtaButton from '@/components/marketing/CtaButton';

// Four outcomes, weighted: two carry the section, each with one supporting
// idea. Six equally sized cards read as filler and blunted all of them.
// Four peer outcomes. The previous split rendered two of them at 48px navy-900
// and two at 24px navy-800, which implied Clarity outranked Accountability.
// Nothing justified that, so the tiering is gone: hierarchy now comes from
// label versus body, and the numbering gives the eye a reading order.
// "Opportunity" was dropped because its line described a precondition
// ("an introduction only helps if you are ready") rather than an outcome.
const OUTCOMES = [
  { label: 'Clarity',        body: 'See what the work is actually like before you spend years on it.' },
  { label: 'Preparation',    body: 'Walk in knowing what matters and what does not.' },
  { label: 'Accountability', body: 'Someone notices when you do not follow through.' },
  { label: 'Reciprocity',    body: 'Eventually become the person you once needed.' },
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
    <div className="font-body min-h-screen bg-halo-ivory overflow-x-clip">
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <IntroSequence />
      <LandingNav />

      <main id="main-content">

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
                className="font-display text-halo-ink leading-[0.98] tracking-tight mb-7 max-w-3xl"
                style={{ fontSize: 'clamp(2.6rem, 7vw, 5.2rem)' }}
              >
                The Right Mentor<br />
                Can Change Your<br />
                Trajectory
              </h1>

              {/*
                The thesis. Every visitor arrives asking the same question about
                a mentorship site: "is this just a list of names?" The answer has
                to be the first thing after the headline, not buried at section
                four under "The product".

                The accent is otherwise reserved for primary buttons. It carries
                the five words that answer that question and nothing else, so the
                emphasis still reads as meaning rather than decoration. #15803d
                on cream is 4.87:1, which clears AA for body text.
              */}
              <p className="text-lg sm:text-xl text-halo-mist-body font-light leading-relaxed max-w-lg mb-10">
                Mentable is{' '}
                <span className="font-medium text-halo-purple-d">
                  everything after the introduction
                </span>
                . Find someone who has already done the work, then set goals
                together, meet regularly, and keep it moving.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <CtaButton
                  href="/signup?role=mentee"
                  onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'hero_find_your_mentor' })}
                >
                  Find your mentor
                </CtaButton>
                <CtaButton
                  href="/signup?role=mentor"
                  onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'hero_become_a_mentor' })}
                  variant="secondary"
                >
                  Become a mentor
                </CtaButton>
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

      {/* ── 03. The two rosters ──────────────────────────────────────────────── */}
      {/* Willing to teach, then ready to learn. Each section now carries its own
          proof rail inside it, under the heading it is evidence for, instead of
          sitting in a separate bordered band above it. The two sections are told
          apart by alternating the ground, ivory then veil, rather than by a rule. */}
      <MentorCarousel />
      <MenteeCarousel />

      {/* ── 04. Product ──────────────────────────────────────────────────────── */}
      <ProductDemo />

      {/* ── 06. Trajectory ───────────────────────────────────────────────────── */}
      <TrajectoryViz />

      {/* ── 07. Flywheel ─────────────────────────────────────────────────────── */}
      <Flywheel />

      {/* ── 08. Outcomes ─────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule" aria-labelledby="outcomes-heading">
        <div className="max-w-6xl mx-auto">
          <h2
            id="outcomes-heading"
            className="font-display text-halo-ink leading-[1.05] mb-12 max-w-xl"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            What comes out of it.
          </h2>

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 lg:gap-x-10 gap-y-10">
            {OUTCOMES.map((o, i) => (
              <li key={o.label} className="border-t border-halo-rule pt-5">
                <span className="block text-[12px] font-semibold tabular-nums text-halo-purple-d mb-3">
                  0{i + 1}
                </span>
                <h3 className="font-display text-halo-ink text-[26px] leading-none mb-2.5">
                  {o.label}
                </h3>
                <p className="text-halo-heather text-[15px] leading-relaxed">
                  {o.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 09. Opportunity Fund ─────────────────────────────────────────────── */}
      <section
        className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-deep"
        aria-labelledby="fund-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="font-ui text-[11px] font-semibold text-halo-lavender uppercase tracking-[0.22em] mb-5">
                A Mentable initiative
              </p>
              <h2
                id="fund-heading"
                className="font-display text-white leading-[1.08] mb-5"
                style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
              >
                Preparation shouldn&apos;t<br />depend on a budget.
              </h2>
              <p className="text-halo-lavender leading-relaxed mb-4 font-light text-[15px] max-w-md">
                For students with demonstrated financial need, we&apos;re building a
                fund to remove the practical barriers between guidance and action.
              </p>
              <p className="text-halo-lavender text-[14px] leading-relaxed mb-7">
                In pilot. We&apos;re building partnerships to fund the first cohort.
              </p>
              {/*
                The student's closing ask. The final CTA below is mentor-facing
                ("Someone helped them get there. Now they're here for you."), so
                without this the page qualifies a student through nine sections
                and then spends its last words talking to someone else.

                Ordered ask-then-read: the button is the commitment, the fund
                link is the lower-commitment alternative for anyone not ready.
              */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <CtaButton
                  href="/signup?role=mentee"
                  onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'fund_find_your_mentor' })}
                  size="md"
                  ground="deep"
                >
                  Find your mentor
                </CtaButton>
                <CtaButton
                  href="/signup?role=mentee"
                  onClick={() => trackLandingEvent('opportunity_fund_clicked')}
                  variant="secondary"
                  size="sm"
                  ground="deep"
                >
                  Learn about the Opportunity Fund
                </CtaButton>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FUND_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="bg-halo-deep-panel border border-halo-deep-rule rounded-xl p-4 hover:border-halo-lavender/50 hover:bg-white/[0.14] transition-colors"
                  >
                    <Icon className="w-5 h-5 text-halo-lavender mb-3" aria-hidden="true" />
                    <p className="text-[14px] font-semibold text-white leading-tight">{item.label}</p>
                    <p className="text-[12px] text-halo-lavender mt-1 leading-snug">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-ivory" aria-labelledby="cta-heading">
        <div className="max-w-6xl mx-auto">
          <h2
            id="cta-heading"
            className="font-display text-halo-ink leading-[1.03] mb-8 max-w-2xl"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}
          >
            Someone helped them get there.<br />Now they&apos;re here for you.
          </h2>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <CtaButton
              href="/signup?role=mentee"
              onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'final_find_your_mentor' })}
            >
              Find your mentor
            </CtaButton>
            <CtaButton
              href="/signup?role=mentor"
              onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'final_i_want_to_mentor' })}
              variant="secondary"
            >
              I want to mentor
            </CtaButton>
          </div>
          <p className="text-halo-mist-body text-sm mt-6">
            Free to join. Know someone who should be here?{' '}
            <button
              onClick={() => setInviteOpen(true)}
              className="tap-target text-halo-purple-d underline underline-offset-2 hover:text-halo-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded-sm"
            >
              Invite them
            </button>
          </p>
        </div>
      </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-14 px-6 lg:px-10 bg-halo-black">
        <div className="max-w-6xl mx-auto">
          <div className="mb-9">
            <Wordmark size="lg" className="text-white" />
            <p className="text-halo-lavender font-light mt-2 max-w-xs text-sm leading-relaxed">
              Find someone worth learning from. Become someone worth mentoring.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pt-7 border-t border-halo-deep-rule">
            <div className="flex gap-7 text-sm text-halo-lavender">
              <Link href="/login" className="tap-target hover:text-white transition-colors">Sign in</Link>
              <Link href="/signup" className="tap-target hover:text-white transition-colors">Create account</Link>
            </div>
            <p className="text-sm text-halo-lavender">&copy; 2026 Mentable. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
