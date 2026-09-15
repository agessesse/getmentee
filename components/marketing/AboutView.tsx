'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import BrandDefinition from '@/components/marketing/BrandDefinition';
import Flywheel from '@/components/marketing/Flywheel';

/**
 * /about — the company's reason for existing.
 *
 * Carries the pieces that were crowding the home page and always belonged
 * here: the brand definition, the founder note, and the reciprocity argument.
 * Flywheel is revived for this page because it now says exactly what the logo
 * says: today's mentee becomes tomorrow's mentor.
 */

const BELIEFS = [
  {
    head: 'Access is distributed by accident',
    body: 'Who you can reach at nineteen is mostly a function of who your parents know, which school answered, and who happened to reply. None of that measures how much someone wants it.',
  },
  {
    head: 'The introduction is the easy part',
    body: 'Finding a name has never been simpler. Knowing what to ask, and turning one reply into a relationship that lasts a year, is where almost everyone stalls.',
  },
  {
    head: 'Structure is not bureaucracy',
    body: 'A shared goal, a standing session and an action item are what separate a mentorship from a nice conversation. The structure is what makes the generosity survivable for the person giving it.',
  },
  {
    head: 'It should return',
    body: 'A student who was helped well becomes someone who can help. That is not a marketing line; it is the only version of this that scales without more money in it.',
  },
];

export default function AboutView() {
  return (
    <>
      {/* ── Masthead: the name, defined ──────────────────────────────────── */}
      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-6 lg:px-10" aria-labelledby="about-heading">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-8">
            About
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,minmax(0,380px)] gap-12 lg:gap-16 items-start">
            <h1
              id="about-heading"
              className="font-serif text-purple-900 leading-[1.04] tracking-tight max-w-3xl text-balance"
              style={{ fontSize: 'clamp(2.1rem, 5vw, 3.6rem)' }}
            >
              Mentorship is the most valuable thing a student can get, and the
              least reliably distributed.
            </h1>
            <div className="lg:pt-3">
              <BrandDefinition />
              <p className="text-purple-900/55 text-[14px] leading-relaxed mt-6 max-w-sm">
                The name describes the student, not the mentor. Being worth
                someone&apos;s time is the part you control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The problem, stated once ─────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-purple-900" aria-labelledby="problem-heading">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-semibold text-purple-300 uppercase tracking-[0.22em] mb-6">
            The problem
          </p>
          <h2
            id="problem-heading"
            className="font-serif text-white leading-[1.08] max-w-3xl mb-8"
            style={{ fontSize: 'clamp(2rem, 4.6vw, 3.2rem)' }}
          >
            Right now, the difference between a student who gets guidance and
            one who doesn&apos;t is luck.
          </h2>
          <p className="text-purple-200/75 text-[17px] leading-relaxed max-w-2xl font-light">
            A chance introduction. A family friend. An alum who happened to
            answer. Those are real and they matter, and that is exactly the
            problem: the thing that most changes a career is the thing least
            within a student&apos;s control.
          </p>
        </div>
      </section>

      {/* ── What we believe ──────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50" aria-labelledby="belief-heading">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-5">
            What we believe
          </p>
          <h2
            id="belief-heading"
            className="font-serif text-purple-900 leading-[1.05] mb-14 max-w-xl"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            Four things, and the product follows from them.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
            {BELIEFS.map((b) => (
              <div key={b.head} className="border-t border-purple-200 pt-6">
                <h3 className="font-serif text-purple-900 text-[26px] leading-snug mb-3">{b.head}</h3>
                <p className="text-purple-900/60 text-[15px] leading-relaxed max-w-md">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reciprocity: the logo's own argument ─────────────────────────── */}
      <Flywheel />

      {/* ── Who is building it ───────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-white border-y border-purple-100" aria-labelledby="origin-heading">
        <div className="max-w-3xl mx-auto">
          <h2
            id="origin-heading"
            className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-6"
          >
            Who is building it
          </h2>
          <p className="font-serif text-purple-900 leading-[1.45] text-[21px] sm:text-[25px] max-w-2xl">
            I&apos;m Abel, a student at UNC. The mentors who helped me most were
            people I met by accident: a chance introduction, a friend of a
            friend. That felt like a bad way to decide a career. So I started
            building what I wish had existed.
          </p>
          <p className="text-purple-900/60 text-[15px] leading-relaxed mt-6 max-w-xl">
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
              <p className="text-[14px] font-semibold text-purple-900 leading-tight">Abel Gessesse</p>
              <p className="text-[13px] text-purple-900/50 leading-tight mt-0.5">Founder, Mentable</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Where this goes ──────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50" aria-labelledby="future-heading">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-5">
              Where this goes
            </p>
            <h2
              id="future-heading"
              className="font-serif text-purple-900 leading-[1.06] mb-5"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
            >
              A culture, not a directory.
            </h2>
            <p className="text-purple-900/65 leading-relaxed text-[15px] max-w-md">
              The measure of Mentable working is not how many people sign up.
              It is whether a student who was helped in their sophomore year
              comes back four years later to do the same for someone else.
            </p>
          </div>

          {/* Scrupulously attributed. Mentable is not the funder. */}
          <div className="bg-white border border-purple-100 rounded-2xl p-7">
            <p className="text-[10px] font-semibold text-purple-700 uppercase tracking-[0.18em] mb-3">
              In pilot
            </p>
            <h3 className="font-serif text-purple-900 text-[24px] leading-snug mb-3">
              The Opportunity Fund
            </h3>
            <p className="text-purple-900/65 text-[15px] leading-relaxed mb-4">
              Preparation costs money: a suit, a train ticket, a certification.
              We are building partnerships so that institutions who already
              offer this kind of support can reach the students who need it
              through Mentable.
            </p>
            <p className="text-purple-900/50 text-[13px] leading-relaxed">
              Any funding comes from the partner institution providing it, and
              is attributed to them. Mentable surfaces and coordinates these
              opportunities; it does not fund them. No partnerships are
              confirmed yet.
            </p>
          </div>
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-white border-t border-purple-100" aria-labelledby="about-cta">
        <div className="max-w-3xl mx-auto">
          <h2
            id="about-cta"
            className="font-serif text-purple-900 leading-[1.05] mb-8 max-w-2xl"
            style={{ fontSize: 'clamp(2rem, 4.6vw, 3.2rem)' }}
          >
            Mentorship should not depend on luck.
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/mentee"
              className="group inline-flex items-center gap-2.5 bg-purple-700 text-white px-7 py-3.5 text-[15px] font-semibold hover:bg-purple-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              I&apos;m a student
              <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
            </Link>
            <Link
              href="/mentor"
              className="group inline-flex items-center gap-2.5 border border-purple-200 text-purple-900 px-7 py-3.5 text-[15px] font-semibold hover:border-purple-400 hover:-translate-y-0.5 transition-all rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              I want to mentor
              <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
