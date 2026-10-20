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
  Package,
  MessageSquare,
  Send,
  Shield,
  Users,
  Clock,
  ExternalLink,
  Laptop,
  CheckCircle,
  AlertTriangle
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
    return <span className="text-zinc-500 font-mono text-xs">{rawId || 'Unknown'}</span>;
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
        className={`font-mono text-xs select-all cursor-pointer transition-colors ${
          hasResolvedName
            ? 'text-purple-300 hover:text-white underline decoration-dotted decoration-purple-500/60 underline-offset-4'
            : 'text-zinc-300'
        }`}
      >
        {rawId}
      </span>

      {onCopy && (
        <button
          onClick={() => onCopy(rawId)}
          className="text-zinc-500 hover:text-zinc-200 transition-colors shrink-0 p-0.5 rounded hover:bg-zinc-800"
          title="Copy Discord ID"
        >
          {copiedKey === rawId ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Floating tooltip */}
      {hovered && tooltipText && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-0 h-0 flex items-center justify-center overflow-visible pointer-events-none z-50">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-purple-500/40 text-zinc-100 text-xs font-sans font-medium whitespace-nowrap shadow-2xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
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

  // Bundle Modal State
  const [showCreateBundleModal, setShowCreateBundleModal] = useState(false);
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [bundleSelectedServices, setBundleSelectedServices] = useState<number[]>([]);

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

    const cacheKey = `async_admin_cache_v4_${ownerUserId}`;

    if (!forceRefresh) {
      try {
        const cachedStr = sessionStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          const hasStockEnriched = cached.data?.services?.some((s: any) => typeof s.stock_count === 'number');
          if (cached.data?.userProfiles && hasStockEnriched && Date.now() - cached.timestamp < 60000) {
            setAdminData(cached.data);
            setDataLoading(false);
            return;
          }
        }
      } catch (e) {}
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (activeDropdownId !== null && !(e.target as HTMLElement).closest('.action-dropdown-container')) {
        setActiveDropdownId(null);
        setDropdownPos(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [activeDropdownId]);

  // ── HANDLERS ──

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

  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleName.trim()) {
      setActionError('Bundle name is required');
      return;
    }
    if (bundleSelectedServices.length === 0) {
      setActionError('Select at least one service to include in the bundle');
      return;
    }

    setActionMessage('');
    setActionError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_package',
          ownerUserId,
          name: bundleName.trim(),
          description: bundleDescription.trim(),
          serviceIds: bundleSelectedServices,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create bundle');

      setActionMessage(json.message);
      setShowCreateBundleModal(false);
      setBundleName('');
      setBundleDescription('');
      setBundleSelectedServices([]);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-xl">
          <Sparkles className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
        <p className="text-xs font-mono text-zinc-400 tracking-widest uppercase">Initializing Admin Console...</p>
      </div>
    );
  }

  // Security Gate: Non-owner access blocked
  if (!user || !isOwner) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 relative font-sans">
        <Navbar />

        <main className="max-w-md mx-auto px-6 py-32 flex flex-col items-center justify-center text-center">
          <div className="bg-zinc-900/90 p-8 sm:p-10 rounded-3xl border border-zinc-800/80 w-full shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6 text-rose-400 shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h1 className="text-2xl font-bold mb-2 text-white tracking-tight">Access Restricted</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mb-8 leading-relaxed">
              This control panel is strictly restricted to authorized system Owners. If you are an Owner, please sign in with your designated Discord account.
            </p>

            {!user ? (
              <DiscordLoginButton size="lg" className="w-full" text="Sign in as Owner" />
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400">
                User ID: <span className="text-zinc-200">{ownerUserId}</span> (Unauthorized)
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
    if (!query) return true;
    const rawId = (id || '').toLowerCase();
    if (rawId.includes(query)) return true;
    const profile = userProfiles[id || ''];
    if (profile) {
      if ((profile.name || '').toLowerCase().includes(query)) return true;
      if ((profile.username || '').toLowerCase().includes(query)) return true;
    }
    return false;
  };

  const filteredLockouts = securityLockouts.filter((l: any) =>
    (l.ip_address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    matchDiscordUser(l.discord_user_id, searchQuery.toLowerCase())
  );

  const filteredGenLicenses = generatorLicenses.filter((lic: any) =>
    (lic.license_key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    matchDiscordUser(lic.redeemed_by, searchQuery.toLowerCase()) ||
    (lic.hwid || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lic.scope_label || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlans = plansList.filter((p: any) =>
    matchDiscordUser(p.user_id, searchQuery.toLowerCase()) ||
    (p.plan_type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDecryptions = decryptionsList.filter((d: any) =>
    matchDiscordUser(d.user_id, searchQuery.toLowerCase()) ||
    (d.script_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.gofile_url || '').toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-purple-900/40 selection:text-white">
      <Navbar />

      {/* Main Wide Canvas: Generous breathing room without clutter */}
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-28 pb-24">

        {/* ── TOP HEADER BAR ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  System Administration
                </h1>
                <span className="text-[11px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 tracking-wider">
                  Owner
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Centralized operations, security enforcement, generator licenses & support desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>

            <button
              onClick={() => fetchAdminData(true)}
              disabled={dataLoading}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
              title="Refresh all metrics"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin text-purple-400' : 'text-zinc-400'}`} />
              <span>Sync Data</span>
            </button>
          </div>
        </div>

        {/* ── NOTIFICATIONS ── */}
        {actionMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-medium">{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage('')} className="text-emerald-400 hover:text-white text-xs">Dismiss</button>
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="font-medium">{actionError}</span>
            </div>
            <button onClick={() => setActionError('')} className="text-rose-400 hover:text-white text-xs">Dismiss</button>
          </div>
        )}

        {/* ── 4 VITAL METRIC CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="bg-zinc-900/60 rounded-3xl p-6 border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">Security Lockouts</span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {activeBannedLockoutsCount}
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                {securityLockouts.length} total logged events
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 rounded-3xl p-6 border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">Generator Services</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {services.length}
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                Active generation modules
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 rounded-3xl p-6 border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">Issued Licenses</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {generatorLicenses.length}
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                Active generator keys
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 rounded-3xl p-6 border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">Asset Telemetry</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileCode className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {decryptionsList.length}
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                Decryptions & mesh fixes
              </p>
            </div>
          </div>
        </div>

        {/* ── NAVIGATION RIBBON & GLOBAL SEARCH ── */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
          {/* Spacious Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shadow-sm">
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Security & Bans</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {activeBannedLockoutsCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('generator');
                fetchAdminData(true);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'generator'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>Generator & Stock</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {generatorLicenses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('decrypt')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'decrypt'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Decrypt & VIP</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {plansList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Audit Trail</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {claimLogs.length + downloadLogs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span>Live Support</span>
            </button>
          </div>

          {/* Search & Tab-Specific Quick Actions */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search User ID, IP, Key..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono transition-colors"
              />
            </div>

            {activeTab === 'security' && (
              <button
                onClick={() => setShowManualBanModal(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-2 transition-all shrink-0"
              >
                <Ban className="w-4 h-4" />
                <span>Ban IP</span>
              </button>
            )}

            {activeTab === 'generator' && (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowCreateBundleModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-xs flex items-center gap-2 transition-all shadow-sm shrink-0"
                >
                  <Package className="w-4 h-4 text-purple-400" />
                  <span>Create a Bundle</span>
                </button>

                <button
                  onClick={() => setShowGenLicenseModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Generate Key</span>
                </button>
              </div>
            )}

            {activeTab === 'decrypt' && (
              <button
                onClick={() => setShowAssignPlanModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Assign VIP</span>
              </button>
            )}
          </div>
        </div>

        {/* ── TAB 1: SECURITY & LOCKOUTS ── */}
        {activeTab === 'security' && (
          <section className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-mono text-xs text-rose-300 font-semibold">
                <Terminal className="w-4 h-4 text-rose-400" />
                <span>SECURITY ENFORCEMENT & IP LOCKOUTS ({filteredLockouts.length})</span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Edge Middleware Enforced</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Visitor IP Address</th>
                    <th className="py-4 px-6">Account / Device</th>
                    <th className="py-4 px-6">Violation Reason</th>
                    <th className="py-4 px-6">Date Detected</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-mono">
                  {dataLoading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-rose-400" />
                        <span>Loading security lockout records...</span>
                      </td>
                    </tr>
                  ) : filteredLockouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-500 font-sans">
                        No active security lockouts found.
                      </td>
                    </tr>
                  ) : (
                    filteredLockouts.map((lockout: any) => {
                      const isBanned = lockout.is_banned;
                      const targetId = lockout.discord_user_id || 'Guest / Unauthenticated';

                      return (
                        <tr key={lockout.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-4 px-6 font-mono font-semibold text-rose-400 select-all">
                            {lockout.ip_address}
                          </td>
                          <td className="py-4 px-6 font-mono text-zinc-300">
                            {targetId.startsWith('dev_') ? (
                              <span className="text-purple-300">{targetId} (Device)</span>
                            ) : targetId.length > 5 ? (
                              <DiscordUserBadge userId={lockout.discord_user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                            ) : (
                              <span className="text-zinc-500">Guest / Unauthenticated</span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-medium text-zinc-200 font-sans">
                            {lockout.reason}
                          </td>
                          <td className="py-4 px-6 font-mono text-zinc-400 text-xs">
                            {new Date(lockout.created_at || Date.now()).toLocaleString()}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-mono font-medium whitespace-nowrap ${
                                isBanned
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {isBanned ? 'LOCKED' : 'RESTORED'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {isBanned ? (
                              <button
                                onClick={() => handleUnbanLockout(lockout.id, lockout.ip_address)}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-medium text-xs flex items-center gap-1.5 ml-auto transition-colors"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Unban IP</span>
                              </button>
                            ) : (
                              <span className="text-emerald-400 font-mono text-xs">Access Active</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── TAB 2: GENERATOR & STOCK ── */}
        {activeTab === 'generator' && (
          <div className="space-y-8">
            {/* Service Stock Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Service Inventory & Stock Levels</span>
                </h3>
                <button
                  onClick={() => fetchAdminData(true)}
                  disabled={dataLoading}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${dataLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Stock</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((svc: any) => {
                  const stockNum = svc.stock_count ?? 0;
                  const inStock = stockNum > 0;
                  return (
                    <div key={svc.id} className="bg-zinc-900/60 rounded-3xl p-5 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-white text-base tracking-wide flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                            {svc.name}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-400 font-mono text-[11px]">
                            ID: {svc.id}
                          </span>
                        </div>

                        <div className="my-4 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Current Stock</div>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className={`text-2xl font-black font-mono tracking-tight ${inStock ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {stockNum.toLocaleString()}
                              </span>
                              <span className="text-[11px] text-zinc-500 font-medium font-mono">accounts</span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border ${
                            inStock 
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}>
                            {inStock ? 'AVAILABLE' : 'OUT OF STOCK'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                        <span className="text-xs text-zinc-500 font-mono">Stock Module</span>
                        <button
                          onClick={() => {
                            setRestockService(svc.name);
                            setShowRestockModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-200 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-purple-400" />
                          <span>Restock</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Packages / Bundles */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-400" />
                  <span>Configured Packages & Bundles ({packages.length})</span>
                </h3>
                <button
                  onClick={() => setShowCreateBundleModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Create a Bundle</span>
                </button>
              </div>

              {packages.length === 0 ? (
                <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/60 text-center">
                  <Package className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 mb-3">No bundled service packages created yet.</p>
                  <button
                    onClick={() => setShowCreateBundleModal(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create Your First Bundle</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.map((pkg: any) => (
                    <div key={pkg.id} className="bg-zinc-900/60 rounded-3xl p-5 border border-zinc-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-base tracking-wide flex items-center gap-2">
                          <Package className="w-4 h-4 text-purple-400" />
                          <span>{pkg.name}</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-[10px]">
                          BUNDLE
                        </span>
                      </div>

                      {pkg.description && (
                        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">{pkg.description}</p>
                      )}

                      <div className="pt-3 border-t border-zinc-800/80">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-2">Included Services:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {pkg.services?.map((sName: string, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-mono text-[11px]">
                              {sName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generator License Keys Table */}
            <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-mono text-xs text-amber-300 font-semibold">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>ACTIVE GENERATOR LICENSES ({filteredGenLicenses.length})</span>
                </div>
                <span className="text-xs text-zinc-500 font-mono">10 licenses per view &bull; scroll for more</span>
              </div>

              <div className="overflow-x-auto max-h-[580px] overflow-y-auto custom-scrollbar relative">
                <table className="w-full min-w-[1100px] text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/80 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      <th className="py-4 px-6">License Key</th>
                      <th className="py-4 px-6">Scope</th>
                      <th className="py-4 px-6">Tier</th>
                      <th className="py-4 px-6">Redeemed By</th>
                      <th className="py-4 px-6">Hardware ID</th>
                      <th className="py-4 px-6">Daily Usage</th>
                      <th className="py-4 px-6">Created</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 font-mono">
                    {filteredGenLicenses.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-16 text-center text-zinc-500 font-sans">
                          No generator licenses found matching search.
                        </td>
                      </tr>
                    ) : (
                      filteredGenLicenses.map((lic: any) => (
                        <tr key={lic.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-4 px-6 font-mono font-semibold text-zinc-200 select-all whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <span>{lic.license_key}</span>
                              <button onClick={() => copyToClipboard(lic.license_key)} className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800">
                                {copiedKey === lic.license_key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono whitespace-nowrap">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-mono ${
                                lic.scope_label?.startsWith('[Package]')
                                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                  : lic.scope_label === 'All Services'
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {lic.scope_label || 'All Services'}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono uppercase text-xs whitespace-nowrap text-zinc-400">
                            {lic.tier || 'lifetime'}
                          </td>
                          <td className="py-4 px-6 font-mono whitespace-nowrap min-w-[180px]">
                            {lic.redeemed_by ? (
                              <DiscordUserBadge userId={lic.redeemed_by} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                            ) : (
                              <span className="text-zinc-500 font-mono text-xs">UNREDEEMED</span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono whitespace-nowrap">
                            {lic.hwid ? (
                              <div className="inline-flex items-center gap-2">
                                <span className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 rounded font-mono truncate max-w-[150px]">
                                  {lic.hwid}
                                </span>
                                <button
                                  onClick={() => handleResetGenHwid(lic)}
                                  className="p-1 rounded hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 transition-colors"
                                  title="Reset / Unbind HWID"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                                UNBOUND
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono whitespace-nowrap">
                            <span className={`font-semibold ${ (lic.used_today || 0) >= (lic.effective_limit ?? lic.daily_limit ?? 15) ? 'text-rose-400' : 'text-zinc-200' }`}>
                              {lic.used_today || 0} / {lic.effective_limit ?? lic.daily_limit ?? 15}
                            </span>
                            <span className="text-zinc-500 text-[11px] ml-1.5">used</span>
                          </td>
                          <td className="py-4 px-6 font-mono text-zinc-400 text-xs whitespace-nowrap">
                            {new Date(lic.created_at || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium ${lic.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                              {lic.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap action-dropdown-container">
                            <div className="relative inline-block text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
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
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors"
                              >
                                <span>Options</span>
                                <MoreVertical className="w-3.5 h-3.5 text-zinc-400" />
                              </button>

                              {activeDropdownId === lic.id && dropdownPos && (
                                <div
                                  style={{ top: `${dropdownPos.top}px`, right: `${dropdownPos.right}px` }}
                                  className="fixed z-50 w-52 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 text-xs font-sans animate-in fade-in zoom-in-95"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      setEditingLic(lic);
                                      setEditLimitValue(String(lic.effective_limit ?? lic.daily_limit ?? 15));
                                      setShowEditLimitModal(true);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                                    <span>Edit Daily Limit</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      handleResetGenUsage(lic);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2.5 transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Reset Daily Usage</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      handleResetGenHwid(lic);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Unlock className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Reset HWID Binding</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      handleToggleGenLicense(lic.id, lic.is_active);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>{lic.is_active ? 'Disable License' : 'Enable License'}</span>
                                  </button>

                                  <div className="h-px bg-zinc-800 my-1" />

                                  <button
                                    onClick={() => {
                                      handleDeleteGenLicense(lic);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-rose-500/10 text-rose-400 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Key</span>
                                  </button>
                                </div>
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
        )}

        {/* ── TAB 3: DECRYPT & VIP PLANS ── */}
        {activeTab === 'decrypt' && (
          <div className="space-y-8">
            {/* VIP Plans Table */}
            <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-mono text-xs text-purple-300 font-semibold">
                  <Crown className="w-4 h-4 text-purple-400" />
                  <span>ACTIVE DECRYPT & DUMPER VIP ENROLLED ({filteredPlans.length})</span>
                </div>
                <span className="text-xs text-zinc-500 font-mono">Managed via Bot & Web</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      <th className="py-4 px-6">User ID</th>
                      <th className="py-4 px-6">Username</th>
                      <th className="py-4 px-6">Plan Type</th>
                      <th className="py-4 px-6">Expires At</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 font-mono">
                    {filteredPlans.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-zinc-500 font-sans">
                          No VIP plans found matching search.
                        </td>
                      </tr>
                    ) : (
                      filteredPlans.map((plan: any) => (
                        <tr key={plan.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-4 px-6 font-mono font-semibold text-zinc-200">
                            <DiscordUserBadge userId={plan.user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                          </td>
                          <td className="py-4 px-6 font-medium text-zinc-200 font-sans">
                            {plan.username || 'User'}
                          </td>
                          <td className="py-4 px-6 font-mono uppercase text-xs">
                            <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                              {plan.plan_type}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono text-zinc-400 text-xs">
                            {plan.expires_at ? new Date(plan.expires_at).toLocaleDateString() : 'LIFETIME'}
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              ACTIVE
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Decryptions Log */}
            <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-mono text-xs text-emerald-300 font-semibold">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>RECENT DECRYPTED SCRIPTS & ASSETS ({filteredDecryptions.length})</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Script / Asset Name</th>
                      <th className="py-4 px-6">User ID</th>
                      <th className="py-4 px-6">Date Processed</th>
                      <th className="py-4 px-6 text-right">Host Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 font-mono">
                    {filteredDecryptions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-16 text-center text-zinc-500 font-sans">
                          No recent script decryptions recorded.
                        </td>
                      </tr>
                    ) : (
                      filteredDecryptions.map((d: any) => (
                        <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-4 px-6 font-medium text-white font-sans">
                            {d.script_name || 'Decrypted Archive'}
                          </td>
                          <td className="py-4 px-6 font-mono text-zinc-300">
                            <DiscordUserBadge userId={d.user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                          </td>
                          <td className="py-4 px-6 font-mono text-zinc-400 text-xs">
                            {new Date(d.created_at || Date.now()).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {d.gofile_url ? (
                              <a
                                href={d.gofile_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-purple-300 hover:text-white transition-colors"
                              >
                                <span>GoFile</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-zinc-600">Expired</span>
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

        {/* ── TAB 4: AUDIT TRAIL ── */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 w-fit">
              <button
                onClick={() => setAuditSubTab('claims')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${auditSubTab === 'claims' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Generator Claims ({claimLogs.length})
              </button>
              <button
                onClick={() => setAuditSubTab('downloads')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${auditSubTab === 'downloads' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                App Downloads ({downloadLogs.length})
              </button>
            </div>

            {auditSubTab === 'claims' ? (
              <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 font-mono text-xs text-blue-300 font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>LIVE GENERATION CLAIMS LOG</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Service</th>
                        <th className="py-4 px-6">User ID</th>
                        <th className="py-4 px-6">Source</th>
                        <th className="py-4 px-6">Claim Timestamp</th>
                        <th className="py-4 px-6 text-right">Raw Output</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 font-mono">
                      {filteredClaimLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center text-zinc-500 font-sans">
                            No claim logs found.
                          </td>
                        </tr>
                      ) : (
                        filteredClaimLogs.map((c: any) => (
                          <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-4 px-6 font-semibold text-white">
                              {c.service_name}
                            </td>
                            <td className="py-4 px-6">
                              <DiscordUserBadge userId={c.discord_user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                            </td>
                            <td className="py-4 px-6 uppercase text-[11px] text-zinc-400">
                              {c.source || 'Web'}
                            </td>
                            <td className="py-4 px-6 text-zinc-400 text-xs">
                              {new Date(c.created_at || Date.now()).toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => copyToClipboard(c.raw_data)}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
                              >
                                {copiedKey === c.raw_data ? 'Copied' : 'Copy Output'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 font-mono text-xs text-blue-300 font-semibold flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>DESKTOP CLIENT DOWNLOAD HISTORY</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                        <th className="py-4 px-6">User ID</th>
                        <th className="py-4 px-6">License Key</th>
                        <th className="py-4 px-6">IP Address</th>
                        <th className="py-4 px-6">Date Downloaded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 font-mono">
                      {filteredDownloadLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-16 text-center text-zinc-500 font-sans">
                            No download logs recorded.
                          </td>
                        </tr>
                      ) : (
                        filteredDownloadLogs.map((d: any) => (
                          <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-4 px-6">
                              <DiscordUserBadge userId={d.discord_user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                            </td>
                            <td className="py-4 px-6 font-semibold text-zinc-300">
                              {d.license_key || 'Direct Auth'}
                            </td>
                            <td className="py-4 px-6 text-zinc-400">
                              {d.ip_address || '127.0.0.1'}
                            </td>
                            <td className="py-4 px-6 text-zinc-400 text-xs">
                              {new Date(d.downloaded_at || Date.now()).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: LIVE SUPPORT CHAT ── */}
        {activeTab === 'chat' && (
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-sm flex flex-col md:flex-row h-[750px]">
            {/* Left Ticket Navigation Panel */}
            <div className="w-full md:w-80 border-r border-zinc-800/80 flex flex-col bg-zinc-950/40">
              <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChatChannel('support')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chatChannel === 'support' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Tickets ({chatTickets.length})
                  </button>
                  <button
                    onClick={() => setChatChannel('general')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chatChannel === 'general' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    General
                  </button>
                </div>
              </div>

              {chatChannel === 'support' ? (
                <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
                  {chatTickets.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      No support tickets open.
                    </div>
                  ) : (
                    chatTickets.map((t) => (
                      <div
                        key={t.ticket_id}
                        onClick={() => setSelectedTicketId(t.ticket_id)}
                        className={`p-4 cursor-pointer transition-colors ${selectedTicketId === t.ticket_id ? 'bg-purple-950/20 border-l-2 border-purple-500' : 'hover:bg-zinc-900/40'}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-white text-xs truncate max-w-[150px]">
                            {t.sender_name || 'Member'}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(t.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate">{t.last_message}</p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-zinc-500">
                  Viewing Public General Chat feed.
                </div>
              )}
            </div>

            {/* Right Chat Message Pane */}
            <div className="flex-1 flex flex-col bg-zinc-900/20">
              <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/30 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {chatChannel === 'support' ? `Ticket: ${selectedTicketId || 'Select a ticket'}` : 'General Public Chat'}
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-mono">Real-time WebSocket active</p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {ticketMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                    No messages in this channel yet.
                  </div>
                ) : (
                  ticketMessages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${msg.is_admin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-zinc-400">
                          {msg.sender_name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-600">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.is_admin
                            ? 'bg-purple-600 text-white rounded-tr-none'
                            : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700/60'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendAdminMessage} className="p-4 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center gap-3">
                <input
                  type="text"
                  value={adminChatInput}
                  onChange={(e) => setAdminChatInput(e.target.value)}
                  placeholder={chatChannel === 'support' ? 'Type response to user...' : 'Post announcement to general...'}
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />
                <button
                  type="submit"
                  disabled={sendingAdminChat || !adminChatInput.trim()}
                  className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* ── MODAL 1: MANUAL IP BAN ── */}
      {showManualBanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400" />
                <span>Issue Manual IP Ban</span>
              </h3>
              <button onClick={() => setShowManualBanModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualBanIP} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Target IP Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 112.204.180.1"
                  value={banIpAddress}
                  onChange={(e) => setBanIpAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Reason for Ban</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malicious inspection / abuse"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualBanModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  <span>Enforce Ban</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: GENERATE GENERATOR LICENSE ── */}
      {showGenLicenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <span>Issue Generator License Key</span>
              </h3>
              <button onClick={() => setShowGenLicenseModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateGenLicense} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Scope (Allowed Services)</label>
                <select
                  value={genLicScope}
                  onChange={(e) => setGenLicScope(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="All">All Services (Full Access)</option>
                  {packages.map((pkg: any) => (
                    <option key={pkg.id} value={`pkg_${pkg.id}`}>
                      Package: {pkg.name}
                    </option>
                  ))}
                  {services.map((svc: any) => (
                    <option key={svc.id} value={svc.name}>
                      Single: {svc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Tier / Duration</label>
                <select
                  value={genLicTier}
                  onChange={(e) => setGenLicTier(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="lifetime">Lifetime</option>
                  <option value="monthly">Monthly (30 Days)</option>
                  <option value="weekly">Weekly (7 Days)</option>
                  <option value="daily">Daily (24 Hours)</option>
                </select>
              </div>

              {genLicTier === 'lifetime' && (
                <div>
                  <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Custom Daily Generation Limit (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Defaults to 15 if empty"
                    value={genLicDailyLimit}
                    onChange={(e) => setGenLicDailyLimit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Pre-Assign to User ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Discord Snowflake ID (e.g. 719482630633947166)"
                  value={genLicUserId}
                  onChange={(e) => setGenLicUserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Custom Key String (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if left blank"
                  value={genLicKey}
                  onChange={(e) => setGenLicKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenLicenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  <span>Generate Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: RESTOCK STOCK ── */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                <span>Restock Service Inventory</span>
              </h3>
              <button onClick={() => setShowRestockModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Select Service</label>
                <select
                  required
                  value={restockService}
                  onChange={(e) => setRestockService(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Choose a service...</option>
                  {services.map((svc: any) => (
                    <option key={svc.id} value={svc.name}>
                      {svc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Upload Stock .txt File</label>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleRestockFileUpload}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
                />
                {restockFileName && (
                  <p className="text-[11px] text-purple-400 font-mono mt-1">Loaded: {restockFileName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Or Paste Stock Lines (One account per line)</label>
                <textarea
                  required
                  rows={6}
                  placeholder={`user:pass\nuser2:pass2`}
                  value={restockContent}
                  onChange={(e) => setRestockContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload & Restock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: EDIT DAILY LIMIT ── */}
      {showEditLimitModal && editingLic && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-400" />
                <span>Adjust Daily Limit</span>
              </h3>
              <button onClick={() => setShowEditLimitModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditGenLicense} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">License Key</label>
                <p className="text-xs font-mono text-zinc-200 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 truncate">
                  {editingLic.license_key}
                </p>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Max Generations Per Day</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editLimitValue}
                  onChange={(e) => setEditLimitValue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditLimitModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Limit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: ASSIGN VIP PLAN ── */}
      {showAssignPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-400" />
                <span>Assign VIP Plan Access</span>
              </h3>
              <button onClick={() => setShowAssignPlanModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignPlan} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">User Discord ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 719482630633947166"
                  value={planUserId}
                  onChange={(e) => setPlanUserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Username (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Nicolas"
                  value={planUsername}
                  onChange={(e) => setPlanUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Plan Type</label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="combo">Combo (Decrypt + Dumper)</option>
                  <option value="decrypt">Lua Script Decryptor Only</option>
                  <option value="dumper">Asset Dumper Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Plan Duration</label>
                <select
                  value={planDuration}
                  onChange={(e) => setPlanDuration(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="month">1 Month (30 Days)</option>
                  <option value="lifetime">Lifetime Access</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignPlanModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Assign Access</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 6: CREATE BUNDLE ── */}
      {showCreateBundleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                <span>Create Service Bundle / Package</span>
              </h3>
              <button
                onClick={() => {
                  setShowCreateBundleModal(false);
                  setBundleName('');
                  setBundleDescription('');
                  setBundleSelectedServices([]);
                }}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBundle} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Bundle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Access Pass, Gaming Bundle"
                  value={bundleName}
                  onChange={(e) => setBundleName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Includes Rockstar, Steam, and Discord generator access"
                  value={bundleDescription}
                  onChange={(e) => setBundleDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-2">
                  Select Included Services ({bundleSelectedServices.length} selected)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
                  {services.length === 0 ? (
                    <div className="text-xs text-zinc-500 py-2">No services found</div>
                  ) : (
                    services.map((svc: any) => {
                      const isSelected = bundleSelectedServices.includes(svc.id);
                      return (
                        <label
                          key={svc.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                              : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBundleSelectedServices([...bundleSelectedServices, svc.id]);
                                } else {
                                  setBundleSelectedServices(bundleSelectedServices.filter((id) => id !== svc.id));
                                }
                              }}
                              className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 bg-zinc-800 cursor-pointer"
                            />
                            <span className="font-semibold text-xs text-white">{svc.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {svc.stock_count ?? 0} in stock
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateBundleModal(false);
                    setBundleName('');
                    setBundleDescription('');
                    setBundleSelectedServices([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !bundleName.trim() || bundleSelectedServices.length === 0}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Bundle</span>
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
