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

export const metadata: Metadata = {
  title: 'Mentee — Find the Mentor Who Changes Everything',
  description:
    'Mentee connects ambitious students and early-career professionals with experienced mentors at leading firms. Match, connect, meet, and grow.',
  openGraph: {
    title: 'Mentee — Find the Mentor Who Changes Everything',
    description:
      'A curated mentorship platform built around matching, accountability, and long-term career development.',
    type: 'website',
    siteName: 'Mentee',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mentee — Find the Mentor Who Changes Everything',
    description:
      'A curated mentorship platform built around matching, accountability, and long-term career development.',
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
