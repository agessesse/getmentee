'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FEATURED_MENTORS } from '@/data/mentors';
import { SOURCED_NEAR_PEERS } from '@/data/people';
import ProfilePreviewModal, { type PreviewTarget } from '@/components/marketing/ProfilePreviewModal';
import { trackLandingEvent } from '@/lib/landing-analytics';
import InteractionCue from '@/components/marketing/InteractionCue';
import { INTRO_SESSION_KEY } from '@/components/marketing/intro-session';

const MENTOR = FEATURED_MENTORS.find((m) => m.name.startsWith('Christopher Floyd'));
const STUDENT = SOURCED_NEAR_PEERS.find((p) => p.slug === 'abel-gessesse');

export default function HeroPair() {
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [hover, setHover] = useState<'mentor' | 'student' | null>(null);

  /*
    Nothing about two photos says "these open", and the reveal on hover is the
    best thing about them, so the pair demonstrates itself once. Shortly after
    the page settles, Christopher's card lifts and shows what he can help with,
    then Abel's does, then both rest. It is driven by the same state a real
    hover uses, so what it shows is exactly what the visitor will get.

    It never plays over the intro: IntroSequence locks body scroll while it is
    on screen, so this waits for that lock to lift. It never plays for someone
    who has already reached for a card, and never under reduced motion. The
    cue beside the cards carries the instruction and retires on first use.
  */
  const [demo, setDemo] = useState<'mentor' | 'student' | null>(null);
  // Touching a card stops the one-time demo. It does not retire the cue: the
  // cue steps aside while a card is open and returns when the pointer leaves,
  // so it is there the next time anyone looks.
  const engagedRef = useRef(false);

  // The demo's timers check this ref before every step, so engaging stops the
  // sequence without having to reach into the effect's timer list.
  const engage = () => {
    if (engagedRef.current) return;
    engagedRef.current = true;
    setDemo(null);
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (fn: () => void, ms: number) => { timers.push(setTimeout(fn, ms)); };
    const play = () => {
      if (engagedRef.current) return;
      at(() => { if (!engagedRef.current) setDemo('mentor'); }, 0);
      at(() => { if (!engagedRef.current) setDemo('student'); }, 1500);
      at(() => { if (!engagedRef.current) setDemo(null); }, 3000);
    };
    // Wait out the intro, then give the hero's own entrance time to land.
    // Scroll lock alone is not enough: the intro applies it a moment after
    // mount, so an early check sees an unlocked page and plays underneath it.
    // The intro records itself as seen only when it finishes, so the demo waits
    // for that record and for the lock to lift. If storage is blocked the record
    // never appears, so after a few seconds the lock alone decides.
    const start = Date.now();
    const introDone = () => {
      let seen = false;
      try { seen = !!sessionStorage.getItem(INTRO_SESSION_KEY); } catch { /* blocked storage */ }
      return document.body.style.overflow !== 'hidden' && (seen || Date.now() - start > 6000);
    };
    const waitForIntro = () => {
      if (engagedRef.current) return;
      if (introDone()) at(play, 1400);
      else at(waitForIntro, 200);
    };
    at(waitForIntro, 300);

    return () => timers.forEach(clearTimeout);
  }, []);

  if (!MENTOR || !STUDENT) return null;

  const lit = hover ?? demo;

  /*
    The eyebrows used to read "Willing to teach" and "Ready to learn" over two
    named, photographed people. The first is a statement of intent that
    Christopher has not made to us — his profile is `status: 'sourced'`, built
    from public information — and it appeared in the first thing anyone sees.
    "Further along" and "Earlier on" describe the same pairing without putting
    words in either person's mouth, and they echo the sentence the page makes
    further down: someone ahead of you helps you see further.
  */
  const cards = [
    {
      id: 'mentor' as const,
      eyebrow: 'Further along',
      name: MENTOR.name,
      sub: MENTOR.title,
      photo: MENTOR.headshot,
      pos: MENTOR.imagePosition ?? '50% 5%',
      reveal: (MENTOR.helpsWith ?? []).slice(0, 2),
      // Their expertise, not an offer of their time.
      revealLabel: 'Experience in',
      onOpen: () => {
        trackLandingEvent('mentor_card_opened', { name: MENTOR.name, surface: 'hero' });
        setPreview({ kind: 'mentor', data: MENTOR });
      },
      box: 'absolute top-0 right-0 w-[196px] rotate-[2.5deg]',
    },
    {
      id: 'student' as const,
      eyebrow: 'Earlier on',
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
      box: 'absolute bottom-0 left-0 w-[182px] rotate-[-2.5deg]',
    },
  ];

  return (
    <>
      <div className="relative h-[440px] w-full">
        {/* Relationship line — brightens when either side is engaged */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 440"
          aria-hidden="true"
        >
          <line
            x1="180" y1="232" x2="212" y2="196"
            stroke={lit ? '#785AF7' : '#D9CFFB'}
            strokeWidth={lit ? 1.8 : 1}
            strokeDasharray="4 5"
            style={{ transition: 'stroke 300ms ease, stroke-width 300ms ease' }}
          />
        </svg>

        {cards.map((card) => {
          const active = lit === card.id;
          return (
            <button
              key={card.id}
              onClick={() => { engage(); card.onOpen(); }}
              onPointerEnter={() => { engage(); setHover(card.id); }}
              onPointerLeave={() => setHover(null)}
              onFocus={() => { engage(); setHover(card.id); }}
              onBlur={() => setHover(null)}
              aria-label={`View ${card.name}'s profile`}
              className={`${card.box} rounded-xl overflow-hidden bg-white shadow-2xl border-[3px] border-white text-left cursor-pointer motion-safe:transition-transform motion-safe:duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2`}
              style={{ transform: active ? 'scale(1.04) rotate(0deg)' : undefined, zIndex: active ? 20 : 10 }}
            >
              {/*
                The photographs are square, so a square frame shows each person
                exactly as they were photographed: head, shoulders and suit, no
                crop. The details used to sit in a gradient over the bottom of
                the picture, which covered the half people dress up for. They
                now sit underneath it.
              */}
              {card.photo && (
                <div className="relative w-full aspect-square bg-halo-bone">
                  <Image
                    src={card.photo}
                    alt=""
                    fill
                    className="object-cover transition-all duration-500"
                    style={{ objectPosition: '50% 50%', filter: active ? 'grayscale(0)' : 'grayscale(0.4)' }}
                    sizes="200px"
                    priority
                  />
                </div>
              )}

              <div className="px-3 pt-2.5 pb-3 border-t border-halo-rule">
                <p className="font-ui text-[9.5px] font-semibold text-halo-purple-d uppercase tracking-[0.12em]">
                  {card.eyebrow}
                </p>
                <p className="text-[12.5px] font-bold text-halo-ink leading-tight mt-0.5">{card.name}</p>
                <p className="text-[11px] text-halo-mist-body leading-snug mt-0.5">{card.sub}</p>

                <div
                  className="motion-safe:transition-all motion-safe:duration-300 overflow-hidden"
                  style={{ maxHeight: active ? 64 : 0, opacity: active ? 1 : 0, marginTop: active ? 8 : 0 }}
                >
                  <p className="font-ui text-[9.5px] font-semibold text-halo-mist-body uppercase tracking-[0.12em] mb-1">
                    {card.revealLabel}
                  </p>
                  {card.reveal.map((t) => (
                    <p key={t} className="text-[10.5px] text-halo-ink font-medium leading-tight">{t}</p>
                  ))}
                </div>
              </div>
            </button>
          );
        })}

        {/*
          The instruction, in the product demo's cue style, sitting in the empty
          corner the two cards leave. It stays on screen at rest and only fades
          once the visitor has used a card, at which point it has done its job.
        */}
        <InteractionCue
          className="absolute bottom-4 right-0"
          retired={!!lit}
          hover={<>Hover a card to preview.<br />Click to open a profile.</>}
          touch="Tap a card to open a profile."
        />
      </div>

      <ProfilePreviewModal target={preview} onClose={() => setPreview(null)} />
    </>
  );
}
