'use client';

import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { CANONICAL_SITE } from '@/lib/site';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

/*
  Where the invite actually sends people.

  This message is the one path that works when no mentor on the platform can
  receive a request, and it was pointing at https://getmentee.com/signup — a
  domain that does not resolve (verified: connection timeout, while
  https://mentable.co/signup returns 200). Every mentor invited with this text
  hit nothing. Pointing it at NEXT_PUBLIC_APP_URL was not the fix either: that
  variable is set to the Vercel deployment alias in production, so the invite
  then told people to sign up at getmentee.vercel.app. A message a human copies
  into an email should always carry the address Mentable is known by, on every
  deployment, which is what lib/site.ts holds.
*/
// Points at the mentor application. /signup still redirects here, so
// invitations already sent with the old URL keep working.
const SIGNUP_URL = `${CANONICAL_SITE}/apply?role=mentor`;

const INVITE_MESSAGE = `I've been building a mentorship platform called Mentable that connects ambitious students with professionals who have already traveled their path.

I think you'd make an exceptional mentor. If you're open to it, you can create a profile at:

${SIGNUP_URL}

Takes under 5 minutes. You control how many mentees you take on and when you're available. No obligation. Just a chance to open a door for someone the way it was once opened for you.`;

export default function InviteModal({ open, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INVITE_MESSAGE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const el = document.createElement('textarea');
      el.value = INVITE_MESSAGE;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Join Mentable as a mentor',
        text: INVITE_MESSAGE,
        url: SIGNUP_URL,
      }).catch(() => null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite a mentor">
      <div className="space-y-4">
      <p className="text-sm text-halo-heather leading-relaxed">
        Who helped shape your trajectory? Share this message with someone who would make a great mentor.
      </p>

      {/* Preview message */}
      <div className="bg-halo-veil rounded-xl p-4 text-xs text-halo-heather leading-relaxed whitespace-pre-line font-mono border border-halo-rule max-h-48 overflow-y-auto">
        {INVITE_MESSAGE}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-halo-rule text-sm font-medium text-halo-heather hover:border-halo-purple hover:text-halo-ink transition-all"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-700">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy message
            </>
          )}
        </button>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-halo-purple text-white text-sm font-medium hover:bg-halo-purple-d transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
      </div>

      <p className="text-xs text-halo-mist-body text-center">
        No account required to send the invite. Your contact signs up directly.
      </p>
      </div>
    </Modal>
  );
}
