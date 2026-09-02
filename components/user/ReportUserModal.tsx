'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

const REASONS: { value: string; label: string; description: string }[] = [
  { value: 'harassment', label: 'Harassment', description: 'Threatening, bullying, or hostile messages' },
  { value: 'spam', label: 'Spam', description: 'Unsolicited promotions or repetitive content' },
  { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone they are not' },
  { value: 'inappropriate_behavior', label: 'Inappropriate behavior', description: 'Content or conduct that violates community standards' },
  { value: 'safety_concern', label: 'Safety concern', description: 'I feel unsafe or this person poses a risk' },
  { value: 'other', label: 'Other', description: 'Something else not listed above' },
];

interface ReportUserModalProps {
  open: boolean;
  onClose: () => void;
  reportedId: string;
  reportedName: string;
  context?: string;
}

export default function ReportUserModal({
  open,
  onClose,
  reportedId,
  reportedName,
  context,
}: ReportUserModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not signed in.'); setLoading(false); return; }

    const { error: insertError } = await supabase.from('user_reports').insert({
      reporter_id: session.user.id,
      reported_id: reportedId,
      reason,
      details: details.trim() || null,
      context: context ?? null,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        setError('You have already submitted a report for this user.');
      } else {
        setError('Failed to submit report. Please try again.');
      }
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  function handleClose() {
    setReason('');
    setDetails('');
    setError('');
    setSubmitted(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Report ${reportedName}`}>
      {submitted ? (
        <div className="py-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-navy-900">Report submitted</p>
          <p className="text-xs text-gray-500">
            Thank you. Our team will review this report and take appropriate action.
          </p>
          <Button onClick={handleClose} className="mt-2 w-full">Done</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-500">
            What is the issue with <span className="font-medium text-navy-900">{reportedName}</span>?
          </p>

          <div className="space-y-2">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  reason === r.value
                    ? 'border-navy-300 bg-navy-50'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="mt-0.5 accent-navy-700 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-navy-900">{r.label}</p>
                  <p className="text-xs text-gray-500">{r.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">
              Additional details <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Share any additional context that might help us review this report…"
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={loading}
              disabled={!reason}
              className="flex-1"
            >
              Submit report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
