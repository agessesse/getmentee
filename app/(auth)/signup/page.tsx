import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata = {
  title: 'Create Account - Mentable',
  description: 'Join the Mentable network',
};

export default function SignupPage() {
  // SignupForm reads ?role= to skip the chooser, so it needs a boundary for
  // the route to keep prerendering.
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
