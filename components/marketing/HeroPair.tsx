'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FEATURED_MENTORS } from '@/data/mentors';
import { SOURCED_NEAR_PEERS } from '@/data/people';
import ProfilePreviewModal, { type PreviewTarget } from '@/components/marketing/ProfilePreviewModal';
import { trackLandingEvent } from '@/lib/landing-analytics';

const MENTOR = FEATURED_MENTORS.find((m) => m.name.startsWith('Christopher Floyd'));
const STUDENT = SOURCED_NEAR_PEERS.find((p) => p.slug === 'abel-gessesse');

export default function HeroPair() {
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [hover, setHover] = useState<'mentor' | 'student' | null>(null);

  if (!MENTOR || !STUDENT) return null;

  const cards = [
    {
      id: 'mentor' as const,
      eyebrow: 'Willing to teach',
      name: MENTOR.name,
      sub: MENTOR.title,
      photo: MENTOR.headshot,
      pos: MENTOR.imagePosition ?? '50% 5%',
      reveal: (MENTOR.helpsWith ?? []).slice(0, 2),
      revealLabel: 'Can help with',
      onOpen: () => {
        trackLandingEvent('mentor_card_opened', { name: MENTOR.name, surface: 'hero' });
        setPreview({ kind: 'mentor', data: MENTOR });
      },
      box: 'absolute top-0 right-2 w-[196px] h-[268px] rotate-[2.5deg]',
    },
    {
      id: 'student' as const,
      eyebrow: 'Ready to learn',
      name: `${STUDENT.firstName} ${STUDENT.lastName}`,
      sub: 'UNC Kenan-Flagler',
      photo: STUDENT.image ?? '',
      pos: STUDENT.portraitPosition ?? '50% 15%',
      reveal: STUDENT.interestTags.slice(0, 2),
      revealLabel: 'Learning about',
      onOpen: () => {
        trackLandingEvent('mentee_card_opened', { slug: STUDENT.slug, surface: 'hero' });
        setPreview({ kind: 'mentee', data: STUDENT });
      },
      box: 'absolute bottom-0 left-2 w-[172px] h-[236px] rotate-[-2.5deg]',
    },
  ];

  return (
    <>
      <div className="relative h-[392px] w-full">
        {/* Relationship line — brightens when either side is engaged */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 340 392"
          aria-hidden="true"
        >
          <line
            x1="118" y1="268" x2="222" y2="132"
            stroke={hover ? '#5265b0' : '#c0cbe9'}
            strokeWidth={hover ? 1.8 : 1}
            strokeDasharray="4 5"
            style={{ transition: 'stroke 300ms ease, stroke-width 300ms ease' }}
          />
        </svg>

        {cards.map((card) => {
          const active = hover === card.id;
          return (
            <button
              key={card.id}
              onClick={card.onOpen}
              onPointerEnter={() => setHover(card.id)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(card.id)}
              onBlur={() => setHover(null)}
              aria-label={`View ${card.name}'s profile`}
              className={`${card.box} rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white text-left cursor-pointer motion-safe:transition-transform motion-safe:duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2`}
              style={{ transform: active ? 'scale(1.04) rotate(0deg)' : undefined, zIndex: active ? 20 : 10 }}
            >
              {card.photo && (
                <Image
                  src={card.photo}
                  alt=""
                  fill
                  className="object-cover transition-all duration-500"
                  style={{ objectPosition: card.pos, filter: active ? 'grayscale(0)' : 'grayscale(0.55)' }}
                  sizes="200px"
                  priority
                />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-3 pt-10">
                <p className="text-[9px] font-semibold text-white/70 uppercase tracking-[0.22em]">
                  {card.eyebrow}
                </p>
                <p className="text-[11px] font-bold text-white leading-tight mt-0.5">{card.name}</p>
                <p className="text-[10px] text-white/70 mt-0.5 font-light">{card.sub}</p>

                <div
                  className="motion-safe:transition-all motion-safe:duration-300 overflow-hidden"
                  style={{ maxHeight: active ? 56 : 0, opacity: active ? 1 : 0, marginTop: active ? 8 : 0 }}
                >
                  <p className="text-[8px] font-bold text-white/50 uppercase tracking-[0.18em] mb-1">
                    {card.revealLabel}
                  </p>
                  {card.reveal.map((t) => (
                    <p key={t} className="text-[10px] text-white font-medium leading-tight">{t}</p>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <ProfilePreviewModal target={preview} onClose={() => setPreview(null)} />
    </>
  );
}
