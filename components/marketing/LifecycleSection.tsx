import {
  Search,
  MessageSquare,
  Calendar,
  Target,
  TrendingUp,
} from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    label: 'Match',
    description: 'Discover mentors based on your goals, industry, and career stage.',
  },
  {
    icon: MessageSquare,
    label: 'Connect',
    description: 'Send a request with a personal note. Start a conversation.',
  },
  {
    icon: Calendar,
    label: 'Meet',
    description: 'Schedule structured 1:1 sessions with agendas built in.',
  },
  {
    icon: Target,
    label: 'Act',
    description: 'Set goals and action items. Leave every session with next steps.',
  },
  {
    icon: TrendingUp,
    label: 'Grow',
    description: 'Track your progress. Build the relationship over time.',
  },
];

export default function LifecycleSection() {
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-navy-600 uppercase tracking-widest mb-3">
            Not a directory. A relationship.
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">
            Mentee supports every step.
          </h2>
          <p className="text-gray-500 font-light max-w-xl mx-auto">
            Finding a mentor is just the beginning. Mentee gives you the tools to build
            a relationship that actually changes your trajectory.
          </p>
        </div>

        {/* Desktop: horizontal connected steps */}
        <div className="hidden md:flex items-start gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex-1 flex flex-col items-center text-center relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute top-6 left-1/2 w-full h-px bg-gradient-to-r from-navy-200 to-navy-100"
                  />
                )}
                <div className="relative z-10 w-12 h-12 rounded-full bg-white border-2 border-navy-200 flex items-center justify-center mb-4 shadow-sm">
                  <Icon className="w-5 h-5 text-navy-700" aria-hidden="true" />
                </div>
                <span className="text-sm font-bold text-navy-900 mb-2">{step.label}</span>
                <p className="text-xs text-gray-500 leading-relaxed px-2">{step.description}</p>
              </div>
            );
          })}
        </div>

        {/* Mobile: vertical list */}
        <div className="flex md:hidden flex-col gap-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-navy-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon className="w-4 h-4 text-navy-700" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-sm font-bold text-navy-900 block mb-1">{step.label}</span>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
