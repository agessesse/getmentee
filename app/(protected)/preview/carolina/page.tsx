import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = { title: 'Carolina preview', robots: { index: false, follow: false } };

/**
 * What can be previewed, and what does not need to be.
 *
 * The organisation experience is deliberately NOT a preview. The signed-in
 * platform admin is a genuine owner of the Carolina organisation
 * (organization_members), so /organization is real, authorized access to a
 * real tenant. Faking it would be less accurate, not more.
 */
const ROLES = [
  {
    href: '/preview/carolina/student',
    title: 'Student',
    body: 'Maya’s mentorship: what she is working toward, what she owes, and the conversation she is preparing for.',
  },
  {
    href: '/preview/carolina/mentor',
    title: 'Mentor',
    body: 'The same relationship from Sarah’s side: what Maya needs, what she asked, and what has moved since they spoke.',
  },
];

export default function CarolinaPreviewIndex() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-[1.9rem] leading-tight text-halo-ink">
        Carolina Alumni Mentorship
      </h1>
      <p className="text-[15px] text-halo-heather leading-relaxed mt-2 max-w-md">
        The product as a Carolina participant would see it. Everything below renders the
        real interface with illustrative people.
      </p>

      <ul className="mt-8 space-y-3">
        {ROLES.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="group flex items-start gap-4 rounded-2xl border border-halo-rule p-5 hover:bg-halo-veil transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
            >
              <span className="flex-1 min-w-0">
                <span className="block font-display text-[1.15rem] text-halo-ink">{r.title}</span>
                <span className="block text-[13.5px] text-halo-heather leading-relaxed mt-1">{r.body}</span>
              </span>
              <ArrowRight className="h-4 w-4 flex-none text-halo-brand-text mt-1.5 arrow-slide group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl border border-halo-rule p-5">
        <p className="font-display text-[1.15rem] text-halo-ink">Organization</p>
        <p className="text-[13.5px] text-halo-heather leading-relaxed mt-1">
          Not a preview. You are a genuine owner of this organization, so the real
          surface is the accurate one. People, Matching and Invitations arrive in the
          next pass.
        </p>
        <Link
          href="/organization"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-halo-brand-text underline underline-offset-2 hover:text-halo-ink transition-colors mt-3"
        >
          Open your organization
        </Link>
      </div>
    </div>
  );
}
