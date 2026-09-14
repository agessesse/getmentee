'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Keeps the redacted page_location current across App Router navigation.
 *
 * Sends nothing itself. Enhanced Measurement remains the only source of
 * page_view; this just makes sure the location it reports has had UUID path
 * segments and query strings stripped first.
 */
export default function GaLocationRedactor() {
  const pathname = usePathname();

  useEffect(() => {
    const w = window as unknown as {
      gtag?: (...a: unknown[]) => void;
      __mentableRedact?: (href: string) => string;
    };
    if (!w.gtag || !w.__mentableRedact) return;
    w.gtag('set', { page_location: w.__mentableRedact(window.location.href) });
  }, [pathname]);

  return null;
}
