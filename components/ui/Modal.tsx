'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Portalled to <body>. Portal pages settle into place on arrival with a
  // transform, and a transformed ancestor re-anchors position:fixed, which
  // would pin the overlay to the page instead of the viewport.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-body">
      <div
        className="absolute inset-0 bg-halo-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="halo-pop relative bg-white rounded-2xl border border-halo-rule shadow-[0_30px_80px_-20px_rgba(21,19,26,0.35)] w-full max-w-md p-6 sm:p-7 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl leading-tight text-halo-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-halo-mist-body hover:text-halo-ink transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-purple"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
