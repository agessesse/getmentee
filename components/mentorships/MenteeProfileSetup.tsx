'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import TagSelect from '@/components/ui/TagSelect';
import Button from '@/components/ui/Button';

const INTEREST_OPTIONS = [
  'React', 'Node.js', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'Swift',
  'UI/UX Design', 'Product Management', 'Data Science', 'Machine Learning',
  'DevOps', 'Cloud Architecture', 'Mobile Development', 'System Design',
  'Career Transitions', 'Leadership', 'Startups', 'Technical Depth',
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

export default function MenteeProfileSetup({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    bio: '',
    interest_tags: [] as string[],
    goals: '',
    experience_level: '',
    preferred_format: '',
    timezone: '',
  });

  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.interest_tags.length === 0) {
      setError('Please select at least one area of interest.');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();

    const goalsArray = form.goals
      .split('\n')
      .map((g) => g.trim())
      .filter(Boolean);

    const { error: err } = await supabase.from('mentee_profiles').upsert({
      id: userId,
      bio: form.bio || null,
      interest_tags: form.interest_tags,
      goals: goalsArray,
      experience_level: form.experience_level || null,
      preferred_format: form.preferred_format || null,
      timezone: form.timezone || null,
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
        placeholder="Tell mentors about yourself, your background, and what you're working towards..."
        value={form.bio}
        onChange={(e) => set('bio', e.target.value)}
        rows={4}
      />

      <TagSelect
        label="Areas of Interest"
        options={INTEREST_OPTIONS}
        value={form.interest_tags}
        onChange={(v) => set('interest_tags', v)}
        max={8}
      />

      <Textarea
        label="Your Goals (one per line)"
        placeholder={"Learn React\nBreak into tech\nLevel up in my role"}
        value={form.goals}
        onChange={(e) => set('goals', e.target.value)}
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Experience Level"
          value={form.experience_level}
          onChange={(e) => set('experience_level', e.target.value)}
          placeholder="Select level"
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
          ]}
        />
        <Select
          label="Preferred Session Format"
          value={form.preferred_format}
          onChange={(e) => set('preferred_format', e.target.value)}
          placeholder="Select format"
          options={[
            { value: 'video', label: 'Video Call' },
            { value: 'chat', label: 'Chat / Text' },
            { value: 'async', label: 'Async (no live meeting)' },
          ]}
        />
      </div>

      <Select
        label="Timezone"
        options={TIMEZONE_OPTIONS}
        value={form.timezone}
        onChange={(e) => set('timezone', e.target.value)}
        placeholder="Select timezone"
      />

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
