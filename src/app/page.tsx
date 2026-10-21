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
  Lock,
  Search,
  Terminal,
  Cpu,
  Server,
  Zap,
  Clock,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
  ChevronRight,
  CreditCard,
  ExternalLink
} from 'lucide-react';

type Currency = 'PHP' | 'USD';

interface Product {
  id: string;
  title: string;
  category: 'generator' | 'tools' | 'fivem' | 'accounts';
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

const PRODUCTS: Product[] = [
  // ── GENERATOR LICENSES ──
  {
    id: 'gen-per-service',
    title: 'Single Service Generator License',
    category: 'generator',
    categoryLabel: 'Generator License',
    badge: 'SINGLE ACCESS',
    priceUSD: 20,
    pricePHP: 1150,
    originalPriceUSD: 25,
    originalPricePHP: 1450,
    description: 'Dedicated access to 1 account generation service of your choice (Rockstar, Steam, Discord, CyberGhost, or Netflix).',
    features: [
      'Choice of 1 dedicated generation pool',
      'Standard daily generation quota (automated resets)',
      'Real-time automated stock updates',
      'Full account retrieval history log'
    ],
    deliveryType: 'Instant Automated License Key',
    deliveryTime: '< 2 seconds',
    icon: Key,
    gradient: 'from-purple-900/40 via-zinc-900/60 to-black',
    highlight: false
  },
  {
    id: 'gen-fivem-bundle',
    title: 'FiveM Package Generator Bundle',
    category: 'generator',
    categoryLabel: 'Generator License',
    badge: 'FIVEM BUNDLE',
    priceUSD: 45,
    pricePHP: 2550,
    originalPriceUSD: 55,
    originalPricePHP: 3100,
    description: 'The definitive bundle for FiveM players and developers: Rockstar, Steam, Discord, and CyberGhost VPN all unlocked.',
    features: [
      'Rockstar + Steam + Discord + CyberGhost included',
      'Elevated daily quota with priority stock queue',
      'Hardware-locked security token',
      'Instant key redemption in web portal'
    ],
    deliveryType: 'Instant Automated License Key',
    deliveryTime: '< 2 seconds',
    icon: Server,
    gradient: 'from-indigo-900/40 via-purple-950/40 to-black',
    highlight: false
  },
  {
    id: 'gen-all-access',
    title: 'All-Access Unlimited Generator Pass',
    category: 'generator',
    categoryLabel: 'Generator License',
    badge: 'MOST POPULAR',
    priceUSD: 75,
    pricePHP: 4250,
    originalPriceUSD: 95,
    originalPricePHP: 5400,
    description: 'Complete unrestricted pass to ALL current and future Account Generator services (Steam, Discord, Rockstar, VPN, Netflix, Valorant).',
    features: [
      'Every generator service fully unlocked',
      'Highest daily generation cap & zero cooldown',
      'Guaranteed priority restock allocation',
      'Discord role sync & automated cloud backup'
    ],
    deliveryType: 'Instant Automated License Key',
    deliveryTime: '< 2 seconds',
    icon: Sparkles,
    gradient: 'from-purple-600/20 via-zinc-900/80 to-black',
    highlight: true
  },

  // ── SOFTWARE & DEV TOOLS ──
  {
    id: 'tool-deobfuscator',
    title: 'AST JavaScript & Lua Deobfuscator',
    category: 'tools',
    categoryLabel: 'Developer Tools',
    badge: 'DEVELOPER TOOL',
    priceUSD: 35,
    pricePHP: 1980,
    originalPriceUSD: 45,
    originalPricePHP: 2550,
    description: 'Automated syntax-tree AST deobfuscation engine for string decryption, control-flow reconstruction, and dead-code elimination.',
    features: [
      'Babel AST AST-level transformation engine',
      'Automated string array & hex unpacker',
      'Control flow unflattening & dead code stripping',
      'High-throughput CLI & web processing client'
    ],
    deliveryType: 'Secure Binary & Access Token',
    deliveryTime: 'Instant Download',
    icon: Terminal,
    gradient: 'from-emerald-950/40 via-zinc-900/60 to-black'
  },
  {
    id: 'tool-dumper',
    title: 'Client Memory Dumper & Payload Extractor',
    category: 'tools',
    categoryLabel: 'Developer Tools',
    badge: 'BINARY UTILITY',
    priceUSD: 50,
    pricePHP: 2850,
    originalPriceUSD: 65,
    originalPricePHP: 3700,
    description: 'Low-level memory dumping tool engineered to extract injected runtime scripts, unmapped modules, and decrypted payload buffers.',
    features: [
      'In-memory module stomping detection & dump',
      'VAD tree walking & section carver',
      'Exported PE rebuilding & fixup headers',
      'Built for x64 Windows 10/11 environments'
    ],
    deliveryType: 'Compiled Executable & Guide',
    deliveryTime: 'Instant Download',
    icon: Cpu,
    gradient: 'from-blue-950/40 via-zinc-900/60 to-black'
  },
  {
    id: 'tool-telemetry-replayer',
    title: 'Network Telemetry & Packet Replayer',
    category: 'tools',
    categoryLabel: 'Developer Tools',
    badge: 'LAB HARNESS',
    priceUSD: 40,
    pricePHP: 2250,
    originalPriceUSD: 50,
    originalPricePHP: 2800,
    description: 'Synthetic network telemetry generator and packet capture inspection tool designed for client-server protocol validation.',
    features: [
      'Encrypted payload replay & diff analysis',
      'Custom proxy harness with latency emulator',
      'Automated session ticket forgery tester',
      'Full API documentation & integration scripts'
    ],
    deliveryType: 'Digital Toolkit Package',
    deliveryTime: 'Instant Delivery',
    icon: Zap,
    gradient: 'from-amber-950/40 via-zinc-900/60 to-black'
  },

  // ── FIVEM SERVER ASSETS ──
  {
    id: 'fivem-core-framework',
    title: 'ASYNC FiveM Clean Core Framework',
    category: 'fivem',
    categoryLabel: 'FiveM Assets',
    badge: 'SERVER CORE',
    priceUSD: 60,
    pricePHP: 3400,
    originalPriceUSD: 80,
    originalPricePHP: 4500,
    description: 'Optimized server-side framework built for 0.02ms resmon idle, responsive SQL indexing, and seamless custom inventory integration.',
    features: [
      'Ultra-clean 0.02ms idle client resource footprint',
      'Modern oxmysql schema with pre-built indices',
      'Complete auth, character selector & multijob core',
      'Full documentation and setup installer'
    ],
    deliveryType: 'Git Repository Access & Zip Package',
    deliveryTime: 'Instant Download',
    icon: Server,
    gradient: 'from-purple-950/40 via-zinc-900/60 to-black'
  },
  {
    id: 'fivem-anticheat-suite',
    title: 'FiveM Anti-Cheat Emulation & Audit Suite',
    category: 'fivem',
    categoryLabel: 'FiveM Assets',
    badge: 'SECURITY AUDIT',
    priceUSD: 85,
    pricePHP: 4800,
    originalPriceUSD: 110,
    originalPricePHP: 6200,
    description: 'Comprehensive vulnerability audit harness simulating Lua injection vectors, trigger abuse, and weapon modifier exploits.',
    features: [
      'Server-side state-validation middleware',
      'Automated injection & NUI event scanner',
      'Token spoofing & remote callback protections',
      'Includes active monitoring dashboard'
    ],
    deliveryType: 'Source Code & Deployment License',
    deliveryTime: 'Instant Delivery',
    icon: Shield,
    gradient: 'from-rose-950/40 via-zinc-900/60 to-black'
  },

  // ── ACCOUNTS & SUBSCRIPTIONS ──
  {
    id: 'acc-vpn-lifetime',
    title: 'CyberGhost VPN Premium Dedicated Access',
    category: 'accounts',
    categoryLabel: 'Accounts & VPN',
    badge: 'LIFETIME ACCESS',
    priceUSD: 15,
    pricePHP: 850,
    originalPriceUSD: 25,
    originalPricePHP: 1400,
    description: 'High-speed dedicated VPN credentials optimized for zero-leak IP masking, low latency, and gaming tunnel bypass.',
    features: [
      '10Gbps gaming-optimized server infrastructure',
      'Strict zero-logging protocol enforcement',
      'Multi-platform client support (Win/Mac/Mobile)',
      'Automated warranty & replacement safeguard'
    ],
    deliveryType: 'Direct Credentials Delivery',
    deliveryTime: 'Instant Automated',
    icon: Lock,
    gradient: 'from-zinc-900 via-zinc-950 to-black'
  },
  {
    id: 'acc-steam-aged',
    title: 'Clean Steam Aged Account (CS2 Prime Ready)',
    category: 'accounts',
    categoryLabel: 'Accounts & VPN',
    badge: 'PRIME VERIFIED',
    priceUSD: 25,
    pricePHP: 1400,
    originalPriceUSD: 35,
    originalPricePHP: 1950,
    description: 'Hand-registered aged Steam accounts with clean VAC standing, full first-mail access, and CS2 Prime status enabled.',
    features: [
      'Original creation email credentials provided',
      'Clean zero-ban VAC standing & high trust factor',
      'Market unlocked and ready for FiveM/Rockstar linking',
      'Instant automated credential dispatch'
    ],
    deliveryType: 'Automated Account Details Dispatch',
    deliveryTime: '< 2 seconds',
    icon: Key,
    gradient: 'from-indigo-950/40 via-zinc-900/60 to-black'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Digital Goods', count: PRODUCTS.length },
  { id: 'generator', label: 'Generator Licenses', count: PRODUCTS.filter(p => p.category === 'generator').length },
  { id: 'tools', label: 'Developer Tools', count: PRODUCTS.filter(p => p.category === 'tools').length },
  { id: 'fivem', label: 'FiveM Server Assets', count: PRODUCTS.filter(p => p.category === 'fivem').length },
  { id: 'accounts', label: 'Accounts & VPN', count: PRODUCTS.filter(p => p.category === 'accounts').length },
];

export default function HomePage() {
  const [currency, setCurrency] = useState<Currency>('PHP');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((item) => {
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pb-28 relative z-10 w-full space-y-16">
        
        {/* ── HERO BANNER & MISSION ── */}
        <section className="flex flex-col items-center text-center max-w-4xl mx-auto pt-6">
          {/* Status Telemetry Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wider uppercase">ASYNC TOOLS // DIGITAL MARKETPLACE</span>
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
          <p className="max-w-2xl mx-auto text-zinc-400 text-sm sm:text-base mb-8 leading-relaxed font-normal">
            Automated digital goods catalog, developer reverse-engineering utilities, and multi-service account generation infrastructure with sub-second automated delivery.
          </p>

          {/* Flagship Account Generator Gateway Card */}
          <div className="w-full max-w-2xl mx-auto text-left">
            <a
              href="https://gen.asyncdevph.xyz"
              className="group relative p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-900/40 transition-all duration-200 flex flex-col justify-between shadow-xl shadow-purple-950/10 block cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-purple-400 group-hover:border-purple-500/40 transition-colors">
                    <Key className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold">
                    STANDALONE ENGINE
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  Launch Standalone Account Generator
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Dedicated portal for real-time stock claiming: Rockstar, Steam, Discord, CyberGhost VPN, Netflix, and Valorant with quota telemetry.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-300 group-hover:text-purple-300 transition-colors">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Open gen.asyncdevph.xyz</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </a>
          </div>
        </section>

        {/* ── CORE METRICS & TELEMETRY STRIP ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-purple-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold font-mono text-white">&lt; 2.0s</div>
              <div className="text-[11px] text-zinc-400">Automated Dispatch</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold font-mono text-white">100% Live</div>
              <div className="text-[11px] text-zinc-400">Automated Stock Sync</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-blue-400 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold font-mono text-white">PHP & USD</div>
              <div className="text-[11px] text-zinc-400">1:1 Direct Currency</div>
            </div>
          </div>

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

        {/* ── STOREFRONT CATALOG SECTION ── */}
        <section id="catalog" className="w-full space-y-6 pt-4">
          
          {/* Header Controls: Section Title + Currency Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-purple-300 text-[10px] font-mono mb-1.5">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>OFFICIAL STOREFRONT</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Digital Goods & Assets
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
                placeholder="Search products or tools..."
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

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-zinc-950/50 border border-zinc-800/80">
              <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-1">No products match your filter</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                Try searching with different keywords or switch to &quot;All Digital Goods&quot;.
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
              {filteredProducts.map((product) => {
                const Icon = product.icon;
                return (
                  <article
                    key={product.id}
                    className={`group rounded-3xl bg-zinc-950/80 border flex flex-col justify-between overflow-hidden transition-all duration-200 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/15 ${
                      product.highlight
                        ? 'border-purple-500/40 relative'
                        : 'border-zinc-800/80'
                    }`}
                  >
                    {product.highlight && (
                      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                    )}

                    {/* Card Media Header (16:9 aspect) */}
                    <div className={`relative w-full aspect-[16/9] bg-gradient-to-br ${product.gradient} p-5 flex flex-col justify-between border-b border-zinc-800/80 overflow-hidden`}>
                      {/* Ambient Grid Accent */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-40 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-200 font-semibold backdrop-blur-md">
                          {product.badge || product.categoryLabel}
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
                        <span>{product.deliveryType}</span>
                        <span className="text-zinc-500">{product.deliveryTime}</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Meta Category Indicator */}
                        <div className="text-[11px] font-mono text-purple-400 mb-1.5 uppercase tracking-wider">
                          {product.categoryLabel}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-white group-hover:text-purple-200 transition-colors leading-snug mb-2">
                          {product.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-4">
                          {product.description}
                        </p>

                        {/* Feature Preview Bullets (Top 2) */}
                        <div className="space-y-1.5 mb-5 pb-5 border-b border-zinc-800/80">
                          {product.features.slice(0, 2).map((feat, idx) => (
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
                              {formatPrice(product.priceUSD, product.pricePHP)}
                            </span>
                            {product.originalPriceUSD && (
                              <span className="text-xs text-zinc-600 line-through font-mono">
                                {formatPrice(product.originalPriceUSD, product.originalPricePHP || 0)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                            1:1 Direct Currency
                          </div>
                        </div>

                        {/* Link / Modal Trigger (Phase 2 Target) */}
                        {product.category === 'generator' ? (
                          <a
                            href="https://gen.asyncdevph.xyz"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer group/btn"
                          >
                            <span>Inspect & Access</span>
                            <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover/btn:translate-x-0.5 transition-transform" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              // Phase 2 will pop up the Product Details Modal
                              const targetEl = document.getElementById('how-it-works');
                              targetEl?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer group/btn"
                          >
                            <span>Inspect Product</span>
                            <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ── HOW IT WORKS: 4-STEP PIPELINE ── */}
        <section id="how-it-works" className="w-full pt-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono mb-3">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>FULFILLMENT PIPELINE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How Instant Delivery Works
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1.5">
              Zero manual delays. Transparent 1:1 pricing with automated cryptographic dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-purple-400 mb-4">
                01
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Select Digital Asset</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Browse generator license tiers, AST deobfuscators, memory carvers, or FiveM server cores.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-purple-400 mb-4">
                02
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">1:1 Direct Checkout</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Pay directly in Philippine Peso (PHP ₱) or US Dollar (USD $) via store balance without hidden rates.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-purple-400 mb-4">
                03
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Sub-2s Automated Dispatch</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Server processes the order immediately and returns your license key or secure download link.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-purple-400 mb-4">
                04
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Redeem & Deploy</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Input your license token on gen.asyncdevph.xyz or download binaries directly to your workstation.
              </p>
            </div>
          </div>
        </section>

        {/* ── PLATFORM SECURITY & ARCHITECTURE ── */}
        <section className="p-6 sm:p-8 rounded-3xl bg-zinc-950/90 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-mono mb-3">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>SINGLE SIGN-ON INFRASTRUCTURE</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Unified Cross-Subdomain Ecosystem
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              One Discord authentication session seamlessly persists between the apex Storefront (asyncdevph.xyz), the Standalone Generator (gen.asyncdevph.xyz), and the Administrator Console (admin.asyncdevph.xyz).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <a
              href="https://gen.asyncdevph.xyz"
              className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <span>Generator Portal</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <a
              href="https://discord.gg/async"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span>Community Discord</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
