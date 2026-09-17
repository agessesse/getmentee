'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { format, differenceInCalendarDays } from 'date-fns';
import {
  Check, CheckCircle2, Circle, ExternalLink, Lock, MessageSquare, Plus, Send, X, Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';
import {
  sessionPhase, mentorPrompt, MENTEE_LISTEN_FOR, RESEARCH_CHECKS, FIRST_MEETING_TOPICS, DEVELOPMENTAL_QUESTIONS,
  type SessionPhase,
} from '@/lib/mentorship/coaching';
import { emptyNotebook, loadNotebook, saveNotebook, type Notebook } from '@/lib/mentorship/notebook';

/**
 * The session coach: the right guidance for this person at this point in the
 * conversation's life.
 *
 *            mentee                              mentor
 *   before   preparation: last time, since       briefing: who they are, what
 *            then, objective, questions,         they're working toward, last
 *            who you're meeting                  time, commitments, one prompt
 *   during   a quiet view: objective, questions, a quiet view: their agenda, open
 *            what to listen for, private notes   commitments, one prompt, notes
 *   after    what you learned, what you'll do    what to remember next time,
 *            (becomes action items), follow-up   something for them to work on
 *
 * The first conversation in a relationship gets its own framing on both sides.
 *
 * Privacy: everything typed here is saved to the author's private notebook
 * (lib/mentorship/notebook.ts), readable only by them under RLS. The only
 * things that reach the other person are the ones the author sends on purpose:
 * copying to the shared agenda, creating an action item, or sending a message.
 * Each of those controls says so next to it.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CoachSession {
  id: string;
  mentorship_id: string;
  mentor_id: string;
  mentee_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
}

interface Person {
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  university: string | null;
  linkedin_url: string | null;
}

interface Item {
  id: string;
  title: string;
  assigned_to: string | null;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string | null;
}

interface Goal { id: string; title: string; status: string; target_date: string | null }

interface Context {
  partner: Person | null;
  reason: string | null;
  isFirst: boolean;
  lastSession: { id: string; scheduled_at: string } | null;
  lastNotebook: Notebook | null;
  items: Item[];
  goals: Goal[];
  mentorProfile: { title: string | null; company: string | null; expertise_tags: string[] | null } | null;
  menteeProfile: { major: string | null } | null;
}

// ─── Small UI ─────────────────────────────────────────────────────────────────

const EYEBROW = 'font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body';
const FIELD = 'w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[15px] text-halo-ink placeholder-halo-mist-body focus:outline-none focus:ring-2 focus:ring-halo-purple resize-y';
const PRIMARY = 'inline-flex items-center justify-center gap-2 rounded-xl bg-halo-purple text-white text-sm font-semibold px-4 py-2.5 hover:bg-halo-purple-d disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2';
const OUTLINE = 'inline-flex items-center gap-2 rounded-xl border border-halo-purple text-halo-purple-d text-sm font-semibold px-4 py-2.5 hover:bg-halo-purple hover:text-white disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple';

const localDate = (d: string) => new Date(`${d}T12:00:00`);

function Block({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <p className={EYEBROW}>{label}</p>
      {hint && <p className="text-[13px] text-halo-mist-body mt-1">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-halo-veil border border-halo-lavender px-4 py-3 text-[15px] text-halo-ink leading-relaxed">
      {children}
    </p>
  );
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function SaveNote({ state }: { state: SaveState }) {
  return (
    <p className="inline-flex items-center gap-1.5 text-xs text-halo-mist-body" aria-live="polite">
      <Lock className="w-3.5 h-3.5" />
      {state === 'saving' ? 'Saving privately…' : state === 'saved' ? 'Saved. Only you can see this.' : state === 'error' ? 'Couldn’t save. Check your connection.' : 'Private to you'}
    </p>
  );
}

function ItemList({ items, onToggle, empty }: { items: Item[]; onToggle?: (i: Item) => void; empty?: string }) {
  if (!items.length) return empty ? <p className="text-[15px] text-halo-heather">{empty}</p> : null;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.id} className="flex items-start gap-2.5">
          {onToggle ? (
            <button
              type="button"
              onClick={() => onToggle(it)}
              aria-label={`${it.is_completed ? 'Mark not done' : 'Mark done'}: ${it.title}`}
              className="mt-0.5 flex-shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
            >
              {it.is_completed ? <CheckCircle2 className="w-5 h-5 text-halo-purple-d" /> : <Circle className="w-5 h-5 text-halo-mist-strong" />}
            </button>
          ) : it.is_completed ? (
            <CheckCircle2 className="w-4 h-4 text-halo-purple-d flex-shrink-0 mt-0.5" />
          ) : (
            <Circle className="w-4 h-4 text-halo-mist-strong flex-shrink-0 mt-0.5" />
          )}
          <span className={`text-[15px] leading-snug break-words min-w-0 ${it.is_completed ? 'text-halo-mist-body line-through' : 'text-halo-ink'}`}>
            {it.title}
            {it.due_date && !it.is_completed && <span className="text-halo-mist-body"> · by {format(localDate(it.due_date), 'MMM d')}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FirstMeeting({ role, partner }: { role: 'mentor' | 'mentee'; partner: string }) {
  return (
    <div className="rounded-xl border border-halo-rule bg-halo-ivory p-4 sm:p-5">
      <p className="text-base font-semibold text-halo-ink">Your first conversation</p>
      <p className="text-[15px] text-halo-heather mt-1 leading-relaxed">
        {role === 'mentee'
          ? `Keep it conversational. By the end, you and ${partner} should both be able to answer these.`
          : `Keep it conversational, not contractual. By the end, you and ${partner} should both be able to answer these.`}
      </p>
      <ol className="mt-4 space-y-3">
        {FIRST_MEETING_TOPICS.map((t, i) => (
          <li key={t.q} className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-halo-deep text-halo-ivory text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
            <div>
              <p className="text-[15px] font-semibold text-halo-ink">{t.q}</p>
              <p className="text-[14px] text-halo-heather">{t.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function loadContext(s: CoachSession, uid: string, role: 'mentor' | 'mentee'): Promise<Context> {
  const supabase = createClient();
  const partnerId = role === 'mentor' ? s.mentee_id : s.mentor_id;
  const [partnerRes, msRes, sessionsRes, itemsRes, goalsRes, mentorRes, menteeRes] = await Promise.all([
    supabase.from('public_profiles').select('first_name, last_name, headline, university, linkedin_url').eq('id', partnerId).maybeSingle(),
    supabase.from('mentorships').select('request_id').eq('id', s.mentorship_id).maybeSingle(),
    supabase.from('sessions').select('id, scheduled_at, status').eq('mentorship_id', s.mentorship_id).order('scheduled_at', { ascending: true }),
    supabase.from('action_items').select('id, title, assigned_to, is_completed, completed_at, due_date').eq('mentorship_id', s.mentorship_id).order('created_at', { ascending: true }),
    supabase.from('mentorship_goals').select('id, title, status, target_date').eq('mentorship_id', s.mentorship_id).neq('status', 'cancelled'),
    role === 'mentee'
      ? supabase.from('mentor_profiles').select('title, company, expertise_tags').eq('id', s.mentor_id).maybeSingle()
      : Promise.resolve({ data: null }),
    role === 'mentor'
      ? supabase.from('mentee_profiles').select('major').eq('id', s.mentee_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const reqId = msRes.data?.request_id;
  const reason = reqId
    ? (await supabase.from('mentorship_requests').select('goals').eq('id', reqId).maybeSingle()).data?.goals ?? null
    : null;

  const earlier = (sessionsRes.data ?? []).filter((x) => x.id !== s.id && x.status === 'completed' && x.scheduled_at < s.scheduled_at);
  const lastSession = earlier.length ? earlier[earlier.length - 1] : null;
  const lastNotebook = lastSession ? await loadNotebook(lastSession.id, uid) : null;

  return {
    partner: partnerRes.data ?? null,
    reason,
    isFirst: earlier.length === 0,
    lastSession,
    lastNotebook,
    items: (itemsRes.data ?? []) as Item[],
    goals: (goalsRes.data ?? []) as Goal[],
    mentorProfile: (mentorRes.data as Context['mentorProfile']) ?? null,
    menteeProfile: (menteeRes.data as Context['menteeProfile']) ?? null,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SessionCoach({
  session,
  userId,
  role,
  onAgendaChange,
  onActionItemsChanged,
}: {
  session: CoachSession;
  userId: string;
  role: 'mentor' | 'mentee';
  onAgendaChange: (notes: string) => void;
  onActionItemsChanged: () => void;
}) {
  const [ctx, setCtx] = useState<Context | null>(null);
  const [nb, setNb] = useState<Notebook>(emptyNotebook);
  const [save, setSave] = useState<SaveState>('idle');
  const [phase, setPhase] = useState<SessionPhase>(() => sessionPhase(session));
  const dirty = useRef(false);
  // The page passes a fresh session object whenever its shared agenda text
  // changes. Reading it through a ref keeps typing in the agenda from
  // re-fetching everything here on every keystroke.
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const { id: sid, status, scheduled_at: at, duration_minutes: mins } = session;

  // Phase can change while the page is open: a conversation starts or ends.
  useEffect(() => {
    const s = { status, scheduled_at: at, duration_minutes: mins };
    setPhase(sessionPhase(s));
    const t = setInterval(() => setPhase(sessionPhase(s)), 60_000);
    return () => clearInterval(t);
  }, [status, at, mins]);

  const reload = useCallback(async () => {
    const [c, n] = await Promise.all([loadContext(sessionRef.current, userId, role), loadNotebook(sid, userId)]);
    setNb(n);
    setCtx(c);
  }, [sid, userId, role]);

  useEffect(() => { reload(); }, [reload]);

  // Autosave the private notebook shortly after typing stops.
  useEffect(() => {
    if (!dirty.current) return;
    setSave('saving');
    const t = setTimeout(async () => {
      const { ok } = await saveNotebook(session.id, userId, nb);
      setSave(ok ? 'saved' : 'error');
      dirty.current = false;
    }, 800);
    return () => clearTimeout(t);
  }, [nb, session.id, userId]);

  const edit = (fn: (n: Notebook) => Notebook) => { dirty.current = true; setNb((prev) => fn(prev)); };

  const toggleItem = async (it: Item) => {
    const supabase = createClient();
    const next = !it.is_completed;
    const stamp = next ? new Date().toISOString() : null;
    const { error } = await supabase.from('action_items').update({ is_completed: next, completed_at: stamp }).eq('id', it.id);
    if (!error) {
      setCtx((c) => (c ? { ...c, items: c.items.map((x) => (x.id === it.id ? { ...x, is_completed: next, completed_at: stamp } : x)) } : c));
      onActionItemsChanged();
      if (next) void trackEvent('action_item_completed', role, { entityId: it.id });
    }
  };

  const createItems = async (titles: string[], assignee: string, due?: string | null) => {
    const clean = titles.map((t) => t.trim()).filter(Boolean);
    if (!clean.length) return false;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('action_items')
      .insert(clean.map((title) => ({
        mentorship_id: session.mentorship_id, session_id: session.id, created_by: userId, assigned_to: assignee, title, due_date: due || null,
      })))
      .select('id, title, assigned_to, is_completed, completed_at, due_date');
    if (error) return false;
    setCtx((c) => (c ? { ...c, items: [...c.items, ...((data ?? []) as Item[])] } : c));
    onActionItemsChanged();
    (data ?? []).forEach((d) => void trackEvent('action_item_created', role, { entityId: d.id }));
    return true;
  };

  const sendMessage = async (content: string) => {
    const text = content.trim();
    if (!text) return false;
    const supabase = createClient();
    const { error } = await supabase.from('messages').insert({ mentorship_id: session.mentorship_id, sender_id: userId, content: text });
    if (!error) void trackEvent('message_sent', role, { entityId: session.mentorship_id });
    return !error;
  };

  if (phase === 'cancelled') return null;
  if (!ctx) return <div className="bg-white rounded-2xl border border-halo-rule p-6 animate-pulse h-40" aria-hidden="true" />;

  const partnerFirst = ctx.partner?.first_name || (role === 'mentor' ? 'your mentee' : 'your mentor');
  const menteeOpen = ctx.items.filter((i) => i.assigned_to === session.mentee_id && !i.is_completed);
  const mentorOpen = ctx.items.filter((i) => i.assigned_to === session.mentor_id && !i.is_completed);
  const sinceLast = ctx.lastSession ? new Date(ctx.lastSession.scheduled_at).getTime() : 0;
  const completedSinceLast = ctx.items.filter((i) => i.is_completed && i.completed_at && new Date(i.completed_at).getTime() > sinceLast);
  const when = format(new Date(session.scheduled_at), "EEEE, MMM d 'at' h:mm a");

  const props: PanelProps = {
    session, ctx, nb, edit, save, partnerFirst, when, menteeOpen, mentorOpen, completedSinceLast,
    toggleItem, createItems, sendMessage, onAgendaChange, menteeId: session.mentee_id, mentorId: session.mentor_id, role,
  };

  return (
    <section aria-label="Session guidance" className="bg-white rounded-2xl border border-halo-rule overflow-hidden">
      {phase === 'before' && role === 'mentee' && <MenteeBefore {...props} />}
      {phase === 'before' && role === 'mentor' && <MentorBefore {...props} />}
      {phase === 'during' && <During {...props} />}
      {phase === 'after' && role === 'mentee' && <MenteeAfter {...props} />}
      {phase === 'after' && role === 'mentor' && <MentorAfter {...props} />}
    </section>
  );
}

interface PanelProps {
  session: CoachSession;
  ctx: Context;
  nb: Notebook;
  edit: (fn: (n: Notebook) => Notebook) => void;
  save: SaveState;
  role: 'mentor' | 'mentee';
  partnerFirst: string;
  when: string;
  menteeOpen: Item[];
  mentorOpen: Item[];
  completedSinceLast: Item[];
  toggleItem: (i: Item) => void;
  createItems: (titles: string[], assignee: string, due?: string | null) => Promise<boolean>;
  sendMessage: (content: string) => Promise<boolean>;
  onAgendaChange: (notes: string) => void;
  menteeId: string;
  mentorId: string;
}

function Header({ eyebrow, title, sub, save }: { eyebrow: string; title: string; sub?: string; save?: SaveState }) {
  return (
    <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-halo-rule bg-halo-ivory">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d">{eyebrow}</p>
          <h2 className="font-display font-normal text-[1.625rem] leading-tight text-halo-ink mt-1">{title}</h2>
          {sub && <p className="text-[15px] text-halo-heather mt-1">{sub}</p>}
        </div>
        {save && <SaveNote state={save} />}
      </div>
    </div>
  );
}

// ─── Mentee: before ───────────────────────────────────────────────────────────

function MenteeBefore(p: PanelProps) {
  const { ctx, nb, edit, partnerFirst } = p;
  const [shared, setShared] = useState<'idle' | 'working' | 'done' | 'error'>(nb.prep.sharedToAgendaAt ? 'done' : 'idle');
  const questions = nb.prep.questions;
  const setQ = (i: number, v: string) => edit((n) => ({ ...n, prep: { ...n.prep, questions: n.prep.questions.map((q, j) => (j === i ? v : q)) } }));
  const mp = ctx.mentorProfile;
  const canShare = !!nb.prep.objective.trim() || nb.prep.questions.some((q) => q.trim());

  const shareToAgenda = async () => {
    const objective = nb.prep.objective.trim();
    const qs = nb.prep.questions.map((q) => q.trim()).filter(Boolean);
    if (!objective && !qs.length) return;
    setShared('working');
    const block = [
      'Before we talk:',
      objective && `What I hope to leave understanding: ${objective}`,
      qs.length && `My questions:\n${qs.map((q) => `• ${q}`).join('\n')}`,
    ].filter(Boolean).join('\n');
    const next = [p.session.notes?.trim(), block].filter(Boolean).join('\n\n');
    const supabase = createClient();
    const { error } = await supabase.from('sessions').update({ notes: next }).eq('id', p.session.id);
    if (error) { setShared('error'); return; }
    p.onAgendaChange(next);
    edit((n) => ({ ...n, prep: { ...n.prep, sharedToAgendaAt: new Date().toISOString() } }));
    setShared('done');
  };

  return (
    <>
      <Header eyebrow="Before you meet" title={`Get ready for ${p.when}`} sub="Know what you want to ask before you walk in." save={p.save} />
      <div className="px-5 sm:px-6 py-5 space-y-6">
        {ctx.isFirst ? (
          <FirstMeeting role="mentee" partner={partnerFirst} />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Block label={ctx.lastSession ? `Last time · ${format(new Date(ctx.lastSession.scheduled_at), 'MMM d')}` : 'Last time'}>
              {ctx.lastNotebook?.reflection.learned ? (
                <p className="text-[15px] text-halo-ink leading-relaxed whitespace-pre-line break-words">{ctx.lastNotebook.reflection.learned}</p>
              ) : (
                <p className="text-[15px] text-halo-heather">Nothing written down from last time. Worth doing after this one.</p>
              )}
            </Block>
            <Block label="What you said you’d do" hint="Tick off what you finished.">
              <ItemList items={ctx.items.filter((i) => i.assigned_to === p.menteeId)} onToggle={p.toggleItem} empty="Nothing open." />
            </Block>
          </div>
        )}

        {!ctx.isFirst && (
          <Block label="Since then">
            <textarea rows={3} className={FIELD} value={nb.prep.sinceThen}
              onChange={(e) => edit((n) => ({ ...n, prep: { ...n.prep, sinceThen: e.target.value } }))}
              placeholder="What changed since your last conversation? What did you try, and what happened?" />
          </Block>
        )}

        <Block label="Who you’re meeting">
          <div className="rounded-xl border border-halo-rule p-4">
            <p className="text-[15px] text-halo-ink">
              <span className="font-semibold">{[ctx.partner?.first_name, ctx.partner?.last_name].filter(Boolean).join(' ') || 'Your mentor'}</span>
              {(mp?.title || mp?.company) && <span className="text-halo-heather"> · {[mp?.title, mp?.company].filter(Boolean).join(', ')}</span>}
            </p>
            {ctx.partner?.headline && <p className="text-[14px] text-halo-heather mt-0.5">{ctx.partner.headline}</p>}
            {!!mp?.expertise_tags?.length && <p className="text-[14px] text-halo-heather mt-1">Can help with {mp.expertise_tags.slice(0, 4).join(', ')}</p>}
            <div className="flex flex-wrap gap-4 mt-3">
              <Link href={`/mentor/${p.mentorId}`} className="text-sm font-medium text-halo-purple-d hover:text-halo-ink">View their profile →</Link>
              {ctx.partner?.linkedin_url && (
                <a href={ctx.partner.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-halo-purple-d hover:text-halo-ink">
                  LinkedIn <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
          <fieldset className="mt-3">
            <legend className="text-[13px] text-halo-mist-body mb-1">A quick check, only if it helps</legend>
            <div className="grid sm:grid-cols-2 gap-1">
              {RESEARCH_CHECKS.filter((c) => !(ctx.isFirst && (c.key === 'lastTime' || c.key === 'commitments'))).map((c) => (
                <label key={c.key} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-halo-veil/60 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-halo-purple flex-shrink-0"
                    checked={!!nb.prep.checklist[c.key]}
                    onChange={(e) => edit((n) => ({ ...n, prep: { ...n.prep, checklist: { ...n.prep.checklist, [c.key]: e.target.checked } } }))} />
                  <span className="text-[14px] text-halo-ink">{c.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Block>

        <Block label="Today’s objective">
          <textarea rows={2} className={FIELD} value={nb.prep.objective}
            onChange={(e) => edit((n) => ({ ...n, prep: { ...n.prep, objective: e.target.value } }))}
            placeholder={ctx.isFirst ? 'What do you want to develop, and what would make this relationship useful to you?' : 'If this conversation goes well, what will you leave understanding?'} />
        </Block>

        <Block label="Your questions" hint="Three to five, most important first.">
          <ol className="space-y-2">
            {questions.map((q, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-5 text-sm text-halo-mist-body text-right tabular-nums flex-shrink-0">{i + 1}.</span>
                <input className={FIELD} value={q} aria-label={`Question ${i + 1}`} onChange={(e) => setQ(i, e.target.value)}
                  placeholder={i === 0 ? 'Your most important question' : 'Another question'} />
                {questions.length > 1 && (
                  <button type="button" aria-label={`Remove question ${i + 1}`}
                    onClick={() => edit((n) => ({ ...n, prep: { ...n.prep, questions: n.prep.questions.filter((_, j) => j !== i) } }))}
                    className="p-2 rounded-lg text-halo-mist-body hover:text-halo-ink hover:bg-halo-veil flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ol>
          {questions.length < 5 && (
            <button type="button" onClick={() => edit((n) => ({ ...n, prep: { ...n.prep, questions: [...n.prep.questions, ''] } }))}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-halo-purple-d hover:text-halo-ink">
              <Plus className="w-4 h-4" /> Add a question
            </button>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-halo-purple-d hover:text-halo-ink">What makes a good question?</summary>
            <div className="mt-2 grid sm:grid-cols-2 gap-2 text-[14px]">
              <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-red-900"><span className="font-semibold">Too broad: </span>“Can you tell me about investment banking?”</p>
              <p className="rounded-lg bg-halo-veil border border-halo-lavender px-3 py-2 text-halo-ink"><span className="font-semibold">Specific: </span>“You moved from corporate banking into investment banking. What changed in how you evaluated companies?”</p>
            </div>
            <p className="text-[13px] text-halo-mist-body mt-2">If a quick search would answer it, answer it yourself first.</p>
          </details>
        </Block>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl bg-halo-veil/60 border border-halo-rule px-4 py-3">
          <p className="text-[14px] text-halo-heather">
            <Lock className="inline w-3.5 h-3.5 -mt-0.5 mr-1" />
            Your preparation is private. Copy your objective and questions to the shared agenda if you’d like {partnerFirst} to see them.
          </p>
          <button type="button" onClick={shareToAgenda} disabled={shared === 'working' || !canShare} className={`${PRIMARY} flex-shrink-0`}>
            {shared === 'done' ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {shared === 'done' ? 'Added to agenda' : shared === 'working' ? 'Adding…' : 'Add to shared agenda'}
          </button>
        </div>
        {shared === 'error' && <p role="alert" className="text-sm text-red-700">That didn’t go through. Try again in a moment.</p>}

        <details className="rounded-xl border border-halo-rule px-4 py-3">
          <summary className="cursor-pointer text-[15px] font-semibold text-halo-ink">Respecting their time</summary>
          <ul className="mt-2 space-y-1.5 text-[14px] text-halo-heather list-disc pl-5">
            <li>Confirm the time and how you’re meeting the day before.</li>
            <li>Be there a few minutes early, and finish on time.</li>
            <li>Ask your most important question first, in case you run short.</li>
            <li>If something changes, tell them as early as you can.</li>
            <li>Want to record or transcribe? Ask first. Never record anyone without their consent.</li>
          </ul>
        </details>
      </div>
    </>
  );
}

// ─── Mentor: before ───────────────────────────────────────────────────────────

function MentorBefore(p: PanelProps) {
  const { ctx, nb, edit, partnerFirst } = p;
  const now = Date.now();
  const activeGoals = ctx.goals.filter((g) => g.status === 'active');
  const upcomingGoals = activeGoals
    .filter((g) => g.target_date)
    .map((g) => ({ ...g, days: differenceInCalendarDays(localDate(g.target_date!), now) }))
    .filter((g) => g.days >= 0 && g.days <= 30)
    .sort((a, b) => a.days - b.days);
  const dueSoon = p.menteeOpen.filter((i) => i.due_date && differenceInCalendarDays(localDate(i.due_date), now) <= 14);
  const inDays = (d: number) => (d === 0 ? 'today' : `in ${d} day${d === 1 ? '' : 's'}`);
  const prompt = mentorPrompt({
    seed: p.session.id,
    isFirst: ctx.isFirst,
    menteeName: partnerFirst,
    openMenteeCommitments: p.menteeOpen.map((i) => i.title),
    completedSinceLast: p.completedSinceLast.filter((i) => i.assigned_to === p.menteeId).map((i) => i.title),
    upcomingGoal: upcomingGoals[0] ? { title: upcomingGoals[0].title, when: inDays(upcomingGoals[0].days) } : null,
  });
  const full = [ctx.partner?.first_name, ctx.partner?.last_name].filter(Boolean).join(' ');
  const about = [ctx.partner?.headline, ctx.menteeProfile?.major ? `Studying ${ctx.menteeProfile.major}` : null].filter(Boolean) as string[];
  const agenda = p.session.notes?.trim();

  return (
    <>
      <Header eyebrow="Your briefing" title={`Before you talk with ${partnerFirst}`} sub={p.when} />
      <div className="px-5 sm:px-6 py-5 space-y-6">
        <Prompt><span className="font-semibold">Worth trying today: </span>{prompt}</Prompt>

        <div className="grid md:grid-cols-2 gap-6">
          <Block label="Who they are">
            <p className="text-[15px] text-halo-ink font-semibold">{full || 'Your mentee'}</p>
            {about.map((a) => <p key={a} className="text-[15px] text-halo-heather">{a}</p>)}
            {ctx.reason && <p className="text-[15px] text-halo-ink mt-2"><span className="text-halo-mist-body">Came to you for: </span>{ctx.reason}</p>}
            <Link href={`/mentee/${p.menteeId}`} className="inline-block mt-2 text-sm font-medium text-halo-purple-d hover:text-halo-ink">Their profile →</Link>
          </Block>
          <Block label="Working toward">
            {activeGoals.length ? (
              <ul className="space-y-1.5">
                {activeGoals.slice(0, 4).map((g) => (
                  <li key={g.id} className="text-[15px] text-halo-ink">
                    {g.title}{g.target_date && <span className="text-halo-mist-body"> · {format(localDate(g.target_date), 'MMM d')}</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-[15px] text-halo-heather">No goals written down yet. Worth setting one together.</p>}
          </Block>
        </div>

        {ctx.isFirst ? (
          <FirstMeeting role="mentor" partner={partnerFirst} />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Block label={ctx.lastSession ? `Your note from ${format(new Date(ctx.lastSession.scheduled_at), 'MMM d')}` : 'Your note from last time'}>
              {ctx.lastNotebook?.reflection.rememberNext ? (
                <p className="text-[15px] text-halo-ink leading-relaxed whitespace-pre-line break-words">{ctx.lastNotebook.reflection.rememberNext}</p>
              ) : (
                <p className="text-[15px] text-halo-heather">No note from last time. After today, jot down what to remember and it will be here next time.</p>
              )}
            </Block>
            <Block label="Done since you last spoke">
              <ItemList items={p.completedSinceLast} empty="Nothing marked done since then." />
            </Block>
          </div>
        )}

        {(p.menteeOpen.length > 0 || p.mentorOpen.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            <Block label={`${partnerFirst} said they’d`}><ItemList items={p.menteeOpen} empty="Nothing open." /></Block>
            <Block label="You said you’d"><ItemList items={p.mentorOpen} onToggle={p.toggleItem} empty="Nothing open." /></Block>
          </div>
        )}

        {(upcomingGoals.length > 0 || dueSoon.length > 0) && (
          <Block label="Coming up for them">
            <ul className="space-y-1.5">
              {upcomingGoals.map((g) => <li key={g.id} className="text-[15px] text-halo-ink">{g.title} <span className="text-halo-mist-body">· {inDays(g.days)}</span></li>)}
              {dueSoon.map((i) => <li key={i.id} className="text-[15px] text-halo-ink">{i.title} <span className="text-halo-mist-body">· due {format(localDate(i.due_date!), 'MMM d')}</span></li>)}
            </ul>
          </Block>
        )}

        {agenda && (
          <Block label="On the shared agenda">
            <p className="rounded-xl bg-halo-ivory border border-halo-rule px-4 py-3 text-[15px] text-halo-ink whitespace-pre-line break-words">{agenda}</p>
          </Block>
        )}

        <Block label="Anything you want to raise">
          <textarea rows={2} className={FIELD} value={nb.prep.objective}
            onChange={(e) => edit((n) => ({ ...n, prep: { ...n.prep, objective: e.target.value } }))}
            placeholder="A question to ask, something to follow up on, something worth encouraging." />
          <div className="mt-2"><SaveNote state={p.save} /></div>
        </Block>
      </div>
    </>
  );
}

// ─── During ───────────────────────────────────────────────────────────────────

function During(p: PanelProps) {
  const { ctx, nb, edit, role, partnerFirst } = p;
  const qs = nb.prep.questions.map((q) => q.trim()).filter(Boolean);
  const prompt = role === 'mentor'
    ? mentorPrompt({ seed: `${p.session.id}-during`, isFirst: ctx.isFirst, menteeName: partnerFirst, openMenteeCommitments: p.menteeOpen.map((i) => i.title), completedSinceLast: [], upcomingGoal: null })
    : null;
  return (
    <>
      <Header eyebrow="In the conversation" title={`With ${partnerFirst}`}
        sub={role === 'mentee' ? 'Be present first. Capture the key points. Organize it afterward.' : 'Understand before you advise.'} save={p.save} />
      <div className="px-5 sm:px-6 py-5 space-y-5">
        {role === 'mentee' ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Block label="What you came for">
              <p className="text-[15px] text-halo-ink break-words">{nb.prep.objective || 'Decide now the one thing you want to leave understanding.'}</p>
              {qs.length > 0 && <ol className="mt-3 space-y-1.5 list-decimal pl-5 text-[15px] text-halo-ink">{qs.map((q, i) => <li key={i}>{q}</li>)}</ol>}
            </Block>
            <Block label="Listen for">
              <ul className="space-y-1.5 text-[15px] text-halo-ink list-disc pl-5">{MENTEE_LISTEN_FOR.map((l) => <li key={l}>{l}</li>)}</ul>
              <p className="text-[13px] text-halo-mist-body mt-3">Don’t plan your next question while they’re answering this one.</p>
            </Block>
          </div>
        ) : (
          <>
            {prompt && <Prompt>{prompt}</Prompt>}
            <div className="grid md:grid-cols-2 gap-6">
              <Block label="On the shared agenda">
                <p className="text-[15px] text-halo-ink whitespace-pre-line break-words">{p.session.notes?.trim() || 'Nothing added. Ask what would make today useful.'}</p>
              </Block>
              <Block label={`${partnerFirst}’s open commitments`}>
                <ItemList items={p.menteeOpen} empty="Nothing open." />
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-halo-purple-d">Questions that build judgment</summary>
                  <ul className="mt-2 space-y-1 text-[14px] text-halo-heather list-disc pl-5">{DEVELOPMENTAL_QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ul>
                </details>
              </Block>
            </div>
          </>
        )}
        <Block label="Your notes" hint={role === 'mentee' ? 'Pen and paper keeps a screen out of the conversation. Type the key points here afterward if you prefer.' : 'Private to you.'}>
          <textarea rows={4} className={FIELD} value={nb.during.notes}
            onChange={(e) => edit((n) => ({ ...n, during: { notes: e.target.value } }))} placeholder="Key points only." />
        </Block>
      </div>
    </>
  );
}

// ─── Mentee: after ────────────────────────────────────────────────────────────

function MenteeAfter(p: PanelProps) {
  const { ctx, nb, edit, partnerFirst } = p;
  const [commitments, setCommitments] = useState(['']);
  const [updateBy, setUpdateBy] = useState('');
  const [itemsState, setItemsState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [msgState, setMsgState] = useState<'idle' | 'working' | 'sent' | 'error'>('idle');
  const mine = ctx.items.filter((i) => i.assigned_to === p.menteeId);

  const addCommitments = async () => {
    setItemsState('working');
    const titles = commitments.map((c) => c.trim()).filter(Boolean);
    let ok = titles.length ? await p.createItems(titles, p.menteeId) : true;
    if (ok && updateBy) ok = await p.createItems([`Send ${partnerFirst} an update on what happened`], p.menteeId, updateBy);
    setItemsState(ok ? 'done' : 'error');
    if (ok) { setCommitments(['']); setUpdateBy(''); }
  };

  return (
    <>
      <Header eyebrow="After your conversation" title="Capture it while it’s fresh" sub="What did you learn, and what will you actually do?" save={p.save} />
      <div className="px-5 sm:px-6 py-5 space-y-6">
        <Block label="What did you learn?">
          <textarea rows={3} className={FIELD} value={nb.reflection.learned}
            onChange={(e) => edit((n) => ({ ...n, reflection: { ...n.reflection, learned: e.target.value } }))}
            placeholder="The two or three things worth remembering, in your own words." />
        </Block>

        {ctx.isFirst && (
          <Block label="How you’ll work together">
            <textarea rows={2} className={FIELD} value={nb.reflection.workingAgreement}
              onChange={(e) => edit((n) => ({ ...n, reflection: { ...n.reflection, workingAgreement: e.target.value } }))}
              placeholder="How often you’ll meet, how to reach them in between, what they asked you to prepare." />
          </Block>
        )}

        <Block label="What will you do?" hint={`These become action items ${partnerFirst} can see.`}>
          <ul className="space-y-2">
            {commitments.map((c, i) => (
              <li key={i}>
                <input className={FIELD} value={c} aria-label={`Commitment ${i + 1}`}
                  onChange={(e) => { setItemsState('idle'); setCommitments((cs) => cs.map((x, j) => (j === i ? e.target.value : x))); }}
                  placeholder={i === 0 ? 'Something you said you’d do' : 'Another thing you said you’d do'} />
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setCommitments((cs) => [...cs, ''])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-halo-purple-d hover:text-halo-ink">
            <Plus className="w-4 h-4" /> Add another
          </button>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
            <label className="flex-1">
              <span className="block text-[14px] text-halo-ink mb-1">When will you update {partnerFirst}? <span className="text-halo-mist-body">(optional)</span></span>
              <input type="date" className={FIELD} value={updateBy} onChange={(e) => { setItemsState('idle'); setUpdateBy(e.target.value); }} />
            </label>
            <button type="button" onClick={addCommitments} disabled={itemsState === 'working' || (!commitments.some((c) => c.trim()) && !updateBy)} className={PRIMARY}>
              {itemsState === 'done' ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {itemsState === 'done' ? 'Added' : itemsState === 'working' ? 'Adding…' : 'Add as action items'}
            </button>
          </div>
          {itemsState === 'error' && <p role="alert" className="text-sm text-red-700 mt-2">That didn’t save. Try again.</p>}
          {mine.length > 0 && <div className="mt-4"><ItemList items={mine} onToggle={p.toggleItem} /></div>}
        </Block>

        <Block label="What deserves a follow-up?">
          <textarea rows={2} className={FIELD} value={nb.reflection.followUp}
            onChange={(e) => edit((n) => ({ ...n, reflection: { ...n.reflection, followUp: e.target.value } }))}
            placeholder="Something to research, someone they mentioned, a question you ran out of time for." />
        </Block>

        <Block label={`Send ${partnerFirst} a note`} hint="Reference something specific from the conversation, and tell them what you’re doing next.">
          <details className="mb-2">
            <summary className="cursor-pointer text-sm font-medium text-halo-purple-d hover:text-halo-ink">See the difference</summary>
            <div className="mt-2 grid sm:grid-cols-2 gap-2 text-[14px]">
              <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-red-900">“Thanks for your time!”</p>
              <p className="rounded-lg bg-halo-veil border border-halo-lavender px-3 py-2 text-halo-ink">“Your point about customer concentration changed how I looked at the company. I’m reworking my analysis this week and will send it Friday.”</p>
            </div>
          </details>
          <textarea rows={3} className={FIELD} value={message} onChange={(e) => { setMessage(e.target.value); setMsgState('idle'); }} placeholder={`Write to ${partnerFirst} in your own words.`} />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" disabled={!message.trim() || msgState === 'working'} className={OUTLINE}
              onClick={async () => { setMsgState('working'); const ok = await p.sendMessage(message); setMsgState(ok ? 'sent' : 'error'); if (ok) setMessage(''); }}>
              <Send className="w-4 h-4" />{msgState === 'working' ? 'Sending…' : `Send to ${partnerFirst}`}
            </button>
            {msgState === 'sent' && (
              <p className="inline-flex items-center gap-1.5 text-sm text-halo-ink" role="status">
                <Check className="w-4 h-4 text-halo-purple-d" /> Sent.
                <Link href={`/messages?mentorshipId=${p.session.mentorship_id}`} className="text-halo-purple-d font-medium">Open conversation</Link>
              </p>
            )}
            {msgState === 'error' && <p role="alert" className="text-sm text-red-700">That didn’t send. Try again.</p>}
          </div>
        </Block>
      </div>
    </>
  );
}

// ─── Mentor: after ────────────────────────────────────────────────────────────

function MentorAfter(p: PanelProps) {
  const { ctx, nb, edit, partnerFirst } = p;
  const [task, setTask] = useState('');
  const [due, setDue] = useState('');
  const [taskState, setTaskState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [note, setNote] = useState('');
  const [noteState, setNoteState] = useState<'idle' | 'working' | 'sent' | 'error'>('idle');

  return (
    <>
      <Header eyebrow="After the conversation" title="One thing before you go" sub="A minute now lets the next conversation pick up where this one left off." save={p.save} />
      <div className="px-5 sm:px-6 py-5 space-y-6">
        {p.session.status === 'scheduled' && (
          <p className="rounded-xl bg-halo-veil border border-halo-lavender px-4 py-3 text-[15px] text-halo-ink">
            This session is still marked as scheduled. Use <span className="font-semibold">Mark Complete</span> once you’ve met.
          </p>
        )}

        <Block label="What should you remember next time?" hint="Private to you. It will be in your briefing before your next conversation.">
          <textarea rows={3} className={FIELD} value={nb.reflection.rememberNext}
            onChange={(e) => edit((n) => ({ ...n, reflection: { ...n.reflection, rememberNext: e.target.value } }))}
            placeholder={`What mattered to ${partnerFirst}, what’s coming up for them, what you want to ask about.`} />
        </Block>

        {ctx.isFirst && (
          <Block label="How you agreed to work together">
            <textarea rows={2} className={FIELD} value={nb.reflection.workingAgreement}
              onChange={(e) => edit((n) => ({ ...n, reflection: { ...n.reflection, workingAgreement: e.target.value } }))}
              placeholder="How often, how to reach each other, anything you agreed is off the table." />
          </Block>
        )}

        <details className="rounded-xl border border-halo-rule px-4 py-3">
          <summary className="cursor-pointer text-[15px] font-semibold text-halo-ink">
            Something for {partnerFirst} to work on before you meet again <span className="font-normal text-halo-mist-body">(optional)</span>
          </summary>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <input className={FIELD} value={task} onChange={(e) => { setTask(e.target.value); setTaskState('idle'); }} placeholder="Be specific: what to do, and why it matters" aria-label={`Something for ${partnerFirst} to work on`} />
            <input type="date" className={`${FIELD} sm:max-w-[170px]`} value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
            <button type="button" disabled={!task.trim() || taskState === 'working'} className={PRIMARY}
              onClick={async () => { setTaskState('working'); const ok = await p.createItems([task], p.menteeId, due); setTaskState(ok ? 'done' : 'error'); if (ok) { setTask(''); setDue(''); } }}>
              {taskState === 'done' ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{taskState === 'done' ? 'Added' : 'Add'}
            </button>
          </div>
          <p className="text-[13px] text-halo-mist-body mt-2">{partnerFirst} will see this as an action item.</p>
          {taskState === 'error' && <p role="alert" className="text-sm text-red-700 mt-1">That didn’t save. Try again.</p>}
        </details>

        <details className="rounded-xl border border-halo-rule px-4 py-3">
          <summary className="cursor-pointer text-[15px] font-semibold text-halo-ink">
            Send {partnerFirst} a short note <span className="font-normal text-halo-mist-body">(optional)</span>
          </summary>
          <p className="text-[13px] text-halo-mist-body mt-2">One thing you noticed and one clear next step goes a long way.</p>
          <textarea rows={3} className={`${FIELD} mt-2`} value={note} onChange={(e) => { setNote(e.target.value); setNoteState('idle'); }} placeholder={`Write to ${partnerFirst}.`} />
          <div className="mt-2 flex items-center gap-3">
            <button type="button" disabled={!note.trim() || noteState === 'working'} className={OUTLINE}
              onClick={async () => { setNoteState('working'); const ok = await p.sendMessage(note); setNoteState(ok ? 'sent' : 'error'); if (ok) setNote(''); }}>
              <MessageSquare className="w-4 h-4" />{noteState === 'working' ? 'Sending…' : 'Send'}
            </button>
            {noteState === 'sent' && <p className="text-sm text-halo-ink" role="status">Sent.</p>}
            {noteState === 'error' && <p role="alert" className="text-sm text-red-700">That didn’t send. Try again.</p>}
          </div>
        </details>

        {p.menteeOpen.length > 0 && (
          <Block label={`${partnerFirst}’s open commitments`}><ItemList items={p.menteeOpen} /></Block>
        )}
      </div>
    </>
  );
}
