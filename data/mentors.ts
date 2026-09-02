// ─────────────────────────────────────────────────────────────────────────────
// MENTOR DATA — single source of truth for the marketing mentor section.
//
// HOW TO EDIT:
//   • Fill in or update any field below.
//   • Headshots live in /public/people/ — use the path shown in `headshot`.
//   • Set whyLabel to 'In their words' ONLY after the mentor has personally
//     approved the whyIMentor text as their own statement.
//   • imagePosition: CSS object-position value for the portrait crop.
//     Format: '<x%> <y%>' e.g. '50% 15%' — x=horizontal, y=vertical offset.
//     Leave undefined to use the default '50% 20%'.
//
// IMPORTANT: All text fields must use verified information only.
// ─────────────────────────────────────────────────────────────────────────────

export interface Mentor {
  /** Full display name including credential if applicable */
  name: string;
  /** One or two initials for the fallback avatar */
  initials: string;
  /** Professional title — use '—' until verified */
  title: string;
  /** Employer or organisation — use '—' until verified */
  company: string;
  /** Path to portrait relative to /public/ */
  headshot: string;
  /** Hex colour used for initials fallback avatar background */
  accentColor: string;
  /** 1–2 sentences describing the mentor's background */
  shortBio: string;
  /**
   * Controls how whyIMentor is presented:
   *   'In their words'      — mentor has approved this as a direct quote.
   *   'Founder perspective' — editorial copy written by the founder.
   */
  whyLabel: 'In their words' | 'Founder perspective';
  /**
   * The mentor's motivation for mentoring.
   * CRITICAL: NOT a direct quotation unless whyLabel === 'In their words'.
   */
  whyIMentor: string;
  /** Verified mentee count — leave null until confirmed */
  menteesMentored: string | null;
  /**
   * CSS object-position for the portrait crop: '<x%> <y%>'.
   * Determined per-image to keep the face centered in the frame.
   * Defaults to '50% 20%' if omitted.
   */
  imagePosition?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Featured mentors — exactly six people who directly inspired Mentee.
// imagePosition values are set per-image based on actual photo inspection.
// ─────────────────────────────────────────────────────────────────────────────
export const FEATURED_MENTORS: Mentor[] = [
  {
    name: 'Christopher Floyd, CFA',
    initials: 'CF',
    title: 'Head of Institutional Sales',
    company: 'Bondway.ai',
    headshot: '/people/christopher-floyd.jpg',
    accentColor: '#1a1f3a',
    imagePosition: '50% 5%',
    shortBio:
      "CFA charterholder and fixed-income markets leader with roughly three decades of experience. Christopher leads institutional sales at Bondway.ai after a senior career at Wells Fargo — where he served as Managing Director and Co-Head of Investment Grade Sales & Trading — and earlier roles at Morgan Stanley, SMBC and Fifth Third Securities.",
    whyIMentor:
      'Mentorship is most powerful when it becomes a long-term investment in someone\'s trajectory.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Peter Keane',
    initials: 'PK',
    title: '—',
    company: '—',
    headshot: '/people/peter-keane.jpg',
    accentColor: '#2d3668',
    imagePosition: '50% 38%',
    shortBio:
      "Peter has supported Mentee's founder with candid guidance, encouragement, and advocacy during important academic and professional decisions.",
    whyIMentor:
      'Good mentorship goes beyond advice. It means being willing to advocate for someone when an opportunity can change their trajectory.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Travis Melvin',
    initials: 'TM',
    title: '—',
    company: 'UNC Kenan-Flagler Business School',
    headshot: '/people/travis-melvin.jpg',
    accentColor: '#3d4a8f',
    imagePosition: '50% 10%',
    shortBio:
      'Finance, real-estate and public-policy professional affiliated with UNC Kenan-Flagler. Travis founded the J.R.R. Scholarship Foundation, mentors through Wall Street Oasis, and guest-lectures at universities across the country.',
    whyIMentor:
      'Access to finance careers has historically depended on who you know. Mentorship is one of the most direct ways to change that.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'David Sheffer',
    initials: 'DS',
    title: 'Senior Advisor',
    company: 'MyEyeDr.',
    headshot: '/people/david-sheffer.jpg',
    accentColor: '#1a1f3a',
    imagePosition: '50% 0%',
    shortBio:
      'UNC Kenan-Flagler alumnus with a career spanning investment banking, private equity, M&A and growth strategy. David previously served as Chief Growth Officer at MyEyeDr. and remains engaged as a Senior Advisor.',
    whyIMentor:
      'The most useful thing an experienced person can do is give someone an honest view of how decisions actually play out — not how they look on paper.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Drew Nations',
    initials: 'DN',
    title: 'Founder & CEO',
    company: 'Engineered Land Solutions',
    headshot: '/people/drew-nations.jpg',
    accentColor: '#2d3668',
    imagePosition: '50% 0%',
    shortBio:
      'Founder and CEO of Engineered Land Solutions and UNC Kenan-Flagler alumnus. Drew built his company at the intersection of commercial real estate, land development and finance.',
    whyIMentor:
      'Entrepreneurship is hard to navigate without someone who has already made the early mistakes. That context is exactly what a mentor can provide.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Zach Smith',
    initials: 'ZS',
    title: 'Executive Director',
    company: 'Beds for Kids',
    headshot: '/people/zach-smith.jpg',
    accentColor: '#3d4a8f',
    imagePosition: '50% 0%',
    shortBio:
      'Executive Director of Beds for Kids and UNC alumnus. Zach grew from delivery driver to leading the organization over roughly nine years, building operational and leadership experience in the nonprofit sector.',
    whyIMentor:
      'A career defined by mission is its own kind of challenge. Mentorship can make mission-driven paths feel achievable instead of idealistic.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
];
