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
  const isPlaceholder =
    mentor.whyIMentor === 'Mentoring story coming soon.' ||
    mentor.shortBio === 'Mentor profile coming soon.';

  return (
    <article className="grid grid-cols-1 lg:grid-cols-2 border-t border-gray-100">
      {/* Portrait — subtle scale on hover */}
      <div
        className={`lg:h-[620px] overflow-hidden ${reversed ? 'lg:order-2' : 'lg:order-1'}`}
      >
        <div className="w-full h-full portrait-hover">
          <MentorPortrait
            name={mentor.name}
            headshot={mentor.headshot}
            initials={mentor.initials}
            accentColor={mentor.accentColor}
            priority={index === 0}
            imagePosition={mentor.imagePosition}
          />
        </div>
      </div>

      {/* Content */}
      <div
        className={`flex flex-col justify-center px-8 py-12 lg:px-16 lg:py-16 ${
          reversed ? 'lg:order-1' : 'lg:order-2'
        }`}
      >
        {/* Name + title */}
        <div className="mb-7">
          <h3
            className="font-bold text-navy-900 mb-1.5 leading-tight"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
          >
            {mentor.name}
          </h3>
          {(mentor.title !== '—' || mentor.company !== '—') && (
            <p className="text-sm text-gray-400 font-medium">
              {[mentor.title, mentor.company].filter((v) => v !== '—').join(' · ')}
            </p>
          )}
        </div>

        {/* Bio */}
        <p className="text-gray-600 leading-relaxed mb-7 font-light text-[15px]">
          {mentor.shortBio}
        </p>

        {/* Why I Mentor */}
        {!isPlaceholder && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-[0.18em]">
                Why I mentor
              </p>
              {!hasVerifiedQuote && (
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.1em] border border-gray-200 rounded-full px-2 py-0.5">
                  Founder perspective
                </span>
              )}
            </div>

            {hasVerifiedQuote ? (
              <blockquote className="border-l-2 border-navy-200 pl-5">
                <p className="text-navy-900 text-[15px] leading-relaxed font-light italic">
                  &ldquo;{mentor.whyIMentor}&rdquo;
                </p>
              </blockquote>
            ) : (
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

      {/* Philosophy intro — left-aligned on desktop */}
      <div className="px-6 lg:px-10 py-16 lg:py-24 max-w-6xl mx-auto">
        <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-6">
          The people behind Mentee
        </p>
        <h2
          id="mentors-heading"
          className="font-bold text-navy-900 leading-[1.05] mb-8 max-w-3xl"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          Before Mentee was a platform,<br className="hidden md:block" />
          it was a pattern.
        </h2>
        <p className="text-gray-500 text-lg font-light leading-relaxed max-w-2xl">
          Pivotal mentors showed up at pivotal moments — through guidance,
          advocacy, accountability, and access. Each one changed the
          trajectory of what was possible.
        </p>
        <p className="text-gray-400 text-base font-light leading-relaxed max-w-xl mt-5">
          Access to people like this should not depend on luck.
        </p>
      </div>

      {/* Mentor profiles — alternating layout, full-bleed */}
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
      <div className="px-6 lg:px-10 py-12 lg:py-16 max-w-6xl mx-auto border-t border-gray-100">
        <p className="text-gray-400 text-lg font-light leading-relaxed max-w-xl">
          The relationships that change trajectories shouldn&apos;t be left to chance.
          Mentee is how you find them.
        </p>
      </div>

    </section>
  );
}
