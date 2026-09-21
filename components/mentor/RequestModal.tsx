'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import VoiceInputButton from '@/components/voice/VoiceInputButton';
import LearnHint from '@/components/ui/LearnHint';

interface RequestModalProps {
  open: boolean;
  onClose: () => void;
  mentor: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  onSubmit: (message: string, goals: string) => Promise<void>;
}

export default function RequestModal({ open, onClose, mentor, onSubmit }: RequestModalProps) {
  const [message, setMessage] = useState('');
  const [goals, setGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit(message, goals);
      setMessage('');
      setGoals('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Request Mentorship">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-halo-rule">
        <Avatar
          src={mentor.avatarUrl}
          name={`${mentor.firstName} ${mentor.lastName}`}
          size="md"
        />
        <div>
          <p className="font-medium text-halo-ink">
            {mentor.firstName} {mentor.lastName}
          </p>
          <p className="text-xs text-halo-mist-body">Your request will be sent to this mentor</p>
        </div>
      </div>

      {/* The moment a student most often freezes: they have the box and no idea
          what belongs in it. Two sentences here, not an article, and nothing
          is written for them. */}
      <LearnHint
        id="request-message"
        className="mb-4"
        hint={{
          title: 'What to write',
          body: 'Say who you are in one line, why you picked them specifically, and what you hope to learn. Short is fine — they read these between meetings.',
          href: '/networking#message',
          linkLabel: 'See a few examples',
        }}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-halo-heather">
              Why do you want to work with this mentor? <span className="text-halo-mist-body">(optional)</span>
            </span>
            <VoiceInputButton
              context="message"
              onTranscript={(t) => setMessage((p) => p ? `${p} ${t}` : t)}
              disabled={loading}
            />
          </div>
          <Textarea
            placeholder="Share what drew you to this mentor and what you hope to learn…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-halo-heather">
              What are your goals? <span className="text-halo-mist-body">(optional)</span>
            </span>
            <VoiceInputButton
              context="goal"
              onTranscript={(t) => setGoals((p) => p ? `${p} ${t}` : t)}
              disabled={loading}
            />
          </div>
          <Textarea
            placeholder="e.g. Break into investment banking, improve my financial modeling skills…"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={2}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Send Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
