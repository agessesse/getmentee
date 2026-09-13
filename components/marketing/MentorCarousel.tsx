'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FEATURED_MENTORS, type Mentor } from '@/data/mentors';
import ProfilePreviewModal, { type PreviewTarget } from '@/components/marketing/ProfilePreviewModal';
import CarouselShell from '@/components/marketing/CarouselShell';
import { trackLandingEvent } from '@/lib/landing-analytics';

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

  return (
    <div
      className="flex-none w-[210px] sm:w-[228px] px-3"
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
    >
      <button
        onClick={onPreview}
        tabIndex={interactive ? 0 : -1}
        onFocus={() => interactive && onHoverChange(true)}
        onBlur={() => interactive && onHoverChange(false)}
        className="block w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded-2xl motion-safe:transition-transform motion-safe:duration-300"
        style={{ transform: hovered ? 'translateY(-6px) scale(1.045)' : 'none' }}
        aria-label={`View ${mentor.name}'s mentor profile`}
      >
        <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden rounded-2xl mb-3 shadow-sm">
          {!imgError ? (
            <Image
              src={mentor.headshot}
              alt=""
              fill
              className="object-cover transition-all duration-700 ease-out"
              style={{
                objectPosition: mentor.imagePosition ?? '50% 20%',
                filter: hovered ? 'grayscale(0)' : 'grayscale(1)',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
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
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-900/95 via-navy-900/80 to-transparent px-3.5 pb-3.5 pt-9 motion-safe:transition-all motion-safe:duration-300"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <p className="text-[8.5px] font-bold text-white/60 uppercase tracking-[0.2em] mb-1.5">
              Can help with
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
        <div className="px-0.5 h-[52px]">
          <p className="font-semibold text-navy-900 text-[14px] leading-tight line-clamp-1">{mentor.name}</p>
          {(showTitle || showCompany) && (
            <p className="text-[11px] text-gray-400 mt-1 leading-snug font-light line-clamp-2">
              {showTitle && mentor.title}
              {showTitle && showCompany && ' · '}
              {showCompany && <span className="text-navy-500 font-medium">{mentor.company}</span>}
            </p>
          )}
        </div>
      </button>
    </div>
  );
}

export default function MentorCarousel() {
  const [preview, setPreview] = useState<PreviewTarget | null>(null);

  return (
    <>
      <section className="py-14 sm:py-16 bg-cream-50" aria-labelledby="mentor-carousel-heading">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 mb-9">
          <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-4">
            Who you could learn from
          </p>
          <h2
            id="mentor-carousel-heading"
            className="font-serif text-navy-900 leading-[1.05]"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            People who walked it first —<br className="hidden sm:block" />{' '}
            and chose to come back.
          </h2>
        </div>

        <CarouselShell
          items={FEATURED_MENTORS}
          keyOf={(m) => m.name}
          idleDirection={-1}
          frozen={preview !== null}
          label="Mentors on Mentable"
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

        <div className="max-w-6xl mx-auto px-6 lg:px-10 mt-8">
          <Link
            href="/signup"
            onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'see_who_you_could_learn_from' })}
            className="group inline-flex items-center gap-2 text-[15px] font-medium text-navy-700 hover:text-navy-900 transition-colors border-b border-gray-200 hover:border-navy-400 pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-sm"
          >
            See who you could learn from
            <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <ProfilePreviewModal target={preview} onClose={() => setPreview(null)} />
    </>
  );
}
