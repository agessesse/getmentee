'use client';

import { useEffect, useState } from 'react';
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
        className="block w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded-2xl motion-safe:transition-transform motion-safe:duration-300"
        style={{ transform: hovered ? 'translateY(-6px) scale(1.025)' : 'none' }}
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
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-purple-900/95 via-purple-900/80 to-transparent px-3.5 pb-3.5 pt-9 motion-safe:transition-all motion-safe:duration-300"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <p className="text-[10px] font-semibold text-white/75 uppercase tracking-[0.18em] mb-1.5">
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
          <p className="font-semibold text-purple-900 text-[14px] leading-tight line-clamp-1">{mentor.name}</p>
          {(showTitle || showCompany) && (
            <p className="text-[11px] text-gray-500 mt-1 leading-snug font-light line-clamp-2">
              {showTitle && mentor.title}
              {showTitle && showCompany && ' · '}
              {showCompany && <span className="text-purple-600 font-medium">{mentor.company}</span>}
            </p>
          )}
        </div>
      </button>
    </div>
  );
}

export default function MentorCarousel() {
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const q = window.matchMedia('(pointer: coarse)');
    const on = () => setCoarse(q.matches);
    on();
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);

  return (
    <>
      <section className="py-16 sm:py-20 bg-cream-50" aria-labelledby="mentor-carousel-heading">
        <div className="px-6 lg:px-10"><div className="max-w-6xl mx-auto mb-9">
          <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-[0.22em] mb-4">
            Willing to teach
          </p>
          <h2
            id="mentor-carousel-heading"
            className="font-serif text-purple-900 leading-[1.05]"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            People who walked the path first,<br className="hidden sm:block" />{' '}
            then came back to teach.
          </h2>
          <p className="text-gray-500 text-[15px] leading-relaxed mt-4 max-w-md">
            {coarse ? 'Tap' : 'Click'} any mentor for their background and LinkedIn.
          </p>
        </div></div>

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

        <div className="px-6 lg:px-10"><div className="max-w-6xl mx-auto mt-8">
          <Link
            href="/signup?role=mentee"
            onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'meet_the_mentors' })}
            className="group tap-target inline-flex items-center gap-2 text-[15px] font-medium text-purple-700 hover:text-purple-900 transition-colors border-b border-gray-200 hover:border-purple-400 pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-sm"
          >
            Create an account to reach them
            <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
          </Link>
        </div></div>
      </section>

      <ProfilePreviewModal target={preview} onClose={() => setPreview(null)} />
    </>
  );
}
