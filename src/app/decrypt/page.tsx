'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  X,
  Terminal,
  Activity,
  ChevronRight,
  Download,
  Clock,
  Cpu,
  Shield,
  Sliders,
  ExternalLink,
  Info,
  LogIn
} from 'lucide-react';

const IS_MAINTENANCE_MODE = true;

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [avatarSrc, setAvatarSrc] = useState<string>('/images/Profile.png');
  const [activeNavTab, setActiveNavTab] = useState<'tools' | 'history'>('tools');
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
  const [activeToolModal, setActiveToolModal] = useState<'decrypt' | 'decryptfix' | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [keyType, setKeyType] = useState<'none' | 'cfxkey' | 'grants'>('none');
  const [keyDataInput, setKeyDataInput] = useState('');
  const [grantsFileName, setGrantsFileName] = useState('');

  // Job execution state
  const [jobStatus, setJobStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobLogs, setJobLogs] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [currentPhase, setCurrentPhase] = useState<string>('Initializing processing pipeline...');
  const [jobErrorMessage, setJobErrorMessage] = useState('');
  const [resultDownloadUrl, setResultDownloadUrl] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);

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

  const CACHE_TTL_MS = 3600000; // 1 hour TTL

  // 2. Fetch user-specific data when user is present
  const fetchDashboardData = async (userId: string, forceRefresh = false) => {
    if (!userId) return;

    const cacheKey = `async_dash_cache_${userId}`;

    if (!forceRefresh) {
      try {
        const cachedStr = sessionStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
            setDashboardData(cached.data);
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
      const res = await fetch(`/api/dashboard-data?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        const dataObj = {
          isOwner: json.isOwner || false,
          decryptions: json.decryptions || [],
          fixes: json.fixes || [],
          plans: json.plans || [],
          usage: json.usage || { weekly: 0, monthly: 0 }
        };
        setDashboardData(dataObj);
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: dataObj }));
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
      const isOwnerCheck = discordUserId === '719482630633947166' || discordUserId === process.env.NEXT_PUBLIC_OWNER_USER_ID;
      if (!IS_MAINTENANCE_MODE || isOwnerCheck) {
        fetchDashboardData(discordUserId);
      }
    }
  }, [user]);

  // Auto-scroll terminal log
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [jobLogs]);

  // Handle Form Submit
  const handleStartProcess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !activeToolModal) return;

    setJobErrorMessage('');
    setResultDownloadUrl('');
    setUploadProgress(0);
    setJobProgress(0);
    setCurrentFile('');
    setCurrentPhase('Initializing pipeline dispatch...');

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

      try {
        setJobStatus('uploading');
        setJobLogs([`[Upload] Starting direct browser stream: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`]);

        const uploadResult = await uploadToGofile(selectedFile, (percent) => {
          setUploadProgress(percent);
        });
        targetFileUrl = uploadResult.downloadPage;
        setJobLogs((prev) => [...prev, `[Upload] Complete: Package hosted on GoFile storage node.`]);
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
    setJobProgress(10);
    setJobLogs((prev) => [...prev, '[Init] Dispatching job to processing engine...']);
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

      const jobId = json.jobId;

      if (!jobId) {
        setResultDownloadUrl(json.downloadUrl || targetFileUrl);
        setJobStatus('success');
        fetchDashboardData(discordUserId);
        return;
      }

      // Live Polling
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/job-status?jobId=${encodeURIComponent(jobId)}&userId=${encodeURIComponent(discordUserId)}&fileName=${encodeURIComponent(targetFileName)}&toolType=${encodeURIComponent(activeToolModal)}&keyType=${encodeURIComponent(keyType)}`
          );
          if (statusRes.ok) {
            const statusJson = await statusRes.json();
            if (statusJson.progress !== undefined) {
              setJobProgress(Math.max(10, statusJson.progress));
            }
            if (Array.isArray(statusJson.log)) {
              let latestFile = '';
              let latestPhase = '';

              const cleaned = statusJson.log.map((line: string) => {
                let text = line
                  .replace(/\[job_[a-z0-9_]+\]\s*/gi, '')
                  .replace(/C:\\Users\\[^\s\\]+\\Downloads\\[^\s]+\\?/gi, '')
                  .replace(/api-work\\[^\s]+\\?/gi, '')
                  .trim();

                const jsonMatch = text.match(/\{.*\}$/);
                if (jsonMatch) {
                  try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    const timePrefix = text.slice(0, text.indexOf('{')).trim();

                    if (parsed.currentFile) latestFile = parsed.currentFile;
                    if (parsed.phase) latestPhase = parsed.phase;

                    const fileStr = parsed.currentFile ? `: ${parsed.currentFile}` : '';
                    const countStr = parsed.total ? ` (${parsed.current || 0}/${parsed.total})` : '';
                    const phaseStr = parsed.phase || 'Processing';

                    return `${timePrefix} ${phaseStr}${fileStr}${countStr}`.trim();
                  } catch (_) {
                    const cfMatch = text.match(/"currentFile"\s*:\s*"([^"]+)"/);
                    const phMatch = text.match(/"phase"\s*:\s*"([^"]+)"/);
                    if (cfMatch) latestFile = cfMatch[1];
                    if (phMatch) latestPhase = phMatch[1];

                    text = text.slice(0, text.indexOf('{')).trim() + ' Processing resource files...';
                  }
                }

                if (text.includes('Resource:')) {
                  const resName = text.split('Resource:')[1]?.trim();
                  if (resName) latestFile = resName;
                }

                return text;
              });

              if (latestFile) setCurrentFile(latestFile);
              if (latestPhase) setCurrentPhase(latestPhase);
              setJobLogs(cleaned);
            }

            if (statusJson.status === 'success') {
              clearInterval(pollInterval);
              setJobProgress(100);
              if (statusJson.resultUrl) {
                setResultDownloadUrl(statusJson.resultUrl);
              }
              setJobStatus('success');
              fetchDashboardData(discordUserId);
            } else if (statusJson.status === 'failed') {
              clearInterval(pollInterval);
              setJobErrorMessage(statusJson.error || 'Pipeline execution failed.');
              setJobStatus('error');
            }
          }
        } catch (pollErr: any) {
          console.error('Polling error:', pollErr);
        }
      }, 1500);

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
    setJobLogs([]);
    setCurrentFile('');
    setJobErrorMessage('');
    setResultDownloadUrl('');
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans relative overflow-hidden dev-grid-bg">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 w-full flex flex-col items-center justify-center py-20 text-center relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
            <span>INITIALIZING SECURE SESSION...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // User details
  const discordUserId = user?.user_metadata?.provider_id || user?.user_metadata?.sub || user?.id;
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Discord User';
  const activePlan = dashboardData.plans && dashboardData.plans.length > 0 ? dashboardData.plans[0] : null;
  const isOwner = Boolean(
    dashboardData.isOwner ||
    (discordUserId && (discordUserId === '719482630633947166' || discordUserId === process.env.NEXT_PUBLIC_OWNER_USER_ID))
  );
  const hasActiveSubscription = isOwner || activePlan != null;

  // Maintenance Gate: Non-owner users are restricted while maintenance mode is active
  if (IS_MAINTENANCE_MODE && !isOwner) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans relative overflow-hidden dev-grid-bg">
        <Navbar />

        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 w-full flex flex-col items-center justify-center py-20 text-center relative z-10">
          <div className="bg-zinc-950 rounded-2xl p-8 sm:p-12 max-w-xl w-full border border-zinc-800 shadow-2xl relative overflow-hidden">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-mono mb-6">
              <Wrench className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>SYSTEM MAINTENANCE</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
              Decrypt Engine Under Maintenance
            </h1>

            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-8">
              The Lua Script Decryptor and 3D Vertex Repair tools are currently undergoing scheduled maintenance and upgrades. Decryption services will be back online shortly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              {!user && (
                <button
                  onClick={() => { window.location.href = '/api/auth/discord/login'; }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Owner Login</span>
                </button>
              )}

              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-xs transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                <span>Back to Home</span>
              </Link>

              <Link
                href="/generator"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>Open Generator</span>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Format Tier Display
  const getTierDisplay = () => {
    if (isOwner) return { name: 'OWNER LIFETIME', badge: 'OWNER', active: true, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
    if (!activePlan) return { name: 'NO PLAN', badge: 'INACTIVE', active: false, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' };

    const key = activePlan.plan_key?.toLowerCase() || '';
    if (key.includes('lifetime')) return { name: 'LIFETIME VIP', badge: 'ACTIVE', active: true, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
    if (key.includes('month')) return { name: 'MONTHLY VIP', badge: 'ACTIVE', active: true, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
    return { name: activePlan.plan_key?.toUpperCase().replace(/_/g, ' ') || 'VIP PLAN', badge: 'ACTIVE', active: true, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
  };

  const tier = getTierDisplay();

  const planKeyStr = activePlan?.plan_key?.toLowerCase() || '';
  const isLifetime = isOwner || planKeyStr.includes('lifetime');
  const isDumperPlan = planKeyStr.includes('dumper');
  const weeklyLimit = isLifetime ? null : (isDumperPlan ? 40 : 60);
  const monthlyLimit = isLifetime ? null : (isDumperPlan ? 120 : 180);
  const weeklyUsed = dashboardData.usage?.weekly || 0;
  const monthlyUsed = dashboardData.usage?.monthly || 0;

  // Filtered decryptions & fixes
  const filteredDecryptions = dashboardData.decryptions.filter((d: any) =>
    (d.file_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.key_type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-hidden font-sans selection:bg-zinc-800 selection:text-zinc-100 dev-grid-bg">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Workspace Canvas */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        
        {/* Top Floating Status Ribbon */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-zinc-950/80 rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Async Decryptor
                </h1>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                High-performance FiveM resource decryption & 3D mesh repairing engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">Processing Engine Online</span>
            </div>

            {user && (
              <button
                onClick={() => fetchDashboardData(discordUserId)}
                disabled={dataLoading}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                title="Refresh Records"
              >
                <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Screen 1: Unauthenticated Screen */}
        {!user ? (
          <div className="bg-zinc-950 rounded-2xl p-10 sm:p-14 border border-zinc-800 text-center my-12 relative overflow-hidden shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-5 text-zinc-400">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Authentication Required
            </h2>
            <p className="text-zinc-400 max-w-md mx-auto text-xs sm:text-sm mb-6 leading-relaxed">
              Connect your Discord account to view your active subscription plans, track resource decryptions, and access processing tools.
            </p>
            <div className="inline-block">
              <DiscordLoginButton />
            </div>
          </div>
        ) : !dataLoading && !hasActiveSubscription ? (
          /* Screen 2: Subscribed Gate (No Active Subscription) */
          <div className="bg-zinc-950 rounded-2xl p-8 sm:p-12 border border-zinc-800 text-center my-8 relative overflow-hidden max-w-3xl mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Active Subscription Required</h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mb-6 leading-relaxed">
              You are signed in as <strong className="text-white">{userName}</strong> (ID: <code className="text-zinc-300 font-mono">{discordUserId}</code>), but your account does not have an active subscription.
              <br /><br />
              Please purchase a plan or contact staff in Discord to activate your key and unlock the web processing engine.
            </p>

            <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shadow-sm"
              >
                Open Discord Server
              </a>
              <button
                onClick={() => fetchDashboardData(discordUserId)}
                className="px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-xs transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
                <span>Re-check Subscription</span>
              </button>
            </div>
          </div>
        ) : (
          /* Screen 3: Subscribed & Owner Dashboard Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Elevated Sidebar (4 Cols) */}
            <aside className="lg:col-span-4 space-y-6">
              
              {/* User Identity Card */}
              <div className="bg-zinc-950/80 rounded-2xl p-5 border border-zinc-800 relative overflow-hidden shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-800 p-0.5 bg-zinc-900">
                      <Image
                        src={avatarSrc}
                        alt="Profile"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover rounded-lg"
                        onError={() => setAvatarSrc('/images/Profile.png')}
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {userName}
                      </h3>
                      {isOwner && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          OWNER
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate font-mono">
                      ID: {discordUserId}
                    </p>
                  </div>
                </div>

                {/* Subscription Tier Pill */}
                <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                      <Crown className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-mono font-medium text-zinc-500 tracking-wider">
                        Subscription Tier
                      </div>
                      <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <span>{tier.name}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${tier.color}`}>
                    {tier.badge}
                  </span>
                </div>

                {/* Expiration Note */}
                <div className="mt-2.5 text-[11px] text-zinc-500 font-mono">
                  {isLifetime || !activePlan?.expires_at
                    ? 'Permanent Access'
                    : `Expires: ${new Date(activePlan.expires_at).toLocaleDateString()}`}
                </div>

                {/* Quota Gauge */}
                <div className="mt-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-zinc-400">Weekly Usage Quota</span>
                    <span className="text-zinc-200 font-mono">
                      {weeklyLimit === null ? 'Unlimited' : `${weeklyUsed} / ${weeklyLimit}`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-purple-500 transition-all duration-500"
                      style={{ 
                        width: weeklyLimit === null ? '100%' : `${Math.min(100, (weeklyUsed / weeklyLimit) * 100)}%` 
                      }}
                    />
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                    {weeklyLimit === null ? 'No weekly usage restriction' : 'Shared decrypt & 3D fix limit'}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs Panel */}
              <nav className="bg-zinc-950/80 rounded-2xl p-2 border border-zinc-800 shadow-sm backdrop-blur-sm space-y-1">
                <button
                  onClick={() => setActiveNavTab('tools')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    activeNavTab === 'tools'
                      ? 'bg-zinc-900 border border-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>Processing Engine Tools</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </button>

                <button
                  onClick={() => setActiveNavTab('history')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    activeNavTab === 'history'
                      ? 'bg-zinc-900 border border-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>Audit Logs & History</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {dashboardData.decryptions.length + dashboardData.fixes.length}
                  </span>
                </button>

                {isOwner && (
                  <Link
                    href="/admin"
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Admin Management Console</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </Link>
                )}
              </nav>

              {/* Quick Info Box */}
              <div className="bg-zinc-950/80 rounded-2xl p-4 border border-zinc-800 text-xs text-zinc-400 space-y-2 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Info className="w-4 h-4 text-zinc-400" />
                  <span>Engine Architecture</span>
                </div>
                <p className="leading-relaxed">
                  Decryptions are processed asynchronously through isolated workers. Validated Keymaster JWT grants are automatically cached for future auto-decryptions.
                </p>
              </div>

            </aside>

            {/* Right Centered Content Canvas (8 Cols) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Stat Counters Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-950/80 rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors">
                  <div className="text-[10px] uppercase font-mono text-zinc-500 mb-1 tracking-wider">
                    Total Decryptions
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
                    {dashboardData.decryptions.length}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Outputs</span>
                  </div>
                </div>

                <div className="bg-zinc-950/80 rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors">
                  <div className="text-[10px] uppercase font-mono text-zinc-500 mb-1 tracking-wider">
                    3D Models Repaired
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
                    {dashboardData.fixes.length}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                    <Wrench className="w-3.5 h-3.5 text-purple-400" />
                    <span>Collision & Geometry</span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-zinc-950/80 rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors">
                  <div className="text-[10px] uppercase font-mono text-zinc-500 mb-1 tracking-wider">
                    Engine Status
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono flex items-center gap-2">
                    <Activity className="w-5 h-5 animate-pulse" />
                    <span>99.9%</span>
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-500 font-mono">
                    Average pipeline: 2.8s
                  </div>
                </div>
              </div>

              {/* Tool Matrix Section (2 Tools Only: Decrypt and Decrypt + Fix) */}
              {activeNavTab === 'tools' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Processing Tools</h2>
                    <p className="text-xs text-zinc-400">Select an engine workflow to start decryption or repair</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Tool 1: FiveM Decrypt */}
                    <div 
                      onClick={() => { setActiveToolModal('decrypt'); setJobStatus('idle'); }}
                      className="bg-zinc-950/80 hover:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 hover:border-purple-500/40 cursor-pointer relative overflow-hidden group transition-all duration-200 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-colors mb-4">
                          <FileCode className="w-5 h-5" />
                        </div>

                        <h3 className="text-base font-semibold text-white mb-1.5 flex items-center justify-between">
                          <span>FiveM FXAP Decrypt</span>
                          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                          Un-protect FXAP encrypted FiveM scripts. Supports Auto Grant DB Lookup, Grants.txt, or CFX License Keys.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">Client & Server</span>
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">Auto Grants</span>
                      </div>
                    </div>

                    {/* Tool 2: Decrypt + 3D Fix */}
                    <div 
                      onClick={() => { setActiveToolModal('decryptfix'); setJobStatus('idle'); }}
                      className="bg-zinc-950/80 hover:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 hover:border-purple-500/40 cursor-pointer relative overflow-hidden group transition-all duration-200 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-colors mb-4">
                          <Sparkles className="w-5 h-5" />
                        </div>

                        <h3 className="text-base font-semibold text-white mb-1.5 flex items-center justify-between">
                          <span>Decrypt + 3D Mesh Fix</span>
                          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                          Full combo pipeline: decrypts all protected scripts and repairs damaged 3D YDR/YDD vertex normals in one automated pass.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">All-in-One</span>
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">Core Cars & MLO</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Audit Logs & History Section */}
              {activeNavTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Decryption & Repair History</h2>
                      <p className="text-xs text-zinc-400">Search through your previously completed processing outputs</p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search resource name..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                      />
                    </div>
                  </div>

                  {/* History Table */}
                  <div className="bg-zinc-950/80 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                            <th className="py-3 px-4">Resource File</th>
                            <th className="py-3 px-4">Key / Engine</th>
                            <th className="py-3 px-4">Extracted</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4 text-right">Download</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-xs">
                          {dataLoading ? (
                            <tr>
                              <td colSpan={5} className="py-10 text-center text-zinc-400">
                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                                <span>Loading records...</span>
                              </td>
                            </tr>
                          ) : filteredDecryptions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-10 text-center text-zinc-500">
                                <FileCode className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                                <span>No processing history found. Run the decryption tools above or in Discord to see history here.</span>
                              </td>
                            </tr>
                          ) : (
                            filteredDecryptions.map((row: any, idx: number) => (
                              <tr key={`dec_${row.id || idx}`} className="hover:bg-zinc-900/30 transition-colors">
                                <td className="py-3 px-4 font-medium text-zinc-200 flex items-center gap-2">
                                  <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                  <span className="truncate max-w-[200px] sm:max-w-xs">{row.file_name || 'Resource.zip'}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                                    {row.key_type || 'Auto'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono text-emerald-400 font-medium">
                                  {row.decrypted ?? 0} files
                                </td>
                                <td className="py-3 px-4 text-zinc-400 font-mono">
                                  {row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {row.download_url ? (
                                    <a
                                      href={row.download_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download</span>
                                    </a>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                      {row.status || 'SUCCESS'}
                                    </span>
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

            </div>
          </div>
        )}

      </main>

      {/* Interactive Processing Execution Modal */}
      {activeToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-zinc-950 rounded-2xl border border-zinc-800 p-6 sm:p-7 shadow-2xl overflow-hidden">
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              disabled={jobStatus === 'processing' || jobStatus === 'uploading'}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
                {activeToolModal === 'decrypt' ? <FileCode className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {activeToolModal === 'decrypt' ? 'FiveM FXAP Decrypt' : 'FXAP Decrypt + 3D Mesh Fix'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {activeToolModal === 'decrypt' ? 'Extract & un-protect resource scripts' : 'Combined script extraction and 3D vertex normal repair'}
                </p>
              </div>
            </div>

            {/* STATUS: ERROR */}
            {jobStatus === 'error' && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Processing Failed</span>
                  <span>{jobErrorMessage}</span>
                </div>
              </div>
            )}

            {/* STATUS: SUCCESS */}
            {jobStatus === 'success' && (
              <div className="mb-5 p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white mb-1">Job Completed Successfully</h4>
                <p className="text-xs text-zinc-400 mb-4">Your decrypted resource file is ready for download.</p>

                <div className="flex items-center justify-center gap-3">
                  {resultDownloadUrl && (
                    <a
                      href={resultDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shadow-sm"
                    >
                      Download File
                    </a>
                  )}
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* STATUS: UPLOADING OR PROCESSING */}
            {(jobStatus === 'uploading' || jobStatus === 'processing') && (
              <div className="mb-5 p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
                <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2.5" />
                <h4 className="text-xs font-semibold text-white mb-0.5 font-mono">
                  {jobStatus === 'uploading' ? `Uploading Package... ${uploadProgress}%` : `Processing Engine... ${jobProgress}%`}
                </h4>
                <p className="text-[11px] text-zinc-400 mb-4">
                  {jobStatus === 'uploading' ? 'Streaming archive directly to storage node...' : 'Executing resource extraction, decryption & verification...'}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden mb-4">
                  <div
                    className="bg-purple-500 h-full transition-all duration-300"
                    style={{ width: `${jobStatus === 'uploading' ? uploadProgress : jobProgress}%` }}
                  />
                </div>

                {/* Active Job Information Card */}
                {jobStatus === 'processing' && (
                  <div className="mb-3.5 p-3 rounded-lg bg-black border border-zinc-800 text-left space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-zinc-500 uppercase text-[10px] tracking-wider">Active Resource:</span>
                      <span className="font-mono text-emerald-400 text-[11px] font-semibold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20 truncate max-w-[220px]">
                        {currentFile ? currentFile.split('/').pop()?.split('\\').pop() : 'Scanning Package...'}
                      </span>
                    </div>
                    {currentFile && (
                      <div className="text-[11px] font-mono text-zinc-300 truncate bg-zinc-900/60 px-2.5 py-1 rounded border border-zinc-800">
                        {currentFile}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                      <span>Status: <strong className="text-zinc-200">{currentPhase || 'Decrypting'}</strong></span>
                      <span>Progress: <strong className="text-zinc-200">{jobProgress}%</strong></span>
                    </div>
                  </div>
                )}

                {/* Terminal Console Log */}
                {jobStatus === 'processing' && jobLogs.length > 0 && (
                  <div
                    ref={terminalRef}
                    className="p-3 rounded-lg bg-black border border-zinc-800 text-left font-mono text-[11px] text-zinc-300 h-32 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-1 break-all whitespace-pre-wrap"
                  >
                    {jobLogs.map((log, idx) => (
                      <div key={idx} className="leading-tight border-b border-zinc-900 pb-0.5 last:border-0">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FORM INPUT SECTION (WHEN IDLE OR ERROR) */}
            {jobStatus !== 'success' && jobStatus !== 'uploading' && jobStatus !== 'processing' && (
              <form onSubmit={handleStartProcess} className="space-y-5">
                
                {/* 1. Input Mode Selection */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-2">1. Select Input Source</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setInputMode('upload')}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                        inputMode === 'upload'
                          ? 'bg-zinc-900 border-zinc-700 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Local .Zip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('url')}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                        inputMode === 'url'
                          ? 'bg-zinc-900 border-zinc-700 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                      }`}
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>Paste File Link</span>
                    </button>
                  </div>
                </div>

                {/* 2. File Upload / Link Form */}
                {inputMode === 'upload' ? (
                  <div>
                    <div className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 rounded-xl p-5 text-center relative transition-colors">
                      <input
                        type="file"
                        accept=".zip,.rar,.7z"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="w-6 h-6 text-zinc-400 mx-auto mb-1.5" />
                      <span className="text-xs font-medium text-zinc-200 block mb-0.5">
                        {selectedFile ? selectedFile.name : 'Click or Drag & Drop local .zip file here'}
                      </span>
                      <span className="text-[10px] text-zinc-500 block font-mono">
                        {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB selected` : 'Supports resource archives up to 1 GB+'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Supported Hosts: GoFile, MediaFire, Catbox, Pixeldrain</label>
                    <input
                      type="url"
                      value={fileUrlInput}
                      onChange={(e) => setFileUrlInput(e.target.value)}
                      placeholder="https://gofile.io/d/..."
                      className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                    />
                  </div>
                )}

                {/* 3. Decryption Key Method */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-2">2. Decryption Key Method</label>
                  <div className="grid grid-cols-3 gap-2 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setKeyType('none')}
                      className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                        keyType === 'none'
                          ? 'bg-zinc-900 border-zinc-700 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                      }`}
                    >
                      Auto / No Key
                    </button>
                    <button
                      type="button"
                      onClick={() => setKeyType('cfxkey')}
                      className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                        keyType === 'cfxkey'
                          ? 'bg-zinc-900 border-zinc-700 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                      }`}
                    >
                      CFX Key
                    </button>
                    <button
                      type="button"
                      onClick={() => setKeyType('grants')}
                      className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                        keyType === 'grants'
                          ? 'bg-zinc-900 border-zinc-700 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
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
                      className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                    />
                  )}

                  {keyType === 'grants' && (
                    <div className="space-y-2.5">
                      <div className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 rounded-xl p-3 text-center relative transition-colors">
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
                        <FileText className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
                        <span className="text-xs font-medium text-zinc-200 block">
                          {grantsFileName ? `Selected: ${grantsFileName}` : 'Upload grants.txt file (.txt only)'}
                        </span>
                        <span className="text-[10px] text-zinc-500 block font-mono">
                          {grantsFileName ? 'Text loaded automatically' : 'Click to select your .txt grants file'}
                        </span>
                      </div>

                      <textarea
                        rows={3}
                        value={keyDataInput}
                        onChange={(e) => setKeyDataInput(e.target.value)}
                        placeholder="Or paste grants.txt lines manually here..."
                        className="w-full px-3.5 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Submit Action Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Execute {activeToolModal === 'decryptfix' ? 'Decrypt + 3D Fix' : 'Decryption'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
