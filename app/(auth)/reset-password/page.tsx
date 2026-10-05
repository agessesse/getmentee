import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = {
  title: 'Set a new password · Mentable',
  // A recovery page must never be indexed, and must never be cached: it is
  // reached with a one-time token in the URL.
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
