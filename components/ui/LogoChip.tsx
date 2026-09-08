'use client';

import { useState } from 'react';

interface LogoChipProps {
  name: string;
  url: string;
  dim?: boolean;
  size?: number;
}

export default function LogoChip({ name, url, dim = false, size = 16 }: LogoChipProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      title={name}
      width={size}
      height={size}
      className={`rounded-sm object-contain flex-none transition-opacity ${dim ? 'opacity-40' : 'opacity-75'}`}
      onError={() => setFailed(true)}
    />
  );
}
