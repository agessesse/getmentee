'use client';

import { useState } from 'react';
import { Shirt, Users, Plane, GraduationCap } from 'lucide-react';
import IntroSequence from '@/components/marketing/IntroSequence';
import SiteHeader from '@/components/marketing/SiteHeader';
import HeroReveal from '@/components/marketing/HeroReveal';
import HeroPair from '@/components/marketing/HeroPair';
import MentorCarousel from '@/components/marketing/MentorCarousel';
import MenteeCarousel from '@/components/marketing/MenteeCarousel';
import ProblemSection from '@/components/marketing/ProblemSection';
import ProductDemo from '@/components/marketing/ProductDemo';
import TrajectoryViz from '@/components/marketing/TrajectoryViz';
import Flywheel from '@/components/marketing/Flywheel';
import InviteModal from '@/components/marketing/InviteModal';
import SiteFooter from '@/components/marketing/SiteFooter';
import ScrollHandoff from '@/components/marketing/ScrollHandoff';
import HeroPin from '@/components/marketing/HeroPin';
import Rise from '@/components/marketing/Rise';
import ScrollCue from '@/components/marketing/ScrollCue';
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
      <SiteHeader />

      <main id="main-content">

      {/*
        ── 01. Hero ──────────────────────────────────────────────────────────
        Pinned to the viewport while the rest of the page slides up over it.

        This replaced a version where the hero scaled and faded as the next
        section climbed past. That read well mid-transition and badly at the
        end: once the hero's own content had scrolled behind the header, all
        that remained visible above the incoming section was a strip of its
        empty bottom padding, which looked like a layout gap rather than depth.

        Pinning fixes it by construction. The hero holds still at full size, the
        content below is opaque and simply covers it, and there is never a gap
        because there is never anything receding. It also costs nothing: the pin
        is one sticky container, no scroll listener and no measurement.
      */}
      <HeroPin>
      <section className="w-full py-16 sm:py-20 lg:py-24 px-6 lg:px-10" aria-labelledby="hero-heading">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-12 lg:gap-16 items-center">
            {/* Outer block rises 20px, the headline inside it a further 30px,
                both on load rather than on scroll: this is the first thing on
                screen, so there is nothing to scroll into view. */}
            <div className="hero-rise-outer">
              <HeroReveal />

              <h1
                id="hero-heading"
                className="hero-rise-inner font-display text-halo-ink leading-[0.98] tracking-tight mb-7 max-w-3xl"
                style={{ fontSize: 'clamp(2.6rem, 7vw, 5.2rem)' }}
              >
                The Right Mentor<br />
                Can Change Your<br />
                Trajectory
              </h1>

              {/*
                The thesis, carrying three jobs in two sentences.

                It names the luck, because that is the thing Mentable actually
                removes. It keeps "everything after the introduction", which
                answers the question every visitor to a mentorship site arrives
                with: "is this just a list of names?" And it ends on the payoff
                running in both directions, because a page that forks to mentor
                and mentee has to make both paths feel legitimate in one breath.

                Note it does NOT open on luck as a statement. The Problem section
                two blocks down already opens "Right now, mentorship mostly
                depends on luck", and a hero that says it first turns that
                heading into an echo of itself.

                The closing clause is lifted from the footer, where the only
                two-sided line on the site had been sitting unread.
              */}
              {/*
                The standfirst, not body copy.

                It was set in Plex at font-light, the same face and weight as
                every paragraph further down the page, which made the most
                important sentence on the site look like the least important
                one. It is now Newsreader at 400, the face the headline above it
                uses, one step down in size with a wider measure and looser
                leading. Serif headline into serif standfirst into sans body is
                the ordinary editorial order, and it is the order the rest of
                this page already follows; the hero was the exception.

                No font was added. Newsreader is already loaded for every
                heading on the site.
              */}
              <p
                className="font-display text-halo-heather leading-[1.45] max-w-xl mb-10"
                style={{ fontSize: 'clamp(1.2rem, 1.9vw, 1.5rem)' }}
              >
                Mentable takes the luck out of mentorship, and handles everything
                after the introduction. Find someone{' '}
                <span className="font-medium text-halo-purple-d">
                  worth learning from
                </span>
                , then become someone{' '}
                <span className="font-medium text-halo-purple-d">
                  worth mentoring
                </span>
                .
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

        <ScrollCue />
      </HeroPin>

      {/*
        Everything from here down is one opaque layer that travels over the
        pinned hero. `relative` plus a z-index above the hero's is what puts it
        on top; the background is what stops the hero showing through the gaps
        between sections.
      */}
      <div className="relative z-[1] bg-halo-ivory">

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
          <Rise kind="heading" as="h2">
            <span
              id="outcomes-heading"
              className="block font-display text-halo-ink leading-[1.05] mb-12 max-w-xl"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
            >
              What comes out of it.
            </span>
          </Rise>

          {/* 0.12s apart, the reference's card stagger. */}
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 lg:gap-x-10 gap-y-10">
            {OUTCOMES.map((o, i) => (
              <Rise key={o.label} kind="heading" delay={i * 0.12} as="li" className="border-t border-halo-rule pt-5">
                <span className="block text-[12px] font-semibold tabular-nums text-halo-purple-d mb-3">
                  0{i + 1}
                </span>
                <h3 className="font-display text-halo-ink text-[26px] leading-none mb-2.5">
                  {o.label}
                </h3>
                <p className="text-halo-heather text-[15px] leading-relaxed">
                  {o.body}
                </p>
              </Rise>
            ))}
          </ol>
        </div>
      </section>

      {/*
        ── 09. Opportunity Fund ──────────────────────────────────────────────
        The last handoff, so the ending arrives rather than simply appearing.
        The deep band settles back and the closing ask rises over it.
      */}
      <ScrollHandoff minScale={0.975} minOpacity={0.7}>
      <section
        className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-deep"
        aria-labelledby="fund-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <Rise kind="heading" as="p" className="font-ui text-[11px] font-semibold text-halo-lavender uppercase tracking-[0.14em] mb-5">
                A Mentable initiative
              </Rise>
              <Rise kind="heading" delay={0.1}>
                <h2
                  id="fund-heading"
                  className="font-display text-white leading-[1.08] mb-5"
                  style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
                >
                  Preparation shouldn&apos;t<br />depend on a budget.
                </h2>
              </Rise>
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
              {FUND_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Rise
                    key={item.label}
                    kind="row"
                    delay={(i % 3) * 0.08}
                    className="bg-halo-deep-panel border border-halo-deep-rule rounded-xl p-4 hover:border-halo-lavender/50 hover:bg-white/[0.14] transition-colors"
                  >
                    <Icon className="w-5 h-5 text-halo-lavender mb-3" aria-hidden="true" />
                    <p className="text-[14px] font-semibold text-white leading-tight">{item.label}</p>
                    <p className="text-[12px] text-halo-lavender mt-1 leading-snug">{item.detail}</p>
                  </Rise>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      </ScrollHandoff>

      {/* ── 10. Final CTA ────────────────────────────────────────────────────── */}
      <div className="relative">
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-ivory" aria-labelledby="cta-heading">
        <div className="max-w-6xl mx-auto">
          {/* The page's closing claim, on the slowest curve of the set. */}
          <Rise kind="statement">
            <h2
              id="cta-heading"
              className="font-display text-halo-ink leading-[1.03] mb-8 max-w-2xl"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}
            >
              Someone helped them get there.<br />Now they&apos;re here for you.
            </h2>
          </Rise>
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
      </div>

      </div>
      </main>

      {/*
        SiteFooter, not a copy of it. This footer was duplicated here character
        for character, which is precisely why Privacy, Terms and Accessibility
        landed on every public page except the one an institution opens first.
        The rendered markup is unchanged; the duplication is not.
      */}
      <SiteFooter />
    </div>
  );
}
