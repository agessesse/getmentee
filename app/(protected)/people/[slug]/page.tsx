import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Link as LinkIcon, MapPin, GraduationCap, Briefcase, Award, ExternalLink } from 'lucide-react';
import { getPersonBySlug, type SourcedProfile, type SourcedNearPeer } from '@/data/people';

// ─── Static params (build-time) ───────────────────────────────────────────────

export function generateStaticParams() {
  const { SOURCED_MENTORS, SOURCED_NEAR_PEERS } = require('@/data/people');
  return [
    ...(SOURCED_MENTORS as SourcedProfile[]).map((p) => ({ slug: p.slug })),
    ...(SOURCED_NEAR_PEERS as SourcedNearPeer[]).map((p) => ({ slug: p.slug })),
  ];
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-[0.12em] mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="text-xs bg-navy-50 text-navy-700 px-3 py-1.5 rounded-full font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function ProfileHeadshot({
  image,
  name,
  initials,
}: {
  image: string | undefined;
  name: string;
  initials: string;
}) {
  if (image) {
    return (
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover object-top"
          sizes="(max-width: 640px) 112px, 144px"
          priority
        />
      </div>
    );
  }
  return (
    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl flex-shrink-0 bg-navy-100 flex items-center justify-center">
      <span className="text-3xl font-bold text-navy-600">{initials}</span>
    </div>
  );
}

// ─── Mentor profile view ──────────────────────────────────────────────────────

function MentorProfileView({ person }: { person: SourcedProfile }) {
  const fullName = `${person.firstName} ${person.lastName}${person.credential ? `, ${person.credential}` : ''}`;
  const initials = `${person.firstName[0]}${person.lastName[0]}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Discover
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <ProfileHeadshot image={person.image} name={fullName} initials={initials} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-navy-900 leading-tight">{fullName}</h1>
                {(person.title || person.organization) && (
                  <p className="text-gray-600 mt-1 text-sm font-medium">
                    {[person.title, person.organization].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              {/* Status badge — clear about sourced state */}
              <span className="inline-flex items-center text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full flex-shrink-0">
                Profile preview
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              {person.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {person.location}
                </span>
              )}
              {person.education?.[0] && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  {person.education[0].institution}
                </span>
              )}
            </div>

            {person.linkedInUrl && (
              <a
                href={person.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-navy-600 hover:text-navy-900 transition-colors"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                LinkedIn
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <Section title="Background">
        <p className="text-gray-700 leading-relaxed text-[15px] font-light">{person.bio}</p>
      </Section>

      {/* Expertise */}
      {person.expertiseTags.length > 0 && (
        <Section title="Areas of expertise">
          <TagList tags={person.expertiseTags} />
        </Section>
      )}

      {/* Experience */}
      {person.experience && person.experience.length > 0 && (
        <Section title="Experience">
          <div className="space-y-4">
            {person.experience.map((exp, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div>
                  {exp.title && (
                    <p className="text-sm font-semibold text-navy-900">{exp.title}</p>
                  )}
                  <p className={`text-sm ${exp.title ? 'text-gray-500' : 'font-semibold text-navy-900'}`}>
                    {exp.organization}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{exp.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {person.education && person.education.length > 0 && (
        <Section title="Education">
          <div className="space-y-3">
            {person.education.map((edu, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{edu.institution}</p>
                  {edu.degree && (
                    <p className="text-xs text-gray-500">
                      {edu.degree}{edu.field ? ` — ${edu.field}` : ''}
                    </p>
                  )}
                  {!edu.degree && edu.field && (
                    <p className="text-xs text-gray-500">{edu.field}</p>
                  )}
                  {edu.years && <p className="text-xs text-gray-400">{edu.years}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Distinctions */}
      {person.distinctions && person.distinctions.length > 0 && (
        <Section title="Distinctions & involvement">
          <div className="space-y-2">
            {person.distinctions.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <Award className="w-3.5 h-3.5 text-navy-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{d}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Invitation note */}
      <div className="bg-navy-50 rounded-2xl border border-navy-100 p-5 text-center">
        <p className="text-sm text-navy-700 font-light">
          {person.firstName} has been invited to join Mentee. Once active, you&apos;ll be able to
          connect directly through the platform.
        </p>
      </div>
    </div>
  );
}

// ─── Near-peer profile view ───────────────────────────────────────────────────

function NearPeerProfileView({ person }: { person: SourcedNearPeer }) {
  const fullName = `${person.firstName} ${person.lastName}`;
  const initials = `${person.firstName[0]}${person.lastName[0]}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Discover
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <ProfileHeadshot image={person.image} name={fullName} initials={initials} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-navy-900 leading-tight">{fullName}</h1>
                {person.school && (
                  <p className="text-gray-600 mt-1 text-sm font-medium">{person.school}</p>
                )}
                {person.expectedGraduation && (
                  <p className="text-xs text-gray-400 mt-0.5">Class of {person.expectedGraduation}</p>
                )}
              </div>
              <span className="inline-flex items-center text-xs font-medium text-navy-600 bg-navy-50 border border-navy-100 px-3 py-1.5 rounded-full flex-shrink-0">
                Near-peer
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              {person.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {person.location}
                </span>
              )}
            </div>

            {person.linkedInUrl && (
              <a
                href={person.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-navy-600 hover:text-navy-900 transition-colors"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                LinkedIn
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <Section title="About">
        <p className="text-gray-700 leading-relaxed text-[15px] font-light">{person.bio}</p>
      </Section>

      {/* Interests */}
      {person.interestTags.length > 0 && (
        <Section title="Interests & areas">
          <TagList tags={person.interestTags} />
        </Section>
      )}

      {/* Experience */}
      {person.experience && person.experience.length > 0 && (
        <Section title="Experience">
          <div className="space-y-4">
            {person.experience.map((exp, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div>
                  {exp.title && (
                    <p className="text-sm font-semibold text-navy-900">{exp.title}</p>
                  )}
                  <p className={`text-sm ${exp.title ? 'text-gray-500' : 'font-semibold text-navy-900'}`}>
                    {exp.organization}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{exp.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {person.education && person.education.length > 0 && (
        <Section title="Education">
          <div className="space-y-3">
            {person.education.map((edu, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{edu.institution}</p>
                  {edu.field && <p className="text-xs text-gray-500">{edu.field}</p>}
                  {edu.years && <p className="text-xs text-gray-400">{edu.years}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Distinctions */}
      {person.distinctions && person.distinctions.length > 0 && (
        <Section title="Distinctions & involvement">
          <div className="space-y-2">
            {person.distinctions.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <Award className="w-3.5 h-3.5 text-navy-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{d}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PersonPage({ params }: { params: { slug: string } }) {
  const result = getPersonBySlug(params.slug);
  if (!result) notFound();

  if (result.type === 'mentor') {
    return <MentorProfileView person={result.data} />;
  }
  return <NearPeerProfileView person={result.data} />;
}
