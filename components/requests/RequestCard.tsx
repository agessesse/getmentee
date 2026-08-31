'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { GraduationCap, Briefcase } from 'lucide-react';
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
  // Context fields for mentor view (populated from mentee profile)
  menteeHeadline?: string | null;
  menteeUniversity?: string | null;
  menteeBio?: string | null;
  menteeExperienceLevel?: string | null;
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
  menteeHeadline,
  menteeUniversity,
  menteeBio,
  menteeExperienceLevel,
}: RequestCardProps) {
  const fullName = `${partnerFirstName} ${partnerLastName}`;
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const showMenteeContext =
    userRole === 'mentor' &&
    status === 'pending' &&
    (menteeHeadline || menteeUniversity || menteeBio || menteeExperienceLevel);

  return (
    <Card className="flex flex-col gap-4">
      {/* Header row */}
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

      {/* Mentee context — shown to mentor on pending requests */}
      {showMenteeContext && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          {menteeHeadline && (
            <div className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-700">{menteeHeadline}</p>
            </div>
          )}
          {menteeUniversity && (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-700">{menteeUniversity}</p>
            </div>
          )}
          {menteeExperienceLevel && (
            <p className="text-xs text-gray-400 capitalize">
              {menteeExperienceLevel} level
            </p>
          )}
          {menteeBio && (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
              {menteeBio}
            </p>
          )}
        </div>
      )}

      {/* Goals */}
      {goals && (
        <div className="text-sm text-gray-600 bg-navy-50 rounded-lg px-3 py-2">
          <span className="font-medium text-navy-700">Their goals: </span>
          {goals}
        </div>
      )}

      {/* Personal message */}
      {message && (
        <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">
          &ldquo;{message}&rdquo;
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-1 flex-wrap">
        {userRole === 'mentor' && status === 'pending' && (
          <>
            <Button size="sm" onClick={onApprove} loading={actionLoading}>
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
