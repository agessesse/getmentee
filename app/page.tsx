import Link from 'next/link';
import { ArrowRight, CheckCircle, Star, Users, Calendar, MessageSquare, TrendingUp, Shield } from 'lucide-react';

const MENTOR_LOGOS = [
  { name: 'Goldman Sachs', abbr: 'GS' },
  { name: 'McKinsey & Company', abbr: 'McK' },
  { name: 'Blackstone', abbr: 'BX' },
  { name: 'Sequoia Capital', abbr: 'SEQ' },
  { name: 'JPMorgan', abbr: 'JPM' },
  { name: 'BCG', abbr: 'BCG' },
  { name: 'KKR', abbr: 'KKR' },
  { name: 'Google', abbr: 'GOOG' },
];

const STATS = [
  { value: '500+', label: 'Verified Mentors' },
  { value: '94%', label: 'Offer Rate' },
  { value: '40+', label: 'Top Firms' },
  { value: '2,000+', label: 'Sessions Completed' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create your profile',
    description: 'Tell us about your background, goals, and where you want to be. Takes under 5 minutes.',
  },
  {
    step: '02',
    title: 'Get matched',
    description: 'Our matching algorithm surfaces mentors based on your specific goals, industry, and career stage.',
  },
  {
    step: '03',
    title: 'Send a request',
    description: 'Reach out to mentors with a personalized note about why you want to connect.',
  },
  {
    step: '04',
    title: 'Start growing',
    description: 'Meet 1:1, work through goals, track action items, and build a relationship that lasts.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'I went from knowing nobody in finance to landing a Goldman Sachs offer in 4 months. My mentor was everything — real advice, real connections.',
    name: 'Jordan T.',
    detail: 'UNC Chapel Hill → Goldman Sachs IBD',
    initials: 'JT',
  },
  {
    quote: 'Case prep with someone who went through McKinsey recruiting a year ago is completely different from any book or app. You can\'t replicate that.',
    name: 'Maya W.',
    detail: 'Darden MBA → McKinsey & Company',
    initials: 'MW',
  },
  {
    quote: 'I was stuck between Big 4 and IB. My mentor had done both. Three sessions later I had a plan — and a job offer.',
    name: 'Ethan R.',
    detail: 'Georgia Tech → Stripe PM',
    initials: 'ER',
  },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Curated mentor network',
    description: 'Every mentor is a verified professional at a top firm. No random freelancers.',
  },
  {
    icon: TrendingUp,
    title: 'Matching that works',
    description: 'We surface mentors based on your goals, school, industry, and career stage — not just keywords.',
  },
  {
    icon: Calendar,
    title: 'Structured sessions',
    description: 'Set agendas, track goals, capture action items. Every session moves you forward.',
  },
  {
    icon: MessageSquare,
    title: 'Async messaging',
    description: 'Ask questions between sessions. Your mentor is in your corner throughout the process.',
  },
  {
    icon: CheckCircle,
    title: 'Goal tracking',
    description: 'Define your goals, set milestones, and see your progress over time.',
  },
  {
    icon: Shield,
    title: 'Private and secure',
    description: 'Your conversations stay between you and your mentor. Always.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-navy-900 tracking-tight">Mentee</span>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-navy-900 transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-navy-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy-800 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-navy-50 text-navy-700 text-xs font-medium px-3 py-1.5 rounded-full mb-8 border border-navy-100">
            <span className="w-1.5 h-1.5 bg-navy-600 rounded-full" />
            500+ mentors at Goldman, McKinsey, Blackstone, and beyond
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-navy-900 leading-[1.05] tracking-tight mb-8">
            Find the mentor{' '}
            <span className="relative">
              <span className="relative z-10">who changes</span>
              <span
                aria-hidden="true"
                className="absolute bottom-2 left-0 right-0 h-3 bg-navy-100 -z-10 -rotate-1"
              />
            </span>{' '}
            everything.
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-12 font-light">
            Mentee connects ambitious students and early-career professionals
            with verified mentors at the firms they want to join.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-navy-900 text-white px-8 py-4 rounded-xl font-medium text-base hover:bg-navy-800 transition-colors"
            >
              Find your mentor
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 text-navy-900 px-8 py-4 rounded-xl font-medium text-base hover:bg-gray-50 transition-colors"
            >
              Become a mentor
            </Link>
          </div>
        </div>
      </section>

      {/* Firm logos */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-medium text-gray-400 uppercase tracking-widest mb-8">
            Mentors from
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {MENTOR_LOGOS.map((firm) => (
              <span
                key={firm.abbr}
                className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-default"
              >
                {firm.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-navy-900 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-navy-900 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-navy-300 text-lg font-light">From signup to your first session in under a week.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="relative">
                <div className="text-6xl font-bold text-navy-700 mb-4 leading-none">{step.step}</div>
                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-navy-300 text-sm leading-relaxed font-light">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">
              Built for serious outcomes
            </h2>
            <p className="text-gray-500 text-lg font-light max-w-xl mx-auto">
              Not a directory. Not a marketplace. A platform designed to create
              meaningful, long-term mentor relationships.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="p-6 rounded-2xl border border-gray-100 hover:border-navy-100 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-navy-700" />
                  </div>
                  <h3 className="font-semibold text-navy-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-cream-50">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 text-center">
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900">
              Stories from the platform
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
                <p className="text-gray-700 text-sm leading-relaxed mb-6 font-light">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-navy-700">{t.initials}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-navy-900">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-navy-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to find your mentor?
          </h2>
          <p className="text-navy-300 text-lg font-light mb-10 max-w-xl mx-auto">
            Join thousands of students and professionals who found their edge through the right relationship.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-navy-900 px-10 py-4 rounded-xl font-semibold text-base hover:bg-gray-100 transition-colors"
          >
            Get started — it&apos;s free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-navy-500 text-sm mt-6">No credit card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-navy-900 tracking-tight">Mentee</span>
          <div className="flex gap-8 text-sm text-gray-400">
            <Link href="/login" className="hover:text-navy-900 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-navy-900 transition-colors">Create account</Link>
          </div>
          <p className="text-sm text-gray-400">&copy; 2026 Mentee. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
