'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
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
  const [currentUserRole, setCurrentUserRole] = useState<'mentor' | 'mentee'>('mentee');
  const [loading, setLoading] = useState(true);
  // Mobile view: 'list' shows conversation list, 'chat' shows the active conversation
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(initialId ? 'chat' : 'list');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;
      setCurrentUserId(uid);

      const { data: ownProfile } = await supabase.from('profiles').select('role').eq('id', uid).single();
      if (ownProfile?.role) setCurrentUserRole(ownProfile.role as 'mentor' | 'mentee');

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
        .from('public_profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', partnerIds);

      const partnerMap = new Map(partners?.map((p) => [p.id, p]) ?? []);

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

      const sorted = convos.sort((a, b) => {
        if (!a.lastMessageAt && !b.lastMessageAt) return 0;
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      setConversations(sorted);

      if (!activeMentorshipId && sorted.length > 0) {
        setActiveMentorshipId(sorted[0].mentorshipId);
      }

      setLoading(false);
    }

    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectConversation(id: string) {
    setActiveMentorshipId(id);
    setMobileView('chat');
  }

  function handleBack() {
    setMobileView('list');
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // No active mentorships at all — show a helpful empty state
  if (conversations.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-900">Messages</h1>
          <p className="text-gray-500 mt-1 text-sm">Your conversations with mentors and mentees.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-navy-900 mb-1">No conversations yet</p>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            Messages appear here once you have an active mentorship. Find a mentor to get started.
          </p>
          <Link
            href="/discover"
            className="mt-6 inline-flex items-center gap-2 bg-navy-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-navy-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
          >
            Find a mentor
          </Link>
        </div>
      </div>
    );
  }

  const activeConversation = conversations.find((c) => c.mentorshipId === activeMentorshipId);

  return (
    <>
      {/* ── Desktop: classic split-pane ─────────────────────────────────────── */}
      <div className="hidden md:flex h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        {/* Conversation list */}
        <div className="w-72 flex-shrink-0 border-r border-gray-200 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-navy-900">Messages</h2>
          </div>
          <ConversationList
            conversations={conversations}
            activeMentorshipId={activeMentorshipId}
            onSelect={handleSelectConversation}
          />
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeMentorshipId && currentUserId && activeConversation ? (
            <ChatWindow
              key={activeMentorshipId}
              mentorshipId={activeMentorshipId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
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

      {/* ── Mobile: full-screen list or full-screen chat ─────────────────────── */}
      <div className="md:hidden flex flex-col h-[calc(100vh-6rem)] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        {mobileView === 'list' ? (
          <>
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-navy-900">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                activeMentorshipId={activeMentorshipId}
                onSelect={handleSelectConversation}
              />
            </div>
          </>
        ) : (
          activeMentorshipId && currentUserId && activeConversation ? (
            <ChatWindow
              key={activeMentorshipId}
              mentorshipId={activeMentorshipId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              partnerId={activeConversation.partnerId}
              partnerName={`${activeConversation.partnerFirstName} ${activeConversation.partnerLastName}`}
              partnerAvatarUrl={activeConversation.partnerAvatarUrl}
              onBack={handleBack}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation to start chatting
            </div>
          )
        )}
      </div>
    </>
  );
}
