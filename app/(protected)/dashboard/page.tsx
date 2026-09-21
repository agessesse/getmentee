'use client';

import { useProfile } from '@/lib/profile-context';
import MentorDashboard from '@/components/dashboard/MentorDashboard';
import MenteeDashboard from '@/components/dashboard/MenteeDashboard';

/**
 * Mentors and mentees get different homes. The role is already on the profile
 * context, populated by the protected layout before this page mounts, so the
 * split costs nothing and neither side ever renders the other's data.
 *
 * Both sides are built from the same bands, the same relationship card, and
 * the same decision logic in lib/mentorship/next-action.ts. Keeping this
 * splitter thin is what stops the two sides drifting apart again.
 */
export default function DashboardPage() {
  const profile = useProfile();
  return profile?.role === 'mentor' ? <MentorDashboard /> : <MenteeDashboard />;
}
