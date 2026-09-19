'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sparkles, AlertCircle } from 'lucide-react';
import { Suspense } from 'react';

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Authenticating...');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      console.log('[Auth Callback] URL params:', { code: code ? 'present' : 'missing', errorParam, errorDesc });

      // Handle OAuth errors from Supabase/Discord
      if (errorParam) {
        console.error('[Auth Callback] OAuth error:', errorParam, errorDesc);
        setStatus(`Login failed: ${errorDesc || errorParam}`);
        setHasError(true);
        setTimeout(() => router.replace('/'), 3000);
        return;
      }

      // If we have a code, exchange it for a session (PKCE flow)
      if (code) {
        console.log('[Auth Callback] Exchanging PKCE code for session...');
        setStatus('Exchanging authorization code...');

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('[Auth Callback] Code exchange failed:', error.message);
          setStatus(`Authentication failed: ${error.message}`);
          setHasError(true);
          setTimeout(() => router.replace('/'), 3000);
          return;
        }

        if (data.session) {
          console.log('[Auth Callback] Session established:', data.user?.user_metadata?.full_name || data.user?.id);
          setStatus('Success! Redirecting to dashboard...');
          router.replace('/dashboard');
          return;
        }
      }

      // No code in URL — check if session already exists (e.g. hash fragment flow)
      console.log('[Auth Callback] No code param, checking existing session...');
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setStatus('Session found! Redirecting...');
        router.replace('/dashboard');
        return;
      }

      // Last resort: wait for auth state change
      setStatus('Waiting for authentication...');
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setStatus('Success! Redirecting...');
          subscription.unsubscribe();
          router.replace('/dashboard');
        }
      });

      // Timeout after 6 seconds
      setTimeout(() => {
        subscription.unsubscribe();
        setStatus('Authentication timed out');
        setHasError(true);
        setTimeout(() => router.replace('/'), 2000);
      }, 6000);
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#0b0716] flex flex-col items-center justify-center text-purple-100 p-4">
      <div className="glass-panel-glow p-8 rounded-3xl text-center max-w-sm w-full border border-purple-500/40">
        {hasError ? (
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        ) : (
          <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-4 animate-spin" />
        )}
        <h2 className="text-xl font-bold mb-2 purple-gradient-text">{status}</h2>
        <p className="text-xs text-purple-300/70">
          {hasError ? 'Redirecting you back...' : 'Logging you in via Discord and loading your dashboard.'}
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0716] flex flex-col items-center justify-center text-purple-100 p-4">
        <div className="glass-panel-glow p-8 rounded-3xl text-center max-w-sm w-full border border-purple-500/40">
          <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold mb-2 purple-gradient-text">Loading...</h2>
        </div>
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
}
