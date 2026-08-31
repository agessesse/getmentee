'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, MapPin, Building2, GraduationCap, Globe, CheckCircle, ArrowLeft, Bookmark, BookmarkCheck, Link as LinkIcon, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import RequestModal from '@/components/mentor/RequestModal';

interface MentorDetail {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  university: string | null;
  graduation_year: number | null;
  linkedin_url: string | null;
  mentor_profiles: {
    bio: string | null;
    expertise_tags: string[];
    years_experience: number;
    weekly_hours: number;
    rating: number;
    review_count: number;
    is_available: boolean;
    session_rate: number | null;
    goals: string[];
    timezone: string | null;
    company: string | null;
    title: string | null;
    industry: string | null;
    is_verified: boolean;
    is_founding_mentor: boolean;
    max_mentees: number;
    communication_preference: string | null;
    languages: string[];
  };
}

interface Review {
  id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
  reviewer: { first_name: string; last_name: string; avatar_url: string | null };
}

interface MatchInfo {
  score: number;
  reasons: string[];
}

function computeMatch(mentor: MentorDetail, mentee: {
  interest_tags: string[];
  industries_of_interest: string[];
  career_interests: string[];
  university: string | null;
} | null): MatchInfo {
  if (!mentee) return { score: 0, reasons: [] };
  let score = 0;
  const reasons: string[] = [];
  const mp = mentor.mentor_profiles;

  if (mp.industry && mentee.industries_of_interest.some((i) =>
    i.toLowerCase().includes(mp.industry!.toLowerCase()) || mp.industry!.toLowerCase().includes(i.toLowerCase())
  )) {
    score += 30;
    reasons.push(`Works in ${mp.industry}`);
  }

  const careerMatch = mentee.career_interests.some((ci) =>
    mp.expertise_tags.some((tag) => tag.toLowerCase().includes(ci.toLowerCase()) || ci.toLowerCase().includes(tag.toLowerCase()))
  );
  if (careerMatch) {
    score += 25;
    const matched = mentee.career_interests.find((ci) =>
      mp.expertise_tags.some((tag) => tag.toLowerCase().includes(ci.toLowerCase()) || ci.toLowerCase().includes(tag.toLowerCase()))
    );
    if (matched) reasons.push(`Specializes in ${matched}`);
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
  if (tagOverlap.length > 0 && !careerMatch) {
    reasons.push(`Covers ${tagOverlap[0]}`);
  }
  if (mp.is_available) score += 10;

  return { score: Math.min(score, 100), reasons: reasons.slice(0, 3) };
}

export default function MentorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [mentor, setMentor] = useState<MentorDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState<'mentor' | 'mentee'>('mentee');
  const [hasRequest, setHasRequest] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;
      setUserId(uid);

      const [mentorRes, profileRes, requestRes, reviewsRes, savedRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, headline, location, university, graduation_year, linkedin_url, mentor_profiles(*)')
          .eq('id', id)
          .single(),
        supabase.from('profiles').select('role').eq('id', uid).single(),
        supabase
          .from('mentorship_requests')
          .select('id')
          .eq('mentee_id', uid)
          .eq('mentor_id', id)
          .in('status', ['pending', 'approved'])
          .maybeSingle(),
        supabase
          .from('reviews')
          .select('id, rating, feedback, created_at, reviewer:reviewer_id(first_name, last_name, avatar_url)')
          .eq('reviewee_id', id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('saved_mentors')
          .select('id')
          .eq('user_id', uid)
          .eq('mentor_id', id)
          .maybeSingle(),
      ]);

      const mentorData = mentorRes.data as unknown as MentorDetail;
      setMentor(mentorData);
      setUserRole(profileRes.data?.role as 'mentor' | 'mentee');
      setHasRequest(!!requestRes.data);
      setReviews(reviewsRes.data as unknown as Review[] ?? []);
      setIsSaved(!!savedRes.data);

      // Compute match if mentee
      if (profileRes.data?.role === 'mentee' && mentorData) {
        const { data: mp } = await supabase
          .from('mentee_profiles')
          .select('interest_tags, industries_of_interest, career_interests')
          .eq('id', uid)
          .single();

        const { data: menteeProfile } = await supabase
          .from('profiles')
          .select('university')
          .eq('id', uid)
          .single();

        if (mp) {
          const match = computeMatch(mentorData, {
            ...mp,
            university: menteeProfile?.university ?? null,
          });
          setMatchInfo(match);
        }
      }

      setLoading(false);
    }
    load();
  }, [id]);

  const handleRequest = async (message: string, goals: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('mentorship_requests').insert({
      mentee_id: userId,
      mentor_id: id,
      message: message || null,
      goals: goals || null,
    });
    if (error) throw new Error(error.message);
    setHasRequest(true);
  };

  const handleSaveToggle = async () => {
    const supabase = createClient();
    if (isSaved) {
      await supabase.from('saved_mentors').delete().eq('user_id', userId).eq('mentor_id', id);
      setIsSaved(false);
    } else {
      await supabase.from('saved_mentors').insert({ user_id: userId, mentor_id: id });
      setIsSaved(true);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!mentor) return <p className="text-center py-24 text-gray-400">Mentor not found.</p>;

  const mp = mentor.mentor_profiles;
  const fullName = `${mentor.first_name} ${mentor.last_name}`;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : mp.rating;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link href="/discover" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Discover
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0">
            <Avatar src={mentor.avatar_url} name={fullName} size="xl" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-navy-900">{fullName}</h1>
                  {mp.is_verified && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                  {mp.is_founding_mentor && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      <Award className="w-3 h-3" />
                      Founding Mentor
                    </span>
                  )}
                </div>
                {mentor.headline && (
                  <p className="text-gray-600 mt-1 text-sm font-medium">{mentor.headline}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {userRole === 'mentee' && (
                  <button
                    onClick={handleSaveToggle}
                    className={`p-2 rounded-xl border transition-all ${
                      isSaved ? 'border-navy-200 bg-navy-50 text-navy-700' : 'border-gray-200 text-gray-400 hover:text-navy-700'
                    }`}
                    title={isSaved ? 'Unsave' : 'Save'}
                  >
                    {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                )}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${mp.is_available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {mp.is_available ? 'Available' : 'Not available'}
                </span>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              {mp.company && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {mp.title ? `${mp.title} at ${mp.company}` : mp.company}
                </span>
              )}
              {mentor.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {mentor.location}
                </span>
              )}
              {mentor.university && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  {mentor.university}{mentor.graduation_year ? ` '${String(mentor.graduation_year).slice(-2)}` : ''}
                </span>
              )}
              {mp.timezone && (
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {mp.timezone.replace('America/', '').replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-5 mt-4 py-4 border-t border-b border-gray-100">
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-lg font-bold text-navy-900">
                    {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{mp.review_count} reviews</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-navy-900">{mp.years_experience}</span>
                <p className="text-xs text-gray-400 mt-0.5">years exp</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-navy-900">{mp.weekly_hours}h</span>
                <p className="text-xs text-gray-400 mt-0.5">per week</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-navy-900">{mp.max_mentees}</span>
                <p className="text-xs text-gray-400 mt-0.5">max mentees</p>
              </div>
            </div>

            {/* CTA */}
            {userRole === 'mentee' && (
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  disabled={hasRequest || !mp.is_available}
                  className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    hasRequest
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : !mp.is_available
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-navy-900 text-white hover:bg-navy-800'
                  }`}
                >
                  {hasRequest ? '✓ Request Sent' : 'Request Mentorship'}
                </button>
                {mentor.linkedin_url && (
                  <a
                    href={mentor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-all"
                    title="LinkedIn"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </a>
                )}
                <span className="text-sm text-gray-400">
                  {mp.session_rate ? `$${mp.session_rate}/hr` : 'Free'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Match card */}
          {matchInfo && matchInfo.score > 0 && (
            <div className="bg-navy-900 text-white rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Why you match</h2>
                <span className="text-2xl font-bold">{matchInfo.score}%</span>
              </div>
              <div className="w-full h-2 bg-navy-700 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${matchInfo.score}%` }}
                />
              </div>
              {matchInfo.reasons.length > 0 && (
                <ul className="space-y-2">
                  {matchInfo.reasons.map((r) => (
                    <li key={r} className="flex items-center gap-2 text-sm text-navy-200">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Bio */}
          {mp.bio && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-navy-900 mb-3">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{mp.bio}</p>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-navy-900 mb-5">
              Reviews
              {mp.review_count > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">({mp.review_count})</span>
              )}
            </h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-400">No reviews yet. Be the first to review this mentor.</p>
            ) : (
              <div className="space-y-5">
                {reviews.map((r) => {
                  const reviewer = r.reviewer as unknown as { first_name: string; last_name: string; avatar_url: string | null };
                  return (
                    <div key={r.id} className="flex gap-4">
                      <Avatar
                        src={reviewer?.avatar_url ?? null}
                        name={reviewer ? `${reviewer.first_name} ${reviewer.last_name}` : 'User'}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-navy-900">
                            {reviewer ? `${reviewer.first_name} ${reviewer.last_name}` : 'Anonymous'}
                          </span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                        {r.feedback && (
                          <p className="text-sm text-gray-600 leading-relaxed">{r.feedback}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Expertise */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-navy-900 mb-3">Expertise</h3>
            <div className="flex flex-wrap gap-1.5">
              {mp.expertise_tags.map((tag) => (
                <span key={tag} className="text-xs bg-navy-50 text-navy-700 px-2.5 py-1 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Goals they help with */}
          {mp.goals.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-navy-900 mb-3">Goals I help with</h3>
              <ul className="space-y-2">
                {mp.goals.map((g) => (
                  <li key={g} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Session details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-navy-900 mb-3">Session details</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">Rate</span>
                <span className="font-medium">{mp.session_rate ? `$${mp.session_rate}/hr` : 'Free'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Availability</span>
                <span className="font-medium">{mp.weekly_hours}h/week</span>
              </div>
              {mp.communication_preference && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Format</span>
                  <span className="font-medium capitalize">{mp.communication_preference}</span>
                </div>
              )}
              {mp.languages.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Languages</span>
                  <span className="font-medium">{mp.languages.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <RequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mentor={{ id: mentor.id, firstName: mentor.first_name, lastName: mentor.last_name, avatarUrl: mentor.avatar_url }}
          onSubmit={handleRequest}
        />
      )}
    </div>
  );
}
