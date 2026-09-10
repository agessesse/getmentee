// ─────────────────────────────────────────────────────────────────────────────
// SOURCED PROFILES — Initial real network for Mentee.
//
// DATA POLICY:
//   • All professional fields are derived from publicly available information.
//   • "Why I mentor" / first-person quotes are OMITTED unless personally supplied.
//   • Mentee-activity fields (sessions, ratings, mentees, availability) must come
//     from application data — never hardcoded here.
//   • status: 'sourced'  = profile record only, person has not signed up.
//             'invited'  = invitation sent.
//             'active'   = authenticated Mentee user.
//   • is_founding_mentor defaults to false — set explicitly after opt-in.
//
// HOW TO EDIT:
//   • Update any field as information is confirmed.
//   • Drop headshots in /public/people/ using the slug-based filename.
//   • Add new entries by appending to SOURCED_MENTORS or SOURCED_NEAR_PEERS.
// ─────────────────────────────────────────────────────────────────────────────

export type ProfileStatus = 'sourced' | 'invited' | 'active';

export interface EducationItem {
  institution: string;
  degree?: string;
  field?: string;
  years?: string;
}

export interface ExperienceItem {
  title?: string;
  organization: string;
  description?: string;
}

export interface SourcedProfile {
  slug: string;
  firstName: string;
  lastName: string;
  /** Credential suffix, e.g. "CFA" */
  credential?: string;
  headline?: string;
  title?: string;
  organization?: string;
  school?: string;
  location?: string;
  /** Factual third-person bio — no fabricated first-person quotes */
  bio: string;
  /** Path relative to /public — leave undefined to show initials fallback */
  image?: string;
  expertiseTags: string[];
  distinctions?: string[];
  education?: EducationItem[];
  experience?: ExperienceItem[];
  linkedInUrl?: string;
  status: ProfileStatus;
  is_founding_mentor: boolean;
}

