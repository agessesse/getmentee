'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import {
  Shirt, Coffee, Plane, BookOpen, Presentation, Sparkles,
  ShieldCheck, Clock, CheckCircle, ChevronDown, ChevronUp, Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Fund {
  id: string;
  name: string;
  description: string | null;
  sponsor_name: string | null;
  status: 'active' | 'pilot' | 'closed';
  total_available: number;
  max_request_amount: number | null;
  allowed_categories: string[];
  eligibility_notes: string | null;
}

interface FinancialNeedProfile {
  pell_status: 'yes' | 'no' | 'prefer_not_to_say';
  first_gen_student: 'yes' | 'no' | 'prefer_not_to_say';
  need_based_aid: 'yes' | 'no' | 'prefer_not_to_say';
  additional_context: string | null;
  verification_status: string;
  submitted_at: string | null;
}

interface OpportunityInterest {
  id: string;
  category: string;
  description: string;
  estimated_amount: number | null;
  created_at: string;
}

interface Mentorship {
  id: string;
  partnerName: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    key: 'professional_attire',
    label: 'Professional Attire',
    icon: Shirt,
    examples: ['Interview suit or blazer', 'Tailoring', 'Professional shoes', 'Essential interview attire'],
    description: 'Looking the part matters. Attire support helps you show up confidently.',
  },
  {
    key: 'networking',
    label: 'Networking',
    icon: Coffee,
    examples: ['Coffee-chat expenses', 'Professional networking events', 'Industry meetups'],
    description: 'Relationships open doors. We want cost to stop being a reason you don\'t show up.',
  },
  {
    key: 'travel',
    label: 'Travel',
    icon: Plane,
    examples: ['Transportation to interviews', 'Career fairs', 'Approved office visits', 'Conference travel'],
    description: 'Getting there is half the battle. Geographic access should not determine opportunity.',
  },
  {
    key: 'career_development',
    label: 'Career Development',
    icon: BookOpen,
    examples: ['Approved certifications', 'Interview preparation resources', 'Professional materials'],
    description: 'Investing in skills that directly support your goal, recommended by your mentor.',
  },
  {
    key: 'conference_event',
    label: 'Conferences & Events',
    icon: Presentation,
    examples: ['Conference registration', 'Approved professional-development events', 'Industry summits'],
    description: 'Industry events can change your trajectory. Not being able to afford registration shouldn\'t stop you.',
  },
  {
    key: 'other',
    label: 'Opportunity Grant',
    icon: Sparkles,
    examples: ['Legitimate professional-development needs that do not fit another category'],
    description: 'Some barriers don\'t fit a box. Tell us what you need and why it matters.',
  },
];

