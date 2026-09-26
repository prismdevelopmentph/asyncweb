'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import {
  Copy,
  Search,
  Clock,
  Info,
  ChevronDown,
  Sparkles,
  Key,
  RefreshCw,
  Lock,
  LogIn,
  X,
  CheckCircle2
} from 'lucide-react';

// --- Official Brand Icon Components (SimpleIcons Vectors) ---
const SteamIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.265 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.057a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.793 8.18 1.793 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
);

const RockstarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.971 6.816h3.241c1.469 0 2.741-.448 2.741-2.084 0-1.3-1.117-1.576-2.19-1.576H6.748l-.777 3.66Zm12.834 8.753h5.168l-4.664 3.228.755 5.087-4.041-3.07L10.599 24l2.536-5.392s-2.95-3.075-2.947-3.075c-.198-.262-.265-.936-.265-1.226 0-.367.024-.739.049-1.134.028-.451.058-.933.058-1.476 0-1.338-.59-2.038-2.036-2.038H5.283l-1.18 5.525H.026L3.269 0h7.672c2.852 0 5.027.702 5.027 3.936 0 2.276-1.12 3.894-3.592 4.233v.045c1.162.276 1.598 1.062 1.598 2.527 0 .585-.018 1.098-.034 1.581-.015.428-.03.834-.03 1.243 0 .525.137 1.382.48 1.968h.567l3.028-5.06.82 5.096Zm-1.233-2.948-2.187 3.654h-3.457l2.103 2.189-1.73 3.672 3.777-2.218 2.976 2.263-.553-3.731 3.093-2.139h-3.43l-.592-3.69Z" />
  </svg>
);

const NetflixIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="m5.398 0 8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398zm8.489 0v9.172l4.715 13.33V0h-4.715zM5.398 1.5V24c1.873-.225 2.81-.312 4.715-.398V14.83L5.398 1.5z" />
  </svg>
);

const CyberGhostIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.705 2.349a4.874 4.874 0 00-4.39 2.797L6.033 7.893h14.606c.41 0 .692.308.692.668 0 .359-.282.666-.692.666H2.592L0 14.772h2.824c-.796 1.72-1.002 2.567-1.002 3.26 0 2.105 1.72 3.62 4.416 3.62h8.239c1.771 0 3.337-1.412 3.337-3.03 0-1.411-1.206-2.515-2.772-2.515H5.596c-.873 0-1.284-.59-.924-1.335h11.859c4.004 0 7.469-3.029 7.469-6.802 0-3.183-2.618-5.621-6.16-5.621z" />
  </svg>
);

const ValorantIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.053 0l7.632 17.509h-3.41L.643 0h3.41zm15.894 0L12.316 17.509h3.41L23.357 0h-3.41zM11.973 24l-3.864-8.868h7.728L11.973 24z" />
  </svg>
);

// --- Types ---
interface HistoryItem {
  id: string;
  service: string;
  date: string;
  dataText: string;
}

