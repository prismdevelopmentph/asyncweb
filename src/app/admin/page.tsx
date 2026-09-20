'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DiscordLoginButton from '@/components/DiscordLoginButton';
import { supabase } from '@/lib/supabase';
import {
  Settings,
  Users,
  Activity,
  ShieldAlert,
  Key,
  Database,
  PlusCircle,
  Trash2,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Lock,
  Sparkles,
  ShieldCheck,
  Zap,
  Wrench,
  FileCode,
  Download,
  Search,
  ExternalLink,
  ArrowLeft,
  Crown,
  Copy,
  Check
} from 'lucide-react';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Tabs & Modals
  const [activeTab, setActiveTab] = useState<'plans' | 'licenses' | 'logs'>('plans');
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [showGenLicenseModal, setShowGenLicenseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form Inputs: Plan Assignment
  const [planUserId, setPlanUserId] = useState('');
  const [planUsername, setPlanUsername] = useState('');
  const [planType, setPlanType] = useState<'combo' | 'dumper' | 'decrypt'>('combo');
  const [planDuration, setPlanDuration] = useState<'month' | 'lifetime'>('month');

  // Form Inputs: API License
  const [licUserId, setLicUserId] = useState('');
  const [licUsername, setLicUsername] = useState('');
  const [licPlan, setLicPlan] = useState('combo');
  const [licQuota, setLicQuota] = useState('50');

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

  // 2. Fetch Admin Data
  const fetchAdminData = async () => {
    if (!ownerUserId) return;
    setDataLoading(true);
    try {
      const res = await fetch(`/api/dashboard-data?userId=${encodeURIComponent(ownerUserId)}&admin=true`);
      if (res.ok) {
        const json = await res.json();
        setAdminData(json);
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

  // Handle Plan Assignment
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
      fetchAdminData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Revoke Plan
  const handleRevokePlan = async (planId: number) => {
    if (!confirm('Are you sure you want to revoke this plan subscription?')) return;
    setActionMessage('');
    setActionError('');

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_plan',
          ownerUserId,
          planId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to revoke plan');

      setActionMessage(json.message);
      fetchAdminData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Handle License Generation
  const handleGenerateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage('');
    setActionError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_license',
          ownerUserId,
          targetUserId: licUserId.trim(),
          username: licUsername.trim() || 'API User',
          plan: licPlan,
          quota: licQuota,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate license');

      setActionMessage(`License Created: ${json.license?.license_key}`);
      setShowGenLicenseModal(false);
      setLicUserId('');
      setLicUsername('');
      fetchAdminData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle HWID Reset
  const handleResetHWID = async (licenseId: number) => {
    if (!confirm('Reset HWID binding for this license key?')) return;
    setActionMessage('');
    setActionError('');

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_hwid',
          ownerUserId,
          licenseId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to reset HWID');

      setActionMessage(json.message);
      fetchAdminData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Handle Toggle License Revoked
  const handleToggleLicense = async (licenseId: number, currentRevoked: number) => {
    setActionMessage('');
    setActionError('');

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_license_status',
          ownerUserId,
          licenseId,
          currentRevoked,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update license status');

      setActionMessage(json.message);
      fetchAdminData();
    } catch (err: any) {
      setActionError(err.message);
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

  const licensesList = adminData?.licenses || [];
  const plansList = adminData?.plans || [];
  const decryptionsList = adminData?.decryptions || [];
  const fixesList = adminData?.fixes || [];

  // Filter lists based on search
  const filteredPlans = plansList.filter((p: any) =>
    (p.user_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.plan_key || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLicenses = licensesList.filter((l: any) =>
    (l.user_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.license_key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.plan || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDecryptions = decryptionsList.filter((d: any) =>
    (d.user_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.file_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.key_type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFixes = fixesList.filter((f: any) =>
    (f.user_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.file_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePlansCount = plansList.filter((p: any) => p.active === 1).length;
  const activeLicensesCount = licensesList.filter((l: any) => l.revoked === 0).length;

  return (
    <div className="min-h-screen bg-[#06040b] text-[#f4f0ff] relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* ── Ambient Background Depth Layer ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none z-0 animate-grid-pulse" />
      <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[140px] pointer-events-none z-0 animate-orb-slow" />
      <div className="absolute top-1/3 -right-32 w-[550px] h-[550px] rounded-full bg-amber-600/10 blur-[130px] pointer-events-none z-0 animate-orb-reverse" />
      <div className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full bg-fuchsia-600/10 blur-[150px] pointer-events-none z-0 animate-orb-slow" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        
        {/* Top Header Ribbon */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 glass-ultra rounded-2xl p-5 border border-white/[0.08] shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  System Administration Console
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 tracking-wider">
                  OWNER ACCESS
                </span>
              </div>
              <p className="text-xs text-purple-300/60 font-medium">
                Manage global plan subscriptions, API bot licenses, and live audit telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-xl glass-ultra border border-white/[0.08] text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-2 glass-spring-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>

            <button
              onClick={fetchAdminData}
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

        {/* STAT COUNTERS BANNER */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-ultra rounded-3xl p-5 border border-white/[0.08] shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-semibold text-purple-300/60 tracking-wider">Active Subscriptions</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {activePlansCount}
            </div>
            <span className="text-[11px] text-purple-400/70 block mt-1">Total: {plansList.length} records</span>
          </div>

          <div className="glass-ultra rounded-3xl p-5 border border-white/[0.08] shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-semibold text-purple-300/60 tracking-wider">Active API Licenses</span>
              <Key className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
              {activeLicensesCount}
            </div>
            <span className="text-[11px] text-purple-400/70 block mt-1">Total: {licensesList.length} issued</span>
          </div>

          <div className="glass-ultra rounded-3xl p-5 border border-white/[0.08] shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-semibold text-purple-300/60 tracking-wider">Total Decryptions</span>
              <FileCode className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {decryptionsList.length}
            </div>
            <span className="text-[11px] text-emerald-400/70 block mt-1">All-time processed</span>
          </div>

          <div className="glass-ultra rounded-3xl p-5 border border-white/[0.08] shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-semibold text-purple-300/60 tracking-wider">3D Mesh Fixes</span>
              <Wrench className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {fixesList.length}
            </div>
            <span className="text-[11px] text-purple-400/70 block mt-1">Vertices repaired</span>
          </div>
        </div>

        {/* TABS & ACTION BUTTONS */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 glass-spring-btn ${
                activeTab === 'plans'
                  ? 'bg-purple-600/40 border border-purple-500/40 text-white shadow-md'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>Plan Subscriptions ({plansList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('licenses')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 glass-spring-btn ${
                activeTab === 'licenses'
                  ? 'bg-purple-600/40 border border-purple-500/40 text-white shadow-md'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>API Licenses ({licensesList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 glass-spring-btn ${
                activeTab === 'logs'
                  ? 'bg-purple-600/40 border border-purple-500/40 text-white shadow-md'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Live Audit Logs</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, ID, key..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <button
              onClick={() => setShowAssignPlanModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all glass-spring-btn whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Assign Plan</span>
            </button>

            <button
              onClick={() => setShowGenLicenseModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all glass-spring-btn whitespace-nowrap"
            >
              <Key className="w-4 h-4" />
              <span>Gen License</span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: PLAN SUBSCRIPTIONS TABLE ── */}
        {activeTab === 'plans' && (
          <section className="space-y-4">
            <div className="glass-ultra rounded-3xl border border-white/[0.08] overflow-hidden shadow-xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-purple-300/70 uppercase tracking-wider font-mono">
                      <th className="py-3.5 px-4">Discord User ID</th>
                      <th className="py-3.5 px-4">Username</th>
                      <th className="py-3.5 px-4">Plan Key / Tier</th>
                      <th className="py-3.5 px-4">Assigned By</th>
                      <th className="py-3.5 px-4">Expires At</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-purple-300">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                          <span>Loading plan records...</span>
                        </td>
                      </tr>
                    ) : filteredPlans.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-purple-300/50 font-mono">
                          No plan subscriptions found.
                        </td>
                      </tr>
                    ) : (
                      filteredPlans.map((plan: any) => {
                        const isPlanActive = plan.active === 1;
                        const isExpired = plan.expires_at && new Date(plan.expires_at).getTime() < Date.now();

                        return (
                          <tr key={plan.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-purple-200 select-all">
                              {plan.user_id}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-white">
                              {plan.username || 'User'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 border border-purple-500/20 text-purple-300">
                                {plan.plan_key?.replace(/_/g, ' ') || 'COMBO'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-purple-300/70 text-[11px]">
                              {plan.assigned_by || 'Owner'}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-purple-300/80">
                              {!plan.expires_at ? (
                                <span className="text-emerald-400 font-bold">LIFETIME</span>
                              ) : (
                                new Date(plan.expires_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  !isPlanActive
                                    ? 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                                    : isExpired
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {!isPlanActive ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {isPlanActive && (
                                <button
                                  onClick={() => handleRevokePlan(plan.id)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold glass-spring-btn"
                                >
                                  Revoke
                                </button>
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

        {/* ── TAB 2: API LICENSES TABLE ── */}
        {activeTab === 'licenses' && (
          <section className="space-y-4">
            <div className="glass-ultra rounded-3xl border border-white/[0.08] overflow-hidden shadow-xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-purple-300/70 uppercase tracking-wider font-mono">
                      <th className="py-3.5 px-4">Discord User ID</th>
                      <th className="py-3.5 px-4">Username</th>
                      <th className="py-3.5 px-4">License Key</th>
                      <th className="py-3.5 px-4">Plan Tier</th>
                      <th className="py-3.5 px-4">Daily Usage</th>
                      <th className="py-3.5 px-4">HWID Binding</th>
                      <th className="py-3.5 px-4 text-right">Status Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-purple-300">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                          <span>Loading licenses...</span>
                        </td>
                      </tr>
                    ) : filteredLicenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-purple-300/50 font-mono">
                          No API licenses found.
                        </td>
                      </tr>
                    ) : (
                      filteredLicenses.map((lic: any) => {
                        const isRevoked = lic.revoked === 1;

                        return (
                          <tr key={lic.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-purple-200 select-all">
                              {lic.user_id}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-white">
                              {lic.username || 'API User'}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/[0.08] text-purple-200 text-[11px]">
                                <span>{lic.license_key}</span>
                                <button
                                  onClick={() => copyToClipboard(lic.license_key)}
                                  className="text-purple-400 hover:text-white"
                                  title="Copy Key"
                                >
                                  {copiedKey === lic.license_key ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-300">
                                {lic.plan || 'combo'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-purple-300">
                              {lic.daily_used || 0} / {lic.daily_quota || 'Unlimited'}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              {lic.hwid ? (
                                <span className="text-amber-400 font-bold inline-flex items-center gap-1.5">
                                  <span>LOCKED</span>
                                  <button
                                    onClick={() => handleResetHWID(lic.id)}
                                    className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] text-amber-300"
                                  >
                                    Reset
                                  </button>
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-semibold">UNBOUND</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleToggleLicense(lic.id, lic.revoked || 0)}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all glass-spring-btn ${
                                  !isRevoked
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30'
                                }`}
                              >
                                {!isRevoked ? 'Valid (Revoke)' : 'Revoked (Enable)'}
                              </button>
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

        {/* ── TAB 3: LIVE AUDIT LOGS ── */}
        {activeTab === 'logs' && (
          <section className="space-y-8">
            {/* Decryptions History */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                <span>Recent Resource Decryptions</span>
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

            {/* 3D Mesh Fixes History */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <span>Recent 3D Model Vertex Repairs</span>
              </h3>

              <div className="glass-ultra rounded-3xl border border-white/[0.08] overflow-hidden shadow-xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-purple-300/70 uppercase tracking-wider font-mono">
                        <th className="py-3.5 px-4">Timestamp</th>
                        <th className="py-3.5 px-4">User ID</th>
                        <th className="py-3.5 px-4">Resource File</th>
                        <th className="py-3.5 px-4">Vertices Fixed</th>
                        <th className="py-3.5 px-4 text-right">Download Output</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredFixes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-purple-300/50 font-mono">
                            No 3D vertex fixes logged yet.
                          </td>
                        </tr>
                      ) : (
                        filteredFixes.map((f: any) => (
                          <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-mono text-purple-300/60">
                              {new Date(f.created_at).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-purple-200 select-all">
                              {f.user_id}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-white">
                              {f.file_name}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-indigo-400 font-bold">
                              {f.vertices_fixed ?? 0}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {f.download_url ? (
                                <a
                                  href={f.download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold glass-spring-btn"
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

      {/* ── MODAL: ASSIGN PLAN SUBSCRIPTION ── */}
      {showAssignPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-md glass-ultra rounded-3xl border border-purple-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.25)] space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <PlusCircle className="w-5 h-5 text-purple-400" />
              <span>Assign Plan Subscription</span>
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
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Username (Optional)</label>
                <input
                  type="text"
                  value={planUsername}
                  onChange={(e) => setPlanUsername(e.target.value)}
                  placeholder="e.g. Member#0001"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Plan Tier *</label>
                <select
                  value={planType}
                  onChange={(e: any) => setPlanType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#120b22] border border-white/[0.08] text-xs text-purple-100 focus:outline-none focus:border-purple-400"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-[#120b22] border border-white/[0.08] text-xs text-purple-100 focus:outline-none focus:border-purple-400"
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50 glass-spring-btn"
                >
                  {submitting ? 'Assigning...' : 'Assign Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: GENERATE API LICENSE ── */}
      {showGenLicenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-md glass-ultra rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Key className="w-5 h-5 text-amber-400" />
              <span>Generate API / Bot License Key</span>
            </h3>

            <form onSubmit={handleGenerateLicense} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Target Discord User ID *</label>
                <input
                  type="text"
                  required
                  value={licUserId}
                  onChange={(e) => setLicUserId(e.target.value)}
                  placeholder="e.g. 719482630633947166"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Username (Optional)</label>
                <input
                  type="text"
                  value={licUsername}
                  onChange={(e) => setLicUsername(e.target.value)}
                  placeholder="e.g. Developer#0001"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Plan Tier *</label>
                <select
                  value={licPlan}
                  onChange={(e) => setLicPlan(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#120b22] border border-white/[0.08] text-xs text-purple-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="combo">Combo Plan</option>
                  <option value="dumper">Dumper Only</option>
                  <option value="decrypt">Decrypt Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Daily Quota (Requests / Day)</label>
                <input
                  type="number"
                  value={licQuota}
                  onChange={(e) => setLicQuota(e.target.value)}
                  placeholder="50"
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
                  {submitting ? 'Generating...' : 'Create License'}
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
