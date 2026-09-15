import Image from 'next/image';
import { Sparkles } from 'lucide-react';

/**
 * One mentor, shown the way Discover shows one.
 *
 * The point of this section is the middle block, not the portrait: Discover
 * scores every mentor against the profile you filled in and attaches the
 * reasons it scored them, so a student never has to guess why a name appeared.
 * The four reason shapes the product can produce are "Works in <industry>",
 * "Specializes in <interest>", "<university> alum" and "Covers <tag>". The
 * three below are those shapes filled from Christopher Floyd's verified record
 * in data/mentors.ts: his areas, and the university in his education history.
 *
 * Deliberately one card. A wall of profiles would make the same claim a
 * directory makes, which is the claim this page exists to distinguish itself
 * from.
 *
 * Nothing here is interactive. A card with a dead "Request mentorship" button
 * on it would be a worse lie than no button, and the section's real call to
 * action sits beside it in the page.
 */

const REASONS = [
  'Specializes in Fixed Income',
  'Covers Capital Markets',
  'University of Pennsylvania alum',
];

const AREAS = ['Fixed Income', 'Capital Markets', 'Career Development'];

export default function MatchExample() {
  return (
    <figure className="m-0">
      <div className="bg-white rounded-xl border border-halo-rule shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-none bg-halo-bone">
              <Image
                src="/people/christopher-floyd.jpg"
                alt=""
                fill
                className="object-cover"
                style={{ objectPosition: '50% 5%' }}
                sizes="64px"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[16px] font-semibold text-halo-ink leading-snug">
                Christopher Floyd, CFA
              </p>
              <p className="text-[13px] text-halo-mist-body font-light leading-snug mt-0.5">
                Head of Institutional Sales &middot; Bondway.ai
              </p>
              <p className="text-[12px] text-halo-heather leading-relaxed mt-2 max-w-sm">
                Roughly three decades in fixed income, including Managing Director and
                Co-Head of Investment Grade Sales &amp; Trading at Wells Fargo.
              </p>
            </div>
          </div>
        </div>

        {/* The part a directory does not have */}
        <div className="px-5 sm:px-6 py-5 bg-halo-lav-wash border-y border-halo-rule">
          <p className="flex items-center gap-2 font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.18em] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-halo-mist-strong" aria-hidden="true" />
            Why you are seeing this mentor
          </p>
          <ul className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <li
                key={r}
                className="text-[12px] font-medium text-halo-heather bg-white border border-halo-rule rounded-full px-3 py-1"
              >
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-5 sm:px-6 py-5">
          <p className="font-ui text-[10px] font-semibold text-halo-purple-d uppercase tracking-[0.18em] mb-2.5">
            Can help with
          </p>
          <ul className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <li
                key={a}
                className="text-[12px] font-medium text-halo-heather bg-halo-veil rounded-full px-3 py-1"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <figcaption className="text-[12px] text-halo-mist-body mt-3 leading-relaxed">
        An example match. Christopher is a real mentor on Mentable. The reasons attached to
        him are generated from your own profile, so yours will say something different.
      </figcaption>
    </figure>
  );
}
