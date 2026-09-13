import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { DM_Sans, Instrument_Serif } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument-serif',
  display: 'swap',
});

// Absolute-URL base for canonicals and OG/Twitter images. Without it Next
// emits relative image URLs no social scraper can resolve, so the
// summary_large_image card below rendered empty. Set NEXT_PUBLIC_APP_URL in
// the deployment environment.
const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  title: 'Mentable: find someone worth learning from',
  description:
    'Mentable connects ambitious students with experienced professionals who have walked the path ahead. Find a mentor, set goals, and follow through.',
  openGraph: {
    title: 'Mentable: find someone worth learning from',
    description:
      'Teachable. Coachable. Ready to grow. A mentorship platform built around real relationships, goals, and follow-through.',
    type: 'website',
    siteName: 'Mentable',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mentable: find someone worth learning from',
    description:
      'Teachable. Coachable. Ready to grow. A mentorship platform built around real relationships, goals, and follow-through.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body className="bg-cream-50 text-navy-900 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
