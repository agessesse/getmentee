'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SOURCED_NEAR_PEERS, type SourcedNearPeer } from '@/data/people';
import { companyFaviconUrl, schoolFaviconUrl } from '@/lib/logos';

// ─── LinkedIn icon — inline SVG, no extra dependency ─────────────────────────
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ─── Logo chip ────────────────────────────────────────────────────────────────
function LogoChip({ name, url, dim = false }: { name: string; url: string; dim?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      title={name}
      width={16}
      height={16}
      className={`rounded-sm object-contain flex-none ${dim ? 'opacity-40' : 'opacity-75'}`}
      onError={() => setFailed(true)}
    />
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
// Interaction model:
//   • Click portrait / name / info → Link to /people/[slug] (internal profile)
//   • Click LinkedIn icon          → opens LinkedIn in new tab (separate <a>
//                                    outside the Link, so no nesting, no hacks)

function MenteeCard({ person }: { person: SourcedNearPeer }) {
  const initials = `${person.firstName[0]}${person.lastName[0]}`;
  const fullName = `${person.firstName} ${person.lastName}`;
  const shortSchool =
    person.school && person.school.length > 34
      ? person.school.slice(0, 32) + '…'
      : person.school;

  return (
    <div className="snap-start flex-none w-[200px] sm:w-[232px]">
      {/* ── Internal profile link — wraps portrait + identity ── */}
      <Link
        href={`/people/${person.slug}`}
        className="block group"
        aria-label={`View ${fullName}'s profile`}
      >
        {/* Portrait */}
        <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden rounded-xl mb-3">
          {person.image ? (
            <Image
              src={person.image}
              alt={fullName}
              fill
              className="object-cover grayscale group-hover:grayscale-0 scale-100 group-hover:scale-[1.04] transition-all duration-700 ease-out"
              style={{ objectPosition: person.portraitPosition ?? '50% 20%' }}
              sizes="(max-width: 640px) 200px, 232px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-navy-100">
              <span className="text-3xl font-bold text-navy-500">{initials}</span>
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="px-0.5">
          <p className="font-semibold text-navy-900 text-sm leading-tight">{fullName}</p>
          {shortSchool && (
            <p className="text-[11px] text-gray-400 mt-0.5 leading-tight font-light line-clamp-1">
              {shortSchool}
            </p>
          )}
          {person.expectedGraduation && (
            <p className="text-[10px] text-navy-500 font-medium mt-0.5">
              &rsquo;{person.expectedGraduation.slice(-2)}
            </p>
          )}
          {person.interestTags.length > 0 && (
            <p className="text-[10px] text-gray-400 font-light mt-2 leading-relaxed">
              {person.interestTags.slice(0, 2).join(' · ')}
            </p>
          )}
        </div>
      </Link>

      {/* ── Logo chips — school + employer(s) ── */}
      {(() => {
        const schoolUrl = person.school ? schoolFaviconUrl(person.school) : null;
        const employerUrls = (person.experience ?? [])
          .map((e) => ({ name: e.organization, url: companyFaviconUrl(e.organization) }))
          .filter((e): e is { name: string; url: string } => e.url !== null);
        if (!schoolUrl && employerUrls.length === 0) return null;
        return (
          <div className="flex items-center gap-1.5 mt-2 px-0.5 flex-wrap">
            {schoolUrl && <LogoChip name={person.school!} url={schoolUrl} />}
            {schoolUrl && employerUrls.length > 0 && (
              <span className="w-px h-3 bg-gray-200 flex-none" aria-hidden="true" />
            )}
            {employerUrls.map((e) => (
              <LogoChip key={e.name} name={e.name} url={e.url} dim />
            ))}
          </div>
        );
      })()}

      {/* ── LinkedIn — OUTSIDE the Link to avoid nested <a> ── */}
      {person.linkedInUrl && (
        <a
          href={person.linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${fullName} on LinkedIn`}
          className="inline-flex items-center gap-1.5 mt-2 px-0.5 text-gray-400 hover:text-[#0A66C2] transition-colors"
        >
          <LinkedInIcon className="w-3.5 h-3.5 flex-none" />
          <span className="text-[11px] font-medium">LinkedIn</span>
        </a>
      )}
    </div>
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
    const firstCard = el.querySelector<HTMLElement>('[class*="snap-start"]');
    const cardWidth = firstCard ? firstCard.clientWidth : 232;
    el.scrollBy({ left: direction === 'right' ? cardWidth + 20 : -(cardWidth + 20), behavior: 'smooth' });
  }

  return (
    <section className="py-14" aria-labelledby="mentees-heading">

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
            Ambition worth<br className="sm:hidden" /> investing in.
          </h2>
          <p className="text-gray-400 text-sm font-light mt-2 max-w-sm leading-relaxed">
            Students and early-career professionals whose trajectories are being shaped right now.
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
          <div className="flex-none w-[calc(max(0px,(100vw-80rem)/2))]" aria-hidden="true" />
          {SOURCED_NEAR_PEERS.map((person) => (
            <MenteeCard key={person.slug} person={person} />
          ))}
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
