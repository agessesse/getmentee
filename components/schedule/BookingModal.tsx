'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  mentorshipId: string;
  mentorId: string;
  menteeId: string;
  preselectedDate?: string;
  onBooked: () => void;
}

export default function BookingModal({
  open,
  onClose,
  mentorshipId,
  mentorId,
  menteeId,
  preselectedDate,
  onBooked,
}: BookingModalProps) {
  const [form, setForm] = useState({
    date: preselectedDate ?? '',
    time: '',
    duration: '60',
    sessionType: 'video',
    notes: '',
    videoLink: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.time) {
      setError('Please select a date and time.');
      return;
    }

    setLoading(true);
    setError('');

    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();

    const { error: err } = await supabase.from('sessions').insert({
      mentorship_id: mentorshipId,
      mentor_id: mentorId,
      mentee_id: menteeId,
      scheduled_at: scheduledAt,
      duration_minutes: parseInt(form.duration),
      session_type: form.sessionType,
      notes: form.notes || null,
      video_link: form.videoLink || null,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    onBooked();
    onClose();
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule a Session">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={form.date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => set('date', e.target.value)}
            required
          />
          <Input
            label="Time"
            type="time"
            value={form.time}
            onChange={(e) => set('time', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Duration"
            value={form.duration}
            onChange={(e) => set('duration', e.target.value)}
            options={[
              { value: '30', label: '30 minutes' },
              { value: '60', label: '1 hour' },
              { value: '90', label: '1.5 hours' },
              { value: '120', label: '2 hours' },
            ]}
          />
          <Select
            label="Format"
            value={form.sessionType}
            onChange={(e) => set('sessionType', e.target.value)}
            options={[
              { value: 'video', label: 'Video Call' },
              { value: 'async', label: 'Async Check-in' },
            ]}
          />
        </div>

        {form.sessionType === 'video' && (
          <Input
            label="Video Link (optional)"
            type="url"
            placeholder="https://meet.google.com/..."
            value={form.videoLink}
            onChange={(e) => set('videoLink', e.target.value)}
          />
        )}

        <Textarea
          label="Agenda / Notes (optional)"
          placeholder="Topics to cover, questions, goals for this session..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Book Session
          </Button>
        </div>
      </form>
    </Modal>
  );
}
