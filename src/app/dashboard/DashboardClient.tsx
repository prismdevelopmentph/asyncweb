'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Wallet, 
  Key, 
  ShoppingBag, 
  Share2, 
  MessageSquare, 
  Copy, 
  Check, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck, 
  Download, 
  RefreshCw, 
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import TopUpModal from '@/components/TopUpModal';

interface DashboardData {
  user: {
    discordId: string;
    username: string;
    avatarUrl: string | null;
    email: string | null;
  };
  balance: {
    balancePhp: number;
    currency: string;
  };
  referral: {
    code: string;
    timesUsed: number;
    inviteUrl: string;
  };
  orders: any[];
  licenses: any[];
  plans: any[];
}

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'licenses'>('overview');
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [downloadingClient, setDownloadingClient] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('Please log in with Discord to access your account dashboard.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || 'Failed to load dashboard data.');
        setLoading(false);
        return;
      }

      const resData = await res.json();
      setData(resData);
      setLoading(false);
    } catch (err: any) {
      console.error('[DashboardClient] Error:', err);
      setError('Network communication error. Please reload.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyReferralLink = (code: string) => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDownloadApp = async () => {
    setDownloadingClient(true);
    setDownloadToast(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setDownloadToast('Session expired. Please log in again.');
        setDownloadingClient(false);
        return;
      }

      const res = await fetch('/api/download/ticket', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setDownloadToast(errJson.error || 'Active license required to download desktop client.');
        setDownloadingClient(false);
        return;
      }

      const dData = await res.json();
      if (dData.downloadUrl) {
        window.location.href = dData.downloadUrl;
        setDownloadToast('Download started successfully.');
      } else {
        setDownloadToast('Could not resolve download ticket.');
      }
    } catch (err) {
      console.error('[Dashboard Client Download] Error:', err);
      setDownloadToast('Download error. Please retry.');
    } finally {
      setTimeout(() => setDownloadingClient(false), 3000);
      setTimeout(() => setDownloadToast(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col dev-grid-bg">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
          <p className="text-xs font-mono text-zinc-500 tracking-wider">SYNCING ACCOUNT TELEMETRY...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col dev-grid-bg">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Account Required</h2>
          <p className="text-xs text-zinc-400 mb-6">{error || 'Please connect your Discord account to view your dashboard.'}</p>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  const { user, balance, referral, orders, licenses, plans } = data;
  const totalPurchases = orders.length;
  const activeLicenses = licenses.filter((l) => {
    if (!l.is_active) return false;
    if (!l.expires_at) return true;
    return new Date(l.expires_at) > new Date();
  });

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col dev-grid-bg selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
        
        {/* Top Profile Header */}
        <section className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl">
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-zinc-700/80 shrink-0 bg-zinc-900">
                <Image
                  src={user.avatarUrl || '/images/Profile.png'}
                  alt={user.username}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{user.username}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 border border-purple-500/30 text-purple-400">
                    Verified Customer
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-500 flex items-center gap-2">
                  <span>ID: {user.discordId}</span>
                  {user.email && <span className="text-zinc-600">&bull; {user.email}</span>}
                </p>
              </div>
            </div>

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={() => setIsTopUpOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-950/40"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Top Up Balance</span>
              </button>

              <button
                onClick={handleDownloadApp}
                disabled={downloadingClient}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>{downloadingClient ? 'Preparing...' : 'Desktop App'}</span>
              </button>

              <Link
                href="/generator"
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Launch Gen</span>
              </Link>
            </div>
          </div>

          {downloadToast && (
            <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono">
              {downloadToast}
            </div>
          )}
        </section>

        {/* 3 Stat Widgets Row: Balance / Active Subscriptions / Referral */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Web Balance */}
          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Web Balance</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold font-mono text-white tracking-tight">
                ₱{balance.balancePhp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Zero payment gateway fees on instant checkout</p>
            </div>

            <button
              onClick={() => setIsTopUpOpen(true)}
              className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-purple-400 border border-zinc-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Deposit PHP</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Active Licenses & Subscriptions */}
          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active Services</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Key className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold font-mono text-white tracking-tight">
                {activeLicenses.length + plans.length}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {activeLicenses.length} Generator Licenses &bull; {plans.length} Subscriptions
              </p>
            </div>

            <button
              onClick={() => setActiveTab('licenses')}
              className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Manage Licenses</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Referral Program & Discord */}
          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Referral & Community</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Share2 className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">Your Promo Code:</span>
                <span className="font-mono text-xs font-bold text-purple-400">{referral.code}</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Earn rewards when friends purchase using your store link.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => copyReferralLink(referral.code)}
                className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
              >
                {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRef ? 'Copied' : 'Share Link'}</span>
              </button>

              <a
                href={referral.inviteUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discord</span>
              </a>
            </div>
          </div>

        </section>

        {/* Tab Navigation Controls */}
        <section className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-zinc-900 text-white border border-zinc-700/80'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
          >
            Overview & Purchases ({totalPurchases})
          </button>
          <button
            onClick={() => setActiveTab('licenses')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'licenses'
                ? 'bg-zinc-900 text-white border border-zinc-700/80'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
          >
            Delivered Keys & Plans ({licenses.length + plans.length})
          </button>
        </section>

        {/* Main Content Table Area */}
        {activeTab === 'overview' ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Order & Fulfillment History</h3>
                <p className="text-xs text-zinc-500">Every verified transaction and credential issued to your account</p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs transition-colors flex items-center gap-1.5"
                title="Refresh Records"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/60 space-y-3">
                <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-semibold text-white">No Orders Found</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  You haven&apos;t placed any storefront orders yet. Browse our automated inventory to get instant access.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                >
                  <span>Explore Catalog</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/50 overflow-hidden divide-y divide-zinc-900">
                {orders.map((order) => {
                  const isDelivered = order.status === 'delivered';
                  const isAwaiting = order.status === 'awaiting_payment';
                  const isPending = order.status === 'pending';
                  const isMismatch = order.status === 'payment_mismatch';
                  const isFailed = order.status === 'fulfillment_failed';

                  const deliveredList: string[] = Array.isArray(order.payment_details?.delivered_licenses)
                    ? order.payment_details.delivered_licenses
                    : order.license_key ? [order.license_key] : [];

                  return (
                    <div key={order.id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-zinc-900/30 transition-colors">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-white">
                            {order.id.slice(0, 8).toUpperCase()}
                          </span>
                          
                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                            isDelivered
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : isAwaiting
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : isMismatch
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {order.status.toUpperCase()}
                          </span>

                          <span className="text-[11px] font-mono text-zinc-500">
                            {new Date(order.created_at).toLocaleDateString()} &bull; {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="text-xs text-zinc-300 flex items-center gap-2">
                          <span className="font-medium text-white">
                            {order.order_type === 'balance_topup' ? 'Wallet Top-Up' : (order.tier_key || 'Standard Product')}
                          </span>
                          <span className="text-zinc-600">&bull;</span>
                          <span className="text-zinc-400">{order.provider_label || order.provider}</span>
                        </div>

                        {/* Delivered Keys if present */}
                        {isDelivered && deliveredList.length > 0 && (
                          <div className="pt-2 flex flex-col gap-1.5">
                            <span className="text-[11px] font-mono text-zinc-500 uppercase">Delivered Key(s) / Account(s):</span>
                            <div className="flex flex-wrap gap-2">
                              {deliveredList.map((cred, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-purple-300">
                                  <span className="select-all truncate max-w-xs">{cred}</span>
                                  <button
                                    onClick={() => copyToClipboard(cred, `${order.id}-${idx}`)}
                                    className="p-1 hover:text-white transition-colors text-zinc-400"
                                    title="Copy Credential"
                                  >
                                    {copiedKey === `${order.id}-${idx}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-white">
                            {order.currency === 'PHP' ? '₱' : '$'}{Number(order.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">{order.currency}</span>
                        </div>

                        <Link
                          href={`/order/${order.id}`}
                          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="View Order Receipt"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Active Licenses & Subscriptions</h3>
                <p className="text-xs text-zinc-500">Cryptographic tokens and quota limits bound to your Discord ID</p>
              </div>
              <Link
                href="/generator"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Open Generator</span>
              </Link>
            </div>

            {licenses.length === 0 && plans.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/60 space-y-3">
                <Key className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-semibold text-white">No Active Licenses</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  You do not currently possess any active generator licenses or plan subscriptions.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                >
                  <span>Purchase License</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {licenses.map((lic) => {
                  const isLifetime = !lic.expires_at || lic.tier === 'lifetime' || lic.tier === 'flat';
                  const isExpired = !isLifetime && new Date(lic.expires_at) < new Date();

                  return (
                    <div key={lic.id} className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-4 relative overflow-hidden">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white capitalize">{lic.tier || 'Standard'} Tier</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                              lic.is_active && !isExpired
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}>
                              {lic.is_active && !isExpired ? 'ACTIVE' : 'EXPIRED'}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono">Mode: {lic.quota_mode || 'shared'}</span>
                        </div>

                        <div className="text-right text-xs">
                          <span className="text-zinc-500 block text-[10px] uppercase font-mono">Daily Quota</span>
                          <span className="font-mono font-bold text-purple-400">{lic.daily_limit || 15} Accs / Day</span>
                        </div>
                      </div>

                      {/* License Key Box */}
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-zinc-300 select-all truncate">{lic.license_key}</span>
                        <button
                          onClick={() => copyToClipboard(lic.license_key, lic.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Copy Key"
                        >
                          {copiedKey === lic.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="text-[11px] font-mono text-zinc-500 flex items-center justify-between">
                        <span>Expires: {isLifetime ? 'Never (Lifetime)' : new Date(lic.expires_at).toLocaleDateString()}</span>
                        <Link href="/generator" className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                          <span>Open Gen</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {plans.map((plan) => (
                  <div key={plan.id} className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{plan.plan_name || 'VIP Subscription'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30">
                        {plan.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">Provides elevated service tier quotas and priority support access.</p>
                    <div className="text-[11px] font-mono text-zinc-500">
                      Expires: {plan.expires_at ? new Date(plan.expires_at).toLocaleDateString() : 'Active'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>

      {/* Top Up Modal */}
      {isTopUpOpen && (
        <TopUpModal
          isOpen={isTopUpOpen}
          onClose={() => setIsTopUpOpen(false)}
        />
      )}
    </div>
  );
}
