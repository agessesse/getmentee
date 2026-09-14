'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shirt, Users, Plane, GraduationCap } from 'lucide-react';
import IntroSequence from '@/components/marketing/IntroSequence';
import LandingNav from '@/components/marketing/LandingNav';
import HeroPair from '@/components/marketing/HeroPair';
import MentorCarousel from '@/components/marketing/MentorCarousel';
import CredibilityRail from '@/components/marketing/CredibilityRail';
import ProblemSection from '@/components/marketing/ProblemSection';
import ProductDemo from '@/components/marketing/ProductDemo';
import TrajectoryViz from '@/components/marketing/TrajectoryViz';
import BrandDefinition from '@/components/marketing/BrandDefinition';
import InviteModal from '@/components/marketing/InviteModal';
import Wordmark from '@/components/ui/Wordmark';
import { trackLandingEvent } from '@/lib/landing-analytics';

// Not rendered here, and deliberately kept:
//   components/marketing/MenteeCarousel.tsx  a wall of other students' faces
//     turns a student's first impression into a comparison against peers. It
//     belongs on a mentor-facing page, where "who you would be helping" is
//     exactly the right question.
//   components/marketing/Flywheel.tsx  "it doesn't end with you" is the same
//     claim Trajectory and Outcomes already make, in a third form. Three
//     sections were arguing one point.

// Four peer outcomes. Hierarchy comes from label versus body, and the
// numbering gives the eye a reading order.
const OUTCOMES = [
  { label: 'Clarity',        body: 'See what the work is actually like before you spend years on it.' },
  { label: 'Preparation',    body: 'Walk in knowing what matters and what does not.' },
  { label: 'Accountability', body: 'Someone notices when you do not follow through.' },
  { label: 'Reciprocity',    body: 'Eventually become the person you once needed.' },
];

const FUND_ITEMS = [
  { icon: Shirt, label: 'Professional Attire', detail: 'Interview suit, tailoring, footwear' },
  { icon: Users, label: 'Networking', detail: 'Coffee chats, industry events' },
  { icon: Plane, label: 'Travel', detail: 'Interviews, career fairs, office visits' },
  { icon: GraduationCap, label: 'Career Development', detail: 'Certifications, prep resources' },
];

