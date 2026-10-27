'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Shield, Send, X, RefreshCw, AlertCircle, LogIn } from 'lucide-react';

interface ChatMessage {
  id: number;
  channel: 'support';
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
  hasPlan?: boolean;
}

export default function ChatWidget({ user }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const discordUserId = user?.user_metadata?.provider_id || user?.user_metadata?.sub || user?.id || null;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.custom_claims?.global_name || user?.user_metadata?.user_name || 'Member';
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const isOwner = discordUserId === '719482630633947166';

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const markAsRead = () => {
    if (!discordUserId) return;
    const now = new Date().toISOString();
    try {
      localStorage.setItem(`chat_last_read_support_${discordUserId}`, now);
    } catch {}
    setUnreadCount(0);
  };

  const scrollToBottom = (instant = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: instant ? 'auto' : 'smooth',
      });
    }
  };

  // 1. Fetch support messages
  const fetchMessages = async (isInitial = false) => {
    if (!discordUserId) return;
    if (isInitial && messages.length === 0) {
      setLoading(true);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const url = `/api/chat?channel=support&ticketId=${encodeURIComponent(discordUserId)}&limit=30`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const incoming: ChatMessage[] = data.messages || [];
        setMessages(incoming);
        if (incoming.length < 30) setHasMore(false);
      }
    } catch (e) {
      console.error('[Support Chat Fetch Error]:', e);
    } finally {
      setLoading(false);
      if (isInitial) {
        setTimeout(() => scrollToBottom(true), 50);
      }
    }
  };

  // Initial prefetch & unread detection on mount
  useEffect(() => {
    if (!discordUserId) return;

    const initUnread = async () => {
      try {
        const lastRead = localStorage.getItem(`chat_last_read_support_${discordUserId}`);
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(`/api/chat?channel=support&ticketId=${encodeURIComponent(discordUserId)}&limit=30`, { headers });
        if (res.ok) {
          const data = await res.json();
          const incoming: ChatMessage[] = data.messages || [];
          setMessages(incoming);
          if (incoming.length < 30) setHasMore(false);

          if (lastRead) {
            const count = incoming.filter(
              (m) => m.sender_id !== discordUserId && m.created_at > lastRead
            ).length;
            setUnreadCount(count);
          }
        }
      } catch (err) {
        console.error('[Support Chat Init Error]:', err);
      }
    };

    initUnread();
  }, [discordUserId]);

  // Fetch immediately on open & mark read
  useEffect(() => {
    if (isOpen) {
      fetchMessages(messages.length === 0);
      markAsRead();
      setTimeout(() => scrollToBottom(true), 60);
    }
  }, [isOpen, discordUserId]);

  // Load older messages when scrolling up
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 15 && !loadingOlder && !loading) {
      if (!hasMore || messages.length === 0) return;

      const oldestMsg = messages[0];
      setLoadingOlder(true);
      const prevScrollHeight = target.scrollHeight;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const url = `/api/chat?channel=support&ticketId=${encodeURIComponent(discordUserId)}&limit=25&before=${encodeURIComponent(oldestMsg.created_at)}`;
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          const older: ChatMessage[] = data.messages || [];

          if (older.length < 25) {
            setHasMore(false);
          }

          if (older.length > 0) {
            setMessages((prev) => [...older, ...prev]);
            setTimeout(() => {
              target.scrollTop = target.scrollHeight - prevScrollHeight;
            }, 30);
          }
        }
      } catch (err) {
        console.error('[Load Older Messages Error]:', err);
      } finally {
        setLoadingOlder(false);
      }
    }
  };

  // 2. Realtime WebSocket Subscription
  useEffect(() => {
    if (!discordUserId) return;

    const channelSub = supabase
      .channel(`chat_realtime_support_${discordUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          const isFromMe = newMsg.sender_id === discordUserId;

          if (newMsg.channel === 'support' && newMsg.ticket_id === discordUserId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            if (isOpenRef.current) {
              setTimeout(() => scrollToBottom(false), 50);
              markAsRead();
            } else if (!isFromMe) {
              setUnreadCount((c) => c + 1);
              playChime();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [discordUserId]);

  // 3. Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    if (!user || !discordUserId) {
      setErrorToast('Please log in with Discord first.');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    const tempId = Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      channel: 'support',
      ticket_id: discordUserId,
      sender_id: discordUserId,
      sender_name: displayName,
      sender_avatar: avatarUrl,
      content: textToSend,
      is_admin: isOwner,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 20);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          channel: 'support',
          ticketId: discordUserId,
          content: textToSend,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setErrorToast(errJson.error || 'Failed to send message.');
        setTimeout(() => setErrorToast(null), 4000);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else {
        const resData = await res.json();
        if (resData.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? resData.message : m))
          );
        }
      }
    } catch (e: any) {
      setErrorToast(e.message || 'Network error.');
      setTimeout(() => setErrorToast(null), 4000);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Toggle Pill */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            markAsRead();
          }}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-zinc-950/90 hover:bg-zinc-900 border border-purple-500/40 text-white shadow-2xl transition-all duration-200 hover:scale-105 backdrop-blur-md"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-2 border-zinc-950" />
          </div>
          <span className="font-mono text-xs font-semibold tracking-wide">Support Chat</span>

          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-mono text-[10px] font-bold shadow-[0_0_12px_rgba(168,85,247,0.8)] animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Main Support Panel Container */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-semibold text-white tracking-wide">ASYNC Support Desk</span>
                <span className="text-[10px] text-zinc-500 font-mono">Private Encrypted Thread</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchMessages(true)}
                disabled={loading}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                title="Refresh messages"
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

          {/* Sub-header Information Banner */}
          <div className="px-3.5 py-1.5 bg-zinc-900/30 border-b border-zinc-800/40 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-purple-300">
              <Shield className="w-3 h-3 text-purple-400" />
              <span>Direct thread to Staff</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Live Realtime</span>
          </div>

          {/* Error Notification Toast */}
          {errorToast && (
            <div className="mx-3 mt-2 p-2 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-300 text-[11px] font-mono flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorToast}</span>
            </div>
          )}

          {/* Messages Feed Area */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-3 overflow-y-auto space-y-3 font-mono text-xs custom-scrollbar"
          >
            {loadingOlder && (
              <div className="py-1 text-center text-zinc-500 text-[10px] flex items-center justify-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                <span>Loading older history...</span>
              </div>
            )}

            {loading ? (
              <div className="h-full flex items-center justify-center text-zinc-500 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                <span>Loading messages...</span>
              </div>
            ) : !user ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-zinc-200 font-semibold text-xs">Direct Support Desk</p>
                <p className="text-[11px] text-zinc-500 mt-1 mb-4 max-w-[220px] leading-relaxed">
                  Log in to your account to open and view your private support tickets with staff.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/login';
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-900/30 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-4">
                <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
                <p className="text-zinc-400 font-medium">No messages yet.</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Send a message below to open a private support ticket with staff.
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
                          Staff
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
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-center text-[11px] font-mono text-zinc-400 flex items-center justify-between px-3">
                <span>Please log in to chat with staff.</span>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/login';
                  }}
                  className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition-colors shrink-0 font-mono"
                >
                  Log In
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Send ticket message to staff..."
                  maxLength={500}
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 font-sans transition-colors"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors shrink-0 shadow-sm cursor-pointer"
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
