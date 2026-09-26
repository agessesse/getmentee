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
  /**
   * Permission to appear on the public site. Absent means no. Kept separate
   * from every other fact about this person, exactly as in data/people.ts.
   */
  publicUse?: 'approved';
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
  /**
   * Slug of this mentor's public profile page at /people/<slug>, when one
   * exists in data/people.ts. Omit for mentors with no profile page yet:
   * the carousel renders them as a preview-only card rather than a dead link.
   */
  profileSlug?: string;
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
   * CSS object-position for the large alternating portrait layout: '<x%> <y%>'.
   * Determined per-image to keep the face centered in the frame.
   * Defaults to '50% 20%' if omitted.
   */
  imagePosition?: string;
  /**
   * CSS object-position for the small carousel thumbnail (96×96px).
   * Separate from imagePosition because small thumbnails need different offsets
   * to center the face correctly. Defaults to '50% 15%' if omitted.
   */
  thumbnailPosition?: string;
  /** LinkedIn profile URL — omit if not available or unverified */
  linkedInUrl?: string;
  /**
   * 2-3 concise areas this mentor can genuinely help with.
   * Derived only from verifiable career information already in this file.
   */
  helpsWith?: string[];
  /**
   * Prior employers shown as logo chips on the card.
   * Use the exact string key from COMPANY_LOGO_DOMAINS in lib/logos.ts.
   */
  priorCompanies?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Featured mentors — the professionals who directly inspired Mentee.
