import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';
import SectionIntro from '@/components/marketing/SectionIntro';
import CtaButton from '@/components/marketing/CtaButton';
import MentorshipRecord from '@/components/marketing/mentee/MentorshipRecord';
import StalledPath from '@/components/marketing/mentee/StalledPath';
import MenteeJourney from '@/components/marketing/mentee/MenteeJourney';
import MatchExample from '@/components/marketing/mentee/MatchExample';
import RequestContrast from '@/components/marketing/mentee/RequestContrast';
import CarryOver from '@/components/marketing/mentee/CarryOver';
import { BRAND_DEFINITION, BRAND_PRONUNCIATION } from '@/components/ui/Wordmark';

export const metadata: Metadata = {
  title: 'Mentable for students: find a mentor and keep the relationship',
  description:
    'Find someone who has already done the work you want to do, then keep the relationship going with shared goals, sessions and follow-up in one place.',
};

/*
 * The public page for students.
 *
 * A NOTE ON WHAT THIS PAGE IS NOT. The landing page already carries an
 * interactive four-stage product demo, a trajectory curve and a flywheel. The
 * temptation here was to run the same devices again with the copy pointed at
 * students, which would have produced a longer home page rather than a second
 * page worth visiting. So every section below states something the landing page
 * does not: the sequence that fails when a student assembles mentorship alone,
 * the reason attached to a match, the shape of a request that works, the
 * carry-over between one session and the next, and the half of the bargain the
 * student owes.
 *
 * A NOTE ON CLIENT JAVASCRIPT. There is none. This is a server component and so
 * is every section component it imports, which means the route ships the header
 * and nothing else. That is a deliberate trade against the landing page's CTA
 * instrumentation: trackLandingEvent only records for visitors who are ALREADY
 * signed in (see the limitation documented in lib/landing-analytics.ts), so
 * wiring it here would turn the whole page into a client component in exchange
 * for events that anonymous student traffic cannot write. When the anonymous
 * events table described in that file exists, this becomes worth revisiting.
 */
