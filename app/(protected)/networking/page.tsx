'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ArrowRight, ChevronDown, Compass, Search, MessageSquare, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/lib/profile-context';
import {
  TEMPLATES, TERMS, LADDER, CONNECTIONS, SEND_CHECKLIST, FIVE_MINUTE_CHECKLIST, QUESTION_BANK,
  FINANCE_QUESTIONS, TIMELINE, GOES_WRONG, MISTAKES, type Template,
} from '@/data/networking-101';

/**
 * Networking 101.
 *
 * ITS JOB. Teach a student, including one who has never sent a professional
 * email, how to start and build a professional relationship: who to talk to,
 * how to find and research them, what to write, how to prepare, how to talk and
 * listen, how to close, follow up, and stay in touch. It tells that story in
 * order, fifteen steps, with detail tucked into expandable sections so the page
 * scans quickly and nobody has to memorize it.
 *
 * NOT THE MENTORSHIP CURRICULUM. How to make an ongoing mentorship work lives
 * in the Mentorship Guide (/guide) and the session coach. This page links
 * across where the two meet and doesn't repeat it.
 *
 * STANDALONE. Nothing here needs a mentor or a Mentable feature. The few links
 * into the product are optional, shown only to mentees, and worded for whether
 * the reader already has a mentor.
 *
 * PRINCIPLES OVER RULES. Advice explains why, so a student can use judgment.
 * Conventions specific to one field (mostly finance recruiting) are kept but
 * labelled in FieldNote callouts, never presented as universal etiquette.
 */

const SECTIONS = [
  { id: 'start', label: 'Start here' },
  { id: 'who', label: 'Who should I talk to?' },
  { id: 'finding', label: 'Finding someone' },
  { id: 'research', label: 'Before you reach out' },
  { id: 'message', label: 'Sending the message' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'conversation', label: 'The conversation' },
  { id: 'questions', label: 'Asking better questions' },
  { id: 'ending', label: 'Ending the conversation' },
  { id: 'follow-up', label: 'Following up' },
  { id: 'staying', label: 'Staying in touch' },
  { id: 'timeline', label: 'Your four years' },
  { id: 'examples', label: 'Examples' },
  { id: 'mistakes', label: 'Common mistakes' },
] as const;

const num = (id: string) => String(SECTIONS.findIndex((s) => s.id === id) + 1).padStart(2, '0');

// ─── Pieces ───────────────────────────────────────────────────────────────────

function Section({ id, title, lead, children }: { id: string; title: string; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6 bg-white rounded-2xl border border-halo-rule p-5 sm:p-8">
      <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-2 tabular-nums">{num(id)}</p>
      <h2 id={`${id}-h`} className="font-display font-normal text-[1.75rem] sm:text-[2rem] leading-tight text-halo-ink">{title}</h2>
      {lead && <p className="text-[17px] text-halo-ink leading-relaxed mt-3">{lead}</p>}
      <div className="mt-6 space-y-6 text-[16px] leading-relaxed text-halo-heather">{children}</div>
    </section>
  );
}

function Points({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden="true" className="mt-[10px] w-1.5 h-1.5 rounded-full bg-halo-purple flex-shrink-0" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[17px] font-semibold text-halo-ink mb-2.5">{title}</h3>
      {children}
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-halo-lavender bg-halo-veil px-4 py-3.5 text-[16px] text-halo-ink leading-relaxed">{children}</p>;
}

/** A short note for someone doing this for the first time. */
function FirstTimeNote({ children }: { children: React.ReactNode }) {
  return (
    <aside className="rounded-xl border border-halo-rule bg-halo-ivory px-4 py-3">
      <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-1">If this is new to you</p>
      <div className="text-[15px] text-halo-heather leading-relaxed">{children}</div>
    </aside>
  );
}

/** A convention specific to one field, labelled so it never reads as a universal rule. */
function FieldNote({ field, children }: { field: string; children: React.ReactNode }) {
  return (
    <aside className="rounded-xl border border-halo-rule bg-halo-ivory px-4 py-3">
      <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-1">In {field}</p>
      <div className="text-[15px] text-halo-heather leading-relaxed">{children}</div>
    </aside>
  );
}

/** Weaker and stronger versions side by side. */
function Compare({ weak, strong, weakLabel = 'Weaker', strongLabel = 'Stronger', note }: { weak: React.ReactNode; strong: React.ReactNode; weakLabel?: string; strongLabel?: string; note?: React.ReactNode }) {
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-red-800 mb-1">{weakLabel}</p>
          <p className="text-[15px] text-red-950 leading-relaxed">{weak}</p>
        </div>
        <div className="rounded-xl border border-halo-lavender bg-halo-veil px-4 py-3">
          <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-1">{strongLabel}</p>
          <p className="text-[15px] text-halo-ink leading-relaxed">{strong}</p>
        </div>
      </div>
      {note && <p className="text-[15px] mt-2">{note}</p>}
    </div>
  );
}

