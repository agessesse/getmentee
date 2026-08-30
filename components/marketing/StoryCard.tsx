// PLACEHOLDER: Replace featuredStories data with verified production content before public launch.
// These are illustrative profiles — not real users.

interface StoryCardProps {
  name: string;
  role: 'Mentor' | 'Mentee';
  company: string;
  title: string;
  focus: string;
  quote: string;
  initials: string;
  color: string;
}

export default function StoryCard({
  name,
  role,
  company,
  title,
  focus,
  quote,
  initials,
  color,
}: StoryCardProps) {
  return (
    <article className="flex-shrink-0 w-72 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm select-none">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-navy-900 truncate">{name}</span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                role === 'Mentor'
                  ? 'bg-navy-100 text-navy-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {role}
            </span>
          </div>
          <p className="text-xs text-gray-400 truncate">{title} · {company}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-3">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="text-[10px] text-navy-600 font-medium bg-navy-50 px-2.5 py-1 rounded-full inline-block">
        {focus}
      </div>
    </article>
  );
}
