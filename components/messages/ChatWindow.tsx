'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, MoreVertical, Flag, Ban } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MessageBubble from './MessageBubble';
import Spinner from '@/components/ui/Spinner';
import VoiceInputButton from '@/components/voice/VoiceInputButton';
import Avatar from '@/components/ui/Avatar';
import ReportUserModal from '@/components/user/ReportUserModal';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender: { first_name: string; last_name: string; avatar_url: string | null } | null;
}

interface ChatWindowProps {
  mentorshipId: string;
  currentUserId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
}

export default function ChatWindow({ mentorshipId, currentUserId, partnerId, partnerName, partnerAvatarUrl }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchMessages() {
      setLoading(true);
      const { data } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at, sender:sender_id(first_name, last_name, avatar_url)')
        .eq('mentorship_id', mentorshipId)
        .order('created_at', { ascending: true });

      setMessages((data as unknown as Message[]) ?? []);
      setLoading(false);

      // Mark unread messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('mentorship_id', mentorshipId)
        .neq('sender_id', currentUserId)
        .eq('is_read', false);
    }

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${mentorshipId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `mentorship_id=eq.${mentorshipId}` },
        async (payload) => {
          // Fetch sender info for the new message
          const { data: senderData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          const newMsg: Message = {
            id: payload.new.id,
            content: payload.new.content,
            sender_id: payload.new.sender_id,
            created_at: payload.new.created_at,
            sender: senderData ?? null,
          };
          setMessages((prev) => [...prev, newMsg]);

          if (payload.new.sender_id !== currentUserId) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', payload.new.id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mentorshipId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  async function handleBlock() {
    setMenuOpen(false);
    if (!confirm(`Block ${partnerName}? They will no longer be able to message you.`)) return;
    const supabase = createClient();
    await supabase.from('user_blocks').insert({
      blocker_id: currentUserId,
      blocked_id: partnerId,
    });
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput('');

    const supabase = createClient();
    await supabase.from('messages').insert({
      mentorship_id: mentorshipId,
      sender_id: currentUserId,
      content: text,
    });
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ReportUserModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedId={partnerId}
        reportedName={partnerName}
        context={`mentorship_id:${mentorshipId}`}
      />

      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <Avatar src={partnerAvatarUrl} name={partnerName} size="sm" />
          <span className="text-sm font-semibold text-navy-900">{partnerName}</span>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 text-gray-400 hover:text-navy-900 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
              <button
                onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Flag className="w-4 h-4 text-gray-400" />
                Report user
              </button>
              <button
                onClick={handleBlock}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Ban className="w-4 h-4" />
                Block user
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg) => {
          const sender = msg.sender as unknown as { first_name: string; last_name: string; avatar_url: string | null } | null;
          return (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              senderName={sender ? `${sender.first_name} ${sender.last_name}` : 'User'}
              senderAvatarUrl={sender?.avatar_url ?? null}
              isOwn={msg.sender_id === currentUserId}
              createdAt={msg.created_at}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex items-center gap-2 p-4 border-t border-gray-200 bg-white">
        <VoiceInputButton
          context="message"
          onTranscript={(text) => setInput((prev) => prev ? `${prev} ${text}` : text)}
          disabled={sending}
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or speak a message…"
          className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) sendMessage(e as unknown as React.FormEvent);
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="bg-navy-600 text-white rounded-full p-2 hover:bg-navy-700 transition-colors disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
