import { deriveTokens } from '@/lib/theme/derive';
import type { TenantIdentity } from '@/lib/theme/identity';
import type { Workspace } from '@/lib/mentorship/workspace-data';

/**
 * The Carolina preview, as a fixture.
 *
 * WHY THIS IS NOT DATABASE-BACKED, which is the question the brief asked to
 * be answered before any demo row was written:
 *
 *   1. Why would records be necessary?  They would not. The preview exists
 *      so the product experience can be INSPECTED. Every surface it needs is
 *      a pure function of props, so a fixture renders the identical
 *      components with identical code paths. Writing rows would buy nothing
 *      except realism we do not need.
 *   2. Which production queries could include them?  None, because none
 *      exist. This object lives in a module and is never written anywhere.
 *   3. How are they excluded?  There is nothing to exclude. That is the
 *      entire argument for doing it this way: exclusion rules are something
 *      you have to maintain correctly forever, and the one that cannot fail
 *      is the row that was never inserted.
 *   4. Could they affect metrics?  No. cohort metrics read mentorships,
 *      sessions, goals and action_items; none of these are in those tables.
 *   5. Could they enter matching pools?  No, for the same reason.
 *   6. Could they trigger notifications?  No. Notifications are written by
 *      database triggers on real rows.
 *   7. Could they appear in attention queues?  No.
 *   8. How are they reset?  They cannot drift, so there is nothing to reset.
 *
 * So organizations.is_demo is NOT being added. It was proposed in the Pass 1
 * plan and this pass is the point at which it turned out to be unnecessary.
 * A flag that excludes rows from eight query paths is a permanent obligation;
 * a fixture is a file.
 *
 * THE PEOPLE ARE FICTIONAL AND LABELLED AS SUCH. Maya Johnson and Sarah
 * Thompson are not real Carolina students or alumni, no real person's data
 * appears here, and the preview banner says so on every screen.
 */

const CAROLINA_PALETTE = {
  surface: '#FFFFFF',
  ink: '#13294B',
  primary: '#7BAFD4',
  wash: '#F3F8FC',
} as const;

export const CAROLINA_TENANT: TenantIdentity = {
  organizationId: 'preview-carolina',
  legalName: 'University of North Carolina at Chapel Hill',
  displayName: 'Carolina Alumni Mentorship',
  tagline: 'Carolina experience, passed forward.',
  notice:
    'Illustrative Carolina deployment powered by Mentable. Mentable currently has no agreement with UNC-Chapel Hill.',
  programName: 'Finance Access',
  cohortName: 'Cohort 001',
  term: 'Fall 2026',
  palette: { ...CAROLINA_PALETTE },
  tokens: deriveTokens({ ...CAROLINA_PALETTE }),
};

const MAYA = { id: 'preview-maya', first: 'Maya', full: 'Maya Johnson' };
const SARAH = { id: 'preview-sarah', first: 'Sarah', full: 'Sarah Thompson' };

/** Dates relative to now, so the preview never looks stale. */
const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(15, 30, 0, 0);
  return d.toISOString();
};
const dateOnly = (offset: number) => day(offset).slice(0, 10);

/**
 * One relationship, seen from whichever side is being previewed.
 *
 * The same Workspace shape loadWorkspace returns, so the preview renders the
 * real components rather than a mock of them. If the workspace changes, the
 * preview changes with it, which is the only way a preview stays honest.
 */
