import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Sign In - Mentee',
  description: 'Sign in to your Mentee account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to your Mentee account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
