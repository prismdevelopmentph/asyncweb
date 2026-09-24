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

// --- Official Brand Icon Components (SimpleIcons Vectors) ---
const SteamIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
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

const VpnIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.705 2.349a4.874 4.874 0 00-4.39 2.797L6.033 7.893h14.606c.41 0 .692.308.692.668 0 .359-.282.666-.692.666H2.592L0 14.772h2.824c-.796 1.72-1.002 2.567-1.002 3.26 0 2.105 1.72 3.62 4.416 3.62h8.239c1.771 0 3.337-1.412 3.337-3.03 0-1.411-1.206-2.515-2.772-2.515H5.596c-.873 0-1.284-.59-.924-1.335h11.859c4.004 0 7.469-3.029 7.469-6.802 0-3.183-2.618-5.621-6.16-5.621z" />
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

  // Services Data matching reference image exactly (5 core services)
  const services: ServiceItem[] = [
    { id: 'steam', name: 'Steam', icon: SteamIcon, unlocked: true, leftCount: 15642, color: 'text-cyan-400' },
    { id: 'discord', name: 'Discord', icon: DiscordIcon, unlocked: true, leftCount: 0, color: 'text-indigo-400' },
    { id: 'rockstar', name: 'Rockstar', icon: RockstarIcon, unlocked: true, leftCount: 9851, color: 'text-amber-400' },
    { id: 'vpn', name: 'VPN', icon: VpnIcon, unlocked: true, leftCount: 717, color: 'text-emerald-400' },
    { id: 'netflix', name: 'Netflix', icon: NetflixIcon, unlocked: true, leftCount: 1160, color: 'text-rose-500' }
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
    <div className="relative min-h-screen bg-[#0b0716] text-[#f3f0ff] font-sans antialiased selection:bg-purple-600 selection:text-white overflow-x-hidden">
      {/* Ambient purple glowing background orbs matching main site theme */}
      <div className="purple-glow-bg -top-20 left-1/2 -translate-x-1/2 opacity-70 w-[600px] h-[600px]" />
      <div className="purple-glow-bg bottom-10 right-10 opacity-30" />

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#120a24]/90 backdrop-blur-md border-b border-purple-500/20 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2.5 font-bold text-base tracking-tight">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-purple-500/30">
            A
          </div>
          <span className="font-extrabold tracking-tight text-white">ASYNC <span className="purple-gradient-text">GEN</span></span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-200 hover:text-white"
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

        {/* Sidebar matching website design */}
        <aside
          className={`fixed md:sticky top-0 bottom-0 left-0 w-60 bg-[#120a24]/90 backdrop-blur-xl border-r border-purple-500/20 flex flex-col justify-between p-4 z-40 transition-transform duration-300 md:translate-x-0 ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 px-2 py-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-purple-500/30 border border-purple-400/30">
                A
              </div>
              <div className="font-extrabold text-lg tracking-tight text-white">
                ASYNC <span className="purple-gradient-text">GEN</span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1.5">
              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                  currentView === 'dashboard'
                    ? 'bg-purple-600/20 text-purple-100 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)] font-semibold'
                    : 'text-purple-300/60 hover:bg-purple-950/40 hover:text-purple-100'
                }`}
              >
                <LayoutGrid size={17} className={currentView === 'dashboard' ? 'text-purple-400' : 'text-purple-400/60'} />
                Dashboard
              </button>

              <button
                onClick={() => {
                  setCurrentView('settings');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                  currentView === 'settings'
                    ? 'bg-purple-600/20 text-purple-100 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)] font-semibold'
                    : 'text-purple-300/60 hover:bg-purple-950/40 hover:text-purple-100'
                }`}
              >
                <Settings size={17} className={currentView === 'settings' ? 'text-purple-400' : 'text-purple-400/60'} />
                Settings
              </button>
            </nav>
          </div>

          {/* User profile footer */}
          <div className="pt-4 border-t border-purple-500/15 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-purple-500/20 border border-purple-400/30">
                B
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-purple-100 truncate">boks</div>
                <div className="text-[10px] text-purple-300/50 truncate">User</div>
              </div>
            </div>
            <button
              onClick={() => triggerToast('Signed out')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-purple-300/60 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={14} />
              Log Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 max-w-5xl mx-auto min-w-0 pb-24 md:pb-12">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-white text-sm shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              B
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">Welcome back, boks</h1>
              <p className="text-xs text-purple-300/60 flex items-center gap-1.5 mt-0.5 font-light">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60" />
                No active licenses
              </p>
            </div>
          </div>

          {/* ================= DASHBOARD VIEW ================= */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Panel 1: Generator Panel matching screenshot layout with website glassmorphism theme */}
              <section className="glass-panel rounded-2xl p-6 border border-purple-500/20 shadow-[0_0_30px_rgba(11,7,22,0.37)]">
                {/* Panel Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <LayoutGrid size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-purple-100">Generator</h2>
                    <p className="text-[11px] text-purple-300/60">Netflix Gen plan · expires Aug 19 2126</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Callout 1: Add Another Gen */}
                  <div className="glass-card rounded-xl p-4 border border-purple-500/20 bg-purple-950/20">
                    <div className="text-xs font-bold text-purple-100 mb-0.5">Add Another Gen</div>
                    <p className="text-[11px] text-purple-300/60 mb-3">Gen keys and product license keys both work here.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRedeemKey()}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className="flex-1 bg-[#0b0716]/80 border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs font-mono text-purple-100 placeholder-purple-400/30 focus:outline-none focus:border-purple-400 transition-colors"
                      />
                      <button
                        onClick={handleRedeemKey}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all active:scale-95"
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
                  <div className="glass-card rounded-xl p-4 border border-purple-500/20 bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-purple-100 mb-0.5">Need More Generations?</div>
                      <p className="text-[11px] text-purple-300/60">
                        Pay with card via Stripe and <strong className="text-purple-200">50 extra generations</strong> are added to your limit. They never expire and are used once your daily limit runs out.
                      </p>
                    </div>
                    <button
                      onClick={() => triggerToast('Redirecting to Stripe checkout...')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 whitespace-nowrap self-start sm:self-auto shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
                    >
                      <CreditCard size={14} />
                      Buy 50 Gens
                    </button>
                  </div>

                  {/* Horizontal Grid of 9 Service Cards */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5 pt-2">
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
                          className={`glass-card p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-200 group relative ${
                            isOutOfStock
                              ? 'border-purple-500/10 opacity-50 hover:bg-purple-950/20'
                              : 'border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-900/30 hover:-translate-y-1'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/20 flex items-center justify-center mb-2 ${svc.color}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="text-[11px] font-medium text-purple-100 group-hover:text-white transition-colors truncate w-full">
                            {svc.name}
                          </div>
                          <div className={`text-[10px] mt-0.5 font-medium ${isOutOfStock ? 'text-rose-400 font-semibold' : 'text-purple-300/50'}`}>
                            {isOutOfStock ? '0 left' : `${svc.leftCount} left`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Generator Panel Footer */}
                <div className="flex items-center justify-between text-[11px] text-purple-300/50 pt-4 mt-4 border-t border-purple-500/15">
                  <div>Daily: 50/50 Netflix</div>
                  <div>Resets at midnight</div>
                </div>
              </section>

              {/* Panel 2: Generation History Panel matching screenshot layout */}
              <section className="glass-panel rounded-2xl p-6 border border-purple-500/20 shadow-[0_0_30px_rgba(11,7,22,0.37)]">
                {/* Panel Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <Clock size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-purple-100">Generation History</h2>
                    <p className="text-[11px] text-purple-300/60">Your last 100 generated accounts</p>
                  </div>
                </div>

                {/* Notice callout */}
                <div className="glass-card rounded-xl p-3.5 border border-purple-500/20 bg-purple-950/20 flex items-center gap-2.5 mb-4 text-xs text-purple-200/80">
                  <Info size={15} className="text-purple-400 flex-shrink-0" />
                  <span>
                    History is automatically cleared every 5 days. <strong className="text-purple-100">Download or copy anything you want to keep.</strong>
                  </span>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                  <div className="relative">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full sm:w-36 bg-[#0b0716]/80 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-purple-100 focus:outline-none focus:border-purple-400 appearance-none pr-8 cursor-pointer"
                    >
                      <option value="all" className="bg-[#0b0716] text-purple-100">All types</option>
                      <option value="netflix" className="bg-[#0b0716] text-purple-100">Netflix</option>
                      <option value="steam" className="bg-[#0b0716] text-purple-100">Steam</option>
                      <option value="rockstar" className="bg-[#0b0716] text-purple-100">Rockstar</option>
                      <option value="vpn" className="bg-[#0b0716] text-purple-100">VPN</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-purple-400/50 pointer-events-none" />
                  </div>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full bg-[#0b0716]/80 border border-purple-500/30 rounded-xl px-3.5 py-1.5 text-xs text-purple-100 placeholder-purple-400/30 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyText(filteredHistory.map((h) => h.dataText).join('\n'), 'All history copied to clipboard')}
                      className="flex-1 sm:flex-none px-4 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-900/40 text-xs font-semibold transition-colors"
                    >
                      Copy all
                    </button>
                    <button
                      onClick={() => triggerToast('Downloading history.txt file...')}
                      className="flex-1 sm:flex-none px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download size={13} />
                      Download
                    </button>
                  </div>
                </div>

                {/* History Header Count */}
                <div className="text-[11px] text-purple-300/50 mb-2 font-medium">
                  {filteredHistory.length} accounts
                </div>

                {/* History Item Rows */}
                <div className="space-y-2">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                      <div
                        key={item.id}
                        className="glass-card rounded-xl p-3 border border-purple-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-500/35 transition-all"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/20 flex items-center justify-center text-rose-500 flex-shrink-0 mt-0.5 sm:mt-0">
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
                              <span className="font-bold text-xs text-purple-100">{item.service}</span>
                              <span className="text-[10px] text-purple-300/40 font-mono">{item.date}</span>
                            </div>
                            <div className="text-[11px] text-purple-200/90 font-mono mt-0.5 truncate select-all">
                              {item.dataText}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyText(item.dataText)}
                          className="px-3.5 py-1 rounded-lg bg-purple-950/50 border border-purple-500/25 text-purple-200 hover:text-white hover:bg-purple-900/50 text-xs font-medium self-end sm:self-auto transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-purple-300/40 glass-card rounded-xl border border-purple-500/10">
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
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Settings size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-white">Settings</h1>
                  <p className="text-xs text-purple-300/60">Manage your preferences and API keys</p>
                </div>
              </div>

              <div className="flex items-center gap-1 border-b border-purple-500/15 pb-1">
                {(['account', 'security', 'appearance', 'api', 'system'] as SettingsTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSettingsTab(tab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                      settingsTab === tab
                        ? 'bg-purple-600/20 text-purple-100 border border-purple-500/40 shadow-sm'
                        : 'text-purple-300/50 hover:text-purple-200 hover:bg-purple-950/30'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="max-w-xl">
                {settingsTab === 'account' && (
                  <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 space-y-4">
                    <h2 className="text-xs font-bold text-purple-200 uppercase tracking-wider">Account Details</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-purple-300/70 mb-1">Display Name</label>
                        <input
                          type="text"
                          defaultValue="boks"
                          className="w-full bg-[#0b0716]/80 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-300/70 mb-1">Email</label>
                        <input
                          type="email"
                          defaultValue="boks@example.com"
                          className="w-full bg-[#0b0716]/80 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => triggerToast('Changes saved')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    >
                      Save changes
                    </button>
                  </div>
                )}

                {settingsTab === 'security' && (
                  <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 space-y-4">
                    <h2 className="text-xs font-bold text-purple-200 uppercase tracking-wider">Change Password</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-purple-300/70 mb-1">Current Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-[#0b0716]/80 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-300/70 mb-1">New Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-[#0b0716]/80 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => triggerToast('Password updated')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    >
                      Update password
                    </button>
                  </div>
                )}

                {settingsTab === 'appearance' && (
                  <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 space-y-4">
                    <h2 className="text-xs font-bold text-purple-200 uppercase tracking-wider">Accent Color</h2>
                    <p className="text-xs text-purple-300/60">Pick the highlight color used across the dashboard.</p>
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
                  <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 space-y-4">
                    <h2 className="text-xs font-bold text-purple-200 uppercase tracking-wider">API Access</h2>
                    <p className="text-xs text-purple-300/60">Use this secret key to authenticate requests. Keep it secret.</p>
                    <div className="flex gap-2">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        readOnly
                        className="flex-1 bg-[#0b0716]/80 border border-purple-500/30 rounded-xl px-3 py-2 text-xs font-mono text-purple-100 focus:outline-none"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-medium flex items-center gap-1.5"
                      >
                        {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showApiKey ? 'Hide' : 'Reveal'}
                      </button>
                      <button
                        onClick={() => handleCopyText(apiKey, 'API Key copied to clipboard')}
                        className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-medium flex items-center gap-1.5"
                      >
                        <Copy size={13} />
                        Copy
                      </button>
                    </div>
                    <button
                      onClick={handleRotateApiKey}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw size={13} />
                      Rotate key
                    </button>
                  </div>
                )}

                {settingsTab === 'system' && (
                  <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 space-y-3">
                    <h2 className="text-xs font-bold text-purple-200 uppercase tracking-wider">System Information</h2>
                    <div className="divide-y divide-purple-500/10 text-xs">
                      <div className="flex justify-between py-2">
                        <span className="text-purple-300/60">Version</span>
                        <span className="font-mono text-purple-100">2.4.1</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-purple-300/60">Plan</span>
                        <span className="font-mono text-purple-100">Standard</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-purple-300/60">Region</span>
                        <span className="font-mono text-purple-100">eu-central</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-purple-300/60">Member since</span>
                        <span className="font-mono text-purple-100">2024-11-02</span>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#120a24]/95 backdrop-blur-xl border-t border-purple-500/20 flex items-center justify-around px-2 z-40">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            currentView === 'dashboard' ? 'text-purple-400' : 'text-purple-300/40'
          }`}
        >
          <LayoutGrid size={18} />
          <span>Home</span>
        </button>
        <button
          onClick={() => setCurrentView('settings')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
            currentView === 'settings' ? 'text-purple-400' : 'text-purple-300/40'
          }`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <button
          onClick={() => triggerToast('Signed out')}
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-purple-300/40 hover:text-rose-300 transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 bg-[#1b0d35] border border-purple-500/40 text-purple-100 px-4.5 py-2.5 rounded-xl text-xs font-semibold shadow-[0_0_30px_rgba(139,92,246,0.3)] z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles size={14} className="text-purple-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
