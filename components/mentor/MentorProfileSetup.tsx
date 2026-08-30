'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import TagSelect from '@/components/ui/TagSelect';
import Button from '@/components/ui/Button';

const EXPERTISE_OPTIONS = [
  'React', 'Node.js', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'Swift',
  'UI/UX Design', 'Product Management', 'Data Science', 'Machine Learning',
  'DevOps', 'Cloud Architecture', 'Mobile Development', 'System Design',
  'Career Transitions', 'Leadership', 'Startups', 'Technical Depth',
];

const GOAL_OPTIONS = [
  'Career transitions', 'Technical depth', 'Leadership', 'Interview prep',
  'System design', 'Code reviews', 'Product thinking', 'Work-life balance',
];

const COMMON_TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'America/Toronto', 'America/Vancouver',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland', 'UTC',
];

const TIMEZONE_OPTIONS = COMMON_TIMEZONES.map((tz) => ({
  value: tz,
  label: tz.replace(/_/g, ' '),
}));

export default function MentorProfileSetup({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    bio: '',
    expertise_tags: [] as string[],
    years_experience: '',
    weekly_hours: '',
    timezone: '',
    session_rate: '',
    goals: [] as string[],
  });

  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.expertise_tags.length === 0) {
      setError('Please select at least one area of expertise.');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: err } = await supabase.from('mentor_profiles').upsert({
      id: userId,
      bio: form.bio || null,
      expertise_tags: form.expertise_tags,
      years_experience: parseInt(form.years_experience) || 0,
      weekly_hours: parseInt(form.weekly_hours) || 0,
      timezone: form.timezone || null,
      session_rate: form.session_rate ? parseFloat(form.session_rate) : null,
      goals: form.goals,
      profile_complete: true,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.replace('/dashboard');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Textarea
        label="About You"
        placeholder="Tell mentees about your background, experience, and what makes you a great mentor..."
        value={form.bio}
        onChange={(e) => set('bio', e.target.value)}
        rows={4}
      />

      <TagSelect
        label="Areas of Expertise"
        options={EXPERTISE_OPTIONS}
        value={form.expertise_tags}
        onChange={(v) => set('expertise_tags', v)}
        max={8}
      />

      <TagSelect
        label="Goals You Help With"
        options={GOAL_OPTIONS}
        value={form.goals}
        onChange={(v) => set('goals', v)}
        max={5}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Years of Experience"
          type="number"
          min={0}
          max={60}
          value={form.years_experience}
          onChange={(e) => set('years_experience', e.target.value)}
          placeholder="e.g. 8"
        />
        <Input
          label="Weekly Availability (hours)"
          type="number"
          min={1}
          max={40}
          value={form.weekly_hours}
          onChange={(e) => set('weekly_hours', e.target.value)}
          placeholder="e.g. 5"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Timezone"
          options={TIMEZONE_OPTIONS}
          value={form.timezone}
          onChange={(e) => set('timezone', e.target.value)}
          placeholder="Select timezone"
        />
        <Input
          label="Session Rate (USD/hr, leave blank if free)"
          type="number"
          min={0}
          step={5}
          value={form.session_rate}
          onChange={(e) => set('session_rate', e.target.value)}
          placeholder="e.g. 50"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full">
        Complete Profile
      </Button>
    </form>
  );
}