export function carolinaWorkspace(viewerRole: 'mentor' | 'mentee'): Workspace {
  const viewerIsMentee = viewerRole === 'mentee';
  const viewer = viewerIsMentee ? MAYA : SARAH;
  const partner = viewerIsMentee ? SARAH : MAYA;

  const commitments = [
    {
      id: 'c1', title: 'Research three fixed-income desks', description: null,
      dueDate: dateOnly(3), completedAt: null,
      ownerId: MAYA.id, ownerFirstName: MAYA.first, mine: viewer.id === MAYA.id,
      createdAt: day(-7),
    },
    {
      id: 'c2', title: 'Send recommended markets reading', description: null,
      dueDate: dateOnly(7), completedAt: null,
      ownerId: SARAH.id, ownerFirstName: SARAH.first, mine: viewer.id === SARAH.id,
      createdAt: day(-7),
    },
    {
      id: 'c3', title: 'Reach out to two people on the markets desk', description: null,
      dueDate: dateOnly(-2), completedAt: day(-3),
      ownerId: MAYA.id, ownerFirstName: MAYA.first, mine: viewer.id === MAYA.id,
      createdAt: day(-21),
    },
  ];

  const menteePrep = {
    focus: 'Choosing between investment banking and markets.',
    changed: 'I spoke to two people on the markets desk and it shifted how I am thinking about the trade-off.',
    questions: [
      'How did you decide which side of Markets suited you?',
      'What should I understand before recruiting begins?',
      'What would you focus on during sophomore year?',
    ],
  };

  return {
    mentorshipId: 'preview',
    viewerId: viewer.id,
    viewerRole,
    viewerFirstName: viewer.first,
    viewerFullName: viewer.full,
    partner: {
      id: partner.id,
      firstName: partner.first,
      fullName: partner.full,
      avatarUrl: null,
      headline: viewerIsMentee ? 'Managing Director, Markets' : 'Junior · Economics',
      role: viewerIsMentee ? 'Managing Director · Markets' : 'Junior · Economics',
      company: viewerIsMentee ? null : null,
      education: viewerIsMentee ? "Carolina '08" : "Carolina '28",
      canHelpWith: viewerIsMentee
        ? ['Markets recruiting', 'Sales and trading', 'Early career decisions']
        : [],
    },
    startedAt: day(-28),
    reason: 'Working out which side of finance to recruit for.',
    tenant: CAROLINA_TENANT,
    goals: [
      {
        id: 'g1',
        title: 'Understand Markets recruiting',
        description: 'Get a clear understanding of Sales, Trading, and Strategy before recruiting.',
        status: 'active',
        targetDate: null,
        completedAt: null,
        createdAt: day(-24),
        // A SMART goal in the preview, so the label and the breakdown are
        // both visible in the Carolina walkthrough.
        smart: {
          specific: 'Understand how Markets recruiting actually works',
          measurable: 'I can explain the difference between Sales, Trading and Strategy, and I’ve spoken to someone in each',
          achievable: 'Sarah can introduce me to two people, and I have time before recruiting opens',
          relevant: 'I have to choose a track before applications open and I don’t want to guess',
          timebound: dateOnly(60),
        },
        mine: viewerRole === 'mentee',
        relatedOpen: 2,
      },
    ],
    commitments,
    conversations: [
      {
        id: 's1',
        at: day(-14),
        status: 'completed',
        recap: 'Discussed Markets recruiting, Sarah’s career path, and Maya’s interests.',
        notes: null,
        commitmentsCreated: 2,
        ordinal: 1,
      },
    ],
    next: {
      id: 'preview-session',
      at: day(5),
      durationMinutes: 45,
      videoLink: 'https://meet.google.com/illustrative-preview',
      timeZone: 'America/New_York',
      meetingProvider: 'google_meet',
      location: null,
      viewerIsOrganizer: viewerRole === 'mentee',
      syncStatus: 'synced',
      inviteStatus: 'sent',
      menteePrep,
      // Private to the mentor, exactly as in the real loader.
      mentorNotes: viewerRole === 'mentor'
        ? 'Two desks worth mentioning. Ask what she actually enjoyed about the markets conversations.'
        : null,
      viewerPrepared: viewerRole === 'mentee',
    },
    timeline: [
      { at: day(-28), label: 'Mentorship began', detail: null },
      { at: day(-24), label: 'Started working toward understand markets recruiting', detail: null },
      { at: day(-14), label: 'First conversation', detail: '2 commitments created' },
      { at: day(-3), label: 'Maya completed “Reach out to two people on the markets desk”', detail: null },
    ],
    // Not used by the preview: next-action is only called on real data.
    relationship: {
      mentorshipId: 'preview',
      person: { id: partner.id, firstName: partner.first, fullName: partner.full, avatarUrl: null, headline: null },
      startedAt: day(-28),
      reason: null,
      goals: [],
      openForThem: [], openForMine: [], finishedSinceLastSession: [], finishedUnshared: [],
      lastSession: null, nextSession: null, openPastSession: null, lastMessage: null,
      prepared: false, reflected: false, quietDays: 0, neverMessaged: false,
    },
  };
}
