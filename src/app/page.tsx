import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DiscordLoginButton from '@/components/DiscordLoginButton';
import { createClient } from '@/lib/supabase-server';
import { Shield, Sparkles, ArrowRight, Activity, Cpu, Wrench, Lock } from 'lucide-react';

export default async function HomePage() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  return (
    <div className="min-h-screen bg-[#0b0716] text-purple-100 flex flex-col relative selection:bg-purple-600 selection:text-white overflow-hidden">
      <Navbar />

      {/* Ambient glowing orbs */}
      <div className="purple-glow-bg -top-20 left-1/2 -translate-x-1/2 opacity-70 w-[600px] h-[600px]"></div>
      <div className="purple-glow-bg bottom-10 right-10 opacity-30"></div>

      <main className="flex-1 max-w-5xl mx-auto px-4 lg:px-8 py-16 sm:py-24 flex flex-col items-center justify-center text-center relative z-10">
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-purple-500/30 text-purple-300 text-xs font-mono mb-8 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>ONLINE • DISCORD BOT & WEB PIPELINE</span>
        </div>

        {/* Brand Logo */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 mx-auto mb-8 rounded-3xl overflow-hidden glass-panel-glow border-2 border-purple-500/40 p-1.5 shadow-[0_0_60px_rgba(168,85,247,0.35)] transform hover:scale-105 transition-all duration-300">
          <Image
            src="/images/Profile.png"
            alt="ASYNC TAGABASAG"
            fill
            className="object-cover rounded-2xl"
            priority
          />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-tight">
          ASYNC <span className="purple-gradient-text">TAGABASAG</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-purple-200/80 text-base sm:text-lg mb-10 leading-relaxed font-light">
          High-performance asset recovery, FiveM Lua decryption, and 3D vertex reconstruction portal. Sign in with Discord to access your personal dashboard and files.
        </p>

        {/* Call to Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto mb-16">
          {user ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <DiscordLoginButton size="lg" className="w-full sm:w-auto" />
          )}
        </div>

        {/* Clean Features Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 text-left flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-purple-100">Lua Decryption</h3>
              <p className="text-xs text-purple-300/70 mt-0.5">Automated script unpacking and deobfuscation</p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 text-left flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-purple-100">Vertex Repair</h3>
              <p className="text-xs text-purple-300/70 mt-0.5">3D geometry reconstruction & corrupted mesh fix</p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 text-left flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-purple-100">Role & Cloud Sync</h3>
              <p className="text-xs text-purple-300/70 mt-0.5">Instant Discord role perks & personal file storage</p>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
