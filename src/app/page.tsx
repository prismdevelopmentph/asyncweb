import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { Shield, Cpu, Wrench, CheckCircle, ArrowRight, Zap, Users, Activity } from 'lucide-react';

async function getStats() {
  try {
    const { data } = await supabaseAdmin.from('v_global_stats').select('*').single();
    if (data) return data;
  } catch (e) {
    console.error('Stats fetch error:', e);
  }
  return {
    total_decrypts: 20,
    total_files_decrypted: 1753,
    total_fixes: 11,
    total_vertices_fixed: 6169,
    active_plan_subscriptions: 2
  };
}

export default async function HomePage() {
  const stats = await getStats();

  const features = [
    {
      icon: Cpu,
      title: 'High-Performance Decryption',
      description: 'Advanced automated pipeline engine designed for FiveM assets, Lua scripts, and source packs.',
    },
    {
      icon: Wrench,
      title: '3D Model & Vertex Repair',
      description: 'Automated geometry inspection and vertex reconstruction for corrupted or encrypted 3D models.',
    },
    {
      icon: Shield,
      title: 'Discord Role Sync & Plans',
      description: 'Instant synchronization between Discord roles, subscription plans, and API license quotas.',
    },
    {
      icon: Zap,
      title: 'Cloud Realtime Pipeline',
      description: 'Trigger decryption and repair jobs seamlessly via Discord bot or Web Panel dashboard.',
    }
  ];

  const plans = [
    {
      name: 'Standard Free',
      price: '$0',
      period: 'Forever',
      features: ['200MB Max File Size', 'Standard Daily Quota', 'Community Support', 'Basic History'],
      cta: 'Get Started Free',
      popular: false,
    },
    {
      name: 'VIP Toolkit',
      price: '$15',
      period: 'Monthly',
      features: ['Unlimited File Size', 'High Speed Worker', 'Priority Pipeline Processing', 'Full History & Downloads', 'Direct Staff Support'],
      cta: 'Upgrade to VIP',
      popular: true,
    },
    {
      name: 'Lifetime Access',
      price: '$49',
      period: 'One-time',
      features: ['All VIP Features Included', 'Lifetime Updates', 'Unlimited API Licenses', 'Dedicated Support Ticket'],
      cta: 'Claim Lifetime',
      popular: false,
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col relative selection:bg-purple-600 selection:text-white">
      <Navbar />

      {/* Ambient background glows */}
      <div className="purple-glow-bg top-10 left-10 opacity-70"></div>
      <div className="purple-glow-bg top-[600px] right-10 opacity-50"></div>

      <main className="flex-1 max-w-7xl mx-auto px-4 lg:px-8 pt-12 pb-20 w-full relative z-10">
        
        {/* HERO SECTION */}
        <section className="text-center py-16 lg:py-24 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-purple-500/30 text-purple-300 text-xs font-medium mb-8 animate-pulse">
            <SparklesIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Next-Gen Web Panel & Discord Bot Integration</span>
          </div>

          <div className="relative w-32 h-32 mx-auto mb-8 rounded-3xl overflow-hidden glass-panel-glow border-2 border-purple-500/40 p-1 shadow-[0_0_50px_rgba(168,85,247,0.3)] transform hover:scale-105 transition-transform duration-300">
            <Image
              src="/images/Profile.png"
              alt="ASYNC TAGABASAG Banner"
              fill
              className="object-cover rounded-2xl"
              priority
            />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 leading-tight">
            ASYNC <span className="purple-gradient-text">TAGABASAG</span>
          </h1>

          <p className="max-w-2xl mx-auto text-purple-300/80 text-base sm:text-lg mb-10 leading-relaxed font-light">
            Premier asset recovery, Lua decryption, and 3D model repair platform. Manage your subscription plans, view live history, and dispatch jobs directly from the web panel.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Open Member Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* LIVE STATS COUNTER */}
        <section className="py-10 my-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Decryptions" value={stats.total_decrypts || 20} sub="Files processed" icon={Activity} />
            <StatCard label="Files Decrypted" value={stats.total_files_decrypted || 1753} sub="Extracted source" icon={Cpu} />
            <StatCard label="Vertices Fixed" value={stats.total_vertices_fixed || 6169} sub="3D geometry restored" icon={Wrench} />
            <StatCard label="Active Plans" value={stats.active_plan_subscriptions || 2} sub="Subscribers" icon={Users} />
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-16">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Engine Capabilities</h2>
            <p className="text-purple-300/70 text-sm max-w-xl mx-auto">Powered by dedicated worker pipelines operating seamlessly alongside our Discord bot.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="glass-card p-6 rounded-2xl flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1 text-purple-100">{f.title}</h3>
                    <p className="text-purple-300/70 text-sm leading-relaxed">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PRICING PLANS */}
        <section className="py-16">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Choose Your Plan</h2>
            <p className="text-purple-300/70 text-sm max-w-xl mx-auto">Get instant access to full decrypt pipelines, vertex fixes, and desktop licenses.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((p, idx) => (
              <div
                key={idx}
                className={`glass-panel p-8 rounded-3xl flex flex-col relative ${
                  p.popular ? 'border-2 border-purple-500 shadow-[0_0_35px_rgba(168,85,247,0.25)] scale-[1.03]' : ''
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-md">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-purple-100 mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white">{p.price}</span>
                  <span className="text-purple-300/60 text-xs">/ {p.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((feat, fi) => (
                    <li key={fi} className="flex items-center gap-2.5 text-xs text-purple-200">
                      <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={`w-full py-3 rounded-xl font-bold text-xs text-center transition-all ${
                    p.popular
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                      : 'glass-card border border-purple-500/30 text-purple-200 hover:bg-purple-900/40'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon }: any) {
  return (
    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-purple-300/70 font-medium">{label}</span>
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
        {value.toLocaleString()}
      </div>
      <span className="text-[10px] text-purple-400/60">{sub}</span>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  );
}
