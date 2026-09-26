import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Sign in - Mentable',
  description: 'Sign in to your Mentable account.',
};

/*
  LoginForm reads ?role= so it can hand role intent back to /apply. That makes
  it a useSearchParams consumer, which Next requires to sit under a Suspense
  boundary or the whole route opts out of static rendering with a build-time
  error. The fallback is deliberately nothing: the form appears on the same
  paint in practice, and a skeleton would flash.
*/
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
