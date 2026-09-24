'use client';

import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  Settings,
  LogOut,
  Menu,
  X,
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Check,
  Lock,
  User,
  Shield,
  Palette,
  Cpu,
  Activity,
  Sparkles,
  Zap,
  Code2,
  FileCode,
  Box,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  Gamepad2,
  MessageSquare,
  Flame,
  Tv,
  Globe
} from 'lucide-react';

// --- Types ---
type ViewMode = 'dashboard' | 'settings';
type SettingsTab = 'account' | 'security' | 'appearance' | 'api' | 'system';

interface ModuleItem {
  id: string;
  name: string;
  icon: React.ElementType;
  unlocked: boolean;
  remaining?: string;
  color: string;
}

interface ActivityItem {
  id: string;
  time: string;
  module: string;
  status: 'Success' | 'Processing' | 'Pending';
  details: string;
}

export default function GenPreviewDashboard() {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('account');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Component States
  const [keyInput, setKeyInput] = useState('');
  const [keyFeedback, setKeyFeedback] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [activitySearch, setActivitySearch] = useState('');
  
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

  // Helper for showing temporary toast notifications
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Services Data (Account Generator Services)
  const modules: ModuleItem[] = [
    { id: '1', name: 'Steam', icon: Gamepad2, unlocked: true, remaining: '24 in stock', color: 'text-cyan-400' },
    { id: '2', name: 'Discord', icon: MessageSquare, unlocked: true, remaining: '50 in stock', color: 'text-indigo-400' },
    { id: '3', name: 'Rockstar', icon: Flame, unlocked: true, remaining: '8 in stock', color: 'text-amber-400' },
    { id: '4', name: 'Netflix', icon: Tv, unlocked: true, remaining: '15 in stock', color: 'text-rose-400' },
    { id: '5', name: 'VPN', icon: Globe, unlocked: true, remaining: '30 in stock', color: 'text-emerald-400' },
    { id: '6', name: 'Spotify Premium', icon: Sparkles, unlocked: false, remaining: 'Out of stock', color: 'text-zinc-500' }
  ];

  // Activity Log Data
  const activities: ActivityItem[] = [
    { id: 'act-1', time: '14:22:05', module: 'Steam', status: 'Success', details: 'Claimed Account #40293' },
    { id: 'act-2', time: '13:50:11', module: 'Discord', status: 'Success', details: 'Claimed Nitro Account #1102' },
    { id: 'act-3', time: '12:15:40', module: 'Rockstar', status: 'Success', details: 'Claimed GTA V License #8821' },
    { id: 'act-4', time: '11:04:19', module: 'VPN', status: 'Success', details: 'Claimed ExpressVPN #302' },
    { id: 'act-5', time: '09:30:00', module: 'Netflix', status: 'Success', details: 'Claimed Premium Account #094' }
  ];

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    if (!activitySearch.trim()) return activities;
    const q = activitySearch.toLowerCase();
    return activities.filter(
      (a) => a.module.toLowerCase().includes(q) || a.details.toLowerCase().includes(q) || a.status.toLowerCase().includes(q)
    );
  }, [activitySearch]);

  // Key Redeem Handler
  const handleRedeemKey = () => {
    if (!keyInput.trim()) {
      setKeyFeedback({ msg: 'Please enter a valid key format.', type: 'err' });
      return;
    }
    if (keyInput.trim().length < 10) {
      setKeyFeedback({ msg: 'Invalid license key format.', type: 'err' });
      return;
    }
    setKeyFeedback({ msg: 'Key redeemed successfully! Standard Plan active.', type: 'ok' });
    triggerToast('License Key Redeemed Successfully!');
    setKeyInput('');
  };

  // Copy Activity Log Handler
  const handleCopyHistory = () => {
    const text = filteredActivities.map((a) => `[${a.time}] ${a.module} - ${a.status}: ${a.details}`).join('\n');
    navigator.clipboard.writeText(text);
    triggerToast('Activity history copied to clipboard');
  };

  // Rotate API Key Handler
  const handleRotateApiKey = () => {
    const newKey = 'gen_live_' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setApiKey(newKey);
    triggerToast('API Key rotated successfully');
  };

  return (
    <div className="relative min-h-screen bg-[#0b0716] text-[#f3f0ff] font-sans antialiased selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background Ambient Glow Blobs */}
      <div className="fixed top-[-120px] left-[180px] w-[450px] h-[450px] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-40px] w-[400px] h-[400px] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none z-0" />

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0d081d]/80 backdrop-blur-md border-b border-purple-500/15 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 font-bold text-base tracking-tight">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-purple-500/20">
            A
          </div>
          <span>ASYNC<span className="text-purple-400">.</span></span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/20 text-purple-200 hover:text-white"
          aria-label="Toggle Menu"
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar Overlay for Mobile */}
        {mobileSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:sticky top-0 bottom-0 left-0 w-60 bg-[#0d081d]/90 backdrop-blur-xl border-r border-purple-500/15 flex flex-col justify-between p-4 z-40 transition-transform duration-300 md:translate-x-0 ${
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
                ASYNC <span className="text-purple-400">GEN</span>
              </div>
            </div>

            {/* Navigation items */}
            <nav className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/40">
                Navigation
              </div>
              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  currentView === 'dashboard'
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                    : 'text-purple-200/60 hover:bg-purple-950/40 hover:text-purple-100'
                }`}
              >
                <LayoutGrid size={18} className={currentView === 'dashboard' ? 'text-purple-400' : 'text-purple-400/60'} />
                Dashboard
              </button>

              <button
                onClick={() => {
                  setCurrentView('settings');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  currentView === 'settings'
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                    : 'text-purple-200/60 hover:bg-purple-950/40 hover:text-purple-100'
                }`}
              >
                <Settings size={18} className={currentView === 'settings' ? 'text-purple-400' : 'text-purple-400/60'} />
                Settings
              </button>
            </nav>
          </div>

          {/* User profile footer */}
          <div className="pt-4 border-t border-purple-500/15 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-purple-500/20">
                B
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-purple-100 truncate">boks</div>
                <div className="text-xs text-purple-300/50 truncate">Standard Plan</div>
              </div>
            </div>
            <button
              onClick={() => triggerToast('Signed out (Demo Mode)')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-purple-300/60 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 max-w-7xl mx-auto min-w-0 pb-24 md:pb-12">
          {/* ================= DASHBOARD VIEW ================= */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center text-purple-400 shadow-md shadow-purple-500/10">
                  <LayoutGrid size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-white">Welcome back, boks</h1>
                  <p className="text-xs text-purple-200/60 flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Standard Plan active · Renews Aug 19, 2026
                  </p>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 relative overflow-hidden group hover:border-purple-500/40 transition-all">
                  <div className="text-3xl font-extrabold text-white tracking-tight">1,284</div>
                  <div className="text-xs text-purple-300/60 mt-1 font-medium">Total Actions</div>
                  <Activity size={18} className="absolute top-4 right-4 text-purple-400/30 group-hover:text-purple-400/60 transition-colors" />
                </div>
                <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 relative overflow-hidden group hover:border-purple-500/40 transition-all">
                  <div className="text-3xl font-extrabold text-white tracking-tight">37</div>
                  <div className="text-xs text-purple-300/60 mt-1 font-medium">Actions Today</div>
                  <Clock size={18} className="absolute top-4 right-4 text-purple-400/30 group-hover:text-purple-400/60 transition-colors" />
                </div>
                <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 relative overflow-hidden group hover:border-purple-500/40 transition-all">
                  <div className="text-3xl font-extrabold text-white tracking-tight">50</div>
                  <div className="text-xs text-purple-300/60 mt-1 font-medium">Credits Remaining</div>
                  <Zap size={18} className="absolute top-4 right-4 text-purple-400/30 group-hover:text-purple-400/60 transition-colors" />
                </div>
              </div>

              {/* Main Grid: Left Modules & Redeem, Right Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (8 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="glass-panel rounded-2xl p-6 border border-purple-500/20">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                        <Box size={16} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">Account Services</h2>
                        <p className="text-xs text-purple-300/50">Select a service to generate or claim an account</p>
                      </div>
                    </div>

                    {/* Redeem Key Card */}
                    <div className="glass-card rounded-xl p-4 mb-6 border border-purple-500/20 bg-purple-950/20">
                      <div className="text-xs font-semibold text-purple-200 mb-1">Redeem a Key</div>
                      <p className="text-[11px] text-purple-300/50 mb-3">Enter a license key to add credits or upgrade your tier.</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={keyInput}
                          onChange={(e) => setKeyInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRedeemKey()}
                          placeholder="LIC-XXXX-XXXX-XXXX"
                          className="flex-1 bg-[#0b0716]/80 border border-purple-500/30 rounded-xl px-3 py-2 text-xs font-mono text-purple-100 placeholder-purple-400/40 focus:outline-none focus:border-purple-400 transition-colors"
                        />
                        <button
                          onClick={handleRedeemKey}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-md shadow-purple-600/30 transition-all active:scale-95 whitespace-nowrap"
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

                    {/* Module Tile Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                      {modules.map((mod) => {
                        const IconComponent = mod.icon;
                        return (
                          <div
                            key={mod.id}
                            onClick={() => {
                              if (mod.unlocked) {
                                triggerToast(`Selected ${mod.name} Module`);
                              } else {
                                triggerToast(`${mod.name} requires Pro tier upgrade`);
                              }
                            }}
                            className={`glass-card p-3.5 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
                              mod.unlocked
                                ? 'border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-900/30 hover:-translate-y-1'
                                : 'border-purple-500/10 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="relative mb-2">
                              <div className={`p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/20 ${mod.color}`}>
                                <IconComponent size={22} />
                              </div>
                              {!mod.unlocked && (
                                <div className="absolute -top-1 -right-1 p-1 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-400">
                                  <Lock size={10} />
                                </div>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-purple-100 group-hover:text-purple-300 transition-colors">
                              {mod.name}
                            </div>
                            <div className="text-[10px] text-purple-300/40 mt-0.5 truncate max-w-full">
                              {mod.remaining}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column (5 cols) - Activity Table */}
                <div className="lg:col-span-5">
                  <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                        <Activity size={16} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">Recent Activity</h2>
                        <p className="text-xs text-purple-300/50">Live transaction event log</p>
                      </div>
                    </div>

                    {/* Table Toolbar */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-2.5 text-purple-400/40" />
                        <input
                          type="text"
                          value={activitySearch}
                          onChange={(e) => setActivitySearch(e.target.value)}
                          placeholder="Filter events..."
                          className="w-full bg-[#0b0716]/80 border border-purple-500/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-purple-100 placeholder-purple-400/30 focus:outline-none focus:border-purple-400/60"
                        />
                      </div>
                      <button
                        onClick={handleCopyHistory}
                        className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Copy size={12} />
                        Copy
                      </button>
                    </div>

                    {/* Activity Table */}
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-purple-500/15 text-purple-300/40 text-[11px]">
                            <th className="pb-2 font-medium">Time</th>
                            <th className="pb-2 font-medium">Module</th>
                            <th className="pb-2 font-medium text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-500/10">
                          {filteredActivities.length > 0 ? (
                            filteredActivities.map((act) => (
                              <tr key={act.id} className="group hover:bg-purple-500/5 transition-colors">
                                <td className="py-2.5 font-mono text-purple-300/60 text-[11px]">{act.time}</td>
                                <td className="py-2.5">
                                  <div className="font-semibold text-purple-100">{act.module}</div>
                                  <div className="text-[10px] text-purple-300/40 truncate max-w-[130px]">{act.details}</div>
                                </td>
                                <td className="py-2.5 text-right">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                      act.status === 'Success'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}
                                  >
                                    {act.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-purple-300/40 text-xs">
                                No matching events found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SETTINGS VIEW ================= */}
          {currentView === 'settings' && (
            <div className="space-y-6">
              {/* Settings Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center text-purple-400 shadow-md shadow-purple-500/10">
                  <Settings size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-white">Settings</h1>
                  <p className="text-xs text-purple-200/60 mt-0.5">Manage your preferences, security, and API configurations</p>
                </div>
              </div>

              {/* Internal Settings Tabs */}
              <div className="flex items-center gap-1 border-b border-purple-500/15 overflow-x-auto custom-scrollbar pb-1">
                {(['account', 'security', 'appearance', 'api', 'system'] as SettingsTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSettingsTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all duration-200 ${
                      settingsTab === tab
                        ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                        : 'text-purple-300/50 hover:text-purple-200 hover:bg-purple-950/30'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content Panes */}
              <div className="max-w-2xl">
                {/* Account Tab */}
                {settingsTab === 'account' && (
                  <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 space-y-4">
                    <h2 className="text-base font-bold text-white mb-4">Account Details</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-purple-300/70 mb-1.5">Display Name</label>
                        <input
                          type="text"
                          defaultValue="boks"
                          className="w-full bg-[#0b0716]/80 border border-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400/60"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-300/70 mb-1.5">Email Address</label>
                        <input
                          type="email"
                          defaultValue="boks@example.com"
                          className="w-full bg-[#0b0716]/80 border border-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400/60"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => triggerToast('Account changes saved successfully')}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-md shadow-purple-600/30 transition-all"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {settingsTab === 'security' && (
                  <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 space-y-4">
                    <h2 className="text-base font-bold text-white mb-4">Security & Password</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-purple-300/70 mb-1.5">Current Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-[#0b0716]/80 border border-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400/60"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-300/70 mb-1.5">New Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-[#0b0716]/80 border border-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-400/60"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => triggerToast('Password updated successfully')}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-md shadow-purple-600/30 transition-all"
                      >
                        Update Password
                      </button>
                    </div>
                  </div>
                )}

                {/* Appearance Tab */}
                {settingsTab === 'appearance' && (
                  <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 space-y-4">
                    <h2 className="text-base font-bold text-white mb-2">Accent Color Theme</h2>
                    <p className="text-xs text-purple-300/50 mb-4">Pick the primary accent color highlight for your dashboard elements.</p>
                    <div className="flex items-center gap-3">
                      {accentSwatches.map((swatch) => (
                        <button
                          key={swatch.name}
                          onClick={() => {
                            setActiveAccent(swatch.hex);
                            triggerToast(`Theme color updated to ${swatch.name}`);
                          }}
                          style={{ backgroundColor: swatch.hex }}
                          className={`w-8 h-8 rounded-full border-2 transition-transform duration-200 hover:scale-110 ${
                            activeAccent === swatch.hex ? 'border-white ring-2 ring-purple-500/50 scale-105' : 'border-transparent'
                          }`}
                          title={swatch.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* API Tab */}
                {settingsTab === 'api' && (
                  <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 space-y-4">
                    <h2 className="text-base font-bold text-white">API Key Access</h2>
                    <p className="text-xs text-purple-300/50">Use this secret token to authenticate REST requests to the ASYNC API.</p>

                    <div className="flex gap-2">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        readOnly
                        className="flex-1 bg-[#0b0716]/80 border border-purple-500/20 rounded-xl px-3.5 py-2 text-xs font-mono text-purple-200 focus:outline-none"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showApiKey ? 'Hide' : 'Reveal'}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(apiKey);
                          triggerToast('API Key copied to clipboard');
                        }}
                        className="px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleRotateApiKey}
                        className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium text-xs flex items-center gap-2 transition-all"
                      >
                        <RefreshCw size={13} />
                        Rotate API Key
                      </button>
                    </div>
                  </div>
                )}

                {/* System Tab */}
                {settingsTab === 'system' && (
                  <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 space-y-3">
                    <h2 className="text-base font-bold text-white mb-4">System Information</h2>
                    <div className="divide-y divide-purple-500/10 text-xs">
                      <div className="flex justify-between py-2.5">
                        <span className="text-purple-300/50">Version</span>
                        <span className="font-mono text-purple-100">v2.4.1-stable</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className="text-purple-300/50">Subscription Tier</span>
                        <span className="font-mono text-purple-100">Standard</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className="text-purple-300/50">Server Region</span>
                        <span className="font-mono text-purple-100">eu-central-1</span>
                      </div>
                        <div className="flex justify-between py-2.5">
                        <span className="text-purple-300/50">Member Since</span>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0d081d]/95 backdrop-blur-xl border-t border-purple-500/15 flex items-center justify-around px-2 z-40">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            currentView === 'dashboard' ? 'text-purple-400 font-bold' : 'text-purple-300/40 hover:text-purple-200'
          }`}
        >
          <LayoutGrid size={18} />
          <span>Home</span>
        </button>
        <button
          onClick={() => setCurrentView('settings')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            currentView === 'settings' ? 'text-purple-400 font-bold' : 'text-purple-300/40 hover:text-purple-200'
          }`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <button
          onClick={() => triggerToast('Signed out (Demo Mode)')}
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-purple-300/40 hover:text-rose-300 transition-colors"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </nav>

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 bg-[#170e2c] border border-purple-500/30 text-purple-100 px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl shadow-purple-950/80 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles size={14} className="text-purple-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
