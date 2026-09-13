const GAPS = [
  {
    who: 'For students',
    problem: 'You know where you want to go. You don’t know who to ask.',
    detail:
      'Finding the name is easy. Knowing what to ask, how to ask it, and how to turn one reply into a relationship that keeps moving — that is the part nobody teaches.',
  },
  {
    who: 'For professionals',
    problem: 'You’re willing to help. Nobody built you a way to do it well.',
    detail:
      'Requests arrive with no context and no follow-through. There is no structure for mentoring someone consistently, so good intentions decay into unanswered messages.',
  },
];

export default function ProblemSection() {
  return (
    <section
      className="py-20 sm:py-24 px-6 lg:px-10 bg-white border-t border-gray-100"
      aria-labelledby="problem-heading"
    >
      <div className="max-w-6xl mx-auto">

        {/* Editorial statement */}
        <div className="max-w-3xl mb-14">
          <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-6">
            The problem
          </p>
          <h2
            id="problem-heading"
            className="font-serif text-navy-900 leading-[1.08] mb-6"
            style={{ fontSize: 'clamp(2.1rem, 5vw, 3.4rem)' }}
          >
            Right now, mentorship<br className="hidden sm:block" /> mostly depends on luck.
          </h2>
          <p className="text-gray-500 font-light leading-relaxed text-[16px] max-w-xl">
            Who your parents know. Which alumni answered. Whether the person
            across the table happened to take an interest. That is a bad system
            for something this consequential — and it fails both sides of it.
          </p>
        </div>

        {/* Two-sided failure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
          {GAPS.map((gap) => (
            <div key={gap.who} className="bg-white p-7 sm:p-9">
              <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-[0.2em] mb-4">
                {gap.who}
              </p>
              <p className="text-navy-900 font-semibold text-[17px] leading-snug mb-3">
                {gap.problem}
              </p>
              <p className="text-gray-500 font-light text-[14px] leading-relaxed">
                {gap.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Resolution */}
        <p className="mt-10 text-navy-800 font-light text-[17px] leading-relaxed max-w-xl">
          Mentable exists to close both gaps at once — by connecting people
          willing to teach with people genuinely ready to learn, and giving the
          relationship somewhere to go after the first conversation.
        </p>

      </div>
    </section>
  );
}
