import MentableMark from '@/components/ui/MentableMark';
import { BRAND } from '@/components/ui/Wordmark';
import type { TenantIdentity } from '@/lib/theme/identity';

/**
 * Who you are in, and whose software it is.
 *
 * THE HIERARCHY IS THE POINT, and it is three levels, deliberately unequal:
 *
 *   Carolina Alumni Mentorship     the thing the participant joined
 *   Finance Access · Fall 2026     where in it they are
 *   Powered by Mentable            the infrastructure, and smaller
 *
 * An institution's identity provides context. It does not get to take over
 * the interface: the relationship stays visually dominant everywhere else,
 * and this block is the one place per screen that says whose programme this
 * is. No crest, no seal, no athletics mark, no imported logo of any kind,
 * here or anywhere else in the application. Hierarchy is made with typography
 * and the tenant's own colour, which is all it has ever needed.
 *
 * With no tenant this renders the Mentable lockup and nothing else, which is
 * every individual relationship on the platform today.
 */
export default function ProgramIdentity({
  tenant,
  compact = false,
}: {
  tenant: TenantIdentity | null;
  compact?: boolean;
}) {
  if (!tenant) {
    return (
      <span className="inline-flex items-center gap-[0.5em] text-xl text-halo-ink">
        <MentableMark size={compact ? 22 : 26} className="flex-none" />
        <span className="font-bold tracking-tight">{BRAND}</span>
      </span>
    );
  }

  // The programme line only appears when there is a programme to name. A
  // bare separator with nothing after it reads as a loading failure.
  const where = [tenant.programName, tenant.term].filter(Boolean).join(' · ');

  return (
    <div className="min-w-0">
      {/*
        Wraps to two lines rather than truncating. "Carolina Alumni
        Mentorship" is 26 characters and the side panel is 240px wide, so
        `truncate` rendered it as "Carolina Alumni Mentors...", which is a
        worse failure than a second line: the one string on screen that tells
        a participant whose programme they are in was the string being cut.
        Two lines, then ellipsis, for the genuinely long outlier.
      */}
      <p
        className={`font-display text-halo-ink leading-tight ${
          compact ? 'text-[15px] truncate' : 'text-[17px] line-clamp-2'
        }`}
      >
        {tenant.displayName}
      </p>
      {where && (
        <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.13em] text-halo-mist-body mt-0.5 truncate">
          {where}
        </p>
      )}
      {!compact && (
        <p className="flex items-center gap-1.5 mt-2.5 text-[11px] text-halo-mist-body">
          <MentableMark size={13} className="flex-none" />
          Powered by {BRAND}
        </p>
      )}
    </div>
  );
}

/**
 * The disclaimer that travels with the branding.
 *
 * It is a column on the organisation (migration 0031), not a string in this
 * file, precisely so it cannot be rendered in one place and forgotten in
 * another: any surface showing a tenant's identity reads its notice from the
 * same row. For the Carolina example it reads "Illustrative Carolina
 * deployment powered by Mentable. Mentable currently has no agreement with
 * UNC-Chapel Hill."
 *
 * Quiet, not hidden. It sits at the end of the content on every authenticated
 * screen, and in the side navigation where it is visible without scrolling.
 */
export function TenantNotice({
  notice,
  className = '',
}: {
  notice: string;
  className?: string;
}) {
  return (
    <p className={`text-[11px] leading-relaxed text-halo-mist-body ${className}`}>
      {notice}
    </p>
  );
}
