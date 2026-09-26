import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';

export const metadata: Metadata = {
  title: 'Mentable founding cohort: apply to be one of the first students',
  description:
    'Mentable is early. We’re starting with a small first group of students so the mentorship is real rather than theoretical. Applications are open.',
  alternates: { canonical: '/founding-cohort' },
  openGraph: {
    title: 'Apply to the Mentable founding cohort',
    description:
      'We’re looking for the first students to build this with us. You don’t need prestige or a network, just something you want to understand and the willingness to prepare.',
    type: 'website',
    siteName: 'Mentable',
  },
};

/*
  The public ask, while Mentable is early.

  WHY THIS PAGE EXISTS. The site is about to be shared publicly for the first
  time. Until this pass the student CTA was "Create your profile", which
  delivered a stranger into a marketplace where — verified against the live
  database — no mentor could receive a request. The honest version of the ask
  is not "join the product", it is "apply to be one of the first people in it",
  and that is a different page with different promises.

  WHAT IT REFUSES TO DO. No countdown, no seat counter, no "only N spots left".
  The cohort is small because a handful of mentors can only hold a handful of
  real relationships, and that is said in those words. Scarcity that reflects
  capacity is a fact; scarcity invented to move people is a trick, and this
  page would rather be believed later than clicked now.
*/

const EYEBROW = 'font-ui text-[11px] font-semibold uppercase tracking-[0.14em]';

const ASK = [
  'Fill in your profile properly, so a mentor knows who they are talking to.',
  'Turn up to conversations having done a bit of thinking first.',
  'Respect the times a mentor makes available, and say so early if you can’t make one.',
  'Do the thing you said you’d do between conversations, or say why you didn’t.',
  'Tell us honestly when the product is confusing or broken. That is half the point of a first cohort.',
];

const GET = [
  'Early access to Mentable, and a say in what gets built next.',
  'The ability to request time with the mentors taking part.',
  'Tools for preparing before a conversation and following through after it.',
  'A direct line to the two people building this. You will not be talking to a support queue.',
];

const NOT = [
  'a particular mentor',
  'an internship or a job',
  'an introduction to anyone',
  'admission anywhere',
  'a professional outcome of any kind',
];

