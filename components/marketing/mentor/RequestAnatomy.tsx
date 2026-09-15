import { GraduationCap, Briefcase } from 'lucide-react';

/**
 * A mentorship request, exactly as the product delivers one to a mentor.
 *
 * Every field on this panel is fetched and rendered today in
 * app/(protected)/requests/page.tsx and components/requests/RequestCard.tsx:
 * the headline and university come from public_profiles, the bio and
 * experience level from mentee_profiles, and the goals and message from the
 * two written answers on mentorship_requests. The pair of buttons at the
 * bottom are the two actions a mentor has on a pending request.
 *
 * Numbered markers rather than a legend running down the side: the markers sit
 * on the panel where the field is, and the list beneath names each one in the
 * same order, so the panel reads correctly on a phone where a side legend
 * would have to be abandoned anyway.
 *
 * The student is Ethan Robinson, a demo identity from scripts/seed-demo.ts.
 * His headline, university, bio, experience level and goal are that record's
 * own values.
 */

const FIELDS = [
  'Their headline and school, from their profile.',
  'How far along they say they are.',
  'Their own description of what they are doing and where they want to get to.',
  'What they are trying to accomplish, written on the request.',
  'Why they picked you, in their words.',
];

function Marker({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-halo-purple text-white text-[10px] font-semibold tabular-nums flex-none"
    >
      {n}
    </span>
  );
}

export default function RequestAnatomy() {
  return (
    <div>
      <div className="bg-white rounded-xl border border-halo-rule shadow-sm overflow-hidden max-w-2xl">
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-halo-veil border-b border-halo-rule">
          <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.18em]">
            New request
          </p>
          <span className="text-[10px] font-medium text-halo-mist-body">Example</span>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-halo-ink leading-snug">Ethan Robinson</p>
            <p className="text-[11px] text-halo-mist-body mt-0.5">2 days ago</p>
          </div>

          {/* Identity, straight off their profile */}
          <div className="rounded-xl bg-halo-veil border border-halo-rule p-4 space-y-2">
            <p className="flex items-start gap-2.5 text-[13px] text-halo-heather leading-snug">
              <Marker n={1} />
              <Briefcase className="w-3.5 h-3.5 text-halo-mist-strong flex-none mt-0.5" aria-hidden="true" />
              CS Senior at Georgia Tech, Future PM
            </p>
            <p className="flex items-start gap-2.5 text-[13px] text-halo-heather leading-snug pl-[28px]">
              <GraduationCap className="w-3.5 h-3.5 text-halo-mist-strong flex-none mt-0.5" aria-hidden="true" />
              Georgia Tech
            </p>
            <p className="flex items-start gap-2.5 text-[12px] text-halo-mist-body leading-snug">
              <Marker n={2} />
              Intermediate level
            </p>
            <p className="flex items-start gap-2.5 text-[13px] text-halo-heather leading-relaxed">
              <Marker n={3} />
              <span>
                Computer science senior at GT with a minor in business. I have been a SWE
                intern at two startups and want to transition into product management at a
                top tech company after graduation.
              </span>
            </p>
          </div>

          {/* The two things they wrote for you */}
          <div className="flex items-start gap-2.5">
            <Marker n={4} />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-halo-heather mb-1.5">Their goals</p>
              <p className="text-[13px] text-halo-heather leading-relaxed bg-halo-lav-wash border border-halo-rule rounded-xl px-3.5 py-2.5">
                Break into product management, and build the skillset before I start applying.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Marker n={5} />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-halo-heather mb-1.5">Why you</p>
              <p className="text-[13px] text-halo-heather leading-relaxed border-l-2 border-halo-rule pl-3.5">
                You moved from engineering into product at a company that had to build the
                role as it went. That is the move I am trying to make, and I would rather
                hear how it actually went than read about it.
              </p>
            </div>
          </div>

          {/* The two decisions available */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <span className="text-[13px] font-semibold text-white bg-halo-purple rounded-xl px-4 py-2">
              Approve
            </span>
            <span className="text-[13px] font-semibold text-halo-heather border border-halo-rule rounded-xl px-4 py-2">
              Decline
            </span>
            <span className="text-[13px] font-medium text-halo-heather px-2 py-2">View profile</span>
          </div>
        </div>
      </div>

      <ol className="mt-7 max-w-2xl">
        {FIELDS.map((f, i) => (
          <li key={f} className="flex items-start gap-3 py-2.5 border-t border-halo-rule last:border-b last:border-halo-rule">
            <Marker n={i + 1} />
            <span className="text-[14px] text-halo-heather leading-relaxed">{f}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
