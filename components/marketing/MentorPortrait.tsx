'use client';

import Image from 'next/image';
import { useState } from 'react';

interface MentorPortraitProps {
  name: string;
  headshot: string;
  initials: string;
  accentColor: string;
  priority?: boolean;
}

export default function MentorPortrait({
  name,
  headshot,
  initials,
  accentColor,
  priority = false,
}: MentorPortraitProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 min-h-[420px] lg:min-h-0">
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{ backgroundColor: accentColor }}
        >
          <span className="text-4xl font-bold text-white select-none">{initials}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[420px] lg:min-h-0 bg-gray-100 overflow-hidden">
      <Image
        src={headshot}
        alt={`Portrait of ${name}`}
        fill
        className="object-cover object-top"
        sizes="(max-width: 1024px) 100vw, 45vw"
        priority={priority}
        onError={() => setImgError(true)}
      />
    </div>
  );
}
