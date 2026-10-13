'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Shield, Send, X, Users, RefreshCw, ChevronDown, Check, AlertCircle } from 'lucide-react';

interface ChatMessage {
  id: number;
  channel: 'general' | 'support';
  ticket_id: string | null;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  content: string;
  is_admin: boolean;
  created_at: string;
}

interface ChatWidgetProps {
  user: any;
  hasPlan: boolean;
}

export default function ChatWidget({ user, hasPlan }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<'general' | 'support'>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const discordUserId = user?.user_metadata?.provider_id || user?.user_metadata?.sub || user?.id || null;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.custom_claims?.global_name || user?.user_metadata?.user_name || 'Member';
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const isOwner = discordUserId === '719482630633947166';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch initial message history when channel changes or widget opens
  const fetchMessages = async (channel: 'general' | 'support') => {
    if (!discordUserId) return;
    setLoading(true);
    try {
      const url = channel === 'support'
        ? `/api/chat?channel=support&ticketId=${encodeURIComponent(discordUserId)}`
        : `/api/chat?channel=general&limit=50`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error('[Chat Widget Fetch Error]:', e);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages(activeChannel);
      setUnreadCount(0);
    }
  }, [isOpen, activeChannel, discordUserId]);

  // 2. Realtime Subscription via Supabase WebSocket
  useEffect(() => {
    if (!discordUserId) return;

    const channelSub = supabase
      .channel(`chat_realtime_${discordUserId}_${activeChannel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;

          // Check if message belongs to current channel/ticket
          const isCurrentGeneral = activeChannel === 'general' && newMsg.channel === 'general';
          const isCurrentSupport = activeChannel === 'support' && newMsg.channel === 'support' && newMsg.ticket_id === discordUserId;

          if (isCurrentGeneral || isCurrentSupport) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 100);
          } else if (!isOpen) {
            // Increment unread count if message belongs to user's channels
            if (newMsg.channel === 'general' || (newMsg.channel === 'support' && newMsg.ticket_id === discordUserId)) {
              setUnreadCount((c) => c + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [discordUserId, activeChannel, isOpen]);

  // 3. Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    if (!user) {
      setErrorToast('Please log in with Discord first.');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }

    if (activeChannel === 'general' && !hasPlan && !isOwner) {
      setErrorToast('Active license required to chat in General.');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic message rendering (<0.05s instant receipt for sender)
    const tempId = Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      channel: activeChannel,
      ticket_id: activeChannel === 'support' ? discordUserId : null,
      sender_id: discordUserId,
      sender_name: displayName,
      sender_avatar: avatarUrl,
      content: textToSend,
      is_admin: isOwner,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: activeChannel,
          ticketId: activeChannel === 'support' ? discordUserId : null,
          senderId: discordUserId,
          senderName: displayName,
          senderAvatar: avatarUrl,
          content: textToSend,
          isAdmin: isOwner,
        }),
      });

      if (!res.ok) {
        // Rollback optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const errJson = await res.json();
        setErrorToast(errJson.error || 'Failed to send message.');
        setTimeout(() => setErrorToast(null), 3500);
      } else {
        const json = await res.json();
        if (json.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? (json.message as ChatMessage) : m))
          );
        }
      }
    } catch (err: any) {
      setErrorToast('Network error sending message.');
      setTimeout(() => setErrorToast(null), 3000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {/* Floating Widget Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-zinc-950/90 hover:bg-zinc-900 border border-purple-500/40 text-white shadow-2xl transition-all duration-200 hover:scale-105 backdrop-blur-md"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-2 border-zinc-950" />
          </div>
          <span className="font-mono text-xs font-semibold tracking-wide">Live Chat & Support</span>

          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-600 text-white font-mono text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Main Chat Panel Container */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="font-mono text-xs font-semibold text-white tracking-wide">ASYNC Communications</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchMessages(activeChannel)}
                disabled={loading}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                title="Refresh feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dual Channel Switcher */}
          <div className="p-2 border-b border-zinc-800/60 bg-zinc-950/60 flex items-center gap-1.5">
            <button
              onClick={() => setActiveChannel('general')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeChannel === 'general'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>General Chat</span>
            </button>

            <button
              onClick={() => setActiveChannel('support')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeChannel === 'support'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Support (Private)</span>
            </button>
          </div>

          {/* Sub-header Information Banner */}
          <div className="px-3.5 py-1.5 bg-zinc-900/30 border-b border-zinc-800/40 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            {activeChannel === 'general' ? (
              <span>Public feed for verified license holders</span>
            ) : (
              <span>Direct encrypted thread to Admin</span>
            )}
            <span className="text-[10px] text-zinc-500">Live Realtime</span>
          </div>

          {/* Error Notification Toast */}
          {errorToast && (
            <div className="mx-3 mt-2 p-2 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-300 text-[11px] font-mono flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorToast}</span>
            </div>
          )}

          {/* Messages Feed Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 font-mono text-xs custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center text-zinc-500 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                <span>Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-4">
                <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
                <p className="text-zinc-400 font-medium">No messages yet.</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  {activeChannel === 'general'
                    ? 'Start the discussion with other members!'
                    : 'Send a message to open a private ticket with Admin.'}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === discordUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      {msg.is_admin ? (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase text-[9px]">
                          Admin
                        </span>
                      ) : (
                        <span className="font-semibold text-zinc-400">{msg.sender_name}</span>
                      )}
                      <span>•</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-xl text-xs break-words font-sans leading-relaxed ${
                        isMe
                          ? 'bg-purple-600/30 border border-purple-500/40 text-purple-100 rounded-br-none'
                          : msg.is_admin
                          ? 'bg-rose-950/40 border border-rose-800/50 text-rose-100 rounded-bl-none'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-2.5 border-t border-zinc-800/80 bg-zinc-950/80">
            {!user ? (
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-center text-[11px] font-mono text-zinc-400">
                Please log in with Discord to send a message.
              </div>
            ) : (activeChannel === 'general' && !hasPlan && !isOwner) ? (
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-center text-[11px] font-mono text-zinc-500">
                Active license required to chat in General.
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    activeChannel === 'general'
                      ? 'Type message to general...'
                      : 'Send ticket message to support...'
                  }
                  maxLength={500}
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 font-sans transition-colors"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors shrink-0 shadow-sm"
                  title="Send Message"
                >
                  <Send className={`w-3.5 h-3.5 ${sending ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

