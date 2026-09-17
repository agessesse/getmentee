'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, LayoutGrid, List, Plus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';

/**
 * Weekly availability, rebuilt.
 *
 * WHAT IT REPLACED. Seven stacked cards, each with a small "Add window" link
 * that opened two raw browser time inputs. Every window saved the moment it was
 * added, there was no overview of the week, nothing could be copied from one
 * day to another, and removal was a 14px trash icon. It worked, but it felt
 * like an admin form, and it was hardest to use for exactly the mentors with
 * the least patience for admin forms.
 *
 * HOW IT WORKS NOW. Two views over one draft:
 *
 *   Week view   a calendar grid. Drag down a day, or across several days, to
 *               block out time. Drag over existing time to clear it. This is
 *               the fastest way to say "weekday mornings".
 *   Day by day  one row per day with an on/off switch, times picked from plain
 *               lists ("9:00 AM"), large buttons to add a time or copy a day to
 *               every weekday. Fully keyboard operable, and the default on a
 *               phone, where a drag grid is the wrong tool.
 *
 * Presets cover the common patterns in one tap. Nothing is written until the
 * mentor presses Save, so experimenting is safe and Discard is a real undo.
 *
 * DATA. Unchanged: rows in availability_slots of (day_of_week, start_time,
 * end_time), which BookingModal and the mentor dashboard already read. The
 * editor works in 30-minute steps. Saving diffs the draft against what is
 * stored: new windows are inserted first and removed windows deleted after, so
 * a failure part-way leaves extra availability rather than none.
 */

// ─── Model ────────────────────────────────────────────────────────────────────

const STEP = 30; // minutes
const SLOTS = (24 * 60) / STEP; // 48
/** Week starts Monday, the way most working calendars read. Values are day_of_week (Sunday = 0). */
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAYS = [1, 2, 3, 4, 5];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Grid = boolean[][]; // [day_of_week][slot]
interface Interval { start: number; end: number } // slot indices, end exclusive
interface StoredSlot { id: string; day_of_week: number; start_time: string; end_time: string }

const emptyGrid = (): Grid => Array.from({ length: 7 }, () => Array<boolean>(SLOTS).fill(false));
const cloneGrid = (g: Grid): Grid => g.map((d) => [...d]);

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};
const toTime = (slot: number) => {
  const mins = slot * STEP;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
};

