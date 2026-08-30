// ─────────────────────────────────────────────────────────────────────────────
// MENTOR DATA — single source of truth for all mentor information on the site.
//
// HOW TO EDIT:
//   • Fill in each mentor's actual title, company, shortBio, whyIMentor,
//     and menteesMentored fields below.
//   • Drop headshot images into /public/mentors/ using the filename shown in
//     the `headshot` field. Supported: .jpg, .jpeg, .png, .webp
//   • If a headshot doesn't exist yet, the site shows a tasteful initials
//     fallback automatically — no code changes needed.
//   • To add a mentor, append an object matching the Mentor interface below.
//
// IMPORTANT: Do NOT publish fabricated content. All text fields below that
// read "Bio coming soon." or "—" must be replaced with verified, approved
// content before public launch.
// ─────────────────────────────────────────────────────────────────────────────

export interface Mentor {
  /** Full display name */
  name: string;
  /** Two-letter (or one-letter) initials for the fallback avatar */
  initials: string;
  /** Professional title, e.g. "Managing Director" */
  title: string;
  /** Employer or organization */
  company: string;
  /**
   * Path to the portrait photo relative to /public/.
   * Drop the file into /public/mentors/<filename> and reference it here as
   * "/mentors/<filename>". If the file doesn't exist the page falls back to
   * the initials avatar — it will NOT crash.
   */
  headshot: string;
  /** Hex color used for the initials fallback avatar background */
  accentColor: string;
  /** One or two sentences about the mentor's background. */
  shortBio: string;
  /** Their own words on why they mentor. Editorial treatment on the page. */
  whyIMentor: string;
  /** e.g. "23+" — set to null until you have a real number */
  menteesMentored: string | null;
}

// Replace every placeholder field with accurate, approved information.
export const FEATURED_MENTORS: Mentor[] = [
  {
    name: 'Christopher Floyd',
    initials: 'CF',
    title: '—',           // TODO: add verified title
    company: '—',         // TODO: add verified company
    headshot: '/mentors/christopher-floyd.jpg',
    accentColor: '#1a1f3a',
    shortBio: 'Bio coming soon.',
    whyIMentor: 'Mentoring story coming soon.',
    menteesMentored: null,
  },
  {
    name: 'Peter Keane',
    initials: 'PK',
    title: '—',
    company: '—',
    headshot: '/mentors/peter-keane.jpg',
    accentColor: '#2d3668',
    shortBio: 'Bio coming soon.',
    whyIMentor: 'Mentoring story coming soon.',
    menteesMentored: null,
  },
  {
    name: 'David Sheffer',
    initials: 'DS',
    title: '—',
    company: '—',
    headshot: '/mentors/david-sheffer.jpg',
    accentColor: '#3d4a8f',
    shortBio: 'Bio coming soon.',
    whyIMentor: 'Mentoring story coming soon.',
    menteesMentored: null,
  },
  {
    name: 'Melvin',
    initials: 'M',
    title: '—',
    company: '—',
    headshot: '/mentors/melvin.jpg',
    accentColor: '#5265b0',
    shortBio: 'Bio coming soon.',
    whyIMentor: 'Mentoring story coming soon.',
    menteesMentored: null,
  },
  {
    name: 'Talisha Ukoh',
    initials: 'TU',
    title: '—',
    company: '—',
    headshot: '/mentors/talisha-ukoh.jpg',
    accentColor: '#6b84c8',
    shortBio: 'Bio coming soon.',
    whyIMentor: 'Mentoring story coming soon.',
    menteesMentored: null,
  },
];
