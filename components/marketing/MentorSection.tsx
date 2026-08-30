import { FEATURED_MENTORS, type Mentor } from '@/data/mentors';
import MentorPortrait from './MentorPortrait';

function MentorProfile({ mentor, reversed, index }: { mentor: Mentor; reversed: boolean; index: number }) {
  return (
    <article className="grid grid-cols-1 lg:grid-cols-2 border-t border-gray-100">
      {/* Portrait */}
      <div
        className={`lg:h-[580px] ${reversed ? 'lg:order-2' : 'lg:order-1'}`}
      >
        <MentorPortrait
          name={mentor.name}
          headshot={mentor.headshot}
          initials={mentor.initials}
          accentColor={mentor.accentColor}
          priority={index === 0}
        />
      </div>

      {/* Content */}
      <div
        className={`flex flex-col justify-center px-8 py-14 lg:px-16 lg:py-20 lg:h-[580px] overflow-y-auto ${
          reversed ? 'lg:order-1' : 'lg:order-2'
        }`}
      >
        {/* Name + role */}
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

        {/* Short bio */}
        <p className="text-gray-600 leading-relaxed mb-10 font-light text-[15px]">
          {mentor.shortBio}
        </p>

        {/* Why I mentor */}
        <div className="mb-10">
          <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-[0.15em] mb-4">
            Why I mentor
          </p>
          <blockquote className="border-l-2 border-navy-200 pl-5">
            <p className="text-navy-900 text-[15px] leading-relaxed font-light italic">
              {mentor.whyIMentor}
            </p>
          </blockquote>
        </div>

        {/* Mentees mentored */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
            Mentees mentored
          </p>
          {mentor.menteesMentored ? (
            <p className="text-3xl font-bold text-navy-900">{mentor.menteesMentored}</p>
          ) : (
            <p className="text-2xl font-bold text-gray-300">—</p>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MentorSection() {
  return (
    <section aria-labelledby="mentors-heading">
      {/* Philosophy intro */}
      <div className="px-8 py-20 lg:py-28 max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold text-navy-600 uppercase tracking-[0.15em] mb-6">
          The people behind Mentee
        </p>
        <h2
          id="mentors-heading"
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy-900 leading-[1.1] mb-8"
        >
          Behind every trajectory is someone who helped change it.
        </h2>
        <p className="text-gray-500 text-lg font-light leading-relaxed">
          The people who shape our careers shouldn&apos;t be left to chance.
          Mentee was built around that belief — and these are the mentors who
          made us want to build it.
        </p>
      </div>

      {/* Mentor profiles */}
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
    </section>
  );
}
