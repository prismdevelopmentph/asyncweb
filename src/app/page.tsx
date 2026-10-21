'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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

interface LicenseTier {
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
    priceUSD: 20,
    pricePHP: 1150,
    originalPriceUSD: 25,
    originalPricePHP: 1450,
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
    highlight: false
  },
  {
    id: 'gen-fivem-bundle',
    title: 'FiveM Package Generator Bundle',
    category: 'bundle',
    categoryLabel: 'Bundle Package',
    badge: 'FIVEM BUNDLE',
    priceUSD: 45,
    pricePHP: 2550,
    originalPriceUSD: 55,
    originalPricePHP: 3100,
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
    highlight: false
  },
  {
    id: 'gen-all-access',
    title: 'All-Access Unlimited Generator Pass',
    category: 'bundle',
    categoryLabel: 'Full Access Pass',
    badge: 'MOST POPULAR',
    priceUSD: 75,
    pricePHP: 4250,
    originalPriceUSD: 95,
    originalPricePHP: 5400,
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
    highlight: true
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Licenses', count: LICENSES.length },
  { id: 'single', label: 'Single Access', count: LICENSES.filter(p => p.category === 'single').length },
  { id: 'bundle', label: 'Bundles & Packages', count: LICENSES.filter(p => p.category === 'bundle').length },
];

export default function HomePage() {
  const [currency, setCurrency] = useState<Currency>('PHP');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live Real Reviews State
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      })
      .catch((err) => console.error('[Storefront] Error loading reviews:', err))
      .finally(() => setLoadingReviews(false));
  }, []);

  // Filter licenses by category and search query
  const filteredLicenses = useMemo(() => {
    return LICENSES.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

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

          {/* Trust Highlights Strip */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-zinc-300 font-mono pt-2">
            {reviews.length > 0 && (
              <a
                href="#reputation"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/40 transition-colors"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-white">{averageRating} / 5.0</span>
                <span className="text-zinc-500 font-mono">({reviews.length} Verified Reviews)</span>
              </a>
            )}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Instant Key Issuance</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Replacement Warranty</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Daily Automated Resets</span>
            </div>
          </div>
        </section>

        {/* ── 2. CORE METRICS & TELEMETRY STRIP ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          {/* Card 1: Your Go-To Supplier */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-purple-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold font-mono text-white">Your Go-To</div>
              <div className="text-[11px] text-zinc-400">Supplier</div>
            </div>
          </div>

          {/* Card 2: 100% Live Automated Stock */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold font-mono text-white">100% Live</div>
              <div className="text-[11px] text-zinc-400">Automated Stock Sync</div>
            </div>
          </div>

          {/* Card 3: Fair Pricing */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-blue-400 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold font-mono text-white">Fair Pricing</div>
              <div className="text-[11px] text-zinc-400">PHP & USD Rates</div>
            </div>
          </div>

          {/* Card 4: Hardware Locked Discord OAuth */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold font-mono text-white">Discord OAuth</div>
              <div className="text-[11px] text-zinc-400">Hardware Locked SSO</div>
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
                <span>OFFICIAL LICENSES</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Available Generator Licenses
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
              {CATEGORIES.map((cat) => (
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
                const Icon = license.icon;
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
                    <div className={`relative w-full aspect-[16/9] bg-gradient-to-br ${license.gradient} p-5 flex flex-col justify-between border-b border-zinc-800/80 overflow-hidden`}>
                      {/* Ambient Grid Accent */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-40 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-200 font-semibold backdrop-blur-md">
                          {license.badge || license.categoryLabel}
                        </span>

                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-300 backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Instant</span>
                        </div>
                      </div>

                      {/* Center Art Icon */}
                      <div className="relative z-10 flex items-center justify-center py-2">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:border-purple-500/40 transition-all duration-200 shadow-lg">
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>

                      {/* Bottom Media Bar */}
                      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>{license.deliveryType}</span>
                        <span className="text-zinc-500">{license.deliveryTime}</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Meta Category Indicator */}
                        <div className="text-[11px] font-mono text-purple-400 mb-1.5 uppercase tracking-wider">
                          {license.categoryLabel}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-white group-hover:text-purple-200 transition-colors leading-snug mb-2">
                          {license.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-4">
                          {license.description}
                        </p>

                        {/* Feature Preview Bullets */}
                        <div className="space-y-1.5 mb-5 pb-5 border-b border-zinc-800/80">
                          {license.features.slice(0, 2).map((feat, idx) => (
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
                              {formatPrice(license.priceUSD, license.pricePHP)}
                            </span>
                            {license.originalPriceUSD && (
                              <span className="text-xs text-zinc-600 line-through font-mono">
                                {formatPrice(license.originalPriceUSD, license.originalPricePHP || 0)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                            Direct Pricing
                          </div>
                        </div>

                        {/* Link to Generator Portal */}
                        <a
                          href="https://gen.asyncdevph.xyz"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer group/btn"
                        >
                          <span>Inspect License</span>
                          <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover/btn:translate-x-0.5 transition-transform" />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
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

          {/* Reviews Grid */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Star Rating & Verified Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                        Verified Client
                      </span>
                    </div>

                    {/* Comment */}
                    <p className="text-xs text-zinc-300 leading-relaxed mb-6 italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  {/* Author Info */}
                  <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
                        <Image
                          src={rev.avatar}
                          alt={rev.author}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5 truncate">
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

      <Footer />
    </div>
  );
}