export default function FoundingCohortPage() {
  return (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col overflow-x-clip">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 lg:py-24 px-6 lg:px-10" aria-labelledby="cohort-heading">
          <div className="max-w-3xl mx-auto">
            <p className={`${EYEBROW} text-halo-purple-d mb-5`}>Founding cohort</p>
            <h1
              id="cohort-heading"
              className="font-display text-halo-ink leading-[1.02] tracking-tight mb-6"
              style={{ fontSize: 'clamp(2.25rem, 6vw, 3.5rem)', textWrap: 'balance' }}
            >
              We’re looking for the first students to build this with us.
            </h1>
            <p className="text-[17px] text-halo-heather leading-relaxed max-w-xl mb-4">
              Mentable is early. Rather than open a mentor marketplace that isn’t full yet,
              we’re starting with a small group of students and the mentors who agree to
              work with them.
            </p>
            {/*
              This said "You don't need a good résumé to apply", which was meant
              to remove a barrier and instead announced a low bar. The bar is
              real, it is just not the one most places use: not what you have
              already done, but how seriously you intend to use someone's time.
            */}
            <p className="text-[17px] text-halo-heather leading-relaxed max-w-xl mb-8">
              You don’t need to have it figured out, and you don’t need a network or a
              long résumé. You do need something you genuinely want to understand, and the
              willingness to prepare, take feedback and follow through.
            </p>
            <a
              href="#apply"
              className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
            >
              Apply as a mentee
            </a>
          </div>
        </section>

        {/* ── What this is ─────────────────────────────────────────────────── */}
        <section className="py-14 sm:py-16 px-6 lg:px-10 bg-halo-veil border-y border-halo-rule" aria-labelledby="what-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="what-heading" className="font-display text-halo-ink leading-tight text-[1.75rem] mb-4">
              What Mentable is
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-4">
              A place to find someone a few steps ahead of you, and a set of tools for making
              that relationship work once you have it: shared goals, a record of what you
              each said you’d do, and help preparing before you talk.
            </p>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl">
              Good mentorship mostly depends on luck right now. On knowing someone, or on
              being the kind of person who finds it easy to ask. We’re trying to make it
              depend on that a little less.{' '}
              <Link href="/" className="text-halo-purple-d font-medium hover:text-halo-ink">
                More about the idea
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ── Why a cohort ─────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 px-6 lg:px-10" aria-labelledby="why-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="why-heading" className="font-display text-halo-ink leading-tight text-[1.75rem] mb-4">
              Why we’re starting small
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-4">
              A mentorship platform with more students than mentors is worse than no platform
              at all: requests go unanswered, and everybody concludes the whole idea doesn’t
              work. We’d rather have a small number of relationships that are real.
            </p>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl">
              Starting small also means we get to watch closely. Where mentorship works,
              where it stalls, and what a student actually needs between conversations are
              things we can only learn from the first few relationships, and what we learn
              from you is what the product gets built around.
            </p>
          </div>
        </section>

        {/* ── Who it's for ─────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 px-6 lg:px-10 bg-halo-veil border-y border-halo-rule" aria-labelledby="who-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="who-heading" className="font-display text-halo-ink leading-tight text-[1.75rem] mb-4">
              Who it’s for
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-6">
              Students who are curious about something specific, willing to prepare, open to
              being told they’re wrong, and likely to do the thing they said they would.
              A first year with no internships and no idea how any of it works can be an
              excellent founding mentee. Someone who expects a mentor to do the work for
              them is not.
            </p>
            {/*
              Stated plainly, because the people most helped by mentorship are
              usually the ones who assume a page like this is not for them.
            */}
            <p className="text-[16px] text-halo-ink leading-relaxed max-w-xl font-medium">
              What we are not selecting on: your school, your GPA, or your internships. You
              don&apos;t need to already know how to find mentors, build a network, or
              navigate professional spaces. That&apos;s part of what we&apos;re building
              Mentable to help with.
            </p>
          </div>
        </section>

        {/* ── Expectations ─────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 px-6 lg:px-10" aria-labelledby="expect-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="expect-heading" className="font-display text-halo-ink leading-tight text-[1.75rem] mb-6">
              What joining does and doesn’t mean
            </h2>

            <div className="border-t border-halo-rule pt-6 mb-10">
              <p className={`${EYEBROW} text-halo-mist-body mb-3`}>It does not guarantee</p>
              <ul className="space-y-1.5">
                {NOT.map((n) => (
                  <li key={n} className="text-[16px] text-halo-ink leading-relaxed">{n}</li>
                ))}
              </ul>
              <p className="text-[15px] text-halo-heather leading-relaxed mt-4 max-w-xl">
                Mentable creates the structure for a relationship. The relationship is still
                something two people have to build, and the work is still yours.
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

        {/* ── Application ──────────────────────────────────────────────────── */}
        <section id="apply" className="py-16 sm:py-20 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule scroll-mt-6" aria-labelledby="apply-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="apply-heading" className="font-display text-halo-ink leading-tight mb-3" style={{ fontSize: 'clamp(1.75rem, 3.6vw, 2.25rem)' }}>
              Apply
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-3">
              Five short questions, plus your name and email. There are no right answers.
              We are trying to understand what you want and how you think about getting
              there.
            </p>
            <p className="text-[15px] text-halo-mist-body leading-relaxed max-w-xl mb-9">
              We read every application ourselves, so give us a few days to reply.
            </p>
            {/*
              The form used to live here, which meant two mentee applications
              existed: this one, and whatever "Apply" in the nav pointed at.
              There is now one application at /apply, and this page links into
              it with the role already chosen so nobody is asked twice.
            */}
            <a
              href="/apply?role=mentee"
              className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
            >
              Apply as a mentee
            </a>
          </div>
        </section>

        {/* ── The other side ───────────────────────────────────────────────── */}
        <section className="py-14 sm:py-16 px-6 lg:px-10" aria-labelledby="mentor-side-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="mentor-side-heading" className="font-display text-halo-ink leading-tight text-[1.5rem] mb-3">
              Not a student?
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-5">
              If you’re a few years further along and willing to help someone coming up
              behind you, that’s the other half of this.
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
