'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SOURCED_NEAR_PEERS, type SourcedNearPeer } from '@/data/people';

// ─── Card — portrait-forward editorial style ───────────────────────────────────

function MenteeCard({ person }: { person: SourcedNearPeer }) {
  const initials = `${person.firstName[0]}${person.lastName[0]}`;

  return (
    <Link
      href={`/people/${person.slug}`}
      className="snap-start flex-none w-[200px] sm:w-[232px] block group"
    >
      {/* Portrait — tall, takes up most of the card */}
      <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden rounded-xl mb-3">
        {person.image ? (
          <Image
            src={person.image}
            alt={`${person.firstName} ${person.lastName}`}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            style={{ objectPosition: person.portraitPosition ?? '50% 20%' }}
            sizes="(max-width: 640px) 200px, 232px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-navy-100">
            <span className="text-3xl font-bold text-navy-500">{initials}</span>
          </div>
        )}
      </div>

      {/* Info below portrait */}
      <div className="px-0.5">
        <p className="font-semibold text-navy-900 text-sm leading-tight">
          {person.firstName} {person.lastName}
        </p>
        {person.school && (
          <p className="text-[11px] text-gray-400 mt-0.5 leading-tight line-clamp-1 font-light">
            {person.school.length > 34 ? person.school.slice(0, 32) + '…' : person.school}
          </p>
        )}
        {person.expectedGraduation && (
          <p className="text-[10px] text-navy-500 font-medium mt-0.5">
            &rsquo;{person.expectedGraduation.slice(-2)}
          </p>
        )}
        {/* Two tags max — shown as subtle text, not pill badges */}
        {person.interestTags.length > 0 && (
          <p className="text-[10px] text-gray-400 font-light mt-2 leading-relaxed">
            {person.interestTags.slice(0, 2).join(' · ')}
          </p>
        )}
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
    const cardWidth = el.firstElementChild?.clientWidth ?? 232;
    el.scrollBy({ left: direction === 'right' ? cardWidth + 16 : -(cardWidth + 16), behavior: 'smooth' });
  }

  return (
    <section className="py-16 border-t border-gray-100" aria-labelledby="mentees-heading">

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 mb-10 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-4">
            Current mentees
          </p>
          <h2
            id="mentees-heading"
            className="font-bold text-navy-900 leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}
          >
            The next generation.
          </h2>
          <p className="text-gray-400 text-sm font-light mt-2 max-w-sm leading-relaxed">
            Students and early-career professionals building their paths with Mentee.
          </p>
        </div>

        {/* Nav arrows */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous mentees"
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-navy-900 hover:border-navy-200 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Next mentees"
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-navy-900 hover:border-navy-200 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable track */}
      <div className="relative">
        {/* Edge fade — left */}
        {canScrollLeft && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-cream-50 to-transparent"
          />
        )}
        {/* Edge fade — right */}
        {canScrollRight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-cream-50 to-transparent"
          />
        )}

        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto scroll-smooth px-6 pb-4"
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
      <div className="flex sm:hidden justify-center gap-3 mt-6 px-6">
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          aria-label="Previous"
          className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-25"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <span className="text-gray-200 select-none">|</span>
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          aria-label="Next"
          className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-25"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
