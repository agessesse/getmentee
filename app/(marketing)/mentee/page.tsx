import type { Metadata } from 'next';
import MenteeView from '@/components/marketing/MenteeView';

export const metadata: Metadata = {
  title: 'For students: find and build a real mentorship | Mentable',
  description:
    'Find someone who has already done the work you want to do, send a request worth answering, and keep the relationship going with shared goals, sessions and follow-through.',
  alternates: { canonical: '/mentee' },
  openGraph: {
    title: 'For students: find and build a real mentorship',
    description:
      'Find someone who has already done the work you want to do, send a request worth answering, and keep the relationship going.',
    url: '/mentee',
    type: 'website',
  },
};

export default function MenteePage() {
  return <MenteeView />;
}
