'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import { Check, Trash2 } from 'lucide-react';

// -------------------------------------------------------
// Shared constants
// -------------------------------------------------------
const COMMON_TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'UTC',
];

const FINANCE_EXPERTISE = [
  'Investment Banking', 'M&A', 'Leveraged Finance', 'Restructuring', 'Equity Research',
  'Private Equity', 'Growth Equity', 'LBO Modeling', 'Venture Capital', 'Startup Investing',
  'Hedge Funds', 'Global Macro', 'Quant Finance', 'Fixed Income',
  'Strategy Consulting', 'Case Interviews', 'Operations Consulting', 'MBB Recruiting',
  'Product Management', 'PM Recruiting', 'Software Engineering', 'System Design',
  'FAANG Interviews', 'Engineering Leadership', 'Real Estate', 'CRE Finance',
  'Corporate Finance', 'FP&A', 'Financial Modeling', 'Recruiting', 'Career Planning',
  'Fundraising', 'Company Building',
];

const INDUSTRIES = [
  'Investment Banking', 'Private Equity', 'Venture Capital', 'Consulting',
  'Technology', 'Real Estate', 'Banking', 'Law', 'Entrepreneurship',
  'Investment Management', 'Healthcare', 'Consumer', 'Industrials',
];

const INTEREST_TAGS = FINANCE_EXPERTISE;

const GOAL_OPTIONS_MENTOR = [
  'Break into IB', 'Ace superday interviews', 'Build modeling skills',
  'PE recruiting', 'LBO modeling', 'VC career path', 'Investment thesis',
  'Case interview prep', 'Consulting career', 'PM interviews',
  'FAANG recruiting', 'System design', 'Engineering leadership',
  'Real estate career', 'Finance career planning',
];

const GOAL_OPTIONS_MENTEE = [
  'Land an IB internship', 'Break into private equity', 'Get into venture capital',
  'Ace MBB case interviews', 'Break into product management', 'Pass FAANG interviews',
  'Explore finance careers', 'Transition careers', 'Build my network',
  'Improve financial modeling', 'Understand the PE path',
];

const CAREER_INTERESTS = [
  'Investment Banking', 'Private Equity', 'Venture Capital', 'Management Consulting',
  'Product Management', 'Software Engineering', 'Real Estate', 'Corporate Finance',
  'Hedge Funds', 'Entrepreneurship', 'Engineering Management',
];

type Step = 1 | 2 | 3;

// -------------------------------------------------------
// Step indicator
// -------------------------------------------------------
function StepIndicator({ current, total, labels }: { current: Step; total: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const step = (i + 1) as Step;
        const done = current > step;
        const active = current === step;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-green-500 text-white' : active ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check className="w-4 h-4" /> : step}
              </div>
              <span className={`text-xs mt-1 font-medium ${active ? 'text-navy-900' : 'text-gray-400'}`}>
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 flex-1 mx-2 mb-5 transition-colors ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------
// Shared field components
// -------------------------------------------------------
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy-900 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white placeholder-gray-400"
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white placeholder-gray-400 resize-none"
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white"
    />
  );
}

function TagPicker({ options, value, onChange, max = 8 }: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => {
              if (selected) onChange(value.filter((v) => v !== opt));
              else if (value.length < max) onChange([...value, opt]);
            }}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              selected
                ? 'bg-navy-900 border-navy-900 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-navy-300'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------
