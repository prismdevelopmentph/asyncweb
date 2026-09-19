'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sparkles } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Authenticating...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // For PKCE flow: the Supabase client will automatically detect ?code= 
        // in the URL and exchange it for a session using the code verifier
        // stored in localStorage
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Auth Callback] getSession error:', error.message);
          setStatus('Authentication failed. Redirecting...');
          setTimeout(() => router.replace('/?error=auth_failed'), 1500);
          return;
        }

        if (session) {
          console.log('[Auth Callback] Session found, redirecting to dashboard');
          setStatus('Success! Redirecting to dashboard...');
          router.replace('/dashboard');
          return;
        }

        // If no session yet, listen for auth state change (the PKCE exchange
        // may still be processing in the background)
        console.log('[Auth Callback] No session yet, waiting for auth state change...');
        setStatus('Processing login...');

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[Auth Callback] Auth event:', event);
          if (event === 'SIGNED_IN' && session) {
            setStatus('Success! Redirecting to dashboard...');
            subscription.unsubscribe();
            router.replace('/dashboard');
          }
        });

        // Timeout fallback — if nothing happens in 8 seconds, redirect home
        setTimeout(async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            router.replace('/dashboard');
          } else {
            setStatus('Login timed out. Redirecting...');
            router.replace('/?error=auth_timeout');
          }
          subscription.unsubscribe();
        }, 8000);

      } catch (err) {
        console.error('[Auth Callback] Unexpected error:', err);
        setStatus('Something went wrong. Redirecting...');
        setTimeout(() => router.replace('/?error=auth_failed'), 1500);
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0b0716] flex flex-col items-center justify-center text-purple-100 p-4">
      <div className="glass-panel-glow p-8 rounded-3xl text-center max-w-sm w-full border border-purple-500/40">
        <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-bold mb-2 purple-gradient-text">{status}</h2>
        <p className="text-xs text-purple-300/70">Logging you in via Discord and loading your dashboard.</p>
      </div>
    </div>
  );
}
