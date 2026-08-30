/**
 * Demo seed script for Mentee platform.
 * Run: npm run seed:demo
 *
 * Creates ~25 mentors, ~15 mentees, realistic mentorship relationships,
 * sessions, messages, goals, action items, and reviews.
 *
 * Idempotent — checks for existing demo users before creating.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = 'Demo1234!';

// -------------------------------------------------------
// Mentor data
// -------------------------------------------------------
const MENTORS = [
  // Investment Banking
  {
    email: 'sarah.chen@demo.mentee.app',
    first_name: 'Sarah',
    last_name: 'Chen',
    headline: 'VP at Goldman Sachs | M&A Advisory',
    university: 'Princeton University',
    graduation_year: 2015,
    location: 'New York, NY',
    linkedin_url: 'https://linkedin.com/in/sarahchen-demo',
    company: 'Goldman Sachs',
    title: 'Vice President',
    industry: 'Investment Banking',
    bio: 'VP in Goldman\'s M&A group with 9 years of experience advising on transformative deals across TMT, healthcare, and consumer. I help students navigate investment banking recruiting — from modeling to interviews to day-one on the desk.',
    expertise_tags: ['Investment Banking', 'M&A', 'Financial Modeling', 'Recruiting', 'LBO Analysis'],
    goals: ['Break into IB', 'Ace superday interviews', 'Build modeling skills'],
    years_experience: 9,
    weekly_hours: 3,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 4,
    communication_preference: 'video',
    languages: ['English', 'Mandarin'],
    rating: 4.9,
    review_count: 47,
  },
  {
    email: 'marcus.johnson@demo.mentee.app',
    first_name: 'Marcus',
    last_name: 'Johnson',
    headline: 'Associate at JPMorgan | Leveraged Finance',
    university: 'UNC Chapel Hill',
    graduation_year: 2019,
    location: 'New York, NY',
    linkedin_url: 'https://linkedin.com/in/marcusjohnson-demo',
    company: 'JPMorgan Chase',
    title: 'Associate',
    industry: 'Investment Banking',
    bio: 'Leveraged Finance associate at JPM. UNC Kenan-Flagler alum — happy to help UNC students or anyone trying to break into credit/LevFin. I know what it takes to land the role and thrive once you\'re there.',
    expertise_tags: ['Leveraged Finance', 'Credit Analysis', 'Debt Capital Markets', 'Recruiting'],
    goals: ['LevFin recruiting', 'Credit modeling', 'IB culture'],
    years_experience: 5,
    weekly_hours: 2,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 3,
    communication_preference: 'any',
    languages: ['English'],
    rating: 4.8,
    review_count: 31,
  },
  {
    email: 'emily.russo@demo.mentee.app',
    first_name: 'Emily',
    last_name: 'Russo',
    headline: 'Analyst at Lazard | Restructuring',
    university: 'Duke University',
    graduation_year: 2022,
    location: 'New York, NY',
    linkedin_url: 'https://linkedin.com/in/emilyrusso-demo',
    company: 'Lazard',
    title: 'Analyst',
    industry: 'Investment Banking',
    bio: 'Restructuring analyst at Lazard. Just went through recruiting two years ago — I know exactly what elite boutiques look for and can help you build your story, your technical skills, and your network.',
    expertise_tags: ['Restructuring', 'Financial Modeling', 'Distressed Debt', 'Recruiting'],
    goals: ['Break into restructuring', 'Elite boutique recruiting'],
    years_experience: 2,
    weekly_hours: 3,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: false,
    max_mentees: 3,
    communication_preference: 'video',
    languages: ['English', 'Italian'],
    rating: 4.7,
    review_count: 18,
  },
  // Private Equity
  {
    email: 'david.park@demo.mentee.app',
    first_name: 'David',
    last_name: 'Park',
    headline: 'Senior Associate at Bain Capital | Growth Equity',
    university: 'Harvard University',
    graduation_year: 2017,
    location: 'Boston, MA',
    linkedin_url: 'https://linkedin.com/in/davidpark-demo',
    company: 'Bain Capital',
    title: 'Senior Associate',
    industry: 'Private Equity',
    bio: 'Senior associate at Bain Capital\'s growth equity team. Former Goldman analyst. I mentor ambitious students and early-career professionals on the IB-to-PE path, deal sourcing, and portfolio operations.',
    expertise_tags: ['Private Equity', 'Growth Equity', 'LBO Modeling', 'Deal Sourcing', 'Portfolio Operations'],
    goals: ['PE recruiting', 'LBO modeling', 'Build PE network'],
    years_experience: 7,
    weekly_hours: 2,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 3,
    communication_preference: 'video',
    languages: ['English', 'Korean'],
    rating: 4.9,
    review_count: 52,
  },
  {
    email: 'jessica.wu@demo.mentee.app',
    first_name: 'Jessica',
    last_name: 'Wu',
    headline: 'Associate at Blackstone | Real Estate PE',
    university: 'Wharton, University of Pennsylvania',
    graduation_year: 2020,
    location: 'New York, NY',
    linkedin_url: 'https://linkedin.com/in/jessicawu-demo',
    company: 'Blackstone',
    title: 'Associate',
    industry: 'Private Equity',
    bio: 'Real estate private equity associate at Blackstone. Wharton undergrad, ex-Morgan Stanley REIB. I help people break into real estate PE and understand the asset class — from cap rates to REIT analysis to development underwriting.',
    expertise_tags: ['Real Estate PE', 'REIT Analysis', 'Property Underwriting', 'Cap Rates', 'Real Estate Finance'],
    goals: ['Break into REPE', 'Real estate modeling', 'Property valuation'],
    years_experience: 4,
    weekly_hours: 2,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 3,
    communication_preference: 'video',
    languages: ['English', 'Mandarin'],
    rating: 4.8,
    review_count: 29,
  },
  {
    email: 'alex.kim@demo.mentee.app',
    first_name: 'Alex',
    last_name: 'Kim',
    headline: 'Principal at KKR | Technology Buyouts',
    university: 'Stanford University',
    graduation_year: 2013,
    location: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/alexkim-demo',
    company: 'KKR',
    title: 'Principal',
    industry: 'Private Equity',
    bio: 'Principal at KKR focusing on technology leveraged buyouts. 11 years across IB and PE. Passionate about helping the next generation — especially those from non-target schools who have the drive but not the network.',
    expertise_tags: ['Technology PE', 'LBO Modeling', 'Technology Sector', 'Buyouts', 'Value Creation'],
    goals: ['Tech PE recruiting', 'Value creation frameworks', 'Operating partner skills'],
    years_experience: 11,
    weekly_hours: 2,
    timezone: 'America/Los_Angeles',
    session_rate: null,
    is_available: false,
    is_verified: true,
    max_mentees: 2,
    communication_preference: 'async',
    languages: ['English', 'Korean'],
    rating: 4.7,
    review_count: 38,
  },
  // Venture Capital
  {
    email: 'priya.sharma@demo.mentee.app',
    first_name: 'Priya',
    last_name: 'Sharma',
    headline: 'Investor at Sequoia Capital | Early Stage',
    university: 'MIT',
    graduation_year: 2016,
    location: 'Menlo Park, CA',
    linkedin_url: 'https://linkedin.com/in/priyasharma-demo',
    company: 'Sequoia Capital',
    title: 'Investor',
    industry: 'Venture Capital',
    bio: 'Early-stage investor at Sequoia focused on fintech and enterprise SaaS. Former founder (sold to Stripe). I help aspiring VCs understand the industry, develop investment theses, and navigate VC recruiting.',
    expertise_tags: ['Venture Capital', 'Fintech', 'SaaS', 'Startup Investing', 'VC Recruiting'],
    goals: ['Break into VC', 'Investment thesis', 'Startup evaluation'],
    years_experience: 8,
    weekly_hours: 3,
    timezone: 'America/Los_Angeles',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 4,
    communication_preference: 'video',
    languages: ['English', 'Hindi'],
    rating: 4.9,
    review_count: 61,
  },
  {
    email: 'ryan.torres@demo.mentee.app',
    first_name: 'Ryan',
    last_name: 'Torres',
    headline: 'Principal at a16z | Bio + Health',
    university: 'Johns Hopkins University',
    graduation_year: 2014,
    location: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/ryantorres-demo',
    company: 'Andreessen Horowitz',
    title: 'Principal',
    industry: 'Venture Capital',
    bio: 'Investing in bio and health technology at a16z. MD-MBA background, former healthcare investment banker. I help scientists and doctors who want to move into venture capital or healthcare investing.',
    expertise_tags: ['Healthcare VC', 'BioTech', 'Digital Health', 'Healthcare Investing'],
    goals: ['Healthcare VC path', 'MD to finance', 'BioTech sector knowledge'],
    years_experience: 10,
    weekly_hours: 2,
    timezone: 'America/Los_Angeles',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 3,
    communication_preference: 'video',
    languages: ['English', 'Spanish'],
    rating: 4.8,
    review_count: 44,
  },
  // Consulting
  {
    email: 'natasha.williams@demo.mentee.app',
    first_name: 'Natasha',
    last_name: 'Williams',
    headline: 'Engagement Manager at McKinsey | Strategy',
    university: 'Yale University',
    graduation_year: 2016,
    location: 'Chicago, IL',
    linkedin_url: 'https://linkedin.com/in/natashawilliams-demo',
    company: 'McKinsey & Company',
    title: 'Engagement Manager',
    industry: 'Consulting',
    bio: 'Engagement manager at McKinsey in the Chicago office. I specialize in organizational strategy and digital transformation. Happy to help with case prep, resume reviews, and navigating the McKinsey recruiting process.',
    expertise_tags: ['Strategy Consulting', 'Case Interviews', 'Organizational Design', 'Digital Transformation'],
    goals: ['MBB recruiting', 'Case interview prep', 'Consulting career path'],
    years_experience: 8,
    weekly_hours: 3,
    timezone: 'America/Chicago',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 5,
    communication_preference: 'video',
    languages: ['English'],
    rating: 4.9,
    review_count: 78,
  },
  {
    email: 'james.okafor@demo.mentee.app',
    first_name: 'James',
    last_name: 'Okafor',
    headline: 'Senior Consultant at BCG | Operations',
    university: 'UNC Chapel Hill',
    graduation_year: 2018,
    location: 'Washington, DC',
    linkedin_url: 'https://linkedin.com/in/jamesokafor-demo',
    company: 'Boston Consulting Group',
    title: 'Senior Consultant',
    industry: 'Consulting',
    bio: 'Senior consultant at BCG\'s DC office. UNC Kenan-Flagler alum. I focus on operations and supply chain work for government and healthcare clients. Strong belief in paying it forward — especially for first-gen students.',
    expertise_tags: ['Operations Consulting', 'Case Interviews', 'Supply Chain', 'Public Sector'],
    goals: ['MBB case prep', 'Operations career', 'First-gen student support'],
    years_experience: 6,
    weekly_hours: 3,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 4,
    communication_preference: 'any',
    languages: ['English'],
    rating: 4.8,
    review_count: 55,
  },
  {
    email: 'sophie.martin@demo.mentee.app',
    first_name: 'Sophie',
    last_name: 'Martin',
    headline: 'Manager at Deloitte Strategy | Healthcare',
    university: 'Georgetown University',
    graduation_year: 2015,
    location: 'New York, NY',
    linkedin_url: 'https://linkedin.com/in/sophiemartin-demo',
    company: 'Deloitte',
    title: 'Manager',
    industry: 'Consulting',
    bio: 'Healthcare strategy manager at Deloitte. Former Teach For America corps member. I help students break into consulting and understand how to build a meaningful career in healthcare strategy.',
    expertise_tags: ['Healthcare Strategy', 'Case Interviews', 'Management Consulting', 'Non-profits'],
    goals: ['Consulting recruiting', 'Healthcare industry knowledge', 'Career planning'],
    years_experience: 9,
    weekly_hours: 2,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: false,
    max_mentees: 3,
    communication_preference: 'video',
    languages: ['English', 'French'],
    rating: 4.7,
    review_count: 33,
  },
  // Technology
  {
    email: 'kevin.patel@demo.mentee.app',
    first_name: 'Kevin',
    last_name: 'Patel',
    headline: 'Senior PM at Google | Search & AI',
    university: 'Carnegie Mellon University',
    graduation_year: 2015,
    location: 'Mountain View, CA',
    linkedin_url: 'https://linkedin.com/in/kevinpatel-demo',
    company: 'Google',
    title: 'Senior Product Manager',
    industry: 'Technology',
    bio: 'Senior PM at Google working on Search and AI products. Former SWE turned PM. I help engineers, MBAs, and career switchers break into product management at top tech companies.',
    expertise_tags: ['Product Management', 'AI Products', 'PM Recruiting', 'Product Strategy', 'Tech Career'],
    goals: ['Break into PM', 'Product sense', 'FAANG interviews'],
    years_experience: 9,
    weekly_hours: 3,
    timezone: 'America/Los_Angeles',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 4,
    communication_preference: 'video',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.8,
    review_count: 62,
  },
  {
    email: 'lisa.nguyen@demo.mentee.app',
    first_name: 'Lisa',
    last_name: 'Nguyen',
    headline: 'Engineering Manager at Meta | Platform',
    university: 'UC Berkeley',
    graduation_year: 2012,
    location: 'Menlo Park, CA',
    linkedin_url: 'https://linkedin.com/in/lisanguyen-demo',
    company: 'Meta',
    title: 'Engineering Manager',
    industry: 'Technology',
    bio: 'Engineering manager at Meta leading a platform team of 12. 12 years of software engineering experience. I mentor engineers on technical leadership, system design, and navigating the EM path.',
    expertise_tags: ['Engineering Leadership', 'System Design', 'Career Growth', 'Team Management'],
    goals: ['Engineering leadership', 'System design interviews', 'EM transition'],
    years_experience: 12,
    weekly_hours: 2,
    timezone: 'America/Los_Angeles',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 3,
    communication_preference: 'video',
    languages: ['English', 'Vietnamese'],
    rating: 4.9,
    review_count: 41,
  },
  {
    email: 'carlos.reyes@demo.mentee.app',
    first_name: 'Carlos',
    last_name: 'Reyes',
    headline: 'Software Engineer at Stripe | Payments Infrastructure',
    university: 'Georgia Tech',
    graduation_year: 2018,
    location: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/carlosreyes-demo',
    company: 'Stripe',
    title: 'Senior Software Engineer',
    industry: 'Technology',
    bio: 'L5 SWE at Stripe on the payments infrastructure team. I help engineers prepare for FAANG/fintech interviews with a focus on distributed systems and coding interviews. Strong advocate for Latinx representation in tech.',
    expertise_tags: ['Software Engineering', 'Distributed Systems', 'Coding Interviews', 'Fintech'],
    goals: ['FAANG interviews', 'System design', 'Coding interview prep'],
    years_experience: 6,
    weekly_hours: 3,
    timezone: 'America/Los_Angeles',
    session_rate: null,
    is_available: true,
    is_verified: false,
    max_mentees: 4,
    communication_preference: 'video',
    languages: ['English', 'Spanish'],
    rating: 4.8,
    review_count: 27,
  },
  // Real Estate
  {
    email: 'morgan.davis@demo.mentee.app',
    first_name: 'Morgan',
    last_name: 'Davis',
    headline: 'Director at CBRE | Capital Markets',
    university: 'University of Texas at Austin',
    graduation_year: 2011,
    location: 'Dallas, TX',
    linkedin_url: 'https://linkedin.com/in/morgandavis-demo',
    company: 'CBRE',
    title: 'Director',
    industry: 'Real Estate',
    bio: 'Director in CBRE\'s Capital Markets team focusing on office and industrial assets in the Sun Belt. I help students and early professionals understand commercial real estate from acquisition to disposition.',
    expertise_tags: ['Commercial Real Estate', 'Capital Markets', 'Property Underwriting', 'CRE Finance'],
    goals: ['CRE career entry', 'Property underwriting', 'Capital markets knowledge'],
    years_experience: 13,
    weekly_hours: 2,
    timezone: 'America/Chicago',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 3,
    communication_preference: 'any',
    languages: ['English'],
    rating: 4.7,
    review_count: 36,
  },
  // Entrepreneurship
  {
    email: 'zoe.anderson@demo.mentee.app',
    first_name: 'Zoe',
    last_name: 'Anderson',
    headline: 'Founder & CEO at Luminary | Series B',
    university: 'Stanford University',
    graduation_year: 2014,
    location: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/zoeanderson-demo',
    company: 'Luminary',
    title: 'Founder & CEO',
    industry: 'Entrepreneurship',
    bio: 'Founded and scaled Luminary to a $40M Series B. Former a16z associate. I mentor founders on fundraising, company building, and the emotional journey of building from zero to one.',
    expertise_tags: ['Entrepreneurship', 'Fundraising', 'Startup Strategy', 'VC Fundraising', 'Company Building'],
    goals: ['Start a company', 'Raise your first round', 'Build a founding team'],
    years_experience: 10,
    weekly_hours: 3,
    timezone: 'America/Los_Angeles',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 4,
    communication_preference: 'video',
    languages: ['English'],
    rating: 4.9,
    review_count: 49,
  },
  // Markets / Hedge Fund
  {
    email: 'daniel.lee@demo.mentee.app',
    first_name: 'Daniel',
    last_name: 'Lee',
    headline: 'Portfolio Manager at Citadel | Global Macro',
    university: 'Columbia University',
    graduation_year: 2010,
    location: 'New York, NY',
    linkedin_url: 'https://linkedin.com/in/daniellee-demo',
    company: 'Citadel',
    title: 'Portfolio Manager',
    industry: 'Investment Management',
    bio: 'Global macro PM at Citadel. 14 years across sell-side research and buy-side investing. I help quantitatively-minded students understand macro markets, fixed income, and paths into systematic/discretionary investing.',
    expertise_tags: ['Global Macro', 'Fixed Income', 'Quantitative Finance', 'Hedge Funds', 'Derivatives'],
    goals: ['Hedge fund recruiting', 'Macro investing', 'Quant finance'],
    years_experience: 14,
    weekly_hours: 2,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 2,
    communication_preference: 'async',
    languages: ['English', 'Korean'],
    rating: 4.8,
    review_count: 23,
  },
  // Additional mentors
  {
    email: 'isabella.foster@demo.mentee.app',
    first_name: 'Isabella',
    last_name: 'Foster',
    headline: 'Associate at General Atlantic | Growth Equity',
    university: 'UNC Chapel Hill',
    graduation_year: 2020,
    location: 'New York, NY',
    linkedin_url: 'https://linkedin.com/in/isabellafoster-demo',
    company: 'General Atlantic',
    title: 'Associate',
    industry: 'Private Equity',
    bio: 'Growth equity associate at General Atlantic. UNC Kenan-Flagler alum — class of 2020. I know exactly what it takes to get from UNC to top PE. Passionate about helping others navigate recruiting while staying sane.',
    expertise_tags: ['Growth Equity', 'PE Recruiting', 'Financial Modeling', 'Technology Investing'],
    goals: ['Growth equity recruiting', 'UNC to PE path', 'Financial modeling'],
    years_experience: 4,
    weekly_hours: 3,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 4,
    communication_preference: 'video',
    languages: ['English'],
    rating: 4.9,
    review_count: 34,
  },
  {
    email: 'thomas.grant@demo.mentee.app',
    first_name: 'Thomas',
    last_name: 'Grant',
    headline: 'CFO at TechStart | Finance Leader',
    university: 'UNC Chapel Hill',
    graduation_year: 2008,
    location: 'Raleigh, NC',
    linkedin_url: 'https://linkedin.com/in/thomasgrant-demo',
    company: 'TechStart',
    title: 'CFO',
    industry: 'Technology',
    bio: 'CFO of a Series C startup with 200 employees. Former Big 4 and IB career. I help students understand the CFO path, corporate finance, and how to build a career in startups vs. Wall Street.',
    expertise_tags: ['Corporate Finance', 'FP&A', 'Startup Finance', 'CFO Career', 'Accounting'],
    goals: ['Corporate finance career', 'CFO path', 'Startup vs Wall Street'],
    years_experience: 16,
    weekly_hours: 2,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: false,
    max_mentees: 3,
    communication_preference: 'any',
    languages: ['English'],
    rating: 4.6,
    review_count: 22,
  },
  {
    email: 'aisha.ibrahim@demo.mentee.app',
    first_name: 'Aisha',
    last_name: 'Ibrahim',
    headline: 'VP at Wells Fargo | Commercial Banking',
    university: 'Spelman College',
    graduation_year: 2013,
    location: 'Charlotte, NC',
    linkedin_url: 'https://linkedin.com/in/aishaibrahim-demo',
    company: 'Wells Fargo',
    title: 'Vice President',
    industry: 'Banking',
    bio: 'VP in Wells Fargo commercial banking. First-gen college graduate from Spelman. I am passionate about expanding access to finance careers for underrepresented groups and HBCU students.',
    expertise_tags: ['Commercial Banking', 'Credit Analysis', 'Finance Careers', 'Diversity in Finance'],
    goals: ['Commercial banking career', 'Credit analysis', 'Finance for underrepresented groups'],
    years_experience: 11,
    weekly_hours: 3,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 5,
    communication_preference: 'any',
    languages: ['English', 'Arabic'],
    rating: 4.9,
    review_count: 67,
  },
  {
    email: 'michael.chen@demo.mentee.app',
    first_name: 'Michael',
    last_name: 'Chen',
    headline: 'Partner at Accenture | Technology Strategy',
    university: 'University of Michigan',
    graduation_year: 2005,
    location: 'Chicago, IL',
    linkedin_url: 'https://linkedin.com/in/michaelchen-demo',
    company: 'Accenture',
    title: 'Partner',
    industry: 'Consulting',
    bio: 'Partner at Accenture Strategy with 19 years of experience. I specialize in technology strategy for Fortune 500 companies. I help students land consulting roles and understand what a 20-year consulting career looks like.',
    expertise_tags: ['Technology Strategy', 'Digital Transformation', 'Case Interviews', 'Big 4 Consulting'],
    goals: ['Consulting career', 'Long-term career planning', 'Tech strategy'],
    years_experience: 19,
    weekly_hours: 2,
    timezone: 'America/Chicago',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 3,
    communication_preference: 'video',
    languages: ['English', 'Mandarin'],
    rating: 4.7,
    review_count: 41,
  },
  {
    email: 'rachel.pham@demo.mentee.app',
    first_name: 'Rachel',
    last_name: 'Pham',
    headline: 'Senior Associate at JLL | Investment Sales',
    university: 'UNC Chapel Hill',
    graduation_year: 2017,
    location: 'Atlanta, GA',
    linkedin_url: 'https://linkedin.com/in/rachelpham-demo',
    company: 'JLL',
    title: 'Senior Associate',
    industry: 'Real Estate',
    bio: 'Investment sales broker at JLL focused on multifamily assets in the Southeast. UNC real estate program alum. I help aspiring real estate professionals understand brokerage, investment sales, and how to build your book.',
    expertise_tags: ['Real Estate Brokerage', 'Investment Sales', 'Multifamily', 'Southeast Markets'],
    goals: ['Real estate brokerage', 'Investment sales career', 'CRE fundamentals'],
    years_experience: 7,
    weekly_hours: 3,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: false,
    max_mentees: 4,
    communication_preference: 'any',
    languages: ['English', 'Vietnamese'],
    rating: 4.8,
    review_count: 19,
  },
  {
    email: 'william.brooks@demo.mentee.app',
    first_name: 'William',
    last_name: 'Brooks',
    headline: 'Attorney at Sullivan & Cromwell | M&A',
    university: 'Harvard Law School',
    graduation_year: 2014,
    location: 'New York, NY',
    linkedin_url: 'https://linkedin.com/in/williambrooks-demo',
    company: 'Sullivan & Cromwell',
    title: 'Associate',
    industry: 'Law',
    bio: 'M&A attorney at S&C advising on public and private M&A, restructuring, and capital markets transactions. Harvard Law JD. I help those interested in Big Law, M&A law, and the intersection of law and finance.',
    expertise_tags: ['M&A Law', 'Corporate Law', 'Big Law Recruiting', 'Capital Markets Law'],
    goals: ['Big Law recruiting', 'M&A law career', 'Law and finance'],
    years_experience: 10,
    weekly_hours: 2,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 3,
    communication_preference: 'async',
    languages: ['English'],
    rating: 4.6,
    review_count: 15,
  },
  // Demo mentor account
  {
    email: 'mentor@demo.mentee.app',
    first_name: 'Alex',
    last_name: 'Rivera',
    headline: 'VP at Blackstone | Opportunistic Real Estate',
    university: 'UNC Chapel Hill',
    graduation_year: 2014,
    location: 'New York, NY',
    linkedin_url: 'https://linkedin.com/in/alexrivera-demo',
    company: 'Blackstone',
    title: 'Vice President',
    industry: 'Private Equity',
    bio: 'VP at Blackstone\'s opportunistic real estate fund. Former Goldman Sachs REIB analyst and KKR associate. UNC Kenan-Flagler alum — thrilled to help Tar Heels and others break into top-tier PE and finance.',
    expertise_tags: ['Real Estate PE', 'LBO Modeling', 'Investment Banking', 'PE Recruiting', 'Deal Structuring'],
    goals: ['Break into PE', 'Real estate finance', 'Investment banking recruiting'],
    years_experience: 10,
    weekly_hours: 4,
    timezone: 'America/New_York',
    session_rate: null,
    is_available: true,
    is_verified: true,
    max_mentees: 5,
    communication_preference: 'video',
    languages: ['English', 'Spanish'],
    rating: 4.9,
    review_count: 73,
  },
];

// -------------------------------------------------------
// Mentee data
// -------------------------------------------------------
const MENTEES = [
  {
    email: 'jacob.harris@demo.mentee.app',
    first_name: 'Jacob',
    last_name: 'Harris',
    headline: 'Finance Junior at UNC Chapel Hill',
    university: 'UNC Chapel Hill',
    graduation_year: 2026,
    location: 'Chapel Hill, NC',
    linkedin_url: 'https://linkedin.com/in/jacobharris-demo',
    bio: 'Finance and statistics double major at UNC Kenan-Flagler. Aiming for investment banking summer analyst positions. Active in UNC Investment Club and Financial Leadership Program.',
    interest_tags: ['Investment Banking', 'Financial Modeling', 'M&A', 'Recruiting'],
    goals: ['Land an IB summer analyst offer', 'Build modeling skills', 'Expand finance network'],
    experience_level: 'beginner',
    preferred_format: 'video',
    timezone: 'America/New_York',
    major: 'Finance & Statistics',
    career_interests: ['Investment Banking', 'Private Equity'],
    industries_of_interest: ['Financial Services', 'Technology'],
  },
  {
    email: 'maya.thompson@demo.mentee.app',
    first_name: 'Maya',
    last_name: 'Thompson',
    headline: 'MBA Student at Darden | Career Switcher',
    university: 'University of Virginia (Darden)',
    graduation_year: 2025,
    location: 'Charlottesville, VA',
    linkedin_url: 'https://linkedin.com/in/mayathompson-demo',
    bio: 'MBA student at Darden transitioning from 4 years in marketing. Targeting consulting and PE roles. Working to build my technical skillset and expand my finance network.',
    interest_tags: ['Private Equity', 'Consulting', 'MBA Recruiting', 'Career Switch'],
    goals: ['Transition into consulting', 'Build financial modeling foundation', 'Land MBA summer associate'],
    experience_level: 'intermediate',
    preferred_format: 'video',
    timezone: 'America/New_York',
    major: 'MBA',
    career_interests: ['Management Consulting', 'Private Equity'],
    industries_of_interest: ['Consumer', 'Healthcare'],
  },
  {
    email: 'ethan.robinson@demo.mentee.app',
    first_name: 'Ethan',
    last_name: 'Robinson',
    headline: 'CS Senior at Georgia Tech | Future PM',
    university: 'Georgia Tech',
    graduation_year: 2025,
    location: 'Atlanta, GA',
    linkedin_url: 'https://linkedin.com/in/ethanrobinson-demo',
    bio: 'Computer science senior at GT with a minor in business. I\'ve been a SWE intern at two startups and want to transition into product management at a top tech company after graduation.',
    interest_tags: ['Product Management', 'PM Recruiting', 'Tech Career', 'Startup Experience'],
    goals: ['Break into product management', 'Build PM skillset', 'Land PM offer at FAANG or growth startup'],
    experience_level: 'intermediate',
    preferred_format: 'video',
    timezone: 'America/New_York',
    major: 'Computer Science',
    career_interests: ['Product Management', 'Entrepreneurship'],
    industries_of_interest: ['Technology', 'Fintech'],
  },
  {
    email: 'olivia.martinez@demo.mentee.app',
    first_name: 'Olivia',
    last_name: 'Martinez',
    headline: 'Finance Sophomore at UNC | First-Gen',
    university: 'UNC Chapel Hill',
    graduation_year: 2027,
    location: 'Chapel Hill, NC',
    linkedin_url: 'https://linkedin.com/in/oliviamartinez-demo',
    bio: 'First-generation college student at UNC studying finance. Passionate about real estate and want to break into REIB or REPE. Still building my knowledge base and looking for a guide.',
    interest_tags: ['Real Estate', 'Investment Banking', 'First-Gen', 'REPE'],
    goals: ['Understand finance recruiting', 'Learn real estate modeling', 'Build professional network'],
    experience_level: 'beginner',
    preferred_format: 'video',
    timezone: 'America/New_York',
    major: 'Finance',
    career_interests: ['Real Estate Investment Banking', 'Real Estate PE'],
    industries_of_interest: ['Real Estate', 'Financial Services'],
  },
  {
    email: 'noah.wilson@demo.mentee.app',
    first_name: 'Noah',
    last_name: 'Wilson',
    headline: 'Economics Senior at Duke | Consulting Hopeful',
    university: 'Duke University',
    graduation_year: 2025,
    location: 'Durham, NC',
    linkedin_url: 'https://linkedin.com/in/noahwilson-demo',
    bio: 'Economics and public policy double major at Duke. Strong academic record and leadership experience. Targeting MBB consulting after graduation and working hard on case interview prep.',
    interest_tags: ['Strategy Consulting', 'MBB', 'Case Interviews', 'Economic Policy'],
    goals: ['Ace MBB case interviews', 'Land McKinsey/BCG/Bain offer', 'Develop consulting frameworks'],
    experience_level: 'intermediate',
    preferred_format: 'video',
    timezone: 'America/New_York',
    major: 'Economics & Public Policy',
    career_interests: ['Management Consulting', 'Policy'],
    industries_of_interest: ['Healthcare', 'Government', 'Consumer'],
  },
  {
    email: 'chloe.baker@demo.mentee.app',
    first_name: 'Chloe',
    last_name: 'Baker',
    headline: 'Business Junior at USC | Aspiring VC',
    university: 'USC Marshall',
    graduation_year: 2026,
    location: 'Los Angeles, CA',
    linkedin_url: 'https://linkedin.com/in/chloebaker-demo',
    bio: 'Business student at USC Marshall with a passion for technology startups. I\'ve been part of USC\'s venture fund and want to pursue VC after graduation. Looking for mentorship to refine my investment thesis.',
    interest_tags: ['Venture Capital', 'Startups', 'Technology', 'Investment Thesis'],
    goals: ['Understand VC deal flow', 'Build investment thesis', 'Land VC internship or analyst role'],
    experience_level: 'beginner',
    preferred_format: 'video',
    timezone: 'America/Los_Angeles',
    major: 'Business Administration',
    career_interests: ['Venture Capital', 'Entrepreneurship'],
    industries_of_interest: ['Technology', 'Consumer', 'Fintech'],
  },
  {
    email: 'liam.scott@demo.mentee.app',
    first_name: 'Liam',
    last_name: 'Scott',
    headline: 'SWE at Startup | Targeting FAANG',
    university: 'North Carolina State University',
    graduation_year: 2022,
    location: 'Raleigh, NC',
    linkedin_url: 'https://linkedin.com/in/liamscott-demo',
    bio: 'Software engineer at a Series A startup, 2 years out of NC State. I want to level up and move to a FAANG company. Working on system design and grinding LeetCode but need guidance from someone who\'s been through it.',
    interest_tags: ['Software Engineering', 'FAANG', 'System Design', 'Coding Interviews'],
    goals: ['Pass FAANG technical interviews', 'Improve system design skills', 'Negotiate better compensation'],
    experience_level: 'intermediate',
    preferred_format: 'video',
    timezone: 'America/New_York',
    major: 'Computer Science',
    career_interests: ['Software Engineering', 'Engineering Management'],
    industries_of_interest: ['Technology', 'Fintech'],
  },
  {
    email: 'ava.nguyen@demo.mentee.app',
    first_name: 'Ava',
    last_name: 'Nguyen',
    headline: 'Finance Junior at UNC | PE Aspirant',
    university: 'UNC Chapel Hill',
    graduation_year: 2026,
    location: 'Chapel Hill, NC',
    linkedin_url: 'https://linkedin.com/in/avanguyen-demo',
    bio: 'Finance junior at UNC Kenan-Flagler targeting PE recruiting. Have a sophomore summer internship at a regional bank and want to break into a top IB program to position myself for PE.',
    interest_tags: ['Private Equity', 'Investment Banking', 'LBO Modeling', 'Recruiting'],
    goals: ['Land top IB internship', 'Understand PE recruiting timeline', 'Build LBO modeling skills'],
    experience_level: 'beginner',
    preferred_format: 'video',
    timezone: 'America/New_York',
    major: 'Finance',
    career_interests: ['Investment Banking', 'Private Equity'],
    industries_of_interest: ['Technology', 'Healthcare', 'Consumer'],
  },
  {
    email: 'ben.murphy@demo.mentee.app',
    first_name: 'Ben',
    last_name: 'Murphy',
    headline: 'Recent Grad | Exploring Finance Career',
    university: 'Wake Forest University',
    graduation_year: 2024,
    location: 'Charlotte, NC',
    linkedin_url: 'https://linkedin.com/in/benmurphy-demo',
    bio: 'Recent Wake Forest grad working at a regional bank in Charlotte. I want to figure out my long-term path — IB, PE, or something else in finance. Looking for a mentor who can help me think through the options.',
    interest_tags: ['Career Planning', 'Investment Banking', 'Finance Career'],
    goals: ['Map out 5-year career plan', 'Decide between IB and other finance paths', 'Build skills for next role'],
    experience_level: 'beginner',
    preferred_format: 'chat',
    timezone: 'America/New_York',
    major: 'Finance',
    career_interests: ['Investment Banking', 'Commercial Banking', 'Corporate Finance'],
    industries_of_interest: ['Financial Services', 'Real Estate'],
  },
  {
    email: 'grace.lee@demo.mentee.app',
    first_name: 'Grace',
    last_name: 'Lee',
    headline: 'Pre-Med Junior at Hopkins | Healthcare Finance',
    university: 'Johns Hopkins University',
    graduation_year: 2026,
    location: 'Baltimore, MD',
    linkedin_url: 'https://linkedin.com/in/gracelee-demo',
    bio: 'Pre-med student at Hopkins exploring a pivot to healthcare finance or healthcare VC. Passionate about improving healthcare systems but want to do it from the investment side.',
    interest_tags: ['Healthcare Finance', 'Healthcare VC', 'Career Pivot', 'BioTech'],
    goals: ['Understand healthcare investing', 'Explore MD vs. MBA paths', 'Network in healthcare finance'],
    experience_level: 'beginner',
    preferred_format: 'video',
    timezone: 'America/New_York',
    major: 'Neuroscience & Pre-Med',
    career_interests: ['Healthcare VC', 'Healthcare Investment Banking'],
    industries_of_interest: ['Healthcare', 'BioTech'],
  },
  {
    email: 'sam.chen@demo.mentee.app',
    first_name: 'Sam',
    last_name: 'Chen',
    headline: 'MBA Candidate at Booth | Targeting PE',
    university: 'University of Chicago (Booth)',
    graduation_year: 2025,
    location: 'Chicago, IL',
    linkedin_url: 'https://linkedin.com/in/samchen-demo',
    bio: 'MBA candidate at Booth coming from 3 years at Goldman Sachs. Targeting PE associate roles. I have the technical skills but want to build my network and understand what PE firms value in MBA associates.',
    interest_tags: ['Private Equity', 'MBA PE Recruiting', 'MBA to PE', 'LBO'],
    goals: ['Land PE associate offer', 'Build PE network from MBA', 'Understand PE associate role'],
    experience_level: 'advanced',
    preferred_format: 'video',
    timezone: 'America/Chicago',
    major: 'MBA',
    career_interests: ['Private Equity', 'Growth Equity'],
    industries_of_interest: ['Technology', 'Consumer', 'Industrials'],
  },
  {
    email: 'luna.rodriguez@demo.mentee.app',
    first_name: 'Luna',
    last_name: 'Rodriguez',
    headline: 'Accounting Senior | CPA + IB Goal',
    university: 'UNC Chapel Hill',
    graduation_year: 2025,
    location: 'Chapel Hill, NC',
    linkedin_url: 'https://linkedin.com/in/lunarodriguez-demo',
    bio: 'Accounting senior at UNC considering the Big 4 route but increasingly interested in pivoting to investment banking. Looking for a mentor who has made a similar transition.',
    interest_tags: ['Investment Banking', 'Big 4', 'Accounting to Finance', 'Career Pivot'],
    goals: ['Evaluate Big 4 vs IB path', 'Build IB technical skills', 'Understand accounting to finance transitions'],
    experience_level: 'beginner',
    preferred_format: 'video',
    timezone: 'America/New_York',
    major: 'Accounting',
    career_interests: ['Investment Banking', 'Corporate Finance'],
    industries_of_interest: ['Financial Services', 'Technology'],
  },
  {
    email: 'max.turner@demo.mentee.app',
    first_name: 'Max',
    last_name: 'Turner',
    headline: 'Economics Sophomore | Early Explorer',
    university: 'University of Virginia',
    graduation_year: 2027,
    location: 'Charlottesville, VA',
    linkedin_url: 'https://linkedin.com/in/maxturner-demo',
    bio: 'Sophomore at UVA just starting to explore finance careers. Interested in everything from consulting to banking to tech. Hoping to find a mentor who can help me understand my options and build an action plan.',
    interest_tags: ['Finance Careers', 'Career Planning', 'Early Career'],
    goals: ['Understand different finance paths', 'Get a sophomore internship', 'Build professional network'],
    experience_level: 'beginner',
    preferred_format: 'video',
    timezone: 'America/New_York',
    major: 'Economics',
    career_interests: ['Investment Banking', 'Management Consulting', 'Technology'],
    industries_of_interest: ['Financial Services', 'Technology', 'Consumer'],
  },
  {
    email: 'nadia.ali@demo.mentee.app',
    first_name: 'Nadia',
    last_name: 'Ali',
    headline: 'SWE Intern | Targeting FAANG Full-Time',
    university: 'NC State University',
    graduation_year: 2025,
    location: 'Raleigh, NC',
    linkedin_url: 'https://linkedin.com/in/nadiaali-demo',
    bio: 'CS senior at NC State with a SWE internship at Microsoft. Targeting a FAANG full-time offer and need to nail the system design interviews. Also interested in the EM path long-term.',
    interest_tags: ['Software Engineering', 'FAANG', 'System Design', 'Engineering Leadership'],
    goals: ['Pass FAANG interviews', 'Convert Microsoft return offer vs. explore', 'Plan for EM path in 5 years'],
    experience_level: 'intermediate',
    preferred_format: 'video',
    timezone: 'America/New_York',
    major: 'Computer Science',
    career_interests: ['Software Engineering', 'Engineering Management'],
    industries_of_interest: ['Technology'],
  },
  // Demo mentee account
  {
    email: 'mentee@demo.mentee.app',
    first_name: 'Jordan',
    last_name: 'Taylor',
    headline: 'Finance Junior at UNC | Breaking into Finance',
    university: 'UNC Chapel Hill',
    graduation_year: 2026,
    location: 'Chapel Hill, NC',
    linkedin_url: 'https://linkedin.com/in/jordantaylor-demo',
    bio: 'Junior at UNC Kenan-Flagler targeting investment banking and private equity. Active in the Financial Leadership Program and UNC Investment Club. Looking for mentorship to sharpen my recruiting strategy and technical skills.',
    interest_tags: ['Investment Banking', 'Private Equity', 'Financial Modeling', 'Recruiting'],
    goals: ['Land IB summer analyst offer at BB or EB', 'Build solid LBO modeling foundation', 'Position for PE recruiting'],
    experience_level: 'beginner',
    preferred_format: 'video',
    timezone: 'America/New_York',
    major: 'Finance & Economics',
    career_interests: ['Investment Banking', 'Private Equity'],
    industries_of_interest: ['Technology', 'Consumer', 'Healthcare'],
  },
];

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function hoursAgo(n: number) {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

// -------------------------------------------------------
// Main
// -------------------------------------------------------
async function main() {
  console.log('🌱 Starting Mentee demo seed...\n');

  // Check for existing demo users
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingEmails = new Set(existingUsers?.users.map((u) => u.email) ?? []);

  const mentorEmailCount = MENTORS.filter((m) => existingEmails.has(m.email)).length;
  const menteeEmailCount = MENTEES.filter((m) => existingEmails.has(m.email)).length;

  if (mentorEmailCount > 5 && menteeEmailCount > 3) {
    console.log('⚠️  Demo data already exists. Delete demo users to reseed.');
    console.log(`   Found ${mentorEmailCount}/${MENTORS.length} mentor accounts and ${menteeEmailCount}/${MENTEES.length} mentee accounts.`);
    return;
  }

  // Create mentor users
  console.log('Creating mentor accounts...');
  const mentorProfileMap: Record<string, string> = {}; // email -> uid

  for (const mentor of MENTORS) {
    if (existingEmails.has(mentor.email)) {
      // Find existing user
      const existing = existingUsers?.users.find((u) => u.email === mentor.email);
      if (existing) mentorProfileMap[mentor.email] = existing.id;
      process.stdout.write('.');
      continue;
    }

    const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
      email: mentor.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: mentor.first_name,
        last_name: mentor.last_name,
        role: 'mentor',
      },
    });

    if (userErr || !userData.user) {
      console.error(`\nFailed to create mentor ${mentor.email}:`, userErr?.message);
      continue;
    }

    mentorProfileMap[mentor.email] = userData.user.id;
    process.stdout.write('✓');

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 150));
  }
  console.log(`\n✅ Mentors: ${Object.keys(mentorProfileMap).length} accounts ready\n`);

  // Create mentee users
  console.log('Creating mentee accounts...');
  const menteeProfileMap: Record<string, string> = {};

  for (const mentee of MENTEES) {
    if (existingEmails.has(mentee.email)) {
      const existing = existingUsers?.users.find((u) => u.email === mentee.email);
      if (existing) menteeProfileMap[mentee.email] = existing.id;
      process.stdout.write('.');
      continue;
    }

    const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
      email: mentee.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: mentee.first_name,
        last_name: mentee.last_name,
        role: 'mentee',
      },
    });

    if (userErr || !userData.user) {
      console.error(`\nFailed to create mentee ${mentee.email}:`, userErr?.message);
      continue;
    }

    menteeProfileMap[mentee.email] = userData.user.id;
    process.stdout.write('✓');
    await new Promise((r) => setTimeout(r, 150));
  }
  console.log(`\n✅ Mentees: ${Object.keys(menteeProfileMap).length} accounts ready\n`);

  // Wait for handle_new_user trigger to create profiles
  console.log('Waiting for profile triggers...');
  await new Promise((r) => setTimeout(r, 2000));

  // Update profiles with enriched data
  console.log('Enriching profile records...');

  for (const mentor of MENTORS) {
    const uid = mentorProfileMap[mentor.email];
    if (!uid) continue;

    await supabase
      .from('profiles')
      .update({
        first_name: mentor.first_name,
        last_name: mentor.last_name,
        headline: mentor.headline,
        location: mentor.location,
        linkedin_url: mentor.linkedin_url,
        university: mentor.university,
        graduation_year: mentor.graduation_year,
        profile_complete: true,
      })
      .eq('id', uid);

    const { error: mpErr } = await supabase
      .from('mentor_profiles')
      .upsert({
        id: uid,
        bio: mentor.bio,
        expertise_tags: mentor.expertise_tags,
        years_experience: mentor.years_experience,
        weekly_hours: mentor.weekly_hours,
        timezone: mentor.timezone,
        session_rate: mentor.session_rate,
        goals: mentor.goals,
        is_available: mentor.is_available,
        rating: mentor.rating,
        review_count: mentor.review_count,
        profile_complete: true,
        company: mentor.company,
        title: mentor.title,
        industry: mentor.industry,
        max_mentees: mentor.max_mentees,
        communication_preference: mentor.communication_preference,
        is_verified: mentor.is_verified,
        languages: mentor.languages,
      });

    if (mpErr) console.error(`mentor_profiles upsert failed for ${mentor.email}:`, mpErr.message);
  }
  console.log('✅ Mentor profiles enriched\n');

  for (const mentee of MENTEES) {
    const uid = menteeProfileMap[mentee.email];
    if (!uid) continue;

    await supabase
      .from('profiles')
      .update({
        first_name: mentee.first_name,
        last_name: mentee.last_name,
        headline: mentee.headline,
        location: mentee.location,
        linkedin_url: mentee.linkedin_url,
        university: mentee.university,
        graduation_year: mentee.graduation_year,
        profile_complete: true,
      })
      .eq('id', uid);

    const { error: mpErr } = await supabase
      .from('mentee_profiles')
      .upsert({
        id: uid,
        bio: mentee.bio,
        interest_tags: mentee.interest_tags,
        goals: mentee.goals,
        experience_level: mentee.experience_level,
        preferred_format: mentee.preferred_format,
        timezone: mentee.timezone,
        profile_complete: true,
        major: mentee.major,
        career_interests: mentee.career_interests,
        industries_of_interest: mentee.industries_of_interest,
      });

    if (mpErr) console.error(`mentee_profiles upsert failed for ${mentee.email}:`, mpErr.message);
  }
  console.log('✅ Mentee profiles enriched\n');

  // Create mentorship relationships
  console.log('Creating mentorship relationships...');

  const demoMentorId = mentorProfileMap['mentor@demo.mentee.app'];
  const demoMenteeId = menteeProfileMap['mentee@demo.mentee.app'];

  // Pairs to create (mentee email, mentor email, days since start)
  const pairs: Array<{
    menteeEmail: string;
    mentorEmail: string;
    daysAgoStart: number;
    sessionCount: number;
    messages: string[][];
    goals: string[];
  }> = [
    {
      menteeEmail: 'mentee@demo.mentee.app',
      mentorEmail: 'mentor@demo.mentee.app',
      daysAgoStart: 45,
      sessionCount: 4,
      messages: [
        ['mentee', 'Hi Alex! Really excited to start working together. I just finished reviewing the LBO model template you sent — it\'s incredibly helpful. Any chance we can go through it together in our first session?'],
        ['mentor', 'Hey Jordan! Absolutely, we\'ll walk through the whole model step by step in our first call. Make sure you understand the entry/exit assumptions before we meet — that\'s where most people get tripped up.'],
        ['mentee', 'Will do! I also wanted to ask — when should I start thinking about IB recruiting? I know it\'s early but I want to make sure I\'m on the right timeline.'],
        ['mentor', 'You\'re not early at all — you\'re right on time. IB superday season starts earlier than most people expect. Let\'s make a 90-day recruiting plan in our first session.'],
        ['mentee', 'That sounds perfect. Should I be targeting BB banks or EBs given my background?'],
        ['mentor', 'Both — but let\'s talk about this on the call. Your profile is strong for EBs given Kenan-Flagler. Lazard, Evercore, and Centerview all recruit at UNC.'],
      ],
      goals: ['Land IB summer analyst offer', 'Master LBO modeling', 'Build UNC finance network'],
    },
    {
      menteeEmail: 'mentee@demo.mentee.app',
      mentorEmail: 'isabella.foster@demo.mentee.app',
      daysAgoStart: 30,
      sessionCount: 2,
      messages: [
        ['mentee', 'Isabella, I\'m so glad to connect — as a fellow Tar Heel who made it to General Atlantic, you\'re exactly who I wanted to find on this platform!'],
        ['mentor', 'Happy to help Jordan. UNC to top PE is absolutely doable — I did it and several of my classmates did too. Let\'s map out your path.'],
        ['mentee', 'I\'d love that. My main question is whether I should focus all energy on getting the best IB seat I can, or if there are other ways to position for PE?'],
        ['mentor', 'IB is still the primary path for PE. Your focus should be getting the best possible IB platform — BB or EB. We\'ll talk through which banks have the best PE placement from their analyst classes.'],
      ],
      goals: ['Understand PE recruiting path from UNC', 'Learn growth equity deal sourcing'],
    },
    {
      menteeEmail: 'jacob.harris@demo.mentee.app',
      mentorEmail: 'sarah.chen@demo.mentee.app',
      daysAgoStart: 60,
      sessionCount: 6,
      messages: [
        ['mentee', 'Sarah, I finally got the Goldman superday invitation! I couldn\'t have done it without your resume and story coaching. Thank you so much.'],
        ['mentor', 'Jacob, that\'s incredible news! Now the real work begins. Superday is 4-6 rounds — mostly technical with some behavioral. Let\'s schedule a mock superday this week.'],
        ['mentee', 'Yes please. I\'m most nervous about the M&A case study. I\'ve done a few practice ones but I still feel slow.'],
        ['mentor', 'That\'s normal. We\'ll drill through 3-4 cases together and I\'ll show you how to structure your thinking so you\'re not starting from scratch each time.'],
      ],
      goals: ['Ace Goldman Sachs superday', 'Master M&A case studies', 'Perfect technical interview responses'],
    },
    {
      menteeEmail: 'maya.thompson@demo.mentee.app',
      mentorEmail: 'natasha.williams@demo.mentee.app',
      daysAgoStart: 50,
      sessionCount: 5,
      messages: [
        ['mentee', 'Natasha, I got through the McKinsey first round! I used your MECE framework and it clicked for the first time. One more round to go.'],
        ['mentor', 'Amazing work Maya! The final round is more of the same but the cases tend to be more ambiguous. Don\'t just solve the problem — show your thinking process.'],
        ['mentee', 'Got it. I also want to make sure my fit stories are strong. The leadership question tripped me up a bit in round 1.'],
        ['mentor', 'Let\'s rework your leadership story using the McKinsey-specific framing. It\'s about enterprise impact, not just team results.'],
      ],
      goals: ['Pass McKinsey final round', 'Develop case interview frameworks', 'Build consulting problem-solving skills'],
    },
    {
      menteeEmail: 'noah.wilson@demo.mentee.app',
      mentorEmail: 'james.okafor@demo.mentee.app',
      daysAgoStart: 40,
      sessionCount: 3,
      messages: [
        ['mentee', 'James, really appreciate you being willing to work with me. As a fellow ACC school alum (Duke not UNC lol) I feel like you get the landscape.'],
        ['mentor', 'Ha! All love for the ACC. Let\'s get you that BCG offer and then we can settle the rivalry. What\'s your weakest case type right now?'],
        ['mentee', 'Profitability cases. I can do market sizing and market entry well, but when I see a P&L I freeze up.'],
        ['mentor', 'That\'s very fixable. Profitability has a simple tree structure — revenue and cost drivers. We\'ll do 3 cases this week focused only on profitability and you\'ll have it down.'],
      ],
      goals: ['Master profitability cases', 'Land BCG offer', 'Build operations sector knowledge'],
    },
    {
      menteeEmail: 'chloe.baker@demo.mentee.app',
      mentorEmail: 'priya.sharma@demo.mentee.app',
      daysAgoStart: 35,
      sessionCount: 3,
      messages: [
        ['mentee', 'Priya, I\'ve been reading your a16z pieces on fintech — your thinking is so clear. I\'d love to learn how you develop an investment thesis from scratch.'],
        ['mentor', 'Chloe, thesis development is all about having a point of view on where the world is going. Let\'s start by picking one sector you know well and build up from there.'],
        ['mentee', 'I\'m really interested in fintech — specifically consumer neobanks. I use Chime and it\'s so much better than traditional banking but I don\'t know how the economics work.'],
        ['mentor', 'Perfect starting point. Next session let\'s do a deep dive on neobank unit economics — CAC, LTV, revenue per account. Once you understand the business model you\'ll see where the opportunity is.'],
      ],
      goals: ['Develop fintech investment thesis', 'Understand VC deal evaluation', 'Land VC internship for summer'],
    },
    {
      menteeEmail: 'liam.scott@demo.mentee.app',
      mentorEmail: 'carlos.reyes@demo.mentee.app',
      daysAgoStart: 25,
      sessionCount: 2,
      messages: [
        ['mentee', 'Carlos! Had my first Stripe screening call today. It went well I think but the system design question caught me off guard. They asked me to design a payment processing system.'],
        ['mentor', 'Classic Stripe question — you\'re going to get that theme in every interview there. The key is talking about idempotency keys, retry logic, and distributed transactions. Did you cover those?'],
        ['mentee', 'I covered idempotency but missed the distributed transaction piece entirely. That hurt.'],
        ['mentor', 'Not fatal — you\'re still in. Next call we\'ll drill payments system design specifically. I\'ll play interviewer and you\'ll walk me through a complete design.'],
      ],
      goals: ['Pass Stripe system design interviews', 'Understand distributed systems patterns', 'Land Stripe SWE offer'],
    },
    {
      menteeEmail: 'ethan.robinson@demo.mentee.app',
      mentorEmail: 'kevin.patel@demo.mentee.app',
      daysAgoStart: 55,
      sessionCount: 5,
      messages: [
        ['mentee', 'Kevin, I wanted to share an update — I just submitted my Google PM application. I tried to frame my internship experiences the way you suggested and I think it reads much better.'],
        ['mentor', 'Great move. For Google PM, the product sense is what separates candidates. They want to see you think about user value first, metrics second, and feasibility third. Make sure that comes through in your essays.'],
        ['mentee', 'Noted. I\'m also preparing for the case interview part. If they ask me to improve Google Maps, where do I start?'],
        ['mentor', 'Start with user segmentation — who uses Maps and what job are they trying to get done? Then identify pain points, then ideate solutions, then prioritize. Never jump to features first.'],
      ],
      goals: ['Land Google PM role', 'Develop product sense frameworks', 'Master PM case interviews'],
    },
  ];

  const createdMentorships: Array<{ mentorshipId: string; menteeId: string; mentorId: string; menteeEmail: string; mentorEmail: string }> = [];

  for (const pair of pairs) {
    const menteeId = menteeProfileMap[pair.menteeEmail];
    const mentorId = mentorProfileMap[pair.mentorEmail];
    if (!menteeId || !mentorId) {
      console.warn(`  Skipping pair ${pair.menteeEmail} → ${pair.mentorEmail} (missing IDs)`);
      continue;
    }

    // Check if request already exists
    const { data: existingReq } = await supabase
      .from('mentorship_requests')
      .select('id')
      .eq('mentee_id', menteeId)
      .eq('mentor_id', mentorId)
      .single();

    let requestId: string;

    if (existingReq) {
      requestId = existingReq.id;
    } else {
      const { data: reqData, error: reqErr } = await supabase
        .from('mentorship_requests')
        .insert({
          mentee_id: menteeId,
          mentor_id: mentorId,
          status: 'approved',
          message: 'Excited to work with you and learn from your experience.',
          goals: pair.goals[0],
          created_at: daysAgo(pair.daysAgoStart + 5),
          updated_at: daysAgo(pair.daysAgoStart + 3),
        })
        .select('id')
        .single();

      if (reqErr || !reqData) {
        console.error(`  Request insert failed for ${pair.menteeEmail}:`, reqErr?.message);
        continue;
      }
      requestId = reqData.id;
    }

    // Check if mentorship already exists
    const { data: existingMs } = await supabase
      .from('mentorships')
      .select('id')
      .eq('mentee_id', menteeId)
      .eq('mentor_id', mentorId)
      .single();

    let mentorshipId: string;

    if (existingMs) {
      mentorshipId = existingMs.id;
    } else {
      const { data: msData, error: msErr } = await supabase
        .from('mentorships')
        .insert({
          request_id: requestId,
          mentee_id: menteeId,
          mentor_id: mentorId,
          sessions_count: pair.sessionCount,
          status: 'active',
          started_at: daysAgo(pair.daysAgoStart),
          created_at: daysAgo(pair.daysAgoStart),
        })
        .select('id')
        .single();

      if (msErr || !msData) {
        console.error(`  Mentorship insert failed:`, msErr?.message);
        continue;
      }
      mentorshipId = msData.id;
    }

    createdMentorships.push({ mentorshipId, menteeId, mentorId, menteeEmail: pair.menteeEmail, mentorEmail: pair.mentorEmail });

    // Create goals
    for (const goalTitle of pair.goals) {
      const { data: existingGoal } = await supabase
        .from('mentorship_goals')
        .select('id')
        .eq('mentorship_id', mentorshipId)
        .eq('title', goalTitle)
        .single();

      if (!existingGoal) {
        await supabase.from('mentorship_goals').insert({
          mentorship_id: mentorshipId,
          created_by: menteeId,
          title: goalTitle,
          description: `A key goal for this mentorship relationship.`,
          status: 'active',
          target_date: new Date(Date.now() + randomBetween(30, 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      }
    }

    // Create messages
    let msgTime = pair.daysAgoStart - 2;
    for (const [sender, content] of pair.messages) {
      const senderId = sender === 'mentee' ? menteeId : mentorId;

      const { data: existingMsg } = await supabase
        .from('messages')
        .select('id')
        .eq('mentorship_id', mentorshipId)
        .eq('sender_id', senderId)
        .eq('content', content)
        .single();

      if (!existingMsg) {
        await supabase.from('messages').insert({
          mentorship_id: mentorshipId,
          sender_id: senderId,
          content,
          is_read: true,
          created_at: hoursAgo(msgTime * 24 - randomBetween(1, 8)),
        });
      }
      msgTime -= randomBetween(1, 3);
    }

    process.stdout.write('✓');
  }
  console.log(`\n✅ ${createdMentorships.length} mentorship relationships created\n`);

  // Create sessions for active mentorships
  console.log('Creating sessions...');

  const sessionTemplates = [
    { type: 'video', status: 'completed', daysOffset: -21, title: 'Kickoff: Goals & roadmap' },
    { type: 'video', status: 'completed', daysOffset: -14, title: 'Technical skills deep dive' },
    { type: 'video', status: 'completed', daysOffset: -7, title: 'Recruiting strategy session' },
    { type: 'video', status: 'scheduled', daysOffset: 7, title: 'Mock interview practice' },
  ];

  for (const ms of createdMentorships) {
    const { data: existingSessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('mentorship_id', ms.mentorshipId);

    if (existingSessions && existingSessions.length > 0) continue;

    for (const tpl of sessionTemplates) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + tpl.daysOffset);

      await supabase.from('sessions').insert({
        mentorship_id: ms.mentorshipId,
        mentor_id: ms.mentorId,
        mentee_id: ms.menteeId,
        scheduled_at: scheduledDate.toISOString(),
        duration_minutes: 45,
        session_type: tpl.type,
        notes: tpl.status === 'completed' ? 'Great session — covered key topics and set clear next steps.' : null,
        status: tpl.status,
        created_at: new Date(scheduledDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    process.stdout.write('✓');
  }
  console.log('\n✅ Sessions created\n');

  // Create pending requests for demo mentor (so the demo inbox looks active)
  console.log('Creating pending requests for demo mentor inbox...');

  const pendingRequesters = [
    { email: 'ava.nguyen@demo.mentee.app', msg: 'Hi Alex! I\'m a junior at UNC Kenan-Flagler targeting IB and ultimately PE. Your path from Goldman to KKR to Blackstone is exactly what I\'m aiming for. Would love your guidance on recruiting strategy and LBO modeling.', goal: 'Land a top BB/EB IB offer' },
    { email: 'luna.rodriguez@demo.mentee.app', msg: 'Hello! I\'m a senior considering Big 4 vs. IB and feeling torn. You\'ve been through both sides — I\'d love to hear your perspective on which path makes more sense for long-term PE positioning.', goal: 'Decide between Big 4 and IB paths' },
    { email: 'jacob.harris@demo.mentee.app', msg: 'Hi Alex, I already have a mentor but I\'d love to also connect with you given your real estate PE background. I\'m specifically interested in REPE as a vertical and would love to learn more about Blackstone\'s approach.', goal: 'Learn about REPE recruiting from Blackstone' },
    { email: 'ben.murphy@demo.mentee.app', msg: 'Hey! I\'m a recent Wake Forest grad working at a regional bank in Charlotte. I want to lateral into IB and eventually PE. Would really appreciate your guidance on how to position myself for this transition.', goal: 'Lateral from regional bank to IB' },
  ];

  for (const req of pendingRequesters) {
    const menteeId = menteeProfileMap[req.email];
    if (!menteeId || !demoMentorId) continue;

    const { data: existing } = await supabase
      .from('mentorship_requests')
      .select('id')
      .eq('mentee_id', menteeId)
      .eq('mentor_id', demoMentorId)
      .single();

    if (!existing) {
      await supabase.from('mentorship_requests').insert({
        mentee_id: menteeId,
        mentor_id: demoMentorId,
        status: 'pending',
        message: req.msg,
        goals: req.goal,
        created_at: daysAgo(randomBetween(1, 5)),
      });
      process.stdout.write('✓');
    } else {
      process.stdout.write('.');
    }
  }
  console.log('\n✅ Pending requests created\n');

  // Create notifications for demo accounts
  console.log('Creating notifications...');

  if (demoMentorId) {
    const notifications = [
      {
        user_id: demoMentorId,
        type: 'request_received',
        title: 'New mentorship request',
        body: 'Ava Nguyen wants to connect with you',
        data: { from_name: 'Ava Nguyen' },
        is_read: false,
        created_at: daysAgo(1),
      },
      {
        user_id: demoMentorId,
        type: 'request_received',
        title: 'New mentorship request',
        body: 'Luna Rodriguez wants to connect with you',
        data: { from_name: 'Luna Rodriguez' },
        is_read: false,
        created_at: daysAgo(2),
      },
      {
        user_id: demoMentorId,
        type: 'new_message',
        title: 'New message from Jordan Taylor',
        body: 'Should I be targeting BB banks or EBs given my background?',
        data: { from_name: 'Jordan Taylor' },
        is_read: true,
        created_at: daysAgo(3),
      },
      {
        user_id: demoMentorId,
        type: 'session_scheduled',
        title: 'Session scheduled',
        body: 'Jordan Taylor booked a session for next week',
        data: { mentee_name: 'Jordan Taylor' } as Record<string, string>,
        is_read: true,
        created_at: daysAgo(5),
      },
    ];

    for (const notif of notifications) {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', notif.user_id)
        .eq('type', notif.type)
        .eq('body', notif.body)
        .single();

      if (!existing) {
        await supabase.from('notifications').insert(notif);
      }
    }
  }

  if (demoMenteeId) {
    const menteeNotifications = [
      {
        user_id: demoMenteeId,
        type: 'request_accepted',
        title: 'Request accepted!',
        body: 'Alex Rivera accepted your mentorship request',
        data: { mentor_name: 'Alex Rivera' },
        is_read: false,
        created_at: daysAgo(1),
      },
      {
        user_id: demoMenteeId,
        type: 'new_message',
        title: 'New message from Alex Rivera',
        body: 'Your profile is strong for EBs given Kenan-Flagler...',
        data: { from_name: 'Alex Rivera' } as Record<string, string>,
        is_read: true,
        created_at: daysAgo(2),
      },
      {
        user_id: demoMenteeId,
        type: 'session_scheduled',
        title: 'Upcoming session reminder',
        body: 'You have a session with Alex Rivera in 2 days',
        data: { mentor_name: 'Alex Rivera' },
        is_read: false,
        created_at: daysAgo(1),
      },
    ];

    for (const notif of menteeNotifications) {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', notif.user_id)
        .eq('type', notif.type)
        .eq('body', notif.body)
        .single();

      if (!existing) {
        await supabase.from('notifications').insert(notif);
      }
    }
  }
  console.log('✅ Notifications created\n');

  console.log('═══════════════════════════════════════════════');
  console.log('🎉 Demo seed complete!\n');
  console.log('Demo accounts:');
  console.log('  Mentor  → mentor@demo.mentee.app / Demo1234!');
  console.log('  Mentee  → mentee@demo.mentee.app / Demo1234!');
  console.log('\nPlatform stats:');
  console.log(`  ${MENTORS.length} mentors across IB, PE, VC, Consulting, Tech, RE`);
  console.log(`  ${MENTEES.length} mentees from top universities`);
  console.log(`  ${pairs.length} active mentorship relationships`);
  console.log(`  ${pairs.length * 4} sessions (mix of completed + upcoming)`);
  console.log(`  ${pairs.reduce((sum, p) => sum + p.messages.length, 0)} realistic messages`);
  console.log('═══════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});
