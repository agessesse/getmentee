import type { Metadata } from 'next';
import AboutView from '@/components/marketing/AboutView';

export const metadata: Metadata = {
  title: 'About Mentable: mentorship should not depend on luck',
  description:
    'Mentable exists because access to good mentorship is distributed by accident. What the name means, what we believe, and the kind of mentorship culture we are trying to build.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Mentable: mentorship should not depend on luck',
    description:
      'Why access to good mentorship is distributed by accident, and what a better system looks like.',
    url: '/about',
    type: 'website',
  },
};

export default function AboutPage() {
  return <AboutView />;
}
