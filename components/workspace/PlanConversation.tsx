'use client';

import { useState, useEffect, useTransition } from 'react';
import Avatar from '@/components/ui/Avatar';
import { Check, Video, MapPin, Users } from 'lucide-react';
import { planConversation } from '@/app/(protected)/mentorship/[id]/schedule-actions';

/**
 * Planning the next conversation, without leaving the relationship.
 *
 * THE POINT OF THE WHOLE FEATURE IS THE FIRST FIELD. Mentable already knows
 * who you are meeting, so the person is selected before the panel opens and
 * is shown with their name and face rather than as an empty box asking for
 * an email address. Nobody should have to go and find their mentor's email
 * to arrange a conversation with their mentor.
 *
 * NOT CALENDLY. No availability grid, no booking page, no buffer rules, no
 * round-robin. Five fields, a button, done. Scheduling exists here only to
 * stop the relationship stalling between conversations.
 *
 * The meeting types offered depend on what is actually connected: Google
 * Meet appears when a Google account is connected, Teams when a Microsoft
 * one is, and never otherwise, because an option that cannot produce a link
 * is a trap.
 */

type MeetingType = 'google_meet' | 'teams' | 'in_person' | 'other';

export default function PlanConversation({
  mentorshipId,
  partner,
  providers,
  onDone,
  onCancel,
}: {
  mentorshipId: string;
  partner: { firstName: string; fullName: string; avatarUrl: string | null };
  /** Calendar providers this person has actually connected. */
  providers: ('google' | 'microsoft')[];
  onDone: (msg: string) => void;
  onCancel: () => void;
}) {
  /*
    THE DEFAULTS ARE SET AFTER MOUNT, NOT DURING RENDER, and that is not
    fussiness. Intl.DateTimeFormat().resolvedOptions().timeZone answers with
    the SERVER's zone during server rendering and the viewer's in the
    browser, so computing it inline is a hydration mismatch: React throws
    away the tree and regenerates it, and for a moment the select shows the
    wrong zone. `new Date()` has the same problem across midnight.

    Caught by the console during verification, on a page that happened to
    server-render this component. In the product it opens on a click and so
    never would have, which is exactly the kind of bug that waits.
  */
  const [date, setDate] = useState('');
  const [time, setTime] = useState('16:00');
  const [duration, setDuration] = useState(45);
  const [timeZone, setTimeZone] = useState('UTC');

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    // A week out, at 4pm: close enough to be real, far enough that both
    // people can move it. An empty date field makes you do arithmetic.
    const suggested = new Date();
    suggested.setDate(suggested.getDate() + 7);
    setDate(suggested.toISOString().slice(0, 10));
  }, []);
  const [type, setType] = useState<MeetingType>(
    providers.includes('google') ? 'google_meet' : providers.includes('microsoft') ? 'teams' : 'in_person',
  );
  const [location, setLocation] = useState('');
  const [agenda, setAgenda] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const types: { key: MeetingType; label: string; icon: typeof Video; available: boolean }[] = [
    { key: 'google_meet', label: 'Google Meet', icon: Video, available: providers.includes('google') },
    { key: 'teams', label: 'Microsoft Teams', icon: Video, available: providers.includes('microsoft') },
    { key: 'in_person', label: 'In person', icon: MapPin, available: true },
    { key: 'other', label: 'Other', icon: Users, available: true },
  ];

  const submit = () => {
    setError(null);
    /*
      Build the instant from the wall-clock the organiser chose in the zone
      they chose, rather than trusting the browser's own offset. "4pm New
      York" booked from a laptop in London must mean 4pm in New York, and
      must stay correct across a daylight-saving boundary.
    */
    const startIso = wallClockToIso(date, time, timeZone);
    if (!startIso) { setError('That date and time didn’t parse.'); return; }

    start(async () => {
      const r = await planConversation(mentorshipId, {
        startIso,
        durationMinutes: duration,
        timeZone,
        meetingProvider: type,
        agenda: agenda.trim() || null,
        location: type === 'in_person' ? location.trim() || null : null,
      });
      if (!r.ok) { setError(r.error); return; }
      onDone(r.warning ?? `Invite sent to ${partner.firstName}.`);
    });
  };

  return (
    <div className="rounded-2xl border border-halo-rule bg-white p-4 sm:p-5">
      <p className="font-display text-[1.15rem] text-halo-ink mb-4">Plan a conversation</p>

      {/* Person: already known, never typed. */}
      <div className="flex items-center gap-3 rounded-xl bg-halo-veil border border-halo-rule px-3.5 py-2.5 mb-5">
        <Avatar src={partner.avatarUrl} name={partner.fullName} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block font-ui text-[10px] font-semibold uppercase tracking-[0.13em] text-halo-mist-body">
            With
          </span>
          <span className="block text-[14.5px] font-medium text-halo-ink truncate">{partner.fullName}</span>
        </span>
        <Check className="h-4 w-4 flex-none text-halo-brand-text" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="pc-date">
          <input id="pc-date" type="date" value={date} min={date || undefined}
            onChange={(e) => setDate(e.target.value)} className={INPUT} />
        </Field>
        <Field label="Start" htmlFor="pc-time">
          <input id="pc-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={INPUT} />
        </Field>
        <Field label="Length" htmlFor="pc-dur">
          <select id="pc-dur" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={INPUT}>
            {[15, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutes</option>)}
          </select>
        </Field>
        <Field label="Time zone" htmlFor="pc-tz">
          <select id="pc-tz" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className={INPUT}>
            {zoneOptions(timeZone).map((z) => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
          </select>
        </Field>
      </div>

      <fieldset className="mt-5">
        <legend className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-2">
          Meeting
        </legend>
        <div className="flex flex-wrap gap-2">
          {types.filter((t) => t.available).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              aria-pressed={type === t.key}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple ${
                type === t.key
                  ? 'border-halo-brand-line bg-halo-veil text-halo-ink font-medium'
                  : 'border-halo-rule text-halo-heather hover:text-halo-ink'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>
        {providers.length === 0 && (
          <p className="text-[12.5px] text-halo-mist-body mt-2.5 max-w-sm leading-relaxed">
            Connect a calendar in your profile to send a real invitation and get a Meet or
            Teams link.
          </p>
        )}
      </fieldset>

      {type === 'in_person' && (
        <div className="mt-4">
          <Field label="Where" htmlFor="pc-loc">
            <input id="pc-loc" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Davis Library, second floor" className={INPUT} />
          </Field>
        </div>
      )}

      <div className="mt-4">
        <Field label="Agenda" htmlFor="pc-agenda" optional>
          <textarea id="pc-agenda" rows={2} value={agenda} onChange={(e) => setAgenda(e.target.value)}
            placeholder="What do you want to cover?"
            className={`${INPUT} resize-none leading-relaxed`} />
        </Field>
      </div>

      {error && <p role="alert" className="text-[13px] text-red-600 mt-3">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !date}
          className="rounded-xl bg-halo-purple px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-40 hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          {pending ? 'Sending' : providers.length ? 'Send invite' : 'Save conversation'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-[13.5px] text-halo-heather hover:text-halo-ink transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

const INPUT =
  'w-full rounded-xl border border-halo-rule bg-white px-3 py-2 text-[14px] text-halo-ink placeholder:text-halo-mist-strong focus:outline-none focus:ring-2 focus:ring-halo-purple';

function Field({
  label, htmlFor, optional, children,
}: { label: string; htmlFor: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-1.5">
        {label}{optional && <span className="font-normal normal-case tracking-normal text-halo-mist"> · optional</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * A wall-clock time in a named zone, as a UTC instant.
 *
 * Done by asking Intl what that zone's offset is ON THAT DATE, rather than
 * applying the browser's current offset. Those differ whenever the organiser
 * is in a different zone from the meeting, and also whenever the meeting is
 * on the far side of a daylight-saving change from today, which is the bug
 * that silently moves half of everybody's March meetings by an hour.
 */
function wallClockToIso(date: string, time: string, zone: string): string | null {
  if (!date || !time) return null;
  const naive = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(naive.getTime())) return null;
  const offset = zoneOffsetMs(naive, zone);
  return new Date(naive.getTime() - offset).toISOString();
}

function zoneOffsetMs(instant: Date, zone: string): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const parts = Object.fromEntries(dtf.formatToParts(instant).map((p) => [p.type, p.value]));
    const asUtc = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour === '24' ? '00' : parts.hour), Number(parts.minute), Number(parts.second),
    );
    return asUtc - instant.getTime();
  } catch {
    return 0;
  }
}

/** The viewer's own zone first, then the common ones. */
function zoneOptions(current: string): string[] {
  const common = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney', 'UTC',
  ];
  return [current, ...common.filter((z) => z !== current)];
}