// imagePosition values are set per-image based on actual photo inspection.
// ─────────────────────────────────────────────────────────────────────────────
export const FEATURED_MENTORS: Mentor[] = [
  {
    name: 'Christopher Floyd, CFA',
    profileSlug: 'christopher-floyd',
    initials: 'CF',
    title: 'Head of Institutional Sales',
    company: 'Bondway.ai',
    headshot: '/people/christopher-floyd.jpg',
    accentColor: '#1a1f3a',
    imagePosition: '50% 5%',
    thumbnailPosition: '50% 10%',
    linkedInUrl: 'https://www.linkedin.com/in/christopher-floyd/',
    priorCompanies: ['Wells Fargo', 'Morgan Stanley', 'SMBC', 'Fifth Third Securities'],
    helpsWith: ['Fixed Income', 'Capital Markets', 'Career Development'],
    shortBio:
      "CFA charterholder and fixed-income markets leader with roughly three decades of experience. Christopher leads institutional sales at Bondway.ai. Before that he spent a senior career at Wells Fargo, where he served as Managing Director and Co-Head of Investment Grade Sales & Trading, following earlier roles at Morgan Stanley, SMBC and Fifth Third Securities.",
    whyIMentor:
      'Mentorship is most powerful when it becomes a long-term investment in someone\'s trajectory.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Peter Keane',
    profileSlug: 'peter-keane',
    initials: 'PK',
    title: 'President',
    company: 'Keane Capital Management',
    headshot: '/people/peter-keane.jpg',
    accentColor: '#2d3668',
    imagePosition: '50% 38%',
    thumbnailPosition: '50% 15%',
    linkedInUrl: 'https://www.linkedin.com/in/pete-keane-958b711/',
    helpsWith: ['Career Decisions', 'Professional Guidance', 'Advocacy'],
    shortBio:
      "Peter has supported Mentable's founder with candid guidance, encouragement, and advocacy during important academic and professional decisions.",
    whyIMentor:
      'Good mentorship goes beyond advice. It means being willing to advocate for someone when an opportunity can change their trajectory.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Tiffany Lakey',
    initials: 'TL',
    title: 'Chief of Staff, Corporate & Investment Bank',
    company: 'Wells Fargo',
    headshot: '/people/tiffany-lakey.jpg',
    accentColor: '#1a1f3a',
    imagePosition: '50% 15%',
    thumbnailPosition: '50% 20%',
    linkedInUrl: 'https://www.linkedin.com/in/tiffany-lakey-2b6747b/',
    helpsWith: ['Institutional Banking', 'Corporate Strategy', 'Leadership'],
    shortBio:
      'Senior Wells Fargo executive with more than two decades in institutional banking. Tiffany serves as Chief of Staff in the Corporate & Investment Bank, having previously served as Managing Director and Head of Strategy & Innovation and COO of Strategy & Client Engagement. She began her career at Wachovia Securities in leveraged finance, covering TMT and healthcare.',
    whyIMentor:
      'Corporate banking is a relationship business at every level. The skill that matters most is the ability to connect authentically rather than simply transact, and it is the one that takes longest to develop.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Frank L. Van Buren',
    initials: 'FV',
    title: 'Founder & Principal',
    company: 'Van Buren Advisory LLC',
    headshot: '/people/frank-van-buren.jpg',
    accentColor: '#2d3668',
    imagePosition: '50% 10%',
    thumbnailPosition: '50% 5%',
    linkedInUrl: 'https://www.linkedin.com/in/frank-l-van-buren-4664516/',
    helpsWith: ['Breaking into Finance', 'Analyst Development', 'Professional Presence'],
    shortBio:
      'UNC Kenan-Flagler MBA and Consortium for Graduate Study in Management participant. Frank founded Van Buren Advisory LLC to develop emerging financial talent, leading professional development programs for analysts at institutions including Wells Fargo, BlackRock, CIBC Capital Markets and RBC Capital Markets. He holds FINRA Series 24, 7 and 63 licenses and serves on the Veterans Bridge Home board.',
    whyIMentor:
      'The gap between technical competence and executive presence is where most early careers stall. Structured mentorship is the fastest way to close it.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Will Alston',
    initials: 'WA',
    title: 'Head of Corporate Banking',
    company: 'Wells Fargo',
    headshot: '/people/will-alston.jpg',
    accentColor: '#3d4a8f',
    imagePosition: '50% 10%',
    thumbnailPosition: '50% 15%',
    linkedInUrl: 'https://www.linkedin.com/in/will-alston-766a161/',
    helpsWith: ['Corporate Banking', 'Relationship Building', 'Career Navigation'],
    shortBio:
      'Wells Fargo executive serving as Head of Corporate Banking in Charlotte, with more than fifteen years of institutional banking experience building and managing client relationships across sectors.',
    whyIMentor:
      'The conversations that shape a career rarely happen on a formal agenda. Mentorship creates space for those conversations to happen on purpose.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Travis Melvin',
    profileSlug: 'travis-melvin',
    initials: 'TM',
    title: '—',
    company: 'UNC Kenan-Flagler Business School',
    headshot: '/people/travis-melvin.jpg',
    accentColor: '#3d4a8f',
    imagePosition: '50% 10%',
    thumbnailPosition: '50% 18%',
    linkedInUrl: 'https://www.linkedin.com/in/travis-melvin/',
    helpsWith: ['Finance Access', 'UNC / Kenan-Flagler', 'Real Estate'],
    shortBio:
      'Finance, real-estate and public-policy professional affiliated with UNC Kenan-Flagler. Travis founded the J.R.R. Scholarship Foundation, mentors through Wall Street Oasis, and guest-lectures at universities across the country.',
    whyIMentor:
      'Access to finance careers has historically depended on who you know. Mentorship is one of the most direct ways to change that.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'David Sheffer',
    profileSlug: 'david-sheffer',
    initials: 'DS',
    title: 'Senior Advisor',
    company: 'MyEyeDr.',
    headshot: '/people/david-sheffer.jpg',
    accentColor: '#1a1f3a',
    imagePosition: '50% 0%',
    thumbnailPosition: '50% 8%',
    linkedInUrl: 'https://www.linkedin.com/in/david-sheffer-4a46045a/',
    helpsWith: ['Investment Banking', 'Private Equity', 'Growth Strategy'],
    shortBio:
      'UNC Kenan-Flagler alumnus with a career spanning investment banking, private equity, M&A and growth strategy. David previously served as Chief Growth Officer at MyEyeDr. and remains engaged as a Senior Advisor.',
    whyIMentor:
      'The most useful thing an experienced person can do is give someone an honest view of how decisions actually play out, rather than how they look on paper.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Drew Nations',
    profileSlug: 'drew-nations',
    initials: 'DN',
    title: 'Founder & CEO',
    company: 'Engineered Land Solutions',
    headshot: '/people/drew-nations.jpg',
    accentColor: '#2d3668',
    imagePosition: '50% 0%',
    thumbnailPosition: '50% 22%',
    linkedInUrl: 'https://www.linkedin.com/in/drewnations/',
    helpsWith: ['Entrepreneurship', 'Building a Company', 'Real Estate'],
    shortBio:
      'Founder and CEO of Engineered Land Solutions and UNC Kenan-Flagler alumnus. Drew built his company at the intersection of commercial real estate, land development and finance.',
    whyIMentor:
      'Entrepreneurship is hard to navigate without someone who has already made the early mistakes. That context is exactly what a mentor can provide.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Zach Smith',
    profileSlug: 'zach-smith',
    initials: 'ZS',
    title: 'Executive Director',
    company: 'Beds for Kids',
    headshot: '/people/zach-smith.jpg',
    accentColor: '#3d4a8f',
    imagePosition: '50% 0%',
    thumbnailPosition: '50% 18%',
    linkedInUrl: 'https://www.linkedin.com/in/zach-smith-201a3990/',
    helpsWith: ['Nonprofit Leadership', 'Mission-Driven Careers', 'Social Impact'],
    shortBio:
      'Executive Director of Beds for Kids and UNC alumnus. Zach grew from delivery driver to leading the organization over roughly nine years, building operational and leadership experience in the nonprofit sector.',
    whyIMentor:
      'A career defined by mission is its own kind of challenge. Mentorship can make mission-driven paths feel achievable instead of idealistic.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Will Varnum',
    profileSlug: 'will-varnum',
    initials: 'WV',
    title: 'Co-Founder & Chief Executive Officer',
    company: 'Alyra Technology',
    headshot: '/people/will-varnum.png',
    accentColor: '#1a1f3a',
    imagePosition: '50% 8%',
    thumbnailPosition: '50% 12%',
    linkedInUrl: 'https://www.linkedin.com/in/willvarnum',
    priorCompanies: ['Wells Fargo Advisors'],
    helpsWith: ['AI Strategy', 'Custom Engineering', 'Private Wealth'],
    shortBio:
      'Co-founder and CEO of Alyra Technology, an AI consulting and engineering firm that designs and deploys custom AI and automation systems for mid-market companies. Will works directly with executive teams on turning manual workflows into production software, and previously spent two and a half years at Wells Fargo Advisors on its top private wealth team.',
    // Not a quotation. whyLabel is 'Founder perspective', so this is editorial
    // copy about what he can help with, written from verifiable career facts.
    // Swap to 'In their words' only if Will supplies a line himself.
    whyIMentor:
      'The gap between knowing a field exists and knowing how to enter it is mostly information, and that information usually travels through people rather than job postings.',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  /*
    George and Bob are deliberately minimal entries.

    Everything the other cards carry — title, company, prior employers, what
    someone can help with, a bio — was written from career information already
    verified and recorded in this file. For these two the repository holds
    their name, their headshot and their LinkedIn URL, and nothing else. So
    those three things are all that is set.

    title and company use the '—' sentinel this file already defines for
    unverified, which MentorCard reads to hide the line entirely rather than
    printing a dash. shortBio and whyIMentor are empty strings for the same
    reason: the preview modal hides the statement block when it has nothing,
    and an invented sentence would be exactly the claim this file exists to
    avoid. Fill them in when the information is confirmed, not before.
  */
  {
    name: 'George A. Metz Jr., MS, PCC',
    initials: 'GM',
    title: '—',
    company: '—',
    headshot: '/people/george-metz.png',
    accentColor: '#2d3668',
    linkedInUrl: 'https://www.linkedin.com/in/george-a-metz-jr-ms-pcc-0b5a891b/',
    shortBio: '',
    whyIMentor: '',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
  {
    name: 'Bob Salvin',
    initials: 'BS',
    title: '—',
    company: '—',
    headshot: '/people/bob-salvin.jpg',
    accentColor: '#3d4a8f',
    linkedInUrl: 'https://www.linkedin.com/in/bobsalvin/',
    shortBio: '',
    whyIMentor: '',
    whyLabel: 'Founder perspective',
    menteesMentored: null,
  },
];


/**
 * The marketing carousels and the hero may only show mentors who have agreed
 * to appear. Empty today, and the components handle that.
 */
export const PUBLIC_FEATURED_MENTORS: Mentor[] =
  FEATURED_MENTORS.filter((m) => m.publicUse === 'approved');
