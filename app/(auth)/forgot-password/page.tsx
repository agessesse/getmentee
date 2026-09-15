import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata = {
  title: 'Reset Password - Mentable',
  description: 'Reset the password on your Mentable account.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
