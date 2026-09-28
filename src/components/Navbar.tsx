'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Wrench, Sparkles, LogIn, LogOut, User, Key } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial user session
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getInitialUser();

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDiscordLogin = async () => {
    setLoading(true);

    // Dynamically determine the redirect URL based on the current origin
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectTarget = `${origin}/auth/callback`;

    console.log('[Auth] Initiating Discord PKCE login with redirect:', redirectTarget);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: redirectTarget,
      },
    });

    if (error) {
      console.error('Discord login error:', error.message);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    router.push('/');
  };

  const navItems = [
    { name: 'Home', href: '/', icon: Sparkles },
    { name: 'Decrypt', href: '/decrypt', icon: Wrench },
    { name: 'Generator', href: '/generator', icon: Key },
  ];

  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '/images/Profile.png';
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Discord User';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full glass-panel border-b border-purple-500/20 px-4 lg:px-8 py-3 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-purple-500/30 p-0.5 glass-panel-glow group-hover:border-purple-400 transition-colors">
            <Image
              src="/images/Profile.png"
              alt="ASYNC DEVELOPMENT"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-wider purple-gradient-text">
              ASYNC DEVELOPMENT
            </span>
            <span className="block text-[10px] text-purple-400 font-mono tracking-widest uppercase">
              Asset Recovery & Web Panel
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 glass-card px-3 py-1.5 rounded-full border border-purple-500/20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600/40 text-purple-200 border border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'text-purple-300/80 hover:text-purple-100 hover:bg-purple-900/30'
                }`}
              >
                <Icon className="w-4 h-4 text-purple-400" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Auth Controls */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="px-4 py-2 text-xs text-purple-300 animate-pulse">Loading auth...</div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-xl border border-purple-500/30 text-xs">
                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-purple-400/40 shrink-0">
                  <Image
                    src={userAvatar}
                    alt="Avatar"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <span className="text-purple-200 font-semibold max-w-[120px] truncate">{userName}</span>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-xs font-medium transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleDiscordLogin}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Login with Discord</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
