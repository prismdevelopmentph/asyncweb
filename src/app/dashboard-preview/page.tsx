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
  Info
} from 'lucide-react';

export default function DashboardPreviewPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [avatarSrc, setAvatarSrc] = useState<string>('/images/Profile.png');
  const [activeNavTab, setActiveNavTab] = useState<'tools' | 'history' | 'quota' | 'security'>('tools');
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

  // Auto-scroll terminal log
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [jobLogs]);

  // Handle Form Submit
  const handleStartProcess = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setJobLogs(prev => [...prev, `[Upload] Complete: Package hosted on GoFile storage node.`]);
      } catch (err: any) {
        console.error('Upload Error:', err);
        setJobErrorMessage(err.message || 'Failed to upload file.');
        setJobStatus('error');
        return;
      }
    } else {
      if (!fileUrlInput.trim()) {
        setJobErrorMessage('Please enter a valid file URL (GoFile, MediaFire, Catbox, Pixeldrain).');
        return;
      }
      targetFileUrl = fileUrlInput.trim();
      targetFileName = targetFileUrl.split('/').pop() || 'resource.zip';
    }

    // Step B: Dispatch to processing API route
    setJobStatus('processing');
    setJobProgress(10);
    setJobLogs(prev => [...prev, '[Init] Dispatching job to processing engine...']);
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
  };

  // Plan info
  const activePlan = dashboardData.plans && dashboardData.plans.length > 0 ? dashboardData.plans[0] : null;
  const isLifetime = activePlan?.plan_key?.includes('lifetime');

  const filteredDecryptions = dashboardData.decryptions.filter((d: any) =>
    (d.file_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.key_type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFixes = dashboardData.fixes.filter((f: any) =>
    (f.file_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#06040b] text-[#f4f0ff] relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* ── Level 0: Ambient Background Layer ── */}
      {/* Dynamic Animated Grid Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none z-0 animate-grid-pulse" 
      />

      {/* Floating Ambient Glowing Orbs */}
      <div 
        className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[140px] pointer-events-none z-0 animate-orb-slow"
      />
      <div 
        className="absolute top-1/3 -right-32 w-[550px] h-[550px] rounded-full bg-violet-600/15 blur-[130px] pointer-events-none z-0 animate-orb-reverse"
      />
      <div 
        className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full bg-fuchsia-600/10 blur-[150px] pointer-events-none z-0 animate-orb-slow"
      />

      {/* ── Navigation Header ── */}
      <Navbar />

      {/* ── Main Workspace Canvas ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        
        {/* Top Floating Breadcrumb & Status Ribbon */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 glass-ultra rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-inner">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Ambient Glass Dashboard
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 tracking-wider">
                    V2 Preview
                  </span>
                </h1>
              </div>
              <p className="text-xs text-purple-300/60 font-medium">
                High-performance FiveM resource decryption & 3D mesh repairing engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-purple-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="font-medium text-[11px]">Processing Engine Online</span>
            </div>

            {user && (
              <button
                onClick={() => fetchDashboardData(user.user_metadata?.provider_id || user.user_metadata?.sub || user.id)}
                disabled={dataLoading}
                className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-purple-300 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Refresh Records"
              >
                <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* ── Auth Gate ── */}
        {!user && !loading ? (
          <div className="glass-ultra rounded-3xl p-10 sm:p-16 border border-white/[0.08] text-center my-12 relative overflow-hidden shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-fuchsia-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6 text-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.25)]">
              <Lock className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Authentication Required
            </h2>
            <p className="text-purple-200/70 max-w-md mx-auto text-sm mb-8 leading-relaxed">
              Connect your Discord account to view your active subscription plans, track resource decryptions, and access processing tools.
            </p>
            <div className="inline-block transform transition-transform hover:scale-105 active:scale-95">
              <DiscordLoginButton />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ── Left Elevated Glass Sidebar (4 Cols) ── */}
            <aside className="lg:col-span-4 space-y-6">
              
              {/* User Identity Glass Card */}
              <div className="glass-ultra rounded-3xl p-6 border border-white/[0.08] relative overflow-hidden shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-500/40 p-0.5 bg-purple-950/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                      <Image
                        src={avatarSrc}
                        alt="Profile"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover rounded-xl"
                        onError={() => setAvatarSrc('/images/Profile.png')}
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#06040b] shadow-md" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-base font-bold text-white truncate">
                        {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                      </h3>
                      {dashboardData.isOwner && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                          OWNER
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-purple-300/60 truncate font-mono">
                      ID: {user?.user_metadata?.provider_id || user?.user_metadata?.sub || user?.id?.slice(0, 12)}
                    </p>
                  </div>
                </div>

                {/* Subscription Tier Pill */}
                <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-purple-300/60 tracking-wider">
                        Subscription Tier
                      </div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {activePlan ? (
                          <span className="text-purple-300">
                            {activePlan.plan_key?.toUpperCase().replace('_', ' ') || 'ACTIVE PLAN'}
                          </span>
                        ) : (
                          <span className="text-neutral-400">Free / Community</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    activePlan 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-neutral-500/10 border-neutral-500/20 text-neutral-400'
                  }`}>
                    {activePlan ? 'ACTIVE' : 'NO PLAN'}
                  </span>
                </div>

                {/* Quota Gauge */}
                <div className="mt-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
                  <div className="flex items-center justify-between text-xs mb-2 font-medium">
                    <span className="text-purple-300/70">Weekly Usage Quota</span>
                    <span className="text-white font-mono">
                      {isLifetime ? 'Unlimited' : `${dashboardData.usage?.weekly || 0} / 60`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden p-0.5">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 transition-all duration-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                      style={{ 
                        width: isLifetime ? '100%' : `${Math.min(100, ((dashboardData.usage?.weekly || 0) / 60) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Tabs Panel */}
              <nav className="glass-ultra rounded-3xl p-3 border border-white/[0.08] shadow-xl space-y-1">
                <button
                  onClick={() => setActiveNavTab('tools')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold glass-spring-btn ${
                    activeNavTab === 'tools'
                      ? 'bg-gradient-to-r from-purple-600/30 to-fuchsia-600/20 border border-purple-500/40 text-white shadow-lg'
                      : 'text-purple-200/70 hover:bg-white/[0.04] hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>Processing Engine Tools</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>

                <button
                  onClick={() => setActiveNavTab('history')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold glass-spring-btn ${
                    activeNavTab === 'history'
                      ? 'bg-gradient-to-r from-purple-600/30 to-fuchsia-600/20 border border-purple-500/40 text-white shadow-lg'
                      : 'text-purple-200/70 hover:bg-white/[0.04] hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>Audit Logs & History</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-purple-300">
                    {dashboardData.decryptions.length + dashboardData.fixes.length}
                  </span>
                </button>

                {dashboardData.isOwner && (
                  <Link
                    href="/admin"
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 glass-spring-btn"
                  >
                    <div className="flex items-center gap-3">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Admin Management Console</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </Link>
                )}
              </nav>

              {/* Quick Info Box */}
              <div className="glass-ultra rounded-3xl p-5 border border-white/[0.06] text-xs text-purple-300/70 space-y-2.5">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Info className="w-4 h-4 text-purple-400" />
                  <span>Engine Architecture</span>
                </div>
                <p className="leading-relaxed">
                  Decryptions are processed asynchronously through isolated workers. Validated Keymaster JWT grants are automatically cached for future auto-decryptions.
                </p>
              </div>

            </aside>

            {/* ── Right Centered Content Canvas (8 Cols) ── */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Stat Counters Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="glass-ultra rounded-3xl p-5 border border-white/[0.08] shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all">
                  <div className="text-[10px] uppercase font-semibold text-purple-300/60 mb-1 tracking-wider">
                    Total Decryptions
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                    {dashboardData.decryptions.length}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Outputs</span>
                  </div>
                </div>

                <div className="glass-ultra rounded-3xl p-5 border border-white/[0.08] shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all">
                  <div className="text-[10px] uppercase font-semibold text-purple-300/60 mb-1 tracking-wider">
                    3D Models Repaired
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                    {dashboardData.fixes.length}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-purple-400 font-medium">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Collision & Geometry</span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 glass-ultra rounded-3xl p-5 border border-white/[0.08] shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all">
                  <div className="text-[10px] uppercase font-semibold text-purple-300/60 mb-1 tracking-wider">
                    Engine Status
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono flex items-center gap-2">
                    <Activity className="w-6 h-6 animate-pulse" />
                    <span>99.9%</span>
                  </div>
                  <div className="mt-2 text-[11px] text-purple-300/60">
                    Average pipeline: 2.8s
                  </div>
                </div>
              </div>

              {/* ── Tool Matrix Section ── */}
              {activeNavTab === 'tools' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">Processing Tools</h2>
                      <p className="text-xs text-purple-300/60">Select an engine workflow to start decryption or repair</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Tool 1: FiveM Decrypt */}
                    <div 
                      onClick={() => setActiveToolModal('decrypt')}
                      className="glass-ultra rounded-3xl p-6 border border-white/[0.08] hover:border-purple-500/40 cursor-pointer relative overflow-hidden group glass-spring-btn shadow-xl"
                    >
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl group-hover:bg-purple-600/20 transition-all pointer-events-none" />
                      
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                        <FileCode className="w-6 h-6" />
                      </div>

                      <h3 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
                        <span>FiveM FXAP Decrypt</span>
                        <ArrowRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </h3>
                      <p className="text-xs text-purple-300/70 leading-relaxed mb-4">
                        Un-protect FXAP encrypted FiveM scripts. Supports Auto Grant DB Lookup, Grants.txt, or CFX Keys.
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-purple-400/90 font-medium">
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">Client & Server</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">Auto Grants</span>
                      </div>
                    </div>

                    {/* Tool 2: Decrypt + 3D Fix */}
                    <div 
                      onClick={() => setActiveToolModal('decryptfix')}
                      className="glass-ultra rounded-3xl p-6 border border-white/[0.08] hover:border-fuchsia-500/40 cursor-pointer relative overflow-hidden group glass-spring-btn shadow-xl"
                    >
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-fuchsia-600/10 rounded-full blur-2xl group-hover:bg-fuchsia-600/20 transition-all pointer-events-none" />
                      
                      <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-5 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6" />
                      </div>

                      <h3 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
                        <span>Decrypt + 3D Mesh Fix</span>
                        <ArrowRight className="w-4 h-4 text-fuchsia-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </h3>
                      <p className="text-xs text-purple-300/70 leading-relaxed mb-4">
                        Full combo pipeline: decrypts all protected scripts and repairs damaged 3D YDR/YDD vertex normals in one pass.
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-fuchsia-400/90 font-medium">
                        <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20">All-in-One</span>
                        <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20">Core Cars & MLO</span>
                      </div>
                    </div>

                    {/* Tool 3: Standalone 3D Mesh Fixer */}
                    <div 
                      onClick={() => setActiveToolModal('fixer')}
                      className="glass-ultra rounded-3xl p-6 border border-white/[0.08] hover:border-indigo-500/40 cursor-pointer relative overflow-hidden group glass-spring-btn shadow-xl md:col-span-2"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
                            <Wrench className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white mb-1">
                              Standalone 3D Model Repair (YDR / YDD / YFT)
                            </h3>
                            <p className="text-xs text-purple-300/70 leading-relaxed">
                              Repairs broken normals, missing collision geometry, invisible car panels, and MLO rendering glitches.
                            </p>
                          </div>
                        </div>

                        <button className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-semibold whitespace-nowrap">
                          Launch Fixer
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ── Audit Logs & History Section ── */}
              {activeNavTab === 'history' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">Decryption & Repair History</h2>
                      <p className="text-xs text-purple-300/60">Search through your previously completed processing outputs</p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search resource name..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>

                  {/* History Glass Table */}
                  <div className="glass-ultra rounded-3xl border border-white/[0.08] overflow-hidden shadow-xl">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-purple-300/70 uppercase tracking-wider">
                            <th className="py-3.5 px-4">Resource File</th>
                            <th className="py-3.5 px-4">Type / Key</th>
                            <th className="py-3.5 px-4">Date</th>
                            <th className="py-3.5 px-4 text-right">Download</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-xs">
                          {filteredDecryptions.length === 0 && filteredFixes.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-10 text-center text-purple-300/50">
                                No processing history found matching your query.
                              </td>
                            </tr>
                          ) : (
                            filteredDecryptions.map((row: any, idx: number) => (
                              <tr key={`dec_${row.id || idx}`} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                                  <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
                                  <span className="truncate max-w-[200px] sm:max-w-xs">{row.file_name || 'Resource.zip'}</span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300">
                                    {row.key_type || 'Decrypted'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-purple-300/60">
                                  {row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  {row.download_url ? (
                                    <a
                                      href={row.download_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold glass-spring-btn"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download</span>
                                    </a>
                                  ) : (
                                    <span className="text-neutral-500 text-[11px]">Expired</span>
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

      {/* ── Processing Execution Modal (Elevated Glass) ── */}
      {activeToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl glass-ultra rounded-3xl border border-purple-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden">
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              disabled={jobStatus === 'processing' || jobStatus === 'uploading'}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-purple-300 hover:text-white transition-all disabled:opacity-30"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                {activeToolModal === 'decrypt' && <FileCode className="w-5 h-5" />}
                {activeToolModal === 'decryptfix' && <Sparkles className="w-5 h-5" />}
                {activeToolModal === 'fixer' && <Wrench className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {activeToolModal === 'decrypt' && 'FiveM Resource Decryption'}
                  {activeToolModal === 'decryptfix' && 'Decrypt & 3D Mesh Repair'}
                  {activeToolModal === 'fixer' && 'Standalone 3D Model Fixer'}
                </h3>
                <p className="text-xs text-purple-300/60">
                  Execute live resource decryption & format verification
                </p>
              </div>
            </div>

            {/* Form Input Section (When Idle) */}
            {jobStatus === 'idle' && (
              <form onSubmit={handleStartProcess} className="space-y-5">
                
                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                      inputMode === 'upload'
                        ? 'bg-purple-600/40 border border-purple-500/40 text-white shadow'
                        : 'text-purple-300/70 hover:text-white'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Local .Zip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('url')}
                    className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                      inputMode === 'url'
                        ? 'bg-purple-600/40 border border-purple-500/40 text-white shadow'
                        : 'text-purple-300/70 hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>Download URL Link</span>
                  </button>
                </div>

                {/* File Dropzone or URL Input */}
                {inputMode === 'upload' ? (
                  <div className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 rounded-2xl p-6 text-center cursor-pointer transition-all bg-purple-950/10 relative">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-8 h-8 text-purple-400 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs font-semibold text-white">
                      {selectedFile ? selectedFile.name : 'Drag and drop your .zip package or click to browse'}
                    </p>
                    <p className="text-[10px] text-purple-300/50 mt-1">Direct browser stream • Up to 2GB</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-purple-300/80 mb-1.5">Direct Download Link</label>
                    <input
                      type="text"
                      value={fileUrlInput}
                      onChange={(e) => setFileUrlInput(e.target.value)}
                      placeholder="https://gofile.io/d/..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                )}

                {/* Key Type Selector (For Decrypt) */}
                {activeToolModal !== 'fixer' && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-medium text-purple-300/80">Decryption Key Authentication</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => { setKeyType('none'); setKeyDataInput(''); }}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                          keyType === 'none'
                            ? 'bg-purple-600/30 border-purple-500/50 text-white'
                            : 'bg-white/[0.02] border-white/[0.06] text-purple-300/70 hover:text-white'
                        }`}
                      >
                        Auto / DB Match
                      </button>
                      <button
                        type="button"
                        onClick={() => setKeyType('cfxkey')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                          keyType === 'cfxkey'
                            ? 'bg-purple-600/30 border-purple-500/50 text-white'
                            : 'bg-white/[0.02] border-white/[0.06] text-purple-300/70 hover:text-white'
                        }`}
                      >
                        CFX Key
                      </button>
                      <button
                        type="button"
                        onClick={() => setKeyType('grants')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                          keyType === 'grants'
                            ? 'bg-purple-600/30 border-purple-500/50 text-white'
                            : 'bg-white/[0.02] border-white/[0.06] text-purple-300/70 hover:text-white'
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
                        placeholder="cfxk_..."
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500/50 font-mono"
                      />
                    )}

                    {keyType === 'grants' && (
                      <div className="border border-white/[0.08] rounded-xl p-3 bg-white/[0.02]">
                        <input
                          type="file"
                          accept=".txt"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setGrantsFileName(f.name);
                              const reader = new FileReader();
                              reader.onload = (re) => setKeyDataInput(re.target?.result as string);
                              reader.readAsText(f);
                            }
                          }}
                          className="text-xs text-purple-300"
                        />
                      </div>
                    )}
                  </div>
                )}

                {jobErrorMessage && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{jobErrorMessage}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Start Live Decryption Pipeline
                </button>
              </form>
            )}

            {/* Progress & Live Terminal Display (Uploading / Processing / Success / Error) */}
            {jobStatus !== 'idle' && (
              <div className="space-y-6">
                
                {/* Dynamic Status Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                      <span>{jobStatus === 'uploading' ? 'Uploading Package Stream...' : currentPhase}</span>
                    </span>
                    <span className="text-purple-400 font-mono">
                      {jobStatus === 'uploading' ? `${uploadProgress}%` : `${jobProgress}%`}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden p-0.5 border border-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 transition-all duration-300 shadow-[0_0_12px_rgba(168,85,247,0.7)]"
                      style={{ width: `${jobStatus === 'uploading' ? uploadProgress : jobProgress}%` }}
                    />
                  </div>
                </div>

                {/* Live Terminal Log Box */}
                <div className="rounded-2xl bg-[#050309]/90 border border-white/[0.08] p-4 shadow-inner">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] text-[10px] text-purple-300/60 uppercase font-mono tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-purple-400" />
                      <span>Pipeline Console Output</span>
                    </div>
                    {currentFile && (
                      <span className="text-purple-300 font-semibold truncate max-w-[200px]">
                        Active: {currentFile}
                      </span>
                    )}
                  </div>
                  <div
                    ref={terminalRef}
                    className="h-44 overflow-y-auto font-mono text-[11px] text-purple-200/90 space-y-1.5 custom-scrollbar"
                  >
                    {jobLogs.length === 0 ? (
                      <div className="text-neutral-500 italic">Waiting for initial log heartbeat...</div>
                    ) : (
                      jobLogs.map((l, i) => (
                        <div key={i} className="leading-relaxed flex items-start gap-2">
                          <span className="text-purple-500 select-none">❯</span>
                          <span className="break-all">{l}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Success Card & Download Button */}
                {jobStatus === 'success' && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">Pipeline Execution Succeeded!</div>
                        <div className="text-[10px] text-emerald-300/80">Decrypted archive is ready for download</div>
                      </div>
                    </div>
                    {resultDownloadUrl && (
                      <a
                        href={resultDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#06040b] font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Result</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Error Card */}
                {jobStatus === 'error' && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                    <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">Execution Aborted</div>
                      <div className="text-[11px] text-red-300/90 leading-relaxed">{jobErrorMessage}</div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <Footer />

    </div>
  );
}
