import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';

export const metadata: Metadata = {
  title: 'Cohort 001: ten UNC-Chapel Hill sophomores, ten mentors, one semester',
  description:
    'Mentable Cohort 001 pairs ten UNC-Chapel Hill sophomores heading into finance recruiting with ten people who have already done it. Applications are open.',
  alternates: { canonical: '/cohort-001' },
  openGraph: {
    title: 'Apply to Mentable Cohort 001',
    description:
      'Ten UNC-Chapel Hill sophomores, ten mentors, one semester. Finance is where Mentable starts, not what it is.',
    type: 'website',
    siteName: 'Mentable',
  },
};

/*
  Cohort 001.

  WHAT THIS REPLACED. /founding-cohort, which said the same things under a
  different name. "Founding cohort" and "Cohort 001" were two names for one
  thing, and the homepage now uses the second one everywhere, so the page
  moved rather than being rewritten from nothing. The structure was already
  right: what this is, why it is small, who it is for, what it does not
  promise, how to apply. That structure is kept.

  WHAT THIS PAGE IS FOR. Expanding on Cohort 001, not restating the homepage.
  Someone arrives here having already read that talent is everywhere and
  access is not. What they still do not know is why sophomore year, why
  finance, what the semester actually involves, and what Mentable is careful
  not to promise. Those are the sections.

  No new visual language: the same ivory and veil bands, the same eyebrow and
  display scale, the same buttons. Nothing here animates, because it is a page
  someone reads rather than a page that performs.
*/

const EYEBROW = 'font-ui text-[11px] font-semibold uppercase tracking-[0.14em]';

/* The semester, described as the things that will actually happen. No week
   numbers: the cohort has not run yet, and a fabricated syllabus would be the
   easiest thing on this page to disbelieve. */
const SEMESTER = [
  {
    k: 'Matched deliberately',
    v: 'We read every application and pair each student with one mentor by hand. Twenty people is few enough to do that properly, and no algorithm is involved.',
  },
  {
    k: 'A first conversation with a point',
    v: 'Both sides arrive having seen what the other is trying to do, so the first half hour is not spent on introductions.',
  },
  {
    k: 'Goals you both agreed to',
    v: 'What you are working toward, written down where you can both see it, rather than remembered differently by two people.',
  },
  {
    k: 'Something to do next',
    v: 'Conversations end with a specific next step and a date. Mentable keeps the record so the next conversation starts where the last one ended.',
  },
  {
    k: 'Someone watching the relationship',
    v: 'If a pairing stalls, we notice and step in. If it is wrong, we say so and rematch rather than leaving it to fade.',
  },
];

const ASK = [
  'Fill in your profile properly, so a mentor knows who they are talking to.',
  'Turn up to conversations having done a bit of thinking first.',
  'Respect the times a mentor makes available, and say so early if you can’t make one.',
  'Do the thing you said you’d do between conversations, or say why you didn’t.',
  'Tell us honestly when the product is confusing or broken. That is half the point of a first cohort.',
];

const GET = [
  'One mentor, matched to what you are actually trying to work out.',
  'Tools for preparing before a conversation and following through after it.',
  'Early access to Mentable, and a say in what gets built next.',
  'A direct line to the two people building this. You will not be talking to a support queue.',
];

const NOT = [
  'an internship or a job',
  'an interview anywhere',
  'an introduction to a particular firm',
  'a specific mentor',
  'a professional outcome of any kind',
];

