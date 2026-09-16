import type { Metadata } from 'next';
import LegalPage, { LegalSection, LegalList } from '@/components/marketing/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy at Mentable',
  description:
    'What Mentable collects, where it is stored, who can see it, and how to delete it.',
};

/*
 * Written from the schema and the code, not from a template.
 *
 * Every category below was checked against supabase/migrations and the routes
 * that write to those tables. Things a generic policy would have claimed and
 * this one does not, because they are not true here: there is no advertising,
 * no ad identifiers, no analytics vendor, no tag manager, no payment
 * processing, no file uploads, no background checks, no location collection,
 * no selling of anything, and no model training on user content.
 *
 * KNOWN GAP, flagged rather than invented: Mentable publishes no contact
 * address, so this page cannot name one. That needs to exist before the page
 * is shown to an institution.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="What Mentable collects."
      lead="This describes what the product actually stores today, written from the database rather than from a template. Mentable is early, and this page will change as the product does."
      updated="15 September 2026"
    >
      <LegalSection title="What you give us">
        <p>
          An account requires a name, an email address and a password. Passwords are
          handled by Supabase, our authentication provider, and are never visible to us.
        </p>
        <p>Beyond that, everything is something you chose to enter:</p>
        <LegalList
          items={[
            'Profile details: a short biography, your school or employer, a headline, areas of interest or expertise, experience level, timezone and preferred session format.',
            'Mentorship requests, including what you are trying to accomplish and why you chose that person.',
            'Messages you send to someone you are matched with.',
            'Goals, sessions, session notes, and action items on a mentorship.',
            'Reviews and ratings you leave after a session.',
            'Availability windows, if you are a mentor.',
            'Reports you file about another user.',
          ]}
        />
        <p>
          Mentors may record the weekly hours they expect to give and an optional hourly
          rate. Mentable does not process payments and never sees a card.
        </p>
      </LegalSection>

      <LegalSection title="Opportunity Fund information">
        <p>
          If you apply to the Opportunity Fund, you may be asked about Pell Grant status,
          whether you are a first-generation student, and whether you receive need-based
          aid. Every one of those questions defaults to &ldquo;prefer not to say&rdquo; and
          none of them is required to use Mentable. It is kept separately from your
          profile and is not shown to mentors.
        </p>
      </LegalSection>

      <LegalSection title="What the product records on its own">
        <p>
          Mentable writes product events to its own database so we can see which parts of
          the product are used. An event stores your user id, your role, the name of the
          thing that happened, and the id of the record involved. There is no third-party
          analytics service, no tag manager and no advertising technology on this site.
        </p>
        <p>
          The site uses a cookie to keep you signed in, and browser session storage to
          remember that you have already seen the opening animation. Neither is used for
          tracking, and both are first-party.
        </p>
      </LegalSection>

      <LegalSection title="Who else is involved">
        <LegalList
          items={[
            'Supabase stores the database and runs authentication. Everything described above lives there.',
            'Vercel hosts the site and, like any web host, processes the requests your browser makes.',
            'Google supplies the small institution and company icons in the logo strips on the home page. Your browser fetches those from Google directly, so Google can see that a browser loaded the page.',
            'OpenAI processes session voice notes into transcripts and summaries. This applies only where voice input is switched on and only to recordings you deliberately make inside a session.',
          ]}
        />
        <p>
          That is the complete list. Mentable does not sell data, does not share it with
          advertisers, and does not use your content to train models of its own.
        </p>
      </LegalSection>

      <LegalSection title="Who can see what">
        <p>
          Access is enforced in the database, not only in the interface. Messages, goals,
          sessions and action items are readable by the two people in that mentorship and
          nobody else. A mentor sees the profile information and written request of a
          student who has written to them.
        </p>
        <p>
          Some profiles are published on public pages. Those pages carry only information
          provided for that purpose, and never your email address, your messages or
          anything inside a mentorship.
        </p>
      </LegalSection>

      <LegalSection title="Deleting your account">
        <p>
          You can delete your account from inside the product. Deletion removes your
          profile, your requests, your messages, your goals, your action items and your
          availability.
        </p>
        <p>
          Two things survive on purpose. Where a record belongs to both people, such as a
          completed session or a review someone else wrote, the other person keeps their
          copy with your name detached from it. Deleting your account should not delete
          someone else&rsquo;s history.
        </p>
      </LegalSection>

      <LegalSection title="Getting in touch">
        <p>
          Mentable is early and does not yet publish a dedicated privacy address. Until it
          does, reach the team through the founder, and account deletion is available to
          you directly in the product without needing to ask.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
