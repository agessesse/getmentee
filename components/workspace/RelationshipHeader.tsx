import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { MessageSquare } from 'lucide-react';
import type { PartnerDetail } from '@/lib/mentorship/workspace-data';
import type { TenantIdentity } from '@/lib/theme/identity';

/**
 * Who we are, in about six lines.
 *
 * COMPACT ON PURPOSE. The obvious version of this is a full-bleed profile
 * hero with a 96px avatar and a bio, which pushes the actual work below the
 * fold on a phone and makes the relationship look like a directory entry.
 * The relationship matters more than the decoration, so the header earns
 * roughly one screen-inch and then gets out of the way.
 *
 * For an individual mentorship (cohort_id IS NULL) the programme lines are
 * simply absent. Nothing is invented to fill the space, and the header reads
 * correctly either way: it was designed for both, not adapted to one.
 */
export default function RelationshipHeader({
  partner,
  viewerName,
  tenant,
  startedAt,
}: {
  partner: PartnerDetail;
  /*
    Full name, matching the partner's. "Maya + Sarah Thompson" reads as a
    typo; a pairing has to name both people the same way.
  */
  viewerName: string;
  tenant: TenantIdentity | null;
  startedAt: string;
}) {
  const since = new Date(startedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const where = [tenant?.programName, tenant?.term].filter(Boolean).join(' · ');

  return (
    <header className="mb-8">
      {/* The pairing, named as a pairing. Both people, in one line. */}
      <p className="font-display text-[1.6rem] sm:text-[1.9rem] leading-tight text-halo-ink">
        {viewerName} <span className="text-halo-mist-strong">+</span> {partner.fullName}
      </p>

      {tenant && (
        <p className="mt-1.5 text-[13px] text-halo-heather">
          {tenant.displayName}
          {where && <span className="text-halo-mist-body"> · {where}</span>}
        </p>
      )}

      <div className="mt-5 flex items-start gap-3.5">
        <Avatar src={partner.avatarUrl} name={partner.fullName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-halo-ink leading-snug">{partner.fullName}</p>
          {partner.role && (
            <p className="text-[13.5px] text-halo-heather leading-snug mt-0.5">
              {partner.role}
              {partner.company && <span className="text-halo-mist-body"> · {partner.company}</span>}
            </p>
          )}
          {partner.education && (
            <p className="text-[13px] text-halo-mist-body leading-snug mt-0.5">{partner.education}</p>
          )}
          <p className="text-[12.5px] text-halo-mist-body mt-2">Active since {since}</p>
        </div>

        {/*
          Messaging is not rebuilt in here. The workspace organises the
          mentorship; the existing thread remains the place two people
          actually talk, and this is the door to it.
        */}
        <Link
          href="/messages"
          className="flex-none inline-flex items-center gap-2 rounded-xl border border-halo-rule px-3.5 py-2 text-[13.5px] font-medium text-halo-ink hover:bg-halo-veil transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
        >
          <MessageSquare className="h-4 w-4 text-halo-brand-text" aria-hidden="true" />
          <span className="hidden sm:inline">Message {partner.firstName}</span>
          <span className="sm:hidden">Message</span>
        </Link>
      </div>

      {partner.canHelpWith.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {partner.canHelpWith.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-halo-veil border border-halo-rule px-2.5 py-1 text-[11.5px] text-halo-heather"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
