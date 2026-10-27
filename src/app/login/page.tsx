'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, User, ArrowRight, Shield, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'discord_already_linked') {
      setError('This Discord account is already linked to another username. Please log in with that username.');
    } else if (errorParam === 'auth_identity_collision') {
      setError('An identity collision was detected. Please log in with your primary account credentials.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError('Please enter your username or email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let targetEmail = cleanIdentifier.toLowerCase();

      // If user typed a username (no @), resolve their email from backend lookup
      if (!cleanIdentifier.includes('@')) {
        const resolveRes = await fetch('/api/auth/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanIdentifier }),
        });

        const resolveData = await resolveRes.json();
        if (!resolveRes.ok || !resolveData.email) {
          setError(resolveData.error || 'No account found with this username. Please verify or sign up.');
          setLoading(false);
          return;
        }

        targetEmail = resolveData.email;
      }

      // Authenticate directly via Supabase Auth
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (authErr) {
        if (authErr.message.toLowerCase().includes('invalid login credentials')) {
          setError('Invalid username/email or password. Please try again.');
        } else {
          setError(authErr.message || 'Authentication failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        const redirectTo = searchParams.get('redirect') || '/generator';
        router.push(redirectTo);
        router.refresh();
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[Login Error]:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ASYNC Operations Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-sans">
          Sign in to access your generator, license inventory, and dashboard
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-purple-950/20 backdrop-blur-sm">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-mono flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-300 mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User size={16} />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your username or email"
                disabled={loading}
                autoFocus
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono font-medium text-zinc-300">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loading}
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 shadow-lg shadow-purple-900/30 font-mono active:scale-[0.99] cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Existing Member Notice */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center space-y-3">
          <p className="text-xs text-zinc-400 font-sans">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Create an account
            </Link>
          </p>

          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-[11px] text-zinc-400 leading-relaxed text-left flex items-start gap-2">
            <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              Existing Discord subscriber? First time here? Sign up with your new username and link your Discord to claim your active licenses.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-purple-500/30 selection:text-purple-200">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 relative overflow-hidden">
        {/* Ambient Gradient Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

        <Suspense fallback={
          <div className="w-full max-w-md mx-auto text-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

