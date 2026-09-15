import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata = {
  title: 'Create Account - Mentable',
  description: 'Join the Mentable network',
};

export default function SignupPage() {
  // SignupForm reads ?role= with useSearchParams so the landing page CTAs can
  // carry the visitor's choice through. Next requires that read to sit inside a
  // Suspense boundary or the whole route opts out of static rendering.
  return (
    <Suspense fallback={<div className="w-full max-w-lg mx-auto min-h-[420px]" />}>
      <SignupForm />
    </Suspense>
  );
}
