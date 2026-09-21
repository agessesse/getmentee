'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import { Target, Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { displayName, firstName } from '@/lib/display-name';

/**
 * Goals, in the same shape as everything else.
 *
 * WHAT WAS WRONG. This page answered three of the five questions a goal has to
 * answer. It said what someone was trying to accomplish, when they hoped to,
 * and which relationship it belonged to (in six-point grey at the bottom of
 * the card). It never said what the next step was, even though action items
 * are linked to goals in the schema and the dashboard shows them by name. Two
 * pages therefore described the same relationship in two different languages:
 * one talked about "your mentor" and "agreed next steps", this one about "your
 * partner" and nothing. Completed goals were struck through at 60% opacity,
 * which is the greyed-out-badge pattern that got removed everywhere else.
 *
 * WHAT CHANGED. Goals are grouped by the person they belong to, each one shows
 * its open next steps and who owns them, dates read as words, and finished
 * goals are shown as reached rather than faded. No new statistics.
 */

interface Step {
  id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  /** "You" or the other person's first name. */
  owner: string;
}

interface Goal {
  id: string;
  mentorship_id: string;
  title: string;
  description: string | null;
  status: 'active' | 'completed' | 'cancelled';
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
  partnerName: string;
  steps: Step[];
}

interface Relationship {
  id: string;
  partnerName: string;
  partnerFirst: string;
  partnerId: string;
  avatarUrl: string | null;
}

interface NewGoalForm {
  mentorshipId: string;
  title: string;
  description: string;
  targetDate: string;
}

/** When a date matters, say it in words. No colour-only state. */
function dueLabel(date: string): { text: string; late: boolean } {
  const target = new Date(`${date}T12:00:00`);
  const days = Math.round((target.getTime() - Date.now()) / 86_400_000);
  const pretty = format(target, 'MMM d');
  if (days < 0) return { text: `Was due ${pretty}`, late: true };
  if (days === 0) return { text: 'Due today', late: false };
  if (days === 1) return { text: 'Due tomorrow', late: false };
  return { text: `By ${pretty}`, late: false };
}

/** `hint` is passed to one card per person, so the same sentence is not
    repeated down the page. */
