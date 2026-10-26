'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DiscordLoginButton from '@/components/DiscordLoginButton';
import { supabase } from '@/lib/supabase';
import {
  Key,
  Database,
  Coins,
  Copy,
  Check,
  Download,
  Search,
  Sparkles,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Lock,
  Clock,
  Tag,
  AlertCircle,
  FileText,
  Activity,
  CheckCircle2,
  X,
  Plus
} from 'lucide-react';

interface TierOption {
  tier_key: string;
  retail_price: number;
  wholesale_price: number;
  profit_margin: number;
  daily_limit?: number;
}

interface ProductItem {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  tiers: TierOption[];
}

interface ResellerData {
  id: string;
  discord_id: string;
  company_name: string;
  credit_balance: number;
  currency: string;
  status: 'active' | 'suspended';
}

interface IssuedLicense {
  id: string;
  license_key: string;
  tier: string;
  daily_limit: number;
  expires_at: string | null;
  is_active: boolean;
  hwid: string | null;
  last_hwid_reset_at: string | null;
  created_at: string;
  redeemed_by: string | null;
}

interface ResellerTx {
  id: string;
  type: 'deposit' | 'deduction' | 'key_mint';
  amount: number;
  balance_before: number;
  balance_after: number;
  note: string;
  created_at: string;
}

