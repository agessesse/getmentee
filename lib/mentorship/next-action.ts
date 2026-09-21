/**
 * What Mentable thinks you should do next, and what needs you right now.
 *
 * Plain, deterministic product logic over state the app already reads. No
 * scoring, no model, no hidden ranking: every branch below can be read top to
 * bottom and matched against what a person would actually see. The same module
 * serves both roles so the two dashboards can never drift apart.
 *
 * Two rules shape all of it:
 *   Urgency only where urgency exists. If nothing needs a person, the "now"
 *   list is empty and the dashboard is quiet. That is a success state.
 *   No guilt. Nothing here counts what someone failed to do, and nothing is
 *   phrased as a debt.
 */

export interface Person {
  id: string;
  firstName: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
}

export interface Commitment {
  id: string;
  title: string;
  dueDate: string | null;
  completedAt?: string | null;
}

export interface Goal {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'cancelled';
  targetDate: string | null;
}

export interface SessionRef {
  id: string;
  at: string;
}

/** One mentoring relationship, from the point of view of whoever is looking. */
export interface Relationship {
  mentorshipId: string;
  person: Person;
  startedAt: string;
  /** What they originally came for, from the request that started it. */
  reason: string | null;
  goals: Goal[];
  /** Open commitments belonging to the other person. */
  openForThem: Commitment[];
  /** Open commitments belonging to me. */
  openForMine: Commitment[];
  /** Anything finished since the last conversation. */
  finishedSinceLastSession: Commitment[];
  /** Mine, finished since I last wrote to them: worth telling them about. */
  finishedUnshared: Commitment[];
  lastSession: SessionRef | null;
  nextSession: SessionRef | null;
  /** A past session still marked scheduled: it needs closing out. */
  openPastSession: SessionRef | null;
  lastMessage: { fromMe: boolean; content: string; at: string } | null;
  /** Have I written anything in my private notebook for the next session? */
  prepared: boolean;
  /** Did I reflect after the last one? */
  reflected: boolean;
  /** Days since the last message or conversation, whichever is later. */
  quietDays: number;
  /** True while no message has ever been sent in this mentorship. */
  neverMessaged: boolean;
}

export interface MenteeState {
  relationships: Relationship[];
  pendingRequests: { id: string; mentorName: string; createdAt: string }[];
  savedMentors: number;
  /** Mentors with an account, who can actually receive a request today. */
  contactableMentors: number;
}

export interface MentorState {
  /** The mentor's own id, so "preview your profile" can point at it. */
  mentorId: string;
  relationships: Relationship[];
  pendingRequests: { id: string; menteeName: string; goals: string | null; createdAt: string }[];
  hasAvailability: boolean;
  isNew: boolean;
}

/** A short lesson, shown where it becomes useful. */
export interface LearnRef {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
}

export interface NextAction {
  key: string;
  /** Written as a sentence about the relationship, not about the software. */
  headline: string;
  why?: string;
  cta: string;
  href: string;
  secondary?: { label: string; href: string };
  learn?: LearnRef;
}

export type NowKind = 'message' | 'session' | 'request' | 'wrapup' | 'commitment' | 'setup' | 'accepted';