export default function CohortOnePage() {
  return (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col overflow-x-clip">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 lg:py-24 px-6 lg:px-10" aria-labelledby="cohort-heading">
          <div className="max-w-3xl mx-auto">
            <p className={`${EYEBROW} text-halo-purple-d mb-5`}>
              Cohort 001 · Finance · UNC-Chapel Hill
            </p>
            <h1
              id="cohort-heading"
              className="font-display text-halo-ink leading-[1.02] tracking-tight mb-6"
              style={{ fontSize: 'clamp(2.25rem, 6vw, 3.5rem)', textWrap: 'balance' }}
            >
              Ten students. Ten mentors. One semester.
            </h1>
            <p className="text-[17px] text-halo-heather leading-relaxed max-w-xl mb-4">
              Mentable&apos;s first cohort is ten UNC-Chapel Hill sophomores heading into
              finance recruiting, each paired with someone who has already been through it.
            </p>
            <p className="text-[17px] text-halo-heather leading-relaxed max-w-xl mb-8">
              Talent is everywhere. Access isn&apos;t. This is the first place we are trying
              to do something about that, at a small enough scale that we can tell whether
              it worked.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <a
                href="/apply?role=mentee&cohort=cohort-001"
                className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
              >
                Apply to Cohort 001
              </a>
              <Link
                href="/mentor"
                className="inline-flex items-center gap-2 border border-halo-rule bg-white text-halo-ink text-[15px] font-medium px-5 py-3 rounded-xl hover:border-halo-purple transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
              >
                Become a mentor
              </Link>
            </div>
          </div>
        </section>

        {/* ── Why sophomore year ───────────────────────────────────────────── */}
        <section className="py-14 sm:py-16 px-6 lg:px-10 bg-halo-veil border-y border-halo-rule" aria-labelledby="when-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="when-heading" className="font-display text-halo-ink leading-tight text-[1.75rem] mb-4">
              Why sophomore year
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-4">
              Because it is early enough to matter. Finance recruiting starts long before
              most students realise it has started, and the decisions that shape it get made
              in sophomore year: which path to look at, who to talk to, what to have ready.
            </p>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl">
              A student who already knows someone in the industry hears all of that over
              dinner. A student who does not usually finds out by missing it. The timeline
              is the same for both of them, which is what makes this the point where knowing
              one person changes the most.
            </p>
          </div>
        </section>

        {/* ── Why finance ──────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 px-6 lg:px-10" aria-labelledby="field-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="field-heading" className="font-display text-halo-ink leading-tight text-[1.75rem] mb-4">
              Why finance first
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-4">
              Not because it matters more than other careers. Because it is unusually
              legible: the timeline is fixed, the steps are known, and the gap between a
              student who has been told how it works and one who has not is obvious within a
              single conversation. That makes it a good place to find out whether any of
              this works.
            </p>
            {/*
              Said plainly, because the risk of a finance-first launch is that
              the whole company gets read as a finance product.
            */}
            <p className="text-[16px] text-halo-ink leading-relaxed max-w-xl font-medium">
              Finance is where Mentable starts. It is not what Mentable is. The same
              structure should work for a student trying to get into research, design,
              medicine or public service, and those are the cohorts we want to run next.
            </p>
          </div>
        </section>

        {/* ── What the semester involves ───────────────────────────────────── */}
        <section className="py-16 sm:py-20 px-6 lg:px-10 bg-halo-veil border-y border-halo-rule" aria-labelledby="semester-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="semester-heading" className="font-display text-halo-ink leading-tight text-[1.75rem] mb-3">
              What the semester actually involves
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-8">
              Mentable is not a course and there is no curriculum. What it organises is the
              relationship.
            </p>
            <dl className="border-t border-halo-rule">
              {SEMESTER.map((s) => (
                <div key={s.k} className="border-b border-halo-rule py-5 grid grid-cols-1 sm:grid-cols-[minmax(0,13rem)_1fr] gap-x-8 gap-y-1.5">
                  <dt className="font-display text-halo-ink text-[18px] leading-snug">{s.k}</dt>
                  <dd className="text-[15.5px] text-halo-heather leading-relaxed">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Who it's for ─────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 px-6 lg:px-10" aria-labelledby="who-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="who-heading" className="font-display text-halo-ink leading-tight text-[1.75rem] mb-4">
              Who should apply
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-6">
              Sophomores at UNC-Chapel Hill who are seriously considering finance, willing to
              prepare, open to being told they are wrong, and likely to do the thing they
              said they would. You do not need to have chosen a path. Not knowing the
              difference between the roles yet is a good reason to apply, not a reason not
              to.
            </p>
            {/*
              Stated plainly, because the students most helped by this are
              usually the ones who assume a page like this is not for them.
            */}
            <p className="text-[16px] text-halo-ink leading-relaxed max-w-xl font-medium">
              What we are not selecting on: your GPA, your club, your internships, or who you
              already know. If you already have three people in the industry you can text,
              this cohort will be more useful to someone else.
            </p>
          </div>
        </section>

        {/* ── What we ask / what you get / what it isn't ───────────────────── */}
        <section className="py-16 sm:py-20 px-6 lg:px-10 bg-halo-veil border-y border-halo-rule" aria-labelledby="expect-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="expect-heading" className="font-display text-halo-ink leading-tight text-[1.75rem] mb-6">
              What joining does and doesn&apos;t mean
            </h2>

            <div className="border-t border-halo-rule pt-6 mb-10">
              <p className={`${EYEBROW} text-halo-mist-body mb-3`}>Mentable does not promise</p>
              <ul className="space-y-1.5">
                {NOT.map((n) => (
                  <li key={n} className="text-[16px] text-halo-ink leading-relaxed">{n}</li>
                ))}
              </ul>
              <p className="text-[15px] text-halo-heather leading-relaxed mt-4 max-w-xl">
                Mentable can promise the parts it controls: a deliberate match, a structure
                for the relationship, preparation before conversations, a record of what you
                each agreed, and someone paying attention if it stalls. Recruiting outcomes
                are not among them, and anyone telling you otherwise is selling something.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="border-t border-halo-rule pt-6">
                <h3 className={`${EYEBROW} text-halo-purple-d mb-3`}>What we ask of you</h3>
                <ul className="space-y-2.5">
                  {ASK.map((a) => (
                    <li key={a} className="text-[15px] text-halo-heather leading-relaxed">{a}</li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-halo-rule pt-6">
                <h3 className={`${EYEBROW} text-halo-purple-d mb-3`}>What you get</h3>
                <ul className="space-y-2.5">
                  {GET.map((g) => (
                    <li key={g} className="text-[15px] text-halo-heather leading-relaxed">{g}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── After you apply ──────────────────────────────────────────────── */}
        <section id="apply" className="py-16 sm:py-20 px-6 lg:px-10 scroll-mt-6" aria-labelledby="apply-heading">
          <div className="max-w-3xl mx-auto">
            <h2
              id="apply-heading"
              className="font-display text-halo-ink leading-tight mb-3"
              style={{ fontSize: 'clamp(1.75rem, 3.6vw, 2.25rem)' }}
            >
              What happens after you apply
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-3">
              The application is five short questions plus the basics. There are no right
              answers, and specific and honest beats polished and impressive every time.
            </p>
            {/*
              Honest about the parts that are still manual. Saying "we'll email
              you" is a promise a person keeps here, not an automation, and a
              page that implied otherwise would be the first thing to break.
            */}
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-3">
              We read every application ourselves, so give us a few days rather than a few
              minutes. We email you either way. If we take you on, we match you with a mentor
              by hand and introduce you before the semester gets going.
            </p>
            <p className="text-[15px] text-halo-mist-body leading-relaxed max-w-xl mb-9">
              Applying does not create an account and does not commit you to anything.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <a
                href="/apply?role=mentee&cohort=cohort-001"
                className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
              >
                Apply to Cohort 001
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 border border-halo-rule bg-white text-halo-ink text-[15px] font-medium px-5 py-3 rounded-xl hover:border-halo-purple transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
              >
                More about Mentable
              </Link>
            </div>
          </div>
        </section>

        {/* ── The other side ───────────────────────────────────────────────── */}
        <section className="py-14 sm:py-16 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule" aria-labelledby="mentor-side-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="mentor-side-heading" className="font-display text-halo-ink leading-tight text-[1.5rem] mb-3">
              Not a student?
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-5">
              Cohort 001 needs ten mentors as much as it needs ten students. If you have been
              through finance recruiting and would answer the questions you once had to work
              out alone, that is the other half of this.
            </p>
            <Link
              href="/mentor"
              className="inline-flex items-center gap-2 border border-halo-rule bg-white text-halo-ink text-[15px] font-medium px-5 py-2.5 rounded-xl hover:border-halo-purple transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
            >
              Become a mentor
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
