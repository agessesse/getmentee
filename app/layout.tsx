import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { DM_Sans, Instrument_Serif } from 'next/font/google';
import { siteUrl } from '@/lib/site';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

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


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  manifest: '/manifest.webmanifest',
  // favicon.svg carries its own dark-mode switch, so it leads; the PNGs are
  // the legacy fallback for browsers that ignore SVG favicons.
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
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

// Tints the browser chrome on mobile with the brand primary.
export const viewport: Viewport = {
  themeColor: '#4717CA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body className="bg-cream-50 text-purple-900 font-sans">
        <AuthProvider>{children}</AuthProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
