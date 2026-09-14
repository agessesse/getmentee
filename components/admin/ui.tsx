import Link from 'next/link';

/** Shared admin primitives. Compact, legible, no decoration. */

export function Stat({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: number | string | null;
  sub?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-[12px] font-medium text-gray-600">{label}</p>
      <p className="text-[26px] font-semibold tabular-nums text-navy-900 leading-none mt-1.5">
        {value === null
          ? <span className="text-[15px] font-normal text-amber-700">Unavailable</span>
          : value}
      </p>
      {sub && <p className="text-[12px] text-gray-600 mt-1.5">{sub}</p>}
    </>
  );

  const cls =
    'block bg-white border border-gray-200 rounded-lg p-4 ' +
    (href ? 'hover:border-navy-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500' : '');

  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
        <h2 className="text-[13px] font-semibold text-navy-900">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-8 text-[14px] text-gray-600 text-center">{children}</p>;
}

const TONES = {
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  green: 'bg-sage-50 text-sage-700 border-sage-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  red: 'bg-red-50 text-red-800 border-red-200',
  blue: 'bg-navy-50 text-navy-800 border-navy-200',
} as const;

/**
 * Status is conveyed by the label text itself, not by colour alone, so it
 * still reads for colour-blind users and in monochrome.
 */
export function Tag({ tone = 'neutral', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={`text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-600 px-4 py-2.5 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 text-[13px] text-navy-900 align-middle ${className}`}>{children}</td>;
}
