'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import RequestModal from '@/components/mentor/RequestModal';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import {
  Search, Star, Clock, MapPin, Building2, Bookmark, BookmarkCheck,
  ChevronDown, SlidersHorizontal, X, GraduationCap, Users,
} from 'lucide-react';
import { SOURCED_MENTORS, SOURCED_NEAR_PEERS, type SourcedProfile, type SourcedNearPeer } from '@/data/people';

// ─── Filter taxonomy ──────────────────────────────────────────────────────────

const INDUSTRIES = [
  'Investment Banking',
  'Private Equity',
  'Venture Capital',
  'Consulting',
  'Technology',
  'Real Estate',
  'Banking',
  'Law',
  'Entrepreneurship',
  'Investment Management',
  'Nonprofit',
  'Social Impact',
];

const EXPERTISE = [
  'LBO Modeling', 'Financial Modeling', 'M&A', 'Case Interviews', 'PE Recruiting',
  'PM Recruiting', 'Software Engineering', 'FAANG Interviews', 'Venture Capital',
  'Fundraising', 'Recruiting', 'Career Planning',
  'Fixed Income', 'Commercial Real Estate', 'Artificial Intelligence',
  'Leadership', 'Public Policy', 'Nonprofit Leadership',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenteeProfile {
  interest_tags: string[];
  goals: string[];
  industries_of_interest: string[];
  career_interests: string[];
  university: string | null;
  experience_level: string | null;
}

interface LiveMentorData {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  university: string | null;
  mentor_profiles: {
    bio: string | null;
    expertise_tags: string[];
    years_experience: number;
    weekly_hours: number;
    rating: number;
    review_count: number;
    is_available: boolean;
    session_rate: number | null;
    company: string | null;
    title: string | null;
    industry: string | null;
    is_verified: boolean;
  };
  matchScore: number;
  matchReasons: string[];
  saved: boolean;
}

// ─── Match scoring (live mentors only) ───────────────────────────────────────

function computeMatch(
  mentor: Omit<LiveMentorData, 'matchScore' | 'matchReasons' | 'saved'>,
  mentee: MenteeProfile | null
): { score: number; reasons: string[] } {
  if (!mentee) return { score: 0, reasons: [] };
  let score = 0;
  const reasons: string[] = [];
  const mp = mentor.mentor_profiles;

  if (mp.industry && mentee.industries_of_interest.some(
    (i) => i.toLowerCase().includes(mp.industry!.toLowerCase()) || mp.industry!.toLowerCase().includes(i.toLowerCase())
  )) {
    score += 30;
    reasons.push(`Works in ${mp.industry}`);
  }

  const careerMatch = mentee.career_interests.some((ci) =>
    mp.expertise_tags.some((tag) => tag.toLowerCase().includes(ci.toLowerCase()) || ci.toLowerCase().includes(tag.toLowerCase()))
  );
  if (careerMatch) {
    score += 25;
    const matchedInterest = mentee.career_interests.find((ci) =>
      mp.expertise_tags.some((tag) => tag.toLowerCase().includes(ci.toLowerCase()) || ci.toLowerCase().includes(tag.toLowerCase()))
    );
    if (matchedInterest) reasons.push(`Specializes in ${matchedInterest}`);
  }

  if (mentor.university && mentee.university &&
    mentor.university.toLowerCase().includes(mentee.university.split(' ')[0].toLowerCase())) {
    score += 20;
    reasons.push(`${mentor.university} alum`);
  }

  const tagOverlap = mentee.interest_tags.filter((t) =>
    mp.expertise_tags.some((et) => et.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(et.toLowerCase()))
  );
  score += Math.min(tagOverlap.length * 5, 15);
  if (tagOverlap.length > 0 && !careerMatch) reasons.push(`Covers ${tagOverlap[0]}`);
  if (mp.is_available) score += 10;

  return { score: Math.min(score, 100), reasons: reasons.slice(0, 3) };
}

// ─── Sourced mentor card ──────────────────────────────────────────────────────

function SourcedMentorCard({ person }: { person: SourcedProfile }) {
  const fullName = `${person.firstName} ${person.lastName}${person.credential ? `, ${person.credential}` : ''}`;
  const initials = `${person.firstName[0]}${person.lastName[0]}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:border-navy-200 hover:shadow-sm transition-all flex flex-col">
      <div className="p-5 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-navy-100">
            {person.image ? (
              <Image
                src={person.image}
                alt={fullName}
                fill
                className="object-cover object-top"
                sizes="40px"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-navy-600">
                {initials}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/people/${person.slug}`}
              className="text-sm font-semibold text-navy-900 hover:text-navy-600 transition-colors block truncate"
            >
              {fullName}
            </Link>
            {(person.title || person.organization) && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {[person.title, person.organization].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <span className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
            Preview
          </span>
        </div>

        {/* Bio snippet */}
        {person.bio && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{person.bio}</p>
        )}

        {/* Location */}
        {person.location && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
            <MapPin className="w-3 h-3" />
            <span>{person.location.split(',')[0]}</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {person.expertiseTags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {person.expertiseTags.length > 4 && (
            <span className="text-xs text-gray-400 px-1">+{person.expertiseTags.length - 4}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-gray-50 flex gap-2">
        <Link
          href={`/people/${person.slug}`}
          className="flex-1 text-center py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-navy-300 hover:text-navy-900 transition-all"
        >
          View profile
        </Link>
        <div className="flex-1 flex items-center justify-center py-2 rounded-xl bg-gray-50 text-xs font-medium text-gray-400 cursor-default">
          Invitation pending
        </div>
      </div>
    </div>
  );
}

// ─── Near-peer card ───────────────────────────────────────────────────────────

function NearPeerCard({ person }: { person: SourcedNearPeer }) {
  const fullName = `${person.firstName} ${person.lastName}`;
  const initials = `${person.firstName[0]}${person.lastName[0]}`;

  return (
    <Link
      href={`/people/${person.slug}`}
      className="bg-white rounded-2xl border border-gray-100 hover:border-navy-200 hover:shadow-sm transition-all p-5 flex items-start gap-4"
    >
      <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-navy-100">
        {person.image ? (
          <Image
            src={person.image}
            alt={fullName}
            fill
            className="object-cover object-top"
            sizes="44px"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-navy-600">
            {initials}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy-900 truncate">{fullName}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{person.school}</p>
        {person.expectedGraduation && (
          <p className="text-xs text-gray-400">Class of {person.expectedGraduation}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {person.interestTags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] bg-navy-50 text-navy-600 px-2 py-0.5 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ─── Live mentor card ─────────────────────────────────────────────────────────

function LiveMentorCard({
  mentor,
  hasRequest,
  isSaved,
  showMatch,
  onRequest,
  onSaveToggle,
}: {
  mentor: LiveMentorData;
  hasRequest: boolean;
  isSaved: boolean;
  showMatch: boolean;
  onRequest: () => void;
  onSaveToggle: () => void;
}) {
  const mp = mentor.mentor_profiles;
  const fullName = `${mentor.first_name} ${mentor.last_name}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:border-navy-200 hover:shadow-sm transition-all flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar src={mentor.avatar_url} name={fullName} size="md" />
            <div className="min-w-0">
              <Link
                href={`/mentor/${mentor.id}`}
                className="text-sm font-semibold text-navy-900 hover:text-navy-600 transition-colors block truncate"
              >
                {fullName}
              </Link>
              {mp?.title && mp?.company && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {mp.title} · {mp.company}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onSaveToggle}
            className={`p-1.5 rounded-lg transition-colors ${isSaved ? 'text-navy-600' : 'text-gray-300 hover:text-gray-500'}`}
            title={isSaved ? 'Unsave' : 'Save'}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {showMatch && mentor.matchScore > 0 && (
          <div className="mb-3 p-2.5 bg-navy-50 rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-navy-700">{mentor.matchScore}% match</span>
              {mp?.is_available && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Available</span>
              )}
            </div>
            <div className="w-full h-1.5 bg-navy-100 rounded-full overflow-hidden">
              <div className="h-full bg-navy-600 rounded-full" style={{ width: `${mentor.matchScore}%` }} />
            </div>
            {mentor.matchReasons.length > 0 && (
              <p className="text-xs text-navy-600 mt-1.5">{mentor.matchReasons.join(' · ')}</p>
            )}
          </div>
        )}

        {mp?.bio && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{mp.bio}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3">
          {mp?.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {mp.rating.toFixed(1)} ({mp.review_count})
            </span>
          )}
          {mp?.years_experience > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {mp.years_experience}y exp
            </span>
          )}
          {mentor.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {mentor.location.split(',')[0]}
            </span>
          )}
          {mp?.company && !mp?.title && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {mp.company}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {mp?.expertise_tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {(mp?.expertise_tags?.length ?? 0) > 3 && (
            <span className="text-xs text-gray-400 px-1">+{mp.expertise_tags.length - 3}</span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-gray-50 flex gap-2">
        <Link
          href={`/mentor/${mentor.id}`}
          className="flex-1 text-center py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-navy-300 hover:text-navy-900 transition-all"
        >
          View profile
        </Link>
        <button
          onClick={onRequest}
          disabled={hasRequest || !mp?.is_available}
          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
            hasRequest
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : !mp?.is_available
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-navy-900 text-white hover:bg-navy-800'
          }`}
        >
          {hasRequest ? 'Requested' : !mp?.is_available ? 'Unavailable' : 'Request'}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [liveMentors, setLiveMentors] = useState<LiveMentorData[]>([]);
  const [existingRequests, setExistingRequests] = useState<Set<string>>(new Set());
  const [savedMentors, setSavedMentors] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [menteeProfile, setMenteeProfile] = useState<MenteeProfile | null>(null);

  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [sort, setSort] = useState<'match' | 'rating' | 'experience'>('match');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [modalMentor, setModalMentor] = useState<LiveMentorData | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const uid = session.user.id;
    setUserId(uid);

    const { data: mp } = await supabase
      .from('mentee_profiles')
      .select('interest_tags, goals, industries_of_interest, career_interests')
      .eq('id', uid)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('university, role')
      .eq('id', uid)
      .single();

    const menteeProf: MenteeProfile | null = mp
      ? { ...mp, university: profile?.university ?? null, experience_level: null }
      : null;

    setMenteeProfile(menteeProf);

    if (profile?.role === 'mentor') return;

    const { data } = await supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, avatar_url, headline, location, university,
        mentor_profiles (
          bio, expertise_tags, years_experience, weekly_hours,
          rating, review_count, is_available, session_rate,
          company, title, industry, is_verified
        )
      `)
      .eq('role', 'mentor')
      .not('mentor_profiles', 'is', null);

    const { data: reqData } = await supabase
      .from('mentorship_requests')
      .select('mentor_id')
      .eq('mentee_id', uid)
      .in('status', ['pending', 'approved']);

    const { data: savedData } = await supabase
      .from('saved_mentors')
      .select('mentor_id')
      .eq('user_id', uid);

    setExistingRequests(new Set(reqData?.map((r) => r.mentor_id) ?? []));
    setSavedMentors(new Set(savedData?.map((s) => s.mentor_id) ?? []));

    type RawMentor = typeof data extends (infer R)[] | null ? R : never;
    const results: LiveMentorData[] = ((data as RawMentor[]) ?? []).map((m) => {
      const mentorBase = {
        id: m.id as string,
        first_name: m.first_name as string,
        last_name: m.last_name as string,
        avatar_url: m.avatar_url as string | null,
        headline: m.headline as string | null,
        location: m.location as string | null,
        university: m.university as string | null,
        mentor_profiles: m.mentor_profiles as unknown as LiveMentorData['mentor_profiles'],
      };
      const { score, reasons } = computeMatch(mentorBase, menteeProf);
      return {
        ...mentorBase,
        matchScore: score,
        matchReasons: reasons,
        saved: savedData?.some((s) => s.mentor_id === m.id) ?? false,
      };
    });

    setLiveMentors(results);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filter sourced mentors by search ────────────────────────────────────────
  const filteredSourcedMentors = SOURCED_MENTORS.filter((m) => {
    if (availableOnly) return false; // sourced = not yet available
    if (selectedIndustry) {
      const inTags = m.expertiseTags.some((t) =>
        t.toLowerCase().includes(selectedIndustry.toLowerCase())
      );
      if (!inTags) return false;
    }
    if (selectedExpertise.length > 0) {
      const hasAll = selectedExpertise.every((e) =>
        m.expertiseTags.some((t) => t.toLowerCase().includes(e.toLowerCase()))
      );
      if (!hasAll) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.organization?.toLowerCase().includes(q) ||
        m.expertiseTags.some((t) => t.toLowerCase().includes(q)) ||
        m.bio.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Filter near-peers by search ─────────────────────────────────────────────
  const filteredNearPeers = SOURCED_NEAR_PEERS.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.school.toLowerCase().includes(q) ||
      p.interestTags.some((t) => t.toLowerCase().includes(q)) ||
      p.bio.toLowerCase().includes(q)
    );
  });

  // ── Filter + sort live mentors ──────────────────────────────────────────────
  const filteredLiveMentors = liveMentors
    .filter((m) => {
      if (availableOnly && !m.mentor_profiles?.is_available) return false;
      if (selectedIndustry && m.mentor_profiles?.industry !== selectedIndustry) return false;
      if (selectedExpertise.length > 0 &&
        !selectedExpertise.every((e) => m.mentor_profiles?.expertise_tags?.includes(e))) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.first_name.toLowerCase().includes(q) ||
          m.last_name.toLowerCase().includes(q) ||
          m.mentor_profiles?.company?.toLowerCase().includes(q) ||
          m.mentor_profiles?.industry?.toLowerCase().includes(q) ||
          m.mentor_profiles?.expertise_tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === 'match') return b.matchScore - a.matchScore;
      if (sort === 'rating') return (b.mentor_profiles?.rating ?? 0) - (a.mentor_profiles?.rating ?? 0);
      if (sort === 'experience') return (b.mentor_profiles?.years_experience ?? 0) - (a.mentor_profiles?.years_experience ?? 0);
      return 0;
    });

  const handleSaveToggle = async (mentorId: string) => {
    const supabase = createClient();
    const isSaved = savedMentors.has(mentorId);
    if (isSaved) {
      await supabase.from('saved_mentors').delete().eq('user_id', userId).eq('mentor_id', mentorId);
      setSavedMentors((prev) => { const s = new Set(prev); s.delete(mentorId); return s; });
    } else {
      await supabase.from('saved_mentors').insert({ user_id: userId, mentor_id: mentorId });
      setSavedMentors((prev) => new Set([...prev, mentorId]));
    }
  };

  const handleRequest = async (message: string, goals: string) => {
    if (!modalMentor) return;
    const supabase = createClient();
    const { error } = await supabase.from('mentorship_requests').insert({
      mentee_id: userId,
      mentor_id: modalMentor.id,
      message: message || null,
      goals: goals || null,
    });
    if (error) throw new Error(error.message);
    setExistingRequests((prev) => new Set([...prev, modalMentor.id]));
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedIndustry('');
    setSelectedExpertise([]);
    setAvailableOnly(false);
    setSort('match');
  };

  const activeFilterCount =
    (selectedIndustry ? 1 : 0) + selectedExpertise.length + (availableOnly ? 1 : 0);

  const totalMentorCount = filteredLiveMentors.length + filteredSourcedMentors.length;

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Discover Mentors</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {totalMentorCount} mentor{totalMentorCount !== 1 ? 's' : ''}
            {menteeProfile ? ' · sorted by match' : ''}
          </p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, firm, skill, or interest…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent"
          />
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showFilters || activeFilterCount > 0
              ? 'border-navy-600 bg-navy-50 text-navy-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-navy-600 text-white text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy-600 cursor-pointer"
          >
            <option value="match">Best match</option>
            <option value="rating">Top rated</option>
            <option value="experience">Most experience</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Industry
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
              >
                <option value="">All industries</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Expertise
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE.map((exp) => (
                  <button
                    key={exp}
                    onClick={() => setSelectedExpertise((prev) =>
                      prev.includes(exp) ? prev.filter((e) => e !== exp) : [...prev, exp]
                    )}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      selectedExpertise.includes(exp)
                        ? 'bg-navy-900 border-navy-900 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-navy-300'
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-gray-300 text-navy-600 focus:ring-navy-600"
              />
              <span className="text-sm text-gray-700">Active members only</span>
            </label>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-navy-900 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Live mentors (Supabase-backed, can receive requests) ─────────────── */}
      {filteredLiveMentors.length > 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredLiveMentors.map((mentor) => (
              <LiveMentorCard
                key={mentor.id}
                mentor={mentor}
                hasRequest={existingRequests.has(mentor.id)}
                isSaved={savedMentors.has(mentor.id)}
                showMatch={sort === 'match' && mentor.matchScore > 0}
                onRequest={() => setModalMentor(mentor)}
                onSaveToggle={() => handleSaveToggle(mentor.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Sourced mentor profiles ───────────────────────────────────────────── */}
      {filteredSourcedMentors.length > 0 && (
        <div>
          {filteredLiveMentors.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gray-100" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Invited mentors
              </p>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSourcedMentors.map((mentor) => (
              <SourcedMentorCard key={mentor.slug} person={mentor} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredLiveMentors.length === 0 && filteredSourcedMentors.length === 0 && (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <p className="text-lg font-medium text-navy-900 mb-2">No mentors found</p>
          <p className="text-sm text-gray-400 mb-4">Try adjusting your search or filters.</p>
          <button onClick={clearFilters} className="text-sm text-navy-600 font-medium hover:underline">
            Clear all filters
          </button>
        </div>
      )}

      {/* ── Near-peer community section ───────────────────────────────────────── */}
      {filteredNearPeers.length > 0 && (
        <div className="pt-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-navy-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-navy-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy-900">Near-peer network</h2>
              <p className="text-xs text-gray-400">
                Students and early-career peers shaping their paths.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredNearPeers.map((peer) => (
              <NearPeerCard key={peer.slug} person={peer} />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-gray-300" />
            <p className="text-xs text-gray-400">
              Near-peers may both seek and offer mentorship as the platform grows.
            </p>
          </div>
        </div>
      )}

      {/* Request modal (live mentors only) */}
      {modalMentor && (
        <RequestModal
          open={!!modalMentor}
          onClose={() => setModalMentor(null)}
          mentor={{
            id: modalMentor.id,
            firstName: modalMentor.first_name,
            lastName: modalMentor.last_name,
            avatarUrl: modalMentor.avatar_url,
          }}
          onSubmit={handleRequest}
        />
      )}
    </div>
  );
}
