'use client';

import Link from 'next/link';
import { ArrowRight, Inbox, SlidersHorizontal, Clock, FileText } from 'lucide-react';
import MenteeCarousel from '@/components/marketing/MenteeCarousel';

/**
 * /mentor — written for someone who already wants to help and has been burned
 * by how the asking usually works.
 *
 * The objections are answered in the order a professional actually raises
 * them, and each answer points at something the product does rather than at a
 * promise. MenteeCarousel is revived here: on a mentor page, "who you would be
 * helping" is exactly the right question, which is why it never belonged on
 * the student-facing home page.
 */

const CONTROLS = [
  {
    icon: SlidersHorizontal,
    head: 'You set the terms',
    body: 'Hours per week, how many mentees at once, and what you are willing to help with. Your capacity is a number in the product, not a boundary you have to defend over email.',
  },
  {
    icon: Inbox,
    head: 'You see context before you answer',
    body: 'A request arrives with who they are, what they are working toward, and why they picked you. Accept or decline. Declining is a button, not an awkward reply you keep putting off.',
  },
  {
    icon: Clock,
    head: 'It is scoped, not open-ended',
    body: 'A mentorship has a goal and a cadence. It is a defined commitment with a shape, not a standing invitation to email you forever.',
  },
  {
    icon: FileText,
    head: 'You can see whether it landed',
    body: 'Action items from your last session are either done or they are not. You know what happened before the next call, without having to ask.',
  },
];

const QA = [
  {
    q: 'How much time is this, honestly?',
    a: 'You set weekly hours and a maximum number of mentees when you join. The product will not route more at you than that, and you can change it whenever.',
  },
  {
    q: 'What if the request is not a fit?',
    a: 'Decline it. You see their goals and background first, so you are deciding with the same information you would want in an email, without the obligation to compose a polite no.',
  },
  {
    q: 'What actually happens after I accept?',
    a: 'You agree a goal, book a first session, and the relationship gets a home: messages, sessions, and action items in one thread rather than scattered across a calendar and an inbox.',
  },
  {
    q: 'Why is this better than telling someone to email me?',
    a: 'Because an email thread has no memory. Nothing tracks what you agreed, nothing reminds either of you, and the relationship quietly ends after the second reply. Structure is the difference.',
  },
];

export default function MentorView() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-28 sm:pt-32 pb-14 sm:pb-16 px-6 lg:px-10" aria-labelledby="mentor-heading">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-5">
            For mentors
          </p>
          <h1
            id="mentor-heading"
            className="font-serif text-purple-900 leading-[1.02] tracking-tight mb-7 max-w-3xl text-balance"
            style={{ fontSize: 'clamp(2.35rem, 6vw, 4.4rem)' }}
          >
            You already want to help. The asking is what&apos;s broken.
          </h1>
          <p className="text-lg sm:text-xl text-purple-900/60 font-light leading-relaxed max-w-xl mb-10">
            Requests arrive with no context and no follow-up, so people who
            would gladly help end up doing nothing. Mentable gives the whole
            thing a shape: you see who is asking and why, you decide, and the
            structure holds it together after you say yes.
          </p>
          <Link
            href="/signup?role=mentor"
            className="group inline-flex items-center gap-2.5 bg-purple-700 text-white px-8 py-4 text-[15px] font-semibold hover:bg-purple-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all rounded-xl shadow-[0_1px_2px_rgba(36,25,62,0.12)] hover:shadow-[0_14px_32px_rgba(71,23,202,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            Become a mentor
            <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
          </Link>
          <p className="text-[13px] text-purple-900/50 mt-3.5">
            Free. You choose your capacity.
          </p>
        </div>
      </section>

      {/* ── What you control ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-white border-y border-purple-100" aria-labelledby="control-heading">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-5">
            What you control
          </p>
          <h2
            id="control-heading"
            className="font-serif text-purple-900 leading-[1.05] mb-12 max-w-2xl"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            Selective by design, not by apology.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
            {CONTROLS.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.head} className="border-t border-purple-200 pt-5">
                  <Icon className="w-5 h-5 text-purple-700 mb-4" aria-hidden="true" />
                  <h3 className="font-serif text-purple-900 text-[24px] leading-snug mb-2.5">{c.head}</h3>
                  <p className="text-purple-900/60 text-[15px] leading-relaxed max-w-md">{c.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Who is asking — the carousel finally in its right home ───────── */}
      <MenteeCarousel />

      {/* ── The questions professionals actually ask ─────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-white border-y border-purple-100" aria-labelledby="qa-heading">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,320px),1fr] gap-12 lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-5">
              Straight answers
            </p>
            <h2
              id="qa-heading"
              className="font-serif text-purple-900 leading-[1.05]"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
            >
              The reasonable objections.
            </h2>
          </div>

          <dl className="divide-y divide-purple-100 border-t border-purple-100">
            {QA.map((item) => (
              <div key={item.q} className="py-6">
                <dt className="font-semibold text-purple-900 text-[17px] mb-2">{item.q}</dt>
                <dd className="text-purple-900/60 text-[15px] leading-relaxed max-w-2xl">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── What this is not ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50" aria-labelledby="notthis-heading">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-5">
            Worth saying plainly
          </p>
          <h2
            id="notthis-heading"
            className="font-serif text-purple-900 leading-[1.1] mb-6"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}
          >
            Mentoring here means teaching, not opening doors.
          </h2>
          <p className="text-purple-900/70 leading-relaxed text-[16px] max-w-2xl">
            You are not a referral service and nobody on Mentable is told
            otherwise. What students are asking for is perspective: what the
            work is really like, what they should be practising, and what they
            are getting wrong. Opportunity sometimes follows a good
            relationship. It is never the price of one.
          </p>
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-purple-900" aria-labelledby="mentor-cta">
        <div className="max-w-3xl mx-auto">
          <h2
            id="mentor-cta"
            className="font-serif text-white leading-[1.05] mb-6 max-w-2xl"
            style={{ fontSize: 'clamp(2rem, 4.6vw, 3.2rem)' }}
          >
            Someone did this for you.
          </h2>
          <p className="text-purple-200/75 text-[16px] leading-relaxed max-w-lg mb-9">
            Two hours a month is enough to change how one student understands
            the next five years of their career.
          </p>
          <Link
            href="/signup?role=mentor"
            className="group inline-flex items-center gap-2.5 bg-white text-purple-900 px-8 py-4 text-[15px] font-semibold hover:bg-purple-50 hover:-translate-y-0.5 active:scale-[0.98] transition-all rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-purple-900"
          >
            Become a mentor
            <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