export default function AccountGeneratorPage() {
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Live Generator State
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Account Generated Popup Modal State
  const [generatedModal, setGeneratedModal] = useState<{
    service: string;
    dataText: string;
  } | null>(null);

  const [userPlan, setUserPlan] = useState<{
    hasPlan: boolean;
    name: string;
    expiresAt: string | null;
    dailyUsed: number;
    dailyLimit: number;
  }>({
    hasPlan: false,
    name: 'No active plan',
    expiresAt: null,
    dailyUsed: 0,
    dailyLimit: 0,
  });

  const [stock, setStock] = useState({
    steam: 0,
    discord: 0,
    rockstar: 0,
    cyberghost: 0,
    netflix: 0,
    valorant: 0,
  });

  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);

  // UI Component States
  const [historySearch, setHistorySearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Get Discord User ID
  const discordUserId = useMemo(() => {
    if (!user) return null;
    return user.user_metadata?.provider_id || user.user_metadata?.sub || user.id;
  }, [user]);

  // Fast Parallel Status Fetcher
  const fetchStatus = useCallback(async (uid: string | null) => {
    setLoadingStatus(true);
    try {
      const url = uid ? `/api/generator/status?userId=${encodeURIComponent(uid)}` : '/api/generator/status';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.userPlan) setUserPlan(data.userPlan);
        if (data.stock) setStock(data.stock);
        if (Array.isArray(data.history)) setHistoryList(data.history);
      }
    } catch (err) {
      console.error('[Generator Page] Error fetching status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  // Block background scrolling and handle Escape key when Modal is open
  useEffect(() => {
    if (generatedModal) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setGeneratedModal(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [generatedModal]);

  // Instant Mount Execution: Fetch stock immediately in parallel on mount
  useEffect(() => {
    fetchStatus(null);

    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
      if (user) {
        const uid = user.user_metadata?.provider_id || user.user_metadata?.sub || user.id;
        fetchStatus(uid);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sUser = session?.user ?? null;
      setUser(sUser);
      setAuthLoading(false);
      const uid = sUser ? (sUser.user_metadata?.provider_id || sUser.user_metadata?.sub || sUser.id) : null;
      fetchStatus(uid);
    });

    return () => subscription.unsubscribe();
  }, [fetchStatus]);

  // Discord OAuth Login Handler
  const handleDiscordLogin = async () => {
    setAuthLoading(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  };

  // Account Claim / Generation Handler
  const handleClaimAccount = async (serviceName: string, currentStock: number) => {
    if (!user) {
      triggerToast('Please log in with Discord first');
      return;
    }

    if (!userPlan.hasPlan) {
      triggerToast('No active plan found. Redeem a key or check roles.');
      return;
    }

    if (currentStock <= 0) {
      triggerToast(`${serviceName} is currently out of stock`);
      return;
    }

    if (claiming) return;

    setClaiming(true);
    triggerToast(`Generating ${serviceName} account...`);

    try {
      const res = await fetch('/api/generator/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: discordUserId,
          serviceName
        })
      });

      const json = await res.json();
      if (!res.ok) {
        triggerToast(json.error || `Failed to generate ${serviceName}`);
      } else {
        // Open Popup Modal with raw account details
        setGeneratedModal({
          service: json.service || serviceName,
          dataText: json.accountData
        });
        triggerToast(`Successfully generated ${serviceName} account!`);
        fetchStatus(discordUserId);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error claiming account.');
    } finally {
      setClaiming(false);
    }
  };

  // Copy text helper
  const handleCopyText = (text: string, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    triggerToast(label);
  };

  // Services Config Grid (Steam, Discord, Rockstar, CyberGhost, Netflix, Valorant)
  const servicesConfig = [
    {
      id: 'steam',
      name: 'Steam',
      icon: SteamIcon,
      leftCount: stock.steam,
      color: 'text-[#66c0f4]',
      bgGlow: 'hover:border-[#66c0f4]/50 hover:shadow-[0_0_20px_rgba(102,192,244,0.15)]'
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: DiscordIcon,
      leftCount: stock.discord,
      color: 'text-[#5865f2]',
      bgGlow: 'hover:border-[#5865f2]/50 hover:shadow-[0_0_20px_rgba(88,101,242,0.15)]'
    },
    {
      id: 'rockstar',
      name: 'Rockstar',
      icon: RockstarIcon,
      leftCount: stock.rockstar,
      color: 'text-[#ffab00]',
      bgGlow: 'hover:border-[#ffab00]/50 hover:shadow-[0_0_20px_rgba(255,171,0,0.15)]'
    },
    {
      id: 'cyberghost',
      name: 'CyberGhost',
      icon: CyberGhostIcon,
      leftCount: stock.cyberghost,
      color: 'text-[#10b981]',
      bgGlow: 'hover:border-[#10b981]/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]'
    },
    {
      id: 'netflix',
      name: 'Netflix',
      icon: NetflixIcon,
      leftCount: stock.netflix,
      color: 'text-[#e50914]',
      bgGlow: 'hover:border-[#e50914]/50 hover:shadow-[0_0_20px_rgba(229,9,20,0.15)]'
    },
    {
      id: 'valorant',
      name: 'Valorant',
      icon: ValorantIcon,
      leftCount: stock.valorant,
      color: 'text-[#ff4655]',
      bgGlow: 'hover:border-[#ff4655]/50 hover:shadow-[0_0_20px_rgba(255,70,85,0.15)]'
    }
  ];

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      const matchesType = typeFilter === 'all' || item.service.toLowerCase().includes(typeFilter.toLowerCase());
      const matchesSearch =
        !historySearch.trim() ||
        item.service.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.dataText.toLowerCase().includes(historySearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [historyList, typeFilter, historySearch]);

  return (
    <div className="min-h-screen bg-[#06040b] text-[#f4f0ff] relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Ambient Background Grid & Glowing Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none z-0 animate-grid-pulse" />
      <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[140px] pointer-events-none z-0 animate-orb-slow" />
      <div className="absolute top-1/3 -right-32 w-[550px] h-[550px] rounded-full bg-violet-600/15 blur-[130px] pointer-events-none z-0 animate-orb-reverse" />
      <div className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full bg-fuchsia-600/10 blur-[150px] pointer-events-none z-0 animate-orb-slow" />

      {/* Top Header Navigation */}
      <Navbar />

      {/* Main Workspace Canvas */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        
        {/* Top Status Ribbon */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 glass-ultra rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-inner">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Account Generator
                </h1>
              </div>
              <p className="text-xs text-purple-300/60 font-medium">
                Instant multi-service account generation & license key manager
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-purple-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="font-medium text-[11px]">Generator Engine Online</span>
            </div>

            {user && (
              <button
                onClick={() => fetchStatus(discordUserId)}
                disabled={loadingStatus}
                className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-purple-300 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Refresh Records"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Auth Check Screen */}
        {!user && !authLoading ? (
          <div className="glass-ultra rounded-3xl p-10 sm:p-16 border border-white/[0.08] text-center my-12 relative overflow-hidden shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-fuchsia-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6 text-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.25)]">
              <Lock className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Authentication Required
            </h2>
            <p className="text-purple-200/70 max-w-md mx-auto text-sm mb-8 leading-relaxed">
              Connect your Discord account to access the Account Generator, manage license keys, and view generated account details.
            </p>
            <button
              onClick={handleDiscordLogin}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-3 mx-auto shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all hover:scale-105 active:scale-95"
            >
              <LogIn size={18} />
              Login with Discord
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Panel 1: Generator Main Panel */}
            <section className="glass-ultra rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-2xl relative overflow-hidden">
              
              {/* Header Title & Active Plan */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Generator</h2>
                  <p className="text-xs text-purple-300/60">
                    {userPlan.hasPlan ? `${userPlan.name} · expires ${userPlan.expiresAt || 'Never'}` : 'No active plan'}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* 6 Core Service Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                  {servicesConfig.map((svc) => {
                    const IconComp = svc.icon;
                    const isOutOfStock = svc.leftCount === 0;
                    return (
                      <button
                        key={svc.id}
                        disabled={claiming}
                        onClick={() => handleClaimAccount(svc.name, svc.leftCount)}
                        className={`glass-card p-4 rounded-2xl border border-purple-500/20 flex flex-col items-center justify-center text-center transition-all duration-200 group relative ${svc.bgGlow} ${
                          isOutOfStock
                            ? 'opacity-60 hover:bg-purple-950/30'
                            : 'hover:bg-purple-900/30 hover:-translate-y-1'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center mb-3 shadow-inner ${svc.color}`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-semibold text-white group-hover:text-purple-200 transition-colors truncate w-full">
                          {svc.name}
                        </div>
                        <div className={`text-[11px] mt-1 font-medium ${isOutOfStock ? 'text-rose-400 font-semibold' : 'text-purple-300/60'}`}>
                          {isOutOfStock ? '0 left' : `${svc.leftCount.toLocaleString()} left`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generator Panel Footer */}
              <div className="flex items-center justify-between text-xs text-purple-300/50 pt-5 mt-6 border-t border-purple-500/15">
                <div className="font-medium">
                  Daily: <span className="text-purple-200">{userPlan.dailyUsed}/{userPlan.dailyLimit}</span>
                </div>
                <div className="font-medium">Resets at midnight</div>
              </div>
            </section>

            {/* Panel 2: Generation History Panel */}
            <section className="glass-ultra rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-2xl">
              
              {/* Panel Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Clock size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Generation History</h2>
                  <p className="text-xs text-purple-300/60">Your last 100 generated accounts</p>
                </div>
              </div>

              {/* Notice Callout */}
              <div className="glass-card rounded-2xl p-4 border border-purple-500/20 bg-purple-950/20 flex items-center gap-3 mb-6 text-xs text-purple-200/90">
                <Info size={16} className="text-purple-400 shrink-0" />
                <div>
                  History is automatically cleared every 5 days. <strong className="text-white font-semibold">Copy anything you want to keep.</strong>
                </div>
              </div>

              {/* History Toolbar (Filter & Search) */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3 flex-1">
                  {/* Type Filter Select */}
                  <div className="relative">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="appearance-none bg-purple-950/40 border border-purple-500/30 rounded-xl px-4 py-2.5 pr-8 text-xs font-medium text-purple-100 focus:outline-none focus:border-purple-400 cursor-pointer min-w-[130px]"
                    >
                      <option value="all" className="bg-[#120a24]">All types</option>
                      <option value="steam" className="bg-[#120a24]">Steam</option>
                      <option value="discord" className="bg-[#120a24]">Discord</option>
                      <option value="rockstar" className="bg-[#120a24]">Rockstar</option>
                      <option value="cyberghost" className="bg-[#120a24]">CyberGhost</option>
                      <option value="netflix" className="bg-[#120a24]">Netflix</option>
                      <option value="valorant" className="bg-[#120a24]">Valorant</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                  </div>

                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/60" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full bg-purple-950/40 border border-purple-500/30 rounded-xl pl-9 pr-4 py-2.5 text-xs text-purple-100 placeholder-purple-400/40 focus:outline-none focus:border-purple-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Account Count Badge */}
              <div className="text-xs text-purple-300/50 mb-3 font-medium">
                {filteredHistory.length} account{filteredHistory.length !== 1 ? 's' : ''}
              </div>

              {/* History Items List */}
              <div className="space-y-3">
                {filteredHistory.length === 0 ? (
                  <div className="p-8 text-center text-xs text-purple-300/40 border border-dashed border-purple-500/20 rounded-2xl">
                    No generation history found.
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className="glass-card rounded-2xl p-4 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-purple-500/40 transition-all"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-white shrink-0 font-bold text-sm">
                          {item.service[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-white">{item.service}</span>
                            <span className="text-[11px] text-purple-300/40">{item.date}</span>
                          </div>
                          <div className="text-xs text-purple-200/80 font-mono break-all leading-relaxed">
                            {item.dataText}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyText(item.dataText)}
                        className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 font-medium text-xs flex items-center gap-1.5 shrink-0 self-end sm:self-center transition-all hover:scale-105 active:scale-95"
                      >
                        <Copy size={13} />
                        Copy
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Main Site Footer */}
      <Footer />

      {/* Account Generated Modal (Disables/Blocks Background Input) */}
      {generatedModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden"
        >
          {/* Backdrop Click Dismiss */}
          <div
            className="absolute inset-0 z-0"
            onClick={() => setGeneratedModal(null)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-lg glass-ultra rounded-3xl p-6 sm:p-8 border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-in fade-in zoom-in-95 duration-200 text-left">
            
            {/* Top Close Icon Button */}
            <button
              onClick={() => setGeneratedModal(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-300 hover:text-white hover:bg-purple-900/40 transition-all"
              aria-label="Close Modal"
            >
              <X size={16} />
            </button>

            {/* Modal Title */}
            <div className="pr-8 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {generatedModal.service} Account Generated
              </h3>
            </div>

            {/* Inner Raw Account Code Box */}
            <div className="bg-purple-950/70 border border-purple-500/30 rounded-2xl p-4 font-mono text-xs text-purple-100 break-all select-all leading-relaxed shadow-inner my-5">
              {generatedModal.dataText}
            </div>

            {/* Action Buttons: Copy & Close */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleCopyText(generatedModal.dataText, 'Account credentials copied!')}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:scale-[1.02] active:scale-95"
              >
                <Copy size={15} />
                Copy
              </button>

              <button
                onClick={() => setGeneratedModal(null)}
                className="flex-1 py-3 rounded-xl bg-purple-950/70 hover:bg-purple-900/70 border border-purple-500/30 text-purple-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-950/90 border border-purple-400/40 text-purple-100 text-xs px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.4)] backdrop-blur-md animate-bounce">
          {toast}
        </div>
      )}
    </div>
  );
}
