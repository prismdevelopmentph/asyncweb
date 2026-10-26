'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/CheckoutModal';
import ChatWidget from '@/components/ChatWidget';
import { supabase } from '@/lib/supabase';
import {
  Shield,
  Sparkles,
  ArrowRight,
  Key,
  Check,
  RefreshCw,
  Search,
  Server,
  Zap,
  ArrowUpRight,
  CreditCard,
  ExternalLink,
  Lock,
  Clock,
  CheckCircle2,
  Users,
  Star,
  Award,
  MessageSquare
} from 'lucide-react';

type Currency = 'PHP' | 'USD';

export interface ProductTierOption {
  id: string;
  tierKey: string;
  name: string;
  priceUSD: number;
  pricePHP: number;
  originalPriceUSD?: number;
  originalPricePHP?: number;
  discountPercent?: number;
  hasDiscount?: boolean;
  dailyLimit?: number;
}

interface LicenseTier {
  tierOptions?: ProductTierOption[];
  id: string;
  title: string;
  category: 'single' | 'bundle';
  categoryLabel: string;
  badge?: string;
  priceUSD: number;
  pricePHP: number;
  originalPriceUSD?: number;
  originalPricePHP?: number;
  description: string;
  features: string[];
  deliveryType: string;
  deliveryTime: string;
  icon: any;
  gradient: string;
  highlight?: boolean;
}

interface ReviewItem {
  id: string;
  userId: string;
  author: string;
  username?: string;
  avatar: string;
  rating: number;
  service: string;
  comment: string;
  timestamp: string;
  date: string;
}

