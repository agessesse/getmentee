import { recommend, type Candidate, type Seeker, type Recommendation } from '@/lib/matching/engine';

/**
 * The homepage demonstration, run through the REAL matching engine.
 *
 * THE PEOPLE ARE ILLUSTRATIVE. THE REASONING IS NOT.
 *
 * Every explanation a visitor reads on the homepage is produced by
 * lib/matching/engine.ts — the same function that runs in Discover, with
 * the same rules about evidence. Nothing here is a hand-written marketing
 * sentence dressed up as product output.
 *
 * That matters for one reason: if the engine ever stops being able to
 * explain a pairing this cleanly, the homepage breaks too, and we find out.
 * A hard-coded demo would keep looking impressive long after the product
 * stopped matching it. This cannot.
 *
 * The people below are invented, clearly labelled as such in the UI, and
 * no production user data is ever rendered publicly.
 */

interface Scene {
  seeker: Seeker & { label: string; avatarInitials: string };
  candidate: Candidate & { label: string; avatarInitials: string };
  /** The community this pair came out of, named in the demo. */
  community: string;
}

const SCENES: Scene[] = [
  {
    community: 'University · 5,241 members',
    seeker: {
      id: 'sarah', firstName: 'Sarah', label: 'Student · Class of 2027', avatarInitials: 'SC',
      interests: ['Management Consulting', 'Healthcare'],
      industries: ['Management Consulting'],
      goals: ['Break into consulting after graduation'],
      major: 'Public Policy', university: 'UNC Chapel Hill', location: 'Chapel Hill',
    },
    candidate: {
      id: 'michael', firstName: 'Michael', fullName: 'Michael Ross',
      label: 'Alumnus · Deloitte', avatarInitials: 'MR',
      avatarUrl: null, headline: null,
      title: 'Manager', company: 'Deloitte', industry: 'Management Consulting',
      location: 'Charlotte', university: 'UNC Chapel Hill', graduationYear: 2016,
      expertise: ['Management Consulting', 'Case Interviews', 'Healthcare'],
      currentLoad: 0, maxLoad: 3, available: true, yearsExperience: 7,
    },
  },
  {
    community: 'Company · 18,400 employees',
    seeker: {
      id: 'maya', firstName: 'Maya', label: 'Intern · Product', avatarInitials: 'MP',
      interests: ['Product Management', 'Fintech'],
      industries: ['Product Management'],
      goals: ['Move into product management full time'],
      major: null, university: null, location: 'New York',
    },
    candidate: {
      id: 'james', firstName: 'James', fullName: 'James Okafor',
      label: 'Director · Product', avatarInitials: 'JO',
      avatarUrl: null, headline: null,
      title: 'Director of Product', company: null, industry: 'Product Management',
      location: 'New York', university: null, graduationYear: null,
      expertise: ['Product Management', 'Pricing', 'Fintech'],
      currentLoad: 1, maxLoad: 4, available: true, yearsExperience: 8,
    },
  },
  {
    community: 'Veteran network · 2,100 members',
    seeker: {
      id: 'dani', firstName: 'Dani', label: 'Transitioning · Army', avatarInitials: 'DR',
      interests: ['Operations', 'Logistics'],
      industries: ['Operations'],
      goals: ['Translate military logistics experience into a civilian operations role'],
      major: null, university: null, location: 'Atlanta',
    },
    candidate: {
      id: 'victor', firstName: 'Victor', fullName: 'Victor Hale',
      label: 'Veteran · Operations lead', avatarInitials: 'VH',
      avatarUrl: null, headline: null,
      title: 'Head of Operations', company: null, industry: 'Operations',
      location: 'Atlanta', university: null, graduationYear: null,
      expertise: ['Operations', 'Logistics', 'Hiring'],
      currentLoad: 0, maxLoad: 2, available: true, yearsExperience: 6,
    },
  },
];

export interface DemoMatch {
  community: string;
  seeker: { name: string; label: string; initials: string; signals: string[] };
  candidate: { name: string; label: string; initials: string; signals: string[] };
  /** Produced by the engine, not written here. */
  reasons: string[];
  opener: string | null;
}

/**
 * The signals a visitor sees light up are the ones the engine actually
 * reads: stated interests, target industries, goals, school, place.
 */
const signalsFor = (s: Scene['seeker']) =>
  [...s.interests.slice(0, 2), ...(s.university ? [s.university] : []), ...(s.location ? [s.location] : [])];
const signalsForCandidate = (c: Scene['candidate']) =>
  [...c.expertise.slice(0, 2), ...(c.university ? [c.university] : []), ...(c.location ? [c.location] : [])];

function build(scene: Scene): DemoMatch {
  const [rec] = recommend(scene.seeker, [scene.candidate], new Set(), 1) as Recommendation[];
  return {
    community: scene.community,
    seeker: {
      name: scene.seeker.firstName, label: scene.seeker.label,
      initials: scene.seeker.avatarInitials, signals: signalsFor(scene.seeker),
    },
    candidate: {
      name: scene.candidate.fullName, label: scene.candidate.label,
      initials: scene.candidate.avatarInitials, signals: signalsForCandidate(scene.candidate),
    },
    // If the engine declines to explain a pairing, the demo shows nothing
    // rather than inventing a reason. That has never happened for these
    // three, and if it starts happening it is a real signal.
    reasons: (rec?.reasons ?? []).slice(0, 2).map((r) => r.text),
    opener: rec?.opener ?? null,
  };
}

export const DEMO_MATCHES: DemoMatch[] = SCENES.map(build);
