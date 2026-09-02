'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FEATURED_MENTORS, type Mentor } from '@/data/mentors';

// ─── LinkedIn icon — inline SVG, no extra dependency ─────────────────────────
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
// /people/[slug] is behind auth — mentor cards are not internally navigable.
// LinkedIn is the only external action on each card.

function MentorCard({ mentor, index }: { mentor: Mentor; index: number }) {
  const hasVerifiedQuote = mentor.whyLabel === 'In their words';
  const [imgError, setImgError] = useState(false);
  const showTitle = mentor.title !== '—';
  const showCompany = mentor.company !== '—';

  return (
    <article
      className="snap-start flex-none w-[320px] sm:w-[356px] bg-white border border-gray-100 rounded-xl p-6 flex flex-col hover:border-navy-200 hover:shadow-md transition-all duration-300"
      aria-label={mentor.name}
    >
      {/* ── Portrait + identity ── */}
      <div className="flex items-start gap-4 mb-5">

        {/* Thumbnail — 96×96, per-mentor object-position */}
        <div className="relative w-24 h-24 flex-none rounded-xl overflow-hidden bg-gray-100">
          {!imgError ? (
            <Image
              src={mentor.headshot}
              alt={`Portrait of ${mentor.name}`}
              fill
              className="object-cover"
              style={{ objectPosition: mentor.thumbnailPosition ?? '50% 15%' }}
              sizes="96px"
              priority={index < 2}
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: mentor.accentColor }}
            >
              <span className="text-2xl font-bold text-white select-none">{mentor.initials}</span>
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="font-bold text-navy-900 text-[15px] leading-tight mb-1">
            {mentor.name}
          </h3>
          {showTitle && (
            <p className="text-[12px] text-gray-500 leading-snug">{mentor.title}</p>
          )}
          {showCompany && (
            <p className="text-[12px] font-semibold text-navy-700 leading-snug mt-0.5">{mentor.company}</p>
          )}

          {/* LinkedIn — always below identity, visible without hover */}
          {mentor.linkedInUrl ? (
            <a
              href={mentor.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${mentor.name} on LinkedIn`}
              className="inline-flex items-center gap-1.5 mt-2.5 text-gray-400 hover:text-[#0A66C2] transition-colors group/li"
            >
              <LinkedInIcon className="w-3.5 h-3.5 flex-none" />
              <span className="text-[11px] font-medium">LinkedIn</span>
            </a>
          ) : (
            /* No LinkedIn URL — reserve visual space so cards align */
            <div className="mt-2.5 h-5" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* ── Bio ── */}
      <div className="border-t border-gray-100 pt-4 mb-4">
        <p className="text-[13px] text-gray-600 font-light leading-relaxed">
          {mentor.shortBio}
        </p>
      </div>

      {/* ── Why I mentor ── */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-[0.18em]">
            Why I mentor
          </p>
          {!hasVerifiedQuote && (
            <span className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.08em] border border-gray-200 rounded-full px-1.5 py-0.5">
              Founder perspective
            </span>
          )}
        </div>
        <p className={`text-[13px] font-light leading-relaxed ${hasVerifiedQuote ? 'text-navy-900 italic' : 'text-gray-700'}`}>
          {hasVerifiedQuote ? `"${mentor.whyIMentor}"` : mentor.whyIMentor}
        </p>
      </div>

    </article>
  );
}

// ─── Carousel ─────────────────────────────────────────────────────────────────

export default function MentorCarousel() {
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
    const firstCard = el.querySelector('article');
    const cardWidth = firstCard ? firstCard.clientWidth : 356;
    el.scrollBy({ left: direction === 'right' ? cardWidth + 20 : -(cardWidth + 20), behavior: 'smooth' });
  }

  return (
    <section className="py-14 border-t border-gray-100" aria-labelledby="mentors-heading">

      {/* ── Section header ── */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 mb-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

          {/* Editorial intro */}
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-4">
              Mentors
            </p>
            <h2
              id="mentors-heading"
              className="font-bold text-navy-900 leading-tight mb-4"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
            >
              Experience becomes more valuable<br className="hidden sm:block" />
              when it&apos;s passed forward.
            </h2>
            <p className="text-gray-500 font-light leading-relaxed text-[15px] max-w-lg">
              These aren&apos;t random profiles in a marketplace. They are people
              who have chosen to invest their experience in someone else&apos;s future.
            </p>
          </div>

          {/* Arrow controls — aligned to bottom of heading block on desktop */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0 pb-1">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous mentors"
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-navy-900 hover:border-navy-200 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Next mentors"
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-navy-900 hover:border-navy-200 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable track ── */}
      <div className="relative">
        {/* Edge fades */}
        {canScrollLeft && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-cream-50 to-transparent"
          />
        )}
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

          {FEATURED_MENTORS.map((mentor, i) => (
            <MentorCard key={mentor.name} mentor={mentor} index={i} />
          ))}

          {/* Trailing spacer */}
          <div className="flex-none w-[calc(max(0px,(100vw-80rem)/2))]" aria-hidden="true" />
        </div>
      </div>

      {/* ── Mobile nav ── */}
      <div className="flex sm:hidden justify-center gap-3 mt-4 px-6">
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
