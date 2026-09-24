'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DiscordLoginButton from '@/components/DiscordLoginButton';
import { supabase } from '@/lib/supabase';
import {
  LayoutGrid,
  Settings,
  LogOut,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Download,
  Info,
  ChevronDown,
  Sparkles,
  Zap,
  Activity,
  User,
  Shield,
  Key
} from 'lucide-react';

// --- Brand Icon Components ---
const SteamIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.064 0 .125.009.188.012l2.845-4.123v-.058c0-2.36 1.914-4.274 4.273-4.274 2.36 0 4.274 1.914 4.274 4.274 0 2.36-1.914 4.274-4.274 4.274-.08 0-.156-.01-.235-.015l-4.048 2.893c.004.054.01.107.01.161 0 1.884-1.526 3.41-3.41 3.41-1.579 0-2.91-1.074-3.303-2.529L.3 15.282C1.69 20.354 6.402 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zm-3.614 15.651c0-1.026.832-1.858 1.858-1.858s1.858.832 1.858 1.858-.832 1.858-1.858 1.858-1.858-.832-1.858-1.858zm9.324-6.697c-1.328 0-2.404-1.076-2.404-2.404s1.076-2.404 2.404-2.404 2.404 1.076 2.404 2.404-1.076 2.404-2.404 2.404z"/>
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const RockstarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.2 2.2h19.6v19.6H2.2V2.2zm12.5 13.8l-1.9-5.4h-2.6v5.4H8.4V8h5.3c2.1 0 3.6 1.2 3.6 3.1 0 1.4-.8 2.4-2.1 2.8l2.3 4.1h-2.8zm-1.9-7.3H10.2v2.4h2.6c1 0 1.6-.5 1.6-1.2 0-.8-.6-1.2-1.6-1.2z"/>
  </svg>
);

const VpnIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <rect x="9" y="10" width="6" height="5" rx="1"/>
    <path d="M12 8v2"/>
  </svg>
);

const FortniteIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 2h10v3.5H11v3.5h5v3.5h-5V22H7V2z"/>
  </svg>
);

const NetflixIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.398 0v24h4.195V10.247l5.441 13.753h4.168V0h-4.195v13.684L9.566 0z"/>
  </svg>
);

const RobloxIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.164 0L0 18.836l18.836 5.164L24 5.164 5.164 0zm7.106 14.73l-3.003-.824.825-3.004 3.003.825-.825 3.003z"/>
  </svg>
);

const ChatGptIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9 6.0651 6.0651 0 0 0-4.662-2.0104 6.06 6.06 0 0 0-5.764 4.053 6.0237 6.0237 0 0 0-4.4093 2.1332 6.04 6.04 0 0 0-.7428 5.535 6.0253 6.0253 0 0 0-.5155 4.9108 6.0461 6.0461 0 0 0 6.5097 2.9 6.065 6.065 0 0 0 4.662 2.0104 6.06 6.06 0 0 0 5.7641-4.053 6.0238 6.0238 0 0 0 4.4093-2.1332 6.04 6.04 0 0 0 .7427-5.535zm-9.022 12.6081a4.4555 4.4555 0 0 1-2.8727-1.0408l.1419-.0813 4.7792-2.7582a.79.79 0 0 0 .3927-.6813v-6.7369l2.023 1.168a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.5021 4.4959zm-9.66-3.766a4.456 4.456 0 0 1-.5365-3.0037l.142.0833 4.783 2.7582a.795.795 0 0 0 .7928 0l5.8341-3.3688v2.336a.075.075 0 0 1-.0312.0612l-4.8345 2.7913a4.5026 4.5026 0 0 1-6.1497-1.6585zm-1.2052-10.354a4.4578 4.4578 0 0 1 2.336-1.963l-.0019.1637v5.5164a.7937.7937 0 0 0 .3959.6822l5.8342 3.3688-2.023 1.168a.071.071 0 0 1-.0692.0075l-4.8346-2.7913a4.5016 4.5016 0 0 1-1.6374-6.1523zm17.0974 4.582a4.458 4.458 0 0 1-2.336 1.963l.0019-.1637v-5.5164a.7937.7937 0 0 0-.3959-.6822l-5.8342-3.3688 2.023-1.168a.071.071 0 0 1 .0692-.0075l4.8346 2.7913a4.5017 4.5017 0 0 1 1.6374 6.1523zm1.2052 3.766a4.456 4.456 0 0 1 .5365 3.0037l-.142-.0833-4.783-2.7582a.795.795 0 0 0-.7928 0l-5.8341 3.3688v-2.336a.075.075 0 0 1 .0312-.0612l4.8345-2.7913a4.5026 4.5026 0 0 1 6.1497 1.6585zm-8.6006-8.7753l-4.7792 2.7582a.79.79 0 0 0-.3927.6813v6.7369l-2.023-1.168a.071.071 0 0 1-.038-.052v-5.5826a4.5045 4.5045 0 0 1 7.2329-3.4546l-.0001.0789z"/>
  </svg>
);

const GeminiIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z"/>
  </svg>
);

// --- Types ---
interface ServiceItem {
  id: string;
  name: string;
  icon: React.ElementType;
  unlocked: boolean;
  leftCount: number;
  color: string;
}

interface HistoryItem {
  id: string;
  service: string;
  date: string;
  dataText: string;
}

export default function GenPreviewDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarSrc, setAvatarSrc] = useState<string>('/images/Profile.png');

  // Component States
  const [keyInput, setKeyInput] = useState('');
  const [keyFeedback, setKeyFeedback] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Toast State
  const [toast, setToast] = useState<string | null>(null);

  // Check initial user session matching /dashboard architecture
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

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Services Data matching screenshot layout
  const services: ServiceItem[] = [
    { id: 'steam', name: 'Steam', icon: SteamIcon, unlocked: true, leftCount: 15642, color: 'text-cyan-400' },
    { id: 'discord', name: 'Discord', icon: DiscordIcon, unlocked: true, leftCount: 0, color: 'text-indigo-400' },
    { id: 'rockstar', name: 'Rockstar', icon: RockstarIcon, unlocked: true, leftCount: 9851, color: 'text-amber-400' },
    { id: 'vpn', name: 'VPN', icon: VpnIcon, unlocked: true, leftCount: 717, color: 'text-emerald-400' },
    { id: 'fortnite', name: 'Fortnite', icon: FortniteIcon, unlocked: true, leftCount: 321, color: 'text-purple-400' },
    { id: 'netflix', name: 'Netflix', icon: NetflixIcon, unlocked: true, leftCount: 1160, color: 'text-rose-500' },
    { id: 'roblox', name: 'Roblox', icon: RobloxIcon, unlocked: true, leftCount: 172, color: 'text-blue-400' },
    { id: 'chatgpt', name: 'ChatGPT', icon: ChatGptIcon, unlocked: true, leftCount: 0, color: 'text-teal-400' },
    { id: 'gemini', name: 'Gemini', icon: GeminiIcon, unlocked: true, leftCount: 0, color: 'text-violet-400' }
  ];

  // Generation History Data
  const historyList: HistoryItem[] = [
    {
      id: 'h1',
      service: 'Netflix',
      date: 'Sep 24, 2026 · 03:18',
      dataText: 'Key: NETFLIX-8664-5BF6-2B72 | Redeem Key: https://netflixkeys.com/ | Use: Click `Open Netflix` Button'
    },
    {
      id: 'h2',
      service: 'Netflix',
      date: 'Sep 24, 2026 · 03:18',
      dataText: 'Key: NETFLIX-4533-FD2B-7825 | Redeem Key: https://netflixkeys.com/ | Use: Click `Open Netflix` Button'
    },
    {
      id: 'h3',
      service: 'Steam',
      date: 'Sep 23, 2026 · 18:40',
      dataText: 'Account: steam_user_9402:pass83910 | Auth Code: 83921 | Link: https://steampowered.com'
    },
    {
      id: 'h4',
      service: 'Rockstar',
      date: 'Sep 22, 2026 · 14:10',
      dataText: 'Account: rstar_game_910:Pass2026! | License: GTA-V-PREMIUM-FULL'
    }
  ];

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      const matchesType = typeFilter === 'all' || item.service.toLowerCase() === typeFilter.toLowerCase();
      const matchesSearch =
        !historySearch.trim() ||
        item.service.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.dataText.toLowerCase().includes(historySearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [typeFilter, historySearch]);

  const handleRedeemKey = () => {
    if (!keyInput.trim()) {
      setKeyFeedback({ msg: 'Please enter a valid key format.', type: 'err' });
      return;
    }
    if (keyInput.trim().length < 10) {
      setKeyFeedback({ msg: 'Invalid license key format.', type: 'err' });
      return;
    }
    setKeyFeedback({ msg: 'Key redeemed successfully! Netflix Gen plan active.', type: 'ok' });
    triggerToast('License Key Redeemed Successfully!');
    setKeyInput('');
  };

  const handleCopyText = (text: string, label = 'Copied to clipboard') => {
    navigator.clipboard.writeText(text);
    triggerToast(label);
  };

  // Loading screen matching /dashboard
  if (loading) {
    return (
      <div className="min-h-screen bg-[#06040b] text-purple-100 flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mb-4 animate-spin">
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
        <p className="text-xs font-mono text-purple-300 tracking-wider">INITIALIZING GENERATOR SESSION...</p>
      </div>
    );
  }

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'boks';

  return (
    <div className="min-h-screen bg-[#06040b] text-[#f4f0ff] relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-purple-200 flex flex-col justify-between">
      {/* ── Ambient Background Depth Layer matching /dashboard ── */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none z-0 animate-grid-pulse" 
      />
      <div 
        className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[140px] pointer-events-none z-0 animate-orb-slow"
      />
      <div 
        className="absolute top-1/3 -right-32 w-[550px] h-[550px] rounded-full bg-violet-600/15 blur-[130px] pointer-events-none z-0 animate-orb-reverse"
      />
      <div 
        className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full bg-fuchsia-600/10 blur-[150px] pointer-events-none z-0 animate-orb-slow"
      />

      {/* ── Navbar Component from main site ── */}
      <Navbar />

      {/* ── Main Workspace Canvas matching /dashboard padding & max-width ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full flex-1">
        {/* Top Floating Status Ribbon matching /dashboard */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 glass-ultra rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-purple-500/40 p-0.5 bg-purple-950/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <Image
                  src={avatarSrc}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded-xl"
                  onError={() => setAvatarSrc('/images/Profile.png')}
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#06040b] shadow-md" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Welcome back, <span className="purple-gradient-text">{userName}</span>
              </h1>
              <p className="text-xs text-purple-300/60 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60" />
                No active licenses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-purple-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="font-medium text-[11px]">Generator Engine Online</span>
            </div>
          </div>
        </div>

        {/* Workspace Panels matching screenshot layout */}
        <div className="space-y-6">
          {/* Panel 1: Generator Panel */}
          <section className="glass-ultra rounded-3xl p-6 border border-white/[0.08] shadow-2xl relative overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <LayoutGrid size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Generator</h2>
                <p className="text-xs text-purple-300/60">Netflix Gen plan · expires Aug 19 2126</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Callout 1: Add Another Gen */}
              <div className="glass-card rounded-2xl p-5 border border-purple-500/20 bg-purple-950/20">
                <div className="text-xs font-bold text-white mb-0.5">Add Another Gen</div>
                <p className="text-xs text-purple-300/60 mb-3.5">Gen keys and product license keys both work here.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRedeemKey()}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="flex-1 bg-[#0b0716]/80 border border-purple-500/30 rounded-xl px-4 py-2.5 text-xs font-mono text-purple-100 placeholder-purple-400/30 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  <button
                    onClick={handleRedeemKey}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all active:scale-95"
                  >
                    Redeem
                  </button>
                </div>
                {keyFeedback && (
                  <div className={`text-xs mt-2.5 font-medium flex items-center gap-1.5 ${keyFeedback.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {keyFeedback.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {keyFeedback.msg}
                  </div>
                )}
              </div>

              {/* Callout 2: Need More Generations? */}
              <div className="glass-card rounded-2xl p-5 border border-purple-500/20 bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-white mb-0.5">Need More Generations?</div>
                  <p className="text-xs text-purple-300/60 leading-relaxed">
                    Pay with card via Stripe and <strong className="text-purple-200">50 extra generations</strong> are added to your limit. They never expire and are used once your daily limit runs out.
                  </p>
                </div>
                <button
                  onClick={() => triggerToast('Redirecting to Stripe checkout...')}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 whitespace-nowrap self-start sm:self-auto shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all glass-spring-btn"
                >
                  <CreditCard size={15} />
                  <span>Buy 50 Gens</span>
                </button>
              </div>

              {/* Horizontal Grid of 9 Service Cards matching screenshot layout */}
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3 pt-2">
                {services.map((svc) => {
                  const IconComp = svc.icon;
                  const isOutOfStock = svc.leftCount === 0;
                  return (
                    <button
                      key={svc.id}
                      onClick={() => {
                        if (isOutOfStock) {
                          triggerToast(`${svc.name} is currently out of stock`);
                        } else {
                          triggerToast(`Generated ${svc.name} Account!`);
                        }
                      }}
                      className={`glass-card p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-300 group relative ${
                        isOutOfStock
                          ? 'border-purple-500/10 opacity-50 hover:bg-purple-950/20'
                          : 'border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-900/30 hover:-translate-y-1 shadow-md hover:shadow-[0_10px_25px_rgba(139,92,246,0.2)]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/20 flex items-center justify-center mb-2.5 ${svc.color}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-semibold text-purple-100 group-hover:text-white transition-colors truncate w-full">
                        {svc.name}
                      </div>
                      <div className={`text-[10px] mt-1 font-mono font-medium ${isOutOfStock ? 'text-rose-400 font-bold' : 'text-purple-300/50'}`}>
                        {isOutOfStock ? '0 left' : `${svc.leftCount} left`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generator Panel Footer */}
            <div className="flex items-center justify-between text-xs text-purple-300/50 pt-5 mt-5 border-t border-purple-500/15 font-mono">
              <div>Daily: 50/50 Netflix</div>
              <div>Resets at midnight</div>
            </div>
          </section>

          {/* Panel 2: Generation History Panel matching screenshot layout */}
          <section className="glass-ultra rounded-3xl p-6 border border-white/[0.08] shadow-2xl relative overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <Clock size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Generation History</h2>
                <p className="text-xs text-purple-300/60">Your last 100 generated accounts</p>
              </div>
            </div>

            {/* Info Notice Banner */}
            <div className="glass-card rounded-2xl p-4 border border-purple-500/20 bg-purple-950/20 flex items-center gap-3 mb-5 text-xs text-purple-200/80">
              <Info size={16} className="text-purple-400 flex-shrink-0" />
              <span>
                History is automatically cleared every 5 days. <strong className="text-purple-100">Download or copy anything you want to keep.</strong>
              </span>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full sm:w-40 bg-[#0b0716]/80 border border-purple-500/30 rounded-xl px-4 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400 appearance-none pr-9 cursor-pointer"
                >
                  <option value="all" className="bg-[#0b0716] text-purple-100">All types</option>
                  <option value="netflix" className="bg-[#0b0716] text-purple-100">Netflix</option>
                  <option value="steam" className="bg-[#0b0716] text-purple-100">Steam</option>
                  <option value="rockstar" className="bg-[#0b0716] text-purple-100">Rockstar</option>
                  <option value="vpn" className="bg-[#0b0716] text-purple-100">VPN</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-purple-400/50 pointer-events-none" />
              </div>

              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-3 text-purple-400/40" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-[#0b0716]/80 border border-purple-500/30 rounded-xl pl-9 pr-4 py-2 text-xs text-purple-100 placeholder-purple-400/30 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyText(filteredHistory.map((h) => h.dataText).join('\n'), 'All history copied to clipboard')}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-900/40 text-xs font-semibold transition-all"
                >
                  Copy all
                </button>
                <button
                  onClick={() => triggerToast('Downloading history.txt file...')}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* History Header Count */}
            <div className="text-xs text-purple-300/50 mb-3 font-mono font-medium">
              {filteredHistory.length} accounts
            </div>

            {/* History Item Rows */}
            <div className="space-y-2.5">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="glass-card rounded-2xl p-4 border border-purple-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/35 transition-all shadow-sm"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/20 flex items-center justify-center text-rose-500 flex-shrink-0 mt-0.5 sm:mt-0">
                        {item.service === 'Netflix' ? (
                          <NetflixIcon className="w-4.5 h-4.5" />
                        ) : item.service === 'Steam' ? (
                          <SteamIcon className="w-4.5 h-4.5 text-cyan-400" />
                        ) : (
                          <RockstarIcon className="w-4.5 h-4.5 text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-xs text-white">{item.service}</span>
                          <span className="text-[11px] text-purple-300/40 font-mono">{item.date}</span>
                        </div>
                        <div className="text-xs text-purple-200/90 font-mono truncate select-all">
                          {item.dataText}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyText(item.dataText)}
                      className="px-4 py-1.5 rounded-xl bg-purple-950/50 border border-purple-500/25 text-purple-200 hover:text-white hover:bg-purple-900/50 text-xs font-semibold self-end sm:self-auto transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-xs text-purple-300/40 glass-card rounded-2xl border border-purple-500/10">
                  No matching account history found.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* ── Footer Component matching main site ── */}
      <Footer />

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1b0d35] border border-purple-500/40 text-purple-100 px-5 py-3 rounded-2xl text-xs font-bold shadow-[0_0_35px_rgba(139,92,246,0.35)] z-50 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles size={15} className="text-purple-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