export default function ResellerPortalPage() {
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string>('');

  const [reseller, setReseller] = useState<ResellerData | null>(null);
  const [catalog, setCatalog] = useState<ProductItem[]>([]);
  const [licenses, setLicenses] = useState<IssuedLicense[]>([]);
  const [transactions, setTransactions] = useState<ResellerTx[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Active view: 'catalog' | 'licenses' | 'ledger'
  const [activeTab, setActiveTab] = useState<'catalog' | 'licenses' | 'ledger'>('catalog');

  // Mint Modal
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedTierKey, setSelectedTierKey] = useState<string>('daily');
  const [mintQuantity, setMintQuantity] = useState<number>(1);
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState('');
  const [mintedResult, setMintedResult] = useState<{ keys: string[]; totalCost: number; productTitle: string; tier: string } | null>(null);

  // HWID Reset Modal / State
  const [resettingHwidId, setResettingHwidId] = useState<string | null>(null);
  const [hwidMessage, setHwidMessage] = useState<{ id: string; success: boolean; text: string } | null>(null);

  // Search & Copy
  const [licenseSearch, setLicenseSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. Session & Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Portal Data
  const fetchPortalData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    setAuthError('');

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      const res = await fetch('/api/reseller/data', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.status === 401 || res.status === 403) {
        const errJson = await res.json().catch(() => ({}));
        setIsAuthorized(false);
        setAuthError(errJson.error || 'Access restricted to authorized resellers.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setIsAuthorized(true);
          setReseller(data.reseller);
          setCatalog(data.catalog || []);
          setLicenses(data.licenses || []);
          setTransactions(data.transactions || []);
        }
      } else {
        setIsAuthorized(false);
        setAuthError('Unable to load reseller profile.');
      }
    } catch (err: any) {
      console.error('Portal data error:', err);
      setIsAuthorized(false);
      setAuthError(err?.message || 'Network error.');
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPortalData();
    }
  }, [user, fetchPortalData]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Open Mint Modal
  const openMintModal = (prod: ProductItem) => {
    setSelectedProduct(prod);
    const defaultTier = prod.tiers[0]?.tier_key || 'daily';
    setSelectedTierKey(defaultTier);
    setMintQuantity(1);
    setMintError('');
    setMintedResult(null);
    setMintModalOpen(true);
  };

  // Execute Batch Mint
  const handleBatchMint = async () => {
    if (!selectedProduct || !selectedTierKey) return;
    setIsMinting(true);
    setMintError('');

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      const res = await fetch('/api/reseller/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          tierKey: selectedTierKey,
          quantity: mintQuantity,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setMintError(data.error || 'Batch key minting failed.');
        return;
      }

      setMintedResult({
        keys: data.keys,
        totalCost: data.totalCost,
        productTitle: data.productTitle,
        tier: data.tier,
      });

      // Update local balance
      if (reseller && data.newBalance !== undefined) {
        setReseller({ ...reseller, credit_balance: data.newBalance });
      }

      // Refresh background datasets
      fetchPortalData();
    } catch (err: any) {
      setMintError(err?.message || 'Network error during mint.');
    } finally {
      setIsMinting(false);
    }
  };

  // HWID Reset with 7-day cooldown
  const handleResetHwid = async (licenseId: string) => {
    setResettingHwidId(licenseId);
    setHwidMessage(null);

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      const res = await fetch('/api/reseller/reset-hwid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ licenseId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setHwidMessage({ id: licenseId, success: false, text: data.error || 'HWID reset failed.' });
      } else {
        setHwidMessage({ id: licenseId, success: true, text: data.message || 'HWID cleared.' });
        // Update local license state
        setLicenses((prev) =>
          prev.map((lic) =>
            lic.id === licenseId
              ? { ...lic, hwid: null, last_hwid_reset_at: data.resetAt || new Date().toISOString() }
              : lic
          )
        );
      }
    } catch (err: any) {
      setHwidMessage({ id: licenseId, success: false, text: err?.message || 'Network error.' });
    } finally {
      setResettingHwidId(null);
    }
  };

  // Export Minted Keys as TXT
  const downloadKeysTxt = (keys: string[], title: string, tier: string) => {
    const content = keys.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `async-keys-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${tier}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Minted Keys as CSV
  const downloadKeysCsv = (keys: string[], title: string, tier: string) => {
    const rows = ['License Key,Product,Tier,Issued At'];
    const now = new Date().toISOString();
    keys.forEach((k) => rows.push(`"${k}","${title}","${tier}","${now}"`));
    const content = rows.join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `async-keys-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${tier}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Selected tier helper
  const activeSelectedTier = useMemo(() => {
    if (!selectedProduct) return null;
    return selectedProduct.tiers.find((t) => t.tier_key === selectedTierKey) || selectedProduct.tiers[0];
  }, [selectedProduct, selectedTierKey]);

  const totalMintCost = useMemo(() => {
    if (!activeSelectedTier) return 0;
    return Number((activeSelectedTier.wholesale_price * mintQuantity).toFixed(2));
  }, [activeSelectedTier, mintQuantity]);

  // Filtered Licenses
  const filteredLicenses = useMemo(() => {
    if (!licenseSearch.trim()) return licenses;
    const q = licenseSearch.toLowerCase().trim();
    return licenses.filter(
      (l) =>
        l.license_key.toLowerCase().includes(q) ||
        (l.redeemed_by && l.redeemed_by.includes(q)) ||
        l.tier.toLowerCase().includes(q)
    );
  }, [licenses, licenseSearch]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#05030a] text-white flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-28 pb-16">
          <div className="flex items-center gap-3 text-purple-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-mono text-sm tracking-widest uppercase">Authenticating Operator...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Unauthenticated State ──
  if (!user) {
    return (
      <div className="min-h-screen bg-[#05030a] text-white flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-16">
          <div className="max-w-md w-full bg-zinc-900/80 border border-purple-500/30 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">Wholesale Reseller Access</h1>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
              Login with your authorized Discord account to access the wholesale credit pool, batch minter, and customer license ledger.
            </p>
            <div className="flex justify-center">
              <DiscordLoginButton />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Unauthorized State (Not an approved reseller) ──
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#05030a] text-white flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-16">
          <div className="max-w-md w-full bg-zinc-900/80 border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">Access Denied</h1>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              {authError || 'Your Discord account is not registered as an authorized reseller for ASYNC DEVELOPMENT.'}
            </p>
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-400 mb-6 font-mono text-left space-y-1">
              <div><span className="text-zinc-600">Discord User ID:</span> <span className="text-zinc-200">{user?.user_metadata?.provider_id || user?.id}</span></div>
              <div><span className="text-zinc-600">Subdomain:</span> <span className="text-purple-400">reseller.asyncdevph.xyz</span></div>
            </div>
            <p className="text-xs text-zinc-500 mb-6">
              To request a wholesale distributor partnership, please open a ticket in our official Discord community.
            </p>
            <a
              href="https://discord.gg/asyncdev"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/30"
            >
              <span>Join Discord Support</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05030a] text-white flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-8 relative z-10">
        {/* ── Top Header & Reseller Balance Card ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border border-purple-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Authorized Wholesale Partner
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                  reseller?.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {reseller?.status === 'active' ? 'Operational' : 'Suspended'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100 mb-2">
                {reseller?.company_name || 'Reseller Portal'}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                Atomic discounted key minter, live wholesale credit balance pool, and customer hardware ID control ledger.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                <span>Uniform Wholesale Rate: <strong className="text-purple-300">Active</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-zinc-500" />
                <span>Total Keys Issued: <strong className="text-zinc-200">{licenses.length}</strong></span>
              </div>
              <button
                onClick={() => fetchPortalData()}
                disabled={loadingData}
                className="ml-auto inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                <span>Sync Balance</span>
              </button>
            </div>
          </div>

          {/* Credit Pool Display */}
          <div className="bg-gradient-to-br from-purple-950/40 via-zinc-900/90 to-zinc-950/90 border border-purple-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold">Credit Balance Pool</span>
                <Coins className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight mt-1">
                ₱{(reseller?.credit_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                Pre-funded balance used to mint client keys on demand.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-purple-500/20">
              <a
                href="https://discord.gg/asyncdev"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <span>Deposit / Top-up Balance</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* ── View Navigation Tabs ── */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Wholesale Catalog & Minter</span>
          </button>

          <button
            onClick={() => setActiveTab('licenses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'licenses'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Issued Licenses Ledger ({licenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Balance Ledger ({transactions.length})</span>
          </button>
        </div>

        {/* ── TAB 1: WHOLESALE CATALOG & KEY GENERATOR ── */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-100">Wholesale Rate Matrix</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Uniform wholesale distributor pricing across all products. Mint 1 to 25 keys per batch directly against your balance.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalog.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow-purple-900/20"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-base font-bold text-zinc-100 group-hover:text-purple-300 transition-colors">
                        {prod.title}
                      </h3>
                      <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                        <Key className="w-4 h-4" />
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                      {prod.description || 'Enterprise grade automation and gaming tooling license.'}
                    </p>

                    <div className="space-y-2 mb-6">
                      {prod.tiers.map((t) => (
                        <div
                          key={t.tier_key}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs font-mono"
                        >
                          <span className="font-semibold text-zinc-300 uppercase">{t.tier_key}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 line-through text-[11px]">₱{t.retail_price.toFixed(2)}</span>
                            <span className="text-emerald-400 font-bold">₱{t.wholesale_price.toFixed(2)}</span>
                            {t.profit_margin > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                +₱{t.profit_margin.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => openMintModal(prod)}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Mint Keys for {prod.title}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: ISSUED LICENSES LEDGER ── */}
        {activeTab === 'licenses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-100">Customer License Ledger</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Scoped strictly to keys issued by your reseller account. Trigger self-service HWID resets for customers (7-day cooldown).
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter keys or Discord ID..."
                  value={licenseSearch}
                  onChange={(e) => setLicenseSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 font-mono"
                />
              </div>
            </div>

            {hwidMessage && (
              <div
                className={`p-4 rounded-2xl border text-xs font-mono flex items-center justify-between ${
                  hwidMessage.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {hwidMessage.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{hwidMessage.text}</span>
                </div>
                <button onClick={() => setHwidMessage(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/60 font-mono text-zinc-400">
                      <th className="py-3 px-4 font-semibold">License Key</th>
                      <th className="py-3 px-4 font-semibold">Tier</th>
                      <th className="py-3 px-4 font-semibold">Daily Limit</th>
                      <th className="py-3 px-4 font-semibold">Status / Customer</th>
                      <th className="py-3 px-4 font-semibold">HWID Lock</th>
                      <th className="py-3 px-4 font-semibold">Issued Date</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {filteredLicenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500 font-sans">
                          No licenses found in your reseller ledger.
                        </td>
                      </tr>
                    ) : (
                      filteredLicenses.map((lic) => {
                        const isRedeemed = Boolean(lic.redeemed_by);
                        return (
                          <tr key={lic.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-100">{lic.license_key}</span>
                                <button
                                  onClick={() => handleCopy(lic.license_key, lic.id)}
                                  className="text-zinc-500 hover:text-zinc-200 transition-colors"
                                  title="Copy Key"
                                >
                                  {copiedKey === lic.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-zinc-800 text-purple-300 border border-zinc-700">
                                {lic.tier}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-zinc-300">
                              {lic.daily_limit} gens/day
                            </td>
                            <td className="py-3 px-4">
                              {isRedeemed ? (
                                <span className="text-zinc-300 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                  <span>{lic.redeemed_by}</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  Unredeemed Stock
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {lic.hwid ? (
                                <div className="flex flex-col">
                                  <span className="text-amber-400 font-semibold text-[11px]">Hardware Bound</span>
                                  <span className="text-[10px] text-zinc-500 truncate max-w-[120px]" title={lic.hwid}>
                                    {lic.hwid}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-zinc-500">Unbound (Next Machine)</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-zinc-400 text-[11px]">
                              {new Date(lic.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleResetHwid(lic.id)}
                                disabled={resettingHwidId === lic.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-sans text-xs transition-colors cursor-pointer border border-zinc-700"
                                title="Enforces 7-day cooldown on customer HWID resets"
                              >
                                <RotateCcw className={`w-3 h-3 ${resettingHwidId === lic.id ? 'animate-spin' : ''}`} />
                                <span>Reset HWID</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: FINANCIAL LEDGER & TRANSACTIONS ── */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-100">Financial Credit Ledger</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Audit trail of top-up deposits, wholesale key mint debits, and balance updates.
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/60 font-mono text-zinc-400">
                      <th className="py-3 px-4 font-semibold">Timestamp</th>
                      <th className="py-3 px-4 font-semibold">Event</th>
                      <th className="py-3 px-4 font-semibold">Amount</th>
                      <th className="py-3 px-4 font-semibold">Balance Before</th>
                      <th className="py-3 px-4 font-semibold">Balance After</th>
                      <th className="py-3 px-4 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500 font-sans">
                          No transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-4 text-zinc-400 text-[11px]">
                            {new Date(tx.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                tx.type === 'deposit'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : tx.type === 'key_mint'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold">
                            <span className={tx.type === 'deposit' ? 'text-emerald-400' : 'text-zinc-200'}>
                              {tx.type === 'deposit' ? '+' : '-'}₱{Number(tx.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-400">
                            ₱{Number(tx.balance_before).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            ₱{Number(tx.balance_after).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-zinc-300 font-sans text-xs">
                            {tx.note || '—'}
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

        {/* ── BATCH KEY MINT MODAL ── */}
        {mintModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Key className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">Batch Key Minter</h3>
                    <p className="text-xs text-zinc-400">{selectedProduct.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMintModalOpen(false);
                    setMintedResult(null);
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!mintedResult ? (
                <div className="space-y-6">
                  {/* Tier Selection */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 font-semibold mb-2">
                      Select Duration Tier
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProduct.tiers.map((t) => (
                        <button
                          key={t.tier_key}
                          type="button"
                          onClick={() => setSelectedTierKey(t.tier_key)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selectedTierKey === t.tier_key
                              ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                              : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <div className="text-xs font-bold uppercase">{t.tier_key}</div>
                          <div className="text-xs font-mono text-purple-300 font-bold mt-1">
                            ₱{t.wholesale_price.toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-mono uppercase text-zinc-400 font-semibold">
                        Quantity (1 – 25 keys)
                      </label>
                      <span className="text-xs font-mono text-zinc-500">Preset buttons:</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      {[1, 5, 10, 25].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setMintQuantity(preset)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                            mintQuantity === preset
                              ? 'bg-purple-600 text-white border-purple-500'
                              : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                          }`}
                        >
                          {preset}x
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={mintQuantity}
                      onChange={(e) => setMintQuantity(Math.max(1, Math.min(25, parseInt(e.target.value) || 1)))}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Price & Balance Calculation Summary */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-zinc-400">
                      <span>Wholesale Rate:</span>
                      <span>₱{(activeSelectedTier?.wholesale_price ?? 0).toFixed(2)} / key</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Quantity:</span>
                      <span>{mintQuantity}x keys</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-zinc-800">
                      <span>Total Debit:</span>
                      <span className="text-purple-400 font-mono">₱{totalMintCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 pt-1 text-[11px]">
                      <span>Remaining Balance:</span>
                      <span className={((reseller?.credit_balance ?? 0) - totalMintCost) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        ₱{((reseller?.credit_balance ?? 0) - totalMintCost).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {mintError && (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{mintError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleBatchMint}
                    disabled={isMinting || ((reseller?.credit_balance ?? 0) < totalMintCost)}
                    className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isMinting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Minting Cryptographic Keys...</span>
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        <span>Confirm & Mint {mintQuantity}x Keys (₱{totalMintCost.toFixed(2)})</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Success Mint Output */
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-white">
                      Successfully Minted {mintedResult.keys.length} Keys!
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Debited ₱{mintedResult.totalCost.toFixed(2)} from your reseller balance.
                    </p>
                  </div>

                  {/* Keys Container */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 max-h-48 overflow-y-auto font-mono text-xs text-purple-300 space-y-1">
                    {mintedResult.keys.map((k, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-zinc-900 last:border-0">
                        <span>{k}</span>
                        <button
                          onClick={() => handleCopy(k, `minted-${idx}`)}
                          className="text-zinc-500 hover:text-white"
                        >
                          {copiedKey === `minted-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleCopy(mintedResult.keys.join('\n'), 'all-minted')}
                      className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'all-minted' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy All</span>
                    </button>

                    <button
                      onClick={() => downloadKeysTxt(mintedResult.keys, mintedResult.productTitle, mintedResult.tier)}
                      className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>.TXT</span>
                    </button>

                    <button
                      onClick={() => downloadKeysCsv(mintedResult.keys, mintedResult.productTitle, mintedResult.tier)}
                      className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.CSV</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setMintModalOpen(false);
                      setMintedResult(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

