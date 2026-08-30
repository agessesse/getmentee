import { clsx } from 'clsx';
import Avatar from '@/components/ui/Avatar';

interface MessageBubbleProps {
  content: string;
  senderName: string;
  senderAvatarUrl: string | null;
  isOwn: boolean;
  createdAt: string;
}

export default function MessageBubble({
  content,
  senderName,
  senderAvatarUrl,
  isOwn,
  createdAt,
}: MessageBubbleProps) {
  const time = new Date(createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={clsx('flex items-end gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {!isOwn && (
        <Avatar src={senderAvatarUrl} name={senderName} size="sm" className="flex-shrink-0 mb-1" />
      )}
      <div className={clsx('max-w-xs lg:max-w-md', isOwn ? 'items-end' : 'items-start', 'flex flex-col gap-0.5')}>
        <div
          className={clsx(
            'px-4 py-2 rounded-2xl text-sm leading-relaxed',
            isOwn
              ? 'bg-navy-600 text-white rounded-br-sm'
              : 'bg-white border border-gray-200 text-navy-900 rounded-bl-sm'
          )}
        >
          {content}
        </div>
        <span className="text-xs text-gray-400 px-1">{time}</span>
      </div>
    </div>
  );
}
