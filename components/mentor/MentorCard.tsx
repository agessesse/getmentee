import Link from 'next/link';
import { Star, Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface MentorCardProps {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  expertiseTags: string[];
  weeklyHours: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  sessionRate: number | null;
  onRequest?: () => void;
  hasActiveRequest?: boolean;
}

export default function MentorCard({
  id,
  firstName,
  lastName,
  avatarUrl,
  bio,
  expertiseTags,
  weeklyHours,
  rating,
  reviewCount,
  isAvailable,
  sessionRate,
  onRequest,
  hasActiveRequest,
}: MentorCardProps) {
  const fullName = `${firstName} ${lastName}`;

  return (
    <Card className="flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar src={avatarUrl} name={fullName} size="lg" />
        <div className="flex-1 min-w-0">
          <Link
            href={`/mentor/${id}`}
            className="font-semibold text-navy-900 hover:text-navy-600 transition-colors"
          >
            {fullName}
          </Link>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              {rating > 0 ? `${rating.toFixed(1)} (${reviewCount})` : 'No reviews yet'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {weeklyHours}h/wk
            </span>
          </div>
        </div>
        <Badge
          label={isAvailable ? 'Available' : 'Busy'}
          variant={isAvailable ? 'green' : 'gray'}
          size="sm"
        />
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-sm text-gray-600 line-clamp-2">{bio}</p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {expertiseTags.slice(0, 5).map((tag) => (
          <Badge key={tag} label={tag} variant="navy" size="sm" />
        ))}
        {expertiseTags.length > 5 && (
          <Badge label={`+${expertiseTags.length - 5}`} variant="gray" size="sm" />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          {sessionRate ? `$${sessionRate}/hr` : 'Free'}
        </span>
        <div className="flex gap-2">
          <Link href={`/mentor/${id}`}>
            <Button variant="ghost" size="sm">View Profile</Button>
          </Link>
          {onRequest && (
            <Button
              size="sm"
              onClick={onRequest}
              disabled={hasActiveRequest}
              variant={hasActiveRequest ? 'secondary' : 'primary'}
            >
              {hasActiveRequest ? 'Requested' : 'Request'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
