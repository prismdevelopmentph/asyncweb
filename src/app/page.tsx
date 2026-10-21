'use client';

import { useState, useMemo } from 'react';
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
  Star,
  Lock,
  Clock,
  MessageSquare,
  CheckCircle2,
  Users,
  Award
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

// ── VERIFIED CUSTOMER REPUTATION & VOUCHES ──
const REVIEWS = [
  {
    id: 'rev-1',
    author: 'Kaelen',
    role: 'FiveM Server Developer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    tier: 'FiveM Package Bundle',
    date: 'Yesterday',
    comment: 'Been running a high-pop FiveM server for 8 months. Getting Rockstar & VPN accounts was always a pain with flaky public sellers. ASYNC’s FiveM bundle gives our staff team instant accounts without ever hitting a dead pool. 10/10 reliability.'
  },
  {
    id: 'rev-2',
    author: 'zSpecter',
    role: 'Competitive Gamer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    tier: 'Single Service Tier (Steam)',
    date: '2 days ago',
    comment: 'Grabbed a Steam service key. Expected phone/guard verification issues like other shops, but it was pristine. First-time login worked instantly, VAC clean, and daily limits reset right on schedule.'
  },
  {
    id: 'rev-3',
    author: 'Ares_V',
    role: 'Gaming Community Host',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    tier: 'All-Access Unlimited Pass',
    date: '3 days ago',
    comment: 'The All-Access Pass is unmatched value. Whenever stock updates hit, the priority queue actually kicks in and all 6 services are unlocked. Cloud history is clean and saving is seamless.'
  },
  {
    id: 'rev-4',
    author: 'Ryker',
    role: 'FiveM Player',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    tier: 'Single Service Tier (Rockstar)',
    date: '4 days ago',
    comment: 'Instant automated license issuance. Picked the Rockstar tier and was generating accounts within 30 seconds of paying. Opened a ticket on Discord to ask about bundles and Mark replied in 4 minutes.'
  },
  {
    id: 'rev-5',
    author: 'GhostOps',
    role: 'Security Engineer & Enthusiast',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    tier: 'FiveM Package Bundle',
    date: 'Last week',
    comment: 'Hardware-locked token architecture is something you rarely see on digital shops. Knowing my key cannot be shared or stolen provides genuine peace of mind. CyberGhost VPN pools are rock solid.'
  },
  {
    id: 'rev-6',
    author: 'DexterPH',
    role: 'Verified Client',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    tier: 'All-Access Unlimited Pass',
    date: 'Last week',
    comment: 'Native Philippine Peso (PHP ₱) pricing makes checkout so easy. No ridiculous foreign bank exchange fees or crypto gas delays. Direct fair rates and instant automated key delivery.'
  }
];

// ── KEY PLATFORM FEATURES ──
const FEATURES = [
  {
    icon: RefreshCw,
    title: 'Real-Time Stock Telemetry',
    description: 'Live automated stock counters across Rockstar, Steam, Discord, CyberGhost VPN, Netflix, and Valorant. Zero phantom stock numbers or artificial wait times.',
    tag: 'LIVE INVENTORY'
  },
  {
    icon: Zap,
    title: 'Instant Cryptographic Dispatch',
    description: 'Our backend processes and dispatches your cryptographic license key token immediately upon payment confirmation. No manual delays.',
    tag: 'AUTOMATED DISPATCH'
  },
  {
    icon: Shield,
    title: 'Hand-Audited Clean Inventory',
    description: 'Every account pool is thoroughly vetted with clean VAC standing, pristine first-mail credentials, and zero blacklist flags.',
    tag: 'CLEAN STANDING'
  },
  {
    icon: Lock,
    title: 'Hardware-Locked Security Token',
    description: 'Your license key securely binds to your unique Discord identity and client machine footprint, preventing credential leaks and key hijacking.',
    tag: 'SSO PROTECTION'
  },
  {
    icon: Clock,
    title: 'Automated 24h Quota Refresh',
    description: 'Daily generation limits reset automatically at 00:00 UTC every 24 hours. Enjoy predictable daily usage without having to request manual replenishments.',
    tag: 'DAILY QUOTA'
  },
  {
    icon: MessageSquare,
    title: '24/7 Discord Ticket Coverage',
    description: 'Direct assistance via our official Discord community. Responsive support with a strict warranty replacement guarantee on non-working accounts.',
    tag: 'WARRANTY SHIELD'
  }
];

export default function HomePage() {
  const [currency, setCurrency] = useState<Currency>('PHP');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-white">4.9 / 5.0</span>
              <span className="text-zinc-500">(240+ Verified Reviews)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Instant Key Issuance</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Replacement Warranty</span>
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

                        {/* Link / Modal Trigger (Phase 2 Target) */}
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

        {/* ── 4. PLATFORM CAPABILITIES & FEATURES ── */}
        <section id="features" className="w-full space-y-10 scroll-mt-24 pt-4">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-purple-300 text-[11px] font-mono mb-3">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>PLATFORM ADVANTAGES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Engineered for High Reliability
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Built from the ground up to solve the frustrations of public resellers. Real-time stock automation, zero phantom limits, and cryptographic delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 hover:border-purple-500/40 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-purple-400 group-hover:border-purple-500/30 group-hover:scale-105 transition-all">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold px-2 py-0.5 rounded bg-zinc-900/60 border border-zinc-800/60">
                        {feat.tag}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-zinc-900 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 group-hover:text-purple-400 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Active Architecture</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 5. REPUTATION & CUSTOMER VOUCHES ── */}
        <section id="reputation" className="w-full space-y-10 scroll-mt-24 pt-4">
          
          {/* Header with Aggregate Rating */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-zinc-950/90 border border-zinc-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono mb-3">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>CUSTOMER REPUTATION // VERIFIED FEEDBACK</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Trusted by Gamers & Developers
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                See what real players, FiveM community owners, and competitive gamers say about our automated fulfillment speed and account longevity.
              </p>
            </div>

            {/* Scorecard Box */}
            <div className="flex items-center gap-6 px-6 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shrink-0">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white flex items-center justify-center gap-1">
                  <span>4.9</span>
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
                <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Overall Rating</div>
              </div>
              <div className="h-10 w-px bg-zinc-800" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-purple-400">1,200+</div>
                <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Orders Delivered</div>
              </div>
              <div className="h-10 w-px bg-zinc-800 hidden sm:block" />
              <div className="text-center hidden sm:block">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">99.8%</div>
                <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Testimonial Cards Grid (6 Reviews) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map((rev) => (
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
                      Verified Buyer
                    </span>
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-zinc-300 leading-relaxed mb-6 italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
                      <Image
                        src={rev.avatar}
                        alt={rev.author}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{rev.author}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{rev.role}</div>
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-600 font-mono">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. HOW IT WORKS: 4-STEP PIPELINE ── */}
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

        {/* ── 7. PLATFORM SECURITY & DISCORD COMMUNITY ── */}
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
              Connect directly with our support team, get instant restock notifications, and exchange feedback with over 1,200 active members in our official Discord server.
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
