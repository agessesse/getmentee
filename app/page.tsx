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
                Talent is everywhere.<br />
                Access isn&apos;t.
              </h1>

              {/*
                The thesis, sharpened.

                The headline was "Find someone worth learning from. Become
                someone worth learning from." True, and it described the
                relationship well, but it never said what problem Mentable
                exists for. Two students with the same ability do not start in
                the same place, and the difference is usually who they already
                know. That is the sentence the company is built on, so it is
                the sentence at the top.

                The standfirst stays deliberately career-agnostic. Finance is
                Cohort 001, not the brand: a visitor who reads the hero and
                concludes Mentable is a finance product has misread it, and
                every future cohort would need this page rewritten.
              */}
              <p
                className="font-display text-halo-heather leading-[1.4] max-w-xl mb-6"
                style={{ fontSize: 'clamp(1.15rem, 1.75vw, 1.4rem)' }}
              >
                Two people can have the same{' '}
                <span className="font-medium text-halo-purple-d">ability</span>
                {' '}and nothing like the same{' '}
                <span className="font-medium text-halo-purple-d">access</span>.
                Mentable connects students with people who have already walked
                the path, and gives the relationship structure after the
                introduction.
              </p>

              {/*
                "Find your mentor" pointed at signup, and signup delivers a
                student into a mentor list where nobody can currently receive a
                request. The ask now matches what actually exists: a first
                cohort you apply to, and a mentor path that explains what
                taking part means before asking for a signup.
              */}
              {/*
                The one thing the hero was missing, and it belongs above the
                buttons rather than below them.

                A first-time visitor met an aphorism, a standfirst and a button
                reading "Apply to the founding cohort" before the page had used
                the word "founding" or said what stage Mentable is at. They were
                being asked to apply to something undefined. This says who it is
                for and where we actually are, in the two lines before the ask,
                so the context arrives before the decision instead of under it
                where a 900px viewport cuts it off.
              */}
              {/*
                The launch signal. Deliberately a rule and two short lines
                rather than a banner: it has to be findable without competing
                with the headline, and it must not read as promotion. No
                countdown, no seat counter, no application count. The only
                number is ten, and ten is true.
              */}
              <div className="border-l-2 border-halo-lavender pl-4 mb-6 max-w-md">
                <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-1">
                  Cohort 001 · Finance · UNC-Chapel Hill
                </p>
                <p className="text-halo-mist-body text-[14.5px] leading-relaxed">
                  Applications are open for our first cohort: ten sophomores, ten mentors,
                  one semester.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <CtaButton
                  href="/apply?role=mentee&cohort=cohort-001"
                  onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'hero' })}
                >
                  Apply to Cohort 001
                </CtaButton>
                <CtaButton
                  href="/mentor"
                  onClick={() => trackLandingEvent('founding_mentor_cta_clicked', { cta: 'hero' })}
                  variant="secondary"
                >
                  Become a mentor
                </CtaButton>
              </div>

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
              Ask someone ahead.<br />Help someone coming up.
            </h2>
          </Rise>
          {/*
            The page's last word was the feeling, with no reminder of what the
            product is. Five sections earlier, 04 answered "why not just text
            someone" and then the argument moved on to mentorship in general.
            One sentence here, naming only things that exist: discovery, shared
            goals and next steps, session prep, and the record of what happened.
          */}
          <p className="text-halo-heather text-[16px] leading-relaxed mb-8 max-w-lg">
            Mentable is how you find each other. It holds the parts that usually get
            dropped: what you agreed, what to prepare, and what happened last time.
            Cohort 001 starts with ten of each.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <CtaButton
              href="/apply?role=mentee&cohort=cohort-001"
              onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'final' })}
            >
              Apply to Cohort 001
            </CtaButton>
            <CtaButton
              href="/mentor"
              onClick={() => trackLandingEvent('founding_mentor_cta_clicked', { cta: 'final' })}
              variant="secondary"
            >
              Become a mentor
            </CtaButton>
          </div>
          {/*
            The institutional door, as one line rather than a section.

            A university programme lead is a real but much rarer visitor than
            a student, and the homepage belongs to the student. One sentence
            after the two CTAs is enough for someone who came looking; a
            section would have told everyone else they were in the wrong
            place.
          */}
          <p className="text-halo-heather text-[15px] mt-7 max-w-lg leading-relaxed">
            Running mentorship for a university, company or community?{' '}
            <Link href="/organizations" className="text-halo-purple-d font-medium hover:text-halo-ink underline underline-offset-2">
              Mentable can power your program
            </Link>
            .
          </p>

          <p className="text-halo-mist-body text-sm mt-6">
            No cost to take part. Know someone who should be here?{' '}
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
