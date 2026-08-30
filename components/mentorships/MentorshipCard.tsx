import Link from 'next/link';
import { MessageSquare, Calendar, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface MentorshipCardProps {
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  sessionsCount: number;
  startedAt: string;
  status: 'active' | 'completed' | 'cancelled';
  mentorshipId: string;
}

export default function MentorshipCard({
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
  sessionsCount,
  startedAt,
  status,
  mentorshipId,
}: MentorshipCardProps) {
  const fullName = `${partnerFirstName} ${partnerLastName}`;
  const duration = formatDistanceToNow(new Date(startedAt), { addSuffix: false });

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={partnerAvatarUrl} name={fullName} size="lg" />
          <div>
            <p className="font-semibold text-navy-900">{fullName}</p>
            <p className="text-xs text-gray-400">Mentoring for {duration}</p>
          </div>
        </div>
        <Badge
          label={status}
          variant={status === 'active' ? 'green' : status === 'completed' ? 'blue' : 'gray'}
        />
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Award className="h-4 w-4" />
          {sessionsCount} session{sessionsCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <Link href={`/messages?mentorshipId=${mentorshipId}`} className="flex-1">
          <Button variant="primary" size="sm" className="w-full">
            <MessageSquare className="h-4 w-4" /> Chat
          </Button>
        </Link>
        <Link href="/schedule" className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">
            <Calendar className="h-4 w-4" /> Schedule
          </Button>
        </Link>
      </div>
    </Card>
  );
}
