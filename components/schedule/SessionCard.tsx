import Link from 'next/link';
import { Video, MessageSquare, Clock, ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface SessionCardProps {
  id: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  scheduledAt: string;
  durationMinutes: number;
  sessionType: 'video' | 'async';
  notes: string | null;
  videoLink: string | null;
  status: SessionStatus;
}

const statusVariant: Record<SessionStatus, 'blue' | 'green' | 'gray' | 'red'> = {
  scheduled: 'blue',
  in_progress: 'green',
  completed: 'gray',
  cancelled: 'red',
};

export default function SessionCard({
  id,
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
  scheduledAt,
  durationMinutes,
  sessionType,
  notes,
  videoLink,
  status,
}: SessionCardProps) {
  const fullName = `${partnerFirstName} ${partnerLastName}`;
  const date = new Date(scheduledAt);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar src={partnerAvatarUrl} name={fullName} size="sm" />
          <div>
            <p className="text-sm font-medium text-navy-900">{fullName}</p>
            <p className="text-xs text-gray-400">
              {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
              at {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <Badge label={status.replace('_', ' ')} variant={statusVariant[status]} />
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          {sessionType === 'video' ? <Video className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
          {sessionType === 'video' ? 'Video Call' : 'Async'}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {durationMinutes} min
        </span>
      </div>

      {notes && <p className="text-xs text-gray-500 italic">{notes}</p>}

      <div className="flex gap-2">
        <Link href={`/sessions/${id}`}>
          <Button size="sm" variant="secondary">View Details</Button>
        </Link>
        {videoLink && status !== 'cancelled' && (
          <a href={videoLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm">
              <ExternalLink className="h-3.5 w-3.5" /> Join Call
            </Button>
          </a>
        )}
      </div>
    </Card>
  );
}
