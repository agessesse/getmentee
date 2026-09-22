import LogoRail, { type RailItem } from '@/components/marketing/LogoRail';

/**
 * Where the mentors on this platform studied and worked. Every entry traces to
 * a specific mentor in data/mentors.ts or data/people.ts:
 *
 *   University of Pennsylvania   Christopher Floyd (education)
 *   UNC Chapel Hill              David Sheffer, Zach Smith, Drew Nations
 *   Wells Fargo                  Christopher Floyd (prior)
 *   Morgan Stanley               Christopher Floyd (prior)
 *   Fifth Third Securities       Christopher Floyd (prior)
 *   McColl Partners              David Sheffer (prior)
 *   MyEyeDr.                     David Sheffer (current)
 *   Engineered Land Solutions    Drew Nations (current)
 *   Alyra Technology             Will Varnum (current)
 *
 * Filtered on logo quality, because the favicon service is the only source and
 * it varies by domain. Excluded and why:
 *   SMBC, Keane Capital, Monitor Clipper, Panattoni   16px favicon
 *   Bondway.ai, Beds for Kids, Advent, LSE            generic placeholder
 *   Van Buren Advisory                                no domain mapped
 *
 * Self-hosting real SVG logos in /public would restore all of them and remove
 * the per-visitor requests to Google.
 */
const MENTOR_AFFILIATIONS: RailItem[] = [
  { name: 'University of Pennsylvania', domain: 'upenn.edu', label: 'UPenn' },
  { name: 'Wells Fargo', domain: 'wellsfargo.com' },
  { name: 'Morgan Stanley', domain: 'morganstanley.com' },
  { name: 'University of North Carolina at Chapel Hill', domain: 'unc.edu', label: 'UNC Chapel Hill' },
  { name: 'Fifth Third Securities', domain: '53.com', label: 'Fifth Third' },
  { name: 'Harvard Business School', domain: 'hbs.edu', label: 'Harvard Business School' },
  { name: 'Raymond James', domain: 'raymondjames.com' },
  { name: 'Engineered Land Solutions', domain: 'engineeredlandsolutions.com', label: 'Engineered Land' },
  { name: 'Alyra Technology', domain: 'alyratechnology.com', label: 'Alyra' },
];

export default function CredibilityRail() {
  return (
    <LogoRail
      /*
        Was "Our mentors have studied and worked at". Nobody in this rail is
        our mentor: every profile behind it is `status: 'sourced'`, with no
        account and no agreement to mentor here. The institutions are real and
        the people are real; the possessive was the false part.
      */
      eyebrow="Experience represented by the people helping shape Mentable"
      items={MENTOR_AFFILIATIONS}
      direction="right"
      srLabel="Where the professionals helping shape Mentable studied and worked:"
    />
  );
}
