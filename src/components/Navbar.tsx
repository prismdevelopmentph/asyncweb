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
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-black/85 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 sm:py-4 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 relative">

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group z-10">
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-zinc-800 p-0.5 bg-zinc-950 group-hover:border-zinc-700 transition-colors">
            <Image
              src="/images/Profile.png"
              alt="ASYNC DEVELOPMENT"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-wide text-white block leading-tight">
              ASYNC DEVELOPMENT
            </span>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono tracking-wider">
              Developer Tools & Automation Platform
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links (Mathematically Centered) */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-950 px-2 py-1.5 rounded-full border border-zinc-800 absolute left-1/2 -translate-x-1/2 z-0 shadow-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-zinc-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Auth Controls & Mobile Menu Toggle */}
        <div className="flex items-center gap-2.5 z-10">
          {loading ? (
            <div className="px-3 py-1.5 text-[11px] text-zinc-500 font-mono animate-pulse">Loading...</div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-zinc-900/90 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-zinc-800 text-xs">
                <div className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-zinc-700 shrink-0">
                  <Image
                    src={userAvatar}
                    alt="Avatar"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <span className="text-zinc-200 font-medium max-w-[85px] sm:max-w-[130px] truncate text-xs">
                  {userName}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-rose-400 border border-zinc-800 text-xs font-medium transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleDiscordLogin}
              className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm transition-colors shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-zinc-400" />}
          </button>
        </div>

      </div>

      {/* Mobile Slide-Down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-zinc-800 max-w-7xl mx-auto flex flex-col gap-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800 animate-in slide-in-from-top duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
