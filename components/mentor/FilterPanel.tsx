'use client';

import { Search, SlidersHorizontal } from 'lucide-react';

const EXPERTISE_OPTIONS = [
  'React', 'Node.js', 'TypeScript', 'Python', 'Go', 'UI/UX Design',
  'Product Management', 'Data Science', 'Machine Learning', 'DevOps',
  'Mobile Development', 'System Design', 'Leadership', 'Startups',
];

interface FilterPanelProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  sort: string;
  onSortChange: (v: string) => void;
}

export default function FilterPanel({
  search,
  onSearchChange,
  selectedTags,
  onTagToggle,
  sort,
  onSortChange,
}: FilterPanelProps) {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
      {/* Search */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search mentors..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-navy-900">Sort by</span>
        </div>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
        >
          <option value="rating">Highest Rated</option>
          <option value="experience">Most Experienced</option>
          <option value="newest">Newest</option>
          <option value="available">Available Now</option>
        </select>
      </div>

      {/* Expertise tags */}
      <div>
        <span className="text-sm font-medium text-navy-900 mb-2 block">Expertise</span>
        <div className="flex flex-wrap gap-2">
          {EXPERTISE_OPTIONS.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-navy-600 text-white border-navy-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-navy-400'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        {selectedTags.length > 0 && (
          <button
            onClick={() => selectedTags.forEach(onTagToggle)}
            className="text-xs text-navy-600 hover:underline mt-2"
          >
            Clear filters
          </button>
        )}
      </div>
    </aside>
  );
}
