import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DiscordLoginButton from '@/components/DiscordLoginButton';
import { createClient } from '@/lib/supabase-server';
import { Shield, Sparkles, ArrowRight, Cpu, Wrench, Key, Check, Zap, Layers, Star } from 'lucide-react';

export default async function HomePage() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  // Tools Summary List (Lifetime Priority)
  const toolPricing = [
    {
      id: 'decryption',
      name: 'Lua/Stream Script Decryptor',
      badge: 'CORE ENGINE',
      icon: Cpu,
      lifetimePrice: '$60',
      lifetimePeriod: '/ lifetime access',
      monthlyOption: 'or $25 / monthly',
      description: 'High-speed automated FiveM Lua script unpacking, stream decryption and deobfuscation.',
      features: [
        'Lua 5.4 & bytecode deobfuscation',
        'Stream & resource script unpacking',
        'GoFile cloud storage host link',
        'Discord log audit & role sync'
      ],
      href: '/decrypt',
      ctaText: 'Get Decryptor Access',
      highlight: false
    },
    {
      id: 'dumper',
      name: 'Dumper Only',
      badge: 'PRO TOOL',
      icon: Wrench,
      lifetimePrice: '$60',
      lifetimePeriod: '/ lifetime access',
      monthlyOption: 'or $25 / monthly',
      description: 'Automated FiveM asset dumper, mesh geometry repair, and vertex reconstruction.',
      features: [
        'Automated FiveM asset dumper engine',
        'Vertex normal & geometry repair',
        'Polygon mesh clean-up pipeline',
        'Instant batch download processing'
      ],
      href: '/decrypt',
      ctaText: 'Get Dumper Access',
      highlight: false
    },
    {
      id: 'combo',
      name: 'Combo (Decryptor + Dumper)',
      badge: 'BEST VALUE',
      icon: Layers,
      lifetimePrice: '$75',
      lifetimePeriod: '/ lifetime access',
      monthlyOption: 'or $35 / monthly',
      description: 'Full suite access combining Lua/Stream Script Decryptor and FiveM Dumper Engine.',
      features: [
        'Lua & Stream Script Decryptor included',
        'Full FiveM Asset Dumper engine included',
        'Priority execution queue & fast processing',
        'Complete suite features & lifetime pass'
      ],
      href: '/decrypt',
      ctaText: 'Get Combo Access',
      highlight: true
    }
  ];

  // Account Generator Dedicated Tier Pricelist
  const generatorTiers = [
    {
      id: 'per-service',
      name: 'Per Service Tier',
      badge: 'SINGLE ACCESS',
      price: '$20',
      period: '/ per service',
      description: 'Access to individual account generation service of your choice (Rockstar, Steam, Discord, CyberGhost, or Netflix).',
      features: [
        'Choice of single service access (Rockstar, Steam, Discord, etc.)',
        'Standard daily generation limits',
        'Automated real-time stock updates',
        'Clean 50-item generation history log'
      ],
      href: '/generator',
      ctaText: 'Get Single Access',
      highlight: false
    },
    {
      id: 'fivem-bundle',
      name: 'FiveM Package Bundle',
      badge: 'FIVEM BUNDLE',
      price: '$45',
      period: '/ package bundle',
      description: 'Complete FiveM package access including Rockstar, Steam, Discord, and CyberGhost VPN account generation.',
      features: [
        'Rockstar, Steam, Discord & CyberGhost package access',
        'Elevated daily generation limit',
        'Priority stock allocation',
        'Instant key redemption system'
      ],
      href: '/generator',
      ctaText: 'Get FiveM Bundle',
      highlight: false
    },
    {
      id: 'all-access',
      name: 'All Access Bundle',
      badge: 'MOST POPULAR',
      price: '$75',
      period: '/ all access',
      description: 'Complete unlimited access to ALL Account Generator services (Steam, Discord, Rockstar, CyberGhost, Netflix, Valorant + future additions).',
      features: [
        'All Account Gen Access (Every service unlocked)',
        'Highest daily generation limit & priority',
        'Instant stock claiming & key redemption',
        'Discord role sync & full cloud history'
      ],
      href: '/generator',
      ctaText: 'Get All Access',
      highlight: true
    }
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col relative selection:bg-purple-600 selection:text-white overflow-hidden dev-grid-bg">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 lg:px-8 pt-24 pb-16 sm:pb-24 flex flex-col items-center justify-center text-center relative z-10 space-y-20">
        
        {/* HERO SECTION */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto pt-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="tracking-wider uppercase">ASYNC TOOLS // YOUR GO TO TOOLS</span>
          </div>

          {/* Brand Logo */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 p-1 transition-transform duration-200 hover:scale-105">
            <Image
              src="/images/Profile.png"
              alt="ASYNC DEVELOPMENT"
              fill
              className="object-cover rounded-xl"
              priority
            />
          </div>

          {/* Hero Title */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4 text-white font-sans">
            ASYNC <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-400">DEVELOPMENT</span>
          </h1>

          {/* Neutral Platform Subtitle */}
          <p className="max-w-2xl mx-auto text-zinc-400 text-sm sm:text-base mb-10 leading-relaxed font-normal">
            Next-generation developer infrastructure and automation platform. Automated FiveM Lua script decryption, 3D asset geometry reconstruction, and enterprise multi-service account generation.
          </p>

          {/* DUAL FLAGSHIP PRODUCT SELECTOR (Decryptor vs Generator) */}
          <div className="w-full max-w-3xl mx-auto text-left mb-6">
            <div className="text-center mb-4">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
                SELECT PLATFORM TOOLS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product 01: Asset Decryptor */}
              <Link
                href="/decrypt"
                className="group relative p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-900/50 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-purple-400 group-hover:border-purple-500/40 transition-colors">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                      PRODUCT 01
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                    Asset Decryptor
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Automated FiveM Lua bytecode deobfuscation, resource stream unpacking, and 3D vertex mesh reconstruction engine.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-300 group-hover:text-purple-300 transition-colors">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Launch Decryptor</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </Link>

              {/* Product 02: Account Generator */}
              <Link
                href="/generator"
                className="group relative p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-900/50 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-purple-400 group-hover:border-purple-500/40 transition-colors">
                      <Key className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                      PRODUCT 02
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                    Account Generator
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    High-speed multi-service account portal providing instant automated stock for Rockstar, Steam, Discord, VPN & Netflix.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-300 group-hover:text-purple-300 transition-colors">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Launch Generator</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 CORE CAPABILITIES SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 text-left flex items-start gap-3 hover:border-zinc-700 transition-colors">
            <div className="p-2 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800 shrink-0">
              <Key className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Account Generator</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">Steam, Discord, Rockstar, VPN & Netflix live stock</p>
            </div>
          </div>

          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 text-left flex items-start gap-3 hover:border-zinc-700 transition-colors">
            <div className="p-2 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800 shrink-0">
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Lua Decryption</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">Automated script unpacking & bytecode deobfuscation</p>
            </div>
          </div>

          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 text-left flex items-start gap-3 hover:border-zinc-700 transition-colors">
            <div className="p-2 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800 shrink-0">
              <Wrench className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Vertex Repair</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">3D geometry reconstruction & mesh repair engine</p>
            </div>
          </div>

          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 text-left flex items-start gap-3 hover:border-zinc-700 transition-colors">
            <div className="p-2 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800 shrink-0">
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Discord OAuth</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">Instant role verification & cloud sync security</p>
            </div>
          </div>
        </div>

        {/* SECTION 1: ACCOUNT GENERATOR PRICELIST */}
        <section className="w-full pt-4">
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono mb-3">
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span>TIERS // ACCOUNT GENERATOR</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Account Generator Tiers
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1.5">
              Select your account generation plan. Instant access with automated replenishment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {generatorTiers.map((tier) => (
              <div
                key={tier.id}
                className={`rounded-2xl p-6 border flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                  tier.highlight
                    ? 'border-purple-500/40 bg-zinc-950 md:-translate-y-1 shadow-[0_0_30px_-10px_rgba(168,85,247,0.15)]'
                    : 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/70'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
                )}

                <div>
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold">
                      {tier.badge}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                      <Key className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>

                  {/* Tier Name */}
                  <h3 className="text-base font-bold text-white mb-1">{tier.name}</h3>
                  <p className="text-xs text-zinc-400 mb-5 leading-relaxed min-h-[36px]">
                    {tier.description}
                  </p>

                  {/* Price Header */}
                  <div className="flex items-baseline gap-1 mb-5 pb-5 border-b border-zinc-800/80">
                    <span className="text-3xl font-mono font-bold text-white">{tier.price}</span>
                    <span className="text-xs text-zinc-500 font-mono">{tier.period}</span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 mb-7">
                    {tier.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-800 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={10} />
                        </div>
                        <span className={idx === 0 ? 'font-medium text-white' : 'text-zinc-400'}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Link
                  href={tier.href}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    tier.highlight
                      ? 'bg-white hover:bg-zinc-200 text-black shadow-sm'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: TOOLS & FEATURES SUMMARY */}
        <section className="w-full pt-4">
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono mb-3">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>ACCESS // TOOL ENGINE PRICING</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Tools & Features List
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1.5">
              Select standalone tool access or get the complete combo package.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {toolPricing.map((tool) => {
              const IconComp = tool.icon;
              return (
                <div
                  key={tool.id}
                  className={`rounded-2xl p-6 border flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                    tool.highlight
                      ? 'border-purple-500/40 bg-zinc-950 md:-translate-y-1 shadow-[0_0_30px_-10px_rgba(168,85,247,0.15)]'
                      : 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/70'
                  }`}
                >
                  {tool.highlight && (
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
                  )}

                  <div>
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold">
                        {tool.badge}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                        <IconComp className="w-4 h-4 text-purple-400" />
                      </div>
                    </div>

                    {/* Tool Name */}
                    <h3 className="text-base font-bold text-white mb-1">{tool.name}</h3>
                    <p className="text-xs text-zinc-400 mb-5 leading-relaxed min-h-[36px]">
                      {tool.description}
                    </p>

                    {/* Price Header */}
                    <div className="mb-5 pb-5 border-b border-zinc-800/80">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-mono font-bold text-white">{tool.lifetimePrice}</span>
                        <span className="text-xs text-zinc-500 font-mono">{tool.lifetimePeriod}</span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 font-mono">
                        {tool.monthlyOption}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 mb-7">
                      {tool.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                          <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-800 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={10} />
                          </div>
                          <span className={idx === 0 ? 'font-medium text-white' : 'text-zinc-400'}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Link Button */}
                  <Link
                    href={tool.href}
                    className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      tool.highlight
                        ? 'bg-white hover:bg-zinc-200 text-black shadow-sm'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span>{tool.ctaText}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

