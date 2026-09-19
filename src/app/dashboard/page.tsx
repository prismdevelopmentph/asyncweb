'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DiscordLoginButton from '@/components/DiscordLoginButton';
import { supabase } from '@/lib/supabase';
import { uploadToGofile } from '@/lib/gofile-upload';
import {
  FileCode,
  Wrench,
  ShieldCheck,
  Lock,
  RefreshCw,
  Search,
  Sparkles,
  Crown,
  Calendar,
  Layers,
  AlertTriangle,
  UploadCloud,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Key,
  FileText,
  Zap,
  ArrowRight,
  X
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [avatarSrc, setAvatarSrc] = useState<string>('/images/Profile.png');
  const [dashboardData, setDashboardData] = useState<{
    isOwner?: boolean;
    decryptions: any[];
    fixes: any[];
    plans: any[];
    usage?: {
      weekly: number;
      monthly: number;
    };
  }>({
    isOwner: false,
    decryptions: [],
    fixes: [],
    plans: [],
    usage: { weekly: 0, monthly: 0 }
  });
  const [searchQuery, setSearchQuery] = useState('');

  // ── Processing Modal State ──
  const [activeToolModal, setActiveToolModal] = useState<'decrypt' | 'decryptfix' | 'fixer' | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [keyType, setKeyType] = useState<'none' | 'cfxkey' | 'grants'>('none');
  const [keyDataInput, setKeyDataInput] = useState('');
  const [grantsFileName, setGrantsFileName] = useState('');

  // Job execution state
  const [jobStatus, setJobStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobErrorMessage, setJobErrorMessage] = useState('');
  const [resultDownloadUrl, setResultDownloadUrl] = useState('');

  // 1. Check client session
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '/images/Profile.png';
        setAvatarSrc(avatar);
      }
      setLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '/images/Profile.png';
        setAvatarSrc(avatar);
      }
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
          isOwner: json.isOwner || false,
          decryptions: json.decryptions || [],
          fixes: json.fixes || [],
          plans: json.plans || [],
          usage: json.usage || { weekly: 0, monthly: 0 }
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

  // Handle Job Submission
  const handleStartJob = async () => {
    if (!user || !activeToolModal) return;

    setJobStatus('idle');
    setJobErrorMessage('');
    setResultDownloadUrl('');
    setUploadProgress(0);

    let targetFileUrl = '';
    let targetFileName = '';

    // Step A: Handle file upload vs URL input
    if (inputMode === 'upload') {
      if (!selectedFile) {
        setJobErrorMessage('Please select a local .zip file to upload.');
        setJobStatus('error');
        return;
      }
      targetFileName = selectedFile.name;
      setJobStatus('uploading');

      try {
        const uploadResult = await uploadToGofile(selectedFile, (percent) => {
          setUploadProgress(percent);
        });
        targetFileUrl = uploadResult.downloadPage;
      } catch (err: any) {
        console.error('Upload Error:', err);
        setJobErrorMessage(err.message || 'Failed to upload file.');
        setJobStatus('error');
        return;
      }
    } else {
      if (!fileUrlInput.trim()) {
        setJobErrorMessage('Please enter a valid file URL (GoFile, MediaFire, Catbox, Pixeldrain).');
        setJobStatus('error');
        return;
      }
      targetFileUrl = fileUrlInput.trim();
      targetFileName = targetFileUrl.split('/').pop() || 'resource.zip';
    }

    // Step B: Dispatch to processing API route
    setJobStatus('processing');
    const discordUserId = user.user_metadata?.provider_id || user.user_metadata?.sub || user.id;
    const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Discord User';

    try {
      const res = await fetch('/api/process-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: discordUserId,
          username: userName,
          toolType: activeToolModal,
          fileUrl: targetFileUrl,
          fileName: targetFileName,
          keyType,
          keyData: keyDataInput,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Job processing failed.');
      }

      setResultDownloadUrl(json.downloadUrl || targetFileUrl);
      setJobStatus('success');

      // Refresh history records
      fetchDashboardData(discordUserId);
    } catch (err: any) {
      console.error('Job Dispatch Error:', err);
      setJobErrorMessage(err.message || 'Failed to process job.');
      setJobStatus('error');
    }
  };

  const closeModal = () => {
    setActiveToolModal(null);
    setJobStatus('idle');
    setSelectedFile(null);
    setFileUrlInput('');
    setKeyDataInput('');
    setGrantsFileName('');
    setJobErrorMessage('');
    setResultDownloadUrl('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col items-center justify-center">
        <Sparkles className="w-10 h-10 text-purple-400 animate-spin mb-4" />
        <p className="text-sm font-mono text-purple-300">Loading your profile...</p>
      </div>
    );
  }

  // If signed out: locked authentication screen
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
              Please sign in with your Discord account to access your personal dashboard, tools, and active subscription details.
            </p>

            <DiscordLoginButton size="lg" className="w-full" text="Sign in with Discord" />
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // User details
  const discordUserId = user.user_metadata?.provider_id || user.user_metadata?.sub || user.id;
  const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Discord User';
  const activePlan = dashboardData.plans[0] || null;
  const isOwner = dashboardData.isOwner || discordUserId === '719482630633947166';
  const hasActiveSubscription = isOwner || activePlan != null;

  // Format Tier Display
  const getTierDisplay = () => {
    if (isOwner) return { name: 'OWNER LIFETIME', badge: 'OWNER', active: true, color: 'text-amber-300 border-amber-500/40 bg-amber-500/20' };
    if (!activePlan) return { name: 'NO PLAN', badge: 'INACTIVE', active: false, color: 'text-rose-300 border-rose-500/40 bg-rose-500/20' };
    
    const key = activePlan.plan_key?.toLowerCase() || '';
    if (key.includes('lifetime')) return { name: 'LIFETIME VIP', badge: 'ACTIVE', active: true, color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/20' };
    if (key.includes('month')) return { name: 'MONTHLY VIP', badge: 'ACTIVE', active: true, color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/20' };
    return { name: activePlan.plan_key?.toUpperCase() || 'VIP PLAN', badge: 'ACTIVE', active: true, color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/20' };
  };

  const tier = getTierDisplay();

  // If signed in BUT NOT subscribed & NOT owner: locked dashboard view
  if (!dataLoading && !hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col relative selection:bg-purple-600 selection:text-white">
        <Navbar />

        <div className="purple-glow-bg top-20 left-1/4 opacity-30"></div>

        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full relative z-10">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 glass-panel p-6 rounded-3xl border border-purple-500/30">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-purple-400/50 shrink-0 bg-purple-900/40">
                <Image
                  src={avatarSrc}
                  alt={userName}
                  fill
                  unoptimized
                  onError={() => setAvatarSrc('/images/Profile.png')}
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{userName}</h1>
                <p className="text-xs text-purple-400/80 font-mono">Discord ID: {discordUserId}</p>
              </div>
            </div>

            <div className="glass-card px-4 py-2 rounded-2xl border border-rose-500/40 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
              <span className="font-bold text-rose-300">Status: NO PLAN</span>
            </div>
          </div>

          {/* LOCKED SUBSCRIPTION CARD */}
          <div className="glass-panel-glow p-8 sm:p-12 rounded-3xl border border-rose-500/30 text-center relative overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.15)]">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center mx-auto mb-6 text-rose-300">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-white mb-3">Active Subscription Required</h2>
            <p className="text-sm text-purple-300/80 max-w-lg mx-auto mb-8 leading-relaxed">
              You are currently signed in, but your Discord account does not have an active <span className="text-purple-200 font-bold">Monthly VIP</span> or <span className="text-purple-200 font-bold">Lifetime VIP</span> subscription.
              <br /><br />
              Please purchase a plan or contact staff in Discord to activate your plan and access the processing tools.
            </p>

            <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              >
                Open Discord Server
              </a>
              <button
                onClick={() => fetchDashboardData(discordUserId)}
                className="px-6 py-3 rounded-2xl glass-card border border-purple-500/30 text-purple-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
                <span>Re-check Subscription</span>
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Subscribed / Owner Users Dashboard View
  const planKeyStr = activePlan?.plan_key?.toLowerCase() || '';
  const isDumperPlan = planKeyStr.includes('dumper');
  const weeklyLimit = isOwner || planKeyStr.includes('lifetime') ? null : (isDumperPlan ? 40 : 60);
  const monthlyLimit = isOwner || planKeyStr.includes('lifetime') ? null : (isDumperPlan ? 120 : 180);

  const weeklyUsed = dashboardData.usage?.weekly || 0;
  const monthlyUsed = dashboardData.usage?.monthly || 0;

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
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.3)] shrink-0 bg-purple-900/40">
              <Image
                src={avatarSrc}
                alt={userName}
                fill
                unoptimized
                onError={() => setAvatarSrc('/images/Profile.png')}
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Authenticated Member
                </span>
                {isOwner && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Owner
                  </span>
                )}
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
                <span className="text-purple-300/60 block text-[10px] uppercase font-mono">Current Plan</span>
                <span className="font-bold text-purple-200">{tier.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE PLAN & USAGE STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-300/70 font-medium">Subscription</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${tier.color}`}>
                {tier.badge}
              </span>
            </div>
            <div className="text-xl font-black text-white">
              {tier.name}
            </div>
            <span className="text-[10px] text-purple-400/70 block mt-1">
              {isOwner || !activePlan?.expires_at ? 'Permanent Access' : `Expires: ${new Date(activePlan.expires_at).toLocaleDateString()}`}
            </span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-300/70 font-medium">Weekly Limit</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-black text-emerald-400">
              {weeklyLimit === null ? 'Unlimited' : `${weeklyUsed} / ${weeklyLimit}`}
            </div>
            <span className="text-[10px] text-purple-400/70 block mt-1">
              {weeklyLimit === null ? 'No weekly restriction' : 'Shared decrypt & 3D fix limit'}
            </span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-300/70 font-medium">Monthly Limit</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-black text-emerald-400">
              {monthlyLimit === null ? 'Unlimited' : `${monthlyUsed} / ${monthlyLimit}`}
            </div>
            <span className="text-[10px] text-purple-400/70 block mt-1">
              {monthlyLimit === null ? 'No monthly restriction' : 'Shared decrypt & 3D fix limit'}
            </span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-300/70 font-medium">Jobs Completed</span>
              <FileCode className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {dashboardData.decryptions.length + dashboardData.fixes.length}
            </div>
            <span className="text-[10px] text-purple-400/70 block mt-1">Total decryptions & 3D fixes</span>
          </div>
        </div>

        {/* ── TOOLS & PROCESSING ENGINE SECTION (PLACED ABOVE HISTORY) ── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <span>Web Processing Engine</span>
              </h2>
              <p className="text-xs text-purple-300/70">
                Process your FiveM resources & 3D models directly from the web panel or Discord bot.
              </p>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              DIRECT UPLOAD STREAM
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TOOL CARD 1: DECRYPT */}
            <div
              onClick={() => { setActiveToolModal('decrypt'); setJobStatus('idle'); }}
              className="glass-panel p-6 rounded-3xl border border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-900/30 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileCode className="w-24 h-24 text-purple-400" />
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center mb-4 text-rose-300 group-hover:scale-110 transition-transform">
                  <FileCode className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white mb-1 group-hover:text-purple-300 transition-colors">
                  🔒 Decrypt Resource
                </h3>
                <p className="text-xs text-purple-300/70 leading-relaxed mb-6">
                  Decrypt FiveM scripts & assets via Grants, CFX License key, or automated keyless extraction engine.
                </p>
              </div>

              <button className="w-full py-2.5 rounded-xl bg-purple-600/30 group-hover:bg-purple-600 text-purple-200 group-hover:text-white font-bold text-xs border border-purple-500/40 transition-all flex items-center justify-center gap-2">
                <span>Start Decryption</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* TOOL CARD 2: DECRYPT + FIX */}
            <div
              onClick={() => { setActiveToolModal('decryptfix'); setJobStatus('idle'); }}
              className="glass-panel p-6 rounded-3xl border border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-900/30 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-24 h-24 text-indigo-400" />
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center mb-4 text-indigo-300 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white mb-1 group-hover:text-indigo-300 transition-colors">
                  🔒🔧 Decrypt + 3D Fix
                </h3>
                <p className="text-xs text-purple-300/70 leading-relaxed mb-6">
                  Extract resource scripts and automatically execute 3D model vertex repair in one combined workflow.
                </p>
              </div>

              <button className="w-full py-2.5 rounded-xl bg-indigo-600/30 group-hover:bg-indigo-600 text-indigo-200 group-hover:text-white font-bold text-xs border border-indigo-500/40 transition-all flex items-center justify-center gap-2">
                <span>Run Combo Tool</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* TOOL CARD 3: 3D FIXER */}
            <div
              onClick={() => { setActiveToolModal('fixer'); setJobStatus('idle'); }}
              className="glass-panel p-6 rounded-3xl border border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-900/30 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wrench className="w-24 h-24 text-emerald-400" />
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mb-4 text-emerald-300 group-hover:scale-110 transition-transform">
                  <Wrench className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white mb-1 group-hover:text-emerald-300 transition-colors">
                  🔧 3D Model Fixer
                </h3>
                <p className="text-xs text-purple-300/70 leading-relaxed mb-6">
                  Repair corrupted vertex boundaries and mesh attributes for 3D model files (<code className="text-emerald-300">.ydr</code>, <code className="text-emerald-300">.ydd</code>, <code className="text-emerald-300">.yft</code>).
                </p>
              </div>

              <button className="w-full py-2.5 rounded-xl bg-emerald-600/30 group-hover:bg-emerald-600 text-emerald-200 group-hover:text-white font-bold text-xs border border-emerald-500/40 transition-all flex items-center justify-center gap-2">
                <span>Open 3D Fixer</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

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
                  ) : filteredDecryptions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-purple-400/60">
                        <FileCode className="w-8 h-8 text-purple-500/40 mx-auto mb-2" />
                        <span>No decryptions found. Use the web tools above or dispatch files in Discord to see history here!</span>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {dataLoading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-purple-300">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                        <span>Loading records...</span>
                      </td>
                    </tr>
                  ) : dashboardData.fixes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-purple-400/60">
                        <Wrench className="w-8 h-8 text-purple-500/40 mx-auto mb-2" />
                        <span>No vertex fix history found. Run the 3D Fixer above or in Discord to repair models!</span>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      {/* ── INTERACTIVE PROCESSING MODAL ── */}
      {activeToolModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel-glow border border-purple-500/40 rounded-3xl max-w-xl w-full p-6 sm:p-8 relative shadow-[0_0_50px_rgba(168,85,247,0.3)]">
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 text-purple-300/70 hover:text-white p-2 rounded-xl glass-card border border-purple-500/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                {activeToolModal === 'fixer' ? <Wrench className="w-5 h-5" /> : <FileCode className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  {activeToolModal === 'decrypt' ? '🔒 Decrypt Resource' : activeToolModal === 'decryptfix' ? '🔒🔧 Decrypt + 3D Fix' : '🔧 3D Model Fixer'}
                </h3>
                <p className="text-xs text-purple-300/70">
                  {activeToolModal === 'fixer' ? 'Repair 3D model vertices' : 'Extract & decrypt resource files'}
                </p>
              </div>
            </div>

            {/* STATUS NOTIFICATIONS */}
            {jobStatus === 'error' && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Processing Failed</span>
                  <span>{jobErrorMessage}</span>
                </div>
              </div>
            )}

            {jobStatus === 'success' && (
              <div className="mb-6 p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white mb-1">Job Completed Successfully!</h4>
                <p className="text-purple-200/80 mb-4">Your processed resource file is ready for download.</p>

                <div className="flex items-center justify-center gap-3">
                  {resultDownloadUrl && (
                    <a
                      href={resultDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
                    >
                      Download File
                    </a>
                  )}
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl glass-card border border-purple-500/30 text-purple-200 text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {(jobStatus === 'uploading' || jobStatus === 'processing') && (
              <div className="mb-6 p-6 rounded-2xl glass-card border border-purple-500/30 text-center">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">
                  {jobStatus === 'uploading' ? `Uploading File... ${uploadProgress}%` : 'Processing File on VPS Engine...'}
                </h4>
                <p className="text-xs text-purple-300/70 mb-4">
                  {jobStatus === 'uploading' ? 'Uploading resource package...' : 'Executing resource extraction & vertex repairs...'}
                </p>

                {jobStatus === 'uploading' && (
                  <div className="w-full bg-purple-950/60 rounded-full h-2 overflow-hidden border border-purple-500/30">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            {jobStatus !== 'success' && jobStatus !== 'uploading' && jobStatus !== 'processing' && (
              <div className="space-y-6">
                {/* INPUT MODE SELECTION */}
                <div>
                  <label className="block text-xs font-mono uppercase text-purple-300/80 mb-2">1. Select Input Source</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setInputMode('upload')}
                      className={`p-3 rounded-2xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                        inputMode === 'upload'
                          ? 'bg-purple-600/40 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          : 'glass-card border-purple-500/30 text-purple-300/70 hover:text-white'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Local .Zip</span>
                    </button>
                    <button
                      onClick={() => setInputMode('url')}
                      className={`p-3 rounded-2xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                        inputMode === 'url'
                          ? 'bg-purple-600/40 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          : 'glass-card border-purple-500/30 text-purple-300/70 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>Paste File Link</span>
                    </button>
                  </div>
                </div>

                {/* INPUT FIELDFORM */}
                {inputMode === 'upload' ? (
                  <div>
                    <div className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-2xl p-6 text-center glass-card relative transition-colors">
                      <input
                        type="file"
                        accept=".zip,.rar,.7z"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <span className="text-xs font-semibold text-purple-200 block mb-1">
                        {selectedFile ? selectedFile.name : 'Click or Drag & Drop local .zip file here'}
                      </span>
                      <span className="text-[10px] text-purple-400/60 block font-mono">
                        {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB selected` : 'Supports large resource files up to 1 GB+'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-purple-300/70 mb-1">Supported: GoFile, MediaFire, Catbox, Pixeldrain</label>
                    <input
                      type="url"
                      value={fileUrlInput}
                      onChange={(e) => setFileUrlInput(e.target.value)}
                      placeholder="https://gofile.io/d/..."
                      className="w-full px-4 py-2.5 rounded-xl glass-card border border-purple-500/30 text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                )}

                {/* KEY TYPE SELECTION (FOR DECRYPT & DECRYPTFIX) */}
                {activeToolModal !== 'fixer' && (
                  <div>
                    <label className="block text-xs font-mono uppercase text-purple-300/80 mb-2">2. Decryption Key Method</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        onClick={() => setKeyType('none')}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          keyType === 'none'
                            ? 'bg-purple-600/40 border-purple-400 text-white'
                            : 'glass-card border-purple-500/30 text-purple-300/70 hover:text-white'
                        }`}
                      >
                        Auto / No Key
                      </button>
                      <button
                        onClick={() => setKeyType('cfxkey')}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          keyType === 'cfxkey'
                            ? 'bg-purple-600/40 border-purple-400 text-white'
                            : 'glass-card border-purple-500/30 text-purple-300/70 hover:text-white'
                        }`}
                      >
                        CFX Key
                      </button>
                      <button
                        onClick={() => setKeyType('grants')}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          keyType === 'grants'
                            ? 'bg-purple-600/40 border-purple-400 text-white'
                            : 'glass-card border-purple-500/30 text-purple-300/70 hover:text-white'
                        }`}
                      >
                        Grants.txt
                      </button>
                    </div>

                    {keyType === 'cfxkey' && (
                      <input
                        type="text"
                        value={keyDataInput}
                        onChange={(e) => setKeyDataInput(e.target.value)}
                        placeholder="Enter CFX License Key (e.g. cfxk_...)"
                        className="w-full px-4 py-2 rounded-xl glass-card border border-purple-500/30 text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
                      />
                    )}

                    {keyType === 'grants' && (
                      <div className="space-y-3">
                        <div className="border border-dashed border-purple-500/40 hover:border-purple-400 rounded-xl p-3 text-center glass-card relative transition-colors">
                          <input
                            type="file"
                            accept=".txt"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (!file.name.toLowerCase().endsWith('.txt')) {
                                  setJobErrorMessage('Only .txt files are accepted for Grants.txt.');
                                  setJobStatus('error');
                                  return;
                                }
                                setGrantsFileName(file.name);
                                setJobErrorMessage('');
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  setKeyDataInput((evt.target?.result as string) || '');
                                };
                                reader.readAsText(file);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <FileText className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                          <span className="text-xs font-semibold text-purple-200 block">
                            {grantsFileName ? `Selected: ${grantsFileName}` : 'Upload grants.txt file (.txt only)'}
                          </span>
                          <span className="text-[10px] text-purple-400/60 block font-mono">
                            {grantsFileName ? 'Text loaded automatically' : 'Click to select your .txt grants file'}
                          </span>
                        </div>

                        <textarea
                          rows={3}
                          value={keyDataInput}
                          onChange={(e) => setKeyDataInput(e.target.value)}
                          placeholder="Or paste grants.txt lines manually here..."
                          className="w-full px-4 py-2 rounded-xl glass-card border border-purple-500/30 text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-400 font-mono"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  onClick={handleStartJob}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Execute {activeToolModal === 'fixer' ? '3D Fix' : activeToolModal === 'decryptfix' ? 'Decrypt + Fix' : 'Decryption'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