function More({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-xl border border-halo-rule" open={defaultOpen}>
      <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-4 py-3.5 text-[16px] font-semibold text-halo-ink hover:bg-halo-veil/50 rounded-xl [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="w-5 h-5 text-halo-mist-strong flex-shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 pt-1 text-[15px] leading-relaxed text-halo-heather">{children}</div>
    </details>
  );
}

function Checklist({ title, items, footer }: { title: string; items: string[]; footer?: React.ReactNode }) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  const count = done.filter(Boolean).length;
  return (
    <div className="rounded-2xl border border-halo-rule bg-halo-ivory p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[17px] font-semibold text-halo-ink">{title}</p>
        {count > 0 && (
          <button type="button" onClick={() => setDone(items.map(() => false))} className="text-sm text-halo-mist-body hover:text-halo-ink underline underline-offset-2">Clear</button>
        )}
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={it}>
            <label className="flex items-start gap-3 rounded-lg px-2 py-2 cursor-pointer hover:bg-white">
              <input type="checkbox" checked={done[i]} onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} className="mt-1 w-[18px] h-[18px] accent-halo-purple flex-shrink-0" />
              <span className={`text-[16px] ${done[i] ? 'text-halo-mist-body line-through' : 'text-halo-ink'}`}>{it}</span>
            </label>
          </li>
        ))}
      </ul>
      {footer && <p className="mt-3 text-[15px] text-halo-ink">{footer}</p>}
    </div>
  );
}

