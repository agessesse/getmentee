'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';
import Spinner from '@/components/ui/Spinner';
import { Check, Trash2 } from 'lucide-react';
import CalendarSettings from '@/components/settings/CalendarSettings';
import ChipPicker from '@/components/onboarding/ChipPicker';
import {
  SITUATIONS, FUNCTIONS, TRANSITIONS, INDUSTRIES, SUBJECTS, COMMUNITIES,
  COMPANY_SUGGESTIONS, RELATIONSHIP_TYPES, CADENCES, MODES, LOOKING_FOR,
  asOptions,
} from '@/lib/matching/vocabulary';

// -------------------------------------------------------
// Shared constants
// -------------------------------------------------------
const COMMON_TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'UTC',
];

/*
  THE VOCABULARIES MOVED TO lib/matching/vocabulary.ts.

  They used to live here, as six lists private to this form, and that was
  the real reason the richer inputs would not have helped: the engine finds
  overlap by comparing strings, so a mentor who writes "IB recruiting" and
  a student who writes "Investment banking recruiting" produce NO reason at
  all. Adding more free-text fields to onboarding would have made matching
  worse, not better — more places for two people to describe one thing
  differently.

  The shared file pairs each mentor field with the seeker field it is
  matched against, so the two sides are offered the same words. Read down a
  column it is a form; read across a row it is a join.
*/

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