export interface NowItem {
  key: string;
  kind: NowKind;
  person: Person | null;
  title: string;
  detail: string | null;
  cta: string;
  href: string;
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

const HOUR = 3600_000;
const DAY = 24 * HOUR;

const msUntil = (iso: string, now: number) => new Date(iso).getTime() - now;
const daysUntil = (iso: string, now: number) => Math.round(msUntil(iso, now) / DAY);

export function whenPhrase(iso: string, now = Date.now()): string {
  const d = new Date(iso);
  const today = new Date(now);
  const tomorrow = new Date(now + DAY);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `today at ${time}`;
  if (d.toDateString() === tomorrow.toDateString()) return `tomorrow at ${time}`;
  return `${d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${time}`;
}

const excerpt = (t: string, max = 90) => {
  const s = t.replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

// ─── Lessons, at the moment they help ─────────────────────────────────────────

export const LEARN = {
  firstMessage: {
    title: 'Not sure what to say?',
    body: 'Thank them for saying yes, say what you’re hoping to learn, and offer a couple of times to talk. Two or three sentences is plenty.',
    href: '/networking#message',
    linkLabel: 'How to write the first message',
  },
  waiting: {
    title: 'While you wait',
    body: 'People are busy, and a few days is normal. Don’t send a second message yet. Use the time to read up on them and write down what you want to ask.',
    href: '/networking#research',
    linkLabel: 'How to prepare',
  },
  prepare: {
    title: 'Bring three to five questions',
    body: 'Know what you want to leave understanding, and put your most important question first.',
    href: '/networking#preparing',
    linkLabel: 'How to prepare for a conversation',
  },
  coffeeChat: {
    title: 'What happens in a first conversation',
    body: 'Usually 15 to 30 minutes. You introduce yourself briefly, then mostly listen and ask questions. It isn’t an interview.',
    href: '/networking#conversation',
    linkLabel: 'How the conversation goes',
  },
  afterConversation: {
    title: 'While it’s fresh',
    body: 'Write down what you learned and what you said you’d do, then send a short thank-you within a day that mentions something specific.',
    href: '/networking#follow-up',
    linkLabel: 'Following up well',
  },
  update: {
    title: 'Make it an update, not a check-in',
    body: 'Say what you did since you spoke, what happened, and what’s next. That’s the part mentors rarely get to see.',
    href: '/networking#staying',
    linkLabel: 'Staying in touch',
  },
  reviewRequest: {
    title: 'Reading a request',
    body: 'Look at what they want to develop and whether you can genuinely help. Polish and prestige matter less than fit.',
    href: '/guide#mentor',
    linkLabel: 'Your first conversation',
  },
  availability: {
    title: 'Why this matters',
    body: 'Students can only book time inside the windows you set. Without them, they have to ask and wait.',
    href: '/guide#mentor',
    linkLabel: 'Mentorship Guide',
  },
} as const satisfies Record<string, LearnRef>;

// ─── Mentee ───────────────────────────────────────────────────────────────────

/**
 * Everything that genuinely needs this person, most time-bound first.
 *
 * Returns the full list. The dashboard removes whatever the next-action card
 * is already showing and then caps what is left — capping here instead used to
 * throw away an overdue commitment to make room for an item that was about to
 * be de-duplicated away anyway.
 */
export function menteeNow(s: MenteeState, now = Date.now()): NowItem[] {
  const items: NowItem[] = [];

  for (const r of s.relationships) {
    if (r.neverMessaged && r.lastMessage === null) {
      items.push({
        key: `start-${r.mentorshipId}`, kind: 'accepted', person: r.person,
        title: `${r.person.firstName} accepted your request`,
        detail: 'Say hello and tell them what you’re hoping to learn.',
        cta: 'Start the conversation', href: `/messages?mentorshipId=${r.mentorshipId}`,
      });
    }
  }
  for (const r of s.relationships) {
    if (r.nextSession && msUntil(r.nextSession.at, now) <= 2 * DAY && msUntil(r.nextSession.at, now) > -HOUR) {
      items.push({
        key: `soon-${r.nextSession.id}`, kind: 'session', person: r.person,
        title: `Your conversation with ${r.person.firstName} is ${whenPhrase(r.nextSession.at, now)}`,
        detail: r.prepared ? 'Your notes are ready. Worth a last look.' : 'Take a few minutes to get ready.',
        cta: r.prepared ? 'Open your prep' : 'Prepare', href: `/sessions/${r.nextSession.id}`,
      });
    }
  }
  // Late or nearly-due commitments sit with the clock, not at the bottom: a
  // promise that has already passed its date is the most time-bound thing on
  // the page after a conversation that is about to start.
  for (const r of s.relationships) {
    const due = r.openForMine.find((c) => c.dueDate && daysUntil(c.dueDate, now) <= 3);
    if (due) {
      const late = daysUntil(due.dueDate!, now) < 0;
      const when = new Date(`${due.dueDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      items.push({
        key: `due-${due.id}`, kind: 'commitment', person: r.person,
        title: `“${due.title}”`,
        detail: late
          ? `You said you'd do this by ${when}. Still worth doing, or worth telling ${r.person.firstName} it changed.`
          : `You said you'd do this by ${when}.`,
        cta: 'Open', href: r.nextSession ? `/sessions/${r.nextSession.id}` : '/goals',
      });
    }
  }

  for (const r of s.relationships) {
    if (r.lastMessage && !r.lastMessage.fromMe) {
      items.push({
        key: `reply-${r.mentorshipId}`, kind: 'message', person: r.person,
        title: `${r.person.firstName} replied`,
        detail: `“${excerpt(r.lastMessage.content)}”`,
        cta: 'Read and reply', href: `/messages?mentorshipId=${r.mentorshipId}`,
      });
    }
  }
  for (const r of s.relationships) {
    if (r.lastSession && !r.reflected && now - new Date(r.lastSession.at).getTime() <= 7 * DAY) {
      items.push({
        key: `capture-${r.lastSession.id}`, kind: 'wrapup', person: r.person,
        title: `Capture what you learned from ${r.person.firstName}`,
        detail: 'Write it down while it’s fresh, and note what you said you’d do.',
        cta: 'Add your notes', href: `/sessions/${r.lastSession.id}`,
      });
    }
  }
  return items;
}

export function menteeNextAction(s: MenteeState, now = Date.now()): NextAction {
  const rels = s.relationships;

  const within = (r: Relationship, ms: number) => r.nextSession && msUntil(r.nextSession.at, now) <= ms && msUntil(r.nextSession.at, now) > -HOUR;

  const soon = rels.find((r) => within(r, DAY));
  if (soon && soon.nextSession) {
    return {
      key: 'prep-24h',
      headline: `Your conversation with ${soon.person.firstName} is ${whenPhrase(soon.nextSession.at, now)}`,
      why: soon.prepared ? 'You’ve started preparing. A last look is enough.' : 'Ten minutes of preparation changes the whole conversation.',
      cta: soon.prepared ? 'Open your prep' : 'Prepare for your conversation',
      href: `/sessions/${soon.nextSession.id}`,
      learn: soon.prepared ? undefined : LEARN.prepare,
    };
  }

  // Straight after a conversation, capturing beats everything except the next
  // conversation itself: detail decays in hours. Once a day has passed the
  // urgency is gone, so a person waiting on a reply outranks it — that branch
  // sits below the reply check.
  const capture = (r: Relationship) => ({
    key: 'capture',
    headline: `Capture what you learned from ${r.person.firstName}`,
    why: 'What you write down now is what you’ll build on next time.',
    cta: 'Add your notes',
    href: `/sessions/${r.lastSession!.id}`,
    learn: LEARN.afterConversation,
  });
  const uncaptured = (maxAge: number) =>
    rels.find((r) => r.lastSession && !r.reflected && now - new Date(r.lastSession.at).getTime() <= maxAge);

  const justEnded = uncaptured(DAY);
  if (justEnded) return capture(justEnded);

  const fresh = rels.find((r) => r.neverMessaged);
  if (fresh) {
    return {
      key: 'start-conversation',
      headline: `${fresh.person.firstName} accepted your request`,
      why: 'Open the conversation. A short, specific first message is all it takes.',
      cta: `Message ${fresh.person.firstName}`,
      href: `/messages?mentorshipId=${fresh.mentorshipId}`,
      learn: LEARN.firstMessage,
    };
  }

  const waitingOnMe = rels.find((r) => r.lastMessage && !r.lastMessage.fromMe);
  if (waitingOnMe) {
    return {
      key: 'reply',
      headline: `${waitingOnMe.person.firstName} replied`,
      why: `“${excerpt(waitingOnMe.lastMessage!.content, 110)}”`,
      cta: 'Continue the conversation',
      href: `/messages?mentorshipId=${waitingOnMe.mentorshipId}`,
    };
  }

  const stillUncaptured = uncaptured(7 * DAY);
  if (stillUncaptured) return capture(stillUncaptured);

  const thisWeek = rels.find((r) => within(r, 7 * DAY) && !r.prepared);
  if (thisWeek && thisWeek.nextSession) {
    return {
      key: 'prep-week',
      headline: `You’re meeting ${thisWeek.person.firstName} ${whenPhrase(thisWeek.nextSession.at, now)}`,
      why: 'Decide what you want to leave understanding, and write down your questions.',
      cta: 'Prepare for your conversation',
      href: `/sessions/${thisWeek.nextSession.id}`,
      learn: thisWeek.lastSession ? LEARN.prepare : LEARN.coffeeChat,
    };
  }

  const toShare = rels.find((r) => r.finishedUnshared.length > 0);
  if (toShare) {
    return {
      key: 'close-loop',
      headline: `Tell ${toShare.person.firstName} what happened`,
      why: `You finished “${toShare.finishedUnshared[0].title}”. Mentors rarely get to see what came of their advice.`,
      cta: 'Send an update',
      href: `/messages?mentorshipId=${toShare.mentorshipId}`,
      learn: LEARN.update,
    };
  }

  // No conversation booked. Whether they have talked before changes the words,
  // not the advice: a mentorship with nothing in the calendar has nothing to
  // prepare for, and saying "you're all set" there would be false comfort.
  const unscheduled = rels.find((r) => !r.nextSession);
  if (unscheduled) {
    const first = !unscheduled.lastSession;
    return {
      key: 'schedule-next',
      headline: first
        ? `Set up your first conversation with ${unscheduled.person.firstName}`
        : `Set up your next conversation with ${unscheduled.person.firstName}`,
      why: first
        ? 'Twenty or thirty minutes is plenty. Offer a couple of times that work for you.'
        : 'Relationships keep their momentum when the next one is already in the calendar.',
      cta: 'Find a time',
      href: `/schedule?mentorshipId=${unscheduled.mentorshipId}`,
      learn: first ? LEARN.coffeeChat : undefined,
    };
  }

  // A booked conversation means this relationship is not actually stalled, so
  // no "it's been a while" nudge on top of it.
  const quiet = rels.find((r) => r.quietDays >= 21 && !r.nextSession);
  if (quiet) {
    return {
      key: 'quiet',
      headline: `It’s been a few weeks since you spoke with ${quiet.person.firstName}`,
      why: 'No rush. When you have something worth sharing, that’s the moment to write.',
      cta: 'Send an update',
      href: `/messages?mentorshipId=${quiet.mentorshipId}`,
      learn: LEARN.update,
    };
  }

  if (s.pendingRequests.length > 0) {
    const req = s.pendingRequests[0];
    const days = Math.max(0, Math.round((now - new Date(req.createdAt).getTime()) / DAY));
    return {
      key: 'waiting',
      headline: `Your request is with ${req.mentorName}`,
      why: days <= 1 ? 'Sent today. Most people reply within a few days.' : `Sent ${days} days ago. Most people reply within a few days.`,
      cta: 'Get ready to talk',
      href: '/networking#preparing',
      secondary: { label: 'See your request', href: '/requests' },
      learn: LEARN.waiting,
    };
  }

  if (rels.length === 0) {
    return {
      key: 'find-mentor',
      headline: 'Find your first mentor',
      why: s.contactableMentors > 0
        ? `${s.contactableMentors} ${s.contactableMentors === 1 ? 'mentor is' : 'mentors are'} on Mentable and open to requests right now.`
        : 'Browse who’s here, and save anyone you’d like to reach when they join.',
      cta: 'Browse mentors',
      href: '/discover',
      secondary: s.savedMentors > 0 ? { label: `Your ${s.savedMentors} saved`, href: '/discover?saved=1' } : undefined,
    };
  }

  return {
    key: 'steady',
    headline: 'You’re in good shape',
    why: 'Nothing needs you right now. When something happens, it will show up here.',
    cta: 'Read: making a mentorship work',
    href: '/guide',
  };
}

// ─── Mentor ───────────────────────────────────────────────────────────────────

/** As menteeNow: the full list, capped by the dashboard after de-duplication. */
export function mentorNow(s: MentorState, now = Date.now()): NowItem[] {
  const items: NowItem[] = [];

  for (const r of s.relationships) {
    if (r.nextSession && msUntil(r.nextSession.at, now) <= 2 * DAY && msUntil(r.nextSession.at, now) > -HOUR) {
      items.push({
        key: `soon-${r.nextSession.id}`, kind: 'session', person: r.person,
        title: `Your conversation with ${r.person.firstName} is ${whenPhrase(r.nextSession.at, now)}`,
        detail: 'The briefing has their goals and where you left off.',
        cta: 'Open briefing', href: `/sessions/${r.nextSession.id}`,
      });
    }
  }
  for (const r of s.relationships) {
    if (r.lastMessage && !r.lastMessage.fromMe) {
      items.push({
        key: `reply-${r.mentorshipId}`, kind: 'message', person: r.person,
        title: `${r.person.firstName} wrote to you`,
        detail: `“${excerpt(r.lastMessage.content)}”`,
        cta: 'Reply', href: `/messages?mentorshipId=${r.mentorshipId}`,
      });
    }
  }
  for (const r of s.relationships) {
    if (r.openPastSession) {
      items.push({
        key: `wrap-${r.openPastSession.id}`, kind: 'wrapup', person: r.person,
        title: `Wrap up your ${new Date(r.openPastSession.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} conversation with ${r.person.firstName}`,
        detail: 'Mark how it went and note what you each agreed to do next.',
        cta: 'Wrap up', href: `/sessions/${r.openPastSession.id}`,
      });
    }
  }
  for (const req of [...s.pendingRequests].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    items.push({
      key: `req-${req.id}`, kind: 'request', person: null,
      title: `${req.menteeName} asked to work with you`,
      detail: req.goals ? `Hoping to: ${req.goals}` : null,
      cta: 'Review', href: `/requests?request=${req.id}`,
    });
  }
  if (!s.hasAvailability && s.relationships.length + s.pendingRequests.length > 0) {
    items.push({
      key: 'availability', kind: 'setup', person: null,
      title: 'Set when you’re open to conversations',
      detail: 'Students can only book inside the times you choose.',
      cta: 'Set times', href: '/schedule?tab=availability',
    });
  }
  return items;
}

/*
  Explicit precedence, no scoring:

    1. a conversation inside 24 hours   — fixed in time, cannot be moved
    2. a request waiting                — a person waiting on a yes or no
    3. a message from a mentee          — a person waiting on a reply
    4. a session left open              — the record, not a person
    5. no availability set              — the thing that unblocks everyone else
    6. a conversation inside a week
    7. a note not written
    8. a relationship gone quiet
    9. nothing: say so

  A request used to outrank an imminent conversation, so a mentor with a
  student arriving in six hours was told to go and read a request first. The
  request still shows in "needs you now"; it just no longer outranks the clock.
*/
export function mentorNextAction(s: MentorState, now = Date.now()): NextAction {
  const rels = s.relationships;
  const within = (r: Relationship, ms: number) => r.nextSession && msUntil(r.nextSession.at, now) <= ms && msUntil(r.nextSession.at, now) > -HOUR;

  const soon = rels.find((r) => within(r, DAY));
  if (soon && soon.nextSession) {
    return {
      key: 'briefing-24h',
      headline: `You’re talking with ${soon.person.firstName} ${whenPhrase(soon.nextSession.at, now)}`,
      why: 'One minute of context: their goals, what they finished, and where you left off.',
      cta: 'Open your briefing',
      href: `/sessions/${soon.nextSession.id}`,
    };
  }

  if (s.pendingRequests.length > 0) {
    // The oldest request first: someone who has waited longest should not keep
    // losing their place to whoever arrived this morning. The count of the
    // others is deliberately NOT repeated here — the band below already
    // carries them, and saying "3 more" in two places reads as six.
    const req = [...s.pendingRequests].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    return {
      key: 'review-request',
      headline: `${req.menteeName} asked to work with you`,
      why: req.goals ? `They’re hoping to: ${req.goals}` : 'Read what they’re hoping to do and decide if you can help.',
      cta: 'Review their request',
      href: `/requests?request=${req.id}`,
      learn: s.isNew ? LEARN.reviewRequest : undefined,
    };
  }

  const waiting = rels.find((r) => r.lastMessage && !r.lastMessage.fromMe);
  if (waiting) {
    return {
      key: 'reply',
      headline: `${waiting.person.firstName} wrote to you`,
      why: `“${excerpt(waiting.lastMessage!.content, 110)}”`,
      cta: 'Reply',
      href: `/messages?mentorshipId=${waiting.mentorshipId}`,
    };
  }

  const toWrap = rels.find((r) => r.openPastSession);
  if (toWrap && toWrap.openPastSession) {
    return {
      key: 'wrap-up',
      headline: `Wrap up your conversation with ${toWrap.person.firstName}`,
      why: 'Note what to remember, and it will be in your briefing next time.',
      cta: 'Wrap up',
      href: `/sessions/${toWrap.openPastSession.id}`,
    };
  }

  if (!s.hasAvailability) {
    return {
      key: 'availability',
      headline: 'Set when you’re open to conversations',
      why: 'Students can only book time inside the windows you choose. It takes a minute.',
      cta: 'Set your availability',
      href: '/schedule?tab=availability',
      learn: LEARN.availability,
    };
  }

  const thisWeek = rels.find((r) => within(r, 7 * DAY));
  if (thisWeek && thisWeek.nextSession) {
    return {
      key: 'briefing-week',
      headline: `You’re talking with ${thisWeek.person.firstName} ${whenPhrase(thisWeek.nextSession.at, now)}`,
      why: 'Their goals and your last note are already in the briefing.',
      cta: 'Open your briefing',
      href: `/sessions/${thisWeek.nextSession.id}`,
    };
  }

  const unreflected = rels.find((r) => r.lastSession && !r.reflected && now - new Date(r.lastSession.at).getTime() <= 7 * DAY);
  if (unreflected && unreflected.lastSession) {
    return {
      key: 'note',
      headline: `Note what to remember about ${unreflected.person.firstName}`,
      why: 'Thirty seconds now, and it’s waiting for you before the next conversation.',
      cta: 'Add a note',
      href: `/sessions/${unreflected.lastSession.id}`,
    };
  }

  const quiet = rels.find((r) => !r.nextSession && r.quietDays >= 21);
  if (quiet) {
    return {
      key: 'quiet',
      headline: `You haven’t spoken with ${quiet.person.firstName} in a while`,
      why: 'A short note, or a time in the calendar, is usually all it takes.',
      cta: `Message ${quiet.person.firstName}`,
      href: `/messages?mentorshipId=${quiet.mentorshipId}`,
    };
  }

  if (rels.length === 0) {
    return {
      key: 'ready',
      headline: 'You’re ready when someone reaches out',
      why: 'Requests arrive here with what the student is hoping to learn.',
      // Discover is a mentee surface and bounces mentors back to the
      // dashboard, so "what students see" is their own profile page.
      cta: 'Preview your profile',
      href: `/mentor/${s.mentorId}`,
    };
  }

  return {
    key: 'steady',
    headline: 'Everything’s handled',
    why: 'Nothing needs you right now. When a student writes or books time, it shows up here.',
    cta: 'Read: making a mentorship work',
    href: '/guide',
  };
}
