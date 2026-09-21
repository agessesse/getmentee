'use client';

import Link from 'next/link';
import {
  ArrowRight, Calendar, ClipboardList, MessageSquare, Pencil,
  CheckSquare, Settings2, Handshake, CheckCheck,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import LearnHint from '@/components/ui/LearnHint';
import type { NextAction, NowItem, NowKind } from '@/lib/mentorship/next-action';

/**
 * The two bands that carry the whole dashboard: what needs the person now, and
 * the one thing to do next.
 *
 * "Now" only ever holds items a row can justify — a conversation in the next
 * two days, a message they haven't answered, a session nobody closed out, a
 * request waiting. It is capped at three, because a list of nine urgent things
 * is a list of zero urgent things. When it is empty the band disappears.
 *
 * "Next" is always exactly one action, chosen by lib/mentorship/next-action.ts.
 * Not a ranked feed, not a suggestion engine: a readable chain of if-statements
 * over real state. It is the only thing on the page styled to be unmissable,
 * which is what makes it work.
 *
 * No countdown, no badge colour used as the only signal, no "don't lose your
 * streak". Every line here would survive being read aloud to the person it is
 * about.
 */

const ICONS: Record<NowKind, React.ComponentType<{ className?: string }>> = {
  message: MessageSquare,
  session: Calendar,
  request: ClipboardList,
  wrapup: Pencil,
  commitment: CheckSquare,
  setup: Settings2,
  accepted: Handshake,
};

export function NowList({ items, overflow }: { items: NowItem[]; overflow?: { label: string; href: string } }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="now-heading" className="bg-white rounded-2xl border border-halo-rule overflow-hidden">
      <h2 id="now-heading" className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink px-5 sm:px-6 pt-5 sm:pt-6 pb-2">
        Needs you now
      </h2>
      <ul className="divide-y divide-halo-rule">
        {items.map((it) => {
          const Icon = ICONS[it.kind];
          return (
            <li key={it.key}>
              <Link
                href={it.href}
                className="group flex items-start gap-4 px-5 sm:px-6 py-4 hover:bg-halo-veil/50 transition-colors focus-visible:outline-none focus-visible:bg-halo-veil"
              >
                <span className="relative flex-shrink-0">
                  {it.person
                    ? <Avatar src={it.person.avatarUrl} name={it.person.fullName} size="md" />
                    : <span className="w-10 h-10 rounded-full bg-halo-veil border border-halo-lavender flex items-center justify-center">
                        <Icon className="w-4 h-4 text-halo-purple-d" aria-hidden="true" />
                      </span>}
                  {it.person && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-halo-rule flex items-center justify-center">
                      <Icon className="w-3 h-3 text-halo-purple-d" aria-hidden="true" />
                    </span>
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-halo-ink leading-snug">{it.title}</span>
                  {it.detail && (
                    <span className="block text-[13px] text-halo-heather mt-1 leading-relaxed line-clamp-2">{it.detail}</span>
                  )}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 self-center flex-shrink-0 text-sm font-semibold text-halo-purple-d">
                  {it.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </span>
                <ArrowRight className="sm:hidden w-4 h-4 self-center flex-shrink-0 text-halo-purple-d" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
      {overflow && (
        <Link
          href={overflow.href}
          className="block px-5 sm:px-6 py-3.5 border-t border-halo-rule text-sm font-medium text-halo-purple-d hover:text-halo-ink transition-colors"
        >
          {overflow.label} →
        </Link>
      )}
    </section>
  );
}

/** The single next best action. One per dashboard, always. */
export default function NextActionCard({ action, quiet }: { action: NextAction; quiet?: boolean }) {
  // When nothing needs doing, the same component says so plainly rather than
  // dressing a quiet week up as an urgent one.
  if (quiet) {
    return (
      <section aria-labelledby="next-heading" className="flex items-start gap-4 bg-halo-veil border border-halo-lavender rounded-2xl px-5 sm:px-6 py-5">
        <span className="w-10 h-10 rounded-xl bg-white border border-halo-lavender flex items-center justify-center flex-shrink-0">
          <CheckCheck className="w-5 h-5 text-halo-purple-d" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="next-heading" className="font-display font-normal text-[1.375rem] leading-tight text-halo-ink">
            {action.headline}
          </h2>
          {action.why && <p className="text-sm text-halo-heather mt-1 leading-relaxed">{action.why}</p>}
          <Link
            href={action.href}
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-halo-purple-d hover:text-halo-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple rounded"
          >
            {action.cta}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="next-heading"
      className="relative overflow-hidden bg-halo-deep rounded-2xl px-6 sm:px-8 py-6 sm:py-7 text-white"
      style={{ backgroundImage: 'radial-gradient(ellipse 70% 90% at 85% 0%, rgba(120,90,247,0.55) 0%, transparent 65%)' }}
    >
      <p className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-lavender mb-2">
        Do this next
      </p>
      <h2 id="next-heading" className="font-display font-normal text-[1.75rem] leading-tight max-w-2xl">
        {action.headline}
      </h2>
      {action.why && (
        <p className="text-halo-lavender text-sm font-light leading-relaxed max-w-2xl mt-2">{action.why}</p>
      )}
      <div className="flex flex-wrap items-center gap-3 mt-5">
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 bg-halo-ivory text-halo-purple-d px-5 py-3 rounded-xl text-sm font-semibold shadow-sm hover:bg-halo-lavender transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-halo-deep"
        >
          {action.cta}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
        {action.secondary && (
          <Link
            href={action.secondary.href}
            className="inline-flex items-center gap-2 border border-halo-lavender text-halo-ivory px-5 py-3 rounded-xl text-sm font-semibold hover:bg-halo-ivory hover:text-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-halo-deep"
          >
            {action.secondary.label}
          </Link>
        )}
      </div>
      {action.learn && (
        <div className="mt-5 max-w-2xl">
          {/* The lesson sits inside the dark card but keeps the light hint shell,
              so it reads as an aside rather than another thing to act on. */}
          <div className="bg-white/95 rounded-xl">
            <LearnHint hint={action.learn} id={`next-${action.key}`} tone="plain" className="!border-transparent !bg-transparent" />
          </div>
        </div>
      )}
    </section>
  );
}
