'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Search, Send, Target, Calendar, CheckCircle2, MessageSquare } from 'lucide-react';

/**
 * /mentee — the student's story, told in order.
 *
 * Every product surface shown here exists: Discover, mentorship requests,
 * goals, sessions, action items, messages. The demo thread uses Christopher
 * Floyd, who is already public elsewhere on the site, and addresses the
 * student as "you" rather than inventing a person, so no fabricated identity
 * appears anywhere and the same relationship carries through every step.
 */

const MENTOR = {
  name: 'Christopher Floyd, CFA',
  title: 'Head of Institutional Sales',
  photo: '/people/christopher-floyd.jpg',
  helps: ['Fixed Income', 'Capital Markets', 'Career Development'],
};

const STEPS = [
  {
    n: '01',
    icon: Search,
    label: 'Discover',
    head: 'Start from the work, not the name.',
    body: 'Filter by the path you are actually chasing. You are looking for someone a few steps ahead, not the most senior person who might reply.',
  },
  {
    n: '02',
    icon: Send,
    label: 'Request',
    head: 'Ask once, and ask well.',
    body: 'A request needs a real reason. Mentable asks for one before it will send, because a blank request is the one that gets ignored.',
  },
  {
    n: '03',
    icon: Target,
    label: 'Goals',
    head: 'Agree what this is for.',
    body: 'You set a goal together. It is the thing the relationship is measured against, so neither of you has to guess whether it is working.',
  },
  {
    n: '04',
    icon: Calendar,
    label: 'Sessions',
    head: 'Meet on a schedule, not on a whim.',
    body: 'Sessions are booked, prepared for, and recapped. Your mentor sees what you wanted to cover before the call starts.',
  },
  {
    n: '05',
    icon: CheckCircle2,
    label: 'Action items',
    head: 'Leave with something to do.',
    body: 'Every session ends in specifics, assigned and dated. Following through is the part that turns a conversation into a relationship.',
  },
];

const OUTCOMES = [
  { label: 'Clarity',        body: 'See what the work is actually like before you spend years on it.' },
  { label: 'Preparation',    body: 'Walk in knowing what matters and what does not.' },
  { label: 'Accountability', body: 'Someone notices when you do not follow through.' },
  { label: 'Reciprocity',    body: 'Eventually become the person you once needed.' },
];

