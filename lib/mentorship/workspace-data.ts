import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { resolveParticipantContext } from '@/lib/theme/resolve';
import type { TenantIdentity } from '@/lib/theme/identity';
import type { Relationship, Person, Commitment, Goal } from '@/lib/mentorship/next-action';

/**
 * Everything one mentorship needs, composed from tables that already exist.
 *
 * AUTHORIZATION IS THE DATABASE'S JOB HERE, and that is deliberate.
 *
 * This loader uses the USER-SCOPED client, not the service role. Every table
 * it reads carries an RLS policy of the form "Parties can read their X",
 * scoped to mentorships.mentor_id / mentee_id. So a platform admin, an
 * organisation owner or a programme admin asking for a mentorship they are
 * not in gets zero rows back from Postgres. Not from an `if` in this file:
 * from the database.
 *
 * That is the whole answer to "organisations should know whether mentorship
 * is working, not read the mentorship". Administering the programme that
 * created a relationship confers no row-level access to it, and there is no
 * code path here that could accidentally grant one, because the privileged
 * client is never constructed.
 *
 * The explicit participation check below is for the ERROR MESSAGE, not for
 * the security. It lets a non-participant get a clean "not found" instead of
 * a page rendering with every section mysteriously empty.
 *
 * NO NEW TABLES. mentorships, sessions, mentorship_goals, action_items,
 * profiles, mentor_profiles, cohorts, programs, organizations. The only
 * schema change in this pass is sessions.prep (0032).
 */

export type WorkspaceFailure =
  | { ok: false; reason: 'unauthenticated' }
  | { ok: false; reason: 'not_found' };

export interface PartnerDetail extends Person {
  /** "Managing Director · Markets" */
  role: string | null;
  company: string | null;
  /** "Carolina '08" */
  education: string | null;
  canHelpWith: string[];
}

export interface WorkspaceGoal extends Goal {
  description: string | null;
  completedAt: string | null;
  createdAt: string;
  /** The optional SMART breakdown, as stored. */
  smart: Record<string, string> | null;
  /** Whether the viewer may edit it. RLS enforces this; the UI reflects it. */
  mine: boolean;
  /** Commitments created for this goal's relationship, still open. */
  relatedOpen: number;
}

export interface WorkspaceCommitment extends Commitment {
  description: string | null;
  ownerId: string;
  ownerFirstName: string;
  mine: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  at: string;
  status: string;
  /** The mentor's written recap, if there is one. */
  recap: string | null;
  notes: string | null;
  commitmentsCreated: number;
  ordinal: number;
}

export interface PrepFields {
  focus: string | null;
  changed: string | null;
  questions: string[];
}

export interface NextConversation {
  id: string;
  at: string;
  durationMinutes: number;
  /** The join URL, from the calendar provider or entered by hand. */
  videoLink: string | null;
  /** IANA zone the organiser chose, so it renders in their intent. */
  timeZone: string | null;
  meetingProvider: 'google_meet' | 'teams' | 'in_person' | 'other' | null;
  location: string | null;
  /** True when the viewer created it and therefore owns the calendar event. */
  viewerIsOrganizer: boolean;
  /** Whether the external event still matches this row. */
  syncStatus: string;
  inviteStatus: string;
  /** The mentee's shared preparation. Visible to both, by design. */
  menteePrep: PrepFields;
  /** The mentor's private notes. NULL unless the viewer is the mentor. */
  mentorNotes: string | null;
  /** Whether the VIEWER has prepared. */
  viewerPrepared: boolean;
}

export interface TimelineEvent {
  at: string;
  label: string;
  detail: string | null;
}

export interface Workspace {
  mentorshipId: string;
  viewerId: string;
  viewerRole: 'mentor' | 'mentee';
  viewerFirstName: string;
  /** Both sides of the pairing are named the same way in the header. */
  viewerFullName: string;
  partner: PartnerDetail;
  startedAt: string;
  /** What the mentee originally asked for. */
  reason: string | null;
  /** Programme identity, or null for an individual relationship. */
  tenant: TenantIdentity | null;
  goals: WorkspaceGoal[];
  commitments: WorkspaceCommitment[];
  conversations: Conversation[];
  next: NextConversation | null;
  timeline: TimelineEvent[];
  /** Shaped for next-action.ts, so that logic is reused rather than rebuilt. */
  relationship: Relationship;
}

const DAY = 86_400_000;

/** A session row, as selected below. */
interface SessionRow {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  notes: string | null;
  video_link: string | null;
  mentor_recap: string | null;
  prep_mentee: string | null;
  prep_mentor: string | null;
  prep: unknown;
  time_zone: string | null;
  meeting_provider: string | null;
  location: string | null;
  organizer_id: string | null;
  sync_status: string;
  invite_status: string;
}

