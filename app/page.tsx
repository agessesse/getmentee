export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-navy-900">Mentee</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
          Find the person who remembers being where you are
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect with mentors who understand your goals, background, and path.
          Build meaningful relationships that lead to real growth.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-navy-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-navy-700 transition">
            Find a Mentor
          </button>
          <button className="border-2 border-navy-600 text-navy-600 px-8 py-3 rounded-lg font-medium hover:bg-navy-50 transition">
            Become a Mentor
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>&copy; 2026 Mentee. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
