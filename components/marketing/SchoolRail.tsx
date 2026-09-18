import LogoRail, { type RailItem } from '@/components/marketing/LogoRail';

/**
 * Schools of the students on the platform. Sourced only from the
 * SOURCED_NEAR_PEERS roster in data/people.ts, deduplicated by domain (three
 * separate spellings of UNC all resolve to unc.edu).
 *
 * Excluded on logo quality:
 *   Minnesota (umn.edu)          favicon is 16px, unusable at 40px
 *
 * Columbia was on that list too. Its favicon now resolves to the crown at 48px,
 * so it is back in.
 */
const MENTEE_SCHOOLS: RailItem[] = [
  { name: 'University of North Carolina at Chapel Hill', domain: 'unc.edu', label: 'UNC Chapel Hill' },
  { name: 'Duke University', domain: 'duke.edu', label: 'Duke' },
  { name: 'Columbia University', domain: 'columbia.edu', label: 'Columbia' },
  { name: 'Georgetown University', domain: 'georgetown.edu', label: 'Georgetown' },
  { name: 'UC Berkeley', domain: 'berkeley.edu' },
  { name: 'University of New Hampshire', domain: 'unh.edu', label: 'New Hampshire' },
  // Was "Queen's University" on queensu.ca, which is the Canadian institution
  // in Kingston, Ontario. The student on the roster attends Queens University
  // of Charlotte: different school, different country, no apostrophe.
  { name: 'Queens University of Charlotte', domain: 'queens.edu', label: 'Queens' },
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
