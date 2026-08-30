'use client';

import { clsx } from 'clsx';
import Avatar from '@/components/ui/Avatar';

interface Conversation {
  mentorshipId: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeMentorshipId: string | null;
  onSelect: (id: string) => void;
}

export default function ConversationList({
  conversations,
  activeMentorshipId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-400 text-center">
        No conversations yet. Start a mentorship to begin chatting.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {conversations.map((c) => {
        const active = c.mentorshipId === activeMentorshipId;
        const fullName = `${c.partnerFirstName} ${c.partnerLastName}`;
        return (
          <li key={c.mentorshipId}>
            <button
              onClick={() => onSelect(c.mentorshipId)}
              className={clsx(
                'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-cream-100 transition-colors',
                active && 'bg-navy-50'
              )}
            >
              <Avatar src={c.partnerAvatarUrl} name={fullName} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-navy-900 truncate">{fullName}</span>
                  {c.lastMessageAt && (
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {new Date(c.lastMessageAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-500 truncate">
                    {c.lastMessage ?? 'Start the conversation...'}
                  </p>
                  {c.unreadCount > 0 && (
                    <span className="ml-2 flex-shrink-0 bg-navy-600 text-white text-xs font-medium rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
