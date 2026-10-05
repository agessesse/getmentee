import type { Metadata } from 'next';
import SiteHeader from '@/components/marketing/SiteHeader';
import SiteFooter from '@/components/marketing/SiteFooter';
import OrganizationInquiry from '@/components/marketing/OrganizationInquiry';

export const metadata: Metadata = {
  title: 'Mentorship infrastructure for communities · Mentable',
  description:
    'Your alumni already want to help. Mentable helps the right person find them, gives the relationship structure, and shows program leaders whether it is working.',
  alternates: { canonical: '/organizations' },
  openGraph: {
    title: 'Bring Mentable to your community',
    description:
      'Activation, matching, structure and measurement for mentorship programs. The relationship stays between two people.',
    type: 'website',
    siteName: 'Mentable',
  },
};

/*
  The institutional page.

  WHAT IT MUST NOT BECOME. Enterprise SaaS. No logo wall, no "trusted by", no
  invented metrics, no case study, no demo-booking widget. Mentable has no
  institutional customers, and a page that implied otherwise would be found
  out in the first meeting. Everything here is a description of what the
  software does, which is verifiable by opening it.

  WHY IT DOES NOT MENTION CAROLINA. There is no partnership. The use cases
  below are the kinds of community this architecture supports, written as
  categories rather than named institutions, so nothing has to be walked back.

  Same visual system as every other page: ivory and veil bands, the eyebrow
  and display scale, no new primitives.
*/

const EYEBROW = 'font-ui text-[11px] font-semibold uppercase tracking-[0.14em]';

const PILLARS = [
  {
    k: 'Activate',
    v: 'Invite mentors and students into one place, by link, with a record of who was asked and who accepted.',
  },
  {
    k: 'Match',
    v: 'Pair people on what someone needs and where another person can genuinely help, rather than leaving a student to guess who would say yes.',
  },
  {
    k: 'Structure',
    v: 'Every relationship gets goals, conversations, next steps and a record of what was agreed, so the fourth conversation starts where the third ended.',
  },
  {
    k: 'Understand',
    v: 'Program leaders see participation, matches and whether relationships are still moving. They never see what two people said to each other.',
  },
];

const COMMUNITIES = [
  { k: 'Universities', v: 'Alumni and current students' },
  { k: 'Companies', v: 'Experienced professionals and emerging talent' },
  { k: 'Veterans organizations', v: 'Veterans and transitioning service members' },
  { k: 'Professional communities', v: 'Established members and early-career members' },
];

export default function OrganizationsPage() {
  return (
    <div className="font-body min-h-screen bg-halo-ivory flex flex-col overflow-x-clip">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 lg:py-24 px-6 lg:px-10" aria-labelledby="org-heading">
          <div className="max-w-3xl mx-auto">
            <p className={`${EYEBROW} text-halo-purple-d mb-5`}>For organizations</p>
            <h1
              id="org-heading"
              className="font-display text-halo-ink leading-[1.02] tracking-tight mb-6"
              style={{ fontSize: 'clamp(2.25rem, 6vw, 3.5rem)', textWrap: 'balance' }}
            >
              Your people already want to help each other.
            </h1>
            <p className="text-[17px] text-halo-heather leading-relaxed max-w-xl mb-4">
              Alumni want to give back. Students want guidance. Experienced people are
              willing to pass forward what they had to learn the hard way.
            </p>
            <p className="text-[17px] text-halo-heather leading-relaxed max-w-xl mb-8">
              The hard part was never the goodwill. It is turning that willingness into the
              right relationship, and keeping the relationship going once the first
              conversation is over. That is the part Mentable handles.
            </p>
            <a
              href="#talk"
              className="inline-flex items-center gap-2 bg-halo-purple text-white text-[15px] font-semibold px-6 py-3 rounded-xl shadow-sm hover:bg-halo-purple-d transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple focus-visible:ring-offset-2"
            >
              Bring Mentable to your community
            </a>
          </div>
        </section>

        {/* ── The four pillars ─────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 px-6 lg:px-10 bg-halo-veil border-y border-halo-rule" aria-labelledby="how-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="how-heading" className="font-display text-halo-ink leading-tight text-[1.75rem] mb-3">
              What Mentable does
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-8">
              Mentable is the infrastructure around a relationship. The relationship itself
              still belongs to the two people in it.
            </p>
            <dl className="border-t border-halo-rule">
              {PILLARS.map((p) => (
                <div key={p.k} className="border-b border-halo-rule py-5 grid grid-cols-1 sm:grid-cols-[minmax(0,10rem)_1fr] gap-x-8 gap-y-1.5">
                  <dt className="font-display text-halo-ink text-[20px] leading-snug">{p.k}</dt>
                  <dd className="text-[15.5px] text-halo-heather leading-relaxed">{p.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Privacy, stated early ────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 px-6 lg:px-10" aria-labelledby="privacy-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="privacy-heading" className="font-display text-halo-ink leading-tight text-[1.75rem] mb-4">
              What administrators can and cannot see
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-4">
              Program leaders can see who is taking part, who has been matched, who is still
              waiting, how many conversations have happened, and which relationships have
              gone quiet. That is enough to run a program well.
            </p>
            {/*
              The strongest claim on this page, and the one most worth being
              precise about. It is true at the database level, not by policy:
              administrators have no grant on the messages table.
            */}
            <p className="text-[16px] text-halo-ink leading-relaxed max-w-xl font-medium">
              They cannot read messages between a mentor and a student. Not as an option
              that is switched off, but as something the software does not provide. A
              mentorship only works if both people can speak freely.
            </p>
          </div>
        </section>

        {/* ── Who this is for ──────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 px-6 lg:px-10 bg-halo-veil border-y border-halo-rule" aria-labelledby="who-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="who-heading" className="font-display text-halo-ink leading-tight text-[1.75rem] mb-3">
              Communities this fits
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-8">
              One organization can run several programs at once, each with its own
              participants and its own leads.
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 border-t border-halo-rule">
              {COMMUNITIES.map((c) => (
                <div key={c.k} className="border-b border-halo-rule py-4">
                  <dt className="font-display text-halo-ink text-[18px] leading-snug mb-1">{c.k}</dt>
                  <dd className="text-[14.5px] text-halo-mist-body leading-snug">{c.v}</dd>
                </div>
              ))}
            </dl>
            {/* No customer is named because there is not one yet. */}
            <p className="text-[13.5px] text-halo-mist-body leading-relaxed mt-6 max-w-xl">
              These are the kinds of community the software supports. Mentable is early and
              is not yet running a program for any of them.
            </p>
          </div>
        </section>

        {/* ── Inquiry ──────────────────────────────────────────────────────── */}
        <section id="talk" className="py-16 sm:py-20 px-6 lg:px-10 scroll-mt-6" aria-labelledby="talk-heading">
          <div className="max-w-3xl mx-auto">
            <h2
              id="talk-heading"
              className="font-display text-halo-ink leading-tight mb-3"
              style={{ fontSize: 'clamp(1.75rem, 3.6vw, 2.25rem)' }}
            >
              Bring Mentable to your community
            </h2>
            <p className="text-[16px] text-halo-heather leading-relaxed max-w-xl mb-8">
              Tell us who you are trying to connect. Three fields are required and the rest
              help us come to the first conversation already understanding something.
            </p>
            <OrganizationInquiry />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
