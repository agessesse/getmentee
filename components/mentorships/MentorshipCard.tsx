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
            <Link href={profileHref} className="font-semibold text-navy-900 hover:text-navy-600 transition-colors">
              {fullName}
            </Link>
            <p className="text-xs text-gray-400">Mentoring for {duration}</p>
          </div>
        </div>
        <Badge
          label={status}
          variant={status === 'active' ? 'green' : status === 'completed' ? 'blue' : 'gray'}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Award className="h-4 w-4 text-gray-400" />
          {sessionsCount} session{sessionsCount !== 1 ? 's' : ''}
        </span>
        {activeGoalCount > 0 && (
          <span className="flex items-center gap-1">
            <Target className="h-4 w-4 text-navy-400" />
            <span className="text-navy-600 font-medium">{activeGoalCount}</span> active goal{activeGoalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Next session callout */}
      {nextSessionAt && (
        <div className="flex items-center gap-2 bg-navy-50 rounded-xl px-3 py-2.5 text-sm">
          <Calendar className="h-4 w-4 text-navy-500 flex-shrink-0" />
          <div>
            <span className="text-xs text-navy-500 font-medium">Next session</span>
            <p className="text-sm font-semibold text-navy-900">
              {format(new Date(nextSessionAt), 'EEE MMM d, h:mm a')}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1 border-t border-gray-100">
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
