'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DiscordLoginButton from '@/components/DiscordLoginButton';
import { supabase } from '@/lib/supabase';
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  Database,
  PlusCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Wrench,
  FileCode,
  Download,
  Search,
  ArrowLeft,
  Crown,
  Copy,
  Check,
  Unlock,
  Ban,
  Layers,
  Terminal,
  Activity,
  UserCheck,
  MoreVertical,
  Edit3,
  RotateCcw,
  Trash2,
  X,
  Upload,
  FileText,
  PackagePlus,
  MessageSquare,
  Send,
  Shield,
  Users
} from 'lucide-react';

function DiscordUserBadge({
  userId,
  userProfiles,
  onCopy,
  copiedKey,
  className = ''
}: {
  userId: string | null | undefined;
  userProfiles?: Record<string, { name: string; username?: string }>;
  onCopy?: (text: string) => void;
  copiedKey?: string | null;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const rawId = userId ? String(userId) : '';
  if (!rawId || rawId === 'Unknown' || rawId === 'N/A' || rawId === 'Guest / Unauthenticated') {
    return <span className="text-zinc-500 font-mono text-[11px]">{rawId || 'Unknown'}</span>;
  }

  const profile = userProfiles?.[rawId];
  let tooltipText = '';

  if (profile) {
    if (profile.name && profile.username && profile.name.toLowerCase() !== profile.username.toLowerCase()) {
      tooltipText = `${profile.name} (@${profile.username})`;
    } else {
      tooltipText = profile.name || profile.username || rawId;
    }
  } else if (rawId === '719482630633947166') {
    tooltipText = 'Maik (Owner)';
  } else if (rawId === 'ASYNC-V2') {
    tooltipText = 'ASYNC V2 Engine';
  }

  const hasResolvedName = Boolean(profile?.name || rawId === '719482630633947166' || rawId === 'ASYNC-V2');

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className={`font-mono text-[11px] select-all cursor-pointer transition-colors ${
          hasResolvedName
            ? 'text-purple-300 hover:text-white underline decoration-dotted decoration-purple-500/60 underline-offset-2'
            : 'text-zinc-300'
        }`}
      >
        {rawId}
      </span>

      {onCopy && (
        <button
          onClick={() => onCopy(rawId)}
          className="text-zinc-500 hover:text-white transition-colors shrink-0"
        >
          {copiedKey === rawId ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Floating pill: strictly 0px layout footprint so rows and cards never adjust */}
      {hovered && tooltipText && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-0 h-0 flex items-center justify-center overflow-visible pointer-events-none z-50">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950 border border-purple-500/50 text-zinc-100 text-[10px] font-sans font-medium whitespace-nowrap shadow-[0_4px_25px_rgba(0,0,0,0.95)] backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <span className="font-semibold tracking-wide text-zinc-100">{tooltipText}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Tabs & Modals
  const [activeTab, setActiveTab] = useState<'security' | 'generator' | 'decrypt' | 'audit' | 'chat'>('security');
  const [auditSubTab, setAuditSubTab] = useState<'claims' | 'downloads' | 'unbans'>('claims');
  const [chatChannel, setChatChannel] = useState<'support' | 'general'>('support');
  const [chatTickets, setChatTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [sendingAdminChat, setSendingAdminChat] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [showGenLicenseModal, setShowGenLicenseModal] = useState(false);
  const [showManualBanModal, setShowManualBanModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form Inputs: Manual Ban
  const [banIpAddress, setBanIpAddress] = useState('');
  const [banReason, setBanReason] = useState('');

  // Form Inputs: Generator License
  const [genLicKey, setGenLicKey] = useState('');
  const [genLicUserId, setGenLicUserId] = useState('');
  const [genLicScope, setGenLicScope] = useState('All');
  const [genLicTier, setGenLicTier] = useState<'daily' | 'weekly' | 'monthly' | 'lifetime'>('lifetime');
  const [genLicDailyLimit, setGenLicDailyLimit] = useState('');

  // Dropdown & Edit Limit Modal State
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const [showEditLimitModal, setShowEditLimitModal] = useState(false);
  const [editingLic, setEditingLic] = useState<any>(null);
  const [editLimitValue, setEditLimitValue] = useState('15');

  // Restock Modal State
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockService, setRestockService] = useState('');
  const [restockContent, setRestockContent] = useState('');
  const [restockFileName, setRestockFileName] = useState('');

  // Form Inputs: Plan Assignment (Decrypt VIP)
  const [planUserId, setPlanUserId] = useState('');
  const [planUsername, setPlanUsername] = useState('');
  const [planType, setPlanType] = useState<'combo' | 'dumper' | 'decrypt'>('combo');
  const [planDuration, setPlanDuration] = useState<'month' | 'lifetime'>('month');

  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Session & Auth Check
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ownerUserId = user?.user_metadata?.provider_id || user?.user_metadata?.sub || user?.id;
  const isOwner = ownerUserId === '719482630633947166' || ownerUserId === process.env.NEXT_PUBLIC_OWNER_USER_ID;

  const CACHE_TTL_MS = 3600000; // 1 hour fallback TTL

  // 2. Fetch Admin Data
  const fetchAdminData = async (forceRefresh = false) => {
    if (!ownerUserId) return;

    const cacheKey = `async_admin_cache_v2_${ownerUserId}`;

    // Check sessionStorage cache first if not forcing refresh
    if (!forceRefresh) {
      try {
        const cachedStr = sessionStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached.data?.userProfiles && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            setAdminData(cached.data);
            setDataLoading(false);
            return;
          }
        }
      } catch (e) {
        // Fallback to network on parse error
      }
    }

    setDataLoading(true);
    try {
      const res = await fetch(`/api/dashboard-data?userId=${encodeURIComponent(ownerUserId)}&admin=true`);
      if (res.ok) {
        const json = await res.json();
        setAdminData(json);
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: json }));
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user && isOwner) {
      fetchAdminData();
    }
  }, [user, isOwner]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── HANDLERS ──

  // Unban Security Lockout
  const handleUnbanLockout = async (lockoutId: number, ipAddress: string) => {
    if (!confirm(`Unban IP / Device ${ipAddress}? This will restore access immediately.`)) return;
    setActionMessage('');
    setActionError('');

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unban_security_lockout',
          ownerUserId,
          lockoutId,
          ipAddress,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to lift lockout');

      setActionMessage(json.message);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Manual Ban IP
  const handleManualBanIP = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage('');
    setActionError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ban_security_ip',
          ownerUserId,
          ipAddress: banIpAddress.trim(),
          reason: banReason.trim() || 'Manual Admin Overriding Ban',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to ban IP');

      setActionMessage(json.message);
      setShowManualBanModal(false);
      setBanIpAddress('');
      setBanReason('');
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate Generator License Key
  const handleGenerateGenLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage('');
    setActionError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_generator_license',
          ownerUserId,
          targetUserId: genLicUserId.trim() || null,
          scope: genLicScope,
          tier: genLicTier,
          dailyLimit: genLicTier === 'lifetime' ? (genLicDailyLimit || null) : undefined,
          licenseKey: genLicKey.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate key');

      setActionMessage(`Generator License Created: ${json.license?.license_key}`);
      setShowGenLicenseModal(false);
      setGenLicUserId('');
      setGenLicKey('');
      setGenLicScope('All');
      setGenLicTier('lifetime');
      setGenLicDailyLimit('');
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Generator License Status
  const handleToggleGenLicense = async (licenseId: number, currentActive: boolean) => {
    setActionMessage('');
    setActionError('');

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_generator_license',
          ownerUserId,
          licenseId,
          currentActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to toggle license');

      setActionMessage(json.message);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Edit Generator License Daily Limit
  const handleEditGenLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLic) return;
    setActionMessage('');
    setActionError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_generator_license',
          ownerUserId,
          licenseId: editingLic.id,
          dailyLimit: editLimitValue,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update daily limit');

      setActionMessage(json.message);
      setShowEditLimitModal(false);
      setEditingLic(null);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset User Generation Claims
  const handleResetGenUsage = async (lic: any) => {
    if (!confirm(`Reset daily generation count for license key ${lic.license_key}?`)) return;
    setActionMessage('');
    setActionError('');

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_generator_usage',
          ownerUserId,
          licenseId: lic.id,
          targetUserId: lic.redeemed_by || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to reset usage');

      setActionMessage(json.message);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Reset Generator License HWID Binding
  const handleResetGenHwid = async (lic: any) => {
    const hwidInfo = lic.hwid ? `\n\nBound HWID: ${lic.hwid}` : '\n\n(Currently UNBOUND)';
    if (!confirm(`Reset and unbind HWID for license key ${lic.license_key}?${hwidInfo}\n\nThis will allow the user to bind a new hardware device on their next client launch.`)) return;
    setActionMessage('');
    setActionError('');

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_generator_hwid',
          ownerUserId,
          licenseId: lic.id,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to reset HWID');

      setActionMessage(json.message);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Delete Generator License Key
  const handleDeleteGenLicense = async (lic: any) => {
    if (!confirm(`PERMANENTLY DELETE license key ${lic.license_key}? This cannot be undone.`)) return;
    setActionMessage('');
    setActionError('');

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_generator_license',
          ownerUserId,
          licenseId: lic.id,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete license');

      setActionMessage(json.message);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Bulk Stock Restock Handler
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockService || !restockContent.trim()) return;

    setActionMessage('');
    setActionError('');
    setSubmitting(true);

    const lines = restockContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    try {
      const res = await fetch('/api/admin/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUserId,
          serviceName: restockService,
          lines,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to restock service stock');

      setActionMessage(json.message);
      setShowRestockModal(false);
      setRestockService('');
      setRestockContent('');
      setRestockFileName('');
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestockFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestockFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRestockContent(text);
      }
    };
    reader.readAsText(file);
  };

  // Assign Decrypt VIP Plan
  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage('');
    setActionError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_plan',
          ownerUserId,
          targetUserId: planUserId.trim(),
          username: planUsername.trim() || 'User',
          planType,
          duration: planDuration,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to assign plan');

      setActionMessage(json.message);
      setShowAssignPlanModal(false);
      setPlanUserId('');
      setPlanUsername('');
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── ADMIN CHAT & SUPPORT FUNCTIONS ──
  const fetchSupportTickets = async () => {
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat?channel=support&limit=100');
      if (res.ok) {
        const json = await res.json();
        const allMsgs: any[] = json.messages || [];

        // Group messages by ticket_id
        const map = new Map<string, any>();
        allMsgs.forEach((m) => {
          const tid = m.ticket_id || m.sender_id;
          if (!map.has(tid)) {
            map.set(tid, {
              ticket_id: tid,
              sender_id: m.sender_id,
              sender_name: m.sender_name,
              sender_avatar: m.sender_avatar,
              last_message: m.content,
              last_time: m.created_at,
              unread_count: !m.is_admin ? 1 : 0,
            });
          } else {
            const existing = map.get(tid);
            existing.last_message = m.content;
            existing.last_time = m.created_at;
            if (!m.is_admin) existing.unread_count += 1;
          }
        });

        const ticketList = Array.from(map.values()).sort(
          (a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime()
        );
        setChatTickets(ticketList);

        if (!selectedTicketId && ticketList.length > 0) {
          setSelectedTicketId(ticketList[0].ticket_id);
        }
      }
    } catch (e) {
      console.error('[Admin Chat Error]:', e);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/chat?channel=support&ticketId=${encodeURIComponent(ticketId)}&limit=100`);
      if (res.ok) {
        const json = await res.json();
        setTicketMessages(json.messages || []);
      }
    } catch (e) {
      console.error('[Admin Ticket Messages Error]:', e);
    }
  };

  const fetchGeneralMessages = async () => {
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat?channel=general&limit=80');
      if (res.ok) {
        const json = await res.json();
        setTicketMessages(json.messages || []);
      }
    } catch (e) {
      console.error('[Admin General Chat Error]:', e);
    } finally {
      setChatLoading(false);
    }
  };

  // Sync active chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      if (chatChannel === 'support') {
        fetchSupportTickets();
      } else {
        fetchGeneralMessages();
      }
    }
  }, [activeTab, chatChannel]);

  useEffect(() => {
    if (activeTab === 'chat' && chatChannel === 'support' && selectedTicketId) {
      fetchTicketMessages(selectedTicketId);
    }
  }, [activeTab, chatChannel, selectedTicketId]);

  // Realtime subscription for admin chat
  useEffect(() => {
    if (activeTab !== 'chat') return;

    const channelSub = supabase
      .channel(`admin_chat_sub_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as any;
          if (chatChannel === 'general' && newMsg.channel === 'general') {
            setTicketMessages((prev) => [...prev, newMsg]);
          } else if (chatChannel === 'support' && newMsg.channel === 'support') {
            const tid = newMsg.ticket_id || newMsg.sender_id;
            if (tid === selectedTicketId) {
              setTicketMessages((prev) => [...prev, newMsg]);
            }
            // Update ticket list last message
            setChatTickets((prev) => {
              const idx = prev.findIndex((t) => t.ticket_id === tid);
              if (idx !== -1) {
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  last_message: newMsg.content,
                  last_time: newMsg.created_at,
                };
                return updated.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
              }
              return [
                {
                  ticket_id: tid,
                  sender_id: newMsg.sender_id,
                  sender_name: newMsg.sender_name,
                  sender_avatar: newMsg.sender_avatar,
                  last_message: newMsg.content,
                  last_time: newMsg.created_at,
                  unread_count: 1,
                },
                ...prev,
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [activeTab, chatChannel, selectedTicketId]);

  const handleSendAdminMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminChatInput.trim() || sendingAdminChat) return;

    const content = adminChatInput.trim();
    setAdminChatInput('');
    setSendingAdminChat(true);

    const tempId = Date.now();
    const optimisticMsg: any = {
      id: tempId,
      channel: chatChannel,
      ticket_id: chatChannel === 'support' ? selectedTicketId : null,
      sender_id: ownerUserId || '719482630633947166',
      sender_name: 'Maik (Admin)',
      sender_avatar: user?.user_metadata?.avatar_url || null,
      content,
      is_admin: true,
      created_at: new Date().toISOString(),
    };

    setTicketMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: chatChannel,
          ticketId: chatChannel === 'support' ? selectedTicketId : null,
          senderId: ownerUserId || '719482630633947166',
          senderName: 'Maik (Admin)',
          senderAvatar: user?.user_metadata?.avatar_url || null,
          content,
          isAdmin: true,
        }),
      });

      if (!res.ok) {
        setTicketMessages((prev) => prev.filter((m) => m.id !== tempId));
        const err = await res.json();
        setActionError(err.error || 'Failed to dispatch chat reply');
      } else {
        const json = await res.json();
        if (json.message) {
          setTicketMessages((prev) =>
            prev.map((m) => (m.id === tempId ? json.message : m))
          );
        }
      }
    } catch (err: any) {
      setActionError(err.message || 'Error sending chat reply');
    } finally {
      setSendingAdminChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center font-sans dev-grid-bg">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
          <Sparkles className="w-5 h-5 text-purple-400 animate-spin" />
        </div>
        <p className="text-xs font-mono text-zinc-500 tracking-wider">INITIALIZING ADMIN CONSOLE...</p>
      </div>
    );
  }

  // Security Gate: Non-owner access blocked
  if (!user || !isOwner) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 relative overflow-hidden font-sans selection:bg-zinc-800 selection:text-zinc-100 dev-grid-bg">
        <Navbar />

        <main className="relative z-10 max-w-lg mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <div className="bg-zinc-950 p-8 sm:p-10 rounded-2xl border border-zinc-800 w-full shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h1 className="text-2xl font-bold mb-2 text-white">Access Restricted</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed">
              This control panel is strictly restricted to authorized system Owners. If you are an Owner, please sign in with your designated Discord account.
            </p>

            {!user ? (
              <DiscordLoginButton size="lg" className="w-full" text="Sign in as Owner" />
            ) : (
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
                User ID: {ownerUserId} (Unauthorized)
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const securityLockouts = adminData?.securityLockouts || [];
  const generatorLicenses = adminData?.generatorLicenses || [];
  const services = adminData?.services || [];
  const packages = adminData?.packages || [];
  const plansList = adminData?.plans || [];
  const decryptionsList = adminData?.decryptions || [];
  const fixesList = adminData?.fixes || [];
  const claimLogs = adminData?.claimLogs || [];
  const downloadLogs = adminData?.downloadLogs || [];

  const userProfiles = adminData?.userProfiles || {};

  const matchDiscordUser = (id: string | null | undefined, query: string) => {
    if (!id) return false;
    const str = String(id).toLowerCase();
    if (str.includes(query)) return true;
    const prof = userProfiles[String(id)];
    if (prof) {
      if (prof.name?.toLowerCase().includes(query)) return true;
      if (prof.username?.toLowerCase().includes(query)) return true;
    }
    return false;
  };

  // Filtered Lists
  const filteredLockouts = securityLockouts.filter((l: any) =>
    (l.ip_address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    matchDiscordUser(l.discord_user_id, searchQuery.toLowerCase()) ||
    (l.reason || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGenLicenses = generatorLicenses.filter((l: any) =>
    (l.license_key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    matchDiscordUser(l.redeemed_by, searchQuery.toLowerCase()) ||
    (l.hwid || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDecryptions = decryptionsList.filter((d: any) =>
    matchDiscordUser(d.user_id, searchQuery.toLowerCase()) ||
    (d.file_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFixes = fixesList.filter((f: any) =>
    matchDiscordUser(f.user_id, searchQuery.toLowerCase()) ||
    (f.file_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClaimLogs = claimLogs.filter((c: any) =>
    (c.service_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    matchDiscordUser(c.discord_user_id, searchQuery.toLowerCase()) ||
    (c.raw_data || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.source || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDownloadLogs = downloadLogs.filter((d: any) =>
    matchDiscordUser(d.discord_user_id, searchQuery.toLowerCase()) ||
    (d.license_key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.ip_address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.user_agent || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeBannedLockoutsCount = securityLockouts.filter((l: any) => l.is_banned).length;
  const unbannedOverridesCount = securityLockouts.filter((l: any) => !l.is_banned).length;

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-hidden font-sans selection:bg-zinc-800 selection:text-zinc-100 dev-grid-bg">
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        
        {/* Top Header Ribbon */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-zinc-950/80 rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  System Administration Console
                </h1>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 tracking-wider">
                  OWNER CONTROL
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Manage Security Lockouts, Generator Stock & Licenses, and Asset Recovery Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-end">
            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            <button
              onClick={() => fetchAdminData(true)}
              disabled={dataLoading}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* FEEDBACK NOTIFICATIONS */}
        {actionMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionMessage}</span>
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{actionError}</span>
          </div>
        )}

        {/* SYSTEM STATS COUNTERS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-950/80 rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Active Banned Lockouts</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-400 font-mono">
              {activeBannedLockoutsCount}
            </div>
            <span className="text-[11px] text-zinc-500 font-mono block mt-1">Total logged: {securityLockouts.length}</span>
          </div>

          <div className="bg-zinc-950/80 rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Generator Services</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {services.length}
            </div>
            <span className="text-[11px] text-zinc-500 font-mono block mt-1">Active generator modules</span>
          </div>

          <div className="bg-zinc-950/80 rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Generator Licenses</span>
              <Key className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono">
              {generatorLicenses.length}
            </div>
            <span className="text-[11px] text-zinc-500 font-mono block mt-1">Active & issued keys</span>
          </div>

          <div className="bg-zinc-950/80 rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Total Decryptions</span>
              <FileCode className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {decryptionsList.length}
            </div>
            <span className="text-[11px] text-zinc-500 font-mono block mt-1">Processed assets</span>
          </div>
        </div>

        {/* TABS & ACTION BUTTONS */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950/80 border border-zinc-800 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-zinc-900 border border-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Security Lockouts ({activeBannedLockoutsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'generator'
                  ? 'bg-zinc-900 border border-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Generator & Stock ({services.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('decrypt')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'decrypt'
                  ? 'bg-zinc-900 border border-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Decrypt & Telemetry ({decryptionsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-zinc-900 border border-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>Audit Trail ({claimLogs.length + downloadLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-zinc-900 border border-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span>Support & Chat</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search IP, User ID, Key..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
              />
            </div>

            {activeTab === 'security' && (
              <button
                onClick={() => setShowManualBanModal(true)}
                className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Ban IP</span>
              </button>
            )}

            {activeTab === 'decrypt' && (
              <button
                onClick={() => setShowAssignPlanModal(true)}
                className="px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Assign VIP</span>
              </button>
            )}
          </div>
        </div>

        {/* ── TAB 1: SECURITY & DEVTOOLS LOCKOUTS ── */}
        {activeTab === 'security' && (
          <section className="space-y-4">
            <div className="bg-zinc-950/80 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-rose-300 font-semibold">
                  <Terminal className="w-4 h-4 text-rose-400" />
                  <span>SECURITY AUDIT & LOCKOUT LIST ({filteredLockouts.length})</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Edge Middleware Enforced</span>
              </div>

              <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/70 text-[10px] font-mono text-zinc-400 uppercase tracking-wider backdrop-blur-md">
                    <tr>
                      <th className="py-3 px-4">Visitor IP Address</th>
                      <th className="py-3 px-4">Linked Account / Device</th>
                      <th className="py-3 px-4">Detection Reason</th>
                      <th className="py-3 px-4">Timestamp (UTC)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Web Unban Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-zinc-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-400" />
                          <span>Loading security lockout records...</span>
                        </td>
                      </tr>
                    ) : filteredLockouts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-zinc-500 font-mono">
                          No active security lockouts found.
                        </td>
                      </tr>
                    ) : (
                      filteredLockouts.map((lockout: any) => {
                        const isBanned = lockout.is_banned;
                        const targetId = lockout.discord_user_id || 'Guest / Unauthenticated';

                        return (
                          <tr key={lockout.id} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-rose-400 select-all">
                              {lockout.ip_address}
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-300">
                              {targetId.startsWith('dev_') ? (
                                <span className="text-purple-300">{targetId} (Device)</span>
                              ) : targetId.length > 5 ? (
                                <DiscordUserBadge userId={lockout.discord_user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                              ) : (
                                <span className="text-zinc-500">Guest / Unauthenticated</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium text-zinc-200 font-sans">
                              {lockout.reason}
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                              {new Date(lockout.created_at || Date.now()).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium whitespace-nowrap ${
                                  isBanned
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {isBanned ? 'LOCKED' : 'RESTORED'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {isBanned ? (
                                <button
                                  onClick={() => handleUnbanLockout(lockout.id, lockout.ip_address)}
                                  className="px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-xs flex items-center gap-1.5 ml-auto transition-colors"
                                >
                                  <Unlock className="w-3 h-3" />
                                  <span>Unban</span>
                                </button>
                              ) : (
                                <span className="text-emerald-400 font-mono text-[11px]">Active</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── TAB 2: GENERATOR & STOCK MANAGEMENT ── */}
        {activeTab === 'generator' && (
          <section className="space-y-6">
            {/* Services Stock Overview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Service Stock Overview</span>
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRestockModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    <span>Restock</span>
                  </button>

                  <button
                    onClick={() => setShowGenLicenseModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Gen License</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {services.map((svc: any) => (
                  <div key={svc.id} className="bg-zinc-950/80 rounded-2xl p-4 border border-zinc-800 flex flex-col justify-between space-y-3 shadow-sm hover:border-zinc-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm tracking-wide">{svc.name}</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[10px]">
                        ID: {svc.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono text-xs pt-2.5 border-t border-zinc-800">
                      <span className="text-zinc-500">Stock Module</span>
                      <button
                        onClick={() => {
                          setRestockService(svc.name);
                          setShowRestockModal(true);
                        }}
                        className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white font-mono text-[11px] flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3 h-3 text-purple-400" />
                        <span>Restock</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generator License Keys Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Generator License Keys ({filteredGenLicenses.length})</span>
              </h3>

              <div className="bg-zinc-950/80 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
                <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/70 text-[10px] font-mono text-zinc-400 uppercase tracking-wider backdrop-blur-md">
                      <tr>
                        <th className="py-3 px-4">License Key</th>
                        <th className="py-3 px-4">Scope</th>
                        <th className="py-3 px-4">Tier</th>
                        <th className="py-3 px-4">Redeemed By</th>
                        <th className="py-3 px-4">HWID</th>
                        <th className="py-3 px-4">Daily Usage / Limit</th>
                        <th className="py-3 px-4">Created At</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      {filteredGenLicenses.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-zinc-500 font-mono">
                            No generator licenses found.
                          </td>
                        </tr>
                      ) : (
                        filteredGenLicenses.map((lic: any) => (
                          <tr key={lic.id} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-zinc-200 select-all">
                              <div className="inline-flex items-center gap-2">
                                <span>{lic.license_key}</span>
                                <button onClick={() => copyToClipboard(lic.license_key)} className="text-zinc-500 hover:text-white transition-colors">
                                  {copiedKey === lic.license_key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono">
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded font-mono truncate max-w-[140px] inline-block ${
                                  lic.scope_label && lic.scope_label.startsWith('[Package]')
                                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                    : lic.scope_label === 'All Services'
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                                }`}
                                title={lic.scope_label || 'All Services'}
                              >
                                {lic.scope_label || 'All Services'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono">
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                                {lic.tier || 'lifetime'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-300 whitespace-nowrap min-w-[175px]">
                              {lic.redeemed_by ? (
                                <DiscordUserBadge userId={lic.redeemed_by} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                              ) : (
                                <span className="text-zinc-500">UNREDEEMED</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {lic.hwid ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <span
                                    className="text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded font-mono select-all max-w-[155px] truncate inline-block"
                                    title={lic.hwid}
                                  >
                                    {lic.hwid}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(lic.hwid)}
                                    className="text-zinc-500 hover:text-white transition-colors"
                                    title="Copy HWID"
                                  >
                                    {copiedKey === lic.hwid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleResetGenHwid(lic)}
                                    className="p-1 rounded hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition-colors"
                                    title="Reset / Unbind HWID"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                                  UNBOUND
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              <div className="inline-flex items-center gap-1.5">
                                <span className={`font-semibold ${ (lic.used_today || 0) >= (lic.effective_limit ?? lic.daily_limit ?? 15) ? 'text-rose-400' : 'text-zinc-200' }`}>
                                  {lic.used_today || 0} / {lic.effective_limit ?? lic.daily_limit ?? 15}
                                </span>
                                <span className="text-zinc-500 text-[10px]">claimed</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                              {new Date(lic.created_at || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${lic.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                                {lic.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-block text-left">
                                <button
                                  onClick={(e) => {
                                    if (activeDropdownId === lic.id) {
                                      setActiveDropdownId(null);
                                      setDropdownPos(null);
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setDropdownPos({
                                        top: rect.bottom + 6,
                                        right: window.innerWidth - rect.right,
                                      });
                                      setActiveDropdownId(lic.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5 ml-auto transition-colors"
                                >
                                  <span>Actions</span>
                                  <MoreVertical className="w-3 h-3 text-zinc-400" />
                                </button>

                                {activeDropdownId === lic.id && dropdownPos && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-[99998]"
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        setDropdownPos(null);
                                      }}
                                    />
                                    <div
                                      style={{ top: `${dropdownPos.top}px`, right: `${dropdownPos.right}px` }}
                                      className="fixed w-44 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl z-[99999] py-1 divide-y divide-zinc-800 text-xs font-medium text-zinc-200 animate-in fade-in zoom-in-95 font-sans"
                                    >
                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            setActiveDropdownId(null);
                                            setDropdownPos(null);
                                            handleToggleGenLicense(lic.id, lic.is_active);
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-900 flex items-center gap-2 text-zinc-300 hover:text-white"
                                        >
                                          <Ban className="w-3.5 h-3.5 text-amber-400" />
                                          <span>{lic.is_active ? 'Disable License' : 'Enable License'}</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setActiveDropdownId(null);
                                            setDropdownPos(null);
                                            setEditingLic(lic);
                                            setEditLimitValue(String(lic.daily_limit || 15));
                                            setShowEditLimitModal(true);
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-900 flex items-center gap-2 text-zinc-300 hover:text-white"
                                        >
                                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                                          <span>Edit Daily Limit</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setActiveDropdownId(null);
                                            setDropdownPos(null);
                                            handleResetGenUsage(lic);
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-900 flex items-center gap-2 text-zinc-300 hover:text-white"
                                        >
                                          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                                          <span>Reset Generation</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setActiveDropdownId(null);
                                            setDropdownPos(null);
                                            handleResetGenHwid(lic);
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-900 flex items-center gap-2 text-zinc-300 hover:text-white"
                                        >
                                          <Unlock className="w-3.5 h-3.5 text-purple-400" />
                                          <span>Reset HWID</span>
                                        </button>
                                      </div>

                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            setActiveDropdownId(null);
                                            setDropdownPos(null);
                                            handleDeleteGenLicense(lic);
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 font-medium"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                          <span>Delete License</span>
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── TAB 3: DECRYPT & ASSET RECOVERY ── */}
        {activeTab === 'decrypt' && (
          <section className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resource Decryptions Audit ({filteredDecryptions.length})</span>
              </h3>

              <div className="bg-zinc-950/80 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
                <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/70 text-[10px] font-mono text-zinc-400 uppercase tracking-wider backdrop-blur-md">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">User ID</th>
                        <th className="py-3 px-4">Resource File</th>
                        <th className="py-3 px-4">Key / Mode</th>
                        <th className="py-3 px-4">Extracted</th>
                        <th className="py-3 px-4 text-right">Download Output</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      {filteredDecryptions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500 font-mono">
                            No decryptions logged yet.
                          </td>
                        </tr>
                      ) : (
                        filteredDecryptions.map((d: any) => (
                          <tr key={d.id} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                              {new Date(d.created_at).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-300">
                              <DiscordUserBadge userId={d.user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                            </td>
                            <td className="py-3 px-4 font-medium text-white font-sans">
                              {d.file_name}
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-400">
                              {d.key_type || 'Auto'}
                            </td>
                            <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                              {d.decrypted ?? 0} files
                            </td>
                            <td className="py-3 px-4 text-right">
                              {d.download_url ? (
                                <a
                                  href={d.download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                              ) : (
                                <span className="text-zinc-600 text-[11px]">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── TAB 4: AUDIT TRAIL & HISTORY ── */}
        {activeTab === 'audit' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            {/* Sub-tab navigation */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
              <button
                onClick={() => setAuditSubTab('claims')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  auditSubTab === 'claims'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Account Claims ({filteredClaimLogs.length})</span>
              </button>

              <button
                onClick={() => setAuditSubTab('downloads')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  auditSubTab === 'downloads'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>App Downloads ({filteredDownloadLogs.length})</span>
              </button>

              <button
                onClick={() => setAuditSubTab('unbans')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  auditSubTab === 'unbans'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Security & Unban History ({securityLockouts.length})</span>
              </button>
            </div>

            {/* Sub-tab 1: Account Claims */}
            {auditSubTab === 'claims' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Real-Time Account Claims ({filteredClaimLogs.length})</span>
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">Live feed from website & desktop client</span>
                </div>

                <div className="bg-zinc-950/80 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
                  <div className="max-h-[550px] overflow-y-auto overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/70 text-[10px] font-mono text-zinc-400 uppercase tracking-wider backdrop-blur-md">
                        <tr>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Service</th>
                          <th className="py-3 px-4">Source</th>
                          <th className="py-3 px-4">Claimed By</th>
                          <th className="py-3 px-4">Account Payload</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono">
                        {filteredClaimLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-500 font-mono">
                              No account claim logs found.
                            </td>
                          </tr>
                        ) : (
                          filteredClaimLogs.map((log: any) => {
                            const isApp = String(log.source || '').toLowerCase().includes('app') || log.discord_user_id === 'ASYNC-V2';
                            return (
                              <tr key={log.id} className="hover:bg-zinc-900/30 transition-colors">
                                <td className="py-3 px-4 text-zinc-400 text-[11px] whitespace-nowrap">
                                  {new Date(log.claimed_at || Date.now()).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 font-semibold text-zinc-200">
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 uppercase tracking-wider">
                                    {log.service_name || 'N/A'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  {isApp ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                                      🖥️ App Generator
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                                      🌐 Website
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-zinc-300 whitespace-nowrap min-w-[175px]">
                                  <DiscordUserBadge userId={log.discord_user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                                </td>
                                <td className="py-3 px-4">
                                  <div className="inline-flex items-center gap-2 max-w-xs truncate text-[11px] text-zinc-400 font-mono bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800">
                                    <span className="truncate select-all" title={log.raw_data}>
                                      {log.raw_data || 'Hidden'}
                                    </span>
                                    <button onClick={() => copyToClipboard(log.raw_data)} className="text-zinc-500 hover:text-white transition-colors shrink-0">
                                      {copiedKey === log.raw_data ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: App Downloads */}
            {auditSubTab === 'downloads' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    <span>Verified App Downloads ({filteredDownloadLogs.length})</span>
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">Only authorized licensed users can download</span>
                </div>

                <div className="bg-zinc-950/80 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
                  <div className="max-h-[550px] overflow-y-auto overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/70 text-[10px] font-mono text-zinc-400 uppercase tracking-wider backdrop-blur-md">
                        <tr>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Discord User ID</th>
                          <th className="py-3 px-4">License Key</th>
                          <th className="py-3 px-4">IP Address</th>
                          <th className="py-3 px-4">User-Agent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono">
                        {filteredDownloadLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-500 font-mono">
                              No client download logs recorded yet.
                            </td>
                          </tr>
                        ) : (
                          filteredDownloadLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-zinc-900/30 transition-colors">
                              <td className="py-3 px-4 text-zinc-400 text-[11px] whitespace-nowrap">
                                {new Date(log.downloaded_at || Date.now()).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 font-semibold text-zinc-200 whitespace-nowrap min-w-[175px]">
                                <DiscordUserBadge userId={log.discord_user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-amber-400 select-all font-mono">
                                  {log.license_key || 'Direct'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-zinc-300">
                                <span className="select-all text-[11px] font-mono text-zinc-400">{log.ip_address || '127.0.0.1'}</span>
                              </td>
                              <td className="py-3 px-4 text-zinc-500 text-[11px] max-w-xs truncate" title={log.user_agent}>
                                {log.user_agent || 'Unknown'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Security & Unbans */}
            {auditSubTab === 'unbans' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Security Lockouts & Unban History ({securityLockouts.length})</span>
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">{unbannedOverridesCount} unbanned overrides</span>
                </div>

                <div className="bg-zinc-950/80 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
                  <div className="max-h-[550px] overflow-y-auto overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/70 text-[10px] font-mono text-zinc-400 uppercase tracking-wider backdrop-blur-md">
                        <tr>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Target IP</th>
                          <th className="py-3 px-4">Discord User ID</th>
                          <th className="py-3 px-4">Reason / Trigger</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono">
                        {securityLockouts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-zinc-500 font-mono">
                              No security history found.
                            </td>
                          </tr>
                        ) : (
                          securityLockouts.map((lock: any) => (
                            <tr key={lock.id} className="hover:bg-zinc-900/30 transition-colors">
                              <td className="py-3 px-4 text-zinc-400 text-[11px] whitespace-nowrap">
                                {new Date(lock.created_at || Date.now()).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                {lock.is_banned ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30 whitespace-nowrap">
                                    ACTIVE BAN
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                    UNBANNED / RESTORED
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-zinc-200">
                                <div className="inline-flex items-center gap-1.5 font-mono select-all text-[11px]">
                                  <span>{lock.ip_address}</span>
                                  <button onClick={() => copyToClipboard(lock.ip_address)} className="text-zinc-500 hover:text-white transition-colors">
                                    {copiedKey === lock.ip_address ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-zinc-300 font-mono text-[11px] whitespace-nowrap min-w-[175px]">
                                <DiscordUserBadge userId={lock.discord_user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                              </td>
                              <td className="py-3 px-4 text-zinc-400 text-[11px] max-w-xs truncate" title={lock.reason}>
                                {lock.reason || 'Security Alert'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {lock.is_banned ? (
                                  <button
                                    onClick={() => handleUnbanLockout(lock.id, lock.ip_address)}
                                    className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors"
                                  >
                                    Unban
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setBanIpAddress(lock.ip_address);
                                      setBanReason('Re-enforced Ban from Audit Trail');
                                      setShowManualBanModal(true);
                                    }}
                                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 text-xs font-medium transition-colors"
                                  >
                                    Re-ban
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── TAB 5: SUPPORT & CHAT MANAGEMENT ── */}
        {activeTab === 'chat' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            {/* Sub-channel switcher */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <button
                onClick={() => setChatChannel('support')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-2 ${
                  chatChannel === 'support'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Support Tickets ({chatTickets.length})</span>
              </button>

              <button
                onClick={() => setChatChannel('general')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-2 ${
                  chatChannel === 'general'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>General Community Feed</span>
              </button>
            </div>

            {/* Split Screen Container for Support / General */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[560px]">
              {/* Left Column: Tickets List (if support) or Community Status (if general) */}
              <div className="md:col-span-4 bg-zinc-950/80 rounded-2xl border border-zinc-800 p-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
                    {chatChannel === 'support' ? 'Active Support Tickets' : 'General Chat Feed'}
                  </span>
                  <button
                    onClick={() => chatChannel === 'support' ? fetchSupportTickets() : fetchGeneralMessages()}
                    className="p-1 rounded text-zinc-500 hover:text-white"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${chatLoading ? 'animate-spin text-purple-400' : ''}`} />
                  </button>
                </div>

                {chatChannel === 'support' ? (
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs custom-scrollbar">
                    {chatTickets.length === 0 ? (
                      <div className="py-12 text-center text-zinc-500">
                        No support tickets opened yet.
                      </div>
                    ) : (
                      chatTickets.map((ticket) => {
                        const isSelected = selectedTicketId === ticket.ticket_id;
                        return (
                          <button
                            key={ticket.ticket_id}
                            onClick={() => setSelectedTicketId(ticket.ticket_id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-zinc-900 border-purple-500/50 shadow-md'
                                : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/80 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-zinc-200 truncate">
                                {ticket.sender_name}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                {new Date(ticket.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate mb-1">
                              {ticket.last_message}
                            </div>
                            <div className="text-[10px] text-zinc-500 truncate">
                              ID: {ticket.ticket_id}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center text-center p-4 text-zinc-500 text-xs font-mono">
                    <Users className="w-8 h-8 text-purple-400/60 mx-auto mb-2" />
                    <p className="text-zinc-300 font-medium">Public Community Chat</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Messages dispatched here are broadcast live to all active license holders via Supabase Realtime.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Chat Conversation Stream & Dispatch Input */}
              <div className="md:col-span-8 bg-zinc-950/80 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="font-mono text-xs font-semibold text-white">
                      {chatChannel === 'support'
                        ? `Support Ticket: ${selectedTicketId || 'Select a ticket'}`
                        : 'General Channel Realtime Stream'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Admin Operator Session
                  </span>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs min-h-[380px] max-h-[460px] custom-scrollbar">
                  {ticketMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
                      <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
                      <p>No messages in this thread yet.</p>
                    </div>
                  ) : (
                    ticketMessages.map((m) => {
                      const isMyReply = m.is_admin;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMyReply ? 'items-end' : 'items-start'} space-y-1`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                            <span className="font-semibold text-zinc-400">
                              {isMyReply ? 'You (Admin)' : m.sender_name}
                            </span>
                            <span>•</span>
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div
                            className={`max-w-[80%] px-3.5 py-2 rounded-xl text-xs break-words font-sans leading-relaxed ${
                              isMyReply
                                ? 'bg-purple-600/30 border border-purple-500/40 text-purple-100 rounded-br-none'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Reply Box */}
                <form
                  onSubmit={handleSendAdminMessage}
                  className="p-3 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={adminChatInput}
                    onChange={(e) => setAdminChatInput(e.target.value)}
                    placeholder={
                      chatChannel === 'support'
                        ? 'Type private reply to ticket...'
                        : 'Broadcast message to General feed...'
                    }
                    className="flex-1 px-3.5 py-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 font-sans transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!adminChatInput.trim() || sendingAdminChat}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-mono font-medium flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Send className={`w-3.5 h-3.5 ${sendingAdminChat ? 'animate-pulse' : ''}`} />
                    <span>Send Reply</span>
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* ── MODAL: MANUAL BAN IP ── */}
      {showManualBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-zinc-950 rounded-2xl border border-zinc-800 p-6 sm:p-7 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400" />
              <span>Manually Lockout IP Address</span>
            </h3>

            <form onSubmit={handleManualBanIP} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Target IP Address *</label>
                <input
                  type="text"
                  required
                  value={banIpAddress}
                  onChange={(e) => setBanIpAddress(e.target.value)}
                  placeholder="e.g. 112.204.180.1"
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Reason (Optional)</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Manual Security Override"
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowManualBanModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Banning...' : 'Enforce Ban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: GENERATE GENERATOR LICENSE ── */}
      {showGenLicenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-zinc-950 rounded-2xl border border-zinc-800 p-6 sm:p-7 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Generate License Key</span>
            </h3>

            <form onSubmit={handleGenerateGenLicense} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Scope (Package or Standalone Service)</label>
                <select
                  value={genLicScope}
                  onChange={(e) => setGenLicScope(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                >
                  <option value="All">All Services (Full Access)</option>
                  {packages.length > 0 && (
                    <optgroup label="Packages">
                      {packages.map((pkg: any) => (
                        <option key={`pkg-${pkg.id}`} value={pkg.name}>
                          [Package] {pkg.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {services.length > 0 && (
                    <optgroup label="Standalone Services">
                      {services.map((svc: any) => (
                        <option key={`svc-${svc.id}`} value={svc.name}>
                          {svc.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                  Packages grant all services bound to the package. Standalone grants only that specific service.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Subscription Tier</label>
                <select
                  value={genLicTier}
                  onChange={(e) => setGenLicTier(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                >
                  <option value="lifetime">Lifetime (No expiration, configurable limit)</option>
                  <option value="monthly">Monthly (30 Days - 15 claims/day)</option>
                  <option value="weekly">Weekly (7 Days - 10 claims/day)</option>
                  <option value="daily">Daily (1 Day - 5 claims/day)</option>
                </select>
              </div>

              {genLicTier === 'lifetime' ? (
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                    Custom Daily Limit (Lifetime Only)
                  </label>
                  <input
                    type="number"
                    value={genLicDailyLimit}
                    onChange={(e) => setGenLicDailyLimit(e.target.value)}
                    placeholder="Leave empty or 0 for server default"
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Empty or 0 defaults to the server default limit.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-xs font-mono flex items-center justify-between">
                  <span>Tier Locked Limit:</span>
                  <span className="text-purple-400 font-bold">
                    {genLicTier === 'daily' ? '5 / day' : genLicTier === 'weekly' ? '10 / day' : '15 / day'}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Target Discord User ID (Optional)</label>
                <input
                  type="text"
                  value={genLicUserId}
                  onChange={(e) => setGenLicUserId(e.target.value)}
                  placeholder="Leave empty for unredeemed key"
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Custom License Key (Optional)</label>
                <input
                  type="text"
                  value={genLicKey}
                  onChange={(e) => setGenLicKey(e.target.value)}
                  placeholder="Auto-generated if empty (LIC-XXXX-XXXX-XXXX)"
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowGenLicenseModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: BULK RESTOCK SERVICE STOCK ── */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-950 rounded-2xl border border-zinc-800 p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Bulk Restock Service Accounts</h3>
                  <p className="text-xs text-zinc-400 font-mono">Upload combo .txt / .csv file or paste raw lines</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setRestockService('');
                  setRestockContent('');
                  setRestockFileName('');
                }}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Target Service Module *</label>
                <select
                  required
                  value={restockService}
                  onChange={(e) => setRestockService(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                >
                  <option value="">-- Select Target Service --</option>
                  {services.map((svc: any) => (
                    <option key={svc.id} value={svc.name}>
                      {svc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Upload .txt or .csv File</label>
                <div className="relative border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 rounded-xl p-4 text-center transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleRestockFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Upload className="w-5 h-5 text-zinc-400 mb-1" />
                    <span className="text-xs font-medium text-zinc-200">
                      {restockFileName ? `Selected: ${restockFileName}` : 'Click or drag & drop .txt / .csv combo file'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">1 account combo per line</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase text-zinc-400">Or Paste Raw Account Lines</label>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {restockContent.split(/\r?\n/).filter((l) => l.trim()).length} accounts ready
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={restockContent}
                  onChange={(e) => setRestockContent(e.target.value)}
                  placeholder="Username:Password | Email:Pass&#10;Username:Password | Email:Pass"
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono custom-scrollbar"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowRestockModal(false);
                    setRestockService('');
                    setRestockContent('');
                    setRestockFileName('');
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !restockService || !restockContent.trim()}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Ingesting...</span>
                    </>
                  ) : (
                    <>
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>Restock Service</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT DAILY LIMIT ── */}
      {showEditLimitModal && editingLic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-zinc-950 rounded-2xl border border-zinc-800 p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Edit Daily Limit</h3>
                  <p className="text-xs text-zinc-400 font-mono">{editingLic.license_key}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditLimitModal(false);
                  setEditingLic(null);
                }}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditGenLicense} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Max Daily Generation Limit (Accounts / Day)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={editLimitValue}
                  onChange={(e) => setEditLimitValue(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                  placeholder="15"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditLimitModal(false);
                    setEditingLic(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ASSIGN DECRYPT PLAN ── */}
      {showAssignPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-zinc-950 rounded-2xl border border-zinc-800 p-6 sm:p-7 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Assign VIP Decrypt Subscription</span>
            </h3>

            <form onSubmit={handleAssignPlan} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Target Discord User ID *</label>
                <input
                  type="text"
                  required
                  value={planUserId}
                  onChange={(e) => setPlanUserId(e.target.value)}
                  placeholder="e.g. 719482630633947166"
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Username (Optional)</label>
                <input
                  type="text"
                  value={planUsername}
                  onChange={(e) => setPlanUsername(e.target.value)}
                  placeholder="e.g. Member#0001"
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Plan Tier *</label>
                <select
                  value={planType}
                  onChange={(e: any) => setPlanType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                >
                  <option value="combo">Combo VIP (Full Decrypt + 3D Fix)</option>
                  <option value="dumper">Dumper VIP (Dumper Only)</option>
                  <option value="decrypt">Decrypt VIP (Decrypt Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">Plan Duration *</label>
                <select
                  value={planDuration}
                  onChange={(e: any) => setPlanDuration(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                >
                  <option value="month">Monthly (30 Days Rolling Quota)</option>
                  <option value="lifetime">Lifetime (Permanent Access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAssignPlanModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
