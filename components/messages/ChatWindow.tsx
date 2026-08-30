'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MessageBubble from './MessageBubble';
import Spinner from '@/components/ui/Spinner';

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
}

export default function ChatWindow({ mentorshipId, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
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
