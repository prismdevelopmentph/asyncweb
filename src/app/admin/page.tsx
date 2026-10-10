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
  X
} from 'lucide-react';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Tabs & Modals
  const [activeTab, setActiveTab] = useState<'security' | 'generator' | 'decrypt'>('security');
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
  const [genLicDailyLimit, setGenLicDailyLimit] = useState('15');

  // Dropdown & Edit Limit Modal State
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const [showEditLimitModal, setShowEditLimitModal] = useState(false);
  const [editingLic, setEditingLic] = useState<any>(null);
  const [editLimitValue, setEditLimitValue] = useState('15');

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

    const cacheKey = `async_admin_cache_${ownerUserId}`;

    // Check sessionStorage cache first if not forcing refresh
    if (!forceRefresh) {
      try {
        const cachedStr = sessionStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
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
          dailyLimit: genLicDailyLimit,
          licenseKey: genLicKey.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate key');

      setActionMessage(`Generator License Created: ${json.license?.license_key}`);
      setShowGenLicenseModal(false);
      setGenLicUserId('');
      setGenLicKey('');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06040b] text-purple-100 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mb-4 animate-spin">
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
        <p className="text-xs font-mono text-purple-300 tracking-wider">INITIALIZING ADMIN CONSOLE...</p>
      </div>
    );
  }

  // Security Gate: Non-owner access blocked
  if (!user || !isOwner) {
    return (
      <div className="min-h-screen bg-[#06040b] text-[#f4f0ff] relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-purple-200">
        <Navbar />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none z-0 animate-grid-pulse" />
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-rose-600/15 blur-[140px] pointer-events-none z-0 animate-orb-slow" />

        <main className="relative z-10 max-w-lg mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <div className="glass-ultra p-8 sm:p-10 rounded-3xl border border-rose-500/30 w-full shadow-[0_0_50px_rgba(244,63,94,0.15)]">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-400/40 flex items-center justify-center mx-auto mb-6 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.25)]">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-black mb-2 text-white">Access Restricted</h1>
            <p className="text-sm text-purple-300/70 mb-8 leading-relaxed">
              This control panel is strictly restricted to authorized system Owners. If you are an Owner, please sign in with your designated Discord account.
            </p>

            {!user ? (
              <DiscordLoginButton size="lg" className="w-full" text="Sign in as Owner" />
            ) : (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-rose-500/30 text-xs font-mono text-purple-300">
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
  const plansList = adminData?.plans || [];
  const decryptionsList = adminData?.decryptions || [];
  const fixesList = adminData?.fixes || [];

  // Filtered Lists
  const filteredLockouts = securityLockouts.filter((l: any) =>
    (l.ip_address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.discord_user_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.reason || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGenLicenses = generatorLicenses.filter((l: any) =>
    (l.license_key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.redeemed_by || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDecryptions = decryptionsList.filter((d: any) =>
    (d.user_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.file_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFixes = fixesList.filter((f: any) =>
    (f.user_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.file_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeBannedLockoutsCount = securityLockouts.filter((l: any) => l.is_banned).length;

  return (
    <div className="min-h-screen bg-[#06040b] text-[#f4f0ff] relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Background Depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none z-0 animate-grid-pulse" />
      <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[140px] pointer-events-none z-0 animate-orb-slow" />
      <div className="absolute top-1/3 -right-32 w-[550px] h-[550px] rounded-full bg-red-600/10 blur-[130px] pointer-events-none z-0 animate-orb-reverse" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        
        {/* Top Header Ribbon */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 glass-ultra rounded-2xl p-5 border border-white/[0.08] shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/20 to-purple-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  System Administration Console
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 tracking-wider">
                  OWNER CONTROL
                </span>
              </div>
              <p className="text-xs text-purple-300/60 font-medium">
                Manage Security Lockouts, Generator Stock & Licenses, and Asset Recovery Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-xl glass-ultra border border-white/[0.08] text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-2 glass-spring-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <button
              onClick={() => fetchAdminData(true)}
              disabled={dataLoading}
              className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-purple-300 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* FEEDBACK NOTIFICATIONS */}
        {actionMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionMessage}</span>
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-medium">{actionError}</span>
          </div>
        )}

        {/* SYSTEM STATS COUNTERS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-ultra rounded-3xl p-5 border border-red-500/30 shadow-lg relative overflow-hidden group hover:border-red-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-semibold text-red-300/80 tracking-wider">Active Banned Lockouts</span>
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-400 font-mono">
              {activeBannedLockoutsCount}
            </div>
            <span className="text-[11px] text-purple-300/60 block mt-1">Total logged: {securityLockouts.length}</span>
          </div>

          <div className="glass-ultra rounded-3xl p-5 border border-purple-500/30 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-semibold text-purple-300/80 tracking-wider">Generator Services</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {services.length}
            </div>
            <span className="text-[11px] text-purple-300/60 block mt-1">Active generator modules</span>
          </div>

          <div className="glass-ultra rounded-3xl p-5 border border-amber-500/30 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-semibold text-amber-300/80 tracking-wider">Generator License Keys</span>
              <Key className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
              {generatorLicenses.length}
            </div>
            <span className="text-[11px] text-amber-400/60 block mt-1">Active & issued keys</span>
          </div>

          <div className="glass-ultra rounded-3xl p-5 border border-emerald-500/30 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-semibold text-emerald-300/80 tracking-wider">Total Decryptions</span>
              <FileCode className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {decryptionsList.length}
            </div>
            <span className="text-[11px] text-emerald-400/60 block mt-1">Processed assets</span>
          </div>
        </div>

        {/* TABS & ACTION BUTTONS */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto">
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 glass-spring-btn whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-red-600/40 border border-red-500/40 text-white shadow-md'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Security & DevTools Lockouts ({activeBannedLockoutsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 glass-spring-btn whitespace-nowrap ${
                activeTab === 'generator'
                  ? 'bg-purple-600/40 border border-purple-500/40 text-white shadow-md'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>Generator & Stock ({services.length} Services)</span>
            </button>

            <button
              onClick={() => setActiveTab('decrypt')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 glass-spring-btn whitespace-nowrap ${
                activeTab === 'decrypt'
                  ? 'bg-emerald-600/40 border border-emerald-500/40 text-white shadow-md'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Decrypt & Telemetry ({decryptionsList.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search IP, User ID, Key..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {activeTab === 'security' && (
              <button
                onClick={() => setShowManualBanModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all glass-spring-btn whitespace-nowrap"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Ban IP</span>
              </button>
            )}

            {activeTab === 'generator' && (
              <button
                onClick={() => setShowGenLicenseModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all glass-spring-btn whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Gen License Key</span>
              </button>
            )}

            {activeTab === 'decrypt' && (
              <button
                onClick={() => setShowAssignPlanModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all glass-spring-btn whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Assign VIP Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* ── TAB 1: SECURITY & DEVTOOLS LOCKOUTS ── */}
        {activeTab === 'security' && (
          <section className="space-y-4">
            <div className="glass-ultra rounded-3xl border border-red-500/30 overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/[0.06] bg-red-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-red-300 font-bold">
                  <Terminal className="w-4 h-4 text-red-400" />
                  <span>ACTIVE SECURITY AUDIT & LOCKOUT LIST ({filteredLockouts.length})</span>
                </div>
                <span className="text-[10px] text-purple-300/60 font-mono">Edge Middleware Enforced</span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-purple-300/70 uppercase tracking-wider font-mono">
                      <th className="py-3.5 px-4">Visitor IP Address</th>
                      <th className="py-3.5 px-4">Linked Account / Device</th>
                      <th className="py-3.5 px-4">Detection Reason</th>
                      <th className="py-3.5 px-4">Timestamp (UTC)</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Web Unban Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-purple-300">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-red-400" />
                          <span>Loading security lockout records...</span>
                        </td>
                      </tr>
                    ) : filteredLockouts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-purple-300/50 font-mono">
                          No active security lockouts found.
                        </td>
                      </tr>
                    ) : (
                      filteredLockouts.map((lockout: any) => {
                        const isBanned = lockout.is_banned;
                        const targetId = lockout.discord_user_id || 'Guest / Unauthenticated';

                        return (
                          <tr key={lockout.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-red-400 select-all">
                              {lockout.ip_address}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-purple-200">
                              {targetId.startsWith('dev_') ? (
                                <span className="text-purple-300 font-semibold">{targetId} (Device)</span>
                              ) : targetId.length > 5 ? (
                                <span className="text-indigo-300 font-semibold">{targetId}</span>
                              ) : (
                                <span className="text-purple-300/60">Guest / Unauthenticated</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-white">
                              {lockout.reason}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-purple-300/80 text-[11px]">
                              {new Date(lockout.created_at || Date.now()).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                                  isBanned
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {isBanned ? 'PERMANENTLY LOCKED' : 'RESTORED'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {isBanned ? (
                                <button
                                  onClick={() => handleUnbanLockout(lockout.id, lockout.ip_address)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 ml-auto glass-spring-btn"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>Unban Access</span>
                                </button>
                              ) : (
                                <span className="text-emerald-400 font-mono text-[11px] font-semibold">Access Active</span>
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
          <section className="space-y-8">
            {/* Services Stock Overview */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Service Stock Status Overview</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((svc: any) => (
                  <div key={svc.id} className="glass-ultra rounded-3xl p-5 border border-purple-500/20 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-base tracking-wide">{svc.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold uppercase">
                        ID: {svc.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono text-xs pt-2 border-t border-white/[0.06]">
                      <span className="text-purple-300/60">Status:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold">
                        ACTIVE MODULE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generator License Keys Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Generator License Keys ({filteredGenLicenses.length})</span>
              </h3>

              <div className="glass-ultra rounded-3xl border border-amber-500/30 overflow-hidden shadow-xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-purple-300/70 uppercase tracking-wider font-mono">
                        <th className="py-3.5 px-4">License Key</th>
                        <th className="py-3.5 px-4">Redeemed By (User ID)</th>
                        <th className="py-3.5 px-4">Daily Limit</th>
                        <th className="py-3.5 px-4">Created At</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredGenLicenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-purple-300/50 font-mono">
                            No generator licenses found.
                          </td>
                        </tr>
                      ) : (
                        filteredGenLicenses.map((lic: any) => (
                          <tr key={lic.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-amber-300 select-all">
                              <div className="inline-flex items-center gap-2">
                                <span>{lic.license_key}</span>
                                <button onClick={() => copyToClipboard(lic.license_key)} className="text-amber-400 hover:text-white">
                                  {copiedKey === lic.license_key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-purple-200">
                              {lic.redeemed_by ? (
                                <span className="text-emerald-300 font-semibold">{lic.redeemed_by}</span>
                              ) : (
                                <span className="text-purple-300/50">UNREDEEMED</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-purple-300">
                              {lic.daily_limit || 15} accounts/day
                            </td>
                            <td className="py-3.5 px-4 font-mono text-purple-300/70 text-[11px]">
                              {new Date(lic.created_at || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lic.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                                {lic.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right relative">
                              <div className="inline-block text-left">
                                <button
                                  onClick={() => setActiveDropdownId(activeDropdownId === lic.id ? null : lic.id)}
                                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-purple-200 text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all"
                                >
                                  <span>Actions</span>
                                  <MoreVertical className="w-3.5 h-3.5 text-purple-400" />
                                </button>

                                {activeDropdownId === lic.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-20"
                                      onClick={() => setActiveDropdownId(null)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0f0a1c] border border-purple-500/30 shadow-2xl z-30 py-1.5 divide-y divide-white/[0.06] text-xs font-medium text-purple-200 animate-in fade-in zoom-in-95">
                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            setActiveDropdownId(null);
                                            handleToggleGenLicense(lic.id, lic.is_active);
                                          }}
                                          className="w-full text-left px-3.5 py-2 hover:bg-white/[0.06] flex items-center gap-2 text-purple-200"
                                        >
                                          <Ban className="w-3.5 h-3.5 text-amber-400" />
                                          <span>{lic.is_active ? 'Disable License' : 'Enable License'}</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setActiveDropdownId(null);
                                            setEditingLic(lic);
                                            setEditLimitValue(String(lic.daily_limit || 15));
                                            setShowEditLimitModal(true);
                                          }}
                                          className="w-full text-left px-3.5 py-2 hover:bg-white/[0.06] flex items-center gap-2 text-purple-200"
                                        >
                                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                                          <span>Edit Daily Limit</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setActiveDropdownId(null);
                                            handleResetGenUsage(lic);
                                          }}
                                          className="w-full text-left px-3.5 py-2 hover:bg-white/[0.06] flex items-center gap-2 text-purple-200"
                                        >
                                          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                                          <span>Reset Generation</span>
                                        </button>
                                      </div>

                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            setActiveDropdownId(null);
                                            handleDeleteGenLicense(lic);
                                          }}
                                          className="w-full text-left px-3.5 py-2 hover:bg-red-500/10 text-red-400 flex items-center gap-2 font-bold"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
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
          <section className="space-y-8">
            {/* Decryption Telemetry */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Resource Decryptions Audit ({filteredDecryptions.length})</span>
              </h3>

              <div className="glass-ultra rounded-3xl border border-white/[0.08] overflow-hidden shadow-xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-purple-300/70 uppercase tracking-wider font-mono">
                        <th className="py-3.5 px-4">Timestamp</th>
                        <th className="py-3.5 px-4">User ID</th>
                        <th className="py-3.5 px-4">Resource File</th>
                        <th className="py-3.5 px-4">Key / Mode</th>
                        <th className="py-3.5 px-4">Extracted</th>
                        <th className="py-3.5 px-4 text-right">Download Output</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredDecryptions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-purple-300/50 font-mono">
                            No decryptions logged yet.
                          </td>
                        </tr>
                      ) : (
                        filteredDecryptions.map((d: any) => (
                          <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-mono text-purple-300/60">
                              {new Date(d.created_at).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-purple-200 select-all">
                              {d.user_id}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-white">
                              {d.file_name}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-purple-300">
                              {d.key_type || 'Auto'}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                              {d.decrypted ?? 0} files
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {d.download_url ? (
                                <a
                                  href={d.download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold glass-spring-btn"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                              ) : (
                                <span className="text-neutral-500 text-[11px]">N/A</span>
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

      </main>

      {/* ── MODAL: MANUAL BAN IP ── */}
      {showManualBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-md glass-ultra rounded-3xl border border-red-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.25)] space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Ban className="w-5 h-5 text-red-400" />
              <span>Manually Lockout IP Address</span>
            </h3>

            <form onSubmit={handleManualBanIP} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Target IP Address *</label>
                <input
                  type="text"
                  required
                  value={banIpAddress}
                  onChange={(e) => setBanIpAddress(e.target.value)}
                  placeholder="e.g. 112.204.180.1"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-red-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Manual Security Override"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-red-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowManualBanModal(false)}
                  className="px-4 py-2 rounded-xl glass-ultra text-purple-300/70 text-xs font-semibold hover:text-white glass-spring-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50 glass-spring-btn"
                >
                  {submitting ? 'Banning...' : 'Enforce IP Ban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: GENERATE GENERATOR LICENSE ── */}
      {showGenLicenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-md glass-ultra rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Key className="w-5 h-5 text-amber-400" />
              <span>Generate Generator License Key</span>
            </h3>

            <form onSubmit={handleGenerateGenLicense} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Target Discord User ID (Optional)</label>
                <input
                  type="text"
                  value={genLicUserId}
                  onChange={(e) => setGenLicUserId(e.target.value)}
                  placeholder="Leave empty for unredeemed key"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Custom License Key (Optional)</label>
                <input
                  type="text"
                  value={genLicKey}
                  onChange={(e) => setGenLicKey(e.target.value)}
                  placeholder="Auto-generated if empty (LIC-XXXX-XXXX)"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Daily Claim Limit (Accounts / Day)</label>
                <input
                  type="number"
                  value={genLicDailyLimit}
                  onChange={(e) => setGenLicDailyLimit(e.target.value)}
                  placeholder="15"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowGenLicenseModal(false)}
                  className="px-4 py-2 rounded-xl glass-ultra text-purple-300/70 text-xs font-semibold hover:text-white glass-spring-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50 glass-spring-btn"
                >
                  {submitting ? 'Creating...' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT DAILY LIMIT ── */}
      {showEditLimitModal && editingLic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-md glass-ultra rounded-3xl border border-blue-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(59,130,246,0.25)] space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Edit Daily Limit</h3>
                  <p className="text-xs text-purple-300/60 font-mono">{editingLic.license_key}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditLimitModal(false);
                  setEditingLic(null);
                }}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-purple-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditGenLicense} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Max Daily Generation Limit (Accounts / Day)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={editLimitValue}
                  onChange={(e) => setEditLimitValue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-blue-400 font-mono"
                  placeholder="15"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditLimitModal(false);
                    setEditingLic(null);
                  }}
                  className="px-4 py-2 rounded-xl glass-ultra text-purple-300/70 text-xs font-semibold hover:text-white glass-spring-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 glass-spring-btn"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-md glass-ultra rounded-3xl border border-emerald-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(16,185,129,0.25)] space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <span>Assign VIP Decrypt Subscription</span>
            </h3>

            <form onSubmit={handleAssignPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Target Discord User ID *</label>
                <input
                  type="text"
                  required
                  value={planUserId}
                  onChange={(e) => setPlanUserId(e.target.value)}
                  placeholder="e.g. 719482630633947166"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Username (Optional)</label>
                <input
                  type="text"
                  value={planUsername}
                  onChange={(e) => setPlanUsername(e.target.value)}
                  placeholder="e.g. Member#0001"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Plan Tier *</label>
                <select
                  value={planType}
                  onChange={(e: any) => setPlanType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#120b22] border border-white/[0.08] text-xs text-purple-100 focus:outline-none focus:border-emerald-400"
                >
                  <option value="combo">Combo VIP (Full Decrypt + 3D Fix)</option>
                  <option value="dumper">Dumper VIP (Dumper Only)</option>
                  <option value="decrypt">Decrypt VIP (Decrypt Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Plan Duration *</label>
                <select
                  value={planDuration}
                  onChange={(e: any) => setPlanDuration(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#120b22] border border-white/[0.08] text-xs text-purple-100 focus:outline-none focus:border-emerald-400"
                >
                  <option value="month">Monthly (30 Days Rolling Quota)</option>
                  <option value="lifetime">Lifetime (Permanent Access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAssignPlanModal(false)}
                  className="px-4 py-2 rounded-xl glass-ultra text-purple-300/70 text-xs font-semibold hover:text-white glass-spring-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 glass-spring-btn"
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
