// ─────────────────────────────────────────────────────────────────────────────
// MENTOR DATA — single source of truth for all mentor information on the site.
//
// HOW TO EDIT:
//   • Fill in or update any field below.
//   • Drop headshot images into /public/mentors/ using the filename shown in
//     the `headshot` field. Supported: .jpg, .jpeg, .png, .webp
//   • If a headshot doesn't exist yet, the site shows a tasteful initials
//     fallback automatically — no code changes needed.
//   • Set whyLabel to 'In their words' ONLY after the mentor has personally
//     approved the whyIMentor text as their own statement.
//   • To add a mentor, append an object matching the Mentor interface.
//
// IMPORTANT: All text fields marked with TODO or "coming soon" must be replaced
// with verified, mentor-approved content before public launch.
// ─────────────────────────────────────────────────────────────────────────────

export interface Mentor {
  /** Full display name */
  name: string;
  /** One or two initials for the fallback avatar */
  initials: string;
  /** Professional title — use '—' until verified */
  title: string;
  /** Employer or organisation — use '—' until verified */
  company: string;
  /**
   * Path to the portrait photo relative to /public/.
   * Drop the file at /public/mentors/<filename>.
   * If missing, the page renders an initials avatar — no code change needed.
   */
  headshot: string;
  /** Hex colour used for the initials fallback avatar background */
  accentColor: string;
  /** 1–2 sentences describing the mentor's background */
  shortBio: string;
  /**
   * The mentor's motivation for mentoring.
   * CRITICAL: this text must NOT be presented as a direct quotation unless
   * the mentor has personally read and approved it as their own words.
   * Use whyLabel to control how it is displayed.
   */
  whyIMentor: string;
  /**
   * Controls how whyIMentor is presented on the page:
   *   'In their words'     — mentor has approved this as a direct quote.
   *   'Founder perspective' — editorial copy written by the founder; displayed
   *                           as a perspective, never as a mentor quotation.
   */
  whyLabel: 'In their words' | 'Founder perspective';
  /** e.g. "12+" — leave null until you have a verified number */
  menteesMentored: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Featured mentors — the five people whose relationships directly inspired
// the creation of Mentee. Edit each entry as information is confirmed.
// ─────────────────────────────────────────────────────────────────────────────
export const FEATURED_MENTORS: Mentor[] = [
  {
    name: 'Christopher Floyd',
    initials: 'CF',
    // TODO: Confirm title and company with Christopher before publishing.
    title: '—',
    company: '—',
    headshot: '/people/christopher-floyd.jpg',
    accentColor: '#1a1f3a',
    // Founder-written editorial bio — requires Christopher's approval before launch.
    shortBio:
      'Christopher has been a mentor to Mentee\'s founder since the summer after high school, providing years of perspective, encouragement, and professional guidance.',
    // Founder-written perspective — NOT a direct quotation from Christopher.
    whyIMentor:
      'Mentorship is most powerful when it becomes a long-term investment in someone\'s trajectory.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Peter Keane',
    initials: 'PK',
    // TODO: Confirm title and company with Peter before publishing.
    title: '—',
    company: '—',
    headshot: '/people/peter-keane.jpg',
    accentColor: '#2d3668',
    // Founder-written editorial bio — requires Peter's approval before launch.
    shortBio:
      'Peter has supported Mentee\'s founder with candid guidance, encouragement, and advocacy during important academic and professional decisions.',
    // Founder-written perspective — NOT a direct quotation from Peter.
    whyIMentor:
      'Good mentorship goes beyond advice. It means being willing to advocate for someone when an opportunity can change their trajectory.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'David Sheffer',
    initials: 'DS',
    // TODO: Confirm all fields with David before publishing.
    title: '—',
    company: '—',
    headshot: '/people/david-sheffer.jpg',
    accentColor: '#3d4a8f',
    shortBio:
      'David has been part of the network of mentors and professionals who have helped shape the founder\'s academic and professional development.',
    // TODO: Replace with David's own words or a founder perspective once confirmed.
    whyIMentor: 'Mentoring story coming soon.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Melvin',
    initials: 'M',
    // TODO: Confirm full name, title, and company before publishing.
    title: '—',
    company: '—',
    headshot: '/mentors/melvin.jpg',
    accentColor: '#5265b0',
    // TODO: Replace with verified bio once confirmed.
    shortBio: 'Mentor profile coming soon.',
    // TODO: Replace with Melvin's own words or a founder perspective once confirmed.
    whyIMentor: 'Mentoring story coming soon.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Talisha Ukoh',
    initials: 'TU',
    // Title kept conservative — do not upgrade without confirmation.
    title: 'Career Prep Coach',
    company: 'MLT / Management Leadership for Tomorrow',
    headshot: '/mentors/talisha-ukoh.jpg',
    accentColor: '#5265b0',
    // Founder-written editorial bio — requires Talisha's approval before launch.
    shortBio:
      'Talisha has supported Mentee\'s founder through MLT Career Prep, providing structured coaching and professional-development guidance.',
    // Founder-written perspective — NOT a direct quotation from Talisha.
    whyIMentor:
      'Mentorship helps people turn potential into deliberate action through accountability, perspective, and access.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
];
