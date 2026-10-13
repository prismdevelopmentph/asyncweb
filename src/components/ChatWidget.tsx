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
  const [generalMessages, setGeneralMessages] = useState<ChatMessage[]>([]);
  const [supportMessages, setSupportMessages] = useState<ChatMessage[]>([]);
  const [hasMoreGeneral, setHasMoreGeneral] = useState(true);
  const [hasMoreSupport, setHasMoreSupport] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadGeneral, setUnreadGeneral] = useState(0);
  const [unreadSupport, setUnreadSupport] = useState(0);
  const totalUnread = unreadGeneral + unreadSupport;
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const messages = activeChannel === 'general' ? generalMessages : supportMessages;
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOpenRef = useRef(isOpen);
  const activeChannelRef = useRef(activeChannel);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

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

  const markChannelAsRead = (channel: 'general' | 'support') => {
    if (!discordUserId) return;
    const now = new Date().toISOString();
    try {
      localStorage.setItem(`chat_last_read_${channel}_${discordUserId}`, now);
    } catch {}

    if (channel === 'general') {
      setUnreadGeneral(0);
    } else {
      setUnreadSupport(0);
    }
  };

  const scrollToBottom = (instant = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: instant ? 'auto' : 'smooth',
      });
    }
  };

  // 1. Instant background sync (no blanking/unmounting when switching tabs)
  const fetchChannelMessages = async (channel: 'general' | 'support', isInitial = false) => {
    if (!discordUserId) return;
    if (isInitial && (channel === 'general' ? generalMessages.length === 0 : supportMessages.length === 0)) {
      setLoading(true);
    }

    try {
      const url = channel === 'support'
        ? `/api/chat?channel=support&ticketId=${encodeURIComponent(discordUserId)}&limit=30`
        : `/api/chat?channel=general&limit=30`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const incoming: ChatMessage[] = data.messages || [];

        if (channel === 'general') {
          setGeneralMessages(incoming);
          if (incoming.length < 30) setHasMoreGeneral(false);
        } else {
          setSupportMessages(incoming);
          if (incoming.length < 30) setHasMoreSupport(false);
        }
      }
    } catch (e) {
      console.error('[Chat Widget Fetch Error]:', e);
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

    const initUnreadAndCache = async () => {
      try {
        const lastReadGen = localStorage.getItem(`chat_last_read_general_${discordUserId}`);
        const lastReadSup = localStorage.getItem(`chat_last_read_support_${discordUserId}`);

        const [genRes, supRes] = await Promise.all([
          fetch('/api/chat?channel=general&limit=30'),
          fetch(`/api/chat?channel=support&ticketId=${encodeURIComponent(discordUserId)}&limit=30`),
        ]);

        if (genRes.ok) {
          const data = await genRes.json();
          const incoming: ChatMessage[] = data.messages || [];
          setGeneralMessages(incoming);
          if (incoming.length < 30) setHasMoreGeneral(false);

          if (lastReadGen) {
            const count = incoming.filter(
              (m) => m.sender_id !== discordUserId && m.created_at > lastReadGen
            ).length;
            setUnreadGeneral(count);
          }
        }

        if (supRes.ok) {
          const data = await supRes.json();
          const incoming: ChatMessage[] = data.messages || [];
          setSupportMessages(incoming);
          if (incoming.length < 30) setHasMoreSupport(false);

          if (lastReadSup) {
            const count = incoming.filter(
              (m) => m.sender_id !== discordUserId && m.created_at > lastReadSup
            ).length;
            setUnreadSupport(count);
          }
        }
      } catch (err) {
        console.error('[Chat Init Error]:', err);
      }
    };

    initUnreadAndCache();
  }, [discordUserId]);

  // Fetch immediately on open or tab switch & mark read
  useEffect(() => {
    if (isOpen) {
      const currentList = activeChannel === 'general' ? generalMessages : supportMessages;
      fetchChannelMessages(activeChannel, currentList.length === 0);
      markChannelAsRead(activeChannel);
      setTimeout(() => scrollToBottom(true), 60);
    }
  }, [isOpen, activeChannel, discordUserId]);

  // Load older messages when user scrolls up (iMessage / WhatsApp behavior)
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 15 && !loadingOlder && !loading) {
      const currentList = activeChannel === 'general' ? generalMessages : supportMessages;
      const hasMore = activeChannel === 'general' ? hasMoreGeneral : hasMoreSupport;
      if (!hasMore || currentList.length === 0) return;

      const oldestMsg = currentList[0];
      setLoadingOlder(true);
      const prevScrollHeight = target.scrollHeight;

      try {
        const url = activeChannel === 'support'
          ? `/api/chat?channel=support&ticketId=${encodeURIComponent(discordUserId)}&limit=25&before=${encodeURIComponent(oldestMsg.created_at)}`
          : `/api/chat?channel=general&limit=25&before=${encodeURIComponent(oldestMsg.created_at)}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const older: ChatMessage[] = data.messages || [];

          if (older.length < 25) {
            if (activeChannel === 'general') setHasMoreGeneral(false);
            else setHasMoreSupport(false);
          }

          if (older.length > 0) {
            if (activeChannel === 'general') {
              setGeneralMessages((prev) => [...older, ...prev]);
            } else {
              setSupportMessages((prev) => [...older, ...prev]);
            }

            // Maintain exact scroll position so user doesn't jump
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

  // 2. Realtime Subscription via Supabase WebSocket (permanent single channel)
  useEffect(() => {
    if (!discordUserId) return;

    const channelSub = supabase
      .channel(`chat_realtime_widget_${discordUserId}`)
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

          if (newMsg.channel === 'general') {
            setGeneralMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } else if (newMsg.channel === 'support' && newMsg.ticket_id === discordUserId) {
            setSupportMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }

          const isPanelOpen = isOpenRef.current;
          const currentCh = activeChannelRef.current;

          if (isPanelOpen && currentCh === newMsg.channel) {
            setTimeout(() => scrollToBottom(false), 50);
            markChannelAsRead(currentCh);
          } else if (!isFromMe) {
            if (newMsg.channel === 'general') {
              setUnreadGeneral((c) => c + 1);
              playChime();
            } else if (newMsg.channel === 'support' && newMsg.ticket_id === discordUserId) {
              setUnreadSupport((c) => c + 1);
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

    const updateChannelState = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      if (activeChannel === 'general') {
        setGeneralMessages(updater);
      } else {
        setSupportMessages(updater);
      }
    };

    updateChannelState((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(false), 50);

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
        updateChannelState((prev) => prev.filter((m) => m.id !== tempId));
        const errJson = await res.json();
        setErrorToast(errJson.error || 'Failed to send message.');
        setTimeout(() => setErrorToast(null), 3500);
      } else {
        const json = await res.json();
        if (json.message) {
          updateChannelState((prev) =>
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
          onClick={() => {
            setIsOpen(true);
            markChannelAsRead(activeChannel);
          }}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-zinc-950/90 hover:bg-zinc-900 border border-purple-500/40 text-white shadow-2xl transition-all duration-200 hover:scale-105 backdrop-blur-md"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-2 border-zinc-950" />
          </div>
          <span className="font-mono text-xs font-semibold tracking-wide">Live Chat & Support</span>

          {totalUnread > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-mono text-[10px] font-bold shadow-[0_0_12px_rgba(168,85,247,0.8)] animate-pulse">
              {totalUnread > 99 ? '99+' : totalUnread}
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
                onClick={() => fetchChannelMessages(activeChannel, true)}
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
              onClick={() => {
                setActiveChannel('general');
                markChannelAsRead('general');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors relative ${
                activeChannel === 'general'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>General Chat</span>
              {activeChannel !== 'general' && unreadGeneral > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white font-mono text-[9px] font-bold shadow-[0_0_8px_rgba(168,85,247,0.6)]">
                  {unreadGeneral > 99 ? '99+' : unreadGeneral}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveChannel('support');
                markChannelAsRead('support');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors relative ${
                activeChannel === 'support'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Support (Private)</span>
              {activeChannel !== 'support' && unreadSupport > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-mono text-[9px] font-bold shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse">
                  {unreadSupport > 99 ? '99+' : unreadSupport}
                </span>
              )}
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

