import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Rise from '@/components/marketing/Rise';

/**
 * Cohort 001.
 *
 * WHY THIS SECTION EXISTS. The homepage explained what Mentable believes and
 * what the product does, but never what is actually happening right now. A
 * visitor could read the whole page and not learn that there is a first
 * cohort, that it is ten people, or that applications are open.
 *
 * WHY IT LOOKS LIKE THIS. Nothing new was invented for it: eyebrow, display
 * headline, standfirst, veil ground, the existing button pair, Rise on the
 * same curve as every other section. It reads as the page it is already part
 * of. The three facts are set as a small definition row rather than cards,
 * because three cards would be the generic move and these are three numbers,
 * not three features.
 *
 * WHAT IT REFUSES TO DO. No countdown, no seats-remaining, no application
 * count, no "limited spots". The cohort is ten because ten mentors is what
 * exists and ten relationships is what two people can pay attention to, and
 * that is said in those words. Scarcity that reflects capacity is a fact;
 * scarcity invented to move people is a trick, and this section would rather
 * be believed in March than clicked today.
 *
 * Server component: it holds no state and no interaction, so it costs the
 * bundle nothing.
 */

const FACTS = [
  { k: 'Ten', v: 'UNC-Chapel Hill sophomores' },
  { k: 'Ten', v: 'people who have already done it' },
  { k: 'One', v: 'semester' },
];

export default function CohortOne() {
  return (
    <section
      className="py-20 sm:py-24 px-6 lg:px-10 bg-halo-veil border-t border-halo-rule"
      aria-labelledby="cohort-one-heading"
    >
      <div className="max-w-4xl mx-auto">
        <Rise kind="heading" as="p" className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-5">
          Cohort 001 · Finance
        </Rise>

        <Rise kind="heading" delay={0.04} as="h2">
          <span
            id="cohort-one-heading"
            className="block font-display text-halo-ink leading-[1.05] mb-5 max-w-xl"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            We&apos;re starting with ten.
          </span>
        </Rise>

        <Rise kind="heading" delay={0.08} as="p" className="text-halo-heather text-[17px] leading-relaxed max-w-xl mb-8">
          Ten UNC-Chapel Hill sophomores heading into finance recruiting, paired with ten
          people who have already done it. One semester.
        </Rise>

        {/* The three facts, as a rule-separated row. Numbers, not features. */}
        <Rise kind="heading" delay={0.12}>
          <dl className="grid grid-cols-1 sm:grid-cols-3 border-t border-halo-rule mb-9">
            {FACTS.map((f) => (
              <div key={f.v} className="border-b sm:border-b-0 border-halo-rule py-4 sm:pr-6">
                <dt className="font-display text-halo-ink text-[28px] leading-none mb-1.5">{f.k}</dt>
                <dd className="text-halo-mist-body text-[14.5px] leading-snug">{f.v}</dd>
              </div>
            ))}
          </dl>
        </Rise>

        <Rise kind="heading" delay={0.16} as="p" className="text-halo-heather text-[16px] leading-relaxed max-w-xl mb-5">
          Finance is where we start, not what Mentable is. Recruiting begins early and the
          timeline is unforgiving, which makes sophomore year one of the moments when
          access to the right person matters most.
        </Rise>

        <Rise kind="heading" delay={0.2} as="p" className="text-halo-ink text-[16px] font-medium leading-relaxed max-w-xl mb-9">
          We&apos;re not trying to sign up thousands of people. We&apos;re trying to get ten
          relationships right.
        </Rise>

        <Rise kind="heading" delay={0.24}>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <Link
              href="/apply?role=mentee&cohort=cohort-001"
              className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
            >
              Apply to Cohort 001
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/mentor"
              className="inline-flex items-center gap-2 border border-halo-rule bg-white text-halo-ink text-[15px] font-medium px-5 py-3 rounded-xl hover:border-halo-purple transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
            >
              Become a mentor
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {/* The detail page. Tertiary on purpose: the two decisions above are
              the point, and this is for the reader who wants to know why
              sophomore year and why finance before committing to either. */}
          <p className="text-[14.5px] text-halo-mist-body leading-relaxed mt-5">
            <Link
              href="/cohort-001"
              className="text-halo-purple-d font-medium hover:text-halo-ink underline underline-offset-2"
            >
              What the semester involves
            </Link>
            {' '}· why sophomore year, why finance, and what Mentable doesn&apos;t promise.
          </p>
        </Rise>
      </div>
    </section>
  );
}
