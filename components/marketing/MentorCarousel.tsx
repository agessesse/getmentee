'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FEATURED_MENTORS, type Mentor } from '@/data/mentors';
import ProfilePreviewModal, { type PreviewTarget } from '@/components/marketing/ProfilePreviewModal';

const DOUBLED = [...FEATURED_MENTORS, ...FEATURED_MENTORS];

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function MentorCard({
  mentor,
  index,
  onPreview,
}: {
  mentor: Mentor;
  index: number;
  onPreview: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const showTitle = mentor.title !== '—';
  const showCompany = mentor.company !== '—';

  return (
    <div className="flex-none w-[190px] sm:w-[210px] px-3 motion-safe:hover:scale-[1.04] motion-safe:hover:-translate-y-1.5 transition-transform duration-300">
      <button
        onClick={onPreview}
        className="block w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded-xl"
        aria-label={`View ${mentor.name}'s profile`}
      >
        <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden rounded-xl mb-3">
          {!imgError ? (
            <Image
              src={mentor.headshot}
              alt={mentor.name}
              fill
              className="object-cover grayscale group-hover:grayscale-0 scale-100 group-hover:scale-[1.04] transition-all duration-700 ease-out"
              style={{ objectPosition: mentor.imagePosition ?? '50% 20%' }}
              sizes="210px"
              priority={index < 4}
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
        </div>
        <div className="px-0.5">
          <p className="font-semibold text-navy-900 text-sm leading-tight group-hover:text-navy-700 transition-colors">
            {mentor.name}
          </p>
          {showTitle && (
            <p className="text-[11px] text-gray-400 mt-0.5 leading-tight font-light line-clamp-1">
              {mentor.title}
            </p>
          )}
          {showCompany && (
            <p className="text-[11px] text-navy-500 font-medium mt-0.5">{mentor.company}</p>
          )}
        </div>
      </button>
      {mentor.linkedInUrl && (
        <a
          href={mentor.linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${mentor.name} on LinkedIn`}
          className="inline-flex items-center gap-1.5 mt-2 px-0.5 text-gray-400 hover:text-[#0A66C2] transition-colors"
        >
          <LinkedInIcon className="w-3.5 h-3.5 flex-none" />
          <span className="text-[11px] font-medium">LinkedIn</span>
        </a>
      )}
    </div>
  );
}

export default function MentorCarousel() {
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // All mutable animation state lives in a ref so RAF reads/writes are instant.
  const anim = useRef({ pos: 0, dir: -1 as -1 | 1, paused: false, halfWidth: 0, lastTs: 0 });
  const rafId = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const track: HTMLDivElement = trackRef.current!;
    if (!track) return;

    anim.current.halfWidth = track.scrollWidth / 2;
    const DURATION = 48_000; // ms per full loop, matches previous 48s CSS duration

    function step(ts: number) {
      const s = anim.current;
      const dt = s.lastTs > 0 ? Math.min(ts - s.lastTs, 50) : 0;
      s.lastTs = ts;

      if (!s.paused) {
        s.pos += s.dir * (s.halfWidth / DURATION) * dt;
        // Seamless wrap in both directions
        if (s.pos <= -s.halfWidth) s.pos += s.halfWidth;
        if (s.pos > 0) s.pos -= s.halfWidth;
        track.style.transform = `translateX(${s.pos}px)`;
      }

      rafId.current = requestAnimationFrame(step);
    }

    rafId.current = requestAnimationFrame(step);
    const animState = anim.current;
    return () => {
      cancelAnimationFrame(rafId.current);
      animState.lastTs = 0;
    };
  }, []);

  // Keep animation frozen while the modal is open.
  useEffect(() => {
    anim.current.paused = preview !== null;
  }, [preview]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - left) / width;
    const s = anim.current;
    if (ratio < 0.25) { s.dir = -1; s.paused = false; }
    else if (ratio > 0.75) { s.dir = 1; s.paused = false; }
    else { s.paused = true; }
  }, []);

  const handleMouseLeave = useCallback(() => {
    anim.current.dir = -1;
    anim.current.paused = false;
  }, []);

  return (
    <>
      <section className="py-14 border-t border-gray-100" aria-labelledby="mentor-carousel-heading">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 mb-10">
          <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-4">
            Our mentors
          </p>
          <h2
            id="mentor-carousel-heading"
            className="font-bold text-navy-900 leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}
          >
            Experience worth<br className="sm:hidden" /> passing forward.
          </h2>
          <p className="text-gray-400 text-sm font-light mt-2 max-w-sm leading-relaxed">
            Professionals who chose to invest their expertise in the people coming up behind them.
          </p>
        </div>

        <div
          className="relative py-4"
          style={{ overflowX: 'clip' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* No CSS animation class — position is driven entirely by the RAF loop above */}
          <div ref={trackRef} className="flex" style={{ width: 'max-content' }} aria-hidden="true">
            {DOUBLED.map((mentor, i) => (
              <MentorCard
                key={`${mentor.name}-${i}`}
                mentor={mentor}
                index={i}
                onPreview={() => setPreview({ kind: 'mentor', data: mentor })}
              />
            ))}
          </div>
        </div>
      </section>

      <ProfilePreviewModal target={preview} onClose={() => setPreview(null)} />
    </>
  );
}