const NEED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const CATEGORY_LABELS: Record<string, string> = {
  professional_attire: 'Professional Attire',
  networking: 'Networking',
  travel: 'Travel',
  career_development: 'Career Development',
  conference_event: 'Conferences & Events',
  other: 'Opportunity Grant',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryCard({ cat }: { cat: typeof CATEGORIES[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = cat.icon;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-navy-100 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-navy-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-navy-900 text-sm">{cat.label}</h3>
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-gray-400 hover:text-navy-700 transition-colors flex-shrink-0"
              aria-label={open ? 'Collapse' : 'Expand'}
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{cat.description}</p>
          {open && (
            <ul className="mt-3 space-y-1">
              {cat.examples.map((ex) => (
                <li key={ex} className="text-xs text-gray-500 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                  {ex}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function PilotBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
      <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-900">No active funding programs yet</p>
        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
          The Opportunity Fund is in its pilot phase. Mentee is building partnerships to launch the first funded cohort.
          Expressing interest below helps us understand demand and prioritize which programs to launch first.
        </p>
      </div>
    </div>
  );
}

function FundCard({ fund }: { fund: Fund }) {
  return (
    <div className="bg-white border border-navy-100 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-navy-900 text-sm">{fund.name}</p>
          {fund.sponsor_name && (
            <p className="text-xs text-gray-500 mt-0.5">Sponsored by {fund.sponsor_name}</p>
          )}
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0 ${
          fund.status === 'active'
            ? 'bg-green-100 text-green-700'
            : fund.status === 'pilot'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {fund.status === 'active' ? 'Open' : fund.status === 'pilot' ? 'Pilot' : 'Closed'}
        </span>
      </div>
      {fund.description && (
        <p className="text-xs text-gray-600 leading-relaxed mb-3">{fund.description}</p>
      )}
      {fund.max_request_amount && (
        <p className="text-xs text-gray-500">
          Max request: <span className="font-medium text-navy-900">${fund.max_request_amount.toLocaleString()}</span>
        </p>
      )}
      {fund.eligibility_notes && (
        <p className="text-xs text-gray-500 mt-1">{fund.eligibility_notes}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'mentor' | 'mentee' | null>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [needProfile, setNeedProfile] = useState<FinancialNeedProfile | null>(null);
  const [interests, setInterests] = useState<OpportunityInterest[]>([]);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);

  // Need profile form
  const [needForm, setNeedForm] = useState({
    pell_status: 'prefer_not_to_say' as 'yes' | 'no' | 'prefer_not_to_say',
    first_gen_student: 'prefer_not_to_say' as 'yes' | 'no' | 'prefer_not_to_say',
    need_based_aid: 'prefer_not_to_say' as 'yes' | 'no' | 'prefer_not_to_say',
    additional_context: '',
  });
  const [needSaving, setNeedSaving] = useState(false);
  const [needSaved, setNeedSaved] = useState(false);
  const [needError, setNeedError] = useState('');

  // Interest form
  const [interestForm, setInterestForm] = useState({
    category: '',
    description: '',
    estimated_amount: '',
    linked_mentorship_id: '',
  });
  const [interestSaving, setInterestSaving] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState(false);
  const [interestError, setInterestError] = useState('');

  const [showNeedForm, setShowNeedForm] = useState(false);
  const [showInterestForm, setShowInterestForm] = useState(false);

  const [userId, setUserId] = useState('');

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;
    setUserId(uid);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .single();
    setRole(profile?.role as 'mentor' | 'mentee' ?? null);

    const { data: fundsData } = await supabase
      .from('opportunity_funds')
      .select('id, name, description, sponsor_name, status, total_available, max_request_amount, allowed_categories, eligibility_notes')
      .order('created_at', { ascending: false });
    setFunds((fundsData ?? []) as Fund[]);

    if (profile?.role === 'mentee') {
      const [{ data: np }, { data: ints }, { data: ms }] = await Promise.all([
        supabase
          .from('financial_need_profiles')
          .select('pell_status, first_gen_student, need_based_aid, additional_context, verification_status, submitted_at')
          .eq('id', uid)
          .maybeSingle(),
        supabase
          .from('opportunity_interests')
          .select('id, category, description, estimated_amount, created_at')
          .eq('mentee_id', uid)
          .order('created_at', { ascending: false }),
        supabase
          .from('mentorships')
          .select('id, mentor_id')
          .eq('mentee_id', uid)
          .eq('status', 'active'),
      ]);

      if (np) {
        setNeedProfile(np as FinancialNeedProfile);
        setNeedForm({
          pell_status: np.pell_status,
          first_gen_student: np.first_gen_student,
          need_based_aid: np.need_based_aid,
          additional_context: np.additional_context ?? '',
        });
      }
      setInterests((ints ?? []) as OpportunityInterest[]);

      if (ms && ms.length > 0) {
        const partnerIds = ms.map((m) => m.mentor_id);
        const { data: partnerProfiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', partnerIds);
        const partnerMap = new Map(partnerProfiles?.map((p) => [p.id, `${p.first_name} ${p.last_name}`]) ?? []);
        setMentorships(ms.map((m) => ({ id: m.id, partnerName: partnerMap.get(m.mentor_id) ?? 'Mentor' })));
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveNeedProfile() {
    if (!userId) return;
    setNeedSaving(true);
    setNeedError('');
    const supabase = createClient();
    const payload = {
      id: userId,
      pell_status: needForm.pell_status,
      first_gen_student: needForm.first_gen_student,
      need_based_aid: needForm.need_based_aid,
      additional_context: needForm.additional_context.trim() || null,
      verification_status: 'self_reported',
      submitted_at: needProfile?.submitted_at ?? new Date().toISOString(),
    };
    const { error } = needProfile
      ? await supabase.from('financial_need_profiles').update(payload).eq('id', userId)
      : await supabase.from('financial_need_profiles').insert(payload);
    if (error) {
      setNeedError('Failed to save. Please try again.');
    } else {
      setNeedSaved(true);
      setTimeout(() => setNeedSaved(false), 3000);
      await load();
    }
    setNeedSaving(false);
  }

  async function submitInterest(e: React.FormEvent) {
    e.preventDefault();
    if (!interestForm.category || !interestForm.description.trim()) return;
    setInterestSaving(true);
    setInterestError('');
    const supabase = createClient();
    const { error } = await supabase.from('opportunity_interests').insert({
      mentee_id: userId,
      category: interestForm.category,
      description: interestForm.description.trim(),
      estimated_amount: interestForm.estimated_amount ? parseFloat(interestForm.estimated_amount) : null,
      linked_mentorship_id: interestForm.linked_mentorship_id || null,
    });
    if (error) {
      setInterestError('Failed to submit. Please try again.');
    } else {
      setInterestSuccess(true);
      setInterestForm({ category: '', description: '', estimated_amount: '', linked_mentorship_id: '' });
      setShowInterestForm(false);
      await load();
    }
    setInterestSaving(false);
  }

  const activeFunds = funds.filter((f) => f.status === 'active');
  const isMentee = role === 'mentee';

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-16">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-600">Pilot</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-navy-900 mb-3">Mentee Opportunity Fund</h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
          A mentor can show you the next step. The Opportunity Fund is being built to make sure financial
          barriers don&apos;t prevent you from taking it — covering targeted professional-development needs
          like attire, travel, networking, and career-development expenses for students with demonstrated financial need.
        </p>
        {!isMentee && (
          <div className="mt-4 p-4 bg-navy-50 border border-navy-100 rounded-xl text-sm text-navy-700">
            This program is designed for mentees with demonstrated financial need. As a mentor, you may be asked to endorse
            a mentee&apos;s request as developmentally relevant — you&apos;ll never see their financial details.
          </div>
        )}
      </div>

      {/* ── Funding status ──────────────────────────────────────────────────── */}
      <section aria-labelledby="funding-status-heading">
        <h2 id="funding-status-heading" className="text-sm font-semibold text-navy-900 mb-4">
          Current Programs
        </h2>
        {activeFunds.length === 0 ? (
          <PilotBanner />
        ) : (
          <div className="space-y-4">
            {activeFunds.map((f) => <FundCard key={f.id} fund={f} />)}
          </div>
        )}
        {funds.some((f) => f.status === 'pilot') && (
          <div className="mt-3 space-y-3">
            {funds.filter((f) => f.status === 'pilot').map((f) => <FundCard key={f.id} fund={f} />)}
          </div>
        )}
      </section>

      {/* ── Support categories ──────────────────────────────────────────────── */}
      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="text-sm font-semibold text-navy-900 mb-1">
          Potential Support Categories
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          These are the types of professional-development needs the fund is designed to address.
          Not every expense will qualify — eligibility depends on the specific fund and circumstances.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => <CategoryCard key={cat.key} cat={cat} />)}
        </div>
      </section>

      {/* ── Eligibility philosophy ──────────────────────────────────────────── */}
      <section aria-labelledby="eligibility-heading" className="bg-gray-50 rounded-2xl p-6">
        <h2 id="eligibility-heading" className="text-sm font-semibold text-navy-900 mb-3">
          How eligibility works
        </h2>
        <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
          <p>
            Eligibility for funded programs is intended for students with demonstrated financial need.
            Indicators may include Pell Grant receipt or eligibility, institutional need-based aid, first-generation
            status, and other approved designations — but Pell eligibility is not the only path.
          </p>
          <p>
            Mentee distinguishes between <strong className="text-navy-800">self-attested</strong> and{' '}
            <strong className="text-navy-800">verified</strong> information. Submitting a financial need profile
            marks it as self-reported. Verification processes — where applicable — will be defined when specific
            funded programs launch.
          </p>
          <p>
            Mentor endorsement, if requested, confirms developmental relevance only.
            A mentor endorsing your request is not approving a financial award and does not see your financial details.
          </p>
          <div className="flex items-start gap-2 mt-2 p-3 bg-white border border-gray-100 rounded-xl">
            <Info className="w-4 h-4 text-navy-500 flex-shrink-0 mt-0.5" />
            <p className="text-gray-500">
              All grant decisions are made by the Mentee team, not mentors or sponsors, to ensure fairness and prevent conflicts of interest.
            </p>
          </div>
        </div>
      </section>

      {/* ── Mentee-only sections ─────────────────────────────────────────────── */}
      {isMentee && (
        <>
          {/* Financial need profile */}
          <section aria-labelledby="need-profile-heading">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 id="need-profile-heading" className="text-sm font-semibold text-navy-900 mb-1">
                  Financial Need Profile
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Self-reported information used for eligibility when funded programs launch.
                  {' '}Your responses are private — mentors and other users cannot see them.
                </p>
              </div>
              {needProfile && (
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full flex-shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  Self-reported
                </span>
              )}
            </div>

            {needProfile && !showNeedForm ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <dt className="text-xs text-gray-400 mb-0.5">Pell Grant status</dt>
                    <dd className="font-medium text-navy-900 capitalize">{needProfile.pell_status.replace(/_/g, ' ')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400 mb-0.5">First-generation student</dt>
                    <dd className="font-medium text-navy-900 capitalize">{needProfile.first_gen_student.replace(/_/g, ' ')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400 mb-0.5">Receiving need-based aid</dt>
                    <dd className="font-medium text-navy-900 capitalize">{needProfile.need_based_aid.replace(/_/g, ' ')}</dd>
                  </div>
                </dl>
                {needProfile.additional_context && (
                  <p className="text-xs text-gray-600 mb-4 border-t border-gray-50 pt-4">{needProfile.additional_context}</p>
                )}
                <button
                  onClick={() => setShowNeedForm(true)}
                  className="text-xs text-navy-600 hover:text-navy-900 font-medium transition-colors"
                >
                  Update profile
                </button>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                {!needProfile && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      This profile is self-reported and will be marked as such. It is not automatically verified.
                      Verification processes will be introduced when funded programs launch.
                    </span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-navy-900 block mb-2">
                    Pell Grant recipient or eligible
                  </label>
                  <div className="flex gap-2">
                    {NEED_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNeedForm((f) => ({ ...f, pell_status: opt.value as 'yes' | 'no' | 'prefer_not_to_say' }))}
                        className={`flex-1 text-xs py-2 px-3 rounded-lg border font-medium transition-colors ${
                          needForm.pell_status === opt.value
                            ? 'border-navy-600 bg-navy-50 text-navy-900'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-navy-900 block mb-2">
                    First-generation college student
                  </label>
                  <div className="flex gap-2">
                    {NEED_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNeedForm((f) => ({ ...f, first_gen_student: opt.value as 'yes' | 'no' | 'prefer_not_to_say' }))}
                        className={`flex-1 text-xs py-2 px-3 rounded-lg border font-medium transition-colors ${
                          needForm.first_gen_student === opt.value
                            ? 'border-navy-600 bg-navy-50 text-navy-900'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-navy-900 block mb-2">
                    Currently receiving need-based financial aid
                  </label>
                  <div className="flex gap-2">
                    {NEED_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNeedForm((f) => ({ ...f, need_based_aid: opt.value as 'yes' | 'no' | 'prefer_not_to_say' }))}
                        className={`flex-1 text-xs py-2 px-3 rounded-lg border font-medium transition-colors ${
                          needForm.need_based_aid === opt.value
                            ? 'border-navy-600 bg-navy-50 text-navy-900'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-navy-900 block mb-1.5">
                    Additional context <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Other need-based scholarships, institutional aid designations, or relevant information.
                  </p>
                  <textarea
                    value={needForm.additional_context}
                    onChange={(e) => setNeedForm((f) => ({ ...f, additional_context: e.target.value }))}
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. QuestBridge Scholar, Gates Scholarship recipient, or institutional need designation"
                    className="w-full text-sm rounded-xl border border-gray-200 px-3.5 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy-600 placeholder:text-gray-400"
                  />
                </div>

                {needError && <p className="text-sm text-red-600">{needError}</p>}

                <div className="flex items-center gap-3 pt-1">
                  {needProfile && (
                    <button
                      type="button"
                      onClick={() => setShowNeedForm(false)}
                      className="text-sm text-gray-500 hover:text-navy-900 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={saveNeedProfile}
                    disabled={needSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 disabled:opacity-50 transition-colors"
                  >
                    {needSaving ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                    ) : needSaved ? (
                      <><CheckCircle className="w-4 h-4" /> Saved</>
                    ) : (
                      needProfile ? 'Update profile' : 'Save financial need profile'
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-gray-400">
                  Your responses are self-reported and will be labeled as such. This information is private to you.
                  It will not be shared with your mentor, other users, or sponsors.
                </p>
              </div>
            )}
          </section>

          {/* Interest expression */}
          <section aria-labelledby="interest-heading">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 id="interest-heading" className="text-sm font-semibold text-navy-900 mb-1">
                  Tell us what would help
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Not a funding application. This helps us understand what types of support would make the biggest
                  difference so we can prioritize which programs to launch first.
                </p>
              </div>
              {!showInterestForm && (
                <button
                  onClick={() => setShowInterestForm(true)}
                  className="flex-shrink-0 text-xs font-medium text-navy-600 hover:text-navy-900 border border-navy-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add
                </button>
              )}
            </div>

            {interestSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                Thank you — we&apos;ve noted what would help you.
              </div>
            )}

            {showInterestForm && (
              <form onSubmit={submitInterest} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 mb-4">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  This is not a funding application. Submitting this form does not guarantee any financial support.
                  It helps us understand demand before funded programs launch.
                </div>

                <div>
                  <label className="text-xs font-medium text-navy-900 block mb-2">Category</label>
                  <select
                    value={interestForm.category}
                    onChange={(e) => setInterestForm((f) => ({ ...f, category: e.target.value }))}
                    required
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-navy-900 block mb-1.5">
                    What would this support enable?
                  </label>
                  <textarea
                    value={interestForm.description}
                    onChange={(e) => setInterestForm((f) => ({ ...f, description: e.target.value }))}
                    required
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. I have a superday at Goldman next month but can't afford a suit. My mentor recommended I have professional attire for in-person interviews."
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy-600 placeholder:text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-navy-900 block mb-1.5">
                      Rough estimated amount <span className="text-gray-400 font-normal">(optional, in USD)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5000"
                      step="0.01"
                      value={interestForm.estimated_amount}
                      onChange={(e) => setInterestForm((f) => ({ ...f, estimated_amount: e.target.value }))}
                      placeholder="200"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy-600 placeholder:text-gray-400"
                    />
                  </div>

                  {mentorships.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-navy-900 block mb-1.5">
                        Related mentorship <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <select
                        value={interestForm.linked_mentorship_id}
                        onChange={(e) => setInterestForm((f) => ({ ...f, linked_mentorship_id: e.target.value }))}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy-600"
                      >
                        <option value="">None</option>
                        {mentorships.map((m) => (
                          <option key={m.id} value={m.id}>With {m.partnerName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {interestError && <p className="text-sm text-red-600">{interestError}</p>}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowInterestForm(false)}
                    className="text-sm text-gray-500 hover:text-navy-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={interestSaving || !interestForm.category || !interestForm.description.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 disabled:opacity-50 transition-colors"
                  >
                    {interestSaving
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                      : 'Submit interest'
                    }
                  </button>
                </div>
              </form>
            )}

            {/* Submitted interests */}
            {interests.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Your interest submissions</p>
                {interests.map((interest) => (
                  <div
                    key={interest.id}
                    className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-navy-700 mb-0.5">
                        {CATEGORY_LABELS[interest.category] ?? interest.category}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">{interest.description}</p>
                      {interest.estimated_amount && (
                        <p className="text-[11px] text-gray-400 mt-1">
                          Estimated: ${Number(interest.estimated_amount).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                      {new Date(interest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

    </div>
  );
}
