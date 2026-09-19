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
        // The Supabase client with detectSessionInUrl: true will automatically
        // pick up the #access_token fragment from the URL (implicit flow)
        // and establish a session. We just need to wait for it.

        // First check if session is already established
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Auth Callback] Error:', error.message);
          setStatus(`Authentication failed: ${error.message}`);
          setHasError(true);
          setTimeout(() => router.replace('/'), 3000);
          return;
        }

        if (session) {
          console.log('[Auth Callback] Session found:', session.user?.user_metadata?.full_name);
          setStatus('Success! Redirecting to dashboard...');
          router.replace('/dashboard');
          return;
        }

        // If no session yet, listen for the SIGNED_IN event
        // (the Supabase client may still be processing the hash fragment)
        console.log('[Auth Callback] Waiting for auth state change...');
        setStatus('Processing login...');

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[Auth Callback] Auth event:', event);
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
            setStatus('Success! Redirecting to dashboard...');
            subscription.unsubscribe();
            router.replace('/dashboard');
          }
        });

        // Timeout after 8 seconds
        setTimeout(async () => {
          // One last check
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            subscription.unsubscribe();
            router.replace('/dashboard');
          } else {
            subscription.unsubscribe();
            setStatus('Authentication timed out. Please try again.');
            setHasError(true);
            setTimeout(() => router.replace('/'), 2000);
          }
        }, 8000);

      } catch (err: any) {
        console.error('[Auth Callback] Unexpected error:', err);
        setStatus(`Error: ${err.message || 'Unknown error'}`);
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
