'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DiscordLoginButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function DiscordLoginButton({
  className = '',
  size = 'md',
  text = 'Login with Discord',
}: DiscordLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectTarget = `${origin}/auth/callback`;

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

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base font-bold',
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-[0_0_30px_rgba(139,92,246,0.45)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none ${sizeStyles[size]} ${className}`}
    >
      <LogIn className="w-5 h-5 text-purple-200" />
      <span>{loading ? 'Connecting to Discord...' : text}</span>
    </button>
  );
}

