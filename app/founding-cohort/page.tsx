import { permanentRedirect } from 'next/navigation';

/**
 * /founding-cohort — kept as a permanent redirect to /cohort-001.
 *
 * WHY THE ROUTE MOVED. "Founding cohort" and "Cohort 001" were two names for
 * one thing. The homepage, the hero signal, the application and the analytics
 * dimension all say Cohort 001, and a second name for the same programme is
 * the kind of small incoherence a first cohort cannot afford.
 *
 * WHY IT IS NOT DELETED. Nothing in the repository links here any more, but
 * the URL has been public, it was the nav's Apply destination for a while, and
 * it is in the sitemap Google has already crawled. A 404 would lose exactly
 * the people it was built for.
 *
 * 308 rather than 307: the move is permanent and search engines should
 * transfer the old URL's standing to the new one rather than keep both.
 */
export default function FoundingCohortRedirect() {
  permanentRedirect('/cohort-001');
}
