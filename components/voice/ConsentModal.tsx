'use client';

import { ShieldCheck } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface ConsentModalProps {
  open: boolean;
  onConsent: () => void;
  onCancel: () => void;
  mentorName: string;
  menteeName: string;
}

export default function ConsentModal({
  open,
  onConsent,
  onCancel,
  mentorName,
  menteeName,
}: ConsentModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title="Session Notes">
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-4 bg-navy-50 rounded-xl border border-navy-100">
          <ShieldCheck className="w-5 h-5 text-navy-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-navy-800 leading-relaxed">
            Session Notes can transcribe this conversation and create a private summary and action
            items for your mentorship record.
          </p>
        </div>

        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <p>
            <strong className="text-navy-900">Before you start recording:</strong>
          </p>
          <ul className="space-y-2 pl-4">
            <li className="list-disc">
              Everyone in the conversation — <span className="font-medium">{mentorName}</span> and{' '}
              <span className="font-medium">{menteeName}</span> — should consent before recording
              begins.
            </li>
            <li className="list-disc">
              Transcripts and summaries are private by default. Only you can see them unless you
              explicitly choose to share.
            </li>
            <li className="list-disc">
              Audio is processed for transcription and not stored permanently.
            </li>
            <li className="list-disc">
              You can stop recording at any time.
            </li>
          </ul>
        </div>

        <p className="text-xs text-gray-400">
          By clicking &ldquo;Start Session Notes,&rdquo; you confirm that all participants have
          agreed to this transcription.
        </p>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="button" onClick={onConsent} className="flex-1">
            Start Session Notes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
