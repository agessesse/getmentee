import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/supabase/admin';
import AdminNav from '@/components/admin/AdminNav';
import RouteArrive from '@/components/layout/RouteArrive';
import Wordmark from '@/components/ui/Wordmark';

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

// Admin data is per-request and must never be cached at the edge.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const gate = await requireAdmin();

  if (!gate.ok) {
    if (gate.reason === 'unauthenticated') redirect('/login');
    if (gate.reason === 'misconfigured') {
      return (
        <main id="main-content" className="min-h-screen bg-halo-ivory font-body flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <h1 className="font-display font-normal text-2xl leading-tight text-halo-ink mb-2">Admin is not configured</h1>
            <p className="text-[15px] text-halo-heather leading-relaxed">
              SUPABASE_SERVICE_ROLE_KEY is not set in this environment, so admin
              queries cannot run. Add it to the deployment environment and reload.
            </p>
          </div>
        </main>
      );
    }
    // Forbidden: send non-admins to their own dashboard rather than confirming
    // that /admin exists.
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-halo-ivory text-halo-ink font-body">
      <header className="sticky top-0 z-30 bg-halo-ivory/85 backdrop-blur-md border-b border-halo-rule">
        <div className="px-4 sm:px-6 lg:px-10 h-16 flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-3 py-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple">
            <Wordmark size="sm" />
            <span className="text-[11px] font-semibold font-ui uppercase tracking-[0.14em] text-halo-mist-body">
              Admin
            </span>
          </Link>
          <div className="ml-auto">
            <Link
              href="/dashboard"
              className="text-[13px] text-halo-heather hover:text-halo-ink transition-colors py-3"
            >
              Exit to app
            </Link>
          </div>
        </div>
        <AdminNav />
      </header>

      <main id="main-content" className="px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <RouteArrive>{children}</RouteArrive>
      </main>
    </div>
  );
}