/**
 * Read the structured prep half, falling back to the legacy TEXT column.
 *
 * 0032 added sessions.prep but did not backfill, so a session prepared before
 * this pass has prose in prep_mentee and nothing in prep. That prose is a
 * person's actual words and still displays, as the focus line.
 */
function readMenteePrep(row: SessionRow): PrepFields {
  const p = (row.prep as { mentee?: { focus?: string; changed?: string; questions?: unknown } } | null)?.mentee;
  const questions = Array.isArray(p?.questions)
    ? (p!.questions as unknown[]).filter((q): q is string => typeof q === 'string' && q.trim() !== '')
    : [];
  return {
    focus: p?.focus?.trim() || row.prep_mentee?.trim() || null,
    changed: p?.changed?.trim() || null,
    questions,
  };
}

function readMentorNotes(row: SessionRow): string | null {
  const p = (row.prep as { mentor?: { notes?: string } } | null)?.mentor;
  return p?.notes?.trim() || row.prep_mentor?.trim() || null;
}

function hasPrep(f: PrepFields): boolean {
  return Boolean(f.focus || f.changed || f.questions.length);
}

export async function loadWorkspace(
  mentorshipId: string,
): Promise<({ ok: true } & Workspace) | WorkspaceFailure> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'unauthenticated' };

  /*
    RLS on mentorships is "Parties can read their mentorships", so a
    non-participant gets no row here regardless of any other authority they
    hold. The id comparison below is belt and braces, and also tells us which
    side of the relationship the viewer is on.
  */
  const { data: ms } = await supabase
    .from('mentorships')
    .select('id, mentee_id, mentor_id, started_at, created_at, status, cohort_id, request_id')
    .eq('id', mentorshipId)
    .maybeSingle();

  if (!ms) return { ok: false, reason: 'not_found' };

  const viewerIsMentor = ms.mentor_id === user.id;
  const viewerIsMentee = ms.mentee_id === user.id;
  if (!viewerIsMentor && !viewerIsMentee) return { ok: false, reason: 'not_found' };

  const viewerRole: 'mentor' | 'mentee' = viewerIsMentor ? 'mentor' : 'mentee';
  const partnerId = viewerIsMentor ? ms.mentee_id : ms.mentor_id;

  const [
    { data: people },
    { data: mentorProfile },
    { data: goalRows },
    { data: itemRows },
    { data: sessionRows },
    { data: requestRow },
    { data: messageRows },
  ] = await Promise.all([
    supabase
      .from('public_profiles')
      .select('id, first_name, last_name, avatar_url, headline, university, graduation_year')
      .in('id', [partnerId, user.id]),
    supabase
      .from('mentor_profiles')
      .select('title, company, industry, can_help_with, expertise_tags')
      .eq('id', ms.mentor_id)
      .maybeSingle(),
    supabase
      .from('mentorship_goals')
      .select('id, title, description, status, target_date, completed_at, created_at, created_by, smart')
      .eq('mentorship_id', mentorshipId)
      .order('created_at', { ascending: true }),
    supabase
      .from('action_items')
      .select('id, title, description, assigned_to, due_date, is_completed, completed_at, created_at, session_id')
      .eq('mentorship_id', mentorshipId)
      .order('created_at', { ascending: true }),
    supabase
      .from('sessions')
      .select('id, scheduled_at, duration_minutes, status, notes, video_link, mentor_recap, prep_mentee, prep_mentor, prep, time_zone, meeting_provider, location, organizer_id, sync_status, invite_status')
      .eq('mentorship_id', mentorshipId)
      .order('scheduled_at', { ascending: true }),
    ms.request_id
      ? supabase.from('mentorship_requests').select('goals').eq('id', ms.request_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('messages')
      .select('sender_id, content, created_at')
      .eq('mentorship_id', mentorshipId)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  const partnerRow = byId.get(partnerId);
  const viewerRow = byId.get(user.id);

  const partnerName = [partnerRow?.first_name, partnerRow?.last_name].filter(Boolean).join(' ') || 'Your partner';

  /*
    The header's two supporting lines. Only built for the mentor, because
    "Managing Director · Markets" is a fact about the person giving advice;
    the equivalent for a student is their year, which is on the profile line
    already. Each is null when the underlying field is missing, and the header
    renders nothing rather than an empty bullet.
  */
  const partnerIsMentor = partnerId === ms.mentor_id;
  const roleLine = partnerIsMentor
    ? [mentorProfile?.title, mentorProfile?.industry].filter(Boolean).join(' · ') || null
    : partnerRow?.headline ?? null;
  const education = partnerRow?.university
    ? `${partnerRow.university}${partnerRow.graduation_year ? ` '${String(partnerRow.graduation_year).slice(-2)}` : ''}`
    : null;

  const partner: PartnerDetail = {
    id: partnerId,
    firstName: partnerRow?.first_name ?? 'Your partner',
    fullName: partnerName,
    avatarUrl: partnerRow?.avatar_url ?? null,
    headline: partnerRow?.headline ?? null,
    role: roleLine,
    company: partnerIsMentor ? mentorProfile?.company ?? null : null,
    education,
    canHelpWith: partnerIsMentor
      ? ((mentorProfile?.can_help_with ?? mentorProfile?.expertise_tags ?? []) as string[]).slice(0, 4)
      : [],
  };

  const now = Date.now();
  const sessions = (sessionRows ?? []) as SessionRow[];
  const past = sessions.filter((s) => new Date(s.scheduled_at).getTime() <= now);
  const held = past.filter((s) => s.status === 'completed');
  const upcoming = sessions.filter(
    (s) => new Date(s.scheduled_at).getTime() > now && s.status !== 'cancelled',
  );
  // Past conversations exclude cancellations too: a meeting that did not
  // happen is not part of "where have we been".
  const nextRow = upcoming[0] ?? null;
  const lastHeld = held[held.length - 1] ?? null;
  // A past conversation still marked scheduled: somebody has to close it out.
  const openPast = past.find((s) => s.status === 'scheduled') ?? null;

  const items = itemRows ?? [];
  const commitmentsCreatedBySession = new Map<string, number>();
  for (const it of items) {
    if (it.session_id) {
      commitmentsCreatedBySession.set(it.session_id, (commitmentsCreatedBySession.get(it.session_id) ?? 0) + 1);
    }
  }

  const openItems = items.filter((i) => !i.is_completed);
  const commitments: WorkspaceCommitment[] = items.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description ?? null,
    dueDate: i.due_date ?? null,
    completedAt: i.completed_at ?? null,
    ownerId: i.assigned_to,
    ownerFirstName: byId.get(i.assigned_to)?.first_name ?? 'Someone',
    mine: i.assigned_to === user.id,
    createdAt: i.created_at,
  }));

  const goals: WorkspaceGoal[] = (goalRows ?? []).map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description ?? null,
    status: g.status as Goal['status'],
    targetDate: g.target_date ?? null,
    completedAt: g.completed_at ?? null,
    createdAt: g.created_at,
    smart: (g.smart as Record<string, string> | null) ?? null,
    mine: g.created_by === user.id,
    relatedOpen: 0,
  }));
  /*
    No goal_id on action_items, and this pass is not adding one. So the count
    shown beside a goal is the relationship's open commitments, and it is
    attached only when there is exactly one active goal, where the
    association is unambiguous. Anywhere else it would be a guess dressed up
    as a fact.
  */
  const activeGoals = goals.filter((g) => g.status === 'active');
  if (activeGoals.length === 1) activeGoals[0].relatedOpen = openItems.length;

  const conversations: Conversation[] = past
    .filter((s) => s.status !== 'cancelled')
    .slice()
    .reverse()
    .map((s, idx) => ({
      id: s.id,
      at: s.scheduled_at,
      status: s.status,
      recap: s.mentor_recap?.trim() || null,
      notes: s.notes?.trim() || null,
      commitmentsCreated: commitmentsCreatedBySession.get(s.id) ?? 0,
      ordinal: past.length - idx,
    }));

  let next: NextConversation | null = null;
  if (nextRow) {
    const menteePrep = readMenteePrep(nextRow);
    const mentorNotes = readMentorNotes(nextRow);
    next = {
      id: nextRow.id,
      at: nextRow.scheduled_at,
      durationMinutes: nextRow.duration_minutes ?? 60,
      videoLink: nextRow.video_link ?? null,
      timeZone: nextRow.time_zone ?? null,
      meetingProvider: (nextRow.meeting_provider as NextConversation['meetingProvider']) ?? null,
      location: nextRow.location ?? null,
      viewerIsOrganizer: nextRow.organizer_id === user.id,
      syncStatus: nextRow.sync_status ?? 'none',
      inviteStatus: nextRow.invite_status ?? 'none',
      menteePrep,
      /*
        STRIPPED FOR THE MENTEE. Both parties can SELECT the session row, so
        this filter is what keeps a mentor's private notes private. The
        mentee's half is not stripped for the mentor: sharing what you want
        help with is the entire point of preparing.
      */
      mentorNotes: viewerIsMentor ? mentorNotes : null,
      viewerPrepared: viewerIsMentor ? Boolean(mentorNotes) : hasPrep(menteePrep),
    };
  }

  const lastMessageRow = (messageRows ?? [])[0] ?? null;

  // ── Shape for next-action.ts ──────────────────────────────────────────────
  // The trusted logic takes a Relationship; building one here means the
  // workspace's dominant action is decided by the same 36-state function the
  // dashboard uses, rather than by a second opinion written next to it.
  const toCommitment = (i: typeof items[number]): Commitment => ({
    id: i.id, title: i.title, dueDate: i.due_date ?? null, completedAt: i.completed_at ?? null,
  });
  const lastSessionAt = lastHeld ? new Date(lastHeld.scheduled_at).getTime() : 0;
  const lastActivity = Math.max(
    lastSessionAt,
    lastMessageRow ? new Date(lastMessageRow.created_at).getTime() : 0,
  );

  const relationship: Relationship = {
    mentorshipId: ms.id,
    person: { id: partner.id, firstName: partner.firstName, fullName: partner.fullName, avatarUrl: partner.avatarUrl, headline: partner.headline },
    startedAt: ms.started_at ?? ms.created_at,
    reason: (requestRow as { goals?: string | null } | null)?.goals ?? null,
    goals: goals.map((g) => ({ id: g.id, title: g.title, status: g.status, targetDate: g.targetDate })),
    openForThem: openItems.filter((i) => i.assigned_to !== user.id).map(toCommitment),
    openForMine: openItems.filter((i) => i.assigned_to === user.id).map(toCommitment),
    finishedSinceLastSession: items
      .filter((i) => i.is_completed && i.completed_at && new Date(i.completed_at).getTime() > lastSessionAt)
      .map(toCommitment),
    finishedUnshared: items
      .filter((i) => i.is_completed && i.assigned_to === user.id && i.completed_at &&
        new Date(i.completed_at).getTime() > (lastMessageRow ? new Date(lastMessageRow.created_at).getTime() : 0))
      .map(toCommitment),
    lastSession: lastHeld ? { id: lastHeld.id, at: lastHeld.scheduled_at } : null,
    nextSession: nextRow ? { id: nextRow.id, at: nextRow.scheduled_at } : null,
    openPastSession: openPast ? { id: openPast.id, at: openPast.scheduled_at } : null,
    lastMessage: lastMessageRow
      ? { fromMe: lastMessageRow.sender_id === user.id, content: lastMessageRow.content, at: lastMessageRow.created_at }
      : null,
    prepared: next?.viewerPrepared ?? false,
    reflected: Boolean(lastHeld?.mentor_recap),
    quietDays: lastActivity ? Math.floor((now - lastActivity) / DAY) : Math.floor((now - new Date(ms.started_at ?? ms.created_at).getTime()) / DAY),
    neverMessaged: !lastMessageRow,
  };

  /*
    The timeline is DERIVED, not stored. Every entry below is a timestamp
    that already exists on a row somebody wrote; nothing was added to the
    schema to support it, which is what the brief asked. Only events that
    mean something to the two people are included, so this stays a short
    history and never becomes an activity feed.
  */
  const timeline: TimelineEvent[] = [
    { at: relationship.startedAt, label: 'Mentorship began', detail: null },
    ...goals.map((g) => ({ at: g.createdAt, label: `Started working toward ${g.title.toLowerCase()}`, detail: null })),
    ...goals.filter((g) => g.completedAt).map((g) => ({ at: g.completedAt!, label: `Reached ${g.title.toLowerCase()}`, detail: null })),
    ...conversations.map((c) => ({
      at: c.at,
      label: c.ordinal === 1 ? 'First conversation' : `Conversation ${c.ordinal}`,
      detail: c.commitmentsCreated ? `${c.commitmentsCreated} commitment${c.commitmentsCreated === 1 ? '' : 's'} created` : null,
    })),
    ...commitments.filter((c) => c.completedAt).map((c) => ({
      at: c.completedAt!,
      label: `${c.ownerFirstName} completed “${c.title}”`,
      detail: null,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  const tenant = ms.cohort_id ? await resolveParticipantContext(user.id) : null;

  return {
    ok: true,
    mentorshipId: ms.id,
    viewerId: user.id,
    viewerRole,
    viewerFirstName: viewerRow?.first_name ?? '',
    viewerFullName: [viewerRow?.first_name, viewerRow?.last_name].filter(Boolean).join(' ') || (viewerRow?.first_name ?? 'You'),
    partner,
    startedAt: relationship.startedAt,
    reason: relationship.reason,
    tenant,
    goals,
    commitments,
    conversations,
    next,
    timeline,
    relationship,
  };
}
