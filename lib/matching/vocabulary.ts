/**
 * The words both sides of the network choose from.
 *
 * WHY THIS IS ONE FILE AND NOT TWO FORMS' WORTH OF CONSTANTS.
 *
 * The matching engine finds overlap by comparing strings. `norm()` survives
 * casing, plurals and punctuation, and nothing beyond that — so a mentor
 * who types "IB recruiting" and a student who types "Investment banking
 * recruiting" produce NO reason, and the engine is blamed for a vocabulary
 * problem. Adding more free-text fields to onboarding would have made the
 * matching worse, not better: more places for the two sides to describe the
 * same thing differently.
 *
 * So every field that is matched against another field draws from one list
 * here, and the two sides are PAIRED on purpose:
 *
 *     mentor                     seeker                      signal
 *     ─────────────────────────  ──────────────────────────  ──────────
 *     can_help_with              intent.looking_for          situation
 *     useful_to                  communities                 situation
 *     transitions_made           transitions_navigating      transition
 *     companies_known            target_companies            company
 *     functions                  functions_exploring         function
 *     affiliations               communities                 affiliation
 *     expertise_tags / industry  interest_tags / industries  expertise
 *
 * Read down a column and it is a form. Read across a row and it is a join.
 *
 * FREE TEXT IS STILL ALLOWED. Every picker lets someone add their own
 * value, because a closed vocabulary that cannot express your situation is
 * worse than a messy one. A custom value simply will not match anything
 * until someone on the other side types it too, which is the honest
 * trade and is the reason the suggested list is put first.
 */

/**
 * SITUATIONS. What a person can be brought, as opposed to what subject
 * they are tagged with.
 *
 * Phrased the way a student would describe their own problem, not the way
 * a mentor would describe their expertise. "I have a superday in three
 * weeks" needs a person who has sat on that side of the table; it does not
 * need a person tagged "Finance".
 */
export const SITUATIONS = [
  'Investment banking recruiting',
  'Private equity recruiting',
  'Consulting case interviews',
  'Markets and trading recruiting',
  'Product management interviews',
  'Software engineering interviews',
  'Technical interview preparation',
  'Behavioral interviews',
  'Superday preparation',
  'Networking and cold outreach',
  'Coffee chats',
  'Resume positioning',
  'Choosing between offers',
  'Choosing between career paths',
  'Internship decision-making',
  'Negotiating an offer',
  'Starting as an analyst',
  'The first ninety days in a new role',
  'Early career decisions',
  'Going back to school',
  'Applying to an MBA',
  'Finding a first job without a network',
] as const;

/**
 * FUNCTIONS. What someone does, as distinct from the industry they do it
 * in — a product manager in banking and a banker are not interchangeable,
 * and industry alone cannot tell them apart.
 */
export const FUNCTIONS = [
  'Investing', 'Deal execution', 'Research', 'Trading', 'Sales',
  'Strategy', 'Corporate development', 'Finance and FP&A',
  'Product management', 'Software engineering', 'Data science',
  'Design', 'Marketing', 'Operations', 'People and recruiting',
  'Legal', 'Consulting', 'General management', 'Founding a company',
] as const;

/**
 * TRANSITIONS. Moves a person has actually made, and moves a person is
 * trying to make.
 *
 * The strongest signal in the whole network and the one no tag list can
 * express: not "knows about private equity" but "went from consulting to
 * private equity, the way you are trying to". Written as "X to Y" so both
 * sides phrase it identically.
 */
export const TRANSITIONS = [
  'Banking to private equity',
  'Banking to a startup',
  'Banking to corporate',
  'Consulting to private equity',
  'Consulting to a startup',
  'Consulting to corporate strategy',
  'Engineering to product',
  'Engineering to founding',
  'Academia to industry',
  'Military to civilian',
  'Non-target school to finance',
  'Liberal arts to finance',
  'Liberal arts to tech',
  'A different industry into tech',
  'A different industry into finance',
  'Employee to founder',
  'Returning to work after a break',
] as const;

/**
 * INDUSTRIES. Shared by both sides already, and unchanged — the one
 * vocabulary that was never the problem.
 */
export const INDUSTRIES = [
  'Investment Banking', 'Private Equity', 'Venture Capital', 'Consulting',
  'Technology', 'Real Estate', 'Banking', 'Law', 'Entrepreneurship',
  'Investment Management', 'Hedge Funds', 'Healthcare', 'Consumer',
  'Industrials', 'Energy', 'Media', 'Government and policy', 'Non-profit',
] as const;

/**
 * SUBJECTS. Expertise on the mentor side, interests on the seeker side.
 * Kept as the existing list so the 25 mentors who already filled this in
 * keep matching exactly as they did.
 */
