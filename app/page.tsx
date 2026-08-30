import Link from 'next/link';
import { ArrowRight, CheckCircle, Star, Users, Calendar, MessageSquare, TrendingUp, Shield } from 'lucide-react';
import IntroSequence from '@/components/marketing/IntroSequence';
import FloatingProfile from '@/components/marketing/FloatingProfile';
import StoryCarousel from '@/components/marketing/StoryCarousel';
import MatchPreview from '@/components/marketing/MatchPreview';
import LifecycleSection from '@/components/marketing/LifecycleSection';

// PLACEHOLDER: Firm names reflect where seed/demo mentors work.
// They do NOT imply partnership, endorsement, or affiliation with these firms.
// Replace with actual mentor employer data before public launch.
const MENTOR_FIRMS = [
  'Goldman Sachs',
  'McKinsey & Company',
  'Blackstone',
  'Sequoia Capital',
  'JPMorgan',
  'BCG',
  'KKR',
  'Google',
];

// PLACEHOLDER: These statistics are not backed by verified production data.
// Replace with real Supabase-derived metrics before public launch.
const STATS = [
  { value: '500+', label: 'Mentors' },
  { value: '40+', label: 'Top Firms' },
  { value: '4.9', label: 'Avg. Session Rating' },
  { value: '< 48h', label: 'Avg. First Response' },
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

// PLACEHOLDER: These testimonials are illustrative — not verified real-user stories.
// Replace with consent-confirmed, real user quotes before public launch.
const TESTIMONIALS = [
  {
    quote: 'I went from knowing nobody in finance to landing an offer in four months. My mentor gave me real advice, real context, real connections.',
    name: 'Jordan T.',
    detail: 'UNC Chapel Hill → Investment Banking',
    initials: 'JT',
  },
  {
    quote: 'Case prep with someone who went through consulting recruiting a year ago is completely different from any book or app. You can\'t replicate that.',
    name: 'Maya W.',
    detail: 'MBA → Strategy Consulting',
    initials: 'MW',
  },
  {
    quote: 'I was stuck between two career paths. My mentor had done both. Three sessions later I had a plan — and an offer.',
    name: 'Ethan R.',
    detail: 'Georgia Tech → Product Management',
    initials: 'ER',
  },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Curated mentor network',
    description: 'Mentors are professionals at leading firms — not random freelancers.',
  },
  {
    icon: TrendingUp,
    title: 'Matching that explains itself',
    description: 'We surface mentors based on your goals, school, industry, and career stage — and show you exactly why they match.',
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

// Floating hero profile data — illustrative, not real users
const FLOATING_PROFILES = [
  {
    name: 'Marcus W.',
    title: 'VP, Investment Banking',
    company: 'Morgan Stanley',
    role: 'Mentor' as const,
    initials: 'MW',
    color: '#1a1f3a',
    floatClass: 'animate-float-a',
    className: 'top-20 -left-8',
  },
  {
    name: 'Priya N.',
    title: 'Finance, Class of 2026',
    company: 'University of Virginia',
    role: 'Mentee' as const,
    initials: 'PN',
    color: '#3d4a8f',
    floatClass: 'animate-float-b',
    className: '-top-4 right-0',
  },
  {
    name: 'James L.',
    title: 'Associate',
    company: 'Bain Capital',
    role: 'Mentor' as const,
    initials: 'JL',
    color: '#5265b0',
    floatClass: 'animate-float-c',
    className: 'bottom-8 -right-6',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Intro sequence — client component, session-gated, aria-hidden */}
      <IntroSequence />

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
        <div className="max-w-5xl mx-auto">
          {/* Floating profiles sit beside the hero on xl screens */}
          <div className="relative">
            {FLOATING_PROFILES.map((p) => (
              <FloatingProfile key={p.name} {...p} />
            ))}

            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-navy-50 text-navy-700 text-xs font-medium px-3 py-1.5 rounded-full mb-8 border border-navy-100">
                <span className="w-1.5 h-1.5 bg-navy-600 rounded-full" aria-hidden="true" />
                Mentors from Goldman, McKinsey, Blackstone, and beyond
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
                with experienced mentors who have already traveled the path they want to pursue.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-navy-900 text-white px-8 py-4 rounded-xl font-medium text-base hover:bg-navy-800 transition-colors"
                >
                  Find your mentor
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 border border-gray-200 text-navy-900 px-8 py-4 rounded-xl font-medium text-base hover:bg-gray-50 transition-colors"
                >
                  Become a mentor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Firm strip */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-medium text-gray-400 uppercase tracking-widest mb-8">
            Our mentors work at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {MENTOR_FIRMS.map((firm) => (
              <span
                key={firm}
                className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-default"
              >
                {firm}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Story Carousel */}
      <StoryCarousel />

      {/* Stats */}
      <section className="py-20 px-6 bg-white">
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

      {/* Matching preview */}
      <section className="py-24 px-6 bg-navy-900">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-navy-400 uppercase tracking-widest mb-4">
                Intelligent matching
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                More than a search bar.
              </h2>
              <p className="text-navy-300 font-light leading-relaxed mb-8">
                Mentee doesn&apos;t just list mentors. It helps you understand exactly why
                a particular person could be relevant to your goals — so your first message
                isn&apos;t cold, it&apos;s informed.
              </p>
              <ul className="space-y-3">
                {[
                  'Match on industry, school, goals, and career stage',
                  'See a clear explanation of why each mentor fits',
                  'Filter by availability, format, and focus area',
                  'Save mentors you want to revisit',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-navy-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm text-navy-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center lg:justify-end">
              <MatchPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Lifecycle */}
      <LifecycleSection />

      {/* How it works */}
      <section className="py-24 px-6 bg-navy-900 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-navy-300 text-lg font-light">From signup to your first session in under a week.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step}>
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
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl border border-gray-100 hover:border-navy-100 hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-navy-700" aria-hidden="true" />
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
            <div className="flex justify-center gap-1 mb-4" aria-hidden="true">
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
                  <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
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
            Join students and professionals building meaningful relationships with mentors
            who have already traveled their path.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-navy-900 px-10 py-4 rounded-xl font-semibold text-base hover:bg-gray-100 transition-colors"
          >
            Get started — it&apos;s free
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
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
