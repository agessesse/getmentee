'use client';

import { Shirt, Users, Plane, GraduationCap } from 'lucide-react';
import Rise from '@/components/marketing/Rise';
import CtaButton from '@/components/marketing/CtaButton';
import { trackLandingEvent } from '@/lib/landing-analytics';

/**
 * The Opportunity Fund. Parked, not deleted.
 *
 * WHY IT IS NOT ON THE HOMEPAGE. It introduces a second, different definition
 * of "under-resourced". Cohort 001 is about access to people: who you can ask,
 * what you get told early, which mistakes you avoid a year before they cost
 * you. This section is about money: suits, flights, certifications. Both are
 * real, but a homepage that argues the first and then immediately argues the
 * second asks a visitor to hold two theses at once, and it promises a
 * programme Mentable has not built. The section says so itself: the fund is
 * not funded yet.
 *
 * WHY IT IS STILL HERE. The four cost categories took a real conversation to
 * get right, and the copy is honest in a way that would be hard to rewrite
 * from memory. When there is money behind it, this renders again, either on
 * the homepage or as its own page. Nothing imports it today.
 */

const FUND_ITEMS = [
  { icon: Shirt, label: 'Professional Attire', detail: 'Interview suit, tailoring, footwear' },
  { icon: Users, label: 'Networking', detail: 'Coffee chats, industry events' },
  { icon: Plane, label: 'Travel', detail: 'Interviews, career fairs, office visits' },
  { icon: GraduationCap, label: 'Career Development', detail: 'Certifications, prep resources' },
];

export default function OpportunityFund() {
  return (
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
                  href="/apply?role=mentee"
                  onClick={() => trackLandingEvent('cohort_cta_clicked', { cta: 'fund' })}
                  size="md"
                  ground="deep"
                >
                  Apply as a mentee
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
  );
}
