'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  mentorshipId: string;
  mentorId: string;
  menteeId: string;
  userRole: 'mentor' | 'mentee';
  preselectedDate?: string;
  onBooked: () => void;
}

function toHHMM(timeStr: string) {
  return timeStr.slice(0, 5);
}

function fmt12(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function BookingModal({
  open,
  onClose,
  mentorshipId,
  mentorId,
  menteeId,
  userRole,
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
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  useEffect(() => {
    if (!open || !mentorId) return;
    const supabase = createClient();
    supabase
      .from('availability_slots')
      .select('id, day_of_week, start_time, end_time')
      .eq('mentor_id', mentorId)
      .order('day_of_week')
      .order('start_time')
      .then(({ data }) => setSlots(data ?? []));
  }, [open, mentorId]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Slots that match the currently selected date's day of week
  const selectedDow = form.date ? new Date(form.date + 'T12:00:00').getDay() : null;
  const daySlots = selectedDow !== null
    ? slots.filter((s) => s.day_of_week === selectedDow)
    : [];

  // All days that have at least one slot (for the hint display)
  const availableDays = [...new Set(slots.map((s) => s.day_of_week))].sort();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.time) {
      setError('Please select a date and time.');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();
    const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();

    const { data: sessionData, error: err } = await supabase.from('sessions').insert({
      mentorship_id: mentorshipId,
      mentor_id: mentorId,
      mentee_id: menteeId,
      scheduled_at: scheduledAt,
      duration_minutes: parseInt(form.duration),
      session_type: form.sessionType,
      notes: form.notes || null,
      video_link: form.videoLink || null,
    }).select('id').single();

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    void trackEvent('session_scheduled', userRole, {
      entityId: sessionData?.id,
      metadata: { duration_minutes: parseInt(form.duration) },
    });

    onBooked();
    onClose();
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule a Session">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Availability hint */}
        {slots.length > 0 && (
          <div className="bg-navy-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-navy-500" />
              <p className="text-xs font-semibold text-navy-700">Mentor&apos;s available days</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableDays.map((dow) => (
                <span
                  key={dow}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    selectedDow === dow
                      ? 'bg-navy-700 text-white'
                      : 'bg-white text-navy-700 border border-navy-200'
                  }`}
                >
                  {DAYS[dow]}
                </span>
              ))}
            </div>
          </div>
        )}

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

        {/* Quick-select available time windows for selected day */}
        {daySlots.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">
              Available windows on {DAYS[selectedDow!]} — click to auto-fill:
            </p>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((slot) => {
                const start = toHHMM(slot.start_time);
                const end = toHHMM(slot.end_time);
                const active = form.time === start;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => set('time', start)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      active
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'bg-white text-navy-700 border-navy-200 hover:bg-navy-50'
                    }`}
                  >
                    {fmt12(start)}–{fmt12(end)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Warning when chosen date doesn't align with any available window */}
        {form.date && slots.length > 0 && daySlots.length === 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            The mentor hasn&apos;t listed availability for {DAYS[selectedDow!]}s. You can still book — they&apos;ll receive a notification to confirm.
          </p>
        )}

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
