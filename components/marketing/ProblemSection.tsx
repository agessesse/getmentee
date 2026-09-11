const STEPS = [
  {
    label: 'Access',
    text: 'Successful people are findable. Professional networks have made that easier than ever.',
    accent: false,
  },
  {
    label: 'Connection',
    text: 'Getting the right person to respond — to you specifically — is harder.',
    accent: false,
  },
  {
    label: 'Relationship',
    text: 'Turning a good conversation into something ongoing and structured is harder still.',
    accent: false,
  },
  {
    label: 'Progress',
    text: 'Mentee is built for the distance between introduction and momentum.',
    accent: true,
  },
];

export default function ProblemSection() {
  return (
    <section
      className="py-20 px-6 lg:px-10 bg-white border-t border-gray-100"
      aria-labelledby="problem-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* Left: framing */}
          <div>
            <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-[0.22em] mb-4">
              Why Mentee exists
            </p>
            <h2
              id="problem-heading"
              className="font-bold text-navy-900 leading-tight mb-6"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}
            >
              Finding the right person<br className="hidden sm:block" /> is only the beginning.
            </h2>
            <p className="text-gray-500 font-light leading-relaxed text-[15px] mb-5">
              LinkedIn can show you who they are. Cold outreach might get you a response.
              But knowing how to reach the right person with genuine context, and then turning
              that conversation into an ongoing mentorship — that requires something different.
            </p>
            <p className="text-gray-400 font-light leading-relaxed text-[14px]">
              That&apos;s the gap Mentee is built to close.
            </p>
          </div>

          {/* Right: Access → Connection → Relationship → Progress vertical flow */}
          <div className="lg:pt-8">
            {STEPS.map((step, i) => (
              <div key={step.label} className="relative flex items-start gap-5">
                {/* Vertical connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    className="absolute left-[13px] top-7 w-px bg-gray-100"
                    style={{ height: 'calc(100% - 4px)' }}
                    aria-hidden="true"
                  />
                )}
                {/* Circle node */}
                <div
                  className={`w-7 h-7 rounded-full flex-none flex items-center justify-center mt-0.5 relative z-10 border ${
                    step.accent
                      ? 'bg-navy-900 border-navy-900'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold tabular-nums ${
                      step.accent ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </span>
                </div>
                {/* Content */}
                <div className={i < STEPS.length - 1 ? 'pb-8' : 'pb-0'}>
                  <p
                    className={`text-sm font-semibold mb-1 ${
                      step.accent ? 'text-navy-900' : 'text-gray-700'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-[13px] font-light leading-relaxed ${
                      step.accent ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