export default function MenteePage() {
  return (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col overflow-x-clip">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ── 01. Hero ───────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 lg:py-24 px-6 lg:px-10" aria-labelledby="mentee-heading">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-12 lg:gap-16 items-center">
              <div>
                <p className="font-ui text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.14em] mb-5">
                  For students
                </p>

                <h1
                  id="mentee-heading"
                  className="font-display text-halo-ink leading-[1.0] tracking-tight mb-7 max-w-2xl"
                  style={{ fontSize: 'clamp(2.4rem, 6vw, 4.4rem)' }}
                >
                  One conversation<br />is not a mentorship.
                </h1>

                <p className="text-lg sm:text-xl text-halo-mist-body font-light leading-relaxed max-w-lg mb-9">
                  You can find a name. You can even get a reply. The hard part is turning
                  that into someone who knows what you are working on and{' '}
                  <span className="font-medium text-halo-purple-d">
                    expects to hear from you again
                  </span>
                  .
                </p>

                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                  <CtaButton href="/apply?role=mentee">Apply as a mentee</CtaButton>
                  <CtaButton href="#journey-heading" variant="secondary">
                    See how it works
                  </CtaButton>
                </div>

                <p className="text-halo-mist-body text-sm mt-6">
                  Free to join. You do not need to know anyone first. You do need to show up
                  prepared and follow through.
                </p>
              </div>

              {/* Matches HeroPair on the landing page: desktop only. The same
                  idea is shown at full width, on every screen, in CarryOver. */}
              <div className="hidden lg:block">
                <MentorshipRecord />
              </div>
            </div>
          </div>
        </section>

        {/* ── 02. The problem ────────────────────────────────────────────── */}
        <section
          className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule"
          aria-labelledby="stall-heading"
        >
          <div className="max-w-6xl mx-auto">
            <SectionIntro
              eyebrow="The problem"
              heading="What usually happens."
              id="stall-heading"
              lead="This is not anyone failing. It is what mentorship looks like when a student has to assemble it out of parts that were never connected to each other."
              className="max-w-2xl mb-14"
            />

            <StalledPath />

            <p className="text-halo-heather text-[15px] leading-relaxed max-w-xl mt-14 pt-7 border-t border-halo-rule">
              Every step in that sequence is reasonable on its own. Nothing is holding them
              together, so the relationship lasts exactly as long as someone remembers to
              keep it alive.
            </p>
          </div>
        </section>

        {/* ── 03. The journey ────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="journey-heading">
          <div className="max-w-6xl mx-auto">
            <SectionIntro
              eyebrow="How it works"
              heading="The same path, held together."
              id="journey-heading"
              lead="Six steps, and you do not have to invent any of them."
              className="max-w-2xl mb-14"
            />

            <MenteeJourney />
          </div>
        </section>

        {/* ── 04. Discover ───────────────────────────────────────────────── */}
        <section
          className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule"
          aria-labelledby="discover-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.05fr] gap-10 lg:gap-16 items-start">
              <div className="lg:sticky lg:top-24">
                <SectionIntro
                  eyebrow="Discover"
                  heading={<>Knowing who<br className="hidden sm:block" /> to ask.</>}
                  id="discover-heading"
                  lead="You tell Mentable what you are studying, what you are interested in and where you are trying to get to. Discover ranks mentors against that, and shows you why each one came up."
                  className="max-w-md"
                />

                <p className="text-halo-heather text-[15px] leading-relaxed max-w-md mt-5">
                  The reason matters more than the ranking. It is the difference between a
                  name on a list and a person whose relevance to you fits in one sentence,
                  before you have said a word to them.
                </p>

                <CtaButton href="/#mentor-carousel-heading" variant="outline" size="md" className="mt-7">
                  Meet some of the mentors
                </CtaButton>
              </div>

              <MatchExample />
            </div>
          </div>
        </section>

        {/* ── 05. The request ────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="request-heading">
          <div className="max-w-6xl mx-auto">
            <SectionIntro
              eyebrow="The request"
              heading="Ask better than a cold email."
              id="request-heading"
              lead="A mentor is not deciding whether to be nice to you. They are deciding whether they are the right person and whether the time will be used. Two questions give them enough to answer that."
              className="max-w-2xl mb-12"
            />

            <RequestContrast />
          </div>
        </section>

        {/* ── 06. After they say yes ─────────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-deep" aria-labelledby="after-heading">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start lg:items-center">
              <div>
                <SectionIntro
                  eyebrow="After they say yes"
                  heading={<>The introduction<br />is not the product.</>}
                  id="after-heading"
                  tone="deep"
                  lead="Most of what makes mentorship work happens in the weeks between conversations, which is exactly where it usually falls apart. That is the part Mentable keeps."
                  className="max-w-md"
                />

                <ul className="mt-9 max-w-md">
                  {[
                    ['Shared goals', 'What you are working toward, with a date on it.'],
                    ['Sessions', 'Scheduled, with notes that stay on the mentorship.'],
                    ['Action items', 'Owned by one of you, due on a day.'],
                    ['Messages', 'One thread, not a scattered email chain.'],
                    ['A brief', 'What is still open, read before you meet again.'],
                  ].map(([label, line]) => (
                    <li
                      key={label}
                      className="py-3.5 border-t border-halo-deep-rule last:border-b last:border-halo-deep-rule"
                    >
                      <p className="text-[15px] font-semibold text-white leading-snug">{label}</p>
                      <p className="text-[13px] text-halo-lavender font-light leading-relaxed mt-1">
                        {line}
                      </p>
                    </li>
                  ))}
                </ul>

                <CtaButton href="/apply?role=mentee" size="md" ground="deep" className="mt-9">
                  Apply as a mentee
                </CtaButton>
              </div>

              <CarryOver />
            </div>
          </div>
        </section>

        {/* ── 07. Why it gets better ─────────────────────────────────────── */}
        {/* Renamed off "compounds". That word now belongs to Return on Impact
            on the homepage, which is about reach beyond the relationship. This
            section is the opposite scale: what accumulates inside one. */}
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="compound-heading">
          <div className="max-w-6xl mx-auto">
            <SectionIntro
              eyebrow="Why it gets better"
              heading="The fifth conversation is better than the first."
              id="compound-heading"
              lead="Not because the mentor tries harder. Because by then they know things about you that nobody can learn about a stranger in thirty minutes."
              className="max-w-2xl mb-14"
            />

            <ol className="max-w-4xl">
              {CONTEXT.map((stage, i) => (
                <li
                  key={stage.when}
                  className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-x-8 gap-y-3 py-7 border-t border-halo-rule last:border-b last:border-halo-rule"
                >
                  <h3 className="font-display text-halo-ink text-[20px] leading-snug">
                    {stage.when}
                  </h3>
                  <ul className="space-y-2.5">
                    {stage.knows.map((line, j) => {
                      const isNew = j === i;
                      return (
                        <li key={line} className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className={`w-1.5 h-1.5 rounded-full flex-none mt-[7px] ${
                              isNew ? 'bg-halo-purple' : 'bg-halo-bone'
                            }`}
                          />
                          <span
                            className={`text-[15px] leading-relaxed ${
                              isNew ? 'text-halo-ink font-medium' : 'text-halo-mist-body font-light'
                            }`}
                          >
                            {line}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>

            <p className="text-halo-heather text-[15px] leading-relaxed max-w-xl mt-9">
              None of that is a feature. It is what happens when the context does not reset
              every time the two of you speak.
            </p>
          </div>
        </section>

        {/* ── 08. Your half ──────────────────────────────────────────────── */}
        <section
          className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule"
          aria-labelledby="mentable-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div>
                <SectionIntro
                  eyebrow="The other half"
                  heading="Mentable is a two way word."
                  id="mentable-heading"
                  className="max-w-md"
                />

                {/* The name, set as what it is */}
                <div className="mt-8 pl-5 border-l-2 border-halo-purple/40 max-w-sm">
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-display text-halo-ink text-[26px] leading-none">
                      mentable
                    </span>
                    <span className="text-halo-mist-body text-sm font-light">
                      {BRAND_PRONUNCIATION}
                    </span>
                    <span className="text-halo-mist-body text-sm italic font-light">adjective</span>
                  </p>
                  <p className="text-halo-heather text-[15px] font-light mt-2">
                    {BRAND_DEFINITION}
                  </p>
                </div>

                <p className="text-halo-heather text-[15px] leading-relaxed max-w-md mt-8">
                  The word describes the student, not the mentor. Being worth someone&apos;s
                  time is a thing you can choose, and Mentable makes your side of it visible:
                  the action items you closed are on the same record your mentor reads before
                  you meet.
                </p>
              </div>

              <div>
                <p className="font-ui text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.14em] mb-6">
                  What that looks like
                </p>
                <ul>
                  {RECIPROCITY.map((line) => (
                    <li
                      key={line}
                      className="py-4 border-t border-halo-rule last:border-b last:border-halo-rule text-halo-ink text-[16px] leading-snug"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── 09. Final CTA ──────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="cta-heading">
          <div className="max-w-6xl mx-auto">
            <h2
              id="cta-heading"
              className="font-display text-halo-ink leading-[1.03] mb-6 max-w-2xl"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}
            >
              You do not need to<br />know anyone yet.
            </h2>

            <p className="text-halo-mist-body text-[17px] font-light leading-relaxed max-w-md mb-9">
              Say what you are trying to do, and start with one person who has already done it.
            </p>

            <CtaButton href="/apply?role=mentee">Apply as a mentee</CtaButton>

            <p className="text-halo-mist-body text-sm mt-6">
              Free to join. Already have an account?{' '}
              <Link
                href="/login"
                className="tap-target text-halo-purple-d underline underline-offset-2 hover:text-halo-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded-sm"
              >
                Sign in
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/*
 * What a mentor knows about you, and when.
 *
 * Each stage repeats everything the one before it held and adds a single line,
 * so the accumulation is visible in the shape of the list rather than asserted
 * in a sentence. The index of the new line equals the index of the stage, which
 * is what drives the marker colour above.
 *
 * Deliberately no numbers: "first", "a few" and "months in" are honest about
 * being illustrative, where "after 8 sessions" would read as a measured figure
 * this product has not measured.
 */
const CONTEXT = [
  {
    when: 'First conversation',
    knows: ['What you are studying, and roughly where you want to end up.'],
  },
  {
    when: 'A few sessions in',
    knows: [
      'What you are studying, and roughly where you want to end up.',
      'What you actually tried, and which parts of it did not work.',
    ],
  },
  {
    when: 'Months in',
    knows: [
      'What you are studying, and roughly where you want to end up.',
      'What you actually tried, and which parts of it did not work.',
      'What you are good at, and whether they would put their name behind you.',
    ],
  },
];

const RECIPROCITY = [
  'Arrive with a question, not just availability.',
  'Do the thing you said you would do.',
  'Come back with what happened, including the parts that went badly.',
  'Say when the advice did not fit. That is worth knowing too.',
];
