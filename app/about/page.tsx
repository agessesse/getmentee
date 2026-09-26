import type { Metadata } from 'next';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';
import SectionIntro from '@/components/marketing/SectionIntro';
import CtaButton from '@/components/marketing/CtaButton';
import { BRAND_DEFINITION, BRAND_PRONUNCIATION } from '@/components/ui/Wordmark';

export const metadata: Metadata = {
  title: 'About Mentable: why it exists',
  description:
    'Mentorship can change what a person understands is possible, and access to it is mostly accidental. Mentable is an attempt to make it less so.',
};

/*
 * About.
 *
 * WHAT THIS PAGE OWNS THAT THE OTHERS DO NOT. The home page names luck in a
 * single line and moves on. The mentee page is about turning access into a
 * relationship; the mentor page is about making a professional's hour useful.
 * None of them ever explain why the company exists, unpack what luck actually
 * consists of, state the limits of the claim, say what the name means, or
 * admit what stage this is at. That is the whole brief for this page.
 *
 * WHY IT LOOKS DIFFERENT. There is no product panel, no interface mock and no
 * photograph on this page. The other three pages argue by showing the product;
 * this one argues in prose, so the composition is type, rules and whitespace.
 * The one visual moment is the definition on the deep band, which is the thing
 * a reader should remember.
 *
 * WHY THERE ARE NO COMPONENTS. Every section here is a heading and paragraphs.
 * Extracting them would be componentising prose to shorten a file, which buys
 * nothing and makes the argument harder to read as one document.
 *
 * ON THE FOUNDER SECTION. An approved public photograph of Abel exists at
 * /people/abel-gessesse.jpg and is already served on his public profile, so it
 * could be used here. It is deliberately not: a headshot would tip this page
 * toward being about him, and the note is stronger as plain text. His public
 * record in data/people.ts also carries employers, scholarships and fellowship
 * names. All of it is omitted. None of it makes the argument better, and all of
 * it would turn a founder note into a resume.
 *
 * No client JavaScript, matching the mentee and mentor pages.
 */
