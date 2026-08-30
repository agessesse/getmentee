'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

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
        <Textarea
          label="Why do you want to work with this mentor? (optional)"
          placeholder="Share what drew you to this mentor and what you hope to learn..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
        <Textarea
          label="What are your goals? (optional)"
          placeholder="e.g. Break into tech, learn React, improve system design skills..."
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          rows={2}
        />

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
