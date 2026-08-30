'use client';

// PLACEHOLDER: Replace STORIES data with verified production content before public launch.
// These are illustrative profiles — not real users or verified outcomes.

import StoryCard from './StoryCard';

interface Story {
  name: string;
  role: 'Mentor' | 'Mentee';
  company: string;
  title: string;
  focus: string;
  quote: string;
  initials: string;
  color: string;
}

const ROW_ONE: Story[] = [
  {
    name: 'Marcus Webb',
    role: 'Mentor',
    company: 'Morgan Stanley',
    title: 'VP, Investment Banking',
    focus: 'Breaking into finance',
    quote: 'I went through the same recruiting cycle my mentees are facing now. That shared experience makes the advice real, not generic.',
    initials: 'MW',
    color: '#1a1f3a',
  },
  {
    name: 'Priya Nair',
    role: 'Mentee',
    company: 'University of Virginia',
    title: 'Finance, Class of 2026',
    focus: 'Investment banking recruiting',
    quote: 'My mentor walked me through every round of interviews. I landed my summer offer in November.',
    initials: 'PN',
    color: '#3d4a8f',
  },
  {
    name: 'James Liu',
    role: 'Mentor',
    company: 'Bain Capital',
    title: 'Associate',
    focus: 'Private equity careers',
    quote: 'The questions my mentees ask me keep me sharp. It goes both ways.',
    initials: 'JL',
    color: '#5265b0',
  },
  {
    name: 'Aisha Thomas',
    role: 'Mentee',
    company: 'Georgetown University',
    title: 'Economics, Class of 2025',
    focus: 'Consulting recruiting',
    quote: 'Three sessions in, I had a completely different way of thinking about case interviews.',
    initials: 'AT',
    color: '#2d3668',
  },
  {
    name: 'Ryan Park',
    role: 'Mentor',
    company: 'McKinsey & Company',
    title: 'Engagement Manager',
    focus: 'Strategy consulting',
    quote: 'I mentor because someone did the same for me. It changes the trajectory.',
    initials: 'RP',
    color: '#1a1f3a',
  },
  {
    name: 'Sofia Reyes',
    role: 'Mentee',
    company: 'University of Michigan',
    title: 'Business, Class of 2026',
    focus: 'Product management',
    quote: 'My mentor helped me understand what PM recruiting actually looks for beyond the frameworks.',
    initials: 'SR',
    color: '#3d4a8f',
  },
];

const ROW_TWO: Story[] = [
  {
    name: 'David Chen',
    role: 'Mentor',
    company: 'Sequoia Capital',
    title: 'Principal',
    focus: 'Venture capital',
    quote: 'The best part of mentoring is watching someone realize they can do this.',
    initials: 'DC',
    color: '#5265b0',
  },
  {
    name: 'Emma Johnson',
    role: 'Mentee',
    company: 'Duke University',
    title: 'Finance & CS, Class of 2025',
    focus: 'Venture capital & tech',
    quote: 'I never thought VC was accessible until my mentor showed me exactly how she got there.',
    initials: 'EJ',
    color: '#2d3668',
  },
  {
    name: 'Kwame Mensah',
    role: 'Mentor',
    company: 'Goldman Sachs',
    title: 'Associate, Sales & Trading',
    focus: 'Markets careers',
    quote: 'Recruiting for markets is opaque unless you know someone on the inside. I try to be that person.',
    initials: 'KM',
    color: '#1a1f3a',
  },
  {
    name: 'Leila Ahmadi',
    role: 'Mentee',
    company: 'UNC Chapel Hill',
    title: 'Economics, Class of 2026',
    focus: 'Sales & trading',
    quote: 'Having a mentor from the exact desk I wanted to join made every conversation incredibly specific and useful.',
    initials: 'LA',
    color: '#3d4a8f',
  },
  {
    name: 'Carlos Mendes',
    role: 'Mentor',
    company: 'KKR',
    title: 'Associate',
    focus: 'Private equity',
    quote: 'I focus on helping mentees understand the buy-side transition early, not after the fact.',
    initials: 'CM',
    color: '#5265b0',
  },
  {
    name: 'Nina Okafor',
    role: 'Mentee',
    company: 'Wharton School',
    title: 'MBA, Class of 2026',
    focus: 'Private equity recruiting',
    quote: 'My mentor had done the exact move I was trying to make. Six weeks later, I had an offer.',
    initials: 'NO',
    color: '#2d3668',
  },
];

function CarouselRow({
  stories,
  direction,
}: {
  stories: Story[];
  direction: 'left' | 'right';
}) {
  const duplicated = [...stories, ...stories];
  const cls = direction === 'left' ? 'animate-carousel-left' : 'animate-carousel-right';

  return (
    <div className="relative overflow-hidden">
      {/* Fade edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-gray-50 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-gray-50 to-transparent"
      />

      <div
        className={`flex gap-4 py-2 ${cls} hover:[animation-play-state:paused]`}
        style={{ width: 'max-content' }}
      >
        {duplicated.map((story, i) => (
          <StoryCard key={`${story.name}-${i}`} {...story} />
        ))}
      </div>
    </div>
  );
}

export default function StoryCarousel() {
  return (
    <section className="py-20 bg-gray-50 overflow-hidden" aria-label="Community stories">
      <div className="mb-12 text-center px-6">
        <p className="text-xs font-semibold text-navy-600 uppercase tracking-widest mb-3">
          The community
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-navy-900">
          Real people. Real relationships.
        </h2>
      </div>

      <div className="space-y-4">
        <CarouselRow stories={ROW_ONE} direction="left" />
        <CarouselRow stories={ROW_TWO} direction="right" />
      </div>
    </section>
  );
}