function Bridge({ href, icon: Icon, children }: { href: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl border border-dashed border-halo-purple/40 px-4 py-3 text-[15px] text-halo-ink hover:bg-halo-veil/60 transition-colors">
      <Icon className="w-4 h-4 text-halo-purple-d flex-shrink-0" />
      <span className="flex-1">{children}</span>
      <ArrowRight className="w-4 h-4 text-halo-purple-d flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

function TemplateCard({ t }: { t: Template }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(t.text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard blocked; the text is still selectable */ }
  };
  return (
    <details className="group rounded-xl border border-halo-rule overflow-hidden">
      <summary className="flex items-start justify-between gap-3 cursor-pointer list-none px-4 py-3.5 hover:bg-halo-veil/50 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[16px] font-semibold text-halo-ink">{t.title}</span>
          <span className="block text-[14px] text-halo-heather mt-0.5">{t.when}</span>
        </span>
        <ChevronDown className="w-5 h-5 text-halo-mist-strong flex-shrink-0 mt-0.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-halo-rule">
        <div className="flex justify-end bg-halo-veil px-3 py-2">
          <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-halo-purple-d hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="whitespace-pre-wrap break-words font-body text-[15px] leading-relaxed text-halo-ink bg-white px-4 sm:px-5 py-4">{t.text}</pre>
      </div>
    </details>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NetworkingGuidePage() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const [hasMentor, setHasMentor] = useState(false);
  // Product links are for mentees only; mentors can read the guide without them.
  const isMentee = useProfile()?.role !== 'mentor';

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { count } = await supabase.from('mentorships').select('id', { count: 'exact', head: true })
        .eq('mentee_id', session.user.id).eq('status', 'active');
      setHasMentor((count ?? 0) > 0);
    })();
  }, []);

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '0px 0px -65% 0px', threshold: 0 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const mentorBridge = (withMentor: string, withoutMentor: string, icon = MessageSquare) =>
    !isMentee ? null : hasMentor
      ? <Bridge href="/messages" icon={icon}>{withMentor}</Bridge>
      : <Bridge href="/discover" icon={Search}>{withoutMentor}</Bridge>;

  return (
    <div className="max-w-6xl mx-auto">
      <header className="max-w-3xl mb-6">
        <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-2">Guide</p>
        <h1 className="font-display font-normal text-[2.25rem] sm:text-[2.5rem] leading-tight text-halo-ink">Networking 101</h1>
        <p className="text-[17px] text-halo-heather mt-2 leading-relaxed">
          How to have your first professional conversation, and how to turn it into a real relationship. Read it in order
          the first time. After that, jump to whatever you need.
        </p>
      </header>

      {/* Contents on phones and tablets: collapsed, so the guide starts right away. */}
      <details className="lg:hidden mb-6 rounded-2xl border border-halo-rule bg-white">
        <summary className="flex items-center justify-between cursor-pointer list-none px-5 py-4 text-[16px] font-semibold text-halo-ink [&::-webkit-details-marker]:hidden">
          Contents
          <ChevronDown className="w-5 h-5 text-halo-mist-strong" />
        </summary>
        <ol className="px-5 pb-4 grid sm:grid-cols-2 gap-x-6">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="flex gap-3 py-2 text-[15px] text-halo-ink hover:text-halo-purple-d">
                <span className="text-halo-mist-body tabular-nums">{num(s.id)}</span>{s.label}
              </a>
            </li>
          ))}
        </ol>
      </details>

      <div className="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-8 items-start">
        <nav aria-label="Guide contents" className="hidden lg:block sticky top-6 max-h-[calc(100vh-7rem)] overflow-y-auto">
          <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-3">Contents</p>
          <ol className="space-y-0.5 border-l border-halo-rule">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} aria-current={active === s.id ? 'true' : undefined}
                  className={`-ml-px flex gap-2.5 border-l-2 pl-4 py-1.5 text-sm transition-colors ${active === s.id ? 'border-halo-purple text-halo-ink font-medium' : 'border-transparent text-halo-heather hover:text-halo-ink'}`}>
                  <span className="tabular-nums text-halo-mist-body">{num(s.id)}</span>{s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-6 min-w-0 max-w-3xl">
          {/* 01 */}
          <Section id="start" title="What networking actually is" lead={<>Networking is building professional relationships <strong className="font-semibold">before you need something.</strong></>}>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-halo-rule p-4">
                <p className="text-[16px] font-semibold text-halo-ink mb-2">It isn’t</p>
                <ul className="space-y-1.5 text-[15px]">
                  {['Collecting LinkedIn connections', 'Asking strangers for jobs', 'Sending hundreds of cold emails', 'Trying to impress important people', 'Pretending to be interested in someone', 'Asking for a referral right away'].map((x) => (
                    <li key={x} className="flex gap-2"><X className="w-4 h-4 text-red-700 flex-shrink-0 mt-1" />{x}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-halo-lavender bg-halo-veil/40 p-4">
                <p className="text-[16px] font-semibold text-halo-ink mb-2">It is</p>
                <ul className="space-y-1.5 text-[15px] text-halo-ink">
                  {['Meeting people and learning from them', 'Being curious about how they got where they are', 'Staying in touch', 'Being useful when you can', 'Letting relationships grow over time'].map((x) => (
                    <li key={x} className="flex gap-2"><Check className="w-4 h-4 text-halo-purple-d flex-shrink-0 mt-1" />{x}</li>
                  ))}
                </ul>
              </div>
            </div>

            <Sub title="Why it matters">
              <p className="mb-3 text-halo-ink">Applications tell an organization what you’ve done. Relationships help people understand who you are.</p>
              <Points items={[
                'You discover careers you didn’t know existed.',
                'You learn what a company or role is really like, beyond the website.',
                'You learn how recruiting works in a field, and how to prepare for interviews.',
                'You find mentors, and you hear about opportunities earlier.',
                'Over time, some relationships lead to introductions or referrals.',
              ]} />
            </Sub>
            <Callout>No one owes you a job, an interview, an introduction, or a referral because you had a conversation. People help because they got to know you and want to.</Callout>

            <Sub title="Why people say yes">
              <p>Most professionals remember someone who helped them early on, and many genuinely enjoy explaining their work to someone curious. A short, specific, respectful request is easy to say yes to. You don’t need a family connection or a finished plan. You need curiosity and a good question.</p>
            </Sub>

            <div className="rounded-xl border border-halo-purple/30 bg-white p-4">
              <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d mb-1">Coffee chat</p>
              <p className="text-[16px] text-halo-ink leading-relaxed">{TERMS[0].meaning}</p>
            </div>
            <More title="Other words you’ll hear">
              <dl className="space-y-3">
                {TERMS.slice(1).map((t) => (
                  <div key={t.term}>
                    <dt className="font-semibold text-halo-ink">{t.term}</dt>
                    <dd>{t.meaning}</dd>
                  </div>
                ))}
              </dl>
            </More>
          </Section>

          {/* 02 */}
          <Section id="who" title="Who should I talk to?" lead="Start close to where you are. The most useful person is often not the most senior one.">
            <ul className="divide-y divide-halo-rule rounded-xl border border-halo-rule">
              {LADDER.map((l) => (
                <li key={l.who} className="px-4 py-3.5 sm:grid sm:grid-cols-[170px_1fr] sm:gap-4">
                  <p className="text-[16px] font-semibold text-halo-ink">{l.who}</p>
                  <p className="text-[15px] mt-0.5 sm:mt-0">{l.why}</p>
                </li>
              ))}
            </ul>
            {mentorBridge(
              'If you have a Mentable mentor, practice your introduction, questions, or an upcoming coffee chat with them.',
              'Mentable connects students with professionals who have chosen to mentor. A mentor is a good person to practice with.',
            )}
          </Section>

          {/* 03 */}
          <Section id="finding" title="Finding someone" lead="Start with people you share one or two genuine things with.">
            <ul className="flex flex-wrap gap-2">
              {CONNECTIONS.map((c) => <li key={c} className="rounded-full border border-halo-rule bg-halo-ivory px-3 py-1.5 text-[14px] text-halo-ink">{c}</li>)}
            </ul>
            <Callout>
              <strong className="font-semibold">Relevance beats seniority.</strong> A first-year interested in investment banking will usually learn more from a recent graduate who just went through recruiting than from emailing the CEO of a bank.
            </Callout>
            <Sub title="Where to look">
              <Points items={[
                'LinkedIn: search by your school plus a company, role, or field.',
                'Your university’s alumni network or directory.',
                'Student organizations and their alumni.',
                'Campus events, info sessions, and speaker series.',
                'Your career center.',
                'Handshake, if your school uses it.',
                ...(isMentee ? ['Mentable, where professionals have chosen to mentor students.'] : []),
                'Company and team pages.',
                'Introductions from people you already know. “Do you know anyone who works in [field]?” is one of the easiest questions to say yes to.',
              ]} />
            </Sub>
            <p>Reach out to a few well-chosen people at a time. Mass messages are easy to spot and easy to ignore.</p>
          </Section>

          {/* 04 */}
          <Section id="research" title="Before you reach out" lead="Do the research before asking for someone’s time.">
            <Sub title="Spend five minutes learning">
              <Points items={['What they do now.', 'Where they studied.', 'Where they’ve worked.', 'Anything genuinely relevant about their path.']} />
            </Sub>
            <Callout>
              Then ask yourself: <strong className="font-semibold">why this person?</strong> If you can’t answer in a sentence, you probably aren’t ready to send the message yet.
            </Callout>
            <Sub title="Don’t ask what their profile already says">
              <Compare
                weak="“What company do you work for?”"
                strong="“I noticed you moved from engineering into consulting after college. What made you consider that?”"
              />
            </Sub>
            <Sub title="Real personalization, not flattery">
              <p className="mb-3">Personalization means having a reason for choosing them, not complimenting them.</p>
              <Compare
                weak="“Your impressive background really stood out to me.”"
                strong="“I saw you studied economics at [your university] before joining the healthcare team at [firm]. I’m exploring the same combination and would love to hear how you thought about it.”"
                note="Never invent common ground. If the connection is thin, just be honest about why you’re curious."
              />
            </Sub>
          </Section>

          {/* 05 */}
          <Section id="message" title="Sending the message" lead="Make it easy for them to understand who you are, why you chose them, and what you’re asking.">
            <ol className="grid sm:grid-cols-2 gap-2.5">
              {[['Who you are', 'Name, school, year, and what you’re studying.'], ['Why them', 'The specific reason you chose this person.'], ['What you’re asking', 'Usually a short conversation, like 20 minutes.'], ['Thanks', 'A simple thank-you. No need to over-apologize.']].map(([t, d], i) => (
                <li key={t} className="flex gap-3 rounded-xl border border-halo-rule p-3.5">
                  <span className="w-7 h-7 rounded-full bg-halo-purple text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span><span className="block text-[16px] font-semibold text-halo-ink">{t}</span><span className="block text-[15px]">{d}</span></span>
                </li>
              ))}
            </ol>
            <Compare
              weakLabel="Stiff"
              strongLabel="Natural"
              weak="“I would greatly appreciate the opportunity to connect at your earliest convenience.”"
              strong="“If you have 20 minutes sometime in the next couple of weeks, I’d love to hear about your experience.”"
            />
            <FirstTimeNote>
              It’s normal to feel like you’re bothering someone. You aren’t. A short, specific message to someone who
              chose to be reachable is easy to say yes to, easy to decline, and takes them a minute to read.
            </FirstTimeNote>
            <More title="Email or LinkedIn?">
              <Points items={[
                'Both are fine. Email usually gets read more reliably. If you can’t find an address, a LinkedIn message is perfectly reasonable.',
                'Your school email can add credibility when you’re contacting alumni or someone at your school, but it isn’t required.',
                'For a first message, stick to email or LinkedIn. Texting is fine once someone gives you their number or suggests it.',
                'You can offer two or three times that work, or simply ask what works for them. You don’t need to list every free hour.',
              ]} />
            </More>
            <More title="Names and titles">
              <p>Use the name they use. First names are normal in most workplaces. If the setting feels formal, or they’re much more senior, starting with “Hi Ms. Rivera” is safe, and you can switch to their first name if they sign off with it.</p>
              <div className="mt-3"><FieldNote field="finance, law, medicine, and government">These fields often run more formal, especially with senior people. When in doubt, start formal.</FieldNote></div>
            </More>
            <More title="Should I attach my résumé?">
              <p>For recruiting-related conversations, a one-page PDF résumé gives the person useful context. For a casual conversation with another student, you usually don’t need one.</p>
            </More>
            <Checklist title="Before you hit send" items={SEND_CHECKLIST} />
          </Section>

          {/* 06 */}
          <Section id="scheduling" title="Scheduling the conversation" lead="They said yes. Now make it easy.">
            <Points items={[
              'Reply promptly when you can. Same-day is usually plenty. You don’t need to step out of class or work to answer within minutes.',
              'Confirm the day, time, time zone, and how you’ll talk: phone, video, or in person.',
              'Offer to send a calendar invite, or accept theirs. A clear title helps, like “[Your name] / [Their name] chat”.',
              'For a phone call, confirm who’s calling whom. Since you asked for the conversation, offer to call them.',
              'If you haven’t already, set up a simple email signature with your name, school, and class year.',
            ]} />
            <FieldNote field="finance recruiting">During busy recruiting periods, people often reply within a few hours, and a quick reply keeps things moving.</FieldNote>
            <Sub title="When they don’t respond">
              <p className="mb-3">Professionals are busy. No response usually doesn’t mean they dislike you, that you embarrassed yourself, or that anything is over.</p>
              <ol className="space-y-2">
                {['Check the message went to the right address or profile.', 'Wait about a week.', 'Send one short, friendly follow-up.', 'If it feels right, send one final follow-up a week or two later.', 'Then move on gracefully.'].map((s, i) => (
                  <li key={s} className="flex gap-3"><span className="w-6 h-6 rounded-full bg-halo-veil text-halo-purple-d text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span><span>{s}</span></li>
                ))}
              </ol>
              <div className="mt-3">
                <Compare
                  weakLabel="Guilt"
                  strongLabel="Gracious"
                  weak="“Just bumping this again because you haven’t responded.”"
                  strong="“I wanted to follow up in case my note got buried. If now isn’t a good time, no worries at all.”"
                />
              </div>
            </Sub>
          </Section>

          {/* 07 */}
          <Section id="preparing" title="Preparing" lead="Ten minutes of preparation changes the whole conversation.">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[['Them', 'Who are they?'], ['Their path', 'How did they get where they are?'], ['The topic', 'What are you trying to understand?'], ['Your story', 'Can you introduce yourself in 20–30 seconds?'], ['Your questions', 'What do you genuinely want to ask?'], ['Your goal', 'What would make this worthwhile?']].map(([t, q]) => (
                <div key={t} className="rounded-xl border border-halo-rule p-3.5">
                  <p className="text-[16px] font-semibold text-halo-ink">{t}</p>
                  <p className="text-[15px]">{q}</p>
                </div>
              ))}
            </div>

            <Sub title="The 10-minute preparation">
              <ol className="rounded-xl border border-halo-rule divide-y divide-halo-rule">
                {[['3 minutes', 'Review their LinkedIn or profile.'], ['3 minutes', 'Look up their company, team, or the topic.'], ['2 minutes', 'Write three to five questions.'], ['2 minutes', 'Practice your introduction, and decide what you most want to learn.']].map(([t, d]) => (
                  <li key={d} className="flex gap-4 px-4 py-3">
                    <span className="w-[86px] flex-shrink-0 font-semibold text-halo-purple-d tabular-nums">{t}</span>
                    <span className="text-halo-ink">{d}</span>
                  </li>
                ))}
              </ol>
            </Sub>

            <Sub title="Your introduction">
              <p className="mb-3">Not a memorized pitch. Three quick parts: <strong className="text-halo-ink font-semibold">where you are, what you’re interested in, and why you wanted to talk to them.</strong></p>
              <blockquote className="rounded-xl border-l-4 border-halo-purple bg-halo-ivory px-4 py-3.5 text-[16px] text-halo-ink leading-relaxed">
                “I’m Jordan, a first-year at [my university] studying economics. I’ve been trying to understand the different paths within finance, and investment banking is one I’ve started exploring. I saw you went through recruiting a few years ago, so I was really interested to hear how you figured out it was right for you.”
              </blockquote>
              <p className="mt-3">Then stop talking. Your introduction should be shorter than their story.</p>
            </Sub>

            <Checklist title="5 minutes before the call" items={FIVE_MINUTE_CHECKLIST} footer="You don’t need to impress them. Be curious and prepared." />
            {mentorBridge('Practice your introduction and questions with your mentor.', 'Want someone to practice with? A mentor on Mentable can help.')}
          </Section>

          {/* 08 */}
          <Section id="conversation" title="The conversation" lead="Your questions are a safety net, not a script.">
            <ol className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {[['Connect', 'Start like a person.'], ['Their story', 'How did they get there?'], ['Explore', 'Ask about what they said.'], ['Go deeper', 'Follow up.'], ['Close', 'Respect their time.']].map(([t, d], i) => (
                <li key={t} className="rounded-xl border border-halo-rule bg-halo-ivory p-3">
                  <p className="text-xs font-semibold text-halo-purple-d tabular-nums">{i + 1}</p>
                  <p className="text-[16px] font-semibold text-halo-ink">{t}</p>
                  <p className="text-[14px]">{d}</p>
                </li>
              ))}
            </ol>
            <Compare
              weakLabel="An interrogation"
              strongLabel="A conversation"
              weak="Question → answer → next question → answer"
              strong="Question → answer → listen → follow-up → conversation"
            />
            <Points items={[
              'Join or call at the agreed time. Calling several minutes early can catch someone between meetings.',
              'Keep an eye on the clock. If they offered 20 minutes, plan for 20.',
            ]} />
            <FirstTimeNote>
              Nerves are normal, and they fade after a couple of conversations. The person on the other end has done this
              many times and isn’t judging you. They’re usually just glad you were interested enough to ask.
            </FirstTimeNote>

            <Sub title="Listen, really listen">
              <p className="mb-3">This may be the most important skill on this page.</p>
              <Points items={[
                'Don’t interrupt.',
                'Don’t plan your next question while they’re still answering.',
                'Listen for something worth exploring, and notice what they emphasize.',
                'Acknowledge what they said before moving on.',
                'Let pauses happen. People often add the most useful thing after one.',
              ]} />
              <div className="mt-4 rounded-xl border border-halo-rule p-4">
                <p className="text-[15px] text-halo-ink"><span className="font-semibold">They say: </span>“My first internship actually made me realize I didn’t want to work in consulting.”</p>
                <div className="mt-3">
                  <Compare
                    weak="“Interesting. What’s the culture like at your current firm?”"
                    strong="“What about the internship made you realize consulting wasn’t right for you?”"
                    note="The second student was actually listening, and got a much better story."
                  />
                </div>
              </div>
            </Sub>

            <Sub title="Notes, without losing the conversation">
              <Points items={[
                'Handwritten notes or a few typed words are enough. Capture names, advice, and anything they recommend.',
                'Take five minutes right after to write down what you learned while it’s fresh.',
                'Never record or transcribe someone without their clear consent. Ask first, and respect a no. Tools like transcription or dictation apps should help you remember, not make the other person uncomfortable.',
              ]} />
            </Sub>

            <More title="When something goes wrong">
              <ul className="space-y-3">
                {GOES_WRONG.map((g) => (
                  <li key={g.title}><p className="font-semibold text-halo-ink">{g.title}</p><p>{g.body}</p></li>
                ))}
              </ul>
              {isMentee && hasMentor && <div className="mt-4"><Bridge href="/messages" icon={MessageSquare}>Talk it through with your mentor.</Bridge></div>}
            </More>
          </Section>

          {/* 09 */}
          <Section id="questions" title="Asking better questions" lead="The best question often comes from the answer you just heard.">
            <Sub title="Three levels">
              <ol className="space-y-2.5">
                {[['Generic', '“What do you like about your job?”', 'Fine, but anyone could ask it.'], ['Specific', '“What surprised you most when you moved from school into the job?”', 'Gets a real story.'], ['Personalized', '“You interned at a smaller firm before joining your current team. What changed most about the responsibility you were given?”', 'Only you could ask it, because you did the research.']].map(([lvl, q, why], i) => (
                  <li key={lvl} className={`rounded-xl border px-4 py-3 ${i === 2 ? 'border-halo-lavender bg-halo-veil' : 'border-halo-rule'}`}>
                    <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-purple-d">Level {i + 1} · {lvl}</p>
                    <p className="text-[16px] text-halo-ink mt-1">{q}</p>
                    <p className="text-[14px] mt-0.5">{why}</p>
                  </li>
                ))}
              </ol>
            </Sub>

            <More title="Question ideas to start from">
              <div className="space-y-4">
                {QUESTION_BANK.map((g) => (
                  <div key={g.group}>
                    <p className="font-semibold text-halo-ink">{g.group}</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">{g.questions.map((q) => <li key={q}>{q}</li>)}</ul>
                  </div>
                ))}
                <FieldNote field="finance recruiting">
                  <ul className="list-disc pl-5 space-y-1">{FINANCE_QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ul>
                </FieldNote>
              </div>
            </More>

            <Sub title="Handle some topics with care">
              <p className="mb-3">You have limited time with someone’s actual experience. Don’t spend it on what you could find online.</p>
              <div className="space-y-2.5">
                <p><strong className="text-halo-ink font-semibold">Pay.</strong> Usually not right for a first conversation unless they bring it up or there’s a real reason to discuss it.</p>
                <Compare weakLabel="Instead of" strongLabel="Try" weak="“How bad are the hours?”" strong="“How does the workload change over the course of a typical project?”" />
                <Compare weakLabel="Instead of" strongLabel="Try" weak="“What are the exit opportunities?”" strong="“What skills have you built here that you think will matter most later?”" />
              </div>
            </Sub>
            <More title="What to stay away from">
              <Points items={[
                'Confidential company information, or anything about their clients.',
                'Gossip about people or organizations.',
                'Discriminatory or sexual comments of any kind.',
                'Deeply personal questions without context.',
                'Pressing for a referral or a job.',
                'Questioning their politics or religion when it has nothing to do with the conversation.',
              ]} />
            </More>
            {isMentee && hasMentor && <Bridge href="/messages" icon={MessageSquare}>Ask your mentor to look over your questions before the call.</Bridge>}
          </Section>

          {/* 10 */}
          <Section id="ending" title="Ending the conversation" lead="Closing well is easier than it feels. Here’s the language.">
            <Sub title="As you get close to time">
              <blockquote className="rounded-xl border-l-4 border-halo-purple bg-halo-ivory px-4 py-3 text-[16px] text-halo-ink">“I want to be respectful of your time since we’re coming up on 20 minutes. I have one more question if you have a minute.”</blockquote>
            </Sub>
            <Sub title="If you’d like other people to learn from">
              <p className="mb-2">It’s fine to ask, gently, and it’s also fine not to. A conversation doesn’t fail because you didn’t get another name.</p>
              <blockquote className="rounded-xl border-l-4 border-halo-purple bg-halo-ivory px-4 py-3 text-[16px] text-halo-ink">“If anyone comes to mind who you think would be good for me to learn from as I explore [topic], I’d appreciate any suggestions. But this was already really helpful.”</blockquote>
            </Sub>
            <Sub title="Then thank them specifically">
              <blockquote className="rounded-xl border-l-4 border-halo-purple bg-halo-ivory px-4 py-3 text-[16px] text-halo-ink">“Thank you so much. What you said about [something specific] was really helpful.”</blockquote>
            </Sub>
          </Section>

          {/* 11 */}
          <Section id="follow-up" title="Following up" lead="Close the loop. The best follow-up is progress.">
            <ol className="space-y-3">
              {[
                ['Thank', 'Within a day or so, send a short thank-you that mentions something specific from the conversation.'],
                ['Capture', 'Write down what you learned, details worth remembering about them, their advice, anyone or anything they recommended, and what you said you’d do. A simple document or notes app is enough.'],
                ['Act', 'Actually do what you said you would.'],
                ['Update', 'If their advice leads somewhere, tell them.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-halo-purple text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span><span className="block text-[16px] font-semibold text-halo-ink">{t}</span><span className="block">{d}</span></span>
                </li>
              ))}
            </ol>
            <blockquote className="rounded-xl border-l-4 border-halo-purple bg-halo-ivory px-4 py-3.5 text-[16px] text-halo-ink leading-relaxed">
              “You suggested I talk to students who had worked at both large and smaller firms. I did that this month, and it helped me realize I’m more interested in smaller teams. Thanks again for pointing me in that direction.”
            </blockquote>
          </Section>

          {/* 12 */}
          <Section id="staying" title="Staying in touch" lead="There’s no magic schedule. Reach out when there’s a reason.">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-halo-lavender bg-halo-veil/40 p-4">
                <p className="text-[16px] font-semibold text-halo-ink mb-2">Good reasons</p>
                <ul className="space-y-1.5 text-[15px] text-halo-ink list-disc pl-5">
                  <li>Their advice helped you.</li>
                  <li>You did something you talked about.</li>
                  <li>You followed their recommendation.</li>
                  <li>You saw something genuinely relevant to them.</li>
                  <li>You’re starting a new stage of recruiting.</li>
                  <li>It’s been a while and you’d honestly like to reconnect.</li>
                </ul>
              </div>
              <div className="rounded-xl border border-halo-rule p-4">
                <p className="text-[16px] font-semibold text-halo-ink mb-2">Not a reason</p>
                <p className="text-[15px]">“My networking spreadsheet says it’s been 60 days.”</p>
                <p className="text-[15px] mt-2">The relationship should feel human, not scheduled.</p>
              </div>
            </div>

            <Sub title="Network sideways and down, too">
              <p>Don’t only build relationships with people who can do something for you. Classmates, younger students, teammates, club members, coworkers, and fellow interns matter. Some of them will become coworkers, clients, founders, recruiters, managers, or friends. But that isn’t the reason to know them. Good professional communities work because people help each other.</p>
            </Sub>
            <Sub title="Give before you ask">
              <p className="mb-3">If you feel like you have nothing to offer yet, you have more than you think. You can:</p>
              <Points items={[
                'Make an introduction between two people who should meet.',
                'Send a resource you think they’d find useful.',
                'Show up for someone’s event, or help another student.',
                'Follow through on advice, and tell them what happened.',
                'Say thank you and mean it.',
                'Someday, mentor someone younger. That’s how the people helping you got here too.',
              ]} />
            </Sub>
            {isMentee && <Bridge href="/guide" icon={Compass}>When a conversation turns into an ongoing mentorship, the Mentorship Guide covers how to make it work.</Bridge>}
          </Section>

          {/* 13 */}
          <Section id="timeline" title="Your four years" lead="A rough shape, not a deadline. Every path is different.">
            <ol className="grid sm:grid-cols-2 gap-3">
              {TIMELINE.map((t) => (
                <li key={t.year} className="rounded-xl border border-halo-rule bg-halo-ivory p-4 sm:p-5">
                  <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body">{t.year}</p>
                  <p className="font-display text-[1.5rem] leading-tight text-halo-ink mb-2">{t.verb}</p>
                  <Points items={t.points} />
                </li>
              ))}
            </ol>
            <FieldNote field="finance recruiting">
              Timelines run early. Formal networking for junior-summer internships in fields like investment banking often starts in the fall of sophomore year, and junior-summer internships frequently turn into full-time offers. If finance interests you, start learning how its recruiting works during your first year. Other fields, such as consulting and technology, keep their own calendars, so ask upperclassmen and your career center.
            </FieldNote>
          </Section>

          {/* 14 */}
          <Section id="examples" title="Examples" lead="Use these as structure, not scripts. Your own words will sound better.">
            <p>Replace everything in [brackets], and cut anything that doesn’t sound like you.</p>
            <div className="space-y-2.5">
              {TEMPLATES.map((t) => <TemplateCard key={t.id} t={t} />)}
            </div>
          </Section>

          {/* 15 */}
          <Section id="mistakes" title="Common mistakes" lead="Everyone makes a few of these. Knowing them is most of the fix.">
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {MISTAKES.map((m) => (
                <li key={m.title}>
                  <p className="text-[16px] font-semibold text-halo-ink">{m.title}</p>
                  <p className="text-[15px]">{m.body}</p>
                </li>
              ))}
            </ul>
            <Callout>You don’t need to remember all of this. Be curious, be prepared, and follow through. The rest gets easier with every conversation.</Callout>
          </Section>
        </div>
      </div>
    </div>
  );
}
