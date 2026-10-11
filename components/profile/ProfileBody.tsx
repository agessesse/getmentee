import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { MapPin, GraduationCap, ExternalLink, Pencil, Handshake } from 'lucide-react';
import type { ProfileView } from '@/lib/profile/view';

/**
 * A person's page, whether it is yours or someone else's.
 *
 * THE TWO QUESTIONS IT EXISTS TO ANSWER, in this order:
 *   what can this person help with
 *   what does this person want help with
 *
 * Everything above them is only enough context to make those two mean
 * something: a name, what they do, where they studied. No work history, no
 * endorsements, no skill bars. A Mentable profile is read by one person
 * deciding whether a conversation would be worth both their time, and
 * nothing on a resume answers that.
 *
 * Generous type and spacing throughout. Mentors in Cohort 001 may be in
 * their sixties; nothing here is below 13px, and no control is an
 * unlabelled icon.
 */
export default function ProfileBody({ p }: { p: ProfileView }) {
  const education = p.university
    ? `${p.university}${p.graduationYear ? ` '${String(p.graduationYear).slice(-2)}` : ''}`
    : null;

  const helpsTitle = p.role === 'mentor' ? 'What I can help with' : 'What I could help with';
  const wantsTitle = p.role === 'mentor' ? 'What I want from mentoring' : 'What I want help with';

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-start gap-4 sm:gap-5">
        <Avatar src={p.avatarUrl} name={p.fullName} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[1.75rem] sm:text-[2rem] leading-tight text-halo-ink">
            {p.fullName}
          </h1>
          {(p.roleLine || p.company) && (
            <p className="text-[15px] text-halo-heather leading-snug mt-1">
              {p.roleLine}
              {p.roleLine && p.company ? ' · ' : ''}
              {p.company}
            </p>
          )}
          {p.headline && !p.roleLine && (
            <p className="text-[15px] text-halo-heather leading-snug mt-1">{p.headline}</p>
          )}

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
            {education && (
              <li className="inline-flex items-center gap-1.5 text-[13px] text-halo-mist-body">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                {education}
              </li>
            )}
            {p.location && (
              <li className="inline-flex items-center gap-1.5 text-[13px] text-halo-mist-body">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {p.location}
              </li>
            )}
            {p.linkedinUrl && (
              <li>
                <a
                  href={p.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] text-halo-brand-text hover:text-halo-ink underline underline-offset-2 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  LinkedIn
                </a>
              </li>
            )}
          </ul>
        </div>
      </header>

      {/* Actions. Named in words, never an icon on its own. */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {p.isMe ? (
          <Link
            href="/profile/setup"
            className="inline-flex items-center gap-2 rounded-xl border border-halo-rule px-4 py-2.5 text-[14px] font-medium text-halo-ink hover:bg-halo-veil transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
          >
            <Pencil className="h-4 w-4 text-halo-brand-text" aria-hidden="true" />
            Edit your profile
          </Link>
        ) : p.sharedMentorshipId ? (
          <Link
            href={`/mentorship/${p.sharedMentorshipId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-halo-purple px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
          >
            <Handshake className="h-4 w-4" aria-hidden="true" />
            Open your mentorship
          </Link>
        ) : null}
        {!p.isMe && (
          <Link
            href="/messages"
            className="inline-flex items-center gap-2 rounded-xl border border-halo-rule px-4 py-2.5 text-[14px] font-medium text-halo-ink hover:bg-halo-veil transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
          >
            Message {p.firstName}
          </Link>
        )}
      </div>

      {p.isMe && p.tenant && (
        <p className="mt-5 text-[13px] text-halo-heather">
          {p.tenant.displayName}
          {[p.tenant.programName, p.tenant.term].filter(Boolean).length > 0 && (
            <span className="text-halo-mist-body">
              {' · '}{[p.tenant.programName, p.tenant.term].filter(Boolean).join(' · ')}
            </span>
          )}
        </p>
      )}

      <div className="mt-8 space-y-7">
        {p.bio && (
          <Section title="About">
            <p className="text-[15px] text-halo-heather leading-relaxed whitespace-pre-line">{p.bio}</p>
          </Section>
        )}

        {p.helps.length > 0 && (
          <Section title={helpsTitle}>
            <Tags items={p.helps} />
          </Section>
        )}

        {p.wants.length > 0 && (
          <Section title={wantsTitle}>
            <Tags items={p.wants} />
          </Section>
        )}

        {/*
          NOT "Why I mentor". mentor_profiles.goals means "goals they help
          somebody else reach" (migration 0002), so labelling it as the
          mentor's own motivation would put words in their mouth. Their
          actual motivation is captured at commitment and lives on the
          cohort membership, not here.
        */}
        {p.goals && (
          <Section title={p.role === 'mentor' ? 'Goals I help with' : 'What I’m working toward'}>
            <p className="text-[15px] text-halo-heather leading-relaxed whitespace-pre-line">{p.goals}</p>
          </Section>
        )}

        {/*
          The only state that matters on your own empty profile: not an
          error, just the next thing to do. On somebody else's it says
          nothing, because an incomplete profile is their business.
        */}
        {p.isMe && !p.bio && p.helps.length === 0 && p.wants.length === 0 && (
          <div className="rounded-2xl border border-dashed border-halo-rule px-5 py-6">
            <p className="text-[15px] text-halo-ink">Your profile is nearly empty.</p>
            <p className="text-[14px] text-halo-heather leading-relaxed mt-1.5 max-w-md">
              {p.role === 'mentor'
                ? 'A few lines about what you can help with is the difference between a student guessing and a student asking you the right question.'
                : 'Say what you’re working toward and where you’re stuck. It’s what a mentor reads before your first conversation.'}
            </p>
            <Link
              href="/profile/setup"
              className="inline-block mt-4 rounded-xl bg-halo-purple px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
            >
              Fill it in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-ui text-[10.5px] font-semibold uppercase tracking-[0.14em] text-halo-mist-body mb-2.5">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Tags({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((t) => (
        <li
          key={t}
          className="rounded-full bg-halo-veil border border-halo-rule px-3 py-1.5 text-[13.5px] text-halo-heather"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}
