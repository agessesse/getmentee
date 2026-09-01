'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SOURCED_NEAR_PEERS, type SourcedNearPeer } from '@/data/people';

// ─── Card ─────────────────────────────────────────────────────────────────────

function MenteeCard({ person }: { person: SourcedNearPeer }) {
  const initials = `${person.firstName[0]}${person.lastName[0]}`;
  const displaySchool =
    person.school.length > 48 ? person.school.slice(0, 45) + '…' : person.school;

  return (
    <article className="snap-start flex-none w-[288px] sm:w-[320px] bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-sm transition-shadow">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        {person.image ? (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
            <Image
              src={person.image}
              alt={`${person.firstName} ${person.lastName}`}
              fill
              className="object-cover object-top"
              sizes="56px"
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl flex-shrink-0 bg-navy-100 flex items-center justify-center">
            <span className="text-lg font-bold text-navy-600">{initials}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-navy-900 text-sm leading-tight">
            {person.firstName} {person.lastName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 leading-tight line-clamp-2">{displaySchool}</p>
          {person.expectedGraduation && (
            <p className="text-[10px] text-navy-500 font-medium mt-0.5">
              Class of {person.expectedGraduation}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      <p className="text-xs text-gray-500 leading-relaxed font-light line-clamp-3">{person.bio}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {person.interestTags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-medium text-navy-700 bg-navy-50 px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
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
    const cardWidth = el.firstElementChild?.clientWidth ?? 320;
    el.scrollBy({ left: direction === 'right' ? cardWidth + 16 : -(cardWidth + 16), behavior: 'smooth' });
  }

  return (
    <section className="py-20 bg-gray-50/60" aria-labelledby="mentees-heading">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 mb-10 flex items-end justify-between">
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

      {/* Mobile nav dots */}
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
