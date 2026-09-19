'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DiscordLoginButton from '@/components/DiscordLoginButton';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  Download,
  CheckCircle,
  Clock,
  FileCode,
  Wrench,
  ShieldCheck,
  Lock,
  RefreshCw,
  Search,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    decryptions: any[];
    fixes: any[];
    plans: any[];
  }>({
    decryptions: [],
    fixes: [],
    plans: [],
  });
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Check client session
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch user-specific data when user is present
  const fetchDashboardData = async (userId: string) => {
    setDataLoading(true);
    try {
      const res = await fetch(`/api/dashboard-data?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        setDashboardData({
          decryptions: json.decryptions || [],
          fixes: json.fixes || [],
          plans: json.plans || [],
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const discordUserId = user.user_metadata?.provider_id || user.user_metadata?.sub || user.id;
      fetchDashboardData(discordUserId);
    }
  }, [user]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col items-center justify-center">
        <Sparkles className="w-10 h-10 text-purple-400 animate-spin mb-4" />
        <p className="text-sm font-mono text-purple-300">Loading your profile...</p>
      </div>
    );
  }

  // If signed out: locked authentication screen (NO DATA PREVIEW)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col relative selection:bg-purple-600 selection:text-white overflow-hidden">
        <Navbar />

        <div className="purple-glow-bg top-1/4 left-1/2 -translate-x-1/2 opacity-50 w-[500px] h-[500px]"></div>

        <main className="flex-1 max-w-lg mx-auto px-4 py-20 flex flex-col items-center justify-center text-center relative z-10">
          <div className="glass-panel-glow p-8 sm:p-10 rounded-3xl border border-purple-500/40 w-full shadow-[0_0_50px_rgba(168,85,247,0.25)]">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-400/40 flex items-center justify-center mx-auto mb-6 text-purple-300">
              <Lock className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-black mb-2 text-white">Authentication Required</h1>
            <p className="text-sm text-purple-300/70 mb-8 leading-relaxed">
              Please sign in with your Discord account to access your personal decryptions, fixes, and active subscription details.
            </p>

            <DiscordLoginButton size="lg" className="w-full" text="Sign in with Discord" />
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Logged-in User Profile Data
  const discordUserId = user.user_metadata?.provider_id || user.user_metadata?.sub || user.id;
  const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Discord User';
  const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '/images/Profile.png';
  const activePlan = dashboardData.plans[0] || null;

  // Filtered decryptions
  const filteredDecryptions = dashboardData.decryptions.filter((item) =>
    item.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col relative selection:bg-purple-600 selection:text-white">
      <Navbar />

      <div className="purple-glow-bg top-20 left-1/4 opacity-40"></div>
      <div className="purple-glow-bg bottom-40 right-10 opacity-30"></div>

      <main className="flex-1 max-w-7xl mx-auto px-4 lg:px-8 py-10 w-full relative z-10">
        
        {/* MEMBER PROFILE HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.3)] shrink-0">
              <Image src={userAvatar} alt={userName} fill className="object-cover" priority />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Authenticated Member
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{userName}</h1>
              <p className="text-xs text-purple-400/80 font-mono mt-0.5">Discord ID: {discordUserId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => fetchDashboardData(discordUserId)}
              disabled={dataLoading}
              className="p-3 rounded-2xl glass-card border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-600/30 transition-all flex items-center justify-center"
              title="Refresh records"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
            </button>

            <div className="glass-card px-4 py-2.5 rounded-2xl border border-purple-500/30 text-xs flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-purple-300/60 block text-[10px] uppercase font-mono">Current Tier</span>
                <span className="font-bold text-purple-200">
                  {activePlan ? activePlan.plan_key.toUpperCase() : 'STANDARD FREE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE PLAN & STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-300/70 font-medium">Subscription</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                activePlan ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300'
              }`}>
                {activePlan ? 'ACTIVE' : 'FREE'}
              </span>
            </div>
            <div className="text-xl font-black text-white">
              {activePlan ? activePlan.plan_key.toUpperCase() : 'Standard'}
            </div>
            <span className="text-[10px] text-purple-400/70 block mt-1">
              {activePlan?.expires_at ? `Exp: ${new Date(activePlan.expires_at).toLocaleDateString()}` : 'Lifetime / No Expiry'}
            </span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-300/70 font-medium">Decryptions</span>
              <FileCode className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {dashboardData.decryptions.length}
            </div>
            <span className="text-[10px] text-purple-400/70 block mt-1">Completed jobs</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-300/70 font-medium">Vertex Fixes</span>
              <Wrench className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {dashboardData.fixes.length}
            </div>
            <span className="text-[10px] text-purple-400/70 block mt-1">3D models repaired</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-300/70 font-medium">Daily Quota</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-black text-emerald-400">
              Active
            </div>
            <span className="text-[10px] text-purple-400/70 block mt-1">+1 Bonus claimable in Discord</span>
          </div>
        </div>

        {/* RECENT DECRYPTION HISTORY TABLE */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-purple-100 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-purple-400" />
              <span>Your Decryption History</span>
            </h2>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search file name..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl glass-card border border-purple-500/30 text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-purple-500/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-950/40 text-purple-300 border-b border-purple-500/20 font-mono uppercase tracking-wider">
                  <tr>
                    <th className="p-4">File Name</th>
                    <th className="p-4">Key / Engine</th>
                    <th className="p-4">Extracted Files</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {dataLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-purple-300">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                        <span>Loading records...</span>
                      </td>
                    </tr>
                  ) : filteredDecryptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-purple-400/60">
                        <FileCode className="w-8 h-8 text-purple-500/40 mx-auto mb-2" />
                        <span>No decryptions found for this Discord ID. Dispatch files via the bot to see them here!</span>
                      </td>
                    </tr>
                  ) : (
                    filteredDecryptions.map((item: any) => (
                      <tr key={item.id} className="hover:bg-purple-900/20 transition-colors">
                        <td className="p-4 font-semibold text-purple-100 flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="truncate max-w-[220px]">{item.file_name}</span>
                        </td>
                        <td className="p-4 font-mono text-purple-300">{item.key_type || 'Auto'}</td>
                        <td className="p-4 font-mono text-emerald-400 font-bold">{item.decrypted ?? 0} files</td>
                        <td className="p-4 font-mono text-purple-300/80">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {item.status || 'SUCCESS'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {item.download_url ? (
                            <a
                              href={item.download_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/40 hover:bg-purple-600 text-purple-200 font-medium text-xs border border-purple-400/30 transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          ) : (
                            <span className="text-purple-400/40 italic text-[11px]">Expired</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* RECENT VERTEX FIXES TABLE */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-purple-100 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-400" />
              <span>3D Model & Vertex Fix History</span>
            </h2>
            <span className="text-xs text-purple-400/70 font-mono">
              {dashboardData.fixes.length} records found
            </span>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-purple-500/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-950/40 text-purple-300 border-b border-purple-500/20 font-mono uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Model File</th>
                    <th className="p-4">Vertices Fixed</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {dataLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-purple-300">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                        <span>Loading records...</span>
                      </td>
                    </tr>
                  ) : dashboardData.fixes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-purple-400/60">
                        <Wrench className="w-8 h-8 text-purple-500/40 mx-auto mb-2" />
                        <span>No vertex fix history found. Use the 3D model repair command in Discord to repair models!</span>
                      </td>
                    </tr>
                  ) : (
                    dashboardData.fixes.map((item: any) => (
                      <tr key={item.id} className="hover:bg-purple-900/20 transition-colors">
                        <td className="p-4 font-semibold text-purple-100 flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="truncate max-w-[220px]">{item.file_name}</span>
                        </td>
                        <td className="p-4 font-mono text-emerald-400 font-bold">{item.vertices_fixed?.toLocaleString() ?? 0} vertices</td>
                        <td className="p-4 font-mono text-purple-300/80">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {item.status || 'FIXED'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {item.download_url ? (
                            <a
                              href={item.download_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/40 hover:bg-purple-600 text-purple-200 font-medium text-xs border border-purple-400/30 transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          ) : (
                            <span className="text-purple-400/40 italic text-[11px]">Expired</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
