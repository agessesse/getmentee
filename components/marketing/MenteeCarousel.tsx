'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SOURCED_NEAR_PEERS, type SourcedNearPeer } from '@/data/people';
import { companyFaviconUrl, schoolFaviconUrl } from '@/lib/logos';
import LogoChip from '@/components/ui/LogoChip';
import ProfilePreviewModal, { type PreviewTarget } from '@/components/marketing/ProfilePreviewModal';

const DOUBLED = [...SOURCED_NEAR_PEERS, ...SOURCED_NEAR_PEERS];

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function MenteeCard({
  person,
  onPreview,
}: {
  person: SourcedNearPeer;
  onPreview: () => void;
}) {
  const initials = `${person.firstName[0]}${person.lastName[0]}`;
  const fullName = `${person.firstName} ${person.lastName}`;
  const shortSchool =
    person.school && person.school.length > 34
      ? person.school.slice(0, 32) + '…'
      : person.school;

  return (
    <div className="flex-none w-[200px] sm:w-[220px] px-3 motion-safe:hover:scale-[1.04] motion-safe:hover:-translate-y-1.5 transition-transform duration-300">
      <button
        onClick={onPreview}
        className="block w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded-xl"
        aria-label={`View ${fullName}'s profile`}
      >
        <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden rounded-xl mb-3">
          {person.image ? (
            <Image
              src={person.image}
              alt={fullName}
              fill
              className="object-cover grayscale group-hover:grayscale-0 scale-100 group-hover:scale-[1.04] transition-all duration-700 ease-out"
              style={{ objectPosition: person.portraitPosition ?? '50% 20%' }}
              sizes="(max-width: 640px) 200px, 220px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-navy-100">
              <span className="text-3xl font-bold text-navy-500">{initials}</span>
            </div>
          )}
        </div>
        <div className="px-0.5">
          <p className="font-semibold text-navy-900 text-sm leading-tight group-hover:text-navy-700 transition-colors">
            {fullName}
          </p>
          {shortSchool && (
            <p className="text-[11px] text-gray-400 mt-0.5 leading-tight font-light line-clamp-1">
              {shortSchool}
            </p>
          )}
          {person.expectedGraduation && (
            <p className="text-[11px] text-navy-500 font-medium mt-0.5">
              &rsquo;{person.expectedGraduation.slice(-2)}
            </p>
          )}
          {person.interestTags.length > 0 && (
            <p className="text-[10px] text-gray-400 font-light mt-2 leading-relaxed">
              {person.interestTags.slice(0, 2).join(' · ')}
            </p>
          )}
        </div>
      </button>

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

export default function MenteeCarousel() {
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [scrollDir, setScrollDir] = useState<'left' | 'right' | 'paused'>('left');

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - left) / width;
    if (ratio < 0.25) setScrollDir('left');
    else if (ratio > 0.75) setScrollDir('right');
    else setScrollDir('paused');
  }

  const modalOpen = preview !== null;
  const playing = !modalOpen && scrollDir !== 'paused';

  return (
    <>
      <section className="py-14 border-t border-gray-100" aria-labelledby="mentees-heading">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 mb-10">
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

        <div
          className="relative py-4"
          style={{ overflowX: 'clip' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setScrollDir('left')}
        >
          <div
            className="flex animate-carousel-left"
            style={{
              width: 'max-content',
              animationDuration: '60s',
              animationPlayState: playing ? 'running' : 'paused',
              animationDirection: scrollDir === 'right' ? 'reverse' : 'normal',
            }}
          >
            {DOUBLED.map((person, i) => (
              <MenteeCard
                key={`${person.slug}-${i}`}
                person={person}
                onPreview={() => setPreview({ kind: 'mentee', data: person })}
              />
            ))}
          </div>
        </div>
      </section>

      <ProfilePreviewModal target={preview} onClose={() => setPreview(null)} />
    </>
  );
}
