import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/supabase/admin';
import AdminNav from '@/components/admin/AdminNav';

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
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <h1 className="text-lg font-semibold text-purple-900 mb-2">Admin is not configured</h1>
            <p className="text-[15px] text-gray-600 leading-relaxed">
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
    <div className="min-h-screen bg-gray-50 text-purple-900">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 h-14 flex items-center gap-6">
          <Link href="/admin" className="flex items-baseline gap-2 py-2">
            <span className="text-[15px] font-bold tracking-tight">Mentable</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Admin
            </span>
          </Link>
          <div className="ml-auto">
            <Link
              href="/dashboard"
              className="text-[13px] text-gray-600 hover:text-purple-900 transition-colors py-3"
            >
              Exit to app
            </Link>
          </div>
        </div>
        <AdminNav />
      </header>

      <main className="px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
