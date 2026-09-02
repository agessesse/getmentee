'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SOURCED_NEAR_PEERS, type SourcedNearPeer } from '@/data/people';

// ─── Card ─────────────────────────────────────────────────────────────────────

function MenteeCard({ person }: { person: SourcedNearPeer }) {
  const initials = `${person.firstName[0]}${person.lastName[0]}`;

  return (
    <Link
      href={`/people/${person.slug}`}
      className="snap-start flex-none w-[220px] sm:w-[252px] bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-navy-200 transition-all block"
    >
      {/* Portrait */}
      <div className="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden">
        {person.image ? (
          <Image
            src={person.image}
            alt={`${person.firstName} ${person.lastName}`}
            fill
            className="object-cover"
            style={{ objectPosition: person.portraitPosition ?? '50% 20%' }}
            sizes="(max-width: 640px) 220px, 252px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-navy-100">
            <span className="text-3xl font-bold text-navy-500">{initials}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold text-navy-900 text-sm leading-tight">
          {person.firstName} {person.lastName}
        </p>
        {person.school && (
          <p className="text-[11px] text-gray-400 mt-0.5 leading-tight line-clamp-1">
            {person.school.length > 32 ? person.school.slice(0, 30) + '…' : person.school}
          </p>
        )}
        {person.expectedGraduation && (
          <p className="text-[10px] text-navy-500 font-medium mt-0.5">
            Class of {person.expectedGraduation}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {person.interestTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium text-navy-700 bg-navy-50 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ─── Carousel ─────────────────────────────────────────────────────────────────

export default function MenteeCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  function scroll(direction: 'left' | 'right') {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 252;
    el.scrollBy({ left: direction === 'right' ? cardWidth + 16 : -(cardWidth + 16), behavior: 'smooth' });
  }

  return (
    <section className="py-12 bg-gray-50/60" aria-labelledby="mentees-heading">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold text-navy-600 uppercase tracking-[0.15em] mb-3">
            Current mentees
          </p>
          <h2
            id="mentees-heading"
            className="text-2xl md:text-3xl font-bold text-navy-900"
          >
            The next generation.
          </h2>
          <p className="text-gray-400 text-sm font-light mt-2 max-w-md">
            Students and early-career professionals building their paths with Mentee.
          </p>
        </div>

        {/* Nav buttons */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous mentees"
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-navy-900 hover:border-navy-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Next mentees"
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-navy-900 hover:border-navy-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable track */}
      <div className="relative">
        {/* Fade left */}
        {canScrollLeft && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-12 z-10 bg-gradient-to-r from-gray-50/60 to-transparent"
          />
        )}
        {/* Fade right */}
        {canScrollRight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-12 z-10 bg-gradient-to-l from-gray-50/60 to-transparent"
          />
        )}

        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto scroll-smooth px-6 pb-2"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {/* Leading spacer aligns first card with page content */}
          <div className="flex-none w-[calc(max(0px,(100vw-80rem)/2))]" aria-hidden="true" />

          {SOURCED_NEAR_PEERS.map((person) => (
            <MenteeCard key={person.slug} person={person} />
          ))}

          {/* Trailing spacer */}
          <div className="flex-none w-[calc(max(0px,(100vw-80rem)/2))]" aria-hidden="true" />
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex sm:hidden justify-center gap-2 mt-6 px-6">
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          aria-label="Previous"
          className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <span className="text-gray-200 select-none">|</span>
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          aria-label="Next"
          className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-30"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
