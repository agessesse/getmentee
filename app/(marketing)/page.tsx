import type { Metadata } from 'next';
import HomeView from '@/components/marketing/HomeView';

export const metadata: Metadata = {
  title: 'Mentable: find someone who has already done the job you want',
  description:
    'Mentorship should not depend on luck. Mentable connects students with people a few steps ahead of them, and keeps the relationship going after the introduction.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Mentable: find someone who has already done the job you want',
    description:
      'Mentorship should not depend on luck. Mentable connects students with people a few steps ahead of them, and keeps the relationship going after the introduction.',
    url: '/',
    type: 'website',
  },
};

export default function HomePage() {
  return <HomeView />;
}
