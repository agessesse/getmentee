import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { ArrowRight } from 'lucide-react';
import type { DiscoverView } from '@/lib/matching/discover';

/**
 * The moment the product exists for.
 *
 * Someone opens Mentable, reads why they should meet a specific person,
 * and thinks: I actually should talk to them. Everything on this card
 * serves that sentence and nothing else is on it.
 *
 * WHAT IS DELIBERATELY ABSENT. No compatibility percentage, no match
 * strength bar, no "AI suggested" badge. A number nobody can check invites
 * people to argue with the arithmetic instead of reading the reasons, and
 * the reasons are the entire value. If Mentable cannot say why in a
 * sentence a human would say out loud, it should not be recommending.
 *
 * Reasons are rendered in the order the engine ranked them, so the
 * strongest thing appears first and a person who reads one line still gets
 * the best one.
 */
export default function DiscoverList({ view }: { view: DiscoverView }) {
  if (view.recommendations.length === 0) {
    return <Empty reason={view.empty} pool={view.candidatePool} />;
  }

  return (
    <ul className="space-y-4">
      {view.recommendations.map(({ candidate: c, reasons, opener }) => (
        <li key={c.id} className="rounded-2xl border border-halo-rule p-5">
          <div className="flex items-start gap-4">
            <Avatar src={c.avatarUrl} name={c.fullName} size="md" />
            <div className="min-w-0 flex-1">
              <Link
                href={`/network/${c.id}`}
                className="text-[16px] font-medium text-halo-ink hover:text-halo-brand-text transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
              >
                {c.fullName}
              </Link>
              <p className="text-[13.5px] text-halo-heather leading-snug mt-0.5">
                {[c.title, c.company].filter(Boolean).join(' · ')}
                {c.industry && (c.title || c.company) ? ' · ' : ''}
                {!c.title && !c.company ? c.industry : (c.industry && c.title ? '' : c.industry)}
              </p>
            </div>
          </div>

          {/* Why, in their own words and the candidate's. */}
          <div className="mt-4">
            <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body mb-2">
              Why {c.firstName}
            </p>
            <ul className="space-y-1.5">
              {reasons.slice(0, 3).map((r, i) => (
                <li key={i} className="text-[14.5px] text-halo-ink leading-relaxed">
                  {r.text}
                </li>
              ))}
            </ul>
          </div>

          {opener && (
            <div className="mt-4 rounded-xl bg-halo-veil border border-halo-rule px-4 py-3">
              <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-halo-mist-body mb-1">
                Somewhere to start
              </p>
              <p className="text-[14px] text-halo-ink leading-relaxed">{opener}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/*
              Links to the profile rather than firing a request. A first-
              class introduction flow is the next build; a button that
              looked like it sent one and did not would be worse than this.
            */}
            <Link
              href={`/network/${c.id}`}
              className="group inline-flex items-center gap-2 rounded-xl border border-halo-rule px-4 py-2 text-[13.5px] font-medium text-halo-ink hover:bg-halo-veil transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
            >
              See {c.firstName}&rsquo;s profile
              <ArrowRight className="h-3.5 w-3.5 arrow-slide group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Why there is nothing here.
 *
 * Three genuinely different situations, and conflating them is a small
 * dishonesty that costs trust: telling somebody to improve their profile
 * when the network is empty blames them for our problem.
 */
function Empty({ reason, pool }: { reason: DiscoverView['empty']; pool: number }) {
  const copy =
    reason === 'thin_profile'
      ? {
          title: 'Tell us a bit more first.',
          body: 'Mentable suggests people based on what you want to learn and where you are trying to get to. Right now there is not enough on your profile to go on.',
          cta: { href: '/profile/setup', label: 'Add what you’re working toward' },
        }
      : reason === 'no_overlap'
        ? {
            title: 'Nothing worth suggesting yet.',
            body: `We looked at ${pool} ${pool === 1 ? 'person' : 'people'} and could not find anyone whose experience lines up with what you are after. Rather than pad this page, we would rather say so.`,
            cta: { href: '/profile/setup', label: 'Adjust what you’re looking for' },
          }
        : {
            title: 'Nobody to suggest yet.',
            body: 'Mentable is onboarding its first members. As people join, this is where you will see who you should know and why — not a directory, a short list with reasons.',
            cta: null,
          };

  return (
    <div className="rounded-2xl border border-dashed border-halo-rule px-6 py-8">
      <p className="font-display text-[1.25rem] text-halo-ink">{copy.title}</p>
      <p className="text-[14.5px] text-halo-heather leading-relaxed mt-2 max-w-md">{copy.body}</p>
      {copy.cta && (
        <Link
          href={copy.cta.href}
          className="inline-block mt-5 rounded-xl bg-halo-purple px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
        >
          {copy.cta.label}
        </Link>
      )}
    </div>
  );
}
