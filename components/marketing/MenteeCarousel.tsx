'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { SOURCED_NEAR_PEERS, type SourcedNearPeer } from '@/data/people';
import { companyFaviconUrl, schoolFaviconUrl } from '@/lib/logos';
import LogoChip from '@/components/ui/LogoChip';
import ProfilePreviewModal, { type PreviewTarget } from '@/components/marketing/ProfilePreviewModal';
import CarouselShell from '@/components/marketing/CarouselShell';
import ProfileCardShell from '@/components/marketing/ProfileCardShell';
import { trackLandingEvent } from '@/lib/landing-analytics';
import CtaButton from '@/components/marketing/CtaButton';

// Short school label for the card foot — full name lives in the profile modal.
function shortSchool(person: SourcedNearPeer): string | null {
  if (!person.school) return null;
  // Map known long names explicitly; a blind slice cut words in half.
  const MAP: Record<string, string> = {
    'UNC Kenan-Flagler Business School / University of North Carolina at Chapel Hill': 'UNC Kenan-Flagler',
    'UNC Kenan-Flagler Business School': 'UNC Kenan-Flagler',
    'University of North Carolina at Chapel Hill': 'UNC',
    'UC Berkeley — Haas School of Business': 'UC Berkeley · Haas',
    'University of Minnesota — Carlson School of Management': 'Minnesota · Carlson',
    'London School of Economics and Political Science': 'LSE',
    'University of Pennsylvania': 'UPenn',
    'University of New Hampshire': 'New Hampshire',
  };
  return MAP[person.school] ?? person.school.replace('University of ', '');
}

function MenteeCard({
  person,
  index,
  hovered,
  onHoverChange,
  interactive,
  onPreview,
}: {
  person: SourcedNearPeer;
  index: number;
  hovered: boolean;
  onHoverChange: (h: boolean) => void;
  interactive: boolean;
  onPreview: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const fullName = `${person.firstName} ${person.lastName}`;
  const initials = `${person.firstName[0]}${person.lastName[0]}`;
  const school = shortSchool(person);
  const gradYear = person.expectedGraduation ? `’${person.expectedGraduation.slice(-2)}` : null;
  const org = person.experience?.[0]?.organization;
  const logo = org ? companyFaviconUrl(org) : null;
  const schoolLogo = person.school ? schoolFaviconUrl(person.school) : null;

  return (
    <div
      className="flex-none w-[210px] sm:w-[228px] px-3"
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
    >
      <ProfileCardShell
        profileSlug={person.slug}
        onPreview={onPreview}
        interactive={interactive}
        onHoverChange={onHoverChange}
        hovered={hovered}
        label={`View ${fullName}'s profile`}
      >
        <div className="relative w-full aspect-[3/4] bg-halo-bone overflow-hidden rounded-xl mb-3 shadow-sm">
          {person.image && !imgError ? (
            <Image
              src={person.image}
              alt=""
              fill
              className="object-cover transition-all duration-700 ease-out"
              style={{
                objectPosition: person.portraitPosition ?? '50% 20%',
                filter: hovered ? 'grayscale(0)' : 'grayscale(1)',
                transform: hovered ? 'scale(1.02)' : 'scale(1)',
              }}
              sizes="228px"
              priority={index < 4}
              loading={index < 4 ? undefined : 'lazy'}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-halo-black">
              <span className="text-3xl font-bold text-white select-none">{initials}</span>
            </div>
          )}

          {/* Mirror of the mentor card: what they want to learn, not what they've done */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-halo-black/95 via-halo-black/80 to-transparent px-3.5 pb-3.5 pt-9 motion-safe:transition-all motion-safe:duration-300"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <p className="font-ui text-[10px] font-semibold text-white/75 uppercase tracking-[0.18em] mb-1.5">
              Learning about
            </p>
            {person.interestTags.slice(0, 2).map((tag) => (
              <p key={tag} className="text-[12px] font-medium text-white leading-snug">
                {tag}
              </p>
            ))}
            <span className="inline-flex items-center gap-1 mt-2.5 text-[10px] font-semibold text-white">
              View profile
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </span>
          </div>
        </div>

        {/* Fixed height keeps every card's baseline aligned regardless of name length */}
        <div className="px-0.5 h-[52px]">
          <p className="font-semibold text-halo-ink text-[14px] leading-tight line-clamp-1">{fullName}</p>
          <p className="text-[11px] text-halo-mist-body mt-1 font-light">
            {school}
            {school && gradYear && ' · '}
            {gradYear}
          </p>
          {(schoolLogo || logo) && (
            <div className="flex items-center gap-1.5 mt-2">
              {schoolLogo && <LogoChip url={schoolLogo} name={person.school ?? ''} />}
              {logo && org && <LogoChip url={logo} name={org} />}
            </div>
          )}
        </div>
      </ProfileCardShell>
    </div>
  );
}

export default function MenteeCarousel() {
  const [preview, setPreview] = useState<PreviewTarget | null>(null);

  return (
    <>
      <section className="py-16 sm:py-20 bg-halo-ivory border-t border-halo-rule" aria-labelledby="mentees-heading">
        <div className="px-6 lg:px-10"><div className="max-w-6xl mx-auto mb-9">
          <p className="font-ui text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.22em] mb-4">
            Ready to learn
          </p>
          <h2
            id="mentees-heading"
            className="font-display text-halo-ink leading-[1.05]"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            Students who come prepared<br className="hidden sm:block" />{' '}
            and follow through.
          </h2>
        </div></div>

        <CarouselShell
          items={SOURCED_NEAR_PEERS}
          keyOf={(p) => p.slug}
          idleDirection={-1}
          frozen={preview !== null}
          label="Students on Mentable"
          renderItem={(person, { hovered, onHoverChange, interactive }) => (
            <MenteeCard
              person={person}
              index={SOURCED_NEAR_PEERS.indexOf(person)}
              hovered={hovered}
              onHoverChange={onHoverChange}
              interactive={interactive}
              onPreview={() => {
                trackLandingEvent('mentee_card_opened', { slug: person.slug });
                setPreview({ kind: 'mentee', data: person });
              }}
            />
          )}
        />

        <div className="px-6 lg:px-10"><div className="max-w-6xl mx-auto mt-8">
          <CtaButton
            href="/signup?role=mentee"
            onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'create_your_profile' })}
            variant="secondary"
            size="md"
          >
            Create your profile
          </CtaButton>
        </div></div>
      </section>

      <ProfilePreviewModal target={preview} onClose={() => setPreview(null)} />
    </>
  );
}
