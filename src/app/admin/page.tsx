'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Form Modals State
  const [activeTab, setActiveTab] = useState<'plans' | 'licenses' | 'logs'>('plans');
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [showGenLicenseModal, setShowGenLicenseModal] = useState(false);

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
          targetUserId: planUserId,
          username: planUsername,
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
          targetUserId: licUserId,
          username: licUsername,
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
    if (!confirm('Reset HWID for this license key?')) return;
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
      <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col items-center justify-center">
        <Sparkles className="w-10 h-10 text-purple-400 animate-spin mb-4" />
        <p className="text-sm font-mono text-purple-300">Loading control panel...</p>
      </div>
    );
  }

  // Security Lockout: Non-owner access blocked
  if (!user || !isOwner) {
    return (
      <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="purple-glow-bg top-1/4 left-1/2 -translate-x-1/2 opacity-50 w-[500px] h-[500px]"></div>

        <main className="flex-1 max-w-lg mx-auto px-4 py-20 flex flex-col items-center justify-center text-center relative z-10">
          <div className="glass-panel-glow p-8 sm:p-10 rounded-3xl border border-rose-500/40 w-full shadow-[0_0_50px_rgba(244,63,94,0.2)]">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-400/40 flex items-center justify-center mx-auto mb-6 text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-black mb-2 text-white">Access Restricted</h1>
            <p className="text-sm text-purple-300/70 mb-8 leading-relaxed">
              This control panel is strictly restricted to authorized system Owners. If you are an Owner, please log in with your primary Discord account.
            </p>

            {!user ? (
              <DiscordLoginButton size="lg" className="w-full" text="Sign in as Owner" />
            ) : (
              <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs font-mono text-purple-300">
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

  return (
    <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col relative selection:bg-purple-600 selection:text-white">
      <Navbar />

      <div className="purple-glow-bg top-10 right-1/4 opacity-40"></div>

      <main className="flex-1 max-w-7xl mx-auto px-4 lg:px-8 py-10 w-full relative z-10">
        
        {/* ADMIN HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-1">
              <Settings className="w-4 h-4 text-purple-400" />
              <span>SYSTEM CONTROL PANEL & MANAGEMENT</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Global <span className="purple-gradient-text">Admin Dashboard</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              className="p-2.5 rounded-xl glass-card border border-purple-500/30 text-purple-300 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
            </button>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-600/30 text-purple-300 border border-purple-400/40 flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>OWNER CONTROL ACTIVE</span>
            </span>
          </div>
        </div>

        {/* FEEDBACK MESSAGES */}
        {actionMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* CONTROL NAVIGATION TABS & ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-card border border-purple-500/30">
            <button
              onClick={() => setActiveTab('licenses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'licenses'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>API Licenses ({licensesList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'plans'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Plan Subscriptions ({plansList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'logs'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Live Audit Logs</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAssignPlanModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Assign Subscription</span>
            </button>
          </div>
        </div>

        {/* TAB 1: API LICENSES TABLE */}
        {activeTab === 'licenses' && (
          <section className="space-y-6">
            <div className="glass-panel rounded-3xl overflow-hidden border border-purple-500/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-950/60 text-purple-300 border-b border-purple-500/30 font-mono uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Discord User ID</th>
                      <th className="p-4">Username</th>
                      <th className="p-4">License Key</th>
                      <th className="p-4">Plan / Type</th>
                      <th className="p-4">Daily Usage</th>
                      <th className="p-4">HWID Binding</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {licensesList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-purple-400/60 font-mono">
                          No API licenses found in database.
                        </td>
                      </tr>
                    ) : (
                      licensesList.map((lic: any) => (
                        <tr key={lic.id} className="hover:bg-purple-900/20 transition-colors">
                          <td className="p-4 font-mono font-bold text-purple-300">{lic.user_id}</td>
                          <td className="p-4 font-semibold text-purple-100">{lic.username || 'User'}</td>
                          <td className="p-4 font-mono text-purple-200">
                            <span className="bg-purple-950/80 px-2.5 py-1 rounded border border-purple-500/30 select-all">
                              {lic.license_key}
                            </span>
                          </td>
                          <td className="p-4 uppercase font-bold text-purple-400">
                            {lic.plan || 'combo'} <span className="text-[10px] text-purple-400/60 font-normal">({lic.plan_type || 'monthly'})</span>
                          </td>
                          <td className="p-4 font-mono text-purple-300">
                            {lic.daily_used || 0} / {lic.daily_quota || 999999}
                          </td>
                          <td className="p-4 font-mono">
                            {lic.hwid ? (
                              <span className="text-amber-400 font-bold flex items-center gap-1">
                                BOUND
                                <button
                                  onClick={() => handleResetHWID(lic.id)}
                                  className="ml-2 text-[10px] underline text-purple-400 hover:text-white"
                                >
                                  (Reset HWID)
                                </button>
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-semibold">UNLOCKED</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleToggleLicense(lic.id, lic.revoked || 0)}
                              className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ml-auto ${
                                lic.revoked === 0
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30'
                              }`}
                            >
                              {lic.revoked === 0 ? 'VALID (Revoke)' : 'REVOKED (Enable)'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: LIVE AUDIT LOGS */}
        {activeTab === 'logs' && (
          <section className="space-y-8">
            {/* Decryptions History */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-200 mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span>Recent Decryption Records</span>
              </h3>
              <div className="glass-panel rounded-2xl overflow-hidden border border-purple-500/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-purple-950/40 text-purple-300 border-b border-purple-500/20 font-mono uppercase">
                      <tr>
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5">User ID</th>
                        <th className="p-3.5">Resource File</th>
                        <th className="p-3.5">Key Type</th>
                        <th className="p-3.5 text-right">Download Output</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-500/10">
                      {decryptionsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-purple-400/60 font-mono">No decryptions logged yet.</td>
                        </tr>
                      ) : (
                        decryptionsList.map((d: any) => (
                          <tr key={d.id} className="hover:bg-purple-900/20">
                            <td className="p-3.5 font-mono text-purple-400/80">{new Date(d.created_at).toLocaleString()}</td>
                            <td className="p-3.5 font-mono text-purple-300">{d.user_id}</td>
                            <td className="p-3.5 font-semibold text-purple-100">{d.file_name}</td>
                            <td className="p-3.5 font-mono text-purple-300/80">{d.key_type}</td>
                            <td className="p-3.5 text-right">
                              {d.download_url ? (
                                <a
                                  href={d.download_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-purple-400 hover:text-purple-300 underline font-mono text-[11px]"
                                >
                                  Download Result
                                </a>
                              ) : (
                                <span className="text-purple-400/40">N/A</span>
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

            {/* 3D Model Fixes History */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-200 mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-400" />
                <span>Recent 3D Fixer Records</span>
              </h3>
              <div className="glass-panel rounded-2xl overflow-hidden border border-purple-500/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-purple-950/40 text-purple-300 border-b border-purple-500/20 font-mono uppercase">
                      <tr>
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5">User ID</th>
                        <th className="p-3.5">Resource File</th>
                        <th className="p-3.5">Vertices Repaired</th>
                        <th className="p-3.5 text-right">Download Output</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-500/10">
                      {fixesList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-purple-400/60 font-mono">No model fixes logged yet.</td>
                        </tr>
                      ) : (
                        fixesList.map((f: any) => (
                          <tr key={f.id} className="hover:bg-purple-900/20">
                            <td className="p-3.5 font-mono text-purple-400/80">{new Date(f.created_at).toLocaleString()}</td>
                            <td className="p-3.5 font-mono text-purple-300">{f.user_id}</td>
                            <td className="p-3.5 font-semibold text-purple-100">{f.file_name}</td>
                            <td className="p-3.5 font-mono text-purple-300/80">{f.vertices_fixed || 0}</td>
                            <td className="p-3.5 text-right">
                              {f.download_url ? (
                                <a
                                  href={f.download_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-purple-400 hover:text-purple-300 underline font-mono text-[11px]"
                                >
                                  Download Result
                                </a>
                              ) : (
                                <span className="text-purple-400/40">N/A</span>
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

      {/* MODAL: ASSIGN PLAN SUBSCRIPTION */}
      {showAssignPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel-glow w-full max-w-md p-6 rounded-3xl border border-purple-500/40 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
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
                  className="w-full px-4 py-2.5 rounded-xl glass-card border border-purple-500/30 text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Username (Optional)</label>
                <input
                  type="text"
                  value={planUsername}
                  onChange={(e) => setPlanUsername(e.target.value)}
                  placeholder="e.g. User#0001"
                  className="w-full px-4 py-2.5 rounded-xl glass-card border border-purple-500/30 text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Access Type *</label>
                <select
                  value={planType}
                  onChange={(e: any) => setPlanType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#140b2b] border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                >
                  <option value="combo">Combo Plan (Full Decrypt + Dumper)</option>
                  <option value="dumper">Dumper Plan (Dumper Only)</option>
                  <option value="decrypt">Decrypt Plan (Decrypt Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-300/80 mb-1">Plan Duration *</label>
                <select
                  value={planDuration}
                  onChange={(e: any) => setPlanDuration(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#140b2b] border border-purple-500/30 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                >
                  <option value="month">Monthly (30 Days Rolling Quota)</option>
                  <option value="lifetime">Lifetime (Permanent Access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-500/20">
                <button
                  type="button"
                  onClick={() => setShowAssignPlanModal(false)}
                  className="px-4 py-2 rounded-xl glass-card text-purple-300/70 text-xs font-semibold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50"
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