/** "9:00 AM", "12:30 PM", and "Midnight" for the end of the day. */
function label(slot: number) {
  if (slot === SLOTS) return 'Midnight';
  const mins = slot * STEP;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
function hourLabel(slot: number) {
  const h = Math.floor((slot * STEP) / 60);
  if (h === 12) return 'Noon';
  return `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
}

function intervalsOf(day: boolean[]): Interval[] {
  const out: Interval[] = [];
  let start = -1;
  for (let i = 0; i <= SLOTS; i++) {
    const on = i < SLOTS && day[i];
    if (on && start < 0) start = i;
    if (!on && start >= 0) { out.push({ start, end: i }); start = -1; }
  }
  return out;
}

function gridFromSlots(slots: StoredSlot[]): Grid {
  const g = emptyGrid();
  for (const s of slots) {
    const a = Math.floor(toMinutes(s.start_time) / STEP);
    const b = Math.min(SLOTS, Math.ceil(toMinutes(s.end_time) / STEP));
    for (let i = a; i < b; i++) g[s.day_of_week][i] = true;
  }
  return g;
}

const sameGrid = (a: Grid, b: Grid) => a.every((d, i) => d.every((v, j) => v === b[i][j]));

function fill(g: Grid, days: number[], start: number, end: number, value: boolean) {
  for (const d of days) for (let i = start; i < end; i++) g[d][i] = value;
}

/** Readable summary: days with identical times are grouped ("Mon – Fri"). */
function summarize(g: Grid): string[] {
  const rows: { days: number[]; text: string }[] = [];
  for (const d of WEEK) {
    const iv = intervalsOf(g[d]);
    if (!iv.length) continue;
    const text = iv.map((x) => `${label(x.start)} – ${label(x.end)}`).join(', ');
    const last = rows[rows.length - 1];
    const prevDay = last ? last.days[last.days.length - 1] : null;
    const consecutive = prevDay !== null && WEEK.indexOf(d) === WEEK.indexOf(prevDay) + 1;
    if (last && last.text === text && consecutive) last.days.push(d);
    else rows.push({ days: [d], text });
  }
  return rows.map((r) => {
    const days = r.days.length > 2
      ? `${DAY_SHORT[r.days[0]]} – ${DAY_SHORT[r.days[r.days.length - 1]]}`
      : r.days.map((d) => DAY_SHORT[d]).join(', ');
    return `${days} · ${r.text}`;
  });
}

const PRESETS: { key: string; label: string; days: number[]; start: number; end: number }[] = [
  { key: 'wd-am', label: 'Weekday mornings', days: WEEKDAYS, start: 18, end: 24 },   // 9–12
  { key: 'wd-pm', label: 'Weekday afternoons', days: WEEKDAYS, start: 26, end: 34 }, // 1–5
  { key: 'wd-ev', label: 'Weekday evenings', days: WEEKDAYS, start: 36, end: 40 },   // 6–8
  { key: 'we-am', label: 'Weekend mornings', days: [6, 0], start: 20, end: 26 },     // 10–1
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AvailabilityPlanner({
  userId,
  onDirtyChange,
}: {
  userId: string;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [stored, setStored] = useState<StoredSlot[]>([]);
  const [saved, setSaved] = useState<Grid>(emptyGrid);
  const [draft, setDraft] = useState<Grid>(emptyGrid);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [view, setView] = useState<'week' | 'list'>('week');

  const timeZone = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const short = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
        .formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value;
      return short ? `${tz.replace(/_/g, ' ')} (${short})` : tz.replace(/_/g, ' ');
    } catch { return null; }
  }, []);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('availability_slots')
      .select('id, day_of_week, start_time, end_time')
      .eq('mentor_id', userId);
    if (err) setError('Your availability didn’t load. Refresh the page to try again.');
    const rows = (data ?? []) as StoredSlot[];
    const g = gridFromSlots(rows);
    setStored(rows);
    setSaved(g);
    setDraft(cloneGrid(g));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Phones get the list: a drag grid on a 390px screen is the wrong tool.
  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) setView('list');
  }, []);

  const dirty = !loading && !sameGrid(saved, draft);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const edit = (fn: (g: Grid) => void) => {
    setJustSaved(false);
    setDraft((prev) => { const g = cloneGrid(prev); fn(g); return g; });
  };

  const save = async () => {
    setSaving(true);
    setError('');
    const supabase = createClient();

    const wanted = WEEK.flatMap((d) => intervalsOf(draft[d]).map((iv) => ({
      day_of_week: d, start_time: toTime(iv.start), end_time: iv.end === SLOTS ? '24:00' : toTime(iv.end),
    })));
    const key = (x: { day_of_week: number; start_time: string; end_time: string }) =>
      `${x.day_of_week}|${toMinutes(x.start_time)}|${toMinutes(x.end_time)}`;
    const storedKeys = new Set(stored.map(key));
    const wantedKeys = new Set(wanted.map(key));
    const toInsert = wanted.filter((w) => !storedKeys.has(key(w))).map((w) => ({ ...w, mentor_id: userId }));
    const toDelete = stored.filter((s) => !wantedKeys.has(key(s))).map((s) => s.id);

    // Insert before delete: a failure in between leaves extra availability, never none.
    if (toInsert.length) {
      const { error: err } = await supabase.from('availability_slots').insert(toInsert);
      if (err) { setError('Your changes didn’t save. Check your connection and try again.'); setSaving(false); return; }
    }
    if (toDelete.length) {
      const { error: err } = await supabase.from('availability_slots').delete().in('id', toDelete);
      if (err) { setError('Some old times couldn’t be removed. Try saving again.'); setSaving(false); await load(); return; }
    }
    await load();
    setSaving(false);
    setJustSaved(true);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  const summary = summarize(draft);

  return (
    <div className="space-y-6 pb-24">
      {/* Intro + summary */}
      <div className="bg-white rounded-2xl border border-halo-rule p-5 sm:p-6">
        <h2 className="font-display font-normal text-[1.5rem] leading-tight text-halo-ink">When can mentees book time with you?</h2>
        <p className="text-[15px] text-halo-heather mt-1.5 leading-relaxed">
          Choose the times that usually work each week. Mentees pick from these when they ask for a session.
        </p>

        <div className="mt-5 rounded-xl bg-halo-veil border border-halo-lavender px-4 py-3.5">
          <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d">Your week</p>
          {summary.length ? (
            <ul className="mt-1.5 space-y-1">
              {summary.map((line) => <li key={line} className="text-[15px] text-halo-ink">{line}</li>)}
            </ul>
          ) : (
            <p className="text-[15px] text-halo-heather mt-1.5">No times chosen yet. Start with a preset below, or pick times yourself.</p>
          )}
          {timeZone && <p className="text-xs text-halo-mist-body mt-2">Times are in your time zone, {timeZone}.</p>}
        </div>
      </div>

      {/* Presets */}
      <div>
        <p className="text-sm font-semibold text-halo-ink mb-2.5">Quick start</p>
        <div className="flex flex-wrap gap-2.5">
          {PRESETS.map((p) => {
            const on = p.days.every((d) => draft[d].slice(p.start, p.end).every(Boolean));
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={on}
                onClick={() => edit((g) => fill(g, p.days, p.start, p.end, !on))}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2 ${
                  on
                    ? 'bg-halo-purple border-halo-purple text-white'
                    : 'bg-white border-halo-rule text-halo-ink hover:border-halo-purple'
                }`}
              >
                {on ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4 text-halo-purple-d" />}
                {p.label}
                <span className={on ? 'text-white/80' : 'text-halo-mist-body'}>
                  {label(p.start).replace(':00', '')}–{label(p.end).replace(':00', '')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* View switch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="How to edit" className="hidden md:inline-flex rounded-xl bg-halo-veil border border-halo-rule p-1">
          {([['week', 'Week view', LayoutGrid], ['list', 'Day by day', List]] as const).map(([key, text, Icon]) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${
                view === key ? 'bg-white text-halo-ink shadow-sm' : 'text-halo-heather hover:text-halo-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              {text}
            </button>
          ))}
        </div>
        {summary.length > 0 && (
          <button
            type="button"
            onClick={() => edit((g) => fill(g, [0, 1, 2, 3, 4, 5, 6], 0, SLOTS, false))}
            className="text-sm font-medium text-halo-heather hover:text-halo-ink underline underline-offset-4 decoration-halo-rule hover:decoration-halo-ink transition-colors"
          >
            Clear the week
          </button>
        )}
      </div>

      {view === 'week'
        ? <WeekGrid draft={draft} edit={edit} />
        : <DayList draft={draft} edit={edit} />}

      {error && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Save bar: only while there is something to save, or just after saving. */}
      {(dirty || justSaved) && (
        <div className="sticky bottom-4 z-10">
          <div className="halo-pop flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-halo-rule rounded-2xl shadow-[0_18px_50px_-12px_rgba(21,19,26,0.25)] px-5 py-4">
            {dirty ? (
              <>
                <p className="text-[15px] text-halo-ink">You have unsaved changes.</p>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setDraft(cloneGrid(saved)); setError(''); }}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl border border-halo-rule bg-white text-sm font-medium text-halo-ink hover:border-halo-purple transition-colors disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-halo-purple text-white text-sm font-semibold shadow-sm hover:bg-halo-purple-d transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
                  >
                    {saving ? <Spinner size="sm" className="text-white" /> : <Check className="w-4 h-4" />}
                    {saving ? 'Saving…' : 'Save availability'}
                  </button>
                </div>
              </>
            ) : (
              <p className="inline-flex items-center gap-2 text-[15px] text-halo-ink" role="status">
                <span className="w-6 h-6 rounded-full bg-halo-purple flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></span>
                Saved. Mentees will see these times when they book.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────

const ROW_PX = 22; // per 30 minutes

function WeekGrid({ draft, edit }: { draft: Grid; edit: (fn: (g: Grid) => void) => void }) {
  // Show 7 AM – 9 PM, widened to include any time already chosen outside it.
  const used = draft.flatMap((d) => d.map((v, i) => (v ? i : -1)).filter((i) => i >= 0));
  const first = Math.min(14, ...(used.length ? [Math.floor(Math.min(...used) / 2) * 2] : [14]));
  const last = Math.max(42, ...(used.length ? [Math.ceil((Math.max(...used) + 1) / 2) * 2] : [42]));
  const rows = Array.from({ length: last - first }, (_, i) => first + i);

  const [drag, setDrag] = useState<{ d0: number; s0: number; d1: number; s1: number; add: boolean } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const cellAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const cell = el?.closest?.('[data-cell]') as HTMLElement | null;
    if (!cell || !gridRef.current?.contains(cell)) return null;
    return { d: Number(cell.dataset.day), s: Number(cell.dataset.slot) };
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const c = cellAt(e.clientX, e.clientY);
    if (!c) return;
    e.preventDefault();
    setDrag({ d0: c.d, s0: c.s, d1: c.d, s1: c.s, add: !draft[c.d][c.s] });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const c = cellAt(e.clientX, e.clientY);
    if (c && (c.d !== drag.d1 || c.s !== drag.s1)) setDrag({ ...drag, d1: c.d, s1: c.s });
  };
  const commit = useCallback(() => {
    if (!drag) return;
    const cols = WEEK.slice(Math.min(WEEK.indexOf(drag.d0), WEEK.indexOf(drag.d1)), Math.max(WEEK.indexOf(drag.d0), WEEK.indexOf(drag.d1)) + 1);
    const a = Math.min(drag.s0, drag.s1);
    const b = Math.max(drag.s0, drag.s1) + 1;
    edit((g) => fill(g, cols, a, b, drag.add));
    setDrag(null);
  }, [drag, edit]);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener('pointerup', commit);
    return () => window.removeEventListener('pointerup', commit);
  }, [drag, commit]);

  const inDrag = (d: number, s: number) => {
    if (!drag) return false;
    const c = WEEK.indexOf(d);
    const c0 = Math.min(WEEK.indexOf(drag.d0), WEEK.indexOf(drag.d1));
    const c1 = Math.max(WEEK.indexOf(drag.d0), WEEK.indexOf(drag.d1));
    return c >= c0 && c <= c1 && s >= Math.min(drag.s0, drag.s1) && s <= Math.max(drag.s0, drag.s1);
  };

  return (
    <div className="bg-white rounded-2xl border border-halo-rule overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-halo-rule bg-halo-ivory">
        <span className="w-3 h-3 rounded bg-halo-purple" aria-hidden="true" />
        <p className="text-sm text-halo-heather">
          <span className="font-medium text-halo-ink">Click and drag</span> to add time. Drag over purple time to remove it.
        </p>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-halo-rule">
        <div />
        {WEEK.map((d) => {
          const has = draft[d].some(Boolean);
          return (
            <div key={d} className="py-3 text-center border-l border-halo-rule">
              <p className={`text-sm font-semibold ${has ? 'text-halo-ink' : 'text-halo-mist-body'}`}>{DAY_SHORT[d]}</p>
            </div>
          );
        })}
      </div>

      <div
        ref={gridRef}
        className="relative grid grid-cols-[64px_repeat(7,minmax(0,1fr))] select-none touch-none cursor-crosshair"
        onPointerDown={onDown}
        onPointerMove={onMove}
        aria-label="Weekly availability grid. Use Day by day for keyboard editing."
      >
        {/* Hour gutter */}
        <div>
          {rows.map((s) => (
            <div key={s} style={{ height: ROW_PX }} className="relative">
              {s % 2 === 0 && (
                <span className="absolute -top-2 right-2 text-[11px] font-medium text-halo-mist-body tabular-nums whitespace-nowrap">
                  {s === first ? '' : hourLabel(s)}
                </span>
              )}
            </div>
          ))}
        </div>

        {WEEK.map((d) => (
          <div key={d} className="relative border-l border-halo-rule">
            {rows.map((s) => {
              const preview = inDrag(d, s);
              const on = draft[d][s];
              const shown = preview ? drag!.add : on;
              return (
                <div
                  key={s}
                  data-cell
                  data-day={d}
                  data-slot={s}
                  style={{ height: ROW_PX }}
                  className={`${s % 2 === 0 ? 'border-t border-halo-rule/70' : 'border-t border-dashed border-halo-rule/40'} ${
                    preview
                      ? (drag!.add ? 'bg-halo-lavender' : 'bg-red-50')
                      : shown ? '' : 'hover:bg-halo-veil'
                  } transition-colors`}
                />
              );
            })}

            {/* Chosen blocks, drawn over the cells so each reads as one piece of time. */}
            {intervalsOf(draft[d]).map((iv) => {
              const top = (Math.max(iv.start, first) - first) * ROW_PX;
              const height = (Math.min(iv.end, last) - Math.max(iv.start, first)) * ROW_PX;
              if (height <= 0) return null;
              const hiddenByDrag = drag && !drag.add && [...Array(iv.end - iv.start)].some((_, k) => inDrag(d, iv.start + k));
              return (
                <div
                  key={iv.start}
                  className={`pointer-events-none absolute left-1 right-1 rounded-lg bg-halo-purple text-white px-1.5 py-1 overflow-hidden shadow-sm ${hiddenByDrag ? 'opacity-40' : ''}`}
                  style={{ top: top + 1, height: height - 2 }}
                >
                  {height >= ROW_PX * 2 - 2 && (
                    <p className="text-[11px] font-semibold leading-tight">
                      {label(iv.start).replace(':00', '')}
                      <span className="font-normal opacity-90"> – {label(iv.end).replace(':00', '')}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Day by day ───────────────────────────────────────────────────────────────

const TIME_OPTIONS = Array.from({ length: SLOTS + 1 }, (_, i) => i);

function DayList({ draft, edit }: { draft: Grid; edit: (fn: (g: Grid) => void) => void }) {
  const [copied, setCopied] = useState<number | null>(null);

  const setRange = (d: number, old: Interval, next: Interval) =>
    edit((g) => {
      fill(g, [d], old.start, old.end, false);
      fill(g, [d], next.start, Math.max(next.end, next.start + 1), true);
    });

  return (
    <ul className="space-y-3">
      {WEEK.map((d) => {
        const intervals = intervalsOf(draft[d]);
        const on = intervals.length > 0;
        const lastEnd = intervals.length ? intervals[intervals.length - 1].end : 18;
        const canAdd = lastEnd + 2 <= SLOTS;
        return (
          <li key={d} className={`rounded-2xl border p-4 sm:p-5 transition-colors ${on ? 'bg-white border-halo-rule' : 'bg-halo-ivory border-halo-rule/70'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${DAY_LONG[d]} ${on ? 'available' : 'unavailable'}`}
                  onClick={() => edit((g) => {
                    // Off clears the day. On starts from a sensible 9 AM – 5 PM to adjust.
                    fill(g, [d], 0, SLOTS, false);
                    if (!on) fill(g, [d], 18, 34, true);
                  })}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2 ${on ? 'bg-halo-purple' : 'bg-halo-bone border border-halo-rule'}`}
                >
                  <span className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
                </button>
                <span className={`text-base font-semibold ${on ? 'text-halo-ink' : 'text-halo-mist-body'}`}>{DAY_LONG[d]}</span>
              </label>
              {!on && <span className="text-sm text-halo-mist-body">Not available</span>}
              {on && WEEKDAYS.includes(d) && (
                <button
                  type="button"
                  onClick={() => {
                    edit((g) => { for (const w of WEEKDAYS) if (w !== d) g[w] = [...g[d]]; });
                    setCopied(d);
                    setTimeout(() => setCopied((c) => (c === d ? null : c)), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-halo-purple-d hover:text-halo-ink transition-colors"
                >
                  {copied === d ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === d ? 'Copied to weekdays' : 'Copy to all weekdays'}
                </button>
              )}
            </div>

            {on && (
              <div className="mt-4 space-y-2.5 sm:pl-[60px]">
                {intervals.map((iv) => (
                  <div key={iv.start} className="flex flex-wrap items-center gap-2.5">
                    <TimeSelect
                      label={`${DAY_LONG[d]} start time`}
                      value={iv.start}
                      options={TIME_OPTIONS.filter((t) => t < SLOTS)}
                      onChange={(v) => setRange(d, iv, { start: v, end: v >= iv.end ? Math.min(SLOTS, v + 2) : iv.end })}
                    />
                    <span className="text-sm text-halo-mist-body">to</span>
                    <TimeSelect
                      label={`${DAY_LONG[d]} end time`}
                      value={iv.end}
                      options={TIME_OPTIONS.filter((t) => t > iv.start)}
                      onChange={(v) => setRange(d, iv, { start: iv.start, end: v })}
                    />
                    <button
                      type="button"
                      onClick={() => edit((g) => fill(g, [d], iv.start, iv.end, false))}
                      aria-label={`Remove ${label(iv.start)} to ${label(iv.end)} on ${DAY_LONG[d]}`}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-halo-heather hover:text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                ))}
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => edit((g) => fill(g, [d], lastEnd + 2, Math.min(SLOTS, lastEnd + 6), true))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-halo-purple/50 px-3.5 py-2.5 text-sm font-medium text-halo-purple-d hover:bg-halo-veil transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add another time
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function TimeSelect({ label: aria, value, options, onChange }: {
  label: string; value: number; options: number[]; onChange: (v: number) => void;
}) {
  return (
    <select
      aria-label={aria}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="min-w-[132px] rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[15px] text-halo-ink focus:outline-none focus:ring-2 focus:ring-halo-purple cursor-pointer"
    >
      {options.map((t) => <option key={t} value={t}>{label(t)}</option>)}
    </select>
  );
}
