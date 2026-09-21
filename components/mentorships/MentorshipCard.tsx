import Link from 'next/link';
import { MessageSquare, Calendar, Target, Award } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface MentorshipCardProps {
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  partnerId: string;
  userRole: 'mentor' | 'mentee';
  sessionsCount: number;
  startedAt: string;
  status: 'active' | 'completed' | 'cancelled';
  mentorshipId: string;
  nextSessionAt: string | null;
  activeGoalCount: number;
}

export default function MentorshipCard({
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
  partnerId,
  userRole,
  sessionsCount,
  startedAt,
  status,
  mentorshipId,
  nextSessionAt,
  activeGoalCount,
}: MentorshipCardProps) {
  const fullName = `${partnerFirstName} ${partnerLastName}`;
  const duration = formatDistanceToNow(new Date(startedAt), { addSuffix: false });
  const profileHref = userRole === 'mentor' ? `/mentee/${partnerId}` : `/mentor/${partnerId}`;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href={profileHref}>
            <Avatar src={partnerAvatarUrl} name={fullName} size="lg" />
          </Link>
          <div>
            <Link href={profileHref} className="font-semibold text-halo-ink hover:text-halo-purple-d transition-colors">
              {fullName}
            </Link>
            <p className="text-xs text-halo-mist-body">Mentoring for {duration}</p>
          </div>
        </div>
        <Badge
          label={status}
          variant={status === 'active' ? 'green' : status === 'completed' ? 'blue' : 'gray'}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm text-halo-mist-body">
        <span className="flex items-center gap-1">
          <Award className="h-4 w-4 text-halo-mist-body" />
          {sessionsCount} conversation{sessionsCount !== 1 ? 's' : ''}
        </span>
        {activeGoalCount > 0 && (
          <span className="flex items-center gap-1">
            <Target className="h-4 w-4 text-halo-mist-body" />
            <span className="text-halo-purple-d font-medium">{activeGoalCount}</span> active goal{activeGoalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Next session callout */}
      {nextSessionAt && (
        <div className="flex items-center gap-2 bg-halo-veil rounded-xl px-3 py-2.5 text-sm">
          <Calendar className="h-4 w-4 text-halo-purple-d flex-shrink-0" />
          <div>
            <span className="text-xs text-halo-purple-d font-medium">Next conversation</span>
            <p className="text-sm font-semibold text-halo-ink">
              {format(new Date(nextSessionAt), 'EEE MMM d, h:mm a')}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1 border-t border-halo-rule">
        <Link href={`/messages?mentorshipId=${mentorshipId}`} className="flex-1">
          <Button variant="primary" size="sm" className="w-full">
            <MessageSquare className="h-4 w-4" /> Chat
          </Button>
        </Link>
        <Link href={`/schedule?mentorshipId=${mentorshipId}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">
            <Calendar className="h-4 w-4" /> Schedule
          </Button>
        </Link>
      </div>
    </Card>
  );
}
