import { SignupForm } from '@/components/auth/signup-form';

export const metadata = {
  title: 'Sign Up - Mentee',
  description: 'Create a new Mentee account',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4">
      <div className="w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Get Started</h1>
          <p className="text-gray-600">Create your Mentee account</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
