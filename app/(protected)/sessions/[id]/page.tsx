'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Video, Clock, ExternalLink, Star, ArrowLeft, CheckCircle, Circle,
  Plus, Check, FileText, MessageSquare,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import { format, formatDistanceToNow } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionDetail {
  id: string;
  mentorship_id: string;
  mentor_id: string;
  mentee_id: string;
  scheduled_at: string;
  duration_minutes: number;
  session_type: string;
  notes: string | null;
  mentor_recap: string | null;
  video_link: string | null;
  status: string;
  mentor: { first_name: string; last_name: string; avatar_url: string | null };
  mentee: { first_name: string; last_name: string; avatar_url: string | null };
}

interface ActionItem {
  id: string;
  title: string;
  assigned_to: string;
  is_completed: boolean;
  due_date: string | null;
  assigneeName: string;
}

interface PreBrief {
  openActionItems: { id: string; title: string; due_date: string | null }[];
  menteeGoals: { id: string; title: string; status: string }[];
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  scheduled:   'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed:   'bg-green-50 text-green-700',
  cancelled:   'bg-red-50 text-red-600',
};

// ─── Pre-meeting brief card ───────────────────────────────────────────────────

function PreMeetingBrief({ brief, menteeName }: { brief: PreBrief; menteeName: string }) {
  const hasContent =
    brief.openActionItems.length > 0 ||
    brief.menteeGoals.length > 0 ||
    brief.lastMessageAt;

  if (!hasContent) return null;

  return (
    <div className="bg-navy-50 border border-navy-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-navy-600" />
        <h3 className="text-sm font-semibold text-navy-900">
          Pre-Meeting Brief — {menteeName}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Open action items */}
        {brief.openActionItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
              Open action items ({brief.openActionItems.length})
            </p>
            <div className="space-y-1.5">
              {brief.openActionItems.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-start gap-2">
                  <Circle className="w-3.5 h-3.5 text-navy-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-navy-900">{item.title}</p>
                    {item.due_date && (
                      <p className="text-xs text-gray-400">
                        Due {format(new Date(item.due_date), 'MMM d')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {brief.openActionItems.length > 4 && (
                <p className="text-xs text-navy-500 pl-5">
                  +{brief.openActionItems.length - 4} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Active goals */}
        {brief.menteeGoals.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
              Active goals
            </p>
            <div className="space-y-1">
              {brief.menteeGoals.slice(0, 3).map((g) => (
                <p key={g.id} className="text-sm text-navy-900">
                  · {g.title}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Last message */}
        {brief.lastMessageAt && (
          <div className="flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-navy-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">
                Last message{' '}
                {formatDistanceToNow(new Date(brief.lastMessageAt), {
                  addSuffix: true,
                })}
              </p>
              {brief.lastMessagePreview && (
                <p className="text-xs text-gray-400 truncate max-w-xs">
                  &ldquo;{brief.lastMessagePreview}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState<'mentor' | 'mentee'>('mentee');
  const [hasReview, setHasReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notes
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  // Mentor recap (post-session)
  const [recap, setRecap] = useState('');
  const [recapSaved, setRecapSaved] = useState(false);
  const [recapLoading, setRecapLoading] = useState(false);

  // Action items
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionDueDate, setNewActionDueDate] = useState('');
  const [addingAction, setAddingAction] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);

  // Mark complete
  const [markingComplete, setMarkingComplete] = useState(false);

  // Pre-meeting brief (mentor only, scheduled sessions)
  const [preBrief, setPreBrief] = useState<PreBrief | null>(null);

  const loadActionItems = useCallback(
    async (mentorshipId: string) => {
      const supabase = createClient();
      const { data } = await supabase
        .from('action_items')
        .select('id, title, assigned_to, is_completed, due_date')
        .eq('session_id', id)
        .eq('mentorship_id', mentorshipId);

      if (!data) return;

      const assigneeIds = [...new Set(data.map((a) => a.assigned_to))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', assigneeIds);

      const nameMap = new Map(
        profiles?.map((p) => [p.id, `${p.first_name} ${p.last_name}`]) ?? []
      );
      setActionItems(
        data.map((a) => ({ ...a, assigneeName: nameMap.get(a.assigned_to) ?? 'Unknown' }))
      );
    },
    [id]
  );

  const loadPreBrief = useCallback(
    async (mentorshipId: string, menteeId: string) => {
      const supabase = createClient();

      const [openActionsRes, goalsRes, lastMsgRes] = await Promise.all([
        // Open action items for this mentee (across mentorship, not just this session)
        supabase
          .from('action_items')
          .select('id, title, due_date')
          .eq('mentorship_id', mentorshipId)
          .eq('assigned_to', menteeId)
          .eq('is_completed', false)
          .order('due_date', { ascending: true })
          .limit(10),
        // Active goals for this mentorship
        supabase
          .from('mentorship_goals')
          .select('id, title, status')
          .eq('mentorship_id', mentorshipId)
          .eq('status', 'active')
          .limit(5),
        // Last message in conversation
        supabase
          .from('messages')
          .select('content, created_at')
          .eq('mentorship_id', mentorshipId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setPreBrief({
        openActionItems: openActionsRes.data ?? [],
        menteeGoals: goalsRes.data ?? [],
        lastMessageAt: lastMsgRes.data?.created_at ?? null,
        lastMessagePreview: lastMsgRes.data?.content ?? null,
      });
    },
    []
  );

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      const uid = authSession.user.id;
      setUserId(uid);

      const [sessionRes, profileRes, reviewRes] = await Promise.all([
        supabase
          .from('sessions')
          .select(`
            id, mentorship_id, mentor_id, mentee_id,
            scheduled_at, duration_minutes, session_type,
            notes, mentor_recap, video_link, status,
            mentor:mentor_id(first_name, last_name, avatar_url),
            mentee:mentee_id(first_name, last_name, avatar_url)
          `)
          .eq('id', id)
          .single(),
        supabase.from('profiles').select('role').eq('id', uid).single(),
        supabase
          .from('reviews')
          .select('id')
          .eq('session_id', id)
          .eq('reviewer_id', uid)
          .maybeSingle(),
      ]);

      const sessionData = sessionRes.data as unknown as SessionDetail;
      setSession(sessionData);
      if (sessionData?.notes) setNotes(sessionData.notes);
      if (sessionData?.mentor_recap) setRecap(sessionData.mentor_recap);

      const role = profileRes.data?.role as 'mentor' | 'mentee';
      setUserRole(role);
      setHasReview(!!reviewRes.data);

      if (sessionData?.mentorship_id) {
        await loadActionItems(sessionData.mentorship_id);

        // Load pre-meeting brief for mentor on scheduled/upcoming sessions
        if (role === 'mentor' && sessionData.status === 'scheduled') {
          await loadPreBrief(sessionData.mentorship_id, sessionData.mentee_id);
        }
      }

      setLoading(false);
    }
    load();
  }, [id, loadActionItems, loadPreBrief]);

  const saveNotes = async () => {
    if (!session) return;
    setNotesLoading(true);
    const supabase = createClient();
    await supabase.from('sessions').update({ notes }).eq('id', id);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
    setNotesLoading(false);
  };

  const saveRecap = async () => {
    if (!session) return;
    setRecapLoading(true);
    const supabase = createClient();
    await supabase.from('sessions').update({ mentor_recap: recap }).eq('id', id);
    setRecapSaved(true);
    setTimeout(() => setRecapSaved(false), 2000);
    setRecapLoading(false);
  };

  const addActionItem = async () => {
    if (!newActionTitle.trim() || !session) return;
    setAddingAction(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('action_items')
      .insert({
        mentorship_id: session.mentorship_id,
        session_id: id,
        created_by: userId,
        assigned_to: userId,
        title: newActionTitle.trim(),
        due_date: newActionDueDate || null,
      })
      .select('id, title, assigned_to, is_completed, due_date')
      .single();

    if (data) {
      setActionItems((prev) => [...prev, { ...data, assigneeName: 'Me' }]);
    }
    setNewActionTitle('');
    setNewActionDueDate('');
    setShowAddAction(false);
    setAddingAction(false);
  };

  const toggleActionItem = async (itemId: string, current: boolean) => {
    const supabase = createClient();
    await supabase
      .from('action_items')
      .update({
        is_completed: !current,
        completed_at: !current ? new Date().toISOString() : null,
      })
      .eq('id', itemId);
    setActionItems((prev) =>
      prev.map((a) => (a.id === itemId ? { ...a, is_completed: !current } : a))
    );
  };

  const markSessionComplete = async () => {
    if (!session) return;
    setMarkingComplete(true);
    const supabase = createClient();
    await supabase.from('sessions').update({ status: 'completed' }).eq('id', id);
    setSession((s) => (s ? { ...s, status: 'completed' } : s));
    setMarkingComplete(false);
  };

  const submitReview = async () => {
    if (!rating || !session) return;
    setReviewLoading(true);
    const supabase = createClient();
    const revieweeId =
      session.mentor_id === userId ? session.mentee_id : session.mentor_id;
    await supabase.from('reviews').insert({
      session_id: id,
      reviewer_id: userId,
      reviewee_id: revieweeId,
      rating,
      feedback: feedback || null,
    });
    setReviewSubmitted(true);
    setReviewLoading(false);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  if (!session)
    return (
      <p className="text-center py-24 text-gray-400">Session not found.</p>
    );

  const date = new Date(session.scheduled_at);
  const isCompleted = session.status === 'completed';
  const isScheduled = session.status === 'scheduled';
  const canReview = isCompleted && !hasReview && !reviewSubmitted;
  const mentor = session.mentor as unknown as {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  const mentee = session.mentee as unknown as {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  const partner = session.mentor_id === userId ? mentee : mentor;
  const isMentor = userRole === 'mentor';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/schedule"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Schedule
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Session Workspace</h1>
            <p className="text-gray-500 text-sm mt-1">
              with {partner.first_name} {partner.last_name} ·{' '}
              {format(date, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <span
            className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize ${
              STATUS_STYLES[session.status] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {session.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Pre-meeting brief — mentor only, scheduled */}
      {isMentor && isScheduled && preBrief && (
        <PreMeetingBrief
          brief={preBrief}
          menteeName={`${mentee.first_name} ${mentee.last_name}`}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Notes / Agenda */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-navy-900">
                {isCompleted ? 'Session Notes' : 'Agenda & Notes'}
              </h2>
              <button
                onClick={saveNotes}
                disabled={notesLoading}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-600 hover:text-navy-900 transition-colors"
              >
                {notesSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" /> Saved
                  </>
                ) : notesLoading ? (
                  'Saving...'
                ) : (
                  'Save notes'
                )}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              placeholder={`What will you cover in this session?\n\n• Topic 1\n• Topic 2\n• Questions to ask`}
              className="w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Post-session recap — mentor only, after completing */}
          {isMentor && isCompleted && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-navy-900">
                  Session Recap
                </h2>
                <button
                  onClick={saveRecap}
                  disabled={recapLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-600 hover:text-navy-900 transition-colors"
                >
                  {recapSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" /> Saved
                    </>
                  ) : recapLoading ? (
                    'Saving...'
                  ) : (
                    'Save recap'
                  )}
                </button>
              </div>
              <textarea
                value={recap}
                onChange={(e) => setRecap(e.target.value)}
                rows={5}
                placeholder={`Summarize what was covered, decisions made, and key takeaways for ${mentee.first_name}…`}
                className="w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Action items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-navy-900">
                Action Items
              </h2>
              <button
                onClick={() => setShowAddAction((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-600 hover:text-navy-900 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add item
              </button>
            </div>

            {showAddAction && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl space-y-3">
                <input
                  type="text"
                  value={newActionTitle}
                  onChange={(e) => setNewActionTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
                  onKeyDown={(e) => e.key === 'Enter' && addActionItem()}
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newActionDueDate}
                    onChange={(e) => setNewActionDueDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
                  />
                  <button
                    onClick={addActionItem}
                    disabled={addingAction || !newActionTitle.trim()}
                    className="px-4 py-2 bg-navy-900 text-white text-sm rounded-lg hover:bg-navy-800 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddAction(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {actionItems.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                No action items yet. Add tasks to follow up on after this
                session.
              </p>
            ) : (
              <div className="space-y-2">
                {actionItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-2">
                    <button
                      onClick={() => toggleActionItem(item.id, item.is_completed)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {item.is_completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-navy-400 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          item.is_completed
                            ? 'line-through text-gray-400'
                            : 'text-navy-900'
                        }`}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span>{item.assigneeName}</span>
                        {item.due_date && (
                          <span>
                            · Due {format(new Date(item.due_date), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Session info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-navy-900 mb-4">
              Session Info
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>
                  {format(date, 'h:mm a')} · {session.duration_minutes} min
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="capitalize">
                  {session.session_type === 'video' ? 'Video Call' : 'Async'}
                </span>
              </div>
            </div>

            {session.video_link && !isCompleted && (
              <a
                href={session.video_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-navy-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Join Call
              </a>
            )}

            {isScheduled && isMentor && (
              <button
                onClick={markSessionComplete}
                disabled={markingComplete}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-green-300 text-green-700 py-2.5 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {markingComplete ? 'Marking...' : 'Mark Complete'}
              </button>
            )}
          </div>

          {/* Participants */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-navy-900 mb-4">
              Participants
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Mentor', data: mentor },
                { label: 'Mentee', data: mentee },
              ].map(({ label, data }) => (
                <div key={label} className="flex items-center gap-3">
                  <Avatar
                    src={data?.avatar_url ?? null}
                    name={`${data?.first_name} ${data?.last_name}`}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-navy-900">
                      {data?.first_name} {data?.last_name}
                    </p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review */}
          {canReview && (
            <div className="bg-white rounded-2xl border border-navy-100 p-5">
              <h3 className="text-sm font-semibold text-navy-900 mb-4">
                Leave a Review
              </h3>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-200 fill-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Share how the session went..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 resize-none mb-3"
              />
              <button
                onClick={submitReview}
                disabled={reviewLoading || !rating}
                className="w-full py-2.5 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 disabled:opacity-50 transition-colors"
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}

          {reviewSubmitted && (
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">
                Review submitted!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
