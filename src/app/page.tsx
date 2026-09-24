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

  // Tools Summary List
  const toolPricing = [
    {
      id: 'generator',
      name: 'Account Generator',
      badge: 'POPULAR FEATURE',
      icon: Key,
      price: '$0',
      period: '/ free for now',
      description: 'Instant multi-service account generation and key management suite.',
      features: [
        'Steam, Discord, Rockstar, VPN & Netflix',
        'Real-time automated stock tracking',
        'Instant key redemption system',
        'Personal 5-day generation history log'
      ],
      href: '/generator',
      ctaText: 'Open Generator',
      highlight: true
    },
    {
      id: 'decryption',
      name: 'Lua Script Decryptor',
      badge: 'CORE ENGINE',
      icon: Cpu,
      price: '$0',
      period: '/ free for now',
      description: 'High-speed automated FiveM Lua script unpacking and deobfuscation.',
      features: [
        'Lua 5.4 & bytecode deobfuscation',
        'Instant pipeline execution',
        'GoFile cloud storage host link',
        'Discord log audit trail'
      ],
      href: '/decrypt',
      ctaText: 'Launch Decryptor',
      highlight: false
    },
    {
      id: 'mesh-repair',
      name: '3D Mesh & Vertex Repair',
      badge: 'PRO TOOL',
      icon: Wrench,
      price: '$0',
      period: '/ free for now',
      description: 'Corrupted 3D mesh geometry repair and FiveM asset reconstruction.',
      features: [
        'Automated vertex normal fixing',
        'Polygon mesh clean-up pipeline',
        'GoFile storage download link',
        'Instant batch zip processing'
      ],
      href: '/decrypt',
      ctaText: 'Use Mesh Repair',
      highlight: false
    }
  ];

  // Account Generator Dedicated Tier Pricelist
  const generatorTiers = [
    {
      id: 'per-service',
      name: 'Per Service Tier',
      badge: 'SINGLE ACCESS',
      price: '$0',
      period: '/ free for now',
      description: 'Access to individual account generation service of your choice (Rockstar, Steam, Discord, VPN, or Netflix).',
      features: [
        'Rockstar, Steam, Discord, VPN or Netflix each access',
        'Standard daily generation limits',
        'Automated real-time stock updates',
        'Clean 5-day generation history log'
      ],
      href: '/generator',
      ctaText: 'Get Single Access',
      highlight: false
    },
    {
      id: 'fivem-bundle',
      name: 'FiveM Gen Tier',
      badge: 'FIVEM BUNDLE',
      price: '$0',
      period: '/ free for now',
      description: 'Complete FiveM package access including Rockstar, Steam, Discord, and VPN account generation.',
      features: [
        'Rockstar, Steam, Discord & VPN package access',
        'Elevated daily generation limit',
        'Priority stock allocation',
        'Instant key redemption system'
      ],
      href: '/generator',
      ctaText: 'Get FiveM Package',
      highlight: false
    },
    {
      id: 'all-access',
      name: 'All Access Tier',
      badge: 'MOST POPULAR',
      price: '$0',
      period: '/ free for now',
      description: 'Complete unlimited access to ALL Account Generator services (Steam, Discord, Rockstar, VPN, Netflix + future additions).',
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
    <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col relative selection:bg-purple-600 selection:text-white overflow-hidden">
      <Navbar />

      {/* Ambient glowing background orbs */}
      <div className="purple-glow-bg -top-20 left-1/2 -translate-x-1/2 opacity-70 w-[600px] h-[600px]"></div>
      <div className="purple-glow-bg top-1/2 right-10 opacity-30"></div>

      <main className="flex-1 max-w-6xl mx-auto px-4 lg:px-8 pt-24 pb-12 sm:pb-20 flex flex-col items-center justify-center text-center relative z-10 space-y-24">
        
        {/* HERO SECTION */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-purple-500/30 text-purple-300 text-xs font-mono mb-8 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ONLINE • DECRYPTION, MESH REPAIR & ACCOUNT GENERATOR</span>
          </div>

          {/* Brand Logo */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 mx-auto mb-8 rounded-3xl overflow-hidden glass-panel-glow border-2 border-purple-500/40 p-1.5 shadow-[0_0_60px_rgba(168,85,247,0.35)] transform hover:scale-105 transition-all duration-300">
            <Image
              src="/images/Profile.png"
              alt="ASYNC DEVELOPMENT"
              fill
              className="object-cover rounded-2xl"
              priority
            />
          </div>

          {/* Hero Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-tight">
            ASYNC <span className="purple-gradient-text">DEVELOPMENT</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-purple-200/80 text-base sm:text-lg mb-10 leading-relaxed font-light">
            High-performance FiveM asset recovery, Lua script decryption, 3D vertex reconstruction, and multi-service Account Generator portal. Connect with Discord to access all tools.
          </p>

          {/* Call to Action Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto mb-6">
            <Link
              href="/decrypt"
              className="flex-1 w-full px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Decrypt</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/generator"
              className="flex-1 w-full px-6 py-3.5 rounded-2xl bg-purple-950/80 hover:bg-purple-900/80 border border-purple-500/40 text-purple-100 font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4 text-purple-400" />
              <span>Generator</span>
            </Link>
          </div>
        </div>

        {/* 4 CORE FEATURES SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 text-left flex items-start gap-3.5 hover:border-purple-500/40 transition-all">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 shrink-0">
              <Key className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-purple-100">Account Generator</h3>
              <p className="text-xs text-purple-300/70 mt-0.5">Steam, Discord, Rockstar, VPN & Netflix stock gen</p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 text-left flex items-start gap-3.5 hover:border-purple-500/40 transition-all">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 shrink-0">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-purple-100">Lua Decryption</h3>
              <p className="text-xs text-purple-300/70 mt-0.5">Automated script unpacking & bytecode deobfuscation</p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 text-left flex items-start gap-3.5 hover:border-purple-500/40 transition-all">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 shrink-0">
              <Wrench className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-purple-100">Vertex Repair</h3>
              <p className="text-xs text-purple-300/70 mt-0.5">3D geometry reconstruction & mesh repair engine</p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 text-left flex items-start gap-3.5 hover:border-purple-500/40 transition-all">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 shrink-0">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-purple-100">Discord OAuth</h3>
              <p className="text-xs text-purple-300/70 mt-0.5">Instant role verification & cloud sync security</p>
            </div>
          </div>
        </div>

        {/* SECTION 1: ACCOUNT GENERATOR PRICELIST */}
        <section className="w-full pt-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-mono mb-3">
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span>ACCOUNT GENERATOR PRICELIST</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Account Generator Tiers
            </h2>
            <p className="text-purple-300/60 text-sm mt-2">
              Choose your account generation access plan. All tiers are currently $0 for early access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {generatorTiers.map((tier) => (
              <div
                key={tier.id}
                className={`glass-ultra rounded-3xl p-6 sm:p-7 border flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  tier.highlight
                    ? 'border-purple-500/50 bg-gradient-to-b from-purple-950/40 to-purple-900/20 shadow-[0_0_40px_rgba(168,85,247,0.25)] scale-[1.03]'
                    : 'border-white/[0.08] hover:border-purple-500/30'
                }`}
              >
                <div>
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-900/60 border border-purple-500/30 text-purple-300 font-bold">
                      {tier.badge}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <Key className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>

                  {/* Tier Name */}
                  <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                  <p className="text-xs text-purple-300/60 mb-6 leading-relaxed">
                    {tier.description}
                  </p>

                  {/* Price Header */}
                  <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-purple-500/15">
                    <span className="text-4xl font-black text-white">{tier.price}</span>
                    <span className="text-xs text-purple-300/50 font-mono">{tier.period}</span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    {tier.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-purple-200/90">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={10} />
                        </div>
                        <span className={idx === 0 ? 'font-semibold text-white' : ''}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Link
                  href={tier.href}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    tier.highlight
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200'
                  }`}
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: TOOLS & FEATURES SUMMARY */}
        <section className="w-full pt-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-mono mb-3">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>TOOLS PRICING & ACCESS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tools & Features List
            </h2>
            <p className="text-purple-300/60 text-sm mt-2">
              All tools are currently enabled for free testing and Discord role holders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {toolPricing.map((tool) => {
              const IconComp = tool.icon;
              return (
                <div
                  key={tool.id}
                  className={`glass-ultra rounded-3xl p-6 sm:p-7 border flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                    tool.highlight
                      ? 'border-purple-500/50 bg-gradient-to-b from-purple-950/40 to-purple-900/20 shadow-[0_0_35px_rgba(168,85,247,0.2)]'
                      : 'border-white/[0.08] hover:border-purple-500/30'
                  }`}
                >
                  <div>
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-900/60 border border-purple-500/30 text-purple-300 font-bold">
                        {tool.badge}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                        <IconComp className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>

                    {/* Tool Name */}
                    <h3 className="text-xl font-bold text-white mb-1">{tool.name}</h3>
                    <p className="text-xs text-purple-300/60 mb-6 leading-relaxed">
                      {tool.description}
                    </p>

                    {/* Price Header ($0 for now) */}
                    <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-purple-500/15">
                      <span className="text-4xl font-black text-white">{tool.price}</span>
                      <span className="text-xs text-purple-300/50 font-mono">{tool.period}</span>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 mb-8">
                      {tool.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-purple-200/90">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={10} />
                          </div>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Link Button */}
                  <Link
                    href={tool.href}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      tool.highlight
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                        : 'bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200'
                    }`}
                  >
                    <span>{tool.ctaText}</span>
                    <ArrowRight size={14} />
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
