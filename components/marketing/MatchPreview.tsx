// PLACEHOLDER: This is a visual demo of the matching experience — not connected to live data.
// Replace with real match data or keep as a static product preview before public launch.

import { CheckCircle } from 'lucide-react';

const MATCH_REASONS = [
  'Similar academic background',
  'Entered investment banking through undergraduate recruiting',
  'Relevant industry experience',
  'Mentorship interests align with your goals',
  'Availability matches your preferences',
];

export default function MatchPreview() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-w-sm w-full">
      {/* Card header */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
            SC
          </div>
          <div>
            <div className="font-semibold text-navy-900 text-sm">Sarah Chen</div>
            <div className="text-xs text-gray-400">Associate · Investment Banking</div>
            <div className="text-xs text-gray-400">UNC Chapel Hill &rsquo;23</div>
          </div>
        </div>
      </div>

      {/* Match score */}
      <div className="px-5 py-4 bg-navy-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-navy-300">Match score</span>
          <span className="text-xl font-bold text-white">96%</span>
        </div>
        <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: '96%' }} />
        </div>
      </div>

      {/* Why you match */}
      <div className="p-5">
        <p className="text-xs font-semibold text-navy-900 uppercase tracking-wider mb-3">
          Why you match
        </p>
        <ul className="space-y-2">
          {MATCH_REASONS.map((reason) => (
            <li key={reason} className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-xs text-gray-600">{reason}</span>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="flex gap-2 mt-5">
          <button
            className="flex-1 text-xs font-medium text-center bg-navy-900 text-white py-2.5 rounded-lg hover:bg-navy-800 transition-colors"
            tabIndex={-1}
            aria-hidden="true"
          >
            View profile
          </button>
          <button
            className="flex-1 text-xs font-medium text-center border border-gray-200 text-navy-900 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            tabIndex={-1}
            aria-hidden="true"
          >
            Send request
          </button>
        </div>
      </div>
    </div>
  );
}
