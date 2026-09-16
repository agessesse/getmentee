import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';
import SectionIntro from '@/components/marketing/SectionIntro';
import CtaButton from '@/components/marketing/CtaButton';
import MenteeLedger from '@/components/marketing/mentor/MenteeLedger';
import ContextGap from '@/components/marketing/mentor/ContextGap';
import RequestAnatomy from '@/components/marketing/mentor/RequestAnatomy';
import MentorshipWorkspace from '@/components/marketing/mentor/MentorshipWorkspace';
import AdviceToRecord from '@/components/marketing/mentor/AdviceToRecord';
import PreMeetingBrief from '@/components/marketing/mentor/PreMeetingBrief';
import { BRAND_DEFINITION, BRAND_PRONUNCIATION } from '@/components/ui/Wordmark';

export const metadata: Metadata = {
  title: 'Mentable for mentors: give your time with context',
  description:
    'See who is asking and why before you agree, then keep one record of the relationship so the next conversation does not start from scratch.',
};

/*
 * The public page for professionals willing to mentor.
 *
 * WHY THIS IS NOT THE MENTEE PAGE WITH THE NOUNS SWAPPED. The mentee page is a
 * chronology, because a student is being walked from not knowing anyone to
 * being in a relationship. A mentor is not walking a path; they are making one
 * decision and then living with it for months. So this page is shaped like a
 * decision brief: what makes this hard, what you receive, what you control,
 * what you get afterwards, and what is expected of the other person. The two
 * pages share the design system and share no narrative structure.
 *
 * WHAT THIS PAGE REFUSES TO CLAIM, having checked. There is no mentor-facing
 * control that flips mentor_profiles.is_available, so nothing here says you can
 * mark yourself unavailable. There is no cap on incoming requests, no screening
 * of students, no automated matching presented to mentors, and no evidence the
 * notifications table generates reminders for due action items. Section 04 says
 * so in as many words, because a reader who finds one overclaim stops believing
 * the rest of the page.
 *
 * NO CLIENT JAVASCRIPT, matching the mentee page. This page and all six of its
 * section components are server components, and no CTA instrumentation is
 * wired here.
 */
