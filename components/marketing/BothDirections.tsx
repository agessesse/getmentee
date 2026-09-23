'use client';

import Rise from '@/components/marketing/Rise';

/**
 * The third beat of the mentorship sequence: what each person gets out of it.
 *
 * WHAT THIS REPLACED. A four-card grid headed "What comes out of it", listing
 * Clarity, Preparation, Accountability and Reciprocity. Two of those words —
 * clarity and preparation — were already the labels on the trajectory chart
 * two sections earlier, and reciprocity was the Return stage of the cycle
 * restated as a noun. So the page's closing argument was mostly its own
 * summary, and it pooled both people's experience into one undifferentiated
 * list, which quietly implied the mentor and the student get the same thing.
 *
 * WHAT IT DOES NOW. It pairs them. Each row holds one thing the person
 * learning gains beside one thing the person mentoring gains, across a single
 * spine: the same relationship, read from both ends. The two are related but
 * never identical, which is the honest version — a student gains clarity, a
 * mentor gains perspective, and those are different rewards.
 *
 * It closes the sequence by naming the chain the previous two sections have
 * been building: experience becomes guidance, guidance becomes growth, and
 * growth eventually becomes experience worth sharing.
 *
 * No cards, no icons, no counts. The layout is two columns facing each other
 * because that is the argument.
 */

const PAIRS = [
  {
    learner: { label: 'Clarity', body: 'Understand paths you haven’t walked yet.' },
    mentor:  { label: 'Perspective', body: 'See your own experience through someone else’s questions.' },
  },
  {
    learner: { label: 'Confidence', body: 'Walk into the moments that matter better prepared.' },
    // "Turn what you learned the hard way into something useful" and
    // Continuity's "watch what you taught keep going" were one idea wearing two
    // labels. Purpose is now about the lesson being spent again, in the
    // present, on one person; Continuity is about it outlasting you. Different
    // axes: value and time.
    mentor:  { label: 'Purpose', body: 'The lessons that cost you the most get used again.' },
  },
  {
    learner: { label: 'Opportunity', body: 'Know what to pursue, and how to get ready for it.' },
    mentor:  { label: 'Connection', body: 'Know someone coming up behind you.' },
  },
  {
    learner: { label: 'Responsibility', body: 'Carry what you were given forward.' },
    // "Legacy" read as a word for the end of a career. Mentable's mentors are
    // 22 as often as they are 70, and a 24-year-old helping a freshman is not
    // thinking about their legacy. Continuity says the same thing — the thing
    // you taught keeps going — at any age.
    // "Watch" also promised a view the product does not have. Mentable cannot
    // show a mentor what happened after their part ended, and should not write
    // copy that implies it will.
    mentor:  { label: 'Continuity', body: 'What you taught outlasts your part in it.' },
  },
];

const CHAIN = ['Mentor', 'Mentee', 'Future mentor', 'Next mentee'];

const EYEBROW = 'font-ui text-[11px] font-semibold uppercase tracking-[0.14em]';

export default function BothDirections() {
  return (
    <section
      className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule"
      aria-labelledby="both-directions-heading"
    >
      <div className="max-w-4xl mx-auto">
        {/* Names the tie to section 07. That section says impact keeps moving
            outward; this one says what it leaves behind on each side. Same
            argument, second half. */}
        <Rise kind="heading" as="p" className={`${EYEBROW} text-halo-purple-d mb-5`}>
          The two returns
        </Rise>

        <Rise kind="heading" delay={0.04} as="h2">
          <span
            id="both-directions-heading"
            className="block font-display text-halo-ink leading-[1.05] mb-4 max-w-xl"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            The impact moves<br />in both directions.
          </span>
        </Rise>

        <Rise kind="heading" delay={0.08} as="p" className="text-halo-mist-body font-light text-[15px] leading-relaxed mb-12 max-w-md">
          What travels outward starts between two people, and it doesn&apos;t leave
          them the same thing. Not every time, but this is what it can be.
        </Rise>

        {/* On a phone the two columns become one, so the pairing has to be
            said once in words. One sentence beats repeating a label on all
            eight items. */}
        <p className="lg:hidden text-halo-mist-body text-[13px] leading-relaxed mb-6">
          Each pair below: what the student gains, then what the mentor gains.
        </p>

        {/* Column headings. Desktop only: on a phone each pair carries its own
            label, which is clearer than a heading scrolled far above. */}
        <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-end mb-5">
          <p className={`${EYEBROW} text-halo-purple-d text-right`}>For the person learning</p>
          <span className="w-16" aria-hidden="true" />
          <p className={`${EYEBROW} text-halo-mist-body`}>For the person mentoring</p>
        </div>

        <ul>
          {PAIRS.map((pair, i) => (
            <Rise
              key={pair.learner.label}
              kind="heading"
              delay={i * 0.09}
              as="li"
              className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] border-t border-halo-rule py-6 lg:py-7"
            >
              {/* Learning */}
              <div className="lg:text-right">
                <h3 className="font-display text-halo-ink text-[24px] leading-none mb-2">
                  {pair.learner.label}
                </h3>
                <p className="text-halo-heather text-[15px] leading-relaxed lg:ml-auto lg:max-w-[16rem]">
                  {pair.learner.body}
                </p>
              </div>

              {/*
                The spine. Each row draws its own full-height line, so together
                they read as one continuous thread down the middle with a mark
                where each pair meets it.
              */}
              <div className="hidden lg:flex w-16 justify-center relative" aria-hidden="true">
                <span className="w-px h-full bg-halo-rule" />
                <span className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-halo-lavender" />
              </div>

              {/* Mentoring */}
              <div className="mt-4 pl-4 border-l-2 border-halo-lavender lg:mt-0 lg:pl-0 lg:border-l-0">
                <p className={`${EYEBROW} text-halo-mist-body mb-1.5 lg:hidden`}>For the mentor</p>
                <h3 className="font-display text-halo-ink text-[24px] leading-none mb-2">
                  {pair.mentor.label}
                </h3>
                <p className="text-halo-heather text-[15px] leading-relaxed lg:max-w-[16rem]">
                  {pair.mentor.body}
                </p>
              </div>
            </Rise>
          ))}
        </ul>

        {/*
          The sequence lands here. Three sections have argued that one person
          can change what is reachable for another, that the second person's
          growth reaches people the first will never meet, and that the second
          person ends up holding something worth giving away. This is that,
          said once, and it is also the brand thesis read in order: find
          someone worth learning from, become someone worth learning from.
        */}
        <Rise kind="heading" delay={0.1} className="border-t border-halo-rule pt-10 mt-4">
          <p
            className="font-display text-halo-ink leading-[1.18] max-w-2xl"
            style={{ fontSize: 'clamp(1.375rem, 2.6vw, 1.875rem)' }}
          >
            Experience becomes guidance.<br />
            Guidance becomes growth.<br />
            Growth becomes experience worth sharing.
          </p>

          <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-7">
            {CHAIN.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className={`${EYEBROW} ${i === 0 ? 'text-halo-purple-d' : 'text-halo-mist-body'}`}>
                  {step}
                </span>
                {i < CHAIN.length - 1 && (
                  <span className="text-halo-mist-strong text-[13px]" aria-hidden="true">→</span>
                )}
              </li>
            ))}
            <li aria-hidden="true" className="text-halo-mist-strong text-[13px]">→</li>
            <li className={`${EYEBROW} text-halo-mist-strong`}>and on</li>
          </ol>
        </Rise>
      </div>
    </section>
  );
}