export default function LandingPage() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream-50 overflow-x-clip">
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <IntroSequence />
      <LandingNav />

      {/* Nav watches this to know when the hero has scrolled away */}
      <div id="nav-sentinel" className="absolute top-0 h-20 w-px" aria-hidden="true" />

      {/* ── 01. Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 sm:pt-36 pb-16 sm:pb-20 px-6 lg:px-10" aria-labelledby="hero-heading">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-12 lg:gap-16 items-center">
            <div>
              <h1
                id="hero-heading"
                className="font-serif text-navy-900 leading-[1.02] tracking-tight mb-7 max-w-3xl text-balance"
                style={{ fontSize: 'clamp(2.35rem, 6vw, 4.4rem)' }}
              >
                Find someone who has<br className="hidden sm:inline" />{' '}
                already done the job<br className="hidden sm:inline" />{' '}
                you want.
              </h1>

              <p className="text-lg sm:text-xl text-gray-500 font-light leading-relaxed max-w-lg mb-10">
                Mentable is where students find mentors a few steps ahead of
                them, and where the relationship keeps going after the
                introduction.
              </p>

              {/* Student path: filled, alone on its line, with the price answered
                  immediately underneath. The mentor path below is deliberately a
                  quiet sentence, so the two never read as a pair of buttons when
                  they stack on mobile. */}
              <div>
                <Link
                  href="/signup?role=mentee"
                  onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'hero_find_your_mentor' })}
                  className="group inline-flex items-center gap-2.5 bg-navy-900 text-white px-8 py-4 text-[15px] font-medium hover:bg-navy-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all rounded-xl shadow-sm hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
                >
                  Find your mentor
                  <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
                </Link>
                <p className="text-[13px] text-gray-500 mt-3.5">Free to join.</p>
              </div>

              <p className="text-[14px] text-gray-500 mt-7">
                Further along in your career?{' '}
                <Link
                  href="/signup?role=mentor"
                  onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'hero_become_a_mentor' })}
                  className="tap-target text-navy-600 font-medium underline underline-offset-2 decoration-gray-300 hover:text-navy-900 hover:decoration-navy-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-sm"
                >
                  Become a mentor
                </Link>
              </p>
            </div>

            <div className="hidden lg:block">
              <HeroPair />
            </div>
          </div>
        </div>
      </section>

      {/* ── 02. Problem ──────────────────────────────────────────────────────── */}
      <ProblemSection />

      {/* ── 03. Mentors ──────────────────────────────────────────────────────── */}
      <MentorCarousel />
      <CredibilityRail />

      {/* ── 04. Product ──────────────────────────────────────────────────────── */}
      <ProductDemo />

      {/* ── 05. Outcomes ─────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50 border-t border-gray-100" aria-labelledby="outcomes-heading">
        <div className="max-w-6xl mx-auto">
          <h2
            id="outcomes-heading"
            className="font-serif text-navy-900 leading-[1.05] mb-12 max-w-xl"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            What comes out of it.
          </h2>

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 lg:gap-x-10 gap-y-10">
            {OUTCOMES.map((o, i) => (
              <li key={o.label} className="border-t border-gray-200 pt-5">
                <span className="block text-[12px] font-semibold tabular-nums text-navy-600 mb-3">
                  0{i + 1}
                </span>
                <h3 className="font-serif text-navy-900 text-[26px] leading-none mb-2.5">
                  {o.label}
                </h3>
                <p className="text-gray-600 text-[15px] leading-relaxed">
                  {o.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 06. Trajectory ───────────────────────────────────────────────────── */}
      <TrajectoryViz />

      {/* ── 07. Origin ───────────────────────────────────────────────────────── */}
      {/* The definition lives here rather than in the hero. By this point a
          visitor knows what the product does, so the name lands as a reason
          instead of a riddle. */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-white" aria-labelledby="origin-heading">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr),minmax(0,360px)] gap-12 lg:gap-16 items-start">
            <div>
              <h2
                id="origin-heading"
                className="text-[11px] font-semibold text-navy-600 uppercase tracking-[0.22em] mb-5"
              >
                Why this exists
              </h2>

              <p className="font-serif text-navy-900 leading-[1.45] text-[21px] sm:text-[24px] max-w-xl">
                I&apos;m Abel, a student at UNC. The mentors who helped me most were
                people I met by accident: a chance introduction, a friend of a
                friend. That felt like a bad way to decide a career. So I started
                building what I wish had existed.
              </p>

              <p className="text-gray-600 text-[15px] leading-relaxed mt-5 max-w-xl">
                Mentable is early. The first mentors on it are people who actually
                helped me.
              </p>

              <div className="flex items-center gap-3 mt-8">
                <Image
                  src="/people/abel-gessesse.jpg"
                  alt=""
                  width={88}
                  height={88}
                  className="w-11 h-11 rounded-full object-cover flex-none"
                  style={{ objectPosition: '52% 15%' }}
                />
                <div>
                  <p className="text-[14px] font-semibold text-navy-900 leading-tight">
                    Abel Gessesse
                  </p>
                  <p className="text-[13px] text-gray-500 leading-tight mt-0.5">
                    Founder, Mentable
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:pl-12 lg:border-l lg:border-gray-200">
              <BrandDefinition />
              <p className="text-gray-500 text-[14px] leading-relaxed mt-6 max-w-sm">
                The name describes the student, not the mentor. Being worth
                someone&apos;s time is the part you control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 08. Opportunity Fund ─────────────────────────────────────────────── */}
      <section
        className="py-20 sm:py-24 px-6 lg:px-10 bg-navy-900"
        aria-labelledby="fund-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-[0.22em] mb-5">
                A Mentable initiative
              </p>
              <h2
                id="fund-heading"
                className="font-serif text-white leading-[1.08] mb-5"
                style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
              >
                Preparation shouldn&apos;t<br />depend on a budget.
              </h2>
              <p className="text-navy-200 leading-relaxed mb-4 font-light text-[15px] max-w-md">
                For students with demonstrated financial need, we&apos;re building a
                fund to remove the practical barriers between guidance and action.
              </p>
              <p className="text-navy-300 text-[14px] leading-relaxed mb-7">
                In pilot. We&apos;re building partnerships to fund the first cohort.
              </p>
              <Link
                href="/signup?role=mentee"
                onClick={() => trackLandingEvent('opportunity_fund_clicked')}
                className="group tap-target inline-flex items-center gap-2 text-sm font-medium text-white hover:text-amber-300 transition-colors border-b border-navy-700 hover:border-amber-400 pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
              >
                Create your Mentable account
                <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FUND_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="bg-navy-800/60 border border-navy-700/60 rounded-2xl p-4 hover:border-amber-400/40 hover:bg-navy-800 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-amber-400 mb-3" aria-hidden="true" />
                    <p className="text-[14px] font-semibold text-white leading-tight">{item.label}</p>
                    <p className="text-[12px] text-navy-300 mt-1 leading-snug">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 09. Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50" aria-labelledby="cta-heading">
        <div className="max-w-6xl mx-auto">
          <h2
            id="cta-heading"
            className="font-serif text-navy-900 leading-[1.03] mb-8 max-w-2xl"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}
          >
            You shouldn&apos;t need luck<br />to meet the right person.
          </h2>

          <Link
            href="/signup?role=mentee"
            onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'final_find_your_mentor' })}
            className="group inline-flex items-center gap-2.5 bg-navy-900 text-white px-8 py-4 text-[15px] font-semibold hover:bg-navy-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all rounded-xl shadow-sm hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
          >
            Find your mentor
            <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
          </Link>

          <p className="text-[14px] text-gray-500 mt-7">
            Further along in your career?{' '}
            <Link
              href="/signup?role=mentor"
              onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'final_i_want_to_mentor' })}
              className="tap-target text-navy-600 font-medium underline underline-offset-2 decoration-gray-300 hover:text-navy-900 hover:decoration-navy-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-sm"
            >
              Become a mentor
            </Link>
          </p>
          <p className="text-[14px] text-gray-500 mt-2.5">
            Know someone who should be here?{' '}
            <button
              onClick={() => setInviteOpen(true)}
              className="tap-target text-navy-600 font-medium underline underline-offset-2 decoration-gray-300 hover:text-navy-900 hover:decoration-navy-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-sm"
            >
              Invite them
            </button>
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-14 px-6 lg:px-10 bg-navy-900">
        <div className="max-w-6xl mx-auto">
          <div className="mb-9">
            <Wordmark size="lg" className="text-white" />
            <p className="text-navy-300 font-light mt-2 max-w-xs text-sm leading-relaxed">
              Find someone worth learning from. Become someone worth mentoring.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pt-7 border-t border-navy-800">
            {/* tap-target: these were 20px tall, under the 24px WCAG 2.5.8 minimum */}
            <div className="flex gap-7 text-sm text-navy-300">
              <Link href="/login" className="tap-target hover:text-white transition-colors">Sign in</Link>
              <Link href="/signup" className="tap-target hover:text-white transition-colors">Create account</Link>
            </div>
            <p className="text-sm text-navy-400">&copy; 2026 Mentable. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
