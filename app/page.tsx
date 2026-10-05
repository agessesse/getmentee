'use client';

import { useState } from 'react';
import Link from 'next/link';
import IntroSequence from '@/components/marketing/IntroSequence';
import SiteHeader from '@/components/marketing/SiteHeader';
import HeroReveal from '@/components/marketing/HeroReveal';
import HeroPair from '@/components/marketing/HeroPair';
import MentorCarousel from '@/components/marketing/MentorCarousel';
import MenteeCarousel from '@/components/marketing/MenteeCarousel';
import ProblemSection from '@/components/marketing/ProblemSection';
import ProductDemo from '@/components/marketing/ProductDemo';
import HowItWorks from '@/components/marketing/HowItWorks';
import TrajectoryViz from '@/components/marketing/TrajectoryViz';
import CohortOne from '@/components/marketing/CohortOne';
import Flywheel from '@/components/marketing/Flywheel';
import BothDirections from '@/components/marketing/BothDirections';
import { HERO_HAS_PAIR } from '@/components/marketing/HeroPair';
import InviteModal from '@/components/marketing/InviteModal';
import SiteFooter from '@/components/marketing/SiteFooter';
import HeroPin from '@/components/marketing/HeroPin';
import Rise from '@/components/marketing/Rise';
import ScrollCue from '@/components/marketing/ScrollCue';
import { trackLandingEvent } from '@/lib/landing-analytics';
import CtaButton from '@/components/marketing/CtaButton';

// Four outcomes, weighted: two carry the section, each with one supporting
// idea. Six equally sized cards read as filler and blunted all of them.

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
      <section className="w-full pt-5 pb-16 sm:pb-20 lg:pb-[clamp(2rem,5vh,4rem)] px-6 lg:px-10" aria-labelledby="hero-heading">
        <div className="max-w-6xl mx-auto">
          {/*
            The second column holds the pair of profile cards, which only
            render for people who have approved public use. When nobody has,
            HeroPair returns null and a reserved 400px column would leave the
            hero looking like something failed to load. `HERO_HAS_PAIR` decides
            the grid instead, so the hero is either two columns with the cards
            or one full-width editorial column, and both are deliberate.
          */}
          <div className={`grid grid-cols-1 gap-12 lg:gap-16 items-center${
            HERO_HAS_PAIR ? ' lg:grid-cols-[1fr,400px]' : ''
          }`}>
            {/* Outer block rises 20px, the headline inside it a further 30px,
                both on load rather than on scroll: this is the first thing on
                screen, so there is nothing to scroll into view. */}
            <div className="hero-rise-outer">
              <HeroReveal />

              <h1
                id="hero-heading"
                className="hero-rise-inner hero-headline font-display text-halo-ink leading-[0.98] tracking-tight mb-5 max-w-3xl"
              >
                Mentorship shouldn&apos;t<br />
                depend on luck.
              </h1>

              {/*
                One sentence, and it does the whole job: who it is for
                (communities), what it does (turns experience into
                mentorship), and the promise that separates it from an
                introduction service (that goes somewhere).

                WHAT THIS REPLACED. A four-line standfirst explaining that two
                people can have the same ability and not the same access, then
                a second clause about structure after the introduction. Both
                true, and both arguments the rest of the page already makes
                with interface rather than prose. A hero that argues has
                already lost the thirty seconds it was given.
              */}
              <p
                className="font-display text-halo-heather leading-[1.4] max-w-xl mb-7"
                style={{ fontSize: 'clamp(1.15rem, 1.75vw, 1.4rem)' }}
              >
                Mentable helps communities turn experience into mentorship that
                goes somewhere.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <CtaButton
                  href="#product"
                  onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'hero_explore' })}
                >
                  Explore Mentable
                </CtaButton>
                <CtaButton href="/organizations" variant="secondary">
                  For organizations
                </CtaButton>
              </div>

              {/*
                Cohort 001 moved BELOW the buttons and lost its paragraph.

                It is a live funnel with real applicants, so removing it would
                throw away applications; but it is also a detail about where
                the company is right now, not the thing a first-time visitor
                needs in order to understand the product. One line, one link.
              */}
              <p className="mt-6 text-[14px] text-halo-mist-body">
                <span className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-brand-text mr-2">
                  Now open
                </span>
                Cohort 001: ten sophomores, ten mentors, one semester.{' '}
                <Link
                  href="/apply?role=mentee&cohort=cohort-001"
                  onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'hero_cohort_line' })}
                  className="font-medium text-halo-brand-text underline underline-offset-2 hover:text-halo-ink transition-colors"
                >
                  Apply
                </Link>
              </p>

            </div>

            {HERO_HAS_PAIR && (
              <div className="hidden lg:block">
                <HeroPair />
              </div>
            )}
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

      {/* ── 03. Cohort 001 ───────────────────────────────────────────────────── */}
      {/* The first proof. Sits directly after the problem, so "same ability,
          different access" is answered by something concrete and small rather
          than by more argument. */}
      <CohortOne />

      {/* ── 04. The two rosters ──────────────────────────────────────────────── */}
      {/* Willing to teach, then ready to learn. Each section now carries its own
          proof rail inside it, under the heading it is evidence for, instead of
          sitting in a separate bordered band above it. The two sections are told
          apart by alternating the ground, ivory then veil, rather than by a rule. */}
      <MentorCarousel />
      <MenteeCarousel />

      {/* ── 05. Product ──────────────────────────────────────────────────────── */}
      <ProductDemo />

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      {/* After the product, not before it: show the thing, then name the
          sequence it runs on. Reversed, the steps are abstract. */}
      <HowItWorks />

      {/* ── 06. The access gap ───────────────────────────────────────────────── */}
      <TrajectoryViz />

      {/* ── 07. Return on Impact ─────────────────────────────────────────────── */}
      {/* The old "compounding effect" section, now named. It was already making
          the return-on-impact argument; giving it the name means the idea is
          stated once, well, instead of a fourth section repeating it. */}
      <Flywheel />

      {/* ── 08. Both directions ──────────────────────────────────────────────── */}
      {/* Closes the three-part sequence that runs 06 → 07 → 08: what one person
          can change for another, how far that reaches, and what each of them is
          left holding. */}
      <BothDirections />

      {/*
        ── Opportunity Fund: removed from the homepage sequence ──────────────

        Not deleted. The section is about paying for recruiting costs for
        students with demonstrated financial need, and it is honest that the
        fund is not funded yet.

        It comes out of the homepage because it introduces a second, different
        definition of under-resourced. Cohort 001 is about access to people:
        who you can ask, what you get told early, which mistakes you avoid. A
        section immediately below it about household finances asks a visitor to
        hold two theses at once, and promises a programme Mentable has not
        built. When the fund exists, this comes back.

        The component's markup lives in git history at a620521 and the
        /opportunity-fund concept can return as its own page.
      */}


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
              Who helped you get here?<br />Help someone coming next.
            </h2>
          </Rise>
          {/*
            The paragraph that used to sit here re-explained the product in
            the last six lines of a page that had just spent nine sections
            demonstrating it. By this point the reader either understands
            Mentable or is not going to. Cut to nothing: the heading is the
            closing argument and the buttons are the answer.
          */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <CtaButton
              href="/apply?role=mentee&cohort=cohort-001"
              onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'final' })}
            >
              Find mentorship
            </CtaButton>
            <CtaButton href="/organizations" variant="secondary">
              Bring Mentable to your organization
            </CtaButton>
          </div>
          <p className="text-halo-mist-body text-sm mt-6">
            Know someone who should be here?{' '}
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
