'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Authenticating...');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Parse the hash fragment manually
        // URL looks like: /auth/callback#access_token=xxx&refresh_token=yyy&...
        const hash = window.location.hash.substring(1); // remove the '#'
        const params = new URLSearchParams(hash);

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        console.log('[Auth Callback] Hash fragment present:', !!hash);
        console.log('[Auth Callback] access_token present:', !!accessToken);
        console.log('[Auth Callback] refresh_token present:', !!refreshToken);
        console.log('[Auth Callback] Full URL:', window.location.href);

        if (accessToken && refreshToken) {
          // Manually set the session using tokens from the hash fragment
          setStatus('Setting up your session...');

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[Auth Callback] setSession error:', error.message);
            setStatus(`Failed: ${error.message}`);
            setHasError(true);
            setTimeout(() => router.replace('/'), 3000);
            return;
          }

          if (data.session) {
            const name = data.session.user?.user_metadata?.full_name || 'User';
            console.log('[Auth Callback] Session set successfully for:', name);
            setStatus(`Welcome ${name}! Redirecting...`);
            
            // Clean the hash from URL before redirecting
            window.history.replaceState(null, '', window.location.pathname);
            router.replace('/dashboard');
            return;
          }
        }

        // If no hash tokens, check if session already exists
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('Session found! Redirecting...');
          router.replace('/dashboard');
          return;
        }

        // Check for error in query params
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        if (errorParam) {
          setStatus(`Login failed: ${urlParams.get('error_description') || errorParam}`);
          setHasError(true);
          setTimeout(() => router.replace('/'), 3000);
          return;
        }

        // Nothing found
        console.log('[Auth Callback] No tokens or session found');
        setStatus('No authentication data found.');
        setHasError(true);
        setTimeout(() => router.replace('/'), 3000);

      } catch (err: any) {
        console.error('[Auth Callback] Unexpected error:', err);
        setStatus(`Error: ${err.message}`);
        setHasError(true);
        setTimeout(() => router.replace('/'), 3000);
      }
    };

    handleAuth();
  }, [router]);

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
          {hasError ? 'Redirecting you back...' : 'Logging you in via Discord.'}
        </p>
      </div>
    </div>
  );
}
