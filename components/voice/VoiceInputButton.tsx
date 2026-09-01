'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

type VoiceState = 'idle' | 'listening' | 'processing' | 'inserted';
type VoiceContext = 'message' | 'note' | 'goal' | 'search';

interface VoiceInputButtonProps {
  /** Called with the final cleaned text when transcription is complete */
  onTranscript: (text: string) => void;
  /** Context hint passed to the cleanup API to tune output style */
  context?: VoiceContext;
  /** Disable the button (e.g. while a form is submitting) */
  disabled?: boolean;
  className?: string;
}

// Using a loose type for the browser Speech Recognition API.
// The Web Speech API vendor prefix varies across browsers and TypeScript's
// built-in DOM typings don't cover all implementations uniformly.
// We guard with feature detection at runtime before constructing any instance.
// eslint-disable-next-line
type SpeechRec = any; // intentional: vendor-prefixed Web Speech API

function getBrowserSpeechRecognition(): (new () => SpeechRec) | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function VoiceInputButton({
  onTranscript,
  context = 'message',
  disabled = false,
  className = '',
}: VoiceInputButtonProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRec>(null);
  const stateRef = useRef<VoiceState>('idle');

  useEffect(() => {
    setSupported(getBrowserSpeechRecognition() !== null);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const cleanupText = useCallback(async (raw: string): Promise<string> => {
    try {
      const res = await fetch('/api/voice/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: raw, context }),
      });
      if (!res.ok) return raw;
      const data = await res.json();
      return typeof data.cleaned === 'string' ? data.cleaned : raw;
    } catch {
      return raw;
    }
  }, [context]);

  const startListening = useCallback(() => {
    const SpeechRecognition = getBrowserSpeechRecognition();
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => setState('listening');

    rec.onresult = async (event: SpeechRec) => {
      const raw: string = event.results[0]?.[0]?.transcript ?? '';
      if (!raw.trim()) { setState('idle'); return; }
      setState('processing');
      const cleaned = await cleanupText(raw);
      onTranscript(cleaned);
      setState('inserted');
      setTimeout(() => setState('idle'), 1800);
    };

    rec.onerror = (event: SpeechRec) => {
      if (event.error !== 'aborted') console.warn('[VoiceInputButton] error:', event.error);
      setState('idle');
    };

    rec.onend = () => {
      if (stateRef.current === 'listening') setState('idle');
    };

    recognitionRef.current = rec;
    rec.start();
  }, [cleanupText, onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState('idle');
  }, []);

  function handleClick() {
    if (state === 'listening') stopListening();
    else if (state === 'idle') startListening();
  }

  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  if (!supported) return null;

  const label =
    state === 'idle' ? 'Start voice input' :
    state === 'listening' ? 'Stop recording' :
    state === 'processing' ? 'Processing…' : 'Inserted';

  const isActive = state === 'listening' || state === 'processing';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || state === 'processing' || state === 'inserted'}
      aria-label={label}
      title={label}
      className={[
        'relative flex items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500',
        'w-8 h-8 flex-shrink-0',
        state === 'idle'
          ? 'text-gray-400 hover:text-navy-600 hover:bg-navy-50'
          : state === 'listening'
          ? 'bg-red-50 text-red-500 ring-2 ring-red-200'
          : state === 'processing'
          ? 'bg-navy-50 text-navy-400'
          : 'bg-green-50 text-green-500',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      {state === 'listening' && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-red-200 animate-ping opacity-40"
        />
      )}

      {state === 'processing' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isActive ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {state === 'listening' ? 'Recording. Speak now.' :
         state === 'processing' ? 'Processing voice input.' :
         state === 'inserted' ? 'Voice input inserted.' : ''}
      </span>
    </button>
  );
}