export default function MenteeView() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-28 sm:pt-32 pb-14 sm:pb-16 px-6 lg:px-10" aria-labelledby="mentee-heading">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-5">
            For students
          </p>
          <h1
            id="mentee-heading"
            className="font-serif text-purple-900 leading-[1.02] tracking-tight mb-7 max-w-3xl text-balance"
            style={{ fontSize: 'clamp(2.35rem, 6vw, 4.4rem)' }}
          >
            You know where you want to go. You don&apos;t know who to ask.
          </h1>
          <p className="text-lg sm:text-xl text-purple-900/60 font-light leading-relaxed max-w-xl mb-10">
            Cold messages are a lottery. Mentable gives you a way to find the
            right person, ask them properly, and keep the relationship moving
            once they say yes.
          </p>
          <Link
            href="/signup?role=mentee"
            className="group inline-flex items-center gap-2.5 bg-purple-700 text-white px-8 py-4 text-[15px] font-semibold hover:bg-purple-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all rounded-xl shadow-[0_1px_2px_rgba(36,25,62,0.12)] hover:shadow-[0_14px_32px_rgba(71,23,202,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            Find your mentor
            <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
          </Link>
          <p className="text-[13px] text-purple-900/50 mt-3.5">Free to join.</p>
        </div>
      </section>

      {/* ── Why them: the card that answers relevance ────────────────────── */}
      <section className="py-16 sm:py-20 px-6 lg:px-10 bg-white border-y border-purple-100" aria-labelledby="relevance-heading">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr,minmax(0,420px)] gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-5">
              Relevance, not reach
            </p>
            <h2
              id="relevance-heading"
              className="font-serif text-purple-900 leading-[1.06] mb-5"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
            >
              Why this person, and not the other four hundred.
            </h2>
            <p className="text-purple-900/65 leading-relaxed max-w-md text-[15px]">
              A profile tells you what someone actually does, what they will
              help with, and why they signed up to do it. You decide whether
              they fit before you spend anyone&apos;s time, including your own.
            </p>
          </div>

          {/* Mentor card — the same person carried through the whole page */}
          <div className="bg-cream-50 border border-purple-100 rounded-2xl p-6 shadow-[0_18px_48px_rgba(36,25,62,0.07)]">
            <div className="flex items-start gap-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden flex-none bg-purple-100">
                <Image src={MENTOR.photo} alt="" fill sizes="56px" className="object-cover" style={{ objectPosition: '50% 12%' }} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-purple-900 text-[15px] leading-tight">{MENTOR.name}</p>
                <p className="text-[13px] text-purple-900/55 mt-1">{MENTOR.title}</p>
              </div>
            </div>
            <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.18em] mt-6 mb-3">
              Can help with
            </p>
            <div className="flex flex-wrap gap-2">
              {MENTOR.helps.map((h) => (
                <span key={h} className="text-[12px] font-medium bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full">
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The journey ──────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50" aria-labelledby="journey-heading">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-5">
            How it goes
          </p>
          <h2
            id="journey-heading"
            className="font-serif text-purple-900 leading-[1.05] mb-14 max-w-xl"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            From a name on a screen to a relationship that holds.
          </h2>

          {/* A real sequence, so it is numbered. The rule on the left is the
              thread running through all five steps. */}
          <ol className="relative border-l border-purple-200 ml-3 sm:ml-5">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.n} className="relative pl-8 sm:pl-12 pb-12 last:pb-0">
                  <span className="absolute -left-[13px] top-0 w-[26px] h-[26px] rounded-full bg-purple-700 text-white grid place-items-center">
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-[12px] font-semibold tabular-nums text-purple-700">{s.n}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-900/45">{s.label}</span>
                  </div>
                  <h3 className="font-serif text-purple-900 text-[22px] sm:text-[26px] leading-snug mb-2">{s.head}</h3>
                  <p className="text-purple-900/60 text-[15px] leading-relaxed max-w-lg">{s.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── The thread keeps going ───────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-white border-y border-purple-100" aria-labelledby="between-heading">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.22em] mb-5">
              Between sessions
            </p>
            <h2
              id="between-heading"
              className="font-serif text-purple-900 leading-[1.06] mb-5"
              style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
            >
              The part that usually disappears.
            </h2>
            <p className="text-purple-900/65 leading-relaxed max-w-md text-[15px]">
              Most mentorship dies in the gap after a good first conversation.
              Messages, goals and open action items all live in one place, so
              the next step is never something either of you has to remember.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-cream-50 border border-purple-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-purple-600" aria-hidden="true" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-900/45">Message</p>
              </div>
              <p className="text-[14px] text-purple-900/75 leading-relaxed">
                &ldquo;Sent the technical prep guide over. Let me know if Thursday still works.&rdquo;
              </p>
              <p className="text-[12px] text-purple-900/45 mt-2">{MENTOR.name.split(',')[0]}</p>
            </div>

            <div className="bg-cream-50 border border-purple-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-sage-600" aria-hidden="true" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-900/45">Action item</p>
              </div>
              <p className="text-[14px] text-purple-900/75 leading-relaxed line-through decoration-purple-900/25">
                Complete three technical practice interviews
              </p>
              <p className="text-[12px] text-sage-700 font-medium mt-2">Done</p>
            </div>

            <div className="bg-cream-50 border border-purple-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-purple-600" aria-hidden="true" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-900/45">Goal</p>
              </div>
              <p className="text-[14px] text-purple-900/75 leading-relaxed">Break into investment banking</p>
              <div className="mt-3 h-1.5 rounded-full bg-purple-100 overflow-hidden">
                <div className="h-full w-[62%] rounded-full bg-sage-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Outcomes (relocated from Home) ───────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-cream-50" aria-labelledby="outcomes-heading">
        <div className="max-w-6xl mx-auto">
          <h2
            id="outcomes-heading"
            className="font-serif text-purple-900 leading-[1.05] mb-12 max-w-xl"
            style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}
          >
            What comes out of it.
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 lg:gap-x-10 gap-y-10">
            {OUTCOMES.map((o, i) => (
              <li key={o.label} className="border-t border-purple-200 pt-5">
                <span className="block text-[12px] font-semibold tabular-nums text-purple-700 mb-3">0{i + 1}</span>
                <h3 className="font-serif text-purple-900 text-[26px] leading-none mb-2.5">{o.label}</h3>
                <p className="text-purple-900/60 text-[15px] leading-relaxed">{o.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-6 lg:px-10 bg-purple-900" aria-labelledby="mentee-cta">
        <div className="max-w-3xl mx-auto">
          <h2
            id="mentee-cta"
            className="font-serif text-white leading-[1.05] mb-8 max-w-2xl"
            style={{ fontSize: 'clamp(2rem, 4.6vw, 3.2rem)' }}
          >
            Stop guessing who might reply.
          </h2>
          <Link
            href="/signup?role=mentee"
            className="group inline-flex items-center gap-2.5 bg-white text-purple-900 px-8 py-4 text-[15px] font-semibold hover:bg-purple-50 hover:-translate-y-0.5 active:scale-[0.98] transition-all rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-purple-900"
          >
            Find your mentor
            <ArrowRight className="w-4 h-4 arrow-slide" aria-hidden="true" />
          </Link>
          <p className="text-[13px] text-purple-300 mt-3.5">Free to join.</p>
        </div>
      </section>
    </>
  );
}
