'use client';

import { useRef, useState, useCallback } from 'react';
import { Mic, Loader2, Square, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import ConsentModal from './ConsentModal';
import type { SessionSummaryResult } from '@/app/api/voice/summarize/route';

type RecorderState = 'idle' | 'consent' | 'recording' | 'processing' | 'done' | 'error';

interface SessionRecorderProps {
  sessionId: string;
  mentorName: string;
  menteeName: string;
  /** Called with the final transcript string once transcription is complete */
  onTranscriptReady?: (transcript: string) => void;
  /** Called with the structured summary once AI processing is complete */
  onSummaryReady?: (summary: SessionSummaryResult) => void;
  disabled?: boolean;
}

export default function SessionRecorder({
  sessionId,
  mentorName,
  menteeName,
  onTranscriptReady,
  onSummaryReady,
  disabled = false,
}: SessionRecorderProps) {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState<SessionSummaryResult | null>(null);
  const [error, setError] = useState('');
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopAndProcess = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    setRecorderState('processing');
    recorder.stop();
    // onstop handler takes over from here
  }, []);

  const startRecording = useCallback(async () => {
    setError('');
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      setError('Microphone permission denied. Please allow microphone access and try again.');
      setRecorderState('error');
      return;
    }

    streamRef.current = stream;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      // Stop all tracks so browser indicator disappears
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });

      // Send to /api/voice/transcribe
      let rawTranscript = '';
      try {
        const form = new FormData();
        form.append('audio', blob, 'session.webm');
        const res = await fetch('/api/voice/transcribe', { method: 'POST', body: form });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Transcription failed.');
        }
        const data = await res.json();
        rawTranscript = data.transcript ?? '';
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Transcription unavailable.';
        setError(msg);
        setRecorderState('error');
        return;
      }

      setTranscript(rawTranscript);
      onTranscriptReady?.(rawTranscript);

      // Attempt AI summary (non-blocking failure)
      try {
        const res = await fetch('/api/voice/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: rawTranscript, mentorName, menteeName }),
        });
        if (res.ok) {
          const s: SessionSummaryResult = await res.json();
          setSummary(s);
          onSummaryReady?.(s);
        }
      } catch {
        // Summary failure is non-fatal — transcript is still available
      }

      setRecorderState('done');
    };

    recorder.start(1000); // collect chunks every 1s
    setRecorderState('recording');
  }, [mentorName, menteeName, onTranscriptReady, onSummaryReady]);

  function handleConsentConfirmed() {
    setRecorderState('recording'); // visual update before async
    startRecording();
  }

  if (!sessionId) return null;

  // ── Idle / consent trigger ──────────────────────────────────────────────────
  if (recorderState === 'idle') {
    return (
      <>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setRecorderState('consent')}
          className="inline-flex items-center gap-2 text-xs font-medium text-navy-600 hover:text-navy-900 border border-navy-200 hover:border-navy-400 px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
        >
          <Mic className="w-3.5 h-3.5" />
          Enable Session Notes
        </button>
        <ConsentModal
          open={false}
          onConsent={handleConsentConfirmed}
          onCancel={() => setRecorderState('idle')}
          mentorName={mentorName}
          menteeName={menteeName}
        />
      </>
    );
  }

  if (recorderState === 'consent') {
    return (
      <ConsentModal
        open
        onConsent={handleConsentConfirmed}
        onCancel={() => setRecorderState('idle')}
        mentorName={mentorName}
        menteeName={menteeName}
      />
    );
  }

  // ── Recording ──────────────────────────────────────────────────────────────
  if (recorderState === 'recording') {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium text-red-700 flex-1">Recording session notes…</span>
        <button
          type="button"
          onClick={stopAndProcess}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 border border-red-300 px-2.5 py-1 rounded-full transition-colors"
        >
          <Square className="w-3 h-3" />
          Stop
        </button>
        <span className="sr-only" role="status" aria-live="assertive">
          Session recording in progress. Click Stop when done.
        </span>
      </div>
    );
  }

  // ── Processing ─────────────────────────────────────────────────────────────
  if (recorderState === 'processing') {
    return (
      <div className="flex items-center gap-3 p-3 bg-navy-50 border border-navy-100 rounded-xl">
        <Loader2 className="w-4 h-4 text-navy-500 animate-spin flex-shrink-0" />
        <span className="text-sm text-navy-700">Transcribing and generating summary…</span>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (recorderState === 'error') {
    return (
      <div className="space-y-2">
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error || 'Something went wrong. Please try again.'}
        </div>
        <button
          type="button"
          onClick={() => { setRecorderState('idle'); setError(''); }}
          className="text-xs text-navy-600 hover:text-navy-900 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Done — show transcript + summary ───────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Summary */}
      {summary && (
        <div className="bg-navy-50 border border-navy-100 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setSummaryExpanded((p) => !p)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy-600" />
              <span className="text-sm font-semibold text-navy-900">Session Summary</span>
              <span className="text-[10px] text-navy-400 border border-navy-200 rounded-full px-2 py-0.5 font-medium">
                AI-generated · review before sharing
              </span>
            </div>
            {summaryExpanded ? (
              <ChevronUp className="w-4 h-4 text-navy-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-navy-400" />
            )}
          </button>

          {summaryExpanded && (
            <div className="px-5 pb-5 space-y-4 border-t border-navy-100">
              {summary.summary && (
                <p className="text-sm text-gray-700 leading-relaxed pt-4">{summary.summary}</p>
              )}

              {summary.keyTakeaways?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-wide mb-2">
                    Key Takeaways
                  </p>
                  <ul className="space-y-1.5">
                    {summary.keyTakeaways.map((t, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-navy-400 font-medium flex-shrink-0">·</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.actionItems?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-wide mb-2">
                    Action Items
                  </p>
                  <div className="space-y-1.5">
                    {summary.actionItems.map((a, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[10px] font-semibold text-navy-500 bg-navy-100 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                          {a.assignee}
                        </span>
                        <span className="text-sm text-gray-700">{a.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {summary.topicsDiscussed?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-navy-600 uppercase tracking-wide mb-2">
                    Topics
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.topicsDiscussed.map((t, i) => (
                      <span
                        key={i}
                        className="text-xs bg-white border border-navy-100 text-navy-700 px-2.5 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {summary.followUp && (
                <p className="text-xs text-gray-400 italic border-t border-navy-100 pt-3">
                  Suggested next focus: {summary.followUp}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setTranscriptExpanded((p) => !p)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-xs font-medium text-gray-500">Full Transcript</span>
            {transcriptExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {transcriptExpanded && (
            <div className="px-5 pb-5 border-t border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pt-4">
                {transcript}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Record again */}
      <button
        type="button"
        onClick={() => { setRecorderState('consent'); setTranscript(''); setSummary(null); }}
        className="text-xs text-gray-400 hover:text-navy-600 transition-colors"
      >
        Record a new clip
      </button>
    </div>
  );
}
