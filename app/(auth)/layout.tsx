import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-navy-900 tracking-tight py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
          >
            Mentable
          </Link>
        </div>
      </nav>

      {/* Content */}
      {/*
        pt-24/pb-16 biased the card 32px below centre, which read as drift
        rather than composition. Equal padding lets flex centre it properly;
        the fixed 64px nav then supplies the slight upward bias the eye wants.
      */}
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-6 pt-24 pb-24"
      >
        {children}
      </main>
    </div>
  );
}
