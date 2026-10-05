'use client';

import { useState } from 'react';

/**
 * Invite one person into a cohort.
 *
 * Mirrors the activation flow deliberately: the server mints a single-use,
 * expiring, email-bound token, stores only its SHA-256, and hands the link
 * back exactly once. Delivery is manual and the UI says so, because Mentable
 * does not send mail yet and a button that claimed to would be the first
 * thing to break a programme lead's trust.
 */
const ROLES = [
  { v: 'mentee', label: 'Mentee' },
  { v: 'mentor', label: 'Mentor' },
  { v: 'program_admin', label: 'Program admin' },
] as const;

const FIELD =
  'w-full px-3.5 py-2.5 bg-white border border-halo-rule rounded-xl text-[15px] text-halo-ink ' +
  'placeholder:text-halo-mist focus:outline-none focus:ring-2 focus:ring-halo-purple focus:border-transparent';

export default function InviteParticipant({ orgId, cohortId }: { orgId: string; cohortId: string }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('mentee');
  const [state, setState] = useState<'idle' | 'working'>('idle');
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'working') return;
    setError(null); setLink(null); setState('working');
    try {
      const res = await fetch('/api/org/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, cohortId, email, role }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) { setError(json.error ?? 'Could not create the invitation.'); setState('idle'); return; }
      setLink(json.url); setEmail(''); setState('idle');
    } catch {
      setError('Request failed. Try again.'); setState('idle');
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2.5 items-start">
        <div>
          <label htmlFor="invite-email" className="sr-only">Email address</label>
          <input
            id="invite-email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@university.edu" className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="invite-role" className="sr-only">Role</label>
          <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value)} className={FIELD}>
            {ROLES.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
          </select>
        </div>
        <button
          type="submit" disabled={state === 'working'}
          className="inline-flex items-center justify-center bg-halo-purple text-white text-[14.5px] font-semibold px-5 py-2.5 rounded-xl hover:bg-halo-purple-d transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          {state === 'working' ? 'Creating…' : 'Create invite'}
        </button>
      </form>

      {error && <p role="alert" className="text-[13.5px] text-red-700 mt-2.5">{error}</p>}

      {link && (
        <div className="mt-4">
          <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-1.5">
            Invitation link · valid 14 days · single use
          </p>
          <div className="flex items-start gap-2 flex-wrap">
            <code className="flex-1 min-w-0 break-all text-[12.5px] bg-halo-veil border border-halo-rule rounded-lg px-3 py-2 text-halo-ink">
              {link}
            </code>
            <button
              type="button"
              onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-[13px] font-semibold text-halo-purple-d hover:text-halo-ink px-3 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[12.5px] text-halo-heather leading-relaxed mt-2">
            No email has been sent. Mentable does not send participant mail yet, so this
            link reaches them only when you send it.
          </p>
        </div>
      )}
    </div>
  );
}
