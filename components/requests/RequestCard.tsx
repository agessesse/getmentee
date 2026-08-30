'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type RequestStatus = 'pending' | 'approved' | 'declined';

interface RequestCardProps {
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  partnerId: string;
  status: RequestStatus;
  goals: string | null;
  message: string | null;
  createdAt: string;
  userRole: 'mentor' | 'mentee';
  onApprove?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  actionLoading?: boolean;
}

const statusVariant: Record<RequestStatus, 'green' | 'red' | 'yellow'> = {
  approved: 'green',
  declined: 'red',
  pending: 'yellow',
};

export default function RequestCard({
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
  partnerId,
  status,
  goals,
  message,
  createdAt,
  userRole,
  onApprove,
  onDecline,
  onCancel,
  actionLoading,
}: RequestCardProps) {
  const fullName = `${partnerFirstName} ${partnerLastName}`;
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={partnerAvatarUrl} name={fullName} size="md" />
          <div>
            <Link
              href={`/mentor/${partnerId}`}
              className="font-medium text-navy-900 hover:text-navy-600"
            >
              {fullName}
            </Link>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
        </div>
        <Badge label={status} variant={statusVariant[status]} />
      </div>

      {goals && (
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          <span className="font-medium text-gray-700">Goals: </span>
          {goals}
        </div>
      )}

      {message && (
        <p className="text-sm text-gray-600 italic">&ldquo;{message}&rdquo;</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        {userRole === 'mentor' && status === 'pending' && (
          <>
            <Button
              size="sm"
              onClick={onApprove}
              loading={actionLoading}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={onDecline}
              loading={actionLoading}
            >
              Decline
            </Button>
          </>
        )}
        {userRole === 'mentee' && status === 'pending' && (
          <Button
            size="sm"
            variant="danger"
            onClick={onCancel}
            loading={actionLoading}
          >
            Cancel Request
          </Button>
        )}
        <Link href={`/mentor/${partnerId}`}>
          <Button size="sm" variant="ghost">
            View Profile
          </Button>
        </Link>
      </div>
    </Card>
  );
}
