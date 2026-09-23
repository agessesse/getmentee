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
// Four peer outcomes. The previous split rendered two of them at 48px navy-900
// and two at 24px navy-800, which implied Clarity outranked Accountability.
// Nothing justified that, so the tiering is gone: hierarchy now comes from
// label versus body, and the numbering gives the eye a reading order.
// "Opportunity" was dropped because its line described a precondition
// ("an introduction only helps if you are ready") rather than an outcome.
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
      <section className="w-full pt-8 pb-16 sm:pb-20 lg:pb-[clamp(3rem,8vh,6rem)] px-6 lg:px-10" aria-labelledby="hero-heading">
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
                className="hero-rise-inner hero-headline font-display text-halo-ink leading-[0.98] tracking-tight mb-7 max-w-3xl"
              >
                Find someone<br />
                worth learning from.<br />
                Become someone<br />
                worth learning from.
              </h1>

              {/*
                The thesis. The headline was "The Right Mentor Can Change Your
                Trajectory", which only a student could see themselves in. It now
                claims the relationship for both people, in the same three short
                lines so the hero keeps its shape. The standfirst then says the
                actual problem, that the two rarely find each other, and keeps
                "everything after the introduction", which answers the question
                every visitor arrives with: "is this just a list of names?"

                Teacher first, learner second, matching the order of the pair of
                cards beside it and of the two roster sections below.

                Note it does NOT say "luck". The Problem section below opens
                "Right now, mentorship mostly depends on luck", and a hero that
                says it first turns that heading into an echo of itself.
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
                People{' '}
                <span className="font-medium text-halo-purple-d">
                  willing to teach
                </span>
                {' '}and people{' '}
                <span className="font-medium text-halo-purple-d">
                  ready to learn
                </span>
                {' '}rarely know how to find each other. Mentable brings them
                together, and handles everything after the introduction.
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
              <p className="text-halo-heather text-[15px] leading-relaxed mb-7 max-w-md">
                For students who want to learn from someone further along, and for
                professionals willing to be that person. Mentable is being built right now,
                and we&apos;re putting together the first group of both.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <CtaButton
                  href="/founding-cohort"
                  onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'hero' })}
                >
                  Apply to the founding cohort
                </CtaButton>
                <CtaButton
                  href="/mentor"
                  onClick={() => trackLandingEvent('founding_mentor_cta_clicked', { cta: 'hero' })}
                  variant="secondary"
                >
                  Become a founding mentor
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
        ── 09. Opportunity Fund ──────────────────────────────────────────────
        No scroll handoff on this one. It used to scale and fade to 70% as the
        closing section arrived, which read as the band greying out rather than
        as depth, and the fund is not the thing to dim.
      */}
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
                For students with demonstrated financial need, we want to remove the
                practical barriers between guidance and action: the suit, the train fare,
                the coffee. This is the part of Mentable that does not exist yet.
              </p>
              <p className="text-halo-lavender text-[14px] leading-relaxed mb-7">
                Not funded yet. We&apos;re looking for the partners to pay for the first
                grants, and we&apos;d rather say that than imply the money is already there.
              </p>
              {/*
                The student's closing ask, inside the one section that is
                deliberately about students. The final CTA below speaks to both
                sides, so this is the student's more specific next step.

                Ordered ask-then-read: the button is the commitment, the fund
                link is the lower-commitment alternative for anyone not ready.
              */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <CtaButton
                  href="/founding-cohort"
                  onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'fund' })}
                  size="md"
                  ground="deep"
                >
                  Apply to the founding cohort
                </CtaButton>
                {/*
                  There was a second button here reading "Learn about the
                  Opportunity Fund" that pointed at /signup?role=mentee. It
                  promised information and delivered a signup form, and the
                  only page about the fund is behind authentication — a dead
                  end for exactly the visitor it was written for. The section's
                  own words now carry the explanation, and the fund keeps one
                  ask rather than competing with the cohort for attention.
                */}
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
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <CtaButton
              href="/founding-cohort"
              onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'final' })}
            >
              Apply to the founding cohort
            </CtaButton>
            <CtaButton
              href="/mentor"
              onClick={() => trackLandingEvent('founding_mentor_cta_clicked', { cta: 'final' })}
              variant="secondary"
            >
              Become a founding mentor
            </CtaButton>
          </div>
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
