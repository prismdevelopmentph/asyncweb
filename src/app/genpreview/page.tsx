'use client';

import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  Settings,
  LogOut,
  Menu,
  X,
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
  Sparkles
} from 'lucide-react';

// --- Brand Icon Components matching reference image ---
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
type ViewMode = 'dashboard' | 'settings';
type SettingsTab = 'account' | 'security' | 'appearance' | 'api' | 'system';

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

export default function GenPreviewDashboard() {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('account');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Component States
  const [keyInput, setKeyInput] = useState('');
  const [keyFeedback, setKeyFeedback] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // API Key State
  const [apiKey, setApiKey] = useState('gen_live_4f9a8b1c2d3e4f5g6h7i8j9k0l');
  const [showApiKey, setShowApiKey] = useState(false);

  // Toast State
  const [toast, setToast] = useState<string | null>(null);

  // Accent Color Theme Swatches
  const [activeAccent, setActiveAccent] = useState('#a855f7');
  const accentSwatches = [
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Emerald', hex: '#10b981' }
  ];

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Services Data matching reference image exactly
  const services: ServiceItem[] = [
    { id: 'steam', name: 'Steam', icon: SteamIcon, unlocked: true, leftCount: 15642, color: 'text-[#66c0f4]' },
    { id: 'discord', name: 'Discord', icon: DiscordIcon, unlocked: true, leftCount: 0, color: 'text-[#5865f2]' },
    { id: 'rockstar', name: 'Rockstar', icon: RockstarIcon, unlocked: true, leftCount: 9851, color: 'text-[#fcaf17]' },
    { id: 'vpn', name: 'VPN', icon: VpnIcon, unlocked: true, leftCount: 717, color: 'text-[#10b981]' },
    { id: 'fortnite', name: 'Fortnite', icon: FortniteIcon, unlocked: true, leftCount: 321, color: 'text-[#a855f7]' },
    { id: 'netflix', name: 'Netflix', icon: NetflixIcon, unlocked: true, leftCount: 1160, color: 'text-[#e50914]' },
    { id: 'roblox', name: 'Roblox', icon: RobloxIcon, unlocked: true, leftCount: 172, color: 'text-[#00a2ff]' },
    { id: 'chatgpt', name: 'ChatGPT', icon: ChatGptIcon, unlocked: true, leftCount: 0, color: 'text-[#10a37f]' },
    { id: 'gemini', name: 'Gemini', icon: GeminiIcon, unlocked: true, leftCount: 0, color: 'text-[#8e75ff]' }
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

  const handleRotateApiKey = () => {
    const newKey = 'gen_live_' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setApiKey(newKey);
    triggerToast('API Key rotated successfully');
  };

  return (
    <div className="relative min-h-screen bg-[#0d0f14] text-[#e6edf3] font-sans antialiased selection:bg-purple-500/30 selection:text-purple-200">
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#131a22]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2.5 font-bold text-base tracking-tight">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
            F
          </div>
          <span>FLK Gen<span className="text-purple-400">.</span></span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-[#182028] border border-white/10 text-zinc-300 hover:text-white"
          aria-label="Toggle Menu"
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-40"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:sticky top-0 bottom-0 left-0 w-56 bg-[#131a22] border-r border-white/10 flex flex-col justify-between p-4 z-40 transition-transform duration-300 md:translate-x-0 ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-2 py-3 mb-6">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md border border-white/10">
                F
              </div>
              <div className="font-extrabold text-base tracking-tight text-white">
                FLK Gen<span className="text-purple-400">.</span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs transition-all duration-200 ${
                  currentView === 'dashboard'
                    ? 'bg-white/10 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <LayoutGrid size={16} className={currentView === 'dashboard' ? 'text-purple-400' : 'text-zinc-400'} />
                Dashboard
              </button>

              <button
                onClick={() => {
                  setCurrentView('settings');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs transition-all duration-200 ${
                  currentView === 'settings'
                    ? 'bg-white/10 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Settings size={16} className={currentView === 'settings' ? 'text-purple-400' : 'text-zinc-400'} />
                Settings
              </button>
            </nav>
          </div>

          {/* User profile footer */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-md border border-purple-400/40">
                B
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-white truncate">boks</div>
                <div className="text-[10px] text-zinc-400 truncate">User</div>
              </div>
            </div>
            <button
              onClick={() => triggerToast('Signed out')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut size={14} />
              Log Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 max-w-6xl mx-auto min-w-0 pb-24 md:pb-12">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm ring-2 ring-purple-500/40 shadow-lg">
              B
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">Welcome back, boks</h1>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                No active licenses
              </p>
            </div>
          </div>

          {/* ================= DASHBOARD VIEW ================= */}
          {currentView === 'dashboard' && (
            <div className="space-y-5">
              {/* Panel 1: Generator Panel */}
              <section className="bg-[#161d25] border border-white/10 rounded-2xl p-5 shadow-xl">
                {/* Panel Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
                    <LayoutGrid size={14} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Generator</h2>
                    <p className="text-[11px] text-zinc-400">Netflix Gen plan · expires Aug 19 2126</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Callout 1: Add Another Gen */}
                  <div className="bg-[#1e2833] border border-white/10 rounded-xl p-4">
                    <div className="text-xs font-bold text-white mb-0.5">Add Another Gen</div>
                    <p className="text-[11px] text-zinc-400 mb-3">Gen keys and product license keys both work here.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRedeemKey()}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className="flex-1 bg-[#0e1319] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      <button
                        onClick={handleRedeemKey}
                        className="px-5 py-2 rounded-lg bg-[#6b8299] hover:bg-[#7a93ac] text-white font-semibold text-xs transition-colors shadow-sm"
                      >
                        Redeem
                      </button>
                    </div>
                    {keyFeedback && (
                      <div className={`text-[11px] mt-2 font-medium flex items-center gap-1.5 ${keyFeedback.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {keyFeedback.type === 'ok' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        {keyFeedback.msg}
                      </div>
                    )}
                  </div>

                  {/* Callout 2: Need More Generations? */}
                  <div className="bg-[#1e2833] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white mb-0.5">Need More Generations?</div>
                      <p className="text-[11px] text-zinc-400">
                        Pay with card via Stripe and <strong className="text-zinc-200">50 extra generations</strong> are added to your limit. They never expire and are used once your daily limit runs out.
                      </p>
                    </div>
                    <button
                      onClick={() => triggerToast('Redirecting to Stripe checkout...')}
                      className="px-4 py-2 rounded-lg bg-[#6b8299] hover:bg-[#7a93ac] text-white font-semibold text-xs flex items-center gap-2 whitespace-nowrap self-start sm:self-auto shadow-sm"
                    >
                      <CreditCard size={14} />
                      Buy 50 Gens
                    </button>
                  </div>

                  {/* Horizontal Grid of Service Cards */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 pt-2">
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
                          className={`bg-[#1e2833] border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all hover:bg-[#243039] hover:border-white/20 active:scale-95 group relative ${
                            isOutOfStock ? 'opacity-60' : ''
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg bg-[#161d25] border border-white/10 flex items-center justify-center mb-2 ${svc.color}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="text-[11px] font-medium text-zinc-200 group-hover:text-white transition-colors truncate w-full">
                            {svc.name}
                          </div>
                          <div className={`text-[10px] mt-0.5 font-medium ${isOutOfStock ? 'text-rose-500 font-semibold' : 'text-zinc-400'}`}>
                            {isOutOfStock ? '0 left' : `${svc.leftCount} left`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Generator Panel Footer */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-4 mt-4 border-t border-white/10">
                  <div>Daily: 50/50 Netflix</div>
                  <div>Resets at midnight</div>
                </div>
              </section>

              {/* Panel 2: Generation History Panel */}
              <section className="bg-[#161d25] border border-white/10 rounded-2xl p-5 shadow-xl">
                {/* Panel Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
                    <Clock size={14} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Generation History</h2>
                    <p className="text-[11px] text-zinc-400">Your last 100 generated accounts</p>
                  </div>
                </div>

                {/* Notice callout */}
                <div className="bg-[#1e2833] border border-white/10 rounded-xl p-3.5 flex items-center gap-2.5 mb-4 text-xs text-zinc-300">
                  <Info size={15} className="text-zinc-400 flex-shrink-0" />
                  <span>
                    History is automatically cleared every 5 days. <strong className="text-white">Download or copy anything you want to keep.</strong>
                  </span>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                  <div className="relative">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full sm:w-36 bg-[#0e1319] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 appearance-none pr-8 cursor-pointer"
                    >
                      <option value="all">All types</option>
                      <option value="netflix">Netflix</option>
                      <option value="steam">Steam</option>
                      <option value="rockstar">Rockstar</option>
                      <option value="vpn">VPN</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-zinc-400 pointer-events-none" />
                  </div>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full bg-[#0e1319] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyText(filteredHistory.map((h) => h.dataText).join('\n'), 'All history copied to clipboard')}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg bg-[#1e2833] border border-white/10 text-zinc-300 hover:text-white hover:bg-[#243039] text-xs font-semibold transition-colors"
                    >
                      Copy all
                    </button>
                    <button
                      onClick={() => triggerToast('Downloading history.txt file...')}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg bg-[#6b8299] hover:bg-[#7a93ac] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download size={13} />
                      Download
                    </button>
                  </div>
                </div>

                {/* History Header Count */}
                <div className="text-[11px] text-zinc-400 mb-2 font-medium">
                  {filteredHistory.length} accounts
                </div>

                {/* History Item Rows */}
                <div className="space-y-2">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#1e2833] border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition-all"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-[#161d25] border border-white/10 flex items-center justify-center text-rose-500 flex-shrink-0 mt-0.5 sm:mt-0">
                            {item.service === 'Netflix' ? (
                              <NetflixIcon className="w-4 h-4" />
                            ) : item.service === 'Steam' ? (
                              <SteamIcon className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <RockstarIcon className="w-4 h-4 text-amber-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white">{item.service}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">{item.date}</span>
                            </div>
                            <div className="text-[11px] text-zinc-300 font-mono mt-0.5 truncate select-all">
                              {item.dataText}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyText(item.dataText)}
                          className="px-3 py-1 rounded-lg bg-[#161d25] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 text-xs font-medium self-end sm:self-auto transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-zinc-500 bg-[#1e2833]/50 rounded-xl border border-white/5">
                      No matching account history found.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ================= SETTINGS VIEW ================= */}
          {currentView === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
                  <Settings size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-white">Settings</h1>
                  <p className="text-xs text-zinc-400">Manage your preferences and API keys</p>
                </div>
              </div>

              <div className="flex items-center gap-1 border-b border-white/10 pb-1">
                {(['account', 'security', 'appearance', 'api', 'system'] as SettingsTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSettingsTab(tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      settingsTab === tab
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="max-w-xl">
                {settingsTab === 'account' && (
                  <div className="bg-[#161d25] border border-white/10 rounded-2xl p-5 space-y-4">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">Account Details</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Display Name</label>
                        <input
                          type="text"
                          defaultValue="boks"
                          className="w-full bg-[#0e1319] border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
                        <input
                          type="email"
                          defaultValue="boks@example.com"
                          className="w-full bg-[#0e1319] border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => triggerToast('Changes saved')}
                      className="px-4 py-2 rounded-lg bg-[#6b8299] hover:bg-[#7a93ac] text-white font-semibold text-xs transition-colors"
                    >
                      Save changes
                    </button>
                  </div>
                )}

                {settingsTab === 'security' && (
                  <div className="bg-[#161d25] border border-white/10 rounded-2xl p-5 space-y-4">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">Change Password</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Current Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-[#0e1319] border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">New Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-[#0e1319] border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => triggerToast('Password updated')}
                      className="px-4 py-2 rounded-lg bg-[#6b8299] hover:bg-[#7a93ac] text-white font-semibold text-xs transition-colors"
                    >
                      Update password
                    </button>
                  </div>
                )}

                {settingsTab === 'appearance' && (
                  <div className="bg-[#161d25] border border-white/10 rounded-2xl p-5 space-y-4">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">Accent Color</h2>
                    <p className="text-xs text-zinc-400">Pick the highlight color used across the dashboard.</p>
                    <div className="flex items-center gap-2.5">
                      {accentSwatches.map((swatch) => (
                        <button
                          key={swatch.name}
                          onClick={() => {
                            setActiveAccent(swatch.hex);
                            triggerToast(`Theme color set to ${swatch.name}`);
                          }}
                          style={{ backgroundColor: swatch.hex }}
                          className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                            activeAccent === swatch.hex ? 'border-white scale-105' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {settingsTab === 'api' && (
                  <div className="bg-[#161d25] border border-white/10 rounded-2xl p-5 space-y-4">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">API Access</h2>
                    <p className="text-xs text-zinc-400">Use this secret key to authenticate requests. Keep it secret.</p>
                    <div className="flex gap-2">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        readOnly
                        className="flex-1 bg-[#0e1319] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="px-3 py-1.5 rounded-lg bg-[#1e2833] border border-white/10 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
                      >
                        {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showApiKey ? 'Hide' : 'Reveal'}
                      </button>
                      <button
                        onClick={() => handleCopyText(apiKey, 'API Key copied to clipboard')}
                        className="px-3 py-1.5 rounded-lg bg-[#1e2833] border border-white/10 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
                      >
                        <Copy size={13} />
                        Copy
                      </button>
                    </div>
                    <button
                      onClick={handleRotateApiKey}
                      className="px-3.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw size={13} />
                      Rotate key
                    </button>
                  </div>
                )}

                {settingsTab === 'system' && (
                  <div className="bg-[#161d25] border border-white/10 rounded-2xl p-5 space-y-3">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">System Information</h2>
                    <div className="divide-y divide-white/5 text-xs">
                      <div className="flex justify-between py-2">
                        <span className="text-zinc-400">Version</span>
                        <span className="font-mono text-zinc-200">2.4.1</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-zinc-400">Plan</span>
                        <span className="font-mono text-zinc-200">Standard</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-zinc-400">Region</span>
                        <span className="font-mono text-zinc-200">eu-central</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-zinc-400">Member since</span>
                        <span className="font-mono text-zinc-200">2024-11-02</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#131a22] border-t border-white/10 flex items-center justify-around px-2 z-40">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            currentView === 'dashboard' ? 'text-purple-400' : 'text-zinc-400'
          }`}
        >
          <LayoutGrid size={18} />
          <span>Home</span>
        </button>
        <button
          onClick={() => setCurrentView('settings')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            currentView === 'settings' ? 'text-purple-400' : 'text-zinc-400'
          }`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <button
          onClick={() => triggerToast('Signed out')}
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-rose-400 transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 bg-[#243039] border border-white/15 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles size={14} className="text-purple-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
