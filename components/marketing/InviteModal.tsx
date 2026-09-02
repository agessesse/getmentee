'use client';

import { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

const INVITE_MESSAGE = `I've been building a mentorship platform called Mentee that connects ambitious students with professionals who have already traveled their path.

I think you'd make an exceptional mentor. If you're open to it, you can create a profile at:

https://getmentee.com/signup

Takes under 5 minutes. You control how many mentees you take on and when you're available. No obligation — just a chance to open doors for the next generation the way someone once did for you.`;

export default function InviteModal({ open, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

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
        title: 'Join Mentee as a mentor',
        text: INVITE_MESSAGE,
        url: 'https://getmentee.com/signup',
      }).catch(() => null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 id="invite-modal-title" className="text-base font-semibold text-navy-900">
            Invite a mentor
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-navy-900 transition-colors p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Who helped shape your trajectory? Share this message with someone who would make a great mentor.
          </p>

          {/* Preview message */}
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-700 leading-relaxed whitespace-pre-line font-mono border border-gray-100 max-h-48 overflow-y-auto">
            {INVITE_MESSAGE}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-navy-300 hover:text-navy-900 transition-all"
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
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            No account required to send the invite. Your contact signs up directly.
          </p>
        </div>
      </div>
    </div>
  );
}
