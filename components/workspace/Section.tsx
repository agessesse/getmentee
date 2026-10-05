/**
 * The workspace's one structural primitive.
 *
 * Every band is a heading written in human language, an optional quiet
 * action on the right, and content. Not a card. Cards everywhere flatten
 * hierarchy: when each of five sections sits in its own rounded box with its
 * own border and shadow, nothing is more important than anything else, and
 * the whole page reads as a settings screen. Here the sections are separated
 * by space and a hairline, and exactly one thing on the page -- What's next
 * -- is allowed to be a filled surface.
 */
export default function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-7 border-t border-halo-rule first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="font-display text-[1.25rem] leading-tight text-halo-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * What an empty band says.
 *
 * Never "No goals yet." An empty state is the only instruction a new
 * relationship gets, so each one says what this part of the product is for
 * and offers the single next step. The brief's rule, applied literally:
 * every empty state explains what happens next.
 */
export function Empty({
  line,
  children,
}: {
  line: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-halo-rule px-5 py-6">
      <p className="text-[14.5px] text-halo-heather leading-relaxed max-w-md">{line}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
