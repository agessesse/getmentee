'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { type Mentor } from '@/data/mentors';
import { type SourcedNearPeer } from '@/data/people';

// ─── Discriminated union for the two profile types ────────────────────────────
export type PreviewTarget =
  | { kind: 'mentor'; data: Mentor }
  | { kind: 'mentee'; data: SourcedNearPeer };

interface Props {
  target: PreviewTarget | null;
  onClose: () => void;
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function ProfilePreviewModal({ target, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape key
  useEffect(() => {
    if (!target) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [target, onClose]);

  // Focus close button on open; restore focus on close
  useEffect(() => {
    if (target) {
      closeRef.current?.focus();
    }
  }, [target]);

  // Prevent body scroll while open
  useEffect(() => {
    if (!target) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [target]);

  if (!target) return null;

  // ── Derive display fields ──────────────────────────────────────────────────
  let name: string;
  let headshot: string | undefined;
  let imagePosition: string;
  let accentColor: string;
  let initials: string;
  let titleLine: string;
  let subLine: string;
  let bio: string;
  let tags: string[];
  let statementSectionLabel: string | null = null;
  let statementLabel: string | null = null;
  let statement: string | null = null;
  let linkedInUrl: string | undefined;

  if (target.kind === 'mentor') {
    const m = target.data;
    name = m.name;
    headshot = m.headshot;
    imagePosition = m.imagePosition ?? '50% 20%';
    accentColor = m.accentColor;
    initials = m.initials;
    titleLine = m.title !== '—' ? m.title : '';
    subLine = m.company !== '—' ? m.company : '';
    bio = m.shortBio;
    tags = m.priorCompanies ?? [];
    statementSectionLabel = 'Why I mentor';
    statementLabel = m.whyLabel === 'In their words' ? null : 'Founder perspective';
    statement = m.whyIMentor;
    linkedInUrl = m.linkedInUrl;
  } else {
    const p = target.data;
    name = `${p.firstName} ${p.lastName}`;
    headshot = p.image;
    imagePosition = p.portraitPosition ?? '50% 20%';
    accentColor = '#1a1f3a';
    initials = `${p.firstName[0]}${p.lastName[0]}`;
    titleLine = p.title ?? '';
    subLine = p.school ?? '';
    bio = p.bio;
    tags = p.interestTags.slice(0, 5);
    statementSectionLabel = p.demo_impact_story ? 'Their experience' : null;
    statementLabel = p.demo_impact_story ? 'Demo copy' : null;
    statement = p.demo_impact_story ?? null;
    linkedInUrl = p.linkedInUrl;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ppm-name"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-2xl"
      >
        {/* Close button */}
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close profile preview"
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-navy-900 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-1"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable body */}
        <div className="overflow-y-auto">

          {/* Headshot with gradient name overlay */}
          <div className="relative w-full aspect-[4/3] bg-gray-100 flex-none">
            {headshot ? (
              <Image
                src={headshot}
                alt={`Portrait of ${name}`}
                fill
                className="object-cover"
                style={{ objectPosition: imagePosition }}
                sizes="(max-width: 640px) 100vw, 512px"
                priority
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: accentColor }}
              >
                <span className="text-5xl font-bold text-white select-none">{initials}</span>
              </div>
            )}
            {/* Bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
            {/* Name overlay */}
            <div className="absolute bottom-4 left-5 right-12 pointer-events-none">
              <p id="ppm-name" className="font-bold text-white text-xl leading-tight drop-shadow-md">
                {name}
              </p>
              {titleLine && (
                <p className="text-white/85 text-sm mt-0.5 leading-snug drop-shadow">{titleLine}</p>
              )}
              {subLine && (
                <p className={`text-sm mt-0.5 leading-snug drop-shadow ${titleLine ? 'text-white/60 text-xs' : 'text-white/85'}`}>
                  {subLine}
                </p>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 pb-8">

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium text-navy-700 bg-navy-50 rounded-full px-2.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Bio */}
            <p className="text-gray-600 text-sm leading-relaxed">{bio}</p>

            {/* Statement section */}
            {statement && statementSectionLabel && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-[0.18em]">
                    {statementSectionLabel}
                  </p>
                  {statementLabel && (
                    <span className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.08em] border border-gray-200 rounded-full px-1.5 py-0.5">
                      {statementLabel}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed italic">
                  &ldquo;{statement}&rdquo;
                </p>
              </div>
            )}

            {/* LinkedIn */}
            {linkedInUrl && (
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-5 text-sm font-medium text-gray-500 hover:text-[#0A66C2] transition-colors"
              >
                <LinkedInIcon className="w-4 h-4 flex-none" />
                View on LinkedIn
              </a>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
