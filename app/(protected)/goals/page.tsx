'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import { Target, Plus, CheckCircle, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';

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
}

interface NewGoalForm {
  mentorshipId: string;
  title: string;
  description: string;
  targetDate: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [mentorships, setMentorships] = useState<Array<{ id: string; partnerName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewGoalForm>({ mentorshipId: '', title: '', description: '', targetDate: '' });
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', uid).single();
      const role = profile?.role as 'mentor' | 'mentee';
      const myField = role === 'mentee' ? 'mentee_id' : 'mentor_id';
      const partnerField = role === 'mentee' ? 'mentor_id' : 'mentee_id';

      const { data: msList } = await supabase
        .from('mentorships')
        .select('id, mentee_id, mentor_id')
        .eq(myField, uid)
        .eq('status', 'active');

      const partnerIds = (msList ?? []).map((m) => m[partnerField]);
      const { data: partnerProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', partnerIds);

      const partnerMap = new Map(partnerProfiles?.map((p) => [p.id, `${p.first_name} ${p.last_name}`]) ?? []);
      const msWithNames = (msList ?? []).map((m) => ({
        id: m.id,
        partnerName: partnerMap.get(m[partnerField]) ?? 'Unknown',
      }));
      setMentorships(msWithNames);

      if (msWithNames.length > 0) {
        setForm((f) => ({ ...f, mentorshipId: msWithNames[0].id }));
      }

      const msIds = (msList ?? []).map((m) => m.id);
      if (msIds.length > 0) {
        const { data: goalsData } = await supabase
          .from('mentorship_goals')
          .select('id, mentorship_id, title, description, status, target_date, completed_at, created_at')
          .in('mentorship_id', msIds)
          .order('created_at', { ascending: false });

        const msNameMap = new Map(msWithNames.map((m) => [m.id, m.partnerName]));
        setGoals((goalsData ?? []).map((g) => ({
          ...g,
          status: g.status as 'active' | 'completed' | 'cancelled',
          partnerName: msNameMap.get(g.mentorship_id) ?? 'Unknown',
        })));
      }

      setLoading(false);
    }
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mentorshipId || !form.title) return;
    setSaving(true);

    const supabase = createClient();
    const { data: newGoal } = await supabase
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

    if (newGoal) {
      const msName = mentorships.find((m) => m.id === form.mentorshipId)?.partnerName ?? 'Unknown';
      setGoals((prev) => [{
        ...newGoal,
        status: newGoal.status as 'active' | 'completed' | 'cancelled',
        partnerName: msName,
      }, ...prev]);
    }

    setForm((f) => ({ ...f, title: '', description: '', targetDate: '' }));
    setShowForm(false);
    setSaving(false);
  };

  const markComplete = async (goalId: string) => {
    const supabase = createClient();
    await supabase
      .from('mentorship_goals')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', goalId);

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, status: 'completed', completed_at: new Date().toISOString() }
          : g
      )
    );
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  const active = goals.filter((g) => g.status === 'active');
  const completed = goals.filter((g) => g.status === 'completed');

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Goals</h1>
          <p className="text-gray-500 mt-1 text-sm">Track what you&apos;re working toward in each mentorship.</p>
        </div>
        {mentorships.length > 0 && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 bg-navy-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-navy-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New goal
          </button>
        )}
      </div>

      {/* New goal form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-navy-200 p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-900">Create a new goal</h3>

          {mentorships.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mentorship</label>
              <select
                value={form.mentorshipId}
                onChange={(e) => setForm((f) => ({ ...f, mentorshipId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
              >
                {mentorships.map((m) => (
                  <option key={m.id} value={m.id}>With {m.partnerName}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Goal title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Land an investment banking internship"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="What does success look like?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Target date</label>
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-navy-900 text-white py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create goal'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="w-12 h-12 bg-navy-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6 text-navy-600" />
          </div>
          <p className="text-base font-medium text-navy-900 mb-2">No goals yet</p>
          <p className="text-sm text-gray-400 mb-6">
            {mentorships.length === 0
              ? 'Start a mentorship to create goals with your partner.'
              : 'Set goals to track your progress in this mentorship.'}
          </p>
          {mentorships.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-navy-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add first goal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Active ({active.length})
              </h2>
              <div className="space-y-3">
                {active.map((g) => (
                  <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-navy-200 hover:shadow-sm transition-all">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => markComplete(g.id)}
                        className="mt-0.5 text-gray-300 hover:text-green-500 transition-colors flex-shrink-0"
                        title="Mark as complete"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-navy-900">{g.title}</p>
                          {g.target_date && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {format(new Date(g.target_date), 'MMM d')}
                            </div>
                          )}
                        </div>
                        {g.description && (
                          <p className="text-xs text-gray-500 mt-1">{g.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">With {g.partnerName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Completed ({completed.length})
              </h2>
              <div className="space-y-3">
                {completed.map((g) => (
                  <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-5 opacity-60">
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-900 line-through">{g.title}</p>
                        {g.completed_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Completed {format(new Date(g.completed_at), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
