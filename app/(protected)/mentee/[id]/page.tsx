'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, MapPin, Briefcase, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';

interface MenteeDetail {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  university: string | null;
  graduation_year: number | null;
  linkedin_url: string | null;
  // mentee_profiles (only if caller has mentorship with this user)
  bio: string | null;
  interest_tags: string[];
  goals: string[];
  experience_level: string | null;
}

export default function MenteeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [mentee, setMentee] = useState<MenteeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [profileRes, menteeProfileRes] = await Promise.all([
        supabase
          .from('public_profiles')
          .select('id, first_name, last_name, avatar_url, headline, location, university, graduation_year, linkedin_url')
          .eq('id', id)
          .eq('role', 'mentee')
          .single(),
        supabase
          .from('mentee_profiles')
          .select('bio, interest_tags, goals, experience_level')
          .eq('id', id)
          .maybeSingle(),
      ]);

      if (!profileRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setMentee({
        ...profileRes.data,
        bio: menteeProfileRes.data?.bio ?? null,
        interest_tags: menteeProfileRes.data?.interest_tags ?? [],
        goals: menteeProfileRes.data?.goals ?? [],
        experience_level: menteeProfileRes.data?.experience_level ?? null,
      });
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (notFound || !mentee) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <p className="text-halo-mist-body">Mentee profile not found.</p>
        <Link href="/requests" className="mt-4 inline-block text-sm text-halo-purple-d hover:underline">Back to Requests</Link>
      </div>
    );
  }

  const fullName = `${mentee.first_name} ${mentee.last_name}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 text-sm text-halo-mist-body hover:text-halo-ink transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requests
        </Link>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-halo-rule p-6">
        <div className="flex items-start gap-5">
          <Avatar src={mentee.avatar_url} name={fullName} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-normal text-[1.75rem] leading-tight text-halo-ink">{fullName}</h1>
            {mentee.headline && (
              <p className="text-sm text-halo-mist-body mt-0.5">{mentee.headline}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-halo-mist-body">
              {mentee.university && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {mentee.university}{mentee.graduation_year ? ` · ${mentee.graduation_year}` : ''}
                </span>
              )}
              {mentee.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {mentee.location}
                </span>
              )}
              {mentee.experience_level && (
                <span className="flex items-center gap-1 capitalize">
                  <Briefcase className="w-3.5 h-3.5" />
                  {mentee.experience_level} level
                </span>
              )}
              {mentee.linkedin_url && (
                <a
                  href={mentee.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-halo-purple-d hover:text-halo-ink"
                >
                  <Globe className="w-3.5 h-3.5" />
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        {mentee.bio && (
          <p className="text-sm text-halo-heather leading-relaxed mt-5 pt-5 border-t border-halo-rule">
            {mentee.bio}
          </p>
        )}
      </div>

      {/* Goals */}
      {mentee.goals.length > 0 && (
        <div className="bg-white rounded-2xl border border-halo-rule p-6">
          <h2 className="font-display font-normal text-lg leading-tight text-halo-ink mb-3">Their goals</h2>
          <ul className="space-y-2">
            {mentee.goals.map((goal, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-halo-heather">
                <span className="w-1.5 h-1.5 rounded-full bg-halo-purple flex-shrink-0 mt-2" />
                {goal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interest tags */}
      {mentee.interest_tags.length > 0 && (
        <div className="bg-white rounded-2xl border border-halo-rule p-6">
          <h2 className="font-display font-normal text-lg leading-tight text-halo-ink mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {mentee.interest_tags.map((tag) => (
              <span key={tag} className="text-xs bg-halo-veil text-halo-purple-d px-3 py-1 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
