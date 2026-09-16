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
//             'active'   = authenticated Mentable user.
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

/**
 * A real, named, findable student.
 *
 * THE RULE FOR EVERY FIELD BELOW. Only information that is true about this
 * person, and that they would recognise as their own. Never an invented quote,
 * testimonial, outcome, motive, opinion or first-person statement, and never
 * fabricated activity such as a mentorship, session or goal they did not have.
 *
 * This interface used to carry a `demo_impact_story` field holding exactly
 * that: invented first-person copy, rendered in quotation marks under each real
 * student's photograph. Twelve people had one, including students who can read
 * this site. The field and all twelve values are gone, and nothing replaced
 * them, because the honest replacement for an invented quote is no quote.
 *
 * Illustrative product copy is still fine and the site uses plenty of it. It
 * belongs on a demo identity from scripts/seed-demo.ts, or on a statement the
 * person actually supplied and approved. Not here.
 */
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
   * PROTOTYPE ONLY. Fictional, illustrative, and not about this person.
   *
   * A short third-person sketch of what a Mentable relationship could look like
   * for someone with this person's interests. It exists so the prototype can
   * show the shape of the product to mentors, students and university contacts
   * while the real product is still being built.
   *
   * THE RULES, which are the reason this is not called demo_impact_story:
   *   - It is fiction. Nothing in it happened.
   *   - Never render it as factual information about the person.
   *   - Never write it in the first person, and never put it in quotation
   *     marks. It describes a hypothetical student, not the person pictured.
   *   - Never present it as a testimonial, an endorsement, an outcome, a real
   *     mentorship, or verified activity.
   *   - Wherever it renders it must carry visible prototype framing, so a
   *     reasonable visitor reads "this is what Mentable could look like" and
   *     not "this person did this".
   *   - Delete it, or replace it with a statement the person actually supplied
   *     and approved, before Mentable presents real outcomes or testimonials.
   *
   * Every other field on this interface is factual and governed by the rule at
   * the top. This one is the single deliberate exception, and it is fenced off
   * by name, by type doc, and by how it renders.
   */
  prototype_scenario?: string;
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
    bio: "Peter has supported Mentable's founder with candid guidance, encouragement, and advocacy during important academic and professional decisions.",
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
  {
    slug: 'will-varnum',
    firstName: 'Will',
    lastName: 'Varnum',
    headline: 'Co-Founder & Chief Executive Officer · Alyra Technology',
    title: 'Co-Founder & Chief Executive Officer',
    organization: 'Alyra Technology',
    location: 'Charlotte, North Carolina',
    bio: 'Co-founder and CEO of Alyra Technology, an AI consulting and engineering firm that designs, builds and deploys custom AI and automation systems for mid-market companies. Will works directly with executive leadership teams on turning manual workflows into production software, covering AI strategy and advisory, team enablement, custom engineering, data platforms and AI governance. He previously spent two and a half years at Wells Fargo Advisors on its top private wealth team, and is a co-founder and investor in CLT Lifting Club in Charlotte.',
    image: '/people/will-varnum.png',
    expertiseTags: [
      'AI Strategy',
      'AI Enablement',
      'Custom Engineering',
      'Data Platforms',
      'AI Governance',
      'Private Wealth',
      'Entrepreneurship',
    ],
    // Education is deliberately absent: it was not supplied and is not
    // inferable. The field is optional and the section is conditional, so the
    // page renders correctly without it rather than carrying a guess.
    experience: [
      {
        title: 'Co-Founder & Chief Executive Officer',
        organization: 'Alyra Technology',
        description:
          'AI consulting and engineering firm working with executive teams on production AI deployment, from four-week diagnostics through custom engineering and governance. July 2025 to present.',
      },
      {
        title: 'Co-Founder & Investor',
        organization: 'CLT Lifting Club',
        description:
          'Founding group and ownership stake in a strength-focused hybrid gym in South End Charlotte. Involvement is at ownership and board level: capital modeling, technical infrastructure and partner-level strategy. May 2025 to present.',
      },
      {
        title: 'Private Client Associate',
        organization: 'Wells Fargo Advisors',
        description:
          "Wells Fargo's top private wealth team, managing $3.6B for ultra-high-net-worth families. July 2023 to January 2026.",
      },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/willvarnum',
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
        field: 'Interdisciplinary Studies: Innovation in Global Development and Public Policy; Data Science minor',
        years: '2024–2028',
      },
    ],
    experience: [{ organization: 'JPMorganChase' }],
    linkedInUrl: 'https://www.linkedin.com/in/bethlehem-agegne/',
    prototype_scenario:
      'A student whose interests sit across global development, public policy and data could use Mentable to work with someone who has built a career at that intersection, agree on which roles actually exist and which are worth targeting, and learn to present an interdisciplinary background as an asset rather than something to explain away.',
    status: 'sourced',
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
      { title: 'Incoming Markets Summer Analyst, Fixed Income Strategy & Portfolio Management', organization: 'Wells Fargo' },
      { title: 'Investment Banking Summer Analyst', organization: 'Envoy Capital Advisors' },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/abelgessesse/',
    prototype_scenario:
      'A student trying to understand fixed income could use Mentable to work with someone decades into that desk, set a shared goal around what to learn first, and turn what is usually years of trial and error into a handful of prepared sessions whose notes carry forward.',
    status: 'sourced',
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
    prototype_scenario:
      'A student building a product could use Mentable to work with a founder who has already made the early mistakes, and get honest feedback on the thing itself rather than encouragement, with every session leaving one concrete action item attached to the work.',
    status: 'sourced',
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
    prototype_scenario:
      'A student who has already secured the offer could use Mentable for what comes after it: how to show up, what to prioritise in the first weeks, and how to read a culture from the inside. Those are goals a mentor can set with them before the start date rather than after it.',
    status: 'sourced',
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
    prototype_scenario:
      'A student moving from political economy toward markets could use Mentable to work with someone who can translate that background into language a desk recognises, and rehearse the pivot in a session before it has to be explained in an interview.',
    status: 'sourced',
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
      'North Carolina State Record, Butterfly',
      'All-American Swimmer',
    ],
    linkedInUrl: 'https://www.linkedin.com/in/troy-keen-jr-829717337/',
    prototype_scenario:
      'A varsity athlete facing a recruiting timeline that does not accommodate a season could use Mentable to plan around it with someone who has done the same, and work out how to present years of high-performance competition without underselling what it taught them.',
    status: 'sourced',
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
    prototype_scenario:
      'A student learning markets from the outside could use Mentable to reach someone already inside them, and arrive at each session with the questions worth asking rather than the ones that sound safe.',
    status: 'sourced',
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
    prototype_scenario:
      'A first-generation student entering capital markets could use Mentable to work with someone who came up the same way, and see what the path looks like from the inside instead of assembling it from job postings and guesswork.',
    status: 'sourced',
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
      { institution: 'University of Minnesota, Carlson School of Management' },
    ],
    experience: [
      { organization: 'Bank of America' },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/eliphaz-getachew/',
    prototype_scenario:
      'A student at the very beginning could use Mentable to work with someone who still remembers what the first steps felt like, and replace a run of guesses with decisions they have actually talked through with somebody.',
    status: 'sourced',
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
      { institution: 'UC Berkeley, Haas School of Business' },
    ],
    experience: [
      { title: 'Incoming Markets Summer Intern, Fixed Income', organization: 'Wells Fargo Corporate & Investment Banking' },
    ],
    linkedInUrl: 'https://www.linkedin.com/in/hugo-canseco/',
    prototype_scenario:
      'A student who already has the internship could use Mentable for what happens inside it: how to learn quickly, what to ask, and how to be useful early. Action items between sessions are what turn that advice into something that actually got done.',
    status: 'sourced',
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
    prototype_scenario:
      'A student whose leadership experience does not obviously map to the industry they want could use Mentable to work out how to articulate it, on paper and in a room, with someone who has heard both versions and can say which one lands.',
    status: 'sourced',
  },
  {
    slug: 'pablo-n',
    firstName: 'Pablo',
    lastName: 'N.',
    // Full last name not yet verified — placeholder until confirmed
    school: 'Queens University of Charlotte',
    bio: 'Student building a path in finance and career development.',
    image: '/people/pablo-n.jpg',
    portraitPosition: '50% 30%',
    interestTags: ['Finance', 'Career Development', 'Leadership'],
    linkedInUrl: 'https://www.linkedin.com/in/pabloon/',
    prototype_scenario:
      'A student who has to create their own visibility rather than wait for recruiters to arrive could use Mentable to reach someone who made the same climb, and work from a plan with dates on it rather than from encouragement alone.',
    status: 'sourced',
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
