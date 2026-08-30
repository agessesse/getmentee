'use client';

// PLACEHOLDER: Illustrative profiles — not real users.
// Replace with verified content or keep as decorative before public launch.

interface FloatingProfileProps {
  name: string;
  title: string;
  company: string;
  role: 'Mentor' | 'Mentee';
  initials: string;
  color: string;
  floatClass: string;
  className?: string;
}

export default function FloatingProfile({
  name,
  title,
  company,
  role,
  initials,
  color,
  floatClass,
  className = '',
}: FloatingProfileProps) {
  return (
    <div
      className={`absolute hidden xl:flex items-center gap-3 bg-white/95 backdrop-blur-sm border border-gray-100 rounded-xl px-4 py-3 shadow-md ${floatClass} ${className}`}
      aria-hidden="true"
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-navy-900">{name}</span>
          <span
            className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
              role === 'Mentor'
                ? 'bg-navy-100 text-navy-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {role}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 truncate">{title} · {company}</p>
      </div>
    </div>
  );
}
