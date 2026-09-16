import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import {
  DM_Sans,
  Instrument_Serif,
  Newsreader,
  IBM_Plex_Sans,
} from 'next/font/google';

// ── The old system. Still loaded because the signed-in portal renders in it:
// the <body> below carries `font-sans`, which every protected route inherits.
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

// ── Halo, for the marketing pages. preload is off on all three: the portal is
// the larger surface and never renders any of them, so preloading would cost
// every signed-in page three font fetches it has no use for. Marketing picks
// them up through font-display / font-body / font-ui.
const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'], // the italic is not part of the system
  variable: '--font-newsreader',
  display: 'swap',
  preload: false,
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
  display: 'swap',
  preload: false,
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
    <html
      lang="en"
      className={`${dmSans.variable} ${instrumentSerif.variable} ${newsreader.variable} ${plexSans.variable}`}
    >
      <body className="bg-cream-50 text-navy-900 font-sans">
        {/*
          Keyboard and screen-reader users had to tab through the entire nav on
          every page before reaching content. Every <main> in the app carries
          id="main-content" so this one link works site-wide. It is off-screen
          until focused, which is the standard pattern.
        */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-3 focus:left-3 focus:px-4 focus:py-3 focus:bg-navy-900 focus:text-white focus:rounded-xl focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