function GoalCard({ g, onComplete, hint }: { g: Goal; onComplete: () => void; hint: boolean }) {
  const open = g.steps.filter((sp) => !sp.is_completed);
  const done = g.steps.filter((sp) => sp.is_completed);
  const due = g.target_date ? dueLabel(g.target_date) : null;

  return (
    <article className="bg-white rounded-2xl border border-halo-rule p-5">
      <div className="flex items-start gap-4">
        <button
          onClick={onComplete}
          aria-label={`Mark "${g.title}" as reached`}
          className="mt-0.5 text-halo-mist-strong hover:text-halo-purple-d transition-colors flex-shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
        >
          <Circle className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[15px] font-semibold text-halo-ink leading-snug">{g.title}</p>
            {due && (
              <span className={`inline-flex items-center gap-1 text-xs flex-shrink-0 whitespace-nowrap ${due.late ? 'font-semibold text-halo-ink' : 'text-halo-mist-body'}`}>
                <Clock className="w-3 h-3 text-halo-mist-strong" aria-hidden="true" />
                {due.text}
              </span>
            )}
          </div>
          {g.description && (
            <p className="text-[13px] text-halo-mist-body mt-1 leading-relaxed">{g.description}</p>
          )}

          {/* The half this page was missing: what happens next, and whose turn
              it is. Same wording as the dashboard's relationship card. */}
          {open.length > 0 && (
            <div className="mt-3">
              <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
                Agreed next steps
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {open.map((sp) => {
                  const spDue = sp.due_date ? dueLabel(sp.due_date) : null;
                  return (
                    <li key={sp.id} className="text-sm text-halo-ink leading-snug">
                      <span className="text-halo-mist-body">{sp.owner}: </span>
                      {sp.title}
                      {spDue && (
                        <span className={spDue.late ? 'font-semibold' : 'text-halo-mist-body'}> · {spDue.text}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {done.length > 0 && (
            <p className="text-xs text-halo-heather mt-3">
              {done.length === 1 ? 'One step done: ' : `${done.length} steps done: `}
              {done.slice(0, 2).map((sp) => sp.title).join(', ')}
              {done.length > 2 ? '…' : ''}
            </p>
          )}

          {g.steps.length === 0 && hint && (
            <p className="text-[13px] text-halo-mist-body mt-3 leading-relaxed">
              No next step yet. You can agree one in your next conversation.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  /** Open steps that belong to a relationship but not to any one goal. */
  const [looseSteps, setLooseSteps] = useState<Map<string, Step[]>>(new Map());
  const [mentorships, setMentorships] = useState<Relationship[]>([]);
  const [role, setRole] = useState<'mentor' | 'mentee'>('mentee');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewGoalForm>({ mentorshipId: '', title: '', description: '', targetDate: '' });
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', uid).single();
      const myRole = profile?.role as 'mentor' | 'mentee';
      setRole(myRole);
      const myField = myRole === 'mentee' ? 'mentee_id' : 'mentor_id';
      const partnerField = myRole === 'mentee' ? 'mentor_id' : 'mentee_id';

      const { data: msList } = await supabase
        .from('mentorships')
        .select('id, mentee_id, mentor_id')
        .eq(myField, uid)
        .eq('status', 'active');

      const partnerIds = (msList ?? []).map((m) => m[partnerField]);
      const { data: partnerProfiles } = partnerIds.length
        ? await supabase.from('public_profiles').select('id, first_name, last_name, avatar_url').in('id', partnerIds)
        : { data: [] };

      const partnerMap = new Map((partnerProfiles ?? []).map((p) => [p.id, p]));
      const msWithNames: Relationship[] = (msList ?? []).map((m) => {
        const partner = partnerMap.get(m[partnerField]) ?? null;
        return {
          id: m.id,
          partnerId: m[partnerField],
          partnerName: displayName(partner),
          partnerFirst: firstName(partner),
          avatarUrl: partner?.avatar_url ?? null,
        };
      });
      setMentorships(msWithNames);

      if (msWithNames.length > 0) {
        setForm((f) => ({ ...f, mentorshipId: msWithNames[0].id }));
      }

      const msIds = (msList ?? []).map((m) => m.id);
      if (msIds.length > 0) {
        // Goals and the steps hanging off them, in one round trip each. The
        // steps are what the dashboard calls "agreed next steps"; they were
        // already in the database, linked by action_items.goal_id, and simply
        // were not shown here.
        const [goalsRes, stepsRes] = await Promise.all([
          supabase
            .from('mentorship_goals')
            .select('id, mentorship_id, title, description, status, target_date, completed_at, created_at')
            .in('mentorship_id', msIds)
            .order('created_at', { ascending: false }),
          // Every action item, not only the ones attached to a goal. The
          // dashboard shows all of them, and a page that said "no next step"
          // while the dashboard listed three would just be wrong.
          supabase
            .from('action_items')
            .select('id, goal_id, mentorship_id, title, assigned_to, is_completed, completed_at, due_date')
            .in('mentorship_id', msIds)
            .order('created_at', { ascending: true }),
        ]);

        const msMap = new Map(msWithNames.map((m) => [m.id, m]));
        const steps = stepsRes.data ?? [];
        const ownerOf = (assignedTo: string | null, rel?: Relationship) =>
          assignedTo === uid ? 'You' : assignedTo && assignedTo === rel?.partnerId ? (rel?.partnerFirst ?? 'They') : 'Unassigned';

        const loose = new Map<string, Step[]>();
        for (const a of steps) {
          if (a.goal_id || a.is_completed) continue;
          const rel = msMap.get(a.mentorship_id);
          const list = loose.get(a.mentorship_id) ?? [];
          list.push({
            id: a.id, title: a.title, is_completed: a.is_completed,
            completed_at: a.completed_at, due_date: a.due_date, owner: ownerOf(a.assigned_to, rel),
          });
          loose.set(a.mentorship_id, list);
        }
        setLooseSteps(loose);
        setGoals((goalsRes.data ?? []).map((g) => {
          const rel = msMap.get(g.mentorship_id);
          return {
            ...g,
            status: g.status as 'active' | 'completed' | 'cancelled',
            partnerName: rel?.partnerName ?? displayName(null),
            steps: steps
              .filter((a) => a.goal_id === g.id)
              .map((a) => ({
                id: a.id,
                title: a.title,
                is_completed: a.is_completed,
                completed_at: a.completed_at,
                due_date: a.due_date,
                owner: ownerOf(a.assigned_to, rel),
              })),
          };
        }));
      }

      setLoading(false);
    }
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mentorshipId || !form.title) return;
    setSaving(true);
    setActionError(null);

    const supabase = createClient();
    const { data: newGoal, error } = await supabase
      .from('mentorship_goals')
      .insert({
        mentorship_id: form.mentorshipId,
        created_by: userId,
        title: form.title,
        description: form.description || null,
        target_date: form.targetDate || null,
      })
      .select('id, mentorship_id, title, description, status, target_date, completed_at, created_at')
      .single();

    if (error) {
      setActionError('Could not create goal. Please try again.');
    } else if (newGoal) {
      const msName = mentorships.find((m) => m.id === form.mentorshipId)?.partnerName ?? displayName(null);
      setGoals((prev) => [{
        ...newGoal,
        status: newGoal.status as 'active' | 'completed' | 'cancelled',
        partnerName: msName,
        steps: [],
      }, ...prev]);
      setForm((f) => ({ ...f, title: '', description: '', targetDate: '' }));
      setShowForm(false);
    }
    setSaving(false);
  };

  const markComplete = async (goalId: string) => {
    setActionError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from('mentorship_goals')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', goalId);

    if (error) {
      setActionError('Could not update goal. Please try again.');
    } else {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, status: 'completed', completed_at: new Date().toISOString() }
            : g
        )
      );
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {actionError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5">
          <p className="text-sm font-medium text-red-700">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 text-xs flex-shrink-0">Dismiss</button>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">Goals</h1>
          <p className="text-halo-mist-body mt-1 text-sm">
            {role === 'mentor'
              ? 'What each student is working toward, and what you each said you’d do.'
              : 'What you’re working toward with each mentor, and what comes next.'}
          </p>
        </div>
        {mentorships.length > 0 && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 bg-halo-purple text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-halo-purple-d transition-colors"
          >
            <Plus className="w-4 h-4" />
            New goal
          </button>
        )}
      </div>

      {/* New goal form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-halo-lavender p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-halo-ink">Create a new goal</h3>

          {mentorships.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-halo-mist-body mb-1">
                {role === 'mentor' ? 'Which student?' : 'Which mentor?'}
              </label>
              <select
                value={form.mentorshipId}
                onChange={(e) => setForm((f) => ({ ...f, mentorshipId: e.target.value }))}
                className="w-full px-3 py-2 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple"
              >
                {mentorships.map((m) => (
                  <option key={m.id} value={m.id}>With {m.partnerName}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-halo-mist-body mb-1">Goal title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Land an investment banking internship"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-halo-mist-body mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="What does success look like?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-halo-mist-body mb-1">Target date</label>
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
              className="w-full px-3 py-2 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-halo-purple text-white py-2 rounded-xl text-sm font-medium hover:bg-halo-purple-d transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create goal'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 border border-halo-rule text-halo-heather rounded-xl text-sm font-medium hover:bg-halo-veil transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-halo-rule">
          <div className="w-12 h-12 bg-halo-veil rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6 text-halo-purple-d" />
          </div>
          <p className="text-base font-medium text-halo-ink mb-2">No goals yet</p>
          <p className="text-sm text-halo-mist-body mb-6 max-w-md mx-auto leading-relaxed">
            {mentorships.length === 0
              ? role === 'mentor'
                ? 'Once you’re working with a student, the goals you set together live here.'
                : 'Goals live here once you’re working with a mentor. One clear goal makes every conversation easier to plan.'
              : 'A goal gives each conversation a direction. One is enough to start.'}
          </p>
          {mentorships.length > 0 ? (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-halo-purple text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-halo-purple-d transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add first goal
            </button>
          ) : (
            <Link
              href={role === 'mentor' ? '/requests' : '/discover'}
              className="inline-flex items-center gap-2 bg-halo-purple text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-halo-purple-d transition-colors"
            >
              {role === 'mentor' ? 'See your requests' : 'Find a mentor'}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/*
            Grouped by the person, the way the dashboard groups everything else.
            Someone with two mentors was previously reading one flat list and
            working out from a grey line at the bottom of each card who each
            goal belonged to.
          */}
          {mentorships
            .filter((m) => goals.some((g) => g.mentorship_id === m.id))
            .map((m) => {
              const mine = goals.filter((g) => g.mentorship_id === m.id);
              const active = mine.filter((g) => g.status === 'active');
              const reached = mine.filter((g) => g.status === 'completed');
              return (
                <section key={m.id} aria-labelledby={`rel-${m.id}`} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={m.avatarUrl} name={m.partnerName} size="sm" />
                    <h2 id={`rel-${m.id}`} className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">
                      With {m.partnerName}
                    </h2>
                  </div>

                  {active.map((g, i) => (
                    <GoalCard
                      key={g.id}
                      g={g}
                      hint={i === 0 && active.every((x) => x.steps.length === 0) && (looseSteps.get(m.id)?.length ?? 0) === 0}
                      onComplete={() => markComplete(g.id)}
                    />
                  ))}

                  {(looseSteps.get(m.id)?.length ?? 0) > 0 && (
                    <div className="bg-white rounded-2xl border border-halo-rule px-5 py-4">
                      {/* Named for what it is. Calling this "agreed next steps"
                          too put the same heading twice on one screen. */}
                      <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
                        {active.some((g) => g.steps.some((sp) => !sp.is_completed))
                          ? 'Next steps not tied to a goal'
                          : 'Agreed next steps'}
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {looseSteps.get(m.id)!.map((sp) => {
                          const spDue = sp.due_date ? dueLabel(sp.due_date) : null;
                          return (
                            <li key={sp.id} className="text-sm text-halo-ink leading-snug">
                              <span className="text-halo-mist-body">{sp.owner}: </span>
                              {sp.title}
                              {spDue && <span className={spDue.late ? 'font-semibold' : 'text-halo-mist-body'}> · {spDue.text}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {reached.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">
                        Reached
                      </p>
                      {reached.map((g) => (
                        <div key={g.id} className="flex items-start gap-3 bg-white rounded-2xl border border-halo-rule px-5 py-3.5">
                          <CheckCircle2 className="w-4 h-4 text-halo-purple-d flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <p className="flex-1 min-w-0 text-sm text-halo-ink leading-snug">
                            {g.title}
                            {g.completed_at && (
                              <span className="text-halo-mist-body"> · reached {format(new Date(g.completed_at), 'MMMM d, yyyy')}</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
}