export interface SourcedNearPeer {
  slug: string;
  firstName: string;
  lastName: string;
  /** Omit if school cannot be verified — never fabricate */
  school?: string;
  expectedGraduation?: string;
  location?: string;
  /** Factual third-person bio */
  bio: string;
  image?: string;
  /**
   * CSS object-position for the portrait crop: '<x%> <y%>'.
   * Defaults to '50% 20%' if omitted.
   */
  portraitPosition?: string;
  interestTags: string[];
  distinctions?: string[];
  organization?: string;
  title?: string;
  education?: EducationItem[];
  experience?: ExperienceItem[];
  linkedInUrl?: string;
  status: ProfileStatus;
  /**
   * Editorial impact copy shown in the profile preview modal.
   * DEMO COPY — NOT a verified quote from this person.
   * Always render with a "demo_impact_story" label in the UI.
   */
  demo_impact_story?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCED MENTORS (6)
// ─────────────────────────────────────────────────────────────────────────────

export const SOURCED_MENTORS: SourcedProfile[] = [
  {
    slug: 'christopher-floyd',
    firstName: 'Christopher',
    lastName: 'Floyd',
    credential: 'CFA',
    headline: 'Head of Institutional Sales · Bondway.ai',
    title: 'Head of Institutional Sales',
    organization: 'Bondway.ai',
    location: 'Charlotte, North Carolina',
    bio: 'CFA charterholder and fixed-income markets leader with roughly three decades of industry experience. Christopher currently leads institutional sales at Bondway.ai after senior sales-and-trading roles including Managing Director and Co-Head of Investment Grade Sales & Trading at Wells Fargo.',
    image: '/people/christopher-floyd.jpg',
    expertiseTags: [
      'Fixed Income',
      'Credit Markets',
      'Sales & Trading',
      'Capital Markets',
      'Institutional Markets',
      'Financial Technology',
      'Career Development',
      'Leadership',
    ],
    education: [{ institution: 'University of Pennsylvania' }],
    experience: [
      { title: 'Head of Institutional Sales', organization: 'Bondway.ai' },
      { title: 'Managing Director, Co-Head of Investment Grade Sales & Trading', organization: 'Wells Fargo' },
      { organization: 'Morgan Stanley' },
      { organization: 'SMBC' },
      { organization: 'Fifth Third Securities' },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/christopher-floyd/',
    status: 'sourced',
    is_founding_mentor: false,
  },
  {
    slug: 'peter-keane',
    firstName: 'Peter',
    lastName: 'Keane',
    headline: 'President · Keane Capital Management',
    title: 'President',
    organization: 'Keane Capital Management',
    location: 'Charlotte, North Carolina',
    linkedInUrl: 'https://www.linkedin.com/in/pete-keane-958b711/',
    bio: "Peter has supported Mentee's founder with candid guidance, encouragement, and advocacy during important academic and professional decisions.",
    image: '/people/peter-keane.jpg',
    expertiseTags: [
      'Career Development',
      'Leadership',
      'Mentorship',
      'Professional Guidance',
    ],
    status: 'sourced',
    is_founding_mentor: false,
  },
  {
    slug: 'travis-melvin',
    firstName: 'Travis',
    lastName: 'Melvin',
    headline: 'UNC Kenan-Flagler Business School',
    organization: 'UNC Kenan-Flagler Business School',
    location: 'Chapel Hill, North Carolina',
    bio: 'Finance, real-estate and public-policy professional affiliated with UNC Kenan-Flagler, with experience spanning investing, education and mentorship. Travis also founded the J.R.R. Scholarship Foundation and mentors through Wall Street Oasis.',
    image: '/people/travis-melvin.jpg',
    expertiseTags: [
      'Finance',
      'Real Estate',
      'Public Policy',
      'Investing',
      'Career Development',
      'Mentorship',
      'Scholarships',
      'Education',
      'UNC',
    ],
    distinctions: [
      'Founder, J.R.R. Scholarship Foundation',
      'Board Member, Carolina Pedigree Foundation',
      'Mentor, Wall Street Oasis',
      'Guest Lecturer, Morgan State University',
      'Guest Lecturer, University of Novi Sad',
      'Series 65 · SIE · Prior Series 79',
    ],
    education: [{ institution: 'London School of Economics and Political Science' }],
    linkedInUrl: 'https://www.linkedin.com/in/travis-melvin/',
    status: 'sourced',
    is_founding_mentor: false,
  },
  {
    slug: 'david-sheffer',
    firstName: 'David',
    lastName: 'Sheffer',
    headline: 'Senior Advisor · MyEyeDr.',
    title: 'Senior Advisor',
    organization: 'MyEyeDr.',
    location: 'Charlotte, North Carolina',
    bio: 'UNC alumnus, investor and business leader with experience spanning investment banking, private equity, M&A and growth strategy. David previously served as Chief Growth Officer at MyEyeDr. and currently serves as a Senior Advisor.',
    image: '/people/david-sheffer.jpg',
    expertiseTags: [
      'Private Equity',
      'Investment Banking',
      'M&A',
      'Healthcare',
      'Growth Strategy',
      'Business Development',
      'Entrepreneurship',
      'UNC',
      'Leadership',
    ],
    education: [
      { institution: 'University of North Carolina at Chapel Hill', degree: 'Bachelor of Business Administration' },
    ],
    experience: [
      { title: 'Senior Advisor', organization: 'MyEyeDr.' },
      { title: 'Chief Growth Officer', organization: 'MyEyeDr.' },
      { organization: 'Monitor Clipper Partners' },
      { organization: 'Advent International' },
      { organization: 'McColl Partners' },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/david-sheffer-4a46045a/',
    status: 'sourced',
    is_founding_mentor: false,
  },
  {
    slug: 'drew-nations',
    firstName: 'Drew',
    lastName: 'Nations',
    headline: 'Founder & CEO · Engineered Land Solutions',
    title: 'Founder & CEO',
    organization: 'Engineered Land Solutions',
    location: 'Charlotte, North Carolina',
    bio: "Founder and CEO of Engineered Land Solutions and UNC Kenan-Flagler alumnus. Drew's background spans real-estate development, finance, land strategy and entrepreneurship.",
    image: '/people/drew-nations.jpg',
    expertiseTags: [
      'Entrepreneurship',
      'Commercial Real Estate',
      'Real Estate Development',
      'Land Development',
      'Industrial Real Estate',
      'Finance',
      'UNC Kenan-Flagler',
      'Leadership',
      'Founding a Company',
    ],
    education: [
      { institution: 'UNC Kenan-Flagler Business School', field: 'Finance and Real Estate', years: '2011–2015' },
    ],
    experience: [
      { title: 'Founder & CEO', organization: 'Engineered Land Solutions' },
      { organization: 'Panattoni Development Company' },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/drewnations/',
    status: 'sourced',
    is_founding_mentor: false,
  },
  {
    slug: 'zach-smith',
    firstName: 'Zach',
    lastName: 'Smith',
    headline: 'Executive Director · Beds for Kids',
    title: 'Executive Director',
    organization: 'Beds for Kids',
    location: 'Charlotte, North Carolina',
    bio: 'Executive Director of Beds for Kids and UNC alumnus. Zach has grown through multiple operational and leadership roles within the organization and now leads its work addressing furniture poverty across the Charlotte region.',
    image: '/people/zach-smith.jpg',
    expertiseTags: [
      'Nonprofit Leadership',
      'Social Impact',
      'Community Service',
      'Operations',
      'Fundraising',
      'Leadership',
      'UNC',
      'Charlotte',
      'Mission-Driven Careers',
    ],
    education: [{ institution: 'University of North Carolina at Chapel Hill', years: '2013–2017' }],
    experience: [
      {
        title: 'Executive Director',
        organization: 'Beds for Kids',
        description: 'Grew through delivery driver, volunteer coordinator, grant writer, and Director of Operations roles over approximately nine years.',
      },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/zach-smith-201a3990/',
    status: 'sourced',
    is_founding_mentor: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NEAR-PEER / MENTEE PROFILES (5)
// These individuals may both receive and eventually provide mentorship.
// Role architecture note: current DB schema uses binary mentor/mentee roles.
// Future migration path: add can_mentor BOOLEAN to mentee_profiles (additive).
// ─────────────────────────────────────────────────────────────────────────────

export const SOURCED_NEAR_PEERS: SourcedNearPeer[] = [
  {
    slug: 'bethlehem-agegne',
    firstName: 'Bethlehem',
    lastName: 'Agegne',
    school: 'University of North Carolina at Chapel Hill',
    expectedGraduation: '2028',
    location: 'Chapel Hill, North Carolina',
    bio: "UNC student studying innovation in global development and public policy with a minor in data science. Bethlehem's experience spans business, community engagement, global development and student leadership, including Kenan-Flagler Assured Admission, Honors Carolina and NC Fellows.",
    image: '/people/bethlehem-agegne.png',
    portraitPosition: '50% 10%',
    interestTags: [
      'Leadership',
      'Global Development',
      'Public Policy',
      'Business',
      'Community Impact',
      'UNC',
      'Kenan-Flagler',
      'Data Science',
      'Social Impact',
    ],
    distinctions: [
      'Kenan-Flagler Assured Admission',
      'Honors Carolina',
      'NC Fellows',
      'Joseph Cooley High & Kathleen Cullins High Koinonia Scholarship',
    ],
    education: [
      {
        institution: 'University of North Carolina at Chapel Hill',
        field: 'Interdisciplinary Studies — Innovation in Global Development and Public Policy; Data Science minor',
        years: '2024–2028',
      },
    ],
    experience: [{ organization: 'JPMorganChase' }],
    linkedInUrl: 'https://www.linkedin.com/in/bethlehem-agegne/',
    status: 'sourced',
    demo_impact_story: 'Having someone who could connect my global-development interests to real career paths — not just tell me to "network more" — changed how I thought about what I could build from Chapel Hill. I learned to see my background as an asset, not a gap to overcome.',
  },
  {
    slug: 'abel-gessesse',
    firstName: 'Abel',
    lastName: 'Gessesse',
    school: 'University of North Carolina at Chapel Hill',
    expectedGraduation: '2028',
    location: 'Chapel Hill, North Carolina',
    bio: 'UNC student with experience across investment banking and capital markets, including an incoming Markets Summer Analyst role at Wells Fargo and prior investment banking experience at Envoy Capital Advisors.',
    image: '/people/abel-gessesse.jpg',
    portraitPosition: '52% 15%',
    interestTags: [
      'Fixed Income',
      'Markets',
      'Investment Banking',
      'Recruiting',
      'Career Development',
      'Finance',
      'UNC',
    ],
    distinctions: [
      'Carolina Covenant Scholar',
      'MLT Career Prep Fellow',
      'Bloomberg Market Concepts',
    ],
    education: [
      {
        institution: 'University of North Carolina at Chapel Hill',
        field: 'Economics / Pre-Business',
        years: '2024–2028',
      },
    ],
    experience: [
      { title: 'Incoming Markets Summer Analyst — Fixed Income Strategy & Portfolio Management', organization: 'Wells Fargo' },
      { title: 'Investment Banking Summer Analyst', organization: 'Envoy Capital Advisors' },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/abelgessesse/',
    status: 'sourced',
    demo_impact_story: 'The conversations I had with mentors in fixed income gave me a framework for evaluating opportunities that I would not have developed on my own. Knowing someone had navigated the same terrain — and was willing to be honest about it — compressed years of trial and error into a few focused meetings.',
  },
  {
    slug: 'cooper-delo',
    firstName: 'Cooper',
    lastName: 'Delo',
    school: 'UNC Kenan-Flagler Business School / University of North Carolina at Chapel Hill',
    expectedGraduation: '2028',
    location: 'Chapel Hill, North Carolina',
    bio: 'UNC student, builder and founder of PlugVerse, a technology platform for local music booking. Cooper works at the intersection of entrepreneurship, software, product and music.',
    image: '/people/cooper-delo.png',
    portraitPosition: '42% 8%',
    interestTags: [
      'Entrepreneurship',
      'Startups',
      'Product',
      'Technology',
      'AI',
      'Music',
      'Founder Development',
      'UNC',
      'Kenan-Flagler',
    ],
    distinctions: [
      'Founder, PlugVerse',
      '3rd place, Innovate Carolina Luby Pitch Competition ($20,000 award)',
    ],
    education: [
      { institution: 'UNC Kenan-Flagler Business School', field: 'Business and Computer Science', years: '2024–2028' },
    ],
    experience: [
      {
        title: 'Founder',
        organization: 'PlugVerse',
        description: "Technology platform connecting local and college musicians with venues. Placed 3rd in Innovate Carolina's Luby Pitch Competition.",
      },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/cooperdelo/',
    status: 'sourced',
    demo_impact_story: 'Most startup advice is generic. Having access to someone who had actually built a company — and could give me honest feedback instead of just encouragement — is the difference between spinning wheels and making actual progress on something real.',
  },
  {
    slug: 'teagan-fitzgerald',
    firstName: 'Teagan',
    lastName: 'Fitzgerald',
    school: 'Columbia University',
    location: 'Boston, Massachusetts',
    bio: "Columbia student and QuestBridge Scholar studying psychology with a business-management concentration. Teagan's experience includes Goldman Sachs and mentoring children through Columbia Youth Adventurers.",
    image: '/people/teagan-fitzgerald.png',
    portraitPosition: '50% 8%',
    interestTags: [
      'Psychology',
      'Business',
      'Goldman Sachs',
      'Career Development',
      'QuestBridge',
      'Mentorship',
      'College Access',
      'Community Service',
      'Columbia',
    ],
    distinctions: ['QuestBridge Scholar'],
    education: [
      { institution: 'Columbia University', field: 'Psychology; Special Concentration in Business Management' },
    ],
    experience: [
      { organization: 'Goldman Sachs' },
      {
        title: 'Mentor',
        organization: 'Columbia Youth Adventurers',
        description: 'Mentors low-income children during cultural and recreational excursions across New York City.',
      },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/teaganfitzgerald/',
    status: 'sourced',
    demo_impact_story: 'Getting into Goldman was the hard part — or so I thought. Knowing how to show up, what to prioritize, and how to navigate the culture once I got there was harder. Mentorship gave me that second layer of preparation before I ever walked in the door.',
  },
  {
    slug: 'jaden-small',
    firstName: 'Jaden',
    lastName: 'Small',
    school: 'Duke University',
    expectedGraduation: '2027',
    location: 'New York, New York',
    bio: 'Duke student and Reginaldo Howard Memorial Scholar studying Public Policy with a History minor and PPE Certificate. Jaden has markets experience at J.P. Morgan spanning Fixed Income Treasury Sales and Securitized Products Sales.',
    image: '/people/jaden-small.jpg',
    portraitPosition: '50% 18%',
    interestTags: [
      'Markets',
      'Fixed Income',
      'Securitized Products',
      'Political Economy',
      'Emerging Markets',
      'International Policy',
      'Investing',
      'Duke',
      'J.P. Morgan',
    ],
    distinctions: [
      'Reginaldo Howard Memorial Scholar',
      'VP of Public Relations, BlackGen Capital',
      'Woodman Scholar, Duke Economics Analytics Lab',
    ],
    education: [
      {
        institution: 'Duke University',
        field: 'Public Policy; History minor; PPE Certificate',
        years: '2023–2027',
      },
    ],
    experience: [
      { organization: 'J.P. Morgan', description: 'Fixed Income Treasury Sales; Securitized Products Sales.' },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/jadensmall/',
    status: 'sourced',
    demo_impact_story: 'Moving from public policy into markets is a real pivot. Mentors helped me translate my background into a language that trading and sales teams understood — and gave me the conviction to make the transition confidently instead of apologetically.',
  },
  {
    slug: 'troy-keen-jr',
    firstName: 'Troy',
    lastName: 'Keen Jr.',
    school: 'Georgetown University',
    expectedGraduation: '2028',
    bio: 'Georgetown student and NCAA Division I swimmer for the Hoyas. Troy is a North Carolina state record holder in the butterfly and a decorated club swimmer with All-American recognition, pursuing opportunities in finance and business.',
    image: '/people/troy-keen-jr.jpg',
    portraitPosition: '50% 22%',
    interestTags: ['Finance', 'Georgetown', 'Swimming & Diving', 'Career Development', 'Leadership'],
    distinctions: [
      'NCAA Division I, Georgetown Swimming & Diving',
      'North Carolina State Record — Butterfly',
      'All-American Swimmer',
    ],
    linkedInUrl: 'https://www.linkedin.com/in/troy-keen-jr-829717337/',
    status: 'sourced',
    demo_impact_story: 'Being a Division I athlete makes the finance recruiting timeline genuinely complicated. Mentors who had navigated that same transition helped me understand how to position my experience without underselling what four years of high-performance competition actually teaches you.',
  },
  {
    slug: 'cooper-lipton',
    firstName: 'Cooper',
    lastName: 'Lipton',
    school: 'Duke University',
    bio: 'Duke University student pursuing opportunities in finance and capital markets.',
    image: '/people/cooper-lipton.png',
    portraitPosition: '50% 15%',
    interestTags: ['Finance', 'Markets', 'Duke'],
    linkedInUrl: 'https://www.linkedin.com/in/cooper-lipton-199544285/',
    status: 'sourced',
    demo_impact_story: 'Understanding capital markets from the outside is one thing. Knowing what questions to actually ask during recruiting — and who to ask — is something you only get from people who are already in the room and willing to be honest with you.',
  },
  {
    slug: 'erick-angwenyi',
    firstName: 'Erick',
    lastName: 'Angwenyi',
    school: 'University of New Hampshire',
    bio: 'University of New Hampshire student and Paul Scholar with experience in global capital markets through J.P. Morgan. Erick is also a Hamel Scholar and J.P. Morgan Global Markets Fellow building a career in finance.',
    image: '/people/erick-angwenyi.png',
    portraitPosition: '50% 12%',
    interestTags: ['Finance', 'J.P. Morgan', 'UNH', 'Capital Markets', 'Career Development'],
    distinctions: [
      'Paul Scholar, University of New Hampshire',
      'Hamel Scholar',
      'J.P. Morgan Global Markets Fellow',
    ],
    education: [
      { institution: 'University of New Hampshire' },
    ],
    experience: [
      { organization: 'J.P. Morgan', description: 'Global Markets' },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/erick-angwenyi/',
    status: 'sourced',
    demo_impact_story: 'As a first-generation professional in finance, I had the ambition but not the context. Mentors who had come up through similar paths showed me what the journey actually looked like from the inside — and made the whole thing feel navigable.',
  },
  {
    slug: 'eliphaz-getachew',
    firstName: 'Eliphaz',
    lastName: 'Getachew',
    school: 'University of Minnesota',
    bio: 'University of Minnesota student at the Carlson School of Management with experience in banking and finance, including a role at Bank of America.',
    image: '/people/eliphaz-getachew.jpg',
    portraitPosition: '50% 28%',
    interestTags: ['Finance', 'Carlson', 'Banking', 'University of Minnesota', 'Career Development'],
    education: [
      { institution: 'University of Minnesota — Carlson School of Management' },
    ],
    experience: [
      { organization: 'Bank of America' },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/eliphaz-getachew/',
    status: 'sourced',
    demo_impact_story: 'Having mentors who remembered what the early steps felt like — and were willing to talk through decisions honestly — made the difference between guessing and knowing. That kind of perspective is genuinely irreplaceable when you are just starting out.',
  },
  {
    slug: 'hugo-canseco',
    firstName: 'Hugo',
    lastName: 'Canseco',
    school: 'UC Berkeley · Haas',
    bio: 'UC Berkeley Haas student with an incoming Wells Fargo Corporate & Investment Banking Markets Summer Internship in Fixed Income in Charlotte, NC.',
    image: '/people/hugo-canseco.jpg',
    portraitPosition: '50% 18%',
    interestTags: ['Markets', 'Fixed Income', 'Berkeley Haas', 'Wells Fargo', 'Finance'],
    education: [
      { institution: 'UC Berkeley — Haas School of Business' },
    ],
    experience: [
      { title: 'Incoming Markets Summer Intern — Fixed Income', organization: 'Wells Fargo Corporate & Investment Banking' },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/hugo-canseco/',
    status: 'sourced',
    demo_impact_story: 'Landing the internship offer was just the beginning. What I actually needed was guidance on how to make the most of it once I got there — how to learn fast, ask smart questions, and be memorable for the right reasons. Mentorship gave me that preparation.',
  },
  {
    slug: 'will-walker',
    firstName: 'William',
    lastName: 'Walker III',
    school: 'UNC Kenan-Flagler Business School',
    bio: 'UNC Chapel Hill student, Morehead-Cain Scholar, and Student Body President with a focus on business, entrepreneurship, and entertainment law. William is an Honors Carolina student and Co-Chair of the Student Diversity and Inclusion Council, known for community-driven leadership and building lasting relationships.',
    image: '/people/will-walker.jpg',
    portraitPosition: '50% 15%',
    interestTags: [
      'Business',
      'Entrepreneurship',
      'Entertainment Law',
      'Leadership',
      'Public Relations',
      'Community Development',
      'UNC',
      'Kenan-Flagler',
    ],
    distinctions: [
      'Morehead-Cain Scholar',
      'Student Body President, UNC',
      'Honors Carolina',
      'Alumni Award',
      'James and Kathleen Lockhart Memorial Award',
      'Co-Chair, Student Diversity and Inclusion Council',
    ],
    education: [
      {
        institution: 'UNC Kenan-Flagler Business School',
        field: 'Business',
      },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/william-walker-iii/',
    status: 'sourced',
    demo_impact_story: 'Student government and finance recruiting do not always look like they connect. Mentors helped me understand how to articulate leadership experience in a way that actually resonated with what institutions are looking for — not just in a cover letter, but in a room.',
  },
  {
    slug: 'pablo-n',
    firstName: 'Pablo',
    lastName: 'N.',
    // Full last name not yet verified — placeholder until confirmed
    school: 'Queens University',
    bio: 'Student building a path in finance and career development.',
    image: '/people/pablo-n.jpg',
    portraitPosition: '50% 30%',
    interestTags: ['Finance', 'Career Development', 'Leadership'],
    linkedInUrl: 'https://www.linkedin.com/in/pabloon/',
    status: 'sourced',
    demo_impact_story: 'Starting from a school that is not a target means working twice as hard for half the visibility. Mentors who had done that same journey gave me a roadmap instead of just inspiration — and that made all the difference.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getMentorBySlug(slug: string): SourcedProfile | undefined {
  return SOURCED_MENTORS.find((m) => m.slug === slug);
}

export function getNearPeerBySlug(slug: string): SourcedNearPeer | undefined {
  return SOURCED_NEAR_PEERS.find((p) => p.slug === slug);
}

export function getPersonBySlug(
  slug: string
): { type: 'mentor'; data: SourcedProfile } | { type: 'near-peer'; data: SourcedNearPeer } | null {
  const mentor = getMentorBySlug(slug);
  if (mentor) return { type: 'mentor', data: mentor };
  const peer = getNearPeerBySlug(slug);
  if (peer) return { type: 'near-peer', data: peer };
  return null;
}
