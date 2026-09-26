'use client';

import { useState } from 'react';

/**
 * Approve an applicant and get the link to send them.
 *
 * The honest shape of a half-automated step. Approval is real and recorded;
 * delivery is a human copying a URL into an email, because Supabase
 * transactional email is not configured and a button labelled "send" that
 * sent nothing would be worse than no button at all. The copy under the link
 * says so, so whoever is reviewing at 1am knows the applicant has not been
 * contacted yet.
 */
export default function ApproveApplicant({
  applicationId, status, activated,
}: {
  applicationId: string;
  status: string;
  activated: boolean;
}) {
  const [state, setState] = useState<'idle' | 'working'>('idle');
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (activated) {
    return (
      <p className="text-[13px] text-halo-heather">
        Activated. This applicant has a Mentable account.
      </p>
    );
  }

  async function approve() {
    setState('working');
    setError(null);
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? 'Could not create the activation link.');
        setState('idle');
        return;
      }
      setLink(json.url);
      setState('idle');
    } catch {
      setError('Request failed. Try again.');
      setState('idle');
    }
  }

  return (
    <div>
      {!link && (
        <button
          type="button"
          onClick={approve}
          disabled={state === 'working'}
          className="inline-flex items-center gap-2 bg-halo-purple text-white text-[13.5px] font-semibold px-4 py-2 rounded-lg hover:bg-halo-purple-d transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          {state === 'working'
            ? 'Creating link…'
            : status === 'accepted'
              ? 'Create a new activation link'
              : 'Approve and create activation link'}
        </button>
      )}

      {error && (
        <p role="alert" className="text-[13px] text-red-700 mt-2">{error}</p>
      )}

      {link && (
        <div className="mt-1">
          <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-1.5">
            Activation link · valid 14 days · single use
          </p>
          <div className="flex items-start gap-2 flex-wrap">
            <code className="flex-1 min-w-0 break-all text-[12.5px] bg-halo-veil border border-halo-rule rounded-lg px-3 py-2 text-halo-ink">
              {link}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-[13px] font-semibold text-halo-purple-d hover:text-halo-ink px-3 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          {/* The part a reviewer must not assume. */}
          <p className="text-[12.5px] text-halo-heather leading-relaxed mt-2">
            No email has been sent. Mentable does not send applicant mail yet, so this link
            reaches them only when you send it. Creating another link invalidates this one.
          </p>
        </div>
      )}
    </div>
  );
}
