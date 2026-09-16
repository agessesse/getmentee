import type { Metadata } from 'next';
import LegalPage, { LegalSection, LegalList } from '@/components/marketing/LegalPage';

export const metadata: Metadata = {
  title: 'Accessibility at Mentable',
  description: 'How Mentable is built to be usable, what has been tested, and how to report a barrier.',
};

/*
 * Deliberately not a compliance claim. No standard is named as met, because
 * nothing here has been audited against one. What the page does instead is list
 * the specific things that were built and tested, which is checkable, and
 * invite reports of what was missed.
 */
export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Accessibility"
      title="Built to be usable."
      lead="Mentable should be usable by as many people as possible. This page says what has actually been built and tested, rather than claiming a standard nobody has audited."
      updated="15 September 2026"
    >
      <LegalSection title="What has been built">
        <LegalList
          items={[
            'Every page can be operated with a keyboard alone, and every focusable control shows a visible focus ring.',
            'A skip link is the first thing in the tab order on each page.',
            'Pages use real landmarks and one main heading, with the rest nested beneath it in order.',
            'Text colours were chosen against measured contrast ratios rather than by eye, and three colours in the palette are restricted to non-text use because they do not clear the threshold.',
            'Animation is switched off for anyone whose system asks for reduced motion, and no information is carried by animation alone.',
            'No information anywhere on the public pages requires hovering to reach.',
            'Public pages render and read completely with JavaScript disabled.',
            'Touch targets on the public pages are sized for a finger, not a cursor.',
            'Images that carry meaning have text alternatives, and decorative images are hidden from screen readers rather than described.',
            'Menus and dialogs close on Escape and return focus to the control that opened them.',
          ]}
        />
      </LegalSection>

      <LegalSection title="What we have not done">
        <p>
          Mentable has not been audited by an independent accessibility specialist, and
          has not been certified against WCAG or any other standard. We are not going to
          claim otherwise on this page.
        </p>
        <p>
          The signed-in product has had less accessibility attention than the public pages
          so far. That is the honest position and it is the next area of work.
        </p>
      </LegalSection>

      <LegalSection title="Telling us about a barrier">
        <p>
          If something here does not work with the tools you use, we want to know
          specifically what and where. Mentable does not yet publish a dedicated
          accessibility address; until it does, reports reach us through the founder.
        </p>
        <p>
          A report that names the page, the assistive technology and what happened will
          get fixed faster than a general one, and neither will be ignored.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
