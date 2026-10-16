'use client';

import { useState } from 'react';
import Link from 'next/link';
import IntroSequence from '@/components/marketing/IntroSequence';
import SiteHeader from '@/components/marketing/SiteHeader';
import ProblemSection from '@/components/marketing/ProblemSection';
import HowItWorks from '@/components/marketing/HowItWorks';
import MatchDemo from '@/components/marketing/MatchDemo';
import HowMentableThinks from '@/components/marketing/HowMentableThinks';
import DiscoverShowcase from '@/components/marketing/DiscoverShowcase';
import OneEngine from '@/components/marketing/OneEngine';
import OrgPreview from '@/components/marketing/OrgPreview';
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
            Two columns from lg: the claim on the left, the product doing
            the thing on the right. The second column used to hold portrait
            cards and was conditional on anyone having approved public use;
            it now holds the match demonstration, which always renders, so
            the grid is unconditional.

            460px rather than 400: the demo holds two profile cards side by
            side plus a two-line explanation, and at 400 the reason text
            wrapped to four lines and the column looked cramped next to a
            56px headline.
          */}
          <div className="grid grid-cols-1 gap-8 lg:gap-14 items-center lg:grid-cols-[1fr,460px]">
            {/* Outer block rises 20px, the headline inside it a further 30px,
                both on load rather than on scroll: this is the first thing on
                screen, so there is nothing to scroll into view. */}
            <div className="hero-rise-outer">
              {/*
                The "Teachable. Coachable. Ready to grow." definition used
                to open the page. It is a good line and it describes a
                person, not a company — and reading it before the headline
                told a visitor this was a mentorship brand before Mentable
                had said otherwise. It keeps its home on /about, where
                brand history belongs.
              */}

              <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-brand-text mb-5">
                Relationship intelligence
              </p>

              <h1
                id="hero-heading"
                className="hero-rise-inner hero-headline font-display text-halo-ink leading-[0.98] tracking-tight mb-5 max-w-3xl"
              >
                The right people are<br />already in your network.
              </h1>

              {/*
                THE COMPANY SHIFT, IN ONE SENTENCE.

                The previous hero said mentorship should not depend on luck,
                which is true and which put Mentable in the same category as
                every other mentorship programme. The headline now names the
                thing an organisation already has and cannot see, and the
                sentence below says what Mentable does about it.

                "Who should know whom" is the product. Not matching, not
                mentorship, not AI: the observation that a university with
                300,000 alumni still cannot tell one sophomore who to call.
              */}
              <p
                className="font-display text-halo-heather leading-[1.4] max-w-xl mb-7"
                style={{ fontSize: 'clamp(1.15rem, 1.75vw, 1.4rem)' }}
              >
                Mentable helps organizations identify who should know whom, then
                turns those introductions into relationships.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <CtaButton
                  href="/organizations#talk"
                  onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'hero_talk' })}
                >
                  Talk to us
                </CtaButton>
                <CtaButton href="#product" variant="secondary">
                  See how it works
                </CtaButton>
              </div>

              {/*
                Cohort 001 moved BELOW the buttons and lost its paragraph.

                It is a live funnel with real applicants, so removing it would
                throw away applications; but it is also a detail about where
                the company is right now, not the thing a first-time visitor
                needs in order to understand the product. One line, one link.
              */}
              {/*
                Cohort 001 is no longer the pitch. It is the evidence: the
                first place Mentable's matching is being tested on real
                people, named as such.
              */}
              <p className="mt-6 text-[14px] text-halo-mist-body">
                <span className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-brand-text mr-2">
                  First proving ground
                </span>
                Cohort 001: ten students, ten alumni, one semester.{' '}
                <Link
                  href="/apply?role=mentee&cohort=cohort-001"
                  onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'hero_cohort_line' })}
                  className="font-medium text-halo-brand-text underline underline-offset-2 hover:text-halo-ink transition-colors"
                >
                  Apply
                </Link>
              </p>

            </div>

            {/*
              The product, not an illustration of it. Visible at every
              width: on a phone it sits under the copy, which is the right
              order anyway -- read the claim, then watch it happen.
            */}
            <div className="mt-8 lg:mt-0">
              <MatchDemo />
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

      {/* ── 02. The problem ──────────────────────────────────────────────── */}
      <ProblemSection />

      {/* ── 03. How Mentable thinks ──────────────────────────────────────── */}
      {/* The differentiator: an explanation, not a score. */}
      <HowMentableThinks />

      {/* ── 04. Discover ─────────────────────────────────────────────────── */}
      {/* The member surface, with reasons produced by the real engine. */}
      <DiscoverShowcase />

      {/* ── 05. One engine, many communities ─────────────────────────────── */}
      <OneEngine />

      {/* ── 06. A match is only the beginning ────────────────────────────── */}
      {/* The lifecycle after the recommendation, which is the half a
          matching algorithm alone cannot claim. */}
      <HowItWorks />

      {/* ── 07. For organizations ────────────────────────────────────────── */}
      <OrgPreview />

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
              Who should know whom?
            </h2>
          </Rise>
          {/*
            TWO INTENTS, AND ONLY TWO.

            The page used to end on "Find mentorship", which is the old
            company. The organization is the buyer, so it leads; a person
            who wants in goes to the one funnel that exists. No third CTA,
            and nothing here leads anywhere that is not built.
          */}
          <p className="text-halo-heather text-[17px] leading-relaxed mb-8 max-w-md">
            It is the only question Mentable tries to answer.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <CtaButton
              href="/organizations#talk"
              onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'final_org' })}
            >
              Talk to us
            </CtaButton>
            <CtaButton
              href="/apply?role=mentee&cohort=cohort-001"
              onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'final_join' })}
              variant="secondary"
            >
              Join Mentable
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