/*
  FOUR STEPS, AND THE FOURTH IS THE POINT.

  Steps 1-3 describe a person: where they have been, what they know, who
  they tend to be useful to. All of it is true in a year.

  Step 4 is different in kind. For a seeker it captures INTENT — what they
  are trying to do right now, and by when — which expires and is superseded
  rather than edited. For a mentor it captures what they are actually
  offering, which is the thing most often assumed and then resented.

  Collapsing the two is the standard mistake: it produces a network that
  recommends the same people forever and cannot tell a live need from a
  stale one.
*/
type Step = 1 | 2 | 3 | 4;
const TOTAL_STEPS = 4;

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
/*
  `hint` sits below the control, which is right for a constraint ("Up to
  eight") and wrong for an instruction. The lead question on the mentor
  step explains HOW to answer — situations, not subjects — and underneath
  a row of chips that guidance arrives after the person has already
  guessed. `hintFirst` moves it above, where it is read in time to be
  useful.
*/
function Field({ label, children, hint, hintFirst = false }: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  hintFirst?: boolean;
}) {
  const hintEl = hint
    ? <p className={`text-xs text-halo-mist-body ${hintFirst ? 'mb-2.5 leading-relaxed' : 'mt-1'}`}>{hint}</p>
    : null;
  return (
    <div>
      <label className="block text-sm font-medium text-halo-ink mb-1.5">{label}</label>
      {hintFirst && hintEl}
      {children}
      {!hintFirst && hintEl}
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

/*
  TagPicker lived here and rendered every option as a button. That worked
  at thirteen industries and fell apart at twenty-two situations and fifty
  companies: a wall of chips is something people scroll past, which is
  exactly what happened to can_help_with. ChipPicker replaced it — the
  chosen values stay visible, a short list of suggestions sits underneath,
  and the rest arrives through typing.
*/

// -------------------------------------------------------
// Main component
// -------------------------------------------------------
export default function ProfileSetupForm({
  /*
    Whether migration 0039 is live. Asked of the database by the server
    component above, never assumed from the files in supabase/migrations:
    0018 and 0033 both sat in version control looking applied while the
    feature they backed silently did nothing in production.
  */
  hasIntelligenceInputs,
}: {
  hasIntelligenceInputs: boolean;
}) {
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
  const [canHelpWith, setCanHelpWith] = useState<string[]>([]);
  const [weeklyHours, setWeeklyHours] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');

  /*
    Mentor relationship-intelligence inputs (migration 0039). Each one is
    paired with a seeker field in lib/matching/vocabulary.ts; the pairing
    is what makes them produce reasons rather than just fill a profile.
  */
  const [companiesKnown, setCompaniesKnown] = useState<string[]>([]);
  const [functions, setFunctions] = useState<string[]>([]);
  const [transitionsMade, setTransitionsMade] = useState<string[]>([]);
  const [topicsEnjoyed, setTopicsEnjoyed] = useState<string[]>([]);
  const [usefulTo, setUsefulTo] = useState<string[]>([]);
  const [affiliations, setAffiliations] = useState<string[]>([]);
  const [relationshipTypes, setRelationshipTypes] = useState<string[]>([]);
  const [meetingCadence, setMeetingCadence] = useState('');
  const [meetingMode, setMeetingMode] = useState('');

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

  /* Seeker profile inputs (migration 0039). Durable facts. */
  const [functionsExploring, setFunctionsExploring] = useState<string[]>([]);
  const [transitionsNavigating, setTransitionsNavigating] = useState<string[]>([]);
  const [communities, setCommunities] = useState<string[]>([]);
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [background, setBackground] = useState('');

  /*
    INTENT. Why this person needs an introduction NOW — a different kind of
    thing from everything above it, and stored in its own table with a date
    on it. `intentId` is the row currently active, held so that changing
    the objective SUPERSEDES it rather than editing it: "what were you
    trying to do in October" has to stay answerable, which is the whole
    reason for collecting this before a match rather than after.
  */
  const [intentId, setIntentId] = useState<string | null>(null);
  const [originalObjective, setOriginalObjective] = useState('');
  const [objective, setObjective] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [byDate, setByDate] = useState('');

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
          .select('bio, expertise_tags, goals, can_help_with, years_experience, weekly_hours, timezone, company, title, industry, profile_complete')
          .eq('id', uid)
          .maybeSingle();
        if (mp) {
          setRoleRowExists(true);
          setProfileComplete(!!mp.profile_complete);
          if (mp.bio) setBio(mp.bio);
          if (mp.expertise_tags?.length) setExpertiseTags(mp.expertise_tags);
          if (mp.goals?.length) setGoalsMentor(mp.goals);
          if (mp.can_help_with?.length) setCanHelpWith(mp.can_help_with);
          if (mp.years_experience) setYearsExperience(String(mp.years_experience));
          if (mp.weekly_hours) setWeeklyHours(String(mp.weekly_hours));
          if (mp.timezone) setTimezone(mp.timezone);
          if (mp.company) setCompany(mp.company);
          if (mp.title) setTitle(mp.title);
          if (mp.industry) setIndustry(mp.industry);
        }
        /*
          Selected separately, and only when the columns exist. PostgREST
          rejects the WHOLE select for one unknown column, so folding
          these into the query above would blank every field on the page
          for everyone until 0039 is applied — the same way an unknown
          career_interests column would have silently emptied the cohort
          pipeline.
        */
        if (hasIntelligenceInputs) {
          const { data: ex } = await supabase
            .from('mentor_profiles')
            .select('companies_known, functions, transitions_made, topics_enjoyed, useful_to, affiliations, relationship_types, meeting_cadence, meeting_mode')
            .eq('id', uid)
            .maybeSingle();
          if (ex) {
            setCompaniesKnown(ex.companies_known ?? []);
            setFunctions(ex.functions ?? []);
            setTransitionsMade(ex.transitions_made ?? []);
            setTopicsEnjoyed(ex.topics_enjoyed ?? []);
            setUsefulTo(ex.useful_to ?? []);
            setAffiliations(ex.affiliations ?? []);
            setRelationshipTypes(ex.relationship_types ?? []);
            setMeetingCadence(ex.meeting_cadence ?? '');
            setMeetingMode(ex.meeting_mode ?? '');
          }
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
        if (hasIntelligenceInputs) {
          const { data: ex } = await supabase
            .from('mentee_profiles')
            .select('functions_exploring, transitions_navigating, communities, target_companies, background')
            .eq('id', uid)
            .maybeSingle();
          if (ex) {
            setFunctionsExploring(ex.functions_exploring ?? []);
            setTransitionsNavigating(ex.transitions_navigating ?? []);
            setCommunities(ex.communities ?? []);
            setTargetCompanies(ex.target_companies ?? []);
            setBackground(ex.background ?? '');
          }
          /* At most one active intent per person, enforced by a partial
             unique index. maybeSingle is correct rather than defensive. */
          const { data: it } = await supabase
            .from('member_intent')
            .select('id, objective, questions, looking_for, by_date')
            .eq('profile_id', uid)
            .eq('status', 'active')
            .maybeSingle();
          if (it) {
            setIntentId(it.id);
            setObjective(it.objective ?? '');
            setOriginalObjective(it.objective ?? '');
            setQuestions(it.questions ?? []);
            setLookingFor(it.looking_for ?? []);
            setByDate(it.by_date ?? '');
          }
        }
      }

      setLoading(false);
    }
    load();
  }, [hasIntelligenceInputs]);

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
      if (profileErr) throw profileErr;

      if (role === 'mentor') {
        const fields = {
          bio: bio.trim() || null,
          expertise_tags: expertiseTags,
          goals: goalsMentor,
          can_help_with: canHelpWith,
          years_experience: parseInt(yearsExperience) || 0,
          weekly_hours: parseInt(weeklyHours) || 0,
          timezone: timezone || null,
          company: company.trim() || null,
          title: title.trim() || null,
          industry: industry || null,
          profile_complete: true,
          /*
            Spread in only when the columns exist. An UPDATE naming a
            column PostgreSQL does not have fails the whole statement, so
            including these unconditionally would break saving the bio for
            every mentor until 0039 is applied.
          */
          ...(hasIntelligenceInputs ? {
            companies_known: companiesKnown,
            functions,
            transitions_made: transitionsMade,
            topics_enjoyed: topicsEnjoyed,
            useful_to: usefulTo,
            affiliations,
            relationship_types: relationshipTypes,
            meeting_cadence: meetingCadence || null,
            meeting_mode: meetingMode || null,
          } : {}),
        };
        // Only these columns are written either way, so everything the form
        // does not ask about — availability, capacity, rating, verification —
        // keeps whatever it already had.
        const { error: mpErr } = roleRowExists
          ? await supabase.from('mentor_profiles').update(fields).eq('id', userId)
          : await supabase.from('mentor_profiles').insert({ id: userId, ...fields });
        if (mpErr) throw mpErr;
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
          ...(hasIntelligenceInputs ? {
            functions_exploring: functionsExploring,
            transitions_navigating: transitionsNavigating,
            communities,
            target_companies: targetCompanies,
            background: background.trim() || null,
          } : {}),
        };
        const { error: mpErr } = roleRowExists
          ? await supabase.from('mentee_profiles').update(fields).eq('id', userId)
          : await supabase.from('mentee_profiles').insert({ id: userId, ...fields });
        if (mpErr) throw mpErr;

        /*
          INTENT IS SUPERSEDED, NEVER EDITED.

          Three cases, and the distinction between the second and third is
          the whole reason this table is separate from the profile:

            nothing written      no row, and no empty row either
            same objective       the details may change in place
            a new objective      the old row is CLOSED and a new one opened

          Rewriting an objective in place would quietly destroy the record
          of what someone was trying to do when a match was made, which is
          the only thing that will make the outcomes collected in
          relationship_outcomes interpretable later. The column grant
          allows UPDATE on status and closed_at only, so the database
          enforces this rather than trusting the client to.
        */
        if (hasIntelligenceInputs) {
          const objectiveText = objective.trim();
          const changed = objectiveText !== originalObjective.trim();

          if (objectiveText && intentId && !changed) {
            const { error } = await supabase.from('member_intent')
              .update({ questions, looking_for: lookingFor, by_date: byDate || null })
              .eq('id', intentId);
            if (error) throw error;
          } else if (objectiveText && changed) {
            if (intentId) {
              const { error } = await supabase.from('member_intent')
                .update({ status: 'superseded', closed_at: new Date().toISOString() })
                .eq('id', intentId);
              if (error) throw error;
            }
            const { data, error } = await supabase.from('member_intent')
              .insert({
                profile_id: userId,
                objective: objectiveText,
                questions,
                looking_for: lookingFor,
                by_date: byDate || null,
              })
              .select('id')
              .single();
            if (error) throw error;
            setIntentId(data.id);
            setOriginalObjective(objectiveText);
          } else if (!objectiveText && intentId) {
            /* Cleared on purpose: close it rather than leave a stale need
               in the network claiming to be live. */
            const { error } = await supabase.from('member_intent')
              .update({ status: 'expired', closed_at: new Date().toISOString() })
              .eq('id', intentId);
            if (error) throw error;
            setIntentId(null);
            setOriginalObjective('');
          }
        }
      }

      void trackEvent('profile_setup_completed', role);
      router.push('/dashboard');
    } catch (e) {
      /*
        What the person sees, and what we see, are different on purpose.

        Supabase errors carry the table name, the column privilege that was
        missing and the SQL state — "permission denied for table
        mentor_profiles" was reaching the screen of someone trying to update
        their bio. It tells them nothing they can act on and describes the
        inside of the database. The full error still goes to the console, with
        its code, details and hint intact, so a failure is no harder to debug.

        This is only for the save path. Validation messages above ("First name
        is required") are written for the person and are shown as they are.
      */
      console.error('[profile] save failed', e);
      setError('We couldn’t save your changes. Please try again.');
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

  /*
    Named for what each step ASKS, not for the part of the schema it
    writes. "Mentorship" told a mentor nothing about what was coming; "What
    you can help with" is the question itself, which is also the question
    the matching engine most needs answered.
  */
  const stepLabels = role === 'mentor'
    ? ['You', 'Where you have been', 'What you help with', 'How you help']
    : ['You', 'Your background', 'What you are exploring', 'Right now'];

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

      <StepIndicator current={step} total={TOTAL_STEPS} labels={stepLabels} />

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
            {hasIntelligenceInputs && (
              <>
                {/*
                  Where someone has ACTUALLY worked, which a current
                  employer cannot tell you. A student naming a firm can
                  then be matched to someone who has been inside it, and
                  the long tail is where that matters most — so this list
                  is suggestions, never a closed set.
                */}
                <Field
                  label="Places you have worked"
                  hint="Including earlier in your career. This is how someone aiming at a specific firm finds you."
                >
                  <ChipPicker
                    label="Places you have worked"
                    options={asOptions(COMPANY_SUGGESTIONS)}
                    value={companiesKnown}
                    onChange={setCompaniesKnown}
                    max={8}
                    placeholder="Start typing a firm"
                  />
                </Field>

                {/*
                  Function is separate from industry because a product
                  manager in banking and a banker are not interchangeable,
                  and industry alone cannot tell them apart.
                */}
                <Field label="What you actually do" hint="The work, not the industry.">
                  <ChipPicker
                    label="What you actually do"
                    options={asOptions(FUNCTIONS)}
                    value={functions}
                    onChange={setFunctions}
                    max={4}
                  />
                </Field>

                {/*
                  The strongest signal in the network, and the one no tag
                  list can express: not "knows about private equity" but
                  "went from consulting to private equity, the way you are
                  trying to".
                */}
                <Field
                  label="Moves you have made"
                  hint="Someone trying to make the same move will see this first."
                >
                  <ChipPicker
                    label="Moves you have made"
                    options={asOptions(TRANSITIONS)}
                    value={transitionsMade}
                    onChange={setTransitionsMade}
                    max={4}
                  />
                </Field>
              </>
            )}

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
            {hasIntelligenceInputs && (
              <>
                {/*
                  Free text on purpose. A mentor deciding whether to spend
                  twenty minutes reads this, and the useful version of it
                  is never on a dropdown — "first in my family to go to
                  college, working thirty hours a week" is the sentence
                  that gets an answer, and no tag encodes it.
                */}
                <Field
                  label="Anything about where you are coming from"
                  hint="Optional. A mentor reads this before deciding, and context helps more than credentials."
                >
                  <TextArea
                    rows={3}
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    maxLength={1000}
                    placeholder="First in my family to go to college. Transferred from community college last year and I'm trying to work out how recruiting actually works."
                  />
                </Field>

                <Field
                  label="Communities you are part of"
                  hint="Some mentors are here specifically to help people from a group they were part of."
                >
                  <ChipPicker
                    label="Communities you are part of"
                    options={asOptions(COMMUNITIES)}
                    value={communities}
                    onChange={setCommunities}
                    max={5}
                  />
                </Field>
              </>
            )}

            <Field label="Timezone">
              <SelectInput value={menteeTimezone} onChange={(e) => setMenteeTimezone(e.target.value)}>
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                ))}
              </SelectInput>
            </Field>
          </>
        )}

        {/* ── STEP 3: What you help with (mentor) ── */}
        {step === 3 && role === 'mentor' && (
          <>
            {/*
              THE FIELD THIS WHOLE PASS EXISTS FOR.

              Measured in production: 25 of 25 mentors had an industry,
              25 of 25 had expertise tags, and ZERO had this. It was the
              third question on the last step of a form, rendered as a
              wall of chips below two other walls of chips, and everybody
              scrolled past it.

              So it leads now, it is the only question with a sentence
              explaining why, and the Complete button below will not let
              a mentor finish without one. Everything else on this step
              is optional.
            */}
            <div className="rounded-2xl bg-halo-veil border border-halo-rule p-4 sm:p-5">
              <Field
                label="What can someone bring you?"
                hintFirst
                hint="Situations, not subjects. A student with a superday in three weeks needs someone who has sat on that side of the table — not someone tagged “Finance”."
              >
                <ChipPicker
                  label="What can someone bring you"
                  options={asOptions(SITUATIONS)}
                  value={canHelpWith}
                  onChange={setCanHelpWith}
                  max={6}
                  placeholder="Type to search situations, or add your own"
                />
              </Field>
            </div>

            <Field label="Subjects you know well" hint="Up to eight.">
              <ChipPicker
                label="Subjects you know well"
                options={asOptions(SUBJECTS)}
                value={expertiseTags}
                onChange={setExpertiseTags}
                max={8}
              />
            </Field>

            {hasIntelligenceInputs && (
              <>
                {/*
                  Qualified and willing are different facts, and the
                  second is what makes a mentor answer the fifth email.
                  The engine says so out loud when they overlap.
                */}
                <Field
                  label="What you enjoy talking about"
                  hint="Not the same as what you are qualified for. This is what keeps you answering."
                >
                  <ChipPicker
                    label="What you enjoy talking about"
                    options={asOptions(SUBJECTS)}
                    value={topicsEnjoyed}
                    onChange={setTopicsEnjoyed}
                    max={5}
                  />
                </Field>

                {/* Their own words about their own audience, and the
                    cheapest way to avoid mismatching seniority. */}
                <Field
                  label="Who you are most useful to"
                  hint="Optional, and worth answering if there is a group you particularly want to help."
                >
                  <ChipPicker
                    label="Who you are most useful to"
                    options={asOptions(COMMUNITIES)}
                    value={usefulTo}
                    onChange={setUsefulTo}
                    max={5}
                  />
                </Field>

                {/* Weak as a predictor of a useful conversation, strong
                    as a predictor of whether it happens at all. */}
                <Field
                  label="Communities you belong to"
                  hint="Beyond your university, which we already have."
                >
                  <ChipPicker
                    label="Communities you belong to"
                    options={asOptions(COMMUNITIES)}
                    value={affiliations}
                    onChange={setAffiliations}
                    max={5}
                  />
                </Field>
              </>
            )}
          </>
        )}

        {/* ── STEP 4: How you help (mentor) ── */}
        {step === 4 && role === 'mentor' && (
          <>
            {hasIntelligenceInputs && (
              <>
                {/*
                  ASKED, NOT ASSUMED.

                  Assuming every mentor wants an ongoing relationship is
                  how mentors get over-committed and then quietly stop
                  answering. Someone offering one conversation is not a
                  lesser mentor; they are a different and honestly
                  described kind of help, and saying so protects the
                  supply side of the network.
                */}
                <Field
                  label="What are you offering?"
                  hintFirst
                  hint="All of these are real answers. Choosing the small one is better than being asked for the big one."
                >
                  <ChipPicker
                    label="What are you offering"
                    options={asOptions(RELATIONSHIP_TYPES)}
                    value={relationshipTypes}
                    onChange={setRelationshipTypes}
                    max={4}
                    allowCustom={false}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="How often, at most">
                    <SelectInput value={meetingCadence} onChange={(e) => setMeetingCadence(e.target.value)}>
                      <option value="">No preference</option>
                      {CADENCES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="How you would meet">
                    <SelectInput value={meetingMode} onChange={(e) => setMeetingMode(e.target.value)}>
                      <option value="">No preference</option>
                      {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </SelectInput>
                  </Field>
                </div>
              </>
            )}

            <Field label="Goals you help people reach" hint="Up to five.">
              <ChipPicker
                label="Goals you help people reach"
                options={GOAL_OPTIONS_MENTOR}
                value={goalsMentor}
                onChange={setGoalsMentor}
                max={5}
              />
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

        {/* ── STEP 3: What you are exploring (mentee) ── */}
        {step === 3 && role === 'mentee' && (
          <>
            <Field label="Paths you are considering" hint="Up to four.">
              <ChipPicker
                label="Paths you are considering"
                options={CAREER_INTERESTS}
                value={careerInterests}
                onChange={setCareerInterests}
                max={4}
              />
            </Field>
            <Field label="Industries you are aiming at" hint="Up to four.">
              <ChipPicker
                label="Industries you are aiming at"
                options={asOptions(INDUSTRIES)}
                value={industriesOfInterest}
                onChange={setIndustriesOfInterest}
                max={4}
              />
            </Field>

            {hasIntelligenceInputs && (
              <>
                {/* Paired with the mentor's "What you actually do". */}
                <Field
                  label="The work itself"
                  hint="What you would be doing day to day, as opposed to the industry you would be doing it in."
                >
                  <ChipPicker
                    label="The work itself"
                    options={asOptions(FUNCTIONS)}
                    value={functionsExploring}
                    onChange={setFunctionsExploring}
                    max={4}
                  />
                </Field>

                {/* Paired with the mentor's "Moves you have made", and
                    the highest-weighted signal in the engine. */}
                <Field
                  label="A move you are trying to make"
                  hintFirst
                  hint="If one of these fits, it is the single most useful thing you can tell us: it finds people who have made the same move."
                >
                  <ChipPicker
                    label="A move you are trying to make"
                    options={asOptions(TRANSITIONS)}
                    value={transitionsNavigating}
                    onChange={setTransitionsNavigating}
                    max={3}
                  />
                </Field>

                {/* Paired with the mentor's "Places you have worked". */}
                <Field
                  label="Places you would like to end up"
                  hint="Naming a specific firm finds people who have actually been inside it."
                >
                  <ChipPicker
                    label="Places you would like to end up"
                    options={asOptions(COMPANY_SUGGESTIONS)}
                    value={targetCompanies}
                    onChange={setTargetCompanies}
                    max={6}
                    placeholder="Start typing a firm"
                  />
                </Field>
              </>
            )}

            <Field label="Skills you want to develop" hint="Up to six.">
              <ChipPicker
                label="Skills you want to develop"
                options={asOptions(SUBJECTS)}
                value={interestTags}
                onChange={setInterestTags}
                max={6}
              />
            </Field>
          </>
        )}

        {/* ── STEP 4: Right now (mentee) ── */}
        {step === 4 && role === 'mentee' && (
          <>
            {hasIntelligenceInputs ? (
              <>
                {/*
                  THE DISTINCTION THIS STEP EXISTS TO HOLD.

                  Everything before it describes a person and is true in a
                  year. This describes why someone should be introduced to
                  you NOW, and it is wrong three months from now. Stored
                  in its own table with a date on it, superseded rather
                  than edited, so that when an outcome is recorded later
                  it is still possible to say what the match was for.
                */}
                <div className="rounded-2xl bg-halo-veil border border-halo-rule p-4 sm:p-5 space-y-5">
                  <Field
                    label="What are you trying to work out right now?"
                    hintFirst
                    hint="One sentence, in your own words. This is what a mentor reads first, and it is the difference between “interested in finance” and “deciding between two offers by March”."
                  >
                    <TextArea
                      rows={2}
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      maxLength={500}
                      placeholder="Work out whether I actually want to do banking before applications open in the spring."
                    />
                  </Field>

                  <Field
                    label="What would you actually ask?"
                    hint="Up to three. These become the first thing you say, so you are not staring at an empty message box."
                  >
                    <ChipPicker
                      label="What would you actually ask"
                      options={[]}
                      value={questions}
                      onChange={setQuestions}
                      max={3}
                      placeholder="Type a question and press Enter"
                    />
                  </Field>

                  <Field label="Who would be useful to you right now?">
                    <ChipPicker
                      label="Who would be useful to you right now"
                      options={asOptions(LOOKING_FOR)}
                      value={lookingFor}
                      onChange={setLookingFor}
                      max={4}
                    />
                  </Field>

                  <Field
                    label="Is there a deadline?"
                    hint="Optional. Most of the time there is not — but when there is, it changes who you should be talking to first."
                  >
                    <TextInput
                      type="date"
                      value={byDate}
                      onChange={(e) => setByDate(e.target.value)}
                    />
                  </Field>
                </div>

                {objective.trim() && originalObjective.trim() && objective.trim() !== originalObjective.trim() && (
                  <p className="text-xs text-halo-mist-body leading-relaxed">
                    This replaces what you wrote before. The old one is kept,
                    closed, so the reasons behind any introduction you have
                    already had still make sense.
                  </p>
                )}
              </>
            ) : null}

            <Field label="Goals for this mentorship" hint="Up to four.">
              <ChipPicker
                label="Goals for this mentorship"
                options={GOAL_OPTIONS_MENTEE}
                value={goalsMentee}
                onChange={setGoalsMentee}
                max={4}
              />
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

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !firstName.trim()) { setError('First name is required'); return; }
                /*
                  THE ONE GATE ON THIS FORM, and it is here because of a
                  measurement: 25 of 25 production mentors had reached the
                  end of onboarding without answering this. Everything a
                  recommendation can honestly say about a mentor who
                  skipped it comes from their job title.

                  Phrased as a request with a reason, not a validation
                  error. It is also the only required field beyond a first
                  name — a form that insists on everything gets abandoned,
                  and an abandoned profile has no inputs at all.
                */
                if (step === 3 && role === 'mentor' && canHelpWith.length === 0) {
                  setError('Pick at least one thing someone could bring you. It is what a student sees before they decide whether to ask.');
                  return;
                }
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

      {/*
        Calendar connections live here, at the account level, rather than in
        the mentorship workspace: a mentor connects once and every
        relationship can schedule.
      */}
      <CalendarSettings />

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
