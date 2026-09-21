'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';
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
    <div className="flex items-start mb-8" role="list" aria-label="Progress">
      {Array.from({ length: total }, (_, i) => {
        const step = (i + 1) as Step;
        const done = current > step;
        const active = current === step;
        return (
          <div key={step} className="flex items-center flex-1" role="listitem">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                  done ? 'bg-green-500 text-white' : active ? 'bg-halo-purple text-white' : 'bg-halo-bone text-halo-mist-body'
                }`}
                aria-label={`Step ${step}: ${labels[i]}${done ? ' (complete)' : active ? ' (current)' : ''}`}
              >
                {done ? <Check className="w-4 h-4" /> : step}
              </div>
              <span className={`text-[11px] mt-1.5 font-medium text-center leading-tight ${active ? 'text-halo-ink' : 'text-halo-mist-body'}`}>
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 flex-1 mx-2 mt-4 transition-colors flex-shrink ${done ? 'bg-green-500' : 'bg-halo-rule'}`} />
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
      <label className="block text-sm font-medium text-halo-ink mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-halo-mist-body mt-1">{hint}</p>}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3.5 py-2.5 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple bg-white placeholder-halo-mist-body"
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-3.5 py-2.5 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple bg-white placeholder-halo-mist-body resize-none"
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-3.5 py-2.5 border border-halo-rule rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-halo-purple bg-white"
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
                ? 'bg-halo-purple border-halo-purple text-white'
                : 'bg-white border-halo-rule text-halo-heather hover:border-halo-purple'
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
  const [profileComplete, setProfileComplete] = useState(false);
  /*
    Whether this person already has a row in mentor_profiles / mentee_profiles.

    It decides insert vs update below, and it must not be guessed: an upsert
    cannot be used here. Migration 0017 replaced table-level UPDATE on these
    tables with column-level grants (so a mentor cannot award themselves a
    rating or a verified badge). PostgreSQL requires table-level UPDATE for
    INSERT ... ON CONFLICT DO UPDATE, so every upsert has been failing with
    42501 "permission denied for table mentor_profiles" since that migration:
    saving a profile silently did nothing, and a new user could never set
    profile_complete, which left them redirected to this page forever.

    Verified against the live database: plain UPDATE of the granted columns is
    allowed, INSERT of your own row is allowed (RLS rejects anyone else's), and
    only the upsert is denied. So this splits the two cases and keeps 0017's
    column grants exactly as they are — no migration, no widened privilege.
  */
  const [roleRowExists, setRoleRowExists] = useState(false);
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

      const myRole = profile?.role as 'mentor' | 'mentee';
      setRole(myRole);
      if (profile?.first_name) setFirstName(profile.first_name);
      if (profile?.last_name) setLastName(profile.last_name);
      if (profile?.headline) setHeadline(profile.headline);
      if (profile?.location) setLocation(profile.location);
      if (profile?.university) setUniversity(profile.university);
      if (profile?.graduation_year) setGraduationYear(String(profile.graduation_year));
      if (profile?.linkedin_url) setLinkedinUrl(profile.linkedin_url);

      /*
        Load what the person already wrote.

        This page only ever read the `profiles` row, so someone returning from
        the sidebar's My Profile saw their bio, expertise, goals and timezone
        as empty fields — and the save at the end is an upsert, so walking
        through the three steps and pressing save overwrote all of it with
        blanks. Nothing warned them. Hydrating the role row fixes the display
        and removes the data loss with it.
      */
      if (myRole === 'mentor') {
        const { data: mp } = await supabase
          .from('mentor_profiles')
          .select('bio, expertise_tags, goals, years_experience, weekly_hours, timezone, company, title, industry, profile_complete')
          .eq('id', uid)
          .maybeSingle();
        if (mp) {
          setRoleRowExists(true);
          setProfileComplete(!!mp.profile_complete);
          if (mp.bio) setBio(mp.bio);
          if (mp.expertise_tags?.length) setExpertiseTags(mp.expertise_tags);
          if (mp.goals?.length) setGoalsMentor(mp.goals);
          if (mp.years_experience) setYearsExperience(String(mp.years_experience));
          if (mp.weekly_hours) setWeeklyHours(String(mp.weekly_hours));
          if (mp.timezone) setTimezone(mp.timezone);
          if (mp.company) setCompany(mp.company);
          if (mp.title) setTitle(mp.title);
          if (mp.industry) setIndustry(mp.industry);
        }
      } else {
        const { data: mp } = await supabase
          .from('mentee_profiles')
          .select('bio, interest_tags, goals, experience_level, preferred_format, timezone, major, career_interests, industries_of_interest, profile_complete')
          .eq('id', uid)
          .maybeSingle();
        if (mp) {
          setRoleRowExists(true);
          setProfileComplete(!!mp.profile_complete);
          if (mp.bio) setMenteeBio(mp.bio);
          if (mp.interest_tags?.length) setInterestTags(mp.interest_tags);
          if (mp.goals?.length) setGoalsMentee(mp.goals);
          if (mp.experience_level) setExperienceLevel(mp.experience_level);
          if (mp.preferred_format) setPreferredFormat(mp.preferred_format);
          if (mp.timezone) setMenteeTimezone(mp.timezone);
          if (mp.major) setMajor(mp.major);
          if (mp.career_interests?.length) setCareerInterests(mp.career_interests);
          if (mp.industries_of_interest?.length) setIndustriesOfInterest(mp.industries_of_interest);
        }
      }

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
      const { error: profileErr } = await supabase.from('profiles').update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        headline: headline.trim() || null,
        location: location.trim() || null,
        university: university.trim() || null,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
        linkedin_url: linkedinUrl.trim() || null,
      }).eq('id', userId);
      if (profileErr) throw new Error(profileErr.message);

      if (role === 'mentor') {
        const fields = {
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
        };
        // Only these columns are written either way, so everything the form
        // does not ask about — availability, capacity, rating, verification —
        // keeps whatever it already had.
        const { error: mpErr } = roleRowExists
          ? await supabase.from('mentor_profiles').update(fields).eq('id', userId)
          : await supabase.from('mentor_profiles').insert({ id: userId, ...fields });
        if (mpErr) throw new Error(mpErr.message);
      } else {
        const fields = {
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
        };
        const { error: mpErr } = roleRowExists
          ? await supabase.from('mentee_profiles').update(fields).eq('id', userId)
          : await supabase.from('mentee_profiles').insert({ id: userId, ...fields });
        if (mpErr) throw new Error(mpErr.message);
      }

      void trackEvent('profile_setup_completed', role);
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

    const res = await fetch('/api/account/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: confirmed }),
    });
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
        {/* Someone who finished this months ago is not "completing" anything;
            they came from the sidebar's My Profile to change something. */}
        <h1 className="font-display font-normal text-[2rem] leading-tight text-halo-ink">
          {profileComplete ? 'Your profile' : 'Complete your profile'}
        </h1>
        <p className="text-halo-mist-body mt-1 text-sm">
          {profileComplete
            ? role === 'mentor'
              ? 'What students see when they find you.'
              : 'What mentors see when you ask to work with them.'
            : role === 'mentor'
              ? 'Help students understand your background and what you can help with.'
              : 'Help mentors understand what you are hoping to learn.'}
        </p>
      </div>

      <StepIndicator current={step} total={3} labels={stepLabels} />

      <div className="bg-white rounded-2xl border border-halo-rule p-6 space-y-6">

        {/* ── STEP 1: Basic Info (both roles) ── */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="University">
                <TextInput value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="UNC Chapel Hill" />
              </Field>
              <Field label="Graduation year">
                <TextInput type="number" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="2026" min="1990" max="2035" />
              </Field>
            </div>
            <Field label="LinkedIn URL" hint="Optional. Helps establish credibility.">
              <TextInput value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" type="url" />
            </Field>
          </>
        )}

        {/* ── STEP 2: Experience (mentor) ── */}
        {step === 2 && role === 'mentor' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Experience level">
                <SelectInput value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                  <option value="beginner">Beginner: just getting started</option>
                  <option value="intermediate">Intermediate: some exposure</option>
                  <option value="advanced">Advanced: hands-on experience</option>
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
            <Field label="Bio" hint="Introduce yourself: your background, what you're working toward, why you're here.">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="flex items-center justify-between pt-2 border-t border-halo-rule">
          <button
            type="button"
            onClick={() => step > 1 && setStep((s) => (s - 1) as Step)}
            disabled={step === 1}
            className="px-4 py-2.5 text-sm text-halo-mist-body hover:text-halo-ink disabled:opacity-0 transition-colors"
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
              className="px-6 py-2.5 bg-halo-purple text-white text-sm font-medium rounded-xl hover:bg-halo-purple-d transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-halo-purple text-white text-sm font-medium rounded-xl hover:bg-halo-purple-d disabled:opacity-50 transition-colors flex items-center gap-2"
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
        <p className="text-xs text-halo-mist-body mb-4">
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
