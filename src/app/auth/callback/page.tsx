'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sparkles } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      } else if (error) {
        console.error('Auth callback error:', error.message);
        router.replace('/?error=auth_failed');
      } else {
        // Wait briefly for auth state listener
        setTimeout(async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            router.replace('/dashboard');
          } else {
            router.replace('/dashboard');
          }
        }, 1000);
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0b0716] flex flex-col items-center justify-center text-purple-100 p-4">
      <div className="glass-panel-glow p-8 rounded-3xl text-center max-w-sm w-full border border-purple-500/40">
        <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-bold mb-2 purple-gradient-text">Authenticating...</h2>
        <p className="text-xs text-purple-300/70">Logging you in via Discord and loading your dashboard.</p>
      </div>
    </div>
  );
}
