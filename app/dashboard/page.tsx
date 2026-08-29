import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, role')
    .eq('id', data.claims.sub)
    .single();

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">
          Welcome{profile?.first_name ? `, ${profile.first_name}` : ''}
        </h1>

        <p className="mt-4 text-gray-600">
          Your Mentee dashboard is ready.
        </p>
      </div>
    </main>
  );
}
