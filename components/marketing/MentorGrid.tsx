'use client';

import Image from 'next/image';
import { useState } from 'react';
import { FEATURED_MENTORS, type Mentor } from '@/data/mentors';

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function MentorCard({ mentor, index }: { mentor: Mentor; index: number }) {
  const [imgError, setImgError] = useState(false);
  const showTitle = mentor.title !== '—';
  const showCompany = mentor.company !== '—';

  return (
    <article className="group" aria-label={mentor.name}>
      {/* Portrait — grayscale by default, full colour on hover */}
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 mb-4">
        {!imgError ? (
          <Image
            src={mentor.headshot}
            alt={`Portrait of ${mentor.name}`}
            fill
            className="object-cover grayscale group-hover:grayscale-0 scale-100 group-hover:scale-[1.03] transition-all duration-700 ease-out"
            style={{ objectPosition: mentor.imagePosition ?? '50% 20%' }}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 300px"
            priority={index < 3}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: mentor.accentColor }}
          >
            <span className="text-4xl font-bold text-white select-none">{mentor.initials}</span>
          </div>
        )}
      </div>

      {/* Identity */}
      <div className="px-0.5">
        <p className="font-bold text-navy-900 text-[15px] leading-tight">{mentor.name}</p>
        {showTitle && (
          <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">{mentor.title}</p>
        )}
        {showCompany && (
          <p className="text-[12px] font-semibold text-navy-700 leading-snug mt-0.5">{mentor.company}</p>
        )}
        {mentor.linkedInUrl ? (
          <a
            href={mentor.linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${mentor.name} on LinkedIn`}
            className="inline-flex items-center gap-1.5 mt-2 text-gray-400 hover:text-[#0A66C2] transition-colors"
          >
            <LinkedInIcon className="w-3.5 h-3.5 flex-none" />
            <span className="text-[11px] font-medium">LinkedIn</span>
          </a>
        ) : (
          <div className="mt-2 h-5" aria-hidden="true" />
        )}
      </div>
    </article>
  );
}

export default function MentorGrid() {
  return (
    <section className="py-20 px-6 lg:px-10 border-t border-gray-100" aria-labelledby="mentors-heading">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-14">
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

        {/* 3-column portrait grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-10">
          {FEATURED_MENTORS.map((mentor, i) => (
            <MentorCard key={mentor.name} mentor={mentor} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
