/**
 * What a mentor has to reconstruct before a conversation can start.
 *
 * The framing matters here and was set deliberately: none of these rows blame
 * the student. Every question is reasonable, the student is not at fault for
 * any of them, and the right-hand column is about where the answer currently
 * lives rather than about anyone failing to supply it. The argument is that the
 * information exists and is simply scattered.
 *
 * A definition list is the honest markup: each row really is a term and its
 * current value. It also keeps this visually distinct from the mentee page's
 * five-step rail, which is a sequence. This is not a sequence. These questions
 * arrive all at once, every time, which is the point.
 */

const ROWS = [
  ['Who is this again?',              'A message from six weeks ago'],
  ['What are they working toward?',   'Mentioned once, on a call'],
  ['What did we cover last time?',    'Your memory'],
  ['What did I suggest they do?',     'A note you meant to take'],
  ['Did any of it happen?',           'You will find out by asking'],
];

export default function ContextGap() {
  return (
    <dl className="max-w-3xl">
      {ROWS.map(([q, a]) => (
        <div
          key={q}
          className="grid grid-cols-1 sm:grid-cols-[1fr,1fr] gap-x-8 gap-y-1 py-4 border-t border-halo-rule last:border-b last:border-halo-rule"
        >
          <dt className="text-[15px] sm:text-[16px] font-medium text-halo-ink leading-snug">{q}</dt>
          <dd className="text-[14px] text-halo-mist-body font-light leading-relaxed">{a}</dd>
        </div>
      ))}
    </dl>
  );
}