export const SUBJECTS = [
  'Investment Banking', 'M&A', 'Leveraged Finance', 'Restructuring', 'Equity Research',
  'Private Equity', 'Growth Equity', 'LBO Modeling', 'Venture Capital', 'Startup Investing',
  'Hedge Funds', 'Global Macro', 'Quant Finance', 'Fixed Income',
  'Strategy Consulting', 'Case Interviews', 'Operations Consulting', 'MBB Recruiting',
  'Product Management', 'PM Recruiting', 'Software Engineering', 'System Design',
  'FAANG Interviews', 'Engineering Leadership', 'Real Estate', 'CRE Finance',
  'Corporate Finance', 'FP&A', 'Financial Modeling', 'Recruiting', 'Career Planning',
  'Fundraising', 'Company Building',
] as const;

/**
 * COMMUNITIES AND AFFILIATIONS. Why a cold message gets answered.
 *
 * Weak as a predictor of a useful conversation, strong as a predictor of
 * whether the conversation happens at all — which is why the engine
 * weights it low and the form still asks.
 *
 * Universities are deliberately NOT here: the school match already has its
 * own signal from `profiles.university`, and listing it twice would get
 * the same fact said twice. The engine filters that case too.
 */
export const COMMUNITIES = [
  'First-generation college students',
  'Veterans and military families',
  'Questbridge',
  'Posse Foundation',
  'SEO Career',
  'Management Leadership for Tomorrow',
  'Jumpstart Advisory',
  'Girls Who Invest',
  'Women in finance',
  'Women in tech',
  'Out in tech / LGBTQ+ professionals',
  'Black professionals networks',
  'Latino professionals networks',
  'International students',
  'Student athletes',
  'Transfer students',
  'Community college transfers',
  'Working while studying',
] as const;

/**
 * COMPANIES. Autocomplete suggestions only — never a closed list.
 *
 * This one is explicitly open-ended: the point of the field is that a
 * student naming a specific firm can be matched to someone who has
 * actually worked there, and the long tail is where that is most useful.
 * These are here so the common cases are spelled consistently.
 */
export const COMPANY_SUGGESTIONS = [
  'Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Bank of America', 'Citi',
  'Evercore', 'Centerview', 'Lazard', 'Moelis', 'PJT Partners', 'Jefferies',
  'Blackstone', 'KKR', 'Apollo', 'Carlyle', 'TPG', 'Warburg Pincus',
  'Vista Equity', 'Thoma Bravo', 'General Atlantic', 'Insight Partners',
  'Sequoia', 'Andreessen Horowitz', 'Benchmark', 'Accel',
  'McKinsey', 'Bain', 'BCG', 'Deloitte', 'PwC', 'EY', 'KPMG',
  'Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Netflix', 'Nvidia',
  'Stripe', 'Databricks', 'OpenAI', 'Anthropic', 'Figma', 'Ramp',
  'Citadel', 'Jane Street', 'Two Sigma', 'Bridgewater', 'Point72',
] as const;

/**
 * RELATIONSHIP TYPES. What a mentor is actually offering.
 *
 * Asked rather than assumed, because assuming it is how mentors get
 * over-committed and then quietly stop answering. A person offering one
 * conversation is not a lesser mentor; they are a different, and honestly
 * described, kind of help.
 */
export const RELATIONSHIP_TYPES = [
  'One conversation',
  'A few conversations',
  'An ongoing relationship',
  'Answering questions by message',
  'A warm introduction to someone else',
  'Reviewing a resume or materials',
  'A mock interview',
] as const;

export const CADENCES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every other week' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'A few times a year' },
  { value: 'ad_hoc', label: 'When something comes up' },
] as const;

export const MODES = [
  { value: 'virtual', label: 'Video calls' },
  { value: 'in_person', label: 'In person' },
  { value: 'either', label: 'Either is fine' },
] as const;

/**
 * WHAT A SEEKER IS LOOKING FOR RIGHT NOW.
 *
 * This is the seeker's half of the `situation` join, and it is the only
 * list on the intent side: everything else about an intent is free text,
 * because the useful version of "what are you trying to do" is never on a
 * dropdown. Values are drawn from SITUATIONS so the two sides line up
 * exactly, plus a few that only a seeker would say.
 */
export const LOOKING_FOR = [
  ...SITUATIONS,
  'Someone who has done the job I want',
  'Someone who will tell me the truth about an industry',
  'Someone a year or two ahead of me',
  'Someone senior enough to see the whole path',
] as const;

/** Narrow the readonly tuples to plain arrays for component props. */
export const asOptions = (xs: readonly string[]): string[] => [...xs];