export default function MentorPage() {
  return (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col overflow-x-clip">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ── 01. Hero ───────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 lg:py-24 px-6 lg:px-10" aria-labelledby="mentor-heading">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-12 lg:gap-16 items-center">
              <div>
                <p className="font-ui text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.14em] mb-5">
                  For mentors
                </p>

                {/* The break is suppressed below sm, where the line is short
                    enough to wrap on its own and a forced one stranded a single
                    word. Above sm the sentence needs the help: without it,
                    "mentoring" ends up alone on the middle line. */}
                <h1
                  id="mentor-heading"
                  className="font-display text-halo-ink leading-[1.04] tracking-tight mb-7 max-w-3xl"
                  style={{ fontSize: 'clamp(2.1rem, 4.8vw, 3.5rem)' }}
                >
                  The hard part of mentoring<br className="hidden sm:block" /> is not the willingness.
                </h1>

                <p className="text-lg sm:text-xl text-halo-mist-body font-light leading-relaxed max-w-lg mb-9">
                  It is remembering where you left off, knowing what this person is
                  actually trying to do, and finding out whether any of it went anywhere.
                  Mentable holds that part, so the hour you give is{' '}
                  <span className="font-medium text-halo-purple-d">spent on the conversation</span>.
                </p>

                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                  <CtaButton href="/signup?role=mentor">Become a mentor</CtaButton>
                  <CtaButton href="#request-heading" variant="secondary">
                    See what a request contains
                  </CtaButton>
                </div>

                <p className="text-halo-mist-body text-sm mt-6">
                  No cost, and no obligation to accept anyone.
                </p>
              </div>

              <div className="hidden lg:block">
                <MenteeLedger />
              </div>
            </div>
          </div>
        </section>

        {/* ── 02. The friction ───────────────────────────────────────────── */}
        <section
          className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule"
          aria-labelledby="friction-heading"
        >
          <div className="max-w-6xl mx-auto">
            <SectionIntro
              eyebrow="Why it gets hard"
              heading="Every conversation starts by rebuilding the last one."
              id="friction-heading"
              lead="Not because anyone did anything wrong. The information exists. It is just spread across a profile, an inbox, a call you had in March, and whatever you happen to remember."
              className="max-w-2xl mb-12"
            />

            <ContextGap />

            <p className="text-halo-heather text-[15px] leading-relaxed max-w-xl mt-12">
              Answering those five questions is the work before the work. Do it often
              enough and the fourth conversation is no more useful than the first, which
              is usually when a mentorship quietly stops.
            </p>
          </div>
        </section>

        {/* ── 03. Before you say yes ─────────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="request-heading">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.15fr] gap-10 lg:gap-16 items-start">
              <div className="lg:sticky lg:top-24">
                <SectionIntro
                  eyebrow="Before you say yes"
                  heading={<>What a request<br className="hidden sm:block" /> actually contains.</>}
                  id="request-heading"
                  lead="Students on Mentable answer two questions before they can send anything: what they are trying to accomplish, and why they picked you. Both arrive attached to their profile."
                  className="max-w-md"
                />

                <p className="text-halo-heather text-[15px] leading-relaxed max-w-md mt-5">
                  So the decision is not whether to be generous in the abstract. It is
                  whether you are the right person for this specific thing, which is a
                  question you can actually answer.
                </p>

                <p className="text-halo-heather text-[15px] leading-relaxed max-w-md mt-4">
                  If you are not, decline is a button. Nothing is sent back except the
                  decision.
                </p>
              </div>

              <RequestAnatomy />
            </div>
          </div>
        </section>

        {/* ── 04. What you control ───────────────────────────────────────── */}
        <section
          className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule"
          aria-labelledby="control-heading"
        >
          <div className="max-w-6xl mx-auto">
            <SectionIntro
              eyebrow="What you control"
              heading="Signing up does not make you available to everyone."
              id="control-heading"
              className="max-w-2xl mb-12"
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr,1fr] gap-10 lg:gap-16 items-start">
              <ol className="max-w-xl">
                {CONTROLS.map((c, i) => (
                  <li
                    key={c.label}
                    className="grid grid-cols-[auto,1fr] gap-x-5 py-6 border-t border-halo-rule last:border-b last:border-halo-rule"
                  >
                    <span className="text-[12px] font-semibold tabular-nums text-halo-purple-d pt-1.5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="font-display text-halo-ink text-[22px] leading-snug mb-2">
                        {c.label}
                      </h3>
                      <p className="text-halo-heather text-[15px] leading-relaxed">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* The other half of being precise */}
              <div className="rounded-xl border border-halo-rule bg-white p-6 lg:mt-14">
                <p className="font-ui text-[10px] font-semibold text-halo-mist-body uppercase tracking-[0.12em] mb-4">
                  And what it does not do
                </p>
                <ul className="space-y-3.5">
                  {NOT_CLAIMED.map((n) => (
                    <li key={n} className="text-[14px] text-halo-heather leading-relaxed">
                      {n}
                    </li>
                  ))}
                </ul>
                <p className="text-[13px] text-halo-mist-body leading-relaxed mt-5 pt-5 border-t border-halo-rule">
                  We would rather you know that now than find it out after signing up. The
                  approval step is the control, and it is the one that matters.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05. After you accept ───────────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-deep" aria-labelledby="after-heading">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.15fr] gap-12 lg:gap-16 items-center">
              <div>
                <SectionIntro
                  eyebrow="After you accept"
                  heading={<>One place, and<br />it is still there<br />in three weeks.</>}
                  id="after-heading"
                  tone="deep"
                  lead="A mentorship on Mentable is a record, not a thread. What they are working toward, what you said last time, what is still outstanding, and when you next speak all sit in the same view."
                  className="max-w-md"
                />

                <p className="text-halo-lavender text-[15px] font-light leading-relaxed max-w-md mt-6">
                  You write the recap once, after the session, while it is still in your
                  head. That is the only part that asks anything of you, and it is the part
                  that makes the next conversation easy.
                </p>

                <CtaButton href="/signup?role=mentor" size="md" ground="deep" className="mt-9">
                  Become a mentor
                </CtaButton>
              </div>

              <MentorshipWorkspace />
            </div>
          </div>
        </section>

        {/* ── 06. Advice with a next step ────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="advice-heading">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <SectionIntro
                  eyebrow="Advice with a next step"
                  heading="Say it once, and it stays said."
                  id="advice-heading"
                  lead="The useful part of mentoring is rarely the encouragement. It is the specific thing you tell someone to go and do, which is also the part that evaporates fastest."
                  className="max-w-md"
                />

                <p className="text-halo-heather text-[15px] leading-relaxed max-w-md mt-5">
                  Either of you can turn it into an action item, put a name and a date on
                  it, and tick it off. Mentable does not chase anyone about it. It just
                  means the thing you said is written down, and you are not the only one
                  who remembers saying it.
                </p>
              </div>

              <AdviceToRecord />
            </div>
          </div>
        </section>

        {/* ── 07. The brief ──────────────────────────────────────────────── */}
        <section
          className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule"
          aria-labelledby="brief-heading"
        >
          <div className="max-w-6xl mx-auto text-center">
            <SectionIntro
              eyebrow="Before each session"
              heading="You should not have to reconstruct three conversations before the fourth."
              id="brief-heading"
              lead="So Mentable does it. Open a scheduled session and the first thing on the page is a brief on the person you are about to talk to."
              className="max-w-2xl mx-auto mb-12"
            />

            <PreMeetingBrief />
          </div>
        </section>

        {/* ── 08. What is asked of them ──────────────────────────────────── */}
        {/* Narrow measure, but held on the same left gutter as every other
            section. Centring the block as well as narrowing it put its text
            edge 240px inside the page and read as a mistake. */}
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="reciprocity-heading">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <SectionIntro
                eyebrow="The other side"
                heading="What is asked of them."
                id="reciprocity-heading"
                className="mb-8"
              />

              <p className="text-halo-heather text-[17px] leading-relaxed mb-5">
                A student cannot reach you without saying what they want and why they chose
                you. When you meet, they leave with something to do, and both of you can see
                whether it happened. When you next speak, they are expected to come back with
                what they found, including the parts that did not work.
              </p>

              <p className="text-halo-heather text-[17px] leading-relaxed mb-8">
                Mentable does not enforce any of that. It makes it visible, which in practice
                is most of it. Somebody who is not doing the work cannot hide that from the
                person helping them.
              </p>

              <div className="pl-5 border-l-2 border-halo-purple/40">
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-halo-ink text-[26px] leading-none">
                    mentable
                  </span>
                  <span className="text-halo-mist-body text-sm font-light">
                    {BRAND_PRONUNCIATION}
                  </span>
                  <span className="text-halo-mist-body text-sm italic font-light">adjective</span>
                </p>
                <p className="text-halo-heather text-[15px] font-light mt-2">{BRAND_DEFINITION}</p>
              </div>

              <p className="text-halo-mist-body text-[15px] leading-relaxed mt-6">
                The name is about the student, and it is the whole filter. This is built for
                people who want to be coached, not for people collecting contacts.
              </p>
            </div>
          </div>
        </section>

        {/* ── 09. Why do it ──────────────────────────────────────────────── */}
        <section
          className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule"
          aria-labelledby="why-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
              <SectionIntro
                eyebrow="Why do it"
                heading="Most of what you know, somebody told you."
                id="why-heading"
                className="max-w-lg"
              />

              <div className="max-w-lg">
                <p className="text-halo-heather text-[16px] leading-relaxed mb-5">
                  Not the technical parts. The judgment. Which risks were worth taking, what
                  a bad manager looks like early, when to leave, what the job is actually
                  like on a Tuesday. That kind of knowledge travels one person at a time,
                  and somebody shortened your version of it.
                </p>

                <p className="text-halo-heather text-[16px] leading-relaxed mb-5">
                  The part worth showing up for is watching advice turn into judgment. A
                  student who needed the answer in March works it out themselves in
                  September, and after a while they stop needing you, which is the point.
                </p>

                <p className="text-halo-mist-body text-[15px] leading-relaxed">
                  Mentable keeps a record of what you have done: who you have mentored,
                  sessions held, hours given, and goals the two of you closed out.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 10. Final CTA ──────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="cta-heading">
          <div className="max-w-6xl mx-auto">
            <h2
              id="cta-heading"
              className="font-display text-halo-ink leading-[1.03] mb-6 max-w-2xl"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}
            >
              One student. See how it goes.
            </h2>

            <p className="text-halo-mist-body text-[17px] font-light leading-relaxed max-w-md mb-9">
              Set up a profile, read the requests that come in, and say yes to one of them
              if it fits.
            </p>

            <CtaButton href="/signup?role=mentor">Become a mentor</CtaButton>

            <p className="text-halo-mist-body text-sm mt-6">
              Already have an account?{' '}
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
 * The three controls a mentor actually has. Each one is a thing the product
 * does today, not a thing it could plausibly do:
 *
 *   01  mentorship_requests are pending until the mentor approves or declines,
 *       and approval is what creates the mentorships row.
 *   02  availability_slots are recurring weekly windows the mentor adds and
 *       deletes on /schedule. The RLS insert policy on sessions is
 *       `auth.uid() = mentee_id`, so the mentee books and the mentor publishes.
 *   03  weekly_hours and expertise_tags are fields on mentor_profiles, set in
 *       profile setup. Note the wording: these are stated, not enforced. There
 *       is no code anywhere that blocks a request for exceeding an hours
 *       figure, so this must not be written as a cap.
 */
const CONTROLS = [
  {
    label: 'Nobody is your mentee until you approve them',
    body: 'A request sits as a request. Approving it is what creates the mentorship, and declining ends it there.',
  },
  {
    label: 'You publish the windows',
    body: 'You add recurring weekly times you are free, and remove them whenever. Sessions can only be booked inside them, by the student, so nothing lands on your calendar that you did not open up.',
  },
  {
    label: 'You say what you help with',
    body: 'Your areas and the hours a week you expect to give are on your profile before anyone writes to you. Students read them first, which is where most of the filtering happens.',
  },
];

/*
 * Stated plainly because the alternative is a professional discovering it
 * themselves and concluding the rest of the page was also approximate. Each
 * line was verified: no UI writes mentor_profiles.is_available, nothing limits
 * request volume, no student verification exists, and while the notifications
 * table has an action_item_due type in its CHECK constraint, nothing generates
 * one.
 */
const NOT_CLAIMED = [
  'It does not vet or screen students for you.',
  'It does not limit how many requests can reach you.',
  'There is no switch that hides you from search.',
  'It will not remind anyone about an overdue action item, including you.',
];
