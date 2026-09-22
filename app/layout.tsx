import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import PageTransition from '@/components/marketing/PageTransition';
import { INTRO_SESSION_KEY, INTRO_COVER_CLASS } from '@/components/marketing/intro-session';
import {
  DM_Sans,
  Instrument_Serif,
  Newsreader,
  IBM_Plex_Sans,
} from 'next/font/google';
import { originForMetadata } from '@/lib/site';

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
const siteUrl = originForMetadata();

/*
  Runs while the HTML is still being parsed, before the first paint.

  The homepage intro is a client component, so it can only decide to play after
  the server-rendered page has already been drawn, which showed the landing
  page for a moment before the intro covered it. This makes the same decision
  up front (homepage, and either not yet seen this session, ?intro, or dev,
  exactly as IntroSequence decides) and paints the intro's black ground first.
  IntroSequence removes the class the moment its own overlay is on screen.

  If JavaScript never hydrates, a CSS timeout in globals.css lifts the cover,
  so a failed load can never leave the page black.
*/
const INTRO_COVER_SCRIPT = `(function(){try{
if(location.pathname!=='/')return;
var forced=new URLSearchParams(location.search).has('intro');
var always=${JSON.stringify(process.env.NODE_ENV === 'development')};
var seen=false;try{seen=!!sessionStorage.getItem(${JSON.stringify(INTRO_SESSION_KEY)})}catch(e){}
if(!forced&&!always&&seen)return;
document.documentElement.classList.add(${JSON.stringify(INTRO_COVER_CLASS)});
}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  /*
    What a stranger sees when the link is pasted into iMessage, Instagram or
    LinkedIn. The old description said Mentable "connects ambitious students
    with experienced professionals", present tense, which described a working
    marketplace rather than the thing that exists. These say what it is and
    that it is early, because the first people we want are the ones who find
    that interesting rather than disqualifying.
  */
  title: 'Mentable: find someone worth learning from',
  description:
    'Good mentorship mostly depends on luck. Mentable is being built to make it depend on that less. We’re early, and looking for the first students and mentors to build it with us.',
  openGraph: {
    title: 'Mentable: find someone worth learning from',
    description:
      'Good mentorship mostly depends on luck. We’re building Mentable to make it depend on that less — and looking for the first students and mentors to build it with us.',
    type: 'website',
    siteName: 'Mentable',
    // Next only emits og:url when it is given one; without it a scraper falls
    // back to whatever URL it happened to fetch, including query strings.
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mentable: find someone worth learning from',
    description:
      'Good mentorship mostly depends on luck. We’re building Mentable to make it depend on that less — and looking for the first students and mentors to build it with us.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: the cover script adds a class to <html> before
    // React hydrates, so the attribute legitimately differs from the server's.
    <html
      suppressHydrationWarning
      lang="en"
      className={`${dmSans.variable} ${instrumentSerif.variable} ${newsreader.variable} ${plexSans.variable}`}
    >
      <body className="bg-cream-50 text-navy-900 font-sans">
        <script dangerouslySetInnerHTML={{ __html: INTRO_COVER_SCRIPT }} />
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
        <AuthProvider>
          {children}
          {/*
            Mounted once, above everything. The component guards on both the
            current route and the destination, so it does nothing at all on
            auth, legal, profile and product pages.
          */}
          <PageTransition />
        </AuthProvider>
      </body>
    </html>
  );
}
