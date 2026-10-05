'use client';

import { useState, useEffect } from 'react';
import SideNav from '@/components/app/SideNav';
import BottomNav from '@/components/app/BottomNav';
import TopNav from '@/components/layout/TopNav';
import RouteArrive from '@/components/layout/RouteArrive';
import SignInTransition from '@/components/auth/SignInTransition';
import { TenantNotice } from '@/components/app/ProgramIdentity';
import { ProfileProvider, type ProfileContextValue } from '@/lib/profile-context';
import type { TenantIdentity } from '@/lib/theme/identity';

/**
 * The frame every authenticated screen inherits.
 *
 * WHERE THE THEME IS APPLIED, and why it is one inline style object.
 *
 * `themeVars` is a set of CSS custom properties resolved on the server from
 * the signed-in person's own membership. Setting them on this one element
 * re-colours everything inside it, because every Halo token in
 * tailwind.config.ts is now rgb(var(--halo-*) / <alpha-value>). No component
 * below here knows a tenant exists; `bg-halo-veil` simply resolves to a
 * different colour.
 *
 * Inline rather than a <style> tag or a class, for three reasons that all
 * matter: it is server-rendered with the first byte, so there is no flash of
 * the platform's purple before an institution's navy; it needs no nonce under
 * a future CSP; and inline styles outrank every selector, so a tenant theme
 * cannot be half-applied by specificity.
 *
 * An empty object is the Mentable default, which is the literal token set on
 * :root in globals.css. That is the path for all ten current relationships.
 */
export default function AppShell({
  profile,
  tenant,
  themeVars,
  children,
}: {
  profile: ProfileContextValue;
  tenant: TenantIdentity | null;
  themeVars: Record<string, string>;
  children: React.ReactNode;
}) {
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('mentee_signin_transition')) {
      sessionStorage.removeItem('mentee_signin_transition');
      setShowSignIn(true);
    }
  }, []);

  return (
    <>
      {showSignIn && <SignInTransition onComplete={() => setShowSignIn(false)} />}
      <ProfileProvider profile={profile}>
        <div
          style={themeVars as React.CSSProperties}
          data-tenant={tenant?.organizationId ?? undefined}
          className="flex h-screen bg-halo-ivory text-halo-ink font-body overflow-hidden"
        >
          <SideNav
            role={profile.role}
            tenant={tenant}
            firstName={profile.first_name}
            lastName={profile.last_name}
          />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <TopNav user={profile} role={profile.role} tenant={tenant} />

            {/*
              Bottom padding clears the mobile bar plus the home indicator, so
              the last line of a page is readable on a phone. Removed at lg,
              where the bar is not rendered.
            */}
            <main
              id="main-content"
              className="flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0"
            >
              {/*
                Every arrival replays the homepage hero's entrance: visible
                from the first frame, only the last 20px settling. No opacity,
                so nothing is hidden while data loads.
              */}
              <RouteArrive className="p-4 sm:p-6 lg:p-10">
                {children}
              </RouteArrive>

              {/*
                The tenant's disclaimer, on every authenticated screen, once.

                Below lg only. The side panel carries it on desktop, where it
                is visible without scrolling; there is no side panel on a
                phone, so it moves here. Rendering both at once put the same
                paragraph on screen twice, which reads as a mistake rather
                than as care.
              */}
              {tenant?.notice && (
                <div className="lg:hidden px-4 sm:px-6 pb-8">
                  <div className="border-t border-halo-rule pt-4 max-w-3xl">
                    <TenantNotice notice={tenant.notice} />
                  </div>
                </div>
              )}
            </main>
          </div>

          <BottomNav role={profile.role} />
        </div>
      </ProfileProvider>
    </>
  );
}