// Main component
// -------------------------------------------------------
export default function ProfileSetupPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<'mentor' | 'mentee' | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Shared step 1 fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Mentor step 2
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [bio, setBio] = useState('');

  // Mentor step 3
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [goalsMentor, setGoalsMentor] = useState<string[]>([]);
  const [weeklyHours, setWeeklyHours] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');

  // Mentee step 2
  const [major, setMajor] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [preferredFormat, setPreferredFormat] = useState('video');
  const [menteeBio, setMenteeBio] = useState('');
  const [menteeTimezone, setMenteeTimezone] = useState('America/New_York');

  // Mentee step 3
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [careerInterests, setCareerInterests] = useState<string[]>([]);
  const [industriesOfInterest, setIndustriesOfInterest] = useState<string[]>([]);
  const [goalsMentee, setGoalsMentee] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;
      setUserId(uid);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, first_name, last_name, headline, location, university, graduation_year, linkedin_url')
        .eq('id', uid)
        .single();

      setRole(profile?.role as 'mentor' | 'mentee');
      if (profile?.first_name) setFirstName(profile.first_name);
      if (profile?.last_name) setLastName(profile.last_name);
      if (profile?.headline) setHeadline(profile.headline);
      if (profile?.location) setLocation(profile.location);
      if (profile?.university) setUniversity(profile.university);
      if (profile?.graduation_year) setGraduationYear(String(profile.graduation_year));
      if (profile?.linkedin_url) setLinkedinUrl(profile.linkedin_url);

      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!userId || !role) return;
    setSaving(true);
    setError('');

    const supabase = createClient();

    try {
      // Update profiles table
      await supabase.from('profiles').update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        headline: headline.trim() || null,
        location: location.trim() || null,
        university: university.trim() || null,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
        linkedin_url: linkedinUrl.trim() || null,
        profile_complete: true,
      }).eq('id', userId);

      if (role === 'mentor') {
        const { error: mpErr } = await supabase.from('mentor_profiles').upsert({
          id: userId,
          bio: bio.trim() || null,
          expertise_tags: expertiseTags,
          goals: goalsMentor,
          years_experience: parseInt(yearsExperience) || 0,
          weekly_hours: parseInt(weeklyHours) || 0,
          timezone: timezone || null,
          company: company.trim() || null,
          title: title.trim() || null,
          industry: industry || null,
          profile_complete: true,
        });
        if (mpErr) throw new Error(mpErr.message);
      } else {
        const { error: mpErr } = await supabase.from('mentee_profiles').upsert({
          id: userId,
          bio: menteeBio.trim() || null,
          interest_tags: interestTags,
          goals: goalsMentee,
          experience_level: experienceLevel as 'beginner' | 'intermediate' | 'advanced',
          preferred_format: preferredFormat as 'video' | 'chat' | 'async',
          timezone: menteeTimezone || null,
          major: major.trim() || null,
          career_interests: careerInterests,
          industries_of_interest: industriesOfInterest,
          profile_complete: true,
        });
        if (mpErr) throw new Error(mpErr.message);
      }

      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.prompt(
      'This will permanently delete your account and all your data. Type DELETE to confirm.'
    );
    if (confirmed !== 'DELETE') return;

    const res = await fetch('/api/account/delete', { method: 'DELETE' });
    if (!res.ok) {
      alert('Failed to delete account. Please contact support.');
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!role || !userId) return null;

  const mentorStepLabels = ['Basic Info', 'Experience', 'Mentorship'];
  const menteeStepLabels = ['Basic Info', 'Background', 'Interests'];

  const stepLabels = role === 'mentor' ? mentorStepLabels : menteeStepLabels;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900">Complete your profile</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {role === 'mentor'
            ? 'Help mentees understand your background and what you offer.'
            : 'Help mentors understand your goals so they can guide you better.'}
        </p>
      </div>

      <StepIndicator current={step} total={3} labels={stepLabels} />

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">

        {/* ── STEP 1: Basic Info (both roles) ── */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name">
                <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jordan" required />
              </Field>
              <Field label="Last name">
                <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Taylor" required />
              </Field>
            </div>
            <Field label="Headline" hint="One line that describes who you are professionally">
              <TextInput
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={role === 'mentor' ? 'VP at Goldman Sachs | M&A Advisory' : 'Finance Junior at UNC | Aspiring IB'}
              />
            </Field>
            <Field label="Location">
              <TextInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New York, NY" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="University">
                <TextInput value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="UNC Chapel Hill" />
              </Field>
              <Field label="Graduation year">
                <TextInput type="number" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="2026" min="1990" max="2035" />
              </Field>
            </div>
            <Field label="LinkedIn URL" hint="Optional — helps establish credibility">
              <TextInput value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" type="url" />
            </Field>
          </>
        )}

        {/* ── STEP 2: Experience (mentor) ── */}
        {step === 2 && role === 'mentor' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Company">
                <TextInput value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Goldman Sachs" />
              </Field>
              <Field label="Title">
                <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Vice President" />
              </Field>
            </div>
            <Field label="Industry">
              <SelectInput value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </SelectInput>
            </Field>
            <Field label="Years of experience">
              <TextInput type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="8" min="0" max="40" />
            </Field>
            <Field label="Bio" hint="Tell mentees about your background and what you bring to the table. Be specific.">
              <TextArea rows={5} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="I'm a VP in Goldman's M&A group with 9 years of experience advising on transformative deals across TMT, healthcare, and consumer..." />
            </Field>
          </>
        )}

        {/* ── STEP 2: Background (mentee) ── */}
        {step === 2 && role === 'mentee' && (
          <>
            <Field label="Major / Field of study">
              <TextInput value={major} onChange={(e) => setMajor(e.target.value)} placeholder="Finance & Statistics" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Experience level">
                <SelectInput value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                  <option value="beginner">Beginner — just getting started</option>
                  <option value="intermediate">Intermediate — some exposure</option>
                  <option value="advanced">Advanced — hands-on experience</option>
                </SelectInput>
              </Field>
              <Field label="Preferred format">
                <SelectInput value={preferredFormat} onChange={(e) => setPreferredFormat(e.target.value)}>
                  <option value="video">Video calls</option>
                  <option value="chat">Chat / messaging</option>
                  <option value="async">Async (email/docs)</option>
                </SelectInput>
              </Field>
            </div>
            <Field label="Bio" hint="Introduce yourself — your background, what you're working toward, why you're here.">
              <TextArea rows={4} value={menteeBio} onChange={(e) => setMenteeBio(e.target.value)} placeholder="Junior at UNC Kenan-Flagler targeting investment banking. Active in the Financial Leadership Program and UNC Investment Club..." />
            </Field>
            <Field label="Timezone">
              <SelectInput value={menteeTimezone} onChange={(e) => setMenteeTimezone(e.target.value)}>
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                ))}
              </SelectInput>
            </Field>
          </>
        )}

        {/* ── STEP 3: Mentorship preferences (mentor) ── */}
        {step === 3 && role === 'mentor' && (
          <>
            <Field label="Expertise tags" hint={`Select up to 8 skills you can help with (${expertiseTags.length}/8 selected)`}>
              <TagPicker options={FINANCE_EXPERTISE} value={expertiseTags} onChange={setExpertiseTags} max={8} />
            </Field>
            <Field label="Goals I help mentees achieve" hint={`Select up to 5 (${goalsMentor.length}/5 selected)`}>
              <TagPicker options={GOAL_OPTIONS_MENTOR} value={goalsMentor} onChange={setGoalsMentor} max={5} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hours available per week">
                <TextInput type="number" value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} placeholder="3" min="1" max="20" />
              </Field>
              <Field label="Timezone">
                <SelectInput value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          </>
        )}

        {/* ── STEP 3: Interests (mentee) ── */}
        {step === 3 && role === 'mentee' && (
          <>
            <Field label="Career interests" hint={`What roles/paths are you targeting? (${careerInterests.length}/4 selected)`}>
              <TagPicker options={CAREER_INTERESTS} value={careerInterests} onChange={setCareerInterests} max={4} />
            </Field>
            <Field label="Industries of interest" hint={`Which industries? (${industriesOfInterest.length}/4 selected)`}>
              <TagPicker options={INDUSTRIES} value={industriesOfInterest} onChange={setIndustriesOfInterest} max={4} />
            </Field>
            <Field label="Skills you want to develop" hint={`Choose what you want to learn (${interestTags.length}/6 selected)`}>
              <TagPicker options={INTEREST_TAGS} value={interestTags} onChange={setInterestTags} max={6} />
            </Field>
            <Field label="Goals for this mentorship" hint={`What do you want to achieve? (${goalsMentee.length}/4 selected)`}>
              <TagPicker options={GOAL_OPTIONS_MENTEE} value={goalsMentee} onChange={setGoalsMentee} max={4} />
            </Field>
          </>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => step > 1 && setStep((s) => (s - 1) as Step)}
            disabled={step === 1}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-navy-900 disabled:opacity-0 transition-colors"
          >
            ← Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !firstName.trim()) { setError('First name is required'); return; }
                setError('');
                setStep((s) => (s + 1) as Step);
              }}
              className="px-6 py-2.5 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : (
                <><Check className="w-4 h-4" /> Complete Profile</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-8 bg-white rounded-2xl border border-red-100 p-6">
        <h2 className="text-sm font-semibold text-red-700 mb-1">Danger zone</h2>
        <p className="text-xs text-gray-500 mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete account
        </button>
      </div>
    </div>
  );
}