export default function AboutPage() {
  return (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col overflow-x-clip">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ── 01. The belief ─────────────────────────────────────────────── */}
        {/* No buttons in this hero. Every other page on the site asks for
            something above the fold; this one is trying to be read, and the
            asks are all waiting at the bottom. */}
        <section className="py-20 sm:py-24 lg:py-28 px-6 lg:px-10" aria-labelledby="about-heading">
          <div className="max-w-6xl mx-auto">
            <p className="font-ui text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.14em] mb-6">
              Why Mentable exists
            </p>

            <h1
              id="about-heading"
              className="font-display text-halo-ink leading-[1.06] tracking-tight mb-8 max-w-4xl"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3.1rem)' }}
            >
              The conversation that changes<br className="hidden lg:block" /> your direction is usually an accident.
            </h1>

            <p className="text-lg sm:text-xl text-halo-mist-body font-light leading-relaxed max-w-xl">
              Somebody answers an email. A professor makes an introduction. A manager
              takes an interest. Half an hour later a person understands something about
              their own field that no amount of reading was going to give them, and
              almost none of it was arranged.
            </p>
          </div>
        </section>

        {/* ── 02. What luck actually is ──────────────────────────────────── */}
        <section
          className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule"
          aria-labelledby="luck-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.1fr] gap-10 lg:gap-16 items-start">
              <div className="lg:sticky lg:top-24">
              <SectionIntro
                eyebrow="The problem"
                heading={<>What luck<br className="hidden sm:block" /> actually looks like.</>}
                id="luck-heading"
                className="max-w-md"
              />
              </div>

              <div className="max-w-xl">
                <ul>
                  {LUCK.map((l) => (
                    <li
                      key={l}
                      className="py-3.5 border-t border-halo-rule last:border-b last:border-halo-rule text-halo-ink text-[16px] leading-snug"
                    >
                      {l}
                    </li>
                  ))}
                </ul>

                <p className="text-halo-heather text-[16px] leading-relaxed mt-8">
                  Every one of those is a good thing happening. Someone is being generous
                  with their time, and it works. The trouble is that not one of them can be
                  arranged, repeated or asked for, so who gets that half hour comes down
                  largely to where a person was standing.
                </p>

                <p className="text-halo-heather text-[16px] leading-relaxed mt-5">
                  We are not claiming to fix that, and we are not proposing a replacement
                  for the way these relationships already form. The narrower thing worth
                  building is another route: a way for people who are willing to teach and
                  people who are ready to learn to find each other on purpose, and to keep
                  going after the first conversation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 03. Founder note ───────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="founder-heading">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <h2
                id="founder-heading"
                className="font-ui text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.14em] mb-8"
              >
                A note from the founders
              </h2>

              <div className="pl-5 sm:pl-7 border-l-2 border-halo-purple/40">
                <p className="text-halo-ink text-[18px] sm:text-[19px] font-light leading-relaxed mb-5">
                  When I started college I did not know how any of the paths I was
                  interested in actually worked. What changed that was a small number of
                  people who were willing to explain it. What the work involved on an
                  ordinary day. Which decisions mattered and which ones I was overthinking.
                  What I was getting wrong.
                </p>

                <p className="text-halo-heather text-[17px] leading-relaxed mb-5">
                  None of it was arranged. I met those people through some asking, some
                  timing, and a lot of other people being generous for no particular
                  reason. It worked out, and that is the part that stayed with me. The
                  conversations that made the difference were not scarce. They were just
                  unevenly distributed, and I happened to end up on the right side of that.
                </p>

                <p className="text-halo-heather text-[17px] leading-relaxed mb-5">
                  So the question was not whether mentorship works. It plainly does. The
                  question was why something that consequential is left almost entirely to
                  chance, and whether any of it could be made deliberate without ruining
                  what makes it work.
                </p>

                <p className="text-halo-heather text-[17px] leading-relaxed">
                  I do not have that fully answered. Mentable is the attempt.
                </p>
              </div>

              {/*
                Two names, because there are two of us building it. The note
                above is written in one voice and stays that way — a jointly
                authored paragraph would read as a press release — but the page
                should not leave a visitor thinking Mentable has one founder.
              */}
              <div className="mt-8 pl-5 sm:pl-7 flex flex-wrap gap-x-10 gap-y-4">
                <div>
                  <p className="text-[15px] font-semibold text-halo-ink">Abel Gessesse</p>
                  <p className="text-[14px] text-halo-mist-body font-light mt-0.5">
                    Co-founder &middot; UNC-Chapel Hill &rsquo;28
                  </p>
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-halo-ink">Pablo Ortega Navarro</p>
                  <p className="text-[14px] text-halo-mist-body font-light mt-0.5">
                    Co-founder
                  </p>
                </div>
              </div>

              <p className="mt-6 pl-5 sm:pl-7 text-[15px] text-halo-heather leading-relaxed max-w-xl">
                We&apos;re building Mentable now, in the open, and we&apos;re at the stage
                where the first few relationships will decide what it becomes.{' '}
                <a href="/apply?role=mentee" className="text-halo-purple-d font-medium hover:text-halo-ink">
                  The founding cohort
                </a>{' '}
                is how you get in early.
              </p>
            </div>
          </div>
        </section>

        {/* ── 04. The name ───────────────────────────────────────────────── */}
        {/* The deep band, used once, on the thing worth remembering. The home
            page introduces this word and the other two pages use it as a
            one-line filter. This is the only place that says what it is not. */}
        <section className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-deep" aria-labelledby="name-heading">
          <div className="max-w-6xl mx-auto">
            <p className="font-ui text-[11px] font-semibold text-halo-lavender uppercase tracking-[0.14em] mb-8">
              The name
            </p>

            <h2 id="name-heading" className="sr-only">
              What Mentable means
            </h2>

            {/* The definition, given the room it does not get anywhere else */}
            <div className="border-b border-halo-deep-rule pb-10 mb-10">
              <p
                className="font-display text-white leading-none"
                style={{ fontSize: 'clamp(2.6rem, 8vw, 5.5rem)' }}
              >
                mentable
              </p>
              <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-4">
                <span className="text-halo-lavender text-[16px] sm:text-[18px] font-light">
                  {BRAND_PRONUNCIATION}
                </span>
                <span className="text-halo-lavender text-[16px] sm:text-[18px] italic font-light">
                  adjective
                </span>
              </p>
              <p className="text-white text-[20px] sm:text-[24px] font-light mt-5">
                {BRAND_DEFINITION}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
              <div>
                <p className="text-halo-lavender text-[16px] leading-relaxed font-light mb-5">
                  A mentorship needs two people to show up for it. One of them has to be
                  willing to teach. The other has to be ready to learn, which is a real
                  thing that a person can be more or less of, and which nobody usually
                  names.
                </p>
                <p className="text-halo-lavender text-[16px] leading-relaxed font-light">
                  Being mentable means arriving with a question rather than an opening in
                  your calendar. Listening to the answer instead of waiting to explain why
                  you already considered it. Doing something with it. Coming back having
                  moved, including when what you found was that the advice did not fit.
                </p>
              </div>

              <div className="lg:border-l lg:border-halo-deep-rule lg:pl-10">
                <p className="font-ui text-[11px] font-semibold text-halo-lavender uppercase tracking-[0.14em] mb-5">
                  What it does not mean
                </p>
                <p className="text-white text-[16px] leading-relaxed mb-5">
                  It does not mean junior, deferential, or short of opinions. A student who
                  does everything they are told is not mentable. They are just quiet.
                </p>
                <p className="text-halo-lavender text-[16px] leading-relaxed font-light">
                  The point of good advice is that the person receiving it ends up with
                  better judgment, not a longer list of instructions. Someone who never
                  pushes back has not been taught anything. They have been directed, and
                  they will need directing again next time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05. Beliefs ────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="beliefs-heading">
          <div className="max-w-6xl mx-auto">
            <SectionIntro
              eyebrow="What we think"
              heading="Four things we are fairly sure about."
              id="beliefs-heading"
              className="max-w-2xl mb-14"
            />

            <ol className="max-w-4xl">
              {BELIEFS.map((b, i) => (
                <li
                  key={b.claim}
                  className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-x-8 gap-y-3 py-8 border-t border-halo-rule last:border-b last:border-halo-rule"
                >
                  <span className="text-[12px] font-semibold tabular-nums text-halo-purple-d sm:pt-2.5">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-display text-halo-ink text-[24px] sm:text-[28px] leading-snug mb-3 max-w-xl">
                      {b.claim}
                    </h3>
                    <p className="text-halo-heather text-[16px] leading-relaxed max-w-xl">
                      {b.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── 06. Stage ──────────────────────────────────────────────────── */}
        {/* There is no disclaimer anywhere else on the site, so this is the
            first and only one. Written as plain information rather than as a
            legal notice, and placed before the closing ask rather than in a
            footnote, because a reader who finds out later has been handled. */}
        <section
          className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule"
          aria-labelledby="stage-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <SectionIntro
                eyebrow="Where this is"
                heading="Early, and saying so."
                id="stage-heading"
                className="mb-8"
              />

              <p className="text-halo-heather text-[17px] leading-relaxed mb-5 max-w-xl">
                Mentable is early. The product is live and it is still being built, and
                those two things are true at the same time. We would rather tell you which
                parts are which than let you work it out.
              </p>

              <p className="text-halo-heather text-[17px] leading-relaxed mb-5 max-w-xl">
                The mentors named across this site are real people, and their backgrounds
                come from verified information. The product views you see on the mentee and
                mentor pages are composed rather than captured: they are built from fields
                the software genuinely has, using demo accounts rather than anyone&rsquo;s
                real mentorship, and each one is marked as an example where it appears.
              </p>

              <p className="text-halo-heather text-[17px] leading-relaxed max-w-xl">
                There are no usage numbers on this site because there are none worth
                quoting yet. When there are, they will be real ones.
              </p>
            </div>
          </div>
        </section>

        {/* ── 07. Close ──────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 px-6 lg:px-10" aria-labelledby="close-heading">
          <div className="max-w-6xl mx-auto">
            <h2
              id="close-heading"
              className="font-display text-halo-ink leading-[1.05] mb-7 max-w-2xl"
              style={{ fontSize: 'clamp(2rem, 4.6vw, 3.2rem)' }}
            >
              Less of it left to chance.
            </h2>

            <p className="text-halo-mist-body text-[17px] font-light leading-relaxed max-w-lg mb-9">
              Mentable is being built so that finding someone willing to teach, and
              becoming someone worth teaching, depends a little less on who happened to be
              standing nearby.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
              <CtaButton href="/apply?role=mentee">Apply as a mentee</CtaButton>
              <CtaButton href="/apply?role=mentor" variant="secondary">
                Apply as a mentor
              </CtaButton>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/*
 * The ways mentorship actually starts today. Written as good things, because
 * they are: the argument of this section is not that any of these is a failure,
 * it is that none of them can be requested. A list that sounded like complaints
 * would be making a claim about universities, alumni networks and cold email
 * that this company does not believe and cannot support.
 */
const LUCK = [
  'A professor notices your work and makes an introduction.',
  'Someone in your family already knows the person you need to meet.',
  'An alum answers, out of the thirty you wrote to.',
  'A manager decides to take an interest in you specifically.',
  'You are in the right room, at an event you nearly skipped.',
];

/*
 * Beliefs, chosen for what they rule out rather than what they promise. Each
 * one is a limit on the claim: the mentor does not do the work, the goal is to
 * stop being needed, the software is not the relationship, and the company is
 * not bigger than it is. A page of aspirations would be easier to write and
 * worth less to anyone deciding whether to trust this.
 */
const BELIEFS = [
  {
    claim: 'A mentor shortens the curve. The student still walks it.',
    body: 'Mentorship is not a substitute for ability, preparation or persistence, and anybody selling it that way is selling something else. What a good mentor can do is cut the time it takes to learn what actually matters, which is worth a great deal and is not the same as doing it for you.',
  },
  {
    claim: 'Advice should end in judgment, not dependence.',
    body: 'The measure of a mentorship is whether the student eventually works things out without asking. A relationship that produces someone who needs to check before every decision has gone wrong, however pleasant it was.',
  },
  {
    claim: 'The structure is not the relationship.',
    body: 'Mentable keeps track of what was agreed, what is outstanding and where a conversation left off. It cannot make either person good at this, and it should never take up more of the relationship than the relationship does.',
  },
  {
    claim: 'Better to be small and say so.',
    body: 'It is easy to make an early company look established, and it costs nothing until someone checks. We would rather describe this accurately now and be believed later.',
  },
];
