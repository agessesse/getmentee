import LogoRail, { type RailItem } from '@/components/marketing/LogoRail';

/**
 * Schools of the students on the platform. Sourced only from the
 * SOURCED_NEAR_PEERS roster in data/people.ts, deduplicated by domain (three
 * separate spellings of UNC all resolve to unc.edu).
 *
 * Excluded on logo quality:
 *   Columbia (columbia.edu)      favicon resolves to a blank single-colour image
 *   Minnesota (umn.edu)          favicon is 16px, unusable at 40px
 */
const MENTEE_SCHOOLS: RailItem[] = [
  { name: 'University of North Carolina at Chapel Hill', domain: 'unc.edu', label: 'UNC Chapel Hill' },
  { name: 'Duke University', domain: 'duke.edu', label: 'Duke' },
  { name: 'Georgetown University', domain: 'georgetown.edu', label: 'Georgetown' },
  { name: 'UC Berkeley', domain: 'berkeley.edu' },
  { name: 'University of New Hampshire', domain: 'unh.edu', label: 'New Hampshire' },
  { name: "Queen's University", domain: 'queensu.ca', label: "Queen's" },
];

export default function SchoolRail() {
  return (
    <LogoRail
      eyebrow="Our students study at"
      items={MENTEE_SCHOOLS}
      direction="left"
      ground="veil"
      srLabel="Schools attended by students on Mentable:"
    />
  );
}
