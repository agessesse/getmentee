'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ConversationList from '@/components/messages/ConversationList';
import ChatWindow from '@/components/messages/ChatWindow';
import Spinner from '@/components/ui/Spinner';

interface Conversation {
  mentorshipId: string;
  partnerId: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('mentorshipId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeMentorshipId, setActiveMentorshipId] = useState<string | null>(initialId);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;
      setCurrentUserId(uid);

      const { data: mentorships } = await supabase
        .from('mentorships')
        .select('id, mentee_id, mentor_id')
        .or(`mentee_id.eq.${uid},mentor_id.eq.${uid}`)
        .eq('status', 'active');

      if (!mentorships) { setLoading(false); return; }

      const partnerIds = mentorships.map((m) =>
        m.mentor_id === uid ? m.mentee_id : m.mentor_id
      );

      const { data: partners } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', partnerIds);

      const partnerMap = new Map(partners?.map((p) => [p.id, p]) ?? []);

      // Fetch last message + unread count per mentorship
      const convos = await Promise.all(
        mentorships.map(async (m) => {
          const partnerId = m.mentor_id === uid ? m.mentee_id : m.mentor_id;
          const partner = partnerMap.get(partnerId);

          const [{ data: lastMsg }, { count: unread }] = await Promise.all([
            supabase
              .from('messages')
              .select('content, created_at')
              .eq('mentorship_id', m.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('mentorship_id', m.id)
              .neq('sender_id', uid)
              .eq('is_read', false),
          ]);

          return {
            mentorshipId: m.id,
            partnerId,
            partnerFirstName: partner?.first_name ?? 'Unknown',
            partnerLastName: partner?.last_name ?? '',
            partnerAvatarUrl: partner?.avatar_url ?? null,
            lastMessage: lastMsg?.content ?? null,
            lastMessageAt: lastMsg?.created_at ?? null,
            unreadCount: unread ?? 0,
          };
        })
      );

      setConversations(convos.sort((a, b) => {
        if (!a.lastMessageAt && !b.lastMessageAt) return 0;
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      }));

      if (!activeMentorshipId && convos.length > 0) {
        setActiveMentorshipId(convos[0].mentorshipId);
      }

      setLoading(false);
    }

    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeConversation = conversations.find((c) => c.mentorshipId === activeMentorshipId);

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      {/* Conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-navy-900">Messages</h2>
        </div>
        <ConversationList
          conversations={conversations}
          activeMentorshipId={activeMentorshipId}
          onSelect={setActiveMentorshipId}
        />
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeMentorshipId && currentUserId && activeConversation ? (
          <ChatWindow
            key={activeMentorshipId}
            mentorshipId={activeMentorshipId}
            currentUserId={currentUserId}
            partnerId={activeConversation.partnerId}
            partnerName={`${activeConversation.partnerFirstName} ${activeConversation.partnerLastName}`}
            partnerAvatarUrl={activeConversation.partnerAvatarUrl}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
