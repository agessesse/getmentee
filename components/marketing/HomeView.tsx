'use client';

import Link from 'next/link';
import { ArrowRight, GraduationCap, Briefcase } from 'lucide-react';
import HeroPair from '@/components/marketing/HeroPair';
import MentorCarousel from '@/components/marketing/MentorCarousel';
import CredibilityRail from '@/components/marketing/CredibilityRail';
import ProblemSection from '@/components/marketing/ProblemSection';
import ProductDemo from '@/components/marketing/ProductDemo';
import TrajectoryViz from '@/components/marketing/TrajectoryViz';
import { trackLandingEvent } from '@/lib/landing-analytics';

/**
 * Home. Sells the idea, then hands off.
 *
 * Deliberately shorter than the page it replaces. Outcomes moved to /mentee,
 * the mentee roster to /mentor, and the brand definition, founder note and
 * Opportunity Fund to /about. What stays is the single argument: mentorship
 * runs on luck, and it should not.
 */
export default function HomeView() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-6 lg:px-10" aria-labelledby="hero-heading">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-12 lg:gap-16 items-center">
            <div>
              <h1
                id="hero-heading"
                className="font-serif text-purple-900 leading-[1.02] tracking-tight mb-7 max-w-3xl text-balance"
                style={{ fontSize: 'clamp(2.35rem, 6vw, 4.4rem)' }}
              >
                Find someone who has<br className="hidden sm:inline" />{' '}
                already done the job<br className="hidden sm:inline" />{' '}
                you want.
              </h1>

              <p className="text-lg sm:text-xl text-purple-900/60 font-light leading-relaxed max-w-lg mb-10">
                Mentable is where students find mentors a few steps ahead of
                them, and where the relationship keeps going after the
                introduction.
              </p>

              <div>
                <Link
                  href="/signup?role=mentee"
                  onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'hero_find_your_mentor' })}
                  className="group inline-flex items-center gap-2.5 bg-purple-700 text-white px-8 py-4 text-[15px] font-semibold hover:bg-purple-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all rounded-xl shadow-[0_1px_2px_rgba(36,25,62,0.12)] hover:shadow-[0_14px_32px_rgba(71,23,202,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                >
                  Find your mentor
                  <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
                </Link>
                <p className="text-[13px] text-purple-900/50 mt-3.5">Free to join.</p>
              </div>

              <p className="text-[14px] text-purple-900/55 mt-7">
                Further along in your career?{' '}
                <Link
                  href="/mentor"
                  className="tap-target text-purple-700 font-medium underline underline-offset-2 decoration-purple-200 hover:text-purple-900 hover:decoration-purple-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-sm"
                >
                  See how mentoring works
                </Link>
              </p>
            </div>

            <div className="hidden lg:block">
              <HeroPair />
            </div>
          </div>
        </div>
      </section>

      {/* ── The problem ──────────────────────────────────────────────────── */}
      <ProblemSection />

      {/* ── Proof: real people, then where they have been ────────────────── */}
      <MentorCarousel />
      <CredibilityRail />

      {/* ── What the product actually does ───────────────────────────────── */}
      <ProductDemo />

      {/* ── What changes ─────────────────────────────────────────────────── */}
      <TrajectoryViz />

      {/* ── The fork: two doors, deliberately unequal ────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50" aria-labelledby="paths-heading">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-5">
            Two sides
          </p>
          <h2
            id="paths-heading"
            className="font-serif text-purple-900 leading-[1.05] mb-12 max-w-xl"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            Which one are you?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link
              href="/mentee"
              className="group relative overflow-hidden bg-purple-900 text-white rounded-2xl p-8 sm:p-10 transition-all hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              <GraduationCap className="w-6 h-6 text-purple-300 mb-6" aria-hidden="true" />
              <h3 className="font-serif text-[28px] sm:text-[32px] leading-none mb-3">
                I&apos;m a student
              </h3>
              <p className="text-purple-200/80 text-[15px] leading-relaxed mb-7 max-w-sm">
                Find someone who has done the work you want to do, ask well, and
                build something that lasts longer than one coffee chat.
              </p>
              <span className="inline-flex items-center gap-2 text-[15px] font-medium">
                See the mentee experience
                <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
              </span>
            </Link>

            <Link
              href="/mentor"
              className="group bg-white border border-purple-100 rounded-2xl p-8 sm:p-10 transition-all hover:-translate-y-1 hover:border-purple-200 hover:shadow-[0_18px_40px_rgba(36,25,62,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              <Briefcase className="w-6 h-6 text-purple-600 mb-6" aria-hidden="true" />
              <h3 className="font-serif text-purple-900 text-[28px] sm:text-[32px] leading-none mb-3">
                I&apos;ve done the work
              </h3>
              <p className="text-purple-900/60 text-[15px] leading-relaxed mb-7 max-w-sm">
                Help without the open-ended inbox. You see context before you
                accept, and the structure holds the relationship together.
              </p>
              <span className="inline-flex items-center gap-2 text-[15px] font-medium text-purple-700">
                See the mentor experience
                <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-white border-t border-purple-100" aria-labelledby="cta-heading">
        <div className="max-w-6xl mx-auto">
          <h2
            id="cta-heading"
            className="font-serif text-purple-900 leading-[1.03] mb-8 max-w-2xl"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}
          >
            You shouldn&apos;t need luck<br />to meet the right person.
          </h2>
          <Link
            href="/signup?role=mentee"
            onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'final_find_your_mentor' })}
            className="group inline-flex items-center gap-2.5 bg-purple-700 text-white px-8 py-4 text-[15px] font-semibold hover:bg-purple-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all rounded-xl shadow-[0_1px_2px_rgba(36,25,62,0.12)] hover:shadow-[0_14px_32px_rgba(71,23,202,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            Find your mentor
            <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
          </Link>
          <p className="text-[14px] text-purple-900/55 mt-7">
            Further along in your career?{' '}
            <Link
              href="/signup?role=mentor"
              onClick={() => trackLandingEvent('landing_cta_clicked', { cta: 'final_i_want_to_mentor' })}
              className="tap-target text-purple-700 font-medium underline underline-offset-2 decoration-purple-200 hover:text-purple-900 hover:decoration-purple-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-sm"
            >
              Become a mentor
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
