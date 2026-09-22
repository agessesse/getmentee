'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { FEATURED_MENTORS, type Mentor } from '@/data/mentors';
import ProfilePreviewModal, { type PreviewTarget } from '@/components/marketing/ProfilePreviewModal';
import CarouselShell from '@/components/marketing/CarouselShell';
import ProfileCardShell from '@/components/marketing/ProfileCardShell';
import LogoChip from '@/components/ui/LogoChip';
import { companyFaviconUrl, schoolFaviconUrl } from '@/lib/logos';
import { trackLandingEvent } from '@/lib/landing-analytics';
import CtaButton from '@/components/marketing/CtaButton';
import CredibilityRail from '@/components/marketing/CredibilityRail';

function MentorCard({
  mentor,
  index,
  hovered,
  onHoverChange,
  interactive,
  onPreview,
}: {
  mentor: Mentor;
  index: number;
  hovered: boolean;
  onHoverChange: (h: boolean) => void;
  interactive: boolean;
  onPreview: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const showTitle = mentor.title !== '—';
  const showCompany = mentor.company !== '—';
  // Mirrors the mentee card, which carries school and employer chips under
  // the name. Mentors had the company as text only.
  // Some mentors' "company" is an institution rather than a firm — Travis
  // Melvin's is UNC Kenan-Flagler Business School — and those live in the
  // school map, not the company map. Fall back rather than showing nothing.
  const companyLogo = showCompany
    ? companyFaviconUrl(mentor.company) ?? schoolFaviconUrl(mentor.company)
    : null;

  return (
    <div
      className="flex-none w-[210px] sm:w-[228px] px-3"
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
    >
      <ProfileCardShell
        profileSlug={mentor.profileSlug}
        onPreview={onPreview}
        interactive={interactive}
        onHoverChange={onHoverChange}
        hovered={hovered}
        label={`View ${mentor.name}'s mentor profile`}
      >
        <div className="relative w-full aspect-[3/4] bg-halo-bone overflow-hidden rounded-xl mb-3 shadow-sm">
          {!imgError ? (
            <Image
              src={mentor.headshot}
              alt=""
              fill
              className="object-cover transition-all duration-700 ease-out"
              style={{
                objectPosition: mentor.imagePosition ?? '50% 20%',
                filter: hovered ? 'grayscale(0)' : 'grayscale(1)',
                transform: hovered ? 'scale(1.02)' : 'scale(1)',
              }}
              sizes="228px"
              priority={index < 4}
              loading={index < 4 ? undefined : 'lazy'}
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: mentor.accentColor }}
            >
              <span className="text-3xl font-bold text-white select-none">{mentor.initials}</span>
            </div>
          )}

          {/* Reveal: the reason to talk to this person, not their résumé */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-halo-black/95 via-halo-black/80 to-transparent px-3.5 pb-3.5 pt-9 motion-safe:transition-all motion-safe:duration-300"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <p className="font-ui text-[10px] font-semibold text-white/75 uppercase tracking-[0.12em] mb-1.5">
              Experience in
            </p>
            {(mentor.helpsWith ?? []).slice(0, 2).map((tag) => (
              <p key={tag} className="text-[12px] font-medium text-white leading-snug">
                {tag}
              </p>
            ))}
            <span className="inline-flex items-center gap-1 mt-2.5 text-[10px] font-semibold text-white">
              View mentor
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </span>
          </div>
        </div>

        {/* Fixed height keeps every card's baseline aligned regardless of title length */}
        <div className="px-0.5 h-[76px]">
          <p className="font-semibold text-halo-ink text-[14px] leading-tight line-clamp-1">{mentor.name}</p>
          {(showTitle || showCompany) && (
            <p className="text-[11px] text-halo-mist-body mt-1 leading-snug font-light line-clamp-2">
              {showTitle && mentor.title}
              {showTitle && showCompany && ' · '}
              {showCompany && <span className="text-halo-purple-d font-medium">{mentor.company}</span>}
            </p>
          )}
          {companyLogo && (
            <div className="flex items-center gap-1.5 mt-2">
              <LogoChip url={companyLogo} name={mentor.company} />
            </div>
          )}
        </div>
      </ProfileCardShell>
    </div>
  );
}

export default function MentorCarousel() {
  const [preview, setPreview] = useState<PreviewTarget | null>(null);

  return (
    <>
      <section className="py-16 sm:py-20 bg-halo-ivory" aria-labelledby="mentor-carousel-heading">
        <div className="px-6 lg:px-10"><div className="max-w-6xl mx-auto mb-9">
          <p className="font-ui text-[11px] font-semibold text-halo-purple-d uppercase tracking-[0.14em] mb-4">
            The people we&apos;re building this with
          </p>
          <h2
            id="mentor-carousel-heading"
            className="font-display text-halo-ink leading-[1.05]"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            People who learned it the hard way,<br className="hidden sm:block" />{' '}
            so the next person doesn&apos;t have to.
          </h2>

          {/*
            "Willing to teach" was a statement about these people's intentions
            that none of them has made to us. Every profile here is
            `status: 'sourced'` in data/people.ts — assembled from public
            information, with no account and no agreement to mentor through
            Mentable. The eyebrow and the note below now say what is true: this
            is the kind of experience we are building around, and we are in the
            middle of asking them.
          */}
          <p className="text-[13px] text-halo-mist-body leading-relaxed max-w-xl mt-5">
            These profiles are built from public information about people whose paths show
            the kind of experience worth passing on. They are not yet Mentable mentors, and
            appearing here isn&apos;t an endorsement of Mentable.
          </p>
        </div></div>

        {/*
          The proof for the claim above, inside the same section rather than
          floating in a bordered band of its own. Order is claim, proof, people.
        */}
        <CredibilityRail />

        <CarouselShell
          items={FEATURED_MENTORS}
          keyOf={(m) => m.name}
          // Rightward, matching CredibilityRail above it. The students section
          // mirrors this and drifts left, so the two rosters read as a pair
          // moving in opposite directions rather than an unexplained mix.
          idleDirection={1}
          frozen={preview !== null}
          label="Professionals whose experience shaped Mentable"
          renderItem={(mentor, { hovered, onHoverChange, interactive }) => (
            <MentorCard
              mentor={mentor}
              index={FEATURED_MENTORS.indexOf(mentor)}
              hovered={hovered}
              onHoverChange={onHoverChange}
              interactive={interactive}
              onPreview={() => {
                trackLandingEvent('mentor_card_opened', { name: mentor.name });
                setPreview({ kind: 'mentor', data: mentor });
              }}
            />
          )}
        />

        <div className="px-6 lg:px-10"><div className="max-w-6xl mx-auto mt-8">
          {/*
            Was "Meet the mentors" pointing at role=mentee. The section is about
            the people willing to teach, so the ask on it is the one that asks a
            reader to join them. It also gives the page a mentor-facing ask
            before the very last section, which previously carried the only one.
          */}
          <CtaButton
            href="/mentor"
            onClick={() => trackLandingEvent('founding_mentor_cta_clicked', { cta: 'mentor_carousel' })}
            variant="outline"
            size="md"
          >
            Become a founding mentor
          </CtaButton>
        </div></div>
      </section>

      <ProfilePreviewModal target={preview} onClose={() => setPreview(null)} />
    </>
  );
}
