'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import VoiceInputButton from '@/components/voice/VoiceInputButton';

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

// Short enough not to be an essay, long enough to rule out "will you mentor me?"
const MIN_MESSAGE = 40;

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
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <Avatar
          src={mentor.avatarUrl}
          name={`${mentor.firstName} ${mentor.lastName}`}
          size="md"
        />
        <div>
          <p className="font-medium text-navy-900">
            {mentor.firstName} {mentor.lastName}
          </p>
          <p className="text-xs text-gray-500">Your request will be sent to this mentor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="request-why" className="text-xs font-medium text-gray-700">
              Why do you want to work with this mentor?
            </label>
            <VoiceInputButton
              context="message"
              onTranscript={(t) => setMessage((p) => p ? `${p} ${t}` : t)}
              disabled={loading}
            />
          </div>
          <Textarea
            id="request-why"
            placeholder="Share what drew you to this mentor and what you hope to learn…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            aria-describedby="request-why-hint"
          />
          {/* Both fields used to be optional, so an empty request was
              sendable. A blank request is the one a mentor ignores. */}
          <p id="request-why-hint" className="text-xs text-gray-500 mt-1">
            {message.trim().length < MIN_MESSAGE
              ? `Mention something specific about their path. ${MIN_MESSAGE - message.trim().length} more characters.`
              : 'Looks good. Specific requests get answered.'}
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="request-goals" className="text-xs font-medium text-gray-700">
              What would you like their help with? <span className="text-gray-500">(optional)</span>
            </label>
            <VoiceInputButton
              context="goal"
              onTranscript={(t) => setGoals((p) => p ? `${p} ${t}` : t)}
              disabled={loading}
            />
          </div>
          <Textarea
            id="request-goals"
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
          <Button
            type="submit"
            loading={loading}
            disabled={message.trim().length < MIN_MESSAGE}
            className="flex-1"
          >
            Send Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
