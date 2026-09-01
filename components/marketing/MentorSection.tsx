import { FEATURED_MENTORS, type Mentor } from '@/data/mentors';
import MentorPortrait from './MentorPortrait';

// ─── Individual mentor profile ────────────────────────────────────────────────
function MentorProfile({
  mentor,
  reversed,
  index,
}: {
  mentor: Mentor;
  reversed: boolean;
  index: number;
}) {
  const hasVerifiedQuote = mentor.whyLabel === 'In their words';
  const isPlaceholder    =
    mentor.whyIMentor === 'Mentoring story coming soon.' ||
    mentor.shortBio    === 'Mentor profile coming soon.';

  return (
    <article className="grid grid-cols-1 lg:grid-cols-2 border-t border-gray-100">
      {/* Portrait */}
      <div className={`lg:h-[500px] ${reversed ? 'lg:order-2' : 'lg:order-1'}`}>
        <MentorPortrait
          name={mentor.name}
          headshot={mentor.headshot}
          initials={mentor.initials}
          accentColor={mentor.accentColor}
          priority={index === 0}
          imagePosition={mentor.imagePosition}
        />
      </div>

      {/* Content */}
      <div
        className={`flex flex-col justify-center px-8 py-10 lg:px-16 lg:py-14 lg:h-[500px] overflow-y-auto ${
          reversed ? 'lg:order-1' : 'lg:order-2'
        }`}
      >
        {/* Name + title/company */}
        <div className="mb-6">
          <h3 className="text-2xl md:text-3xl font-bold text-navy-900 mb-1">
            {mentor.name}
          </h3>
          {(mentor.title !== '—' || mentor.company !== '—') && (
            <p className="text-sm text-gray-400 font-medium">
              {[mentor.title, mentor.company].filter((v) => v !== '—').join(' · ')}
            </p>
          )}
        </div>

        {/* Bio */}
        <p className="text-gray-600 leading-relaxed mb-6 font-light text-[15px]">
          {mentor.shortBio}
        </p>

        {/* Why I Mentor — rendered only when there is real content */}
        {!isPlaceholder && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-[0.15em]">
                Why I mentor
              </p>
              {!hasVerifiedQuote && (
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.1em] border border-gray-200 rounded-full px-2 py-0.5">
                  Founder perspective
                </span>
              )}
            </div>

            {hasVerifiedQuote ? (
              // Verified direct quote — displayed as a blockquote
              <blockquote className="border-l-2 border-navy-300 pl-5">
                <p className="text-navy-900 text-[15px] leading-relaxed font-light italic">
                  &ldquo;{mentor.whyIMentor}&rdquo;
                </p>
              </blockquote>
            ) : (
              // Founder-written editorial copy — plain text, no quotation marks
              <div className="border-l-2 border-gray-200 pl-5">
                <p className="text-gray-700 text-[15px] leading-relaxed font-light">
                  {mentor.whyIMentor}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mentees mentored */}
        {mentor.menteesMentored && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
              Mentees mentored
            </p>
            <p className="text-3xl font-bold text-navy-900">{mentor.menteesMentored}</p>
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
export default function MentorSection() {
  return (
    <section aria-labelledby="mentors-heading">

      {/* Philosophy intro */}
      <div className="px-8 py-14 lg:py-20 max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold text-navy-600 uppercase tracking-[0.15em] mb-6">
          The people behind Mentee
        </p>
        <h2
          id="mentors-heading"
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy-900 leading-[1.1] mb-8"
        >
          Before Mentee was a platform,
          it was a pattern.
        </h2>
        <p className="text-gray-500 text-lg font-light leading-relaxed max-w-2xl mx-auto">
          Pivotal mentors showed up at pivotal moments — through guidance,
          advocacy, accountability, and access. Each one changed the
          trajectory of what was possible.
          <br className="hidden md:block" />
          <span className="block mt-4">
            Access to people like this should not depend on luck.
          </span>
        </p>
      </div>

      {/* Mentor profiles — alternating layout */}
      <div className="border-t border-gray-100">
        {FEATURED_MENTORS.map((mentor, i) => (
          <MentorProfile
            key={mentor.name}
            mentor={mentor}
            reversed={i % 2 === 1}
            index={i}
          />
        ))}
      </div>

      {/* Bridge into the product */}
      <div className="px-8 py-10 lg:py-12 max-w-2xl mx-auto text-center border-t border-gray-100">
        <p className="text-gray-400 text-base font-light leading-relaxed">
          The relationships that change trajectories shouldn&apos;t be left to chance.
          <br className="hidden md:block" />
          Mentee is how you find them.
        </p>
      </div>

    </section>
  );
}
