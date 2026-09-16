'use client';

import { usePathname } from 'next/navigation';

/**
 * Replays the portal arrival (see .portal-arrive in globals.css) on every route
 * change. The key is what makes it replay: layouts persist across navigation,
 * so without a fresh element the animation would only ever run once.
 */
export default function RouteArrive({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={`portal-arrive ${className}`}>
      {children}
    </div>
  );
}