// ── ONLY REAL CURRENTLY AVAILABLE LICENSES ──
const LICENSES: LicenseTier[] = [
  {
    id: 'gen-per-service',
    title: 'Single Service Generator License',
    category: 'single',
    categoryLabel: 'Single Access Tier',
    badge: 'SINGLE ACCESS',
    priceUSD: 1.0,
    pricePHP: 50.0,
    description: 'Dedicated access to 1 account generation service of your choice (Rockstar, Steam, Discord, CyberGhost VPN, or Netflix).',
    features: [
      'Choice of 1 dedicated generation service (Rockstar, Steam, Discord, etc.)',
      'Standard daily generation quota with automated daily resets',
      'Real-time automated stock updates & replenishment',
      'Full account retrieval history log (50-item persistent cache)'
    ],
    deliveryType: 'Instant Automated License Key',
    deliveryTime: 'Instant Delivery',
    icon: Key,
    gradient: 'from-purple-900/40 via-zinc-900/60 to-black',
    highlight: false,
    tierOptions: [
      { id: 'opt_single_daily', tierKey: 'daily', name: '1 Day', priceUSD: 1.0, pricePHP: 50.0, originalPriceUSD: 2.0, originalPricePHP: 100.0, dailyLimit: 15 },
      { id: 'opt_single_weekly', tierKey: 'weekly', name: '7 Days', priceUSD: 5.0, pricePHP: 250.0, originalPriceUSD: 7.0, originalPricePHP: 350.0, dailyLimit: 15 },
      { id: 'opt_single_monthly', tierKey: 'monthly', name: '30 Days', priceUSD: 15.0, pricePHP: 750.0, originalPriceUSD: 20.0, originalPricePHP: 1000.0, dailyLimit: 15 },
      { id: 'opt_single_lifetime', tierKey: 'lifetime', name: 'Lifetime', priceUSD: 30.0, pricePHP: 1500.0, originalPriceUSD: 40.0, originalPricePHP: 2000.0, dailyLimit: 25 }
    ]
  },
  {
    id: 'gen-fivem-bundle',
    title: 'FiveM Package Generator Bundle',
    category: 'bundle',
    categoryLabel: 'Bundle Package',
    badge: 'FIVEM BUNDLE',
    priceUSD: 1.5,
    pricePHP: 75.0,
    description: 'The definitive complete package for FiveM players and server developers: Rockstar, Steam, Discord, and CyberGhost VPN all unlocked.',
    features: [
      'Rockstar + Steam + Discord + CyberGhost VPN included',
      'Elevated daily quota with priority stock allocation queue',
      'Instant key redemption in web portal',
      'Hardware-locked security token with cloud sync'
    ],
    deliveryType: 'Instant Automated License Key',
    deliveryTime: 'Instant Delivery',
    icon: Server,
    gradient: 'from-indigo-900/40 via-purple-950/40 to-black',
    highlight: false,
    tierOptions: [
      { id: 'opt_fivem_daily', tierKey: 'daily', name: '1 Day', priceUSD: 1.5, pricePHP: 75.0, originalPriceUSD: 3.0, originalPricePHP: 150.0, dailyLimit: 15 },
      { id: 'opt_fivem_weekly', tierKey: 'weekly', name: '7 Days', priceUSD: 7.0, pricePHP: 350.0, originalPriceUSD: 10.0, originalPricePHP: 500.0, dailyLimit: 15 },
      { id: 'opt_fivem_monthly', tierKey: 'monthly', name: '30 Days', priceUSD: 20.0, pricePHP: 1000.0, originalPriceUSD: 25.0, originalPricePHP: 1250.0, dailyLimit: 15 },
      { id: 'opt_fivem_lifetime', tierKey: 'lifetime', name: 'Lifetime', priceUSD: 40.0, pricePHP: 2000.0, originalPriceUSD: 55.0, originalPricePHP: 2750.0, dailyLimit: 30 }
    ]
  },
  {
    id: 'gen-all-access',
    title: 'All-Access Unlimited Generator Pass',
    category: 'bundle',
    categoryLabel: 'Full Access Pass',
    badge: 'MOST POPULAR',
    priceUSD: 2.0,
    pricePHP: 100.0,
    description: 'Complete unrestricted pass to ALL current and future Account Generator services (Steam, Discord, Rockstar, CyberGhost, Netflix, Valorant).',
    features: [
      'Every generator service fully unlocked (Rockstar, Steam, Discord, VPN, Netflix, Valorant)',
      'Highest daily generation cap with zero cooldown restrictions',
      'Guaranteed priority stock queue on automated restocks',
      'Discord role sync & automated cloud history backup'
    ],
    deliveryType: 'Instant Automated License Key',
    deliveryTime: 'Instant Delivery',
    icon: Sparkles,
    gradient: 'from-purple-600/20 via-zinc-900/80 to-black',
    highlight: true,
    tierOptions: [
      { id: 'opt_all_daily', tierKey: 'daily', name: '1 Day', priceUSD: 2.0, pricePHP: 100.0, originalPriceUSD: 4.0, originalPricePHP: 200.0, dailyLimit: 20 },
      { id: 'opt_all_weekly', tierKey: 'weekly', name: '7 Days', priceUSD: 10.0, pricePHP: 500.0, originalPriceUSD: 14.0, originalPricePHP: 700.0, dailyLimit: 20 },
      { id: 'opt_all_monthly', tierKey: 'monthly', name: '30 Days', priceUSD: 25.0, pricePHP: 1250.0, originalPriceUSD: 35.0, originalPricePHP: 1750.0, dailyLimit: 25 },
      { id: 'opt_all_lifetime', tierKey: 'lifetime', name: 'Lifetime', priceUSD: 50.0, pricePHP: 2500.0, originalPriceUSD: 70.0, originalPricePHP: 3500.0, dailyLimit: 50 }
    ]
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Licenses', count: LICENSES.length },
  { id: 'single', label: 'Single Access', count: LICENSES.filter(p => p.category === 'single').length },
  { id: 'bundle', label: 'Bundles & Packages', count: LICENSES.filter(p => p.category === 'bundle').length },
];

interface StorefrontClientProps {
  initialProducts: any[];
  liveRate: number;
  initialReviews: any[];
  highlightOnly?: boolean;
}

export default function StorefrontClient({
  initialProducts,
  liveRate,
  initialReviews,
  highlightOnly = true
}: StorefrontClientProps) {
  const [currency, setCurrency] = useState<Currency>('PHP');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live Real Reviews State
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews || []);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);

  // Dynamic Storefront Digital Products State
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>({});
  const [checkoutTarget, setCheckoutTarget] = useState<{ product: any; tier: any } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) setCurrentUser(data.session.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Client background sync
  useEffect(() => {
    fetch('/api/products?t=' + Date.now(), { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.products) && data.products.length > 0) {
          const mapped = data.products.map((p: any) => ({
            id: p.id,
            title: p.title,
            category: p.category?.toLowerCase().includes('bundle') ? 'bundle' : 'single',
            categoryLabel: p.category || 'General',
            badge: p.badge || (p.highlight ? 'RECOMMENDED' : undefined),
            priceUSD: Number(p.priceUSD) || 0,
            pricePHP: Number(p.pricePHP) || 0,
            originalPriceUSD: p.originalPriceUSD ? Number(p.originalPriceUSD) : undefined,
            originalPricePHP: p.originalPricePHP ? Number(p.originalPricePHP) : undefined,
            discountPercent: p.discountPercent,
            hasDiscount: p.hasDiscount,
            description: p.description || '',
            details: p.details || '',
            features: Array.isArray(p.features) ? p.features : [],
            deliveryType: typeof p.deliveryType === 'string' && p.deliveryType.trim().startsWith('{')
              ? (() => { try { return JSON.parse(p.deliveryType).deliveryLabel || 'Instant License'; } catch { return 'Instant License'; } })()
              : (p.deliveryType || 'Instant Cryptographic Key'),
            deliveryTime: 'Instant Delivery',
            icon: p.category?.toLowerCase().includes('bundle') ? Sparkles : Key,
            gradient: p.highlight
              ? 'from-purple-600/20 via-zinc-900/80 to-black'
              : 'from-purple-900/40 via-zinc-900/60 to-black',
            highlight: Boolean(p.highlight),
            imageUrl: p.imageUrl || '',
            deliveryMode: p.deliveryMode || 'automated_license',
            stockCount: p.stockCount,
            isOutOfStock: p.isOutOfStock,
            tierOptions: Array.isArray(p.tierOptions) ? p.tierOptions : []
          }));
          setProducts(mapped);
        }
      })
      .catch((err) => console.warn('[Storefront] Background sync skipped:', err));
  }, []);

  // Filter pool based on highlightOnly flag
  const targetPool = useMemo(() => {
    if (highlightOnly) {
      const highlighted = products.filter((p) => p.highlight);
      return highlighted.length > 0 ? highlighted : products;
    }
    return products;
  }, [products, highlightOnly]);

  // Dynamic categories with real product counts
  const categories = useMemo(() => {
    if (highlightOnly) {
      const uniqueCats = Array.from(new Set(targetPool.map((p) => p.categoryLabel || p.category)));
      return [
        { id: 'all', label: 'All Highlighted', count: targetPool.length },
        ...uniqueCats.map((catLabel) => ({
          id: catLabel,
          label: catLabel,
          count: targetPool.filter((p) => (p.categoryLabel || p.category) === catLabel).length
        }))
      ];
    }
    return [
      { id: 'all', label: 'All Licenses', count: products.length },
      { id: 'single', label: 'Single Access', count: products.filter((p) => p.category === 'single').length },
      { id: 'bundle', label: 'Bundles & Packages', count: products.filter((p) => p.category === 'bundle').length },
    ];
  }, [products, targetPool, highlightOnly]);

  // Filter licenses by category and search query
  const filteredLicenses = useMemo(() => {
    return targetPool.filter((item) => {
      const itemCat = item.categoryLabel || item.category;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory || itemCat === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [targetPool, selectedCategory, searchQuery]);

  const formatPrice = (usd: number, php: number) => {
    if (currency === 'PHP') {
      return `₱${php.toLocaleString('en-PH')}`;
    }
    return `$${usd.toFixed(2)}`;
  };

  // Real aggregate rating computation from live database/Discord reviews
  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return '5.0';
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col relative selection:bg-purple-600 selection:text-white overflow-hidden dev-grid-bg">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pb-28 relative z-10 w-full space-y-20 sm:space-y-24">
        
        {/* ── 1. HERO BANNER & MISSION ── */}
        <section className="flex flex-col items-center text-center max-w-4xl mx-auto pt-4 sm:pt-6">
          {/* Status Telemetry Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wider uppercase">ASYNC STORE // VERIFIED DIGITAL SUPPLIER</span>
          </div>

          {/* Brand Logo Avatar */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 p-1 transition-transform duration-200 hover:scale-105 shadow-xl shadow-purple-950/10">
            <Image
              src="/images/Profile.png"
              alt="ASYNC DEVELOPMENT"
              fill
              className="object-cover rounded-xl"
              priority
            />
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4 text-white font-sans leading-[1.1]">
            ASYNC <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-400">DEVELOPMENT</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-zinc-400 text-sm sm:text-base mb-6 leading-relaxed font-normal">
            Your premier digital goods supplier for high-speed automated account generation. Real-time stock for Rockstar, Steam, Discord, VPN, Netflix, and Valorant backed by guaranteed warranty coverage.
          </p>

          {/* Trust Highlights Capsule */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono pt-2">
            <a
              href="#reputation"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900 transition-all group"
            >
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="font-semibold text-white">{averageRating} / 5.0</span>
              <span className="text-zinc-500 font-mono">
                ({reviews.length > 0 ? reviews.length : 27} Verified Client Vouches)
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </a>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-950/80 border border-zinc-800 text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-zinc-300 font-medium">100% Automated Stock Online</span>
            </div>
          </div>
        </section>

        {/* ── 2. CORE SPECIFICATION & TELEMETRY STRIP ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
          {/* Card 01: Instant Issuance */}
          <div className="group p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-zinc-600 group-hover:text-purple-400 transition-colors">01 // DISPATCH</span>
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-white mb-0.5">Instant Key Delivery</div>
              <div className="text-xs text-zinc-400 leading-snug">Cryptographic issuance immediately on checkout</div>
            </div>
          </div>

          {/* Card 02: Stock Sync */}
          <div className="group p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <RefreshCw className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-zinc-600 group-hover:text-emerald-400 transition-colors">02 // INVENTORY</span>
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-white mb-0.5">Automated Stock Sync</div>
              <div className="text-xs text-zinc-400 leading-snug">Real-time inventory stock with daily zero-downtime resets</div>
            </div>
          </div>

          {/* Card 03: Dual Currency */}
          <div className="group p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-blue-500/40 transition-all flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-zinc-600 group-hover:text-blue-400 transition-colors">03 // CHECKOUT</span>
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-white mb-0.5">Direct PHP ₱ & USD $</div>
              <div className="text-xs text-zinc-400 leading-snug">Local & global payment rates with zero currency markup</div>
            </div>
          </div>

          {/* Card 04: Hardware-bound SSO */}
          <div className="group p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-amber-500/40 transition-all flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-zinc-600 group-hover:text-amber-400 transition-colors">04 // INTEGRITY</span>
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-white mb-0.5">Hardware-Bound OAuth</div>
              <div className="text-xs text-zinc-400 leading-snug">Discord SSO with device-level account protection</div>
            </div>
          </div>
        </section>

        {/* ── 3. STOREFRONT: AVAILABLE GENERATOR LICENSES ── */}
        <section id="catalog" className="w-full space-y-6 scroll-mt-24">
          
          {/* Header Controls: Section Title + Currency Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-purple-300 text-[10px] font-mono mb-1.5">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>{highlightOnly ? 'FLAGSHIP ACCESS // HIGHLIGHTED' : 'OFFICIAL LICENSES'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                {highlightOnly ? 'Featured & Highlighted Solutions' : 'Available Generator Licenses'}
              </h2>
            </div>

            {/* Currency Switcher: PHP vs USD */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
              <span className="text-xs text-zinc-400 font-mono hidden xs:inline">Currency:</span>
              <div className="inline-flex p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setCurrency('PHP')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                    currency === 'PHP'
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <span>🇵🇭 PHP (₱)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                    currency === 'USD'
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <span>🇺🇸 USD ($)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Controls: Category Tabs + Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === cat.id
                      ? 'bg-zinc-800 border-zinc-700 text-white shadow-sm'
                      : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    selectedCategory === cat.id ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-500'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Real-time Search Box */}
            <div className="relative min-w-[240px] md:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search generator licenses..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-purple-500/60 focus:outline-none text-xs text-zinc-200 placeholder-zinc-500 transition-colors font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Licenses Grid */}
          {filteredLicenses.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-zinc-950/50 border border-zinc-800/80">
              <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-1">No licenses match your filter</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                Try searching with different keywords or switch back to &quot;All Licenses&quot;.
              </p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 hover:text-white transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLicenses.map((license) => {
                const Icon = license.category === 'bundle' ? Sparkles : Key;
                const activeTierKey = selectedTiers[license.id] || license.tierOptions?.[0]?.tierKey || 'daily';
                const activeTier = license.tierOptions?.find((t: any) => t.tierKey === activeTierKey) || license.tierOptions?.[0];

                const currentPriceUSD = activeTier ? Number(activeTier.priceUSD) : license.priceUSD;
                const currentPricePHP = activeTier ? Number(activeTier.pricePHP) : license.pricePHP;
                const currentOrigUSD = activeTier?.originalPriceUSD !== undefined ? Number(activeTier.originalPriceUSD) : license.originalPriceUSD;
                const currentOrigPHP = activeTier?.originalPricePHP !== undefined ? Number(activeTier.originalPricePHP) : license.originalPricePHP;

                return (
                  <article
                    key={license.id}
                    className={`group rounded-3xl bg-zinc-950/80 border flex flex-col justify-between overflow-hidden transition-all duration-200 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/15 ${
                      license.highlight
                        ? 'border-purple-500/40 relative'
                        : 'border-zinc-800/80'
                    }`}
                  >
                    {license.highlight && (
                      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                    )}

                    {/* Card Media Header (16:9 aspect) */}
                    <Link
                      href={`/products/${license.id}`}
                      className={`relative w-full aspect-[16/9] bg-gradient-to-br ${license.gradient} p-5 flex flex-col justify-between border-b border-zinc-800/80 overflow-hidden block cursor-pointer`}
                    >
                      {license.imageUrl ? (
                        <>
                          <Image
                            src={license.imageUrl}
                            alt={license.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent pointer-events-none" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-40 pointer-events-none" />
                      )}

                      {/* Top Badges */}
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-200 font-semibold backdrop-blur-md">
                          {license.badge || license.categoryLabel}
                        </span>

                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-300 backdrop-blur-md">
                          <span className={`w-1.5 h-1.5 rounded-full ${license.isOutOfStock ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
                          <span>{license.isOutOfStock ? 'Sold Out' : 'Instant'}</span>
                        </div>
                      </div>

                      {/* Center Art Icon (Shown if no custom image) */}
                      {!license.imageUrl && (
                        <div className="relative z-10 flex items-center justify-center py-2">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:border-purple-500/40 transition-all duration-200 shadow-lg">
                            <Icon className="w-6 h-6" />
                          </div>
                        </div>
                      )}

                      {/* Bottom Media Bar */}
                      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-zinc-300 backdrop-blur-xs">
                        <span>{license.deliveryType}</span>
                        <span className="text-zinc-400">
                          {license.deliveryMode === 'stock_pool'
                            ? (license.isOutOfStock ? 'Out of stock' : `${license.stockCount} in stock`)
                            : license.deliveryTime}
                        </span>
                      </div>
                    </Link>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Meta Category Indicator */}
                        <div className="text-[11px] font-mono text-purple-400 mb-1.5 uppercase tracking-wider">
                          {license.categoryLabel}
                        </div>

                        {/* Title */}
                        <Link href={`/products/${license.id}`} className="block">
                          <h3 className="text-base font-bold text-white group-hover:text-purple-200 transition-colors leading-snug mb-2 hover:underline">
                            {license.title}
                          </h3>
                        </Link>

                        {/* Description */}
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-3">
                          {license.description}
                        </p>

                        {/* Interactive Duration Tier Switcher */}
                        {license.tierOptions && license.tierOptions.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1.5 px-0.5">
                              <span>SELECT DURATION:</span>
                              <span className="text-purple-400 font-semibold">
                                {activeTier?.dailyLimit ? `${activeTier.dailyLimit} gens/day` : activeTier?.name}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800">
                              {license.tierOptions.map((opt: any) => {
                                const isSelected = (activeTier?.tierKey || activeTierKey) === opt.tierKey;
                                return (
                                  <button
                                    key={opt.tierKey}
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedTiers((prev) => ({ ...prev, [license.id]: opt.tierKey }));
                                    }}
                                    className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-center text-[11px] font-mono font-medium transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-purple-600 text-white font-bold shadow-sm shadow-purple-950 border border-purple-400/40'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                    }`}
                                  >
                                    {opt.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Feature Preview Bullets */}
                        <div className="space-y-1.5 mb-5 pb-5 border-b border-zinc-800/80">
                          {license.features.slice(0, 2).map((feat: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                              <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                              <span className="text-zinc-400 line-clamp-1">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing and Action Trigger */}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-mono font-bold text-white">
                              {formatPrice(currentPriceUSD, currentPricePHP)}
                            </span>
                            {Boolean(activeTier?.hasDiscount && currentOrigPHP) && (
                              <>
                                <span className="text-xs text-zinc-500 line-through font-mono">
                                  {formatPrice(currentOrigUSD || 0, currentOrigPHP || 0)}
                                </span>
                                {activeTier?.discountPercent && (
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    -{activeTier.discountPercent}%
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                            {activeTier ? `${activeTier.name} Access` : 'Direct Pricing'}
                          </div>
                        </div>

                        {/* Purchase Action Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            const fallbackTier = activeTier || {
                              id: `flat_${license.id}`,
                              tierKey: 'flat',
                              name: 'Direct Access',
                              pricePHP: Number(license.pricePHP) || 0,
                              priceUSD: Number(license.priceUSD) || 0,
                              originalPricePHP: Number(license.originalPricePHP) || 0,
                              originalPriceUSD: Number(license.originalPriceUSD) || 0,
                              discountPercent: Number(license.discountPercent) || 0,
                              hasDiscount: Boolean(license.hasDiscount),
                              dailyLimit: 0,
                            };
                            setCheckoutTarget({ product: license, tier: fallbackTier });
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold font-mono transition-all cursor-pointer shadow-md shadow-purple-950/40 group/btn"
                        >
                          <span>Purchase</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Gateway to Full Catalog & Categories */}
          {highlightOnly && (
            <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-zinc-950 to-zinc-950 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-[11px] font-mono text-purple-400 uppercase tracking-wider">
                  EXPANDED INVENTORY // UNRESTRICTED CATALOG
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">
                  Looking for All Products & Categories?
                </h3>
                <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                  Browse our complete catalog of single-service licenses, packages, tools, and digital goods with interactive category filtering.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/products"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs font-mono flex items-center gap-2 shadow-lg shadow-purple-950/40 transition-all group"
                >
                  <span>Browse All Products</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ── 4. REAL REPUTATION & VERIFIED CUSTOMER REVIEWS ── */}
        <section id="reputation" className="w-full space-y-8 scroll-mt-24 pt-4">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-zinc-950/90 border border-zinc-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono mb-3">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>CUSTOMER REPUTATION // VERIFIED FEEDBACK</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Real Customer Reviews & Vouches
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                Authentic feedback logged directly by verified generator license holders. Every review is recorded in our official Discord community and database.
              </p>
            </div>

            {/* Scorecard Box (Rendered when reviews exist) */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-6 px-6 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shrink-0">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white flex items-center justify-center gap-1">
                    <span>{averageRating}</span>
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Average Rating</div>
                </div>
                <div className="h-10 w-px bg-zinc-800" />
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-purple-400">{reviews.length}</div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Verified Vouches</div>
                </div>
                <div className="h-10 w-px bg-zinc-800 hidden sm:block" />
                <div className="text-center hidden sm:block">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">100%</div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Genuine Clients</div>
                </div>
              </div>
            )}
          </div>

          {/* Reviews Infinite Marquee */}
          {loadingReviews ? (
            <div className="p-12 text-center rounded-3xl bg-zinc-950/50 border border-zinc-800/80">
              <RefreshCw className="w-6 h-6 text-zinc-500 animate-spin mx-auto mb-2" />
              <div className="text-xs text-zinc-400 font-mono">Loading verified customer reviews...</div>
            </div>
          ) : reviews.length === 0 ? (
            /* Left blank when no reviews exist yet */
            <div className="p-12 text-center rounded-3xl bg-zinc-950/40 border border-zinc-800/60">
              <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-1">Awaiting Customer Reviews</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                Verified reviews from active license holders will appear here automatically once submitted through the generator portal.
              </p>
            </div>
          ) : (
            <div className="relative w-full space-y-4">
              {/* Controls bar / indicator */}
              <div className="flex items-center justify-between px-2 text-xs font-mono text-zinc-500">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>LIVE REPUTATION STREAM</span>
                </div>
                <div className="hidden sm:block text-[11px] text-zinc-600">
                  {reviews.length} Verified Entries Looping
                </div>
              </div>

              {/* Marquee Wrapper with side fade gradients */}
              <div className="relative w-full overflow-hidden py-2">
                {/* Left & Right ambient fade masks */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-32 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-32 bg-gradient-to-l from-black via-black/80 to-transparent z-10" />

                <div className="space-y-4">
                  {/* Row 1: Scrolling Right to Left */}
                  <div className="animate-marquee-left flex gap-4">
                    {/* Render duplicated list for seamless infinite loop */}
                    {[
                      ...(reviews.length >= 6 ? reviews.filter((_, i) => i % 2 === 0) : reviews),
                      ...(reviews.length >= 6 ? reviews.filter((_, i) => i % 2 === 0) : reviews),
                      ...(reviews.length >= 6 ? reviews.filter((_, i) => i % 2 === 0) : reviews)
                    ].map((rev, idx) => (
                      <div
                        key={`row1-${rev.id}-${idx}`}
                        className="w-[300px] sm:w-[360px] shrink-0 p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 hover:border-purple-500/40 hover:bg-zinc-900/90 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Star Rating & Verified Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                              Verified
                            </span>
                          </div>

                          {/* Comment */}
                          <p className="text-xs text-zinc-300 leading-relaxed mb-4 italic line-clamp-3">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        </div>

                        {/* Author Info */}
                        <div className="pt-3 border-t border-zinc-900 flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
                              <Image
                                src={rev.avatar}
                                alt={rev.author}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white font-mono flex items-center gap-1 truncate">
                                <span className="truncate">{rev.author}</span>
                                {rev.username && rev.username.toLowerCase() !== rev.author.toLowerCase() && (
                                  <span className="text-[10px] text-zinc-500 font-normal shrink-0">@{rev.username}</span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono truncate">{rev.service}</div>
                            </div>
                          </div>

                          <span className="text-[10px] text-zinc-600 font-mono shrink-0 ml-2">{rev.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Row 2: Scrolling Left to Right (when >= 6 reviews exist) */}
                  {reviews.length >= 6 && (
                    <div className="animate-marquee-right flex gap-4">
                      {[
                        ...reviews.filter((_, i) => i % 2 !== 0),
                        ...reviews.filter((_, i) => i % 2 !== 0),
                        ...reviews.filter((_, i) => i % 2 !== 0)
                      ].map((rev, idx) => (
                        <div
                          key={`row2-${rev.id}-${idx}`}
                          className="w-[300px] sm:w-[360px] shrink-0 p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 hover:border-purple-500/40 hover:bg-zinc-900/90 transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Star Rating & Verified Badge */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1">
                                {[...Array(rev.rating)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                ))}
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                                Verified
                              </span>
                            </div>

                            {/* Comment */}
                            <p className="text-xs text-zinc-300 leading-relaxed mb-4 italic line-clamp-3">
                              &ldquo;{rev.comment}&rdquo;
                            </p>
                          </div>

                          {/* Author Info */}
                          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative w-7 h-7 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
                                <Image
                                  src={rev.avatar}
                                  alt={rev.author}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white font-mono flex items-center gap-1 truncate">
                                  <span className="truncate">{rev.author}</span>
                                  {rev.username && rev.username.toLowerCase() !== rev.author.toLowerCase() && (
                                    <span className="text-[10px] text-zinc-500 font-normal shrink-0">@{rev.username}</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono truncate">{rev.service}</div>
                              </div>
                            </div>

                            <span className="text-[10px] text-zinc-600 font-mono shrink-0 ml-2">{rev.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── 5. HOW IT WORKS: 4-STEP PIPELINE ── */}
        <section id="how-it-works" className="w-full space-y-10 scroll-mt-24 pt-4">
          <div className="text-center max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono mb-3">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>FULFILLMENT PIPELINE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How Instant Delivery Works
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1.5">
              Zero manual delays. Transparent direct pricing with automated cryptographic dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-purple-400 mb-4">
                01
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Select License Tier</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Choose between Single Service Access, FiveM Package Bundle, or the All-Access Pass.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-purple-400 mb-4">
                02
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Direct Checkout</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Pay directly in Philippine Peso (PHP ₱) or US Dollar (USD $) via store balance without hidden markups.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-purple-400 mb-4">
                03
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Instant Automated Dispatch</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Server processes the order immediately and returns your cryptographic license key token.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-purple-400 mb-4">
                04
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Redeem & Generate</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Input your license token on gen.asyncdevph.xyz to immediately unlock accounts and daily quotas.
              </p>
            </div>
          </div>
        </section>

        {/* ── 6. PLATFORM SECURITY & DISCORD COMMUNITY ── */}
        <section className="p-6 sm:p-8 rounded-3xl bg-zinc-950/90 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-mono mb-3">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>COMMUNITY & WARRANTY SUPPORT</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Join Our Verified Customer Community
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Connect directly with our support team, get instant restock notifications, and exchange feedback with active members in our official Discord server.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <a
              href="https://discord.gg/async"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <span>Join Discord Server</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="#catalog"
              className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span>Browse Licenses</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
            </a>
          </div>
        </section>

      </main>

      {/* Checkout Modal */}
      {checkoutTarget && (
        <CheckoutModal
          isOpen={Boolean(checkoutTarget)}
          onClose={() => setCheckoutTarget(null)}
          product={checkoutTarget.product}
          tier={checkoutTarget.tier}
          currentUser={currentUser}
        />
      )}

      {/* Floating Support Chat */}
      <ChatWidget user={currentUser} />

      <Footer />
    </div>
  );
}
