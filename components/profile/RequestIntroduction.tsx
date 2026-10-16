'use client';

import { useState, useTransition } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { requestIntroduction } from '@/app/(protected)/network/actions';

/**
 * Turning a recommendation into an ask.
 *
 * TWO TAPS, NOT A FORM. Closed, it is one button. Open, it is one textarea
 * pre-filled with a suggestion drawn from the recommendation's own
 * evidence, and a Send. Anything heavier and people do not send it.
 *
 * THE SUGGESTION IS A DRAFT, NEVER A SEND. Mentable proposes an opening
 * line because staring at an empty box is the actual reason introductions
 * do not happen — but the text is editable, visibly theirs, and nothing is
 * transmitted until they press the button. No message is ever written on
 * somebody's behalf.
 */
export default function RequestIntroduction({
  mentorId,
  firstName,
  suggestion,
  alreadyAsked,
}: {
  mentorId: string;
  firstName: string;
  /** Built from the engine's opener, so it references something real. */
  suggestion: string;
  alreadyAsked: 'pending' | 'approved' | 'declined' | null;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(suggestion);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (sent || alreadyAsked === 'pending') {
    return (
      <p className="inline-flex items-center gap-2 text-[13.5px] font-medium text-halo-ink">
        <Check className="h-4 w-4 text-halo-brand-text" aria-hidden="true" />
        Asked — waiting to hear back
      </p>
    );
  }
  if (alreadyAsked === 'approved') {
    return (
      <p className="inline-flex items-center gap-2 text-[13.5px] font-medium text-halo-ink">
        <Check className="h-4 w-4 text-halo-brand-text" aria-hidden="true" />
        You&rsquo;re connected
      </p>
    );
  }
  if (alreadyAsked === 'declined') {
    // Said plainly and without blame, once.
    return <p className="text-[13.5px] text-halo-mist-body">You asked before.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-xl bg-halo-purple px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
      >
        Request an introduction
        <ArrowRight className="h-3.5 w-3.5 arrow-slide group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="w-full">
      <label htmlFor={`intro-${mentorId}`} className="block text-[13.5px] font-medium text-halo-ink mb-1.5">
        What would you like to talk about?
      </label>
      <p className="text-[12.5px] text-halo-mist-body mb-2">
        {firstName} sees this. Change it to sound like you.
      </p>
      <textarea
        id={`intro-${mentorId}`}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-xl border border-halo-rule bg-white px-3.5 py-2.5 text-[14px] text-halo-ink leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-halo-purple"
      />
      {error && <p role="alert" className="text-[13px] text-red-600 mt-2">{error}</p>}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={pending || text.trim().length < 10}
          onClick={() => {
            setError(null);
            start(async () => {
              const r = await requestIntroduction(mentorId, text);
              if (r.ok) setSent(true); else setError(r.error);
            });
          }}
          className="rounded-xl bg-halo-purple px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-40 hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          {pending ? 'Sending' : `Ask ${firstName}`}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="text-[13.5px] text-halo-heather hover:text-halo-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
