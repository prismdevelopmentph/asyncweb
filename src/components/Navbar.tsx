'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Wrench, Sparkles, LogIn, LogOut, Key, Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const syncSecurityCookie = (userObj: any) => {
    if (typeof document === 'undefined') return;
    if (userObj) {
      const discordId =
        userObj.user_metadata?.provider_id ||
        userObj.user_metadata?.sub ||
        userObj.identities?.find((i: any) => i.provider === 'discord')?.identity_data?.sub ||
        userObj.identities?.find((i: any) => i.provider === 'discord')?.id ||
        userObj.id ||
        null;
      if (discordId) {
        document.cookie = `async_security_uid=${discordId}; Path=/; Max-Age=31536000; SameSite=Lax`;
      }
    } else {
      document.cookie = 'async_security_uid=; Path=/; Max-Age=0; SameSite=Lax';
    }
  };

  useEffect(() => {
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      syncSecurityCookie(user);
      setLoading(false);
    };

    getInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      syncSecurityCookie(currentUser);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDiscordLogin = () => {
    setLoading(true);
    window.location.href = '/api/auth/discord/login';
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    syncSecurityCookie(null);
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
    <header className="fixed top-0 left-0 right-0 z-50 w-full glass-panel border-b border-purple-500/20 px-3 sm:px-6 lg:px-8 py-2.5 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-purple-500/30 p-0.5 glass-panel-glow group-hover:border-purple-400 transition-colors">
            <Image
              src="/images/Profile.png"
              alt="ASYNC DEVELOPMENT"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-lg tracking-wider purple-gradient-text block leading-tight">
              ASYNC
            </span>
            <span className="hidden sm:block text-[10px] text-purple-400 font-mono tracking-widest uppercase">
              Asset Recovery & Web Panel
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
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

        {/* Auth Controls & Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="px-2 py-1 text-[11px] text-purple-300 animate-pulse">Loading...</div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 glass-card px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-purple-500/30 text-xs">
                <div className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-purple-400/40 shrink-0">
                  <Image
                    src={userAvatar}
                    alt="Avatar"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <span className="text-purple-200 font-semibold max-w-[75px] sm:max-w-[120px] truncate text-[11px] sm:text-xs">
                  {userName}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-[11px] sm:text-xs font-medium transition-all"
              >
                <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleDiscordLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-xs sm:text-sm hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl glass-card border border-purple-500/30 text-purple-300 hover:text-white transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-purple-400" /> : <Menu className="w-5 h-5 text-purple-400" />}
          </button>
        </div>

      </div>

      {/* Mobile Slide-Down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-purple-500/20 max-w-7xl mx-auto flex flex-col gap-1.5 glass-ultra p-3 rounded-2xl border border-purple-500/30 animate-in slide-in-from-top duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-600/40 text-purple-100 border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'text-purple-300/90 hover:text-purple-100 hover:bg-purple-900/30'
                }`}
              >
                <Icon className="w-4 h-4 text-purple-400" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
