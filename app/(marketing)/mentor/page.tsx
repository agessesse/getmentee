import type { Metadata } from 'next';
import MentorView from '@/components/marketing/MentorView';

export const metadata: Metadata = {
  title: 'For mentors: a structured way to give your time | Mentable',
  description:
    'See who is asking and why before you accept, set your own capacity, and let shared goals, sessions and action items carry the relationship after you say yes.',
  alternates: { canonical: '/mentor' },
  openGraph: {
    title: 'For mentors: a structured way to give your time',
    description:
      'See who is asking and why before you accept, set your own capacity, and let structure carry the relationship after you say yes.',
    url: '/mentor',
    type: 'website',
  },
};

export default function MentorPage() {
  return <MentorView />;
}
