import type { Metadata } from 'next';
import LegalPage, { LegalSection, LegalList } from '@/components/marketing/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of use at Mentable',
  description: 'What Mentable does, what it does not promise, and what is expected of you.',
};

/*
 * Conservative on purpose, and deliberately silent where a real decision is
 * required rather than guessing at one. Not stated anywhere below, because
 * every one of them is a founder or legal call and inventing an answer would
 * be worse than the gap: governing law, venue, arbitration, a minimum age, an
 * indemnity, a liability cap, and any retention period.
 */
export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Using Mentable."
      lead="Plain terms for an early product. They describe what Mentable does, what it deliberately does not promise, and what is expected of the people using it."
      updated="15 September 2026"
    >
      <LegalSection title="What Mentable is">
        <p>
          Mentable helps students and professionals find each other and keep a mentorship
          organised once it starts. It holds requests, shared goals, sessions, notes and
          action items in one place.
        </p>
        <p>
          The mentoring is done by people. Mentable is the structure around it and is not
          a party to the relationship.
        </p>
      </LegalSection>

      <LegalSection title="What we do not promise">
        <LegalList
          items={[
            'That a mentor will be available, or available in your field.',
            'That anyone will respond to a request, or accept one.',
            'That a mentorship will lead to an internship, a job, an admission, an introduction or any other outcome.',
            'That advice you receive will be correct, or right for your situation.',
            'That the service will be available without interruption.',
          ]}
        />
        <p>
          Mentable does not screen, verify or background-check its users. Published
          mentor backgrounds are compiled from information available about those people,
          and you should exercise the same judgment you would with anyone you met through
          an introduction.
        </p>
      </LegalSection>

      <LegalSection title="Mentorship is not professional advice">
        <p>
          Mentors on Mentable work in fields including finance, law, medicine, engineering
          and others where formal advice is regulated. A conversation on Mentable is
          mentorship: someone describing their own experience and judgment.
        </p>
        <p>
          It is not financial, legal, medical, tax or any other professional advice, no
          professional relationship is created by using this service, and it should not be
          relied on in place of advice from someone you have engaged to act for you.
        </p>
      </LegalSection>

      <LegalSection title="What is expected of you">
        <LegalList
          items={[
            'Give accurate information about who you are, what you are studying or doing, and what you are looking for.',
            'One account per person, and do not share it.',
            'Treat the other person and their time with respect.',
            'Do not use Mentable to recruit, sell, solicit, harass, or contact anyone who has declined.',
            'Do not republish someone else’s messages, notes or personal details from inside a mentorship.',
          ]}
        />
        <p>
          You can report another user from inside the product. We may suspend or remove an
          account that breaks these expectations.
        </p>
      </LegalSection>

      <LegalSection title="What you write">
        <p>
          Your messages, notes, goals and profile text remain yours. You give Mentable
          permission to store and display them as the product requires, which means
          showing them to the person you are in a mentorship with and to you.
        </p>
        <p>
          The Mentable name, the site and the software are ours. Everything else on the
          site belongs to whoever wrote it.
        </p>
      </LegalSection>

      <LegalSection title="Leaving">
        <p>
          You can delete your account at any time from inside the product, and the privacy
          page describes exactly what that removes and what it deliberately leaves behind.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          Mentable is being built, and these terms will change as it does. The date at the
          top of this page is the date it last changed.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
