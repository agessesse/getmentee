import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Link as LinkIcon, MapPin, GraduationCap, Briefcase, Award, ExternalLink } from 'lucide-react';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';
import { getPersonBySlug, type SourcedProfile, type SourcedNearPeer } from '@/data/people';
import CtaButton from '@/components/marketing/CtaButton';

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
    <div className="bg-white rounded-xl border border-halo-rule p-6">
      <h2 className="font-ui text-sm font-semibold text-halo-heather uppercase tracking-[0.12em] mb-4">
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
          className="text-xs bg-halo-lav-wash text-halo-heather px-3 py-1.5 rounded-full font-medium"
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
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden flex-shrink-0 bg-halo-bone">
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
    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl flex-shrink-0 bg-halo-lav-wash flex items-center justify-center">
      <span className="text-3xl font-bold text-halo-purple-d">{initials}</span>
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
        href="/"
        className="tap-target inline-flex items-center gap-1.5 text-sm text-halo-heather hover:text-halo-ink transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to Mentable
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-xl border border-halo-rule p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <ProfileHeadshot image={person.image} name={fullName} initials={initials} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="font-display text-halo-ink leading-tight text-[1.9rem] sm:text-[2.2rem]">{fullName}</h1>
                {(person.title || person.organization) && (
                  <p className="text-halo-heather mt-1 text-sm font-medium">
                    {[person.title, person.organization].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              {/* Status badge — clear about sourced state */}
              <span className="inline-flex items-center text-xs font-medium text-halo-heather bg-halo-veil border border-halo-rule px-3 py-1.5 rounded-full flex-shrink-0">
                Profile preview
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-halo-heather">
              {person.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-halo-mist-body" aria-hidden="true" />
                  {person.location}
                </span>
              )}
              {person.education?.[0] && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-halo-mist-body" aria-hidden="true" />
                  {person.education[0].institution}
                </span>
              )}
            </div>

            {person.linkedInUrl && (
              <a
                href={person.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-halo-heather hover:text-halo-ink transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
              >
                <LinkIcon className="w-3.5 h-3.5" aria-hidden="true" />
                LinkedIn
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <Section title="Background">
        <p className="text-halo-heather leading-relaxed text-[15px] font-light">{person.bio}</p>
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
                <div className="w-8 h-8 rounded-xl bg-halo-veil flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-halo-mist-body" aria-hidden="true" />
                </div>
                <div>
                  {exp.title && (
                    <p className="text-sm font-semibold text-halo-ink">{exp.title}</p>
                  )}
                  <p className={`text-sm ${exp.title ? 'text-halo-mist-body' : 'font-semibold text-halo-ink'}`}>
                    {exp.organization}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-halo-heather mt-0.5">{exp.description}</p>
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
                <div className="w-8 h-8 rounded-xl bg-halo-veil flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-halo-mist-body" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-halo-ink">{edu.institution}</p>
                  {edu.degree && (
                    <p className="text-xs text-halo-heather">
                      {edu.degree}{edu.field ? `: ${edu.field}` : ''}
                    </p>
                  )}
                  {!edu.degree && edu.field && (
                    <p className="text-xs text-halo-heather">{edu.field}</p>
                  )}
                  {edu.years && <p className="text-xs text-halo-heather">{edu.years}</p>}
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
                <Award className="w-3.5 h-3.5 text-halo-lavender flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-halo-heather">{d}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/*
        This used to end on "X has been invited to join Mentable. Once active,
        you'll be able to connect directly." — a status update, and the last
        thing a warm visitor read on the page search engines send them to. The
        note still needs saying, so it stays; it just no longer stands alone.
      */}
      <div className="bg-halo-deep rounded-xl p-6 sm:p-8">
        <h2 className="font-display text-white text-[1.6rem] sm:text-[1.9rem] leading-tight mb-3">
          Find a mentor like {person.firstName}.
        </h2>
        <p className="text-halo-lavender text-[15px] font-light leading-relaxed max-w-md mb-6">
          {person.firstName} has been invited to join Mentable. Tell us what you
          are working toward and we will introduce you to someone who has done it.
        </p>
        <CtaButton href="/signup?role=mentee" size="md" ground="deep">
  Find your mentor
</CtaButton>
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
        href="/"
        className="tap-target inline-flex items-center gap-1.5 text-sm text-halo-heather hover:text-halo-ink transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to Mentable
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-xl border border-halo-rule p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <ProfileHeadshot image={person.image} name={fullName} initials={initials} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="font-display text-halo-ink leading-tight text-[1.9rem] sm:text-[2.2rem]">{fullName}</h1>
                {person.school && (
                  <p className="text-halo-heather mt-1 text-sm font-medium">{person.school}</p>
                )}
                {person.expectedGraduation && (
                  <p className="text-xs text-halo-heather mt-0.5">Class of {person.expectedGraduation}</p>
                )}
              </div>
              <span className="inline-flex items-center text-xs font-medium text-halo-purple-d bg-halo-lav-wash border border-halo-rule px-3 py-1.5 rounded-full flex-shrink-0">
                Near-peer
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-halo-heather">
              {person.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-halo-mist-body" aria-hidden="true" />
                  {person.location}
                </span>
              )}
            </div>

            {person.linkedInUrl && (
              <a
                href={person.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-halo-heather hover:text-halo-ink transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
              >
                <LinkIcon className="w-3.5 h-3.5" aria-hidden="true" />
                LinkedIn
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <Section title="About">
        <p className="text-halo-heather leading-relaxed text-[15px] font-light">{person.bio}</p>
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
                <div className="w-8 h-8 rounded-xl bg-halo-veil flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-halo-mist-body" aria-hidden="true" />
                </div>
                <div>
                  {exp.title && (
                    <p className="text-sm font-semibold text-halo-ink">{exp.title}</p>
                  )}
                  <p className={`text-sm ${exp.title ? 'text-halo-mist-body' : 'font-semibold text-halo-ink'}`}>
                    {exp.organization}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-halo-heather mt-0.5">{exp.description}</p>
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
                <div className="w-8 h-8 rounded-xl bg-halo-veil flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-halo-mist-body" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-halo-ink">{edu.institution}</p>
                  {edu.field && <p className="text-xs text-halo-heather">{edu.field}</p>}
                  {edu.years && <p className="text-xs text-halo-heather">{edu.years}</p>}
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
                <Award className="w-3.5 h-3.5 text-halo-lavender flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-halo-heather">{d}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/*
        A student's profile ended with no ask of any kind. The person reading it
        is most likely someone who could help, so the ask here is the mentor one.
      */}
      <div className="bg-halo-deep rounded-xl p-6 sm:p-8">
        <h2 className="font-display text-white text-[1.6rem] sm:text-[1.9rem] leading-tight mb-3">
          Someone did this for you.
        </h2>
        <p className="text-halo-lavender text-[15px] font-light leading-relaxed max-w-md mb-6">
          {person.firstName} is figuring out a path you have already walked. An
          hour a month is enough to change which doors they know about.
        </p>
        <CtaButton href="/signup?role=mentor" size="md" ground="deep">
  I want to mentor
</CtaButton>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// Every /people/<slug> page served the root layout's metadata verbatim, so all
// prerendered URLs shared one title and one description — a duplicate-title
// cluster in which none could rank for the person's own name.
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const result = getPersonBySlug(params.slug);
  if (!result) return { title: 'Profile not found' };

  const p = result.data;
  const name = `${p.firstName} ${p.lastName}`;
  const credential = 'credential' in p && p.credential ? `, ${p.credential}` : '';

  const role =
    result.type === 'mentor'
      ? ('headline' in p && p.headline) ||
        [p.title, p.organization].filter(Boolean).join(' at ') ||
        'Mentor'
      : [p.school, 'expectedGraduation' in p && p.expectedGraduation]
          .filter(Boolean)
          .join(' · ') || 'Mentee';

  const title = `${name}${credential}, ${role}`;
  const description = p.bio.length > 155 ? `${p.bio.slice(0, 152)}…` : p.bio;
  const canonical = `/people/${p.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: canonical,
      ...(p.image ? { images: [{ url: p.image }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(p.image ? { images: [p.image] } : {}),
    },
  };
}

export default function PersonPage({ params }: { params: { slug: string } }) {
  const result = getPersonBySlug(params.slug);
  if (!result) notFound();

  // These are the pages search engines actually send strangers to, and they
  // rendered with no header, no footer and no <main> — a person arriving from a
  // name search landed somewhere with one small grey link as the only exit.
  return (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1 px-6 lg:px-10 py-10 sm:py-14">
        {result.type === 'mentor' ? (
          <MentorProfileView person={result.data} />
        ) : (
          <NearPeerProfileView person={result.data} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
