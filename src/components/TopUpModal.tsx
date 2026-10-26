'use client';

import { useState } from 'react';
import { X, Wallet, ShieldCheck, ArrowRight, Loader2, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

export default function TopUpModal({ isOpen, onClose }: TopUpModalProps) {
  const [amount, setAmount] = useState<number>(250);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const effectiveAmount = customAmount ? Math.max(50, Number(customAmount) || 0) : amount;

  const handleCreateTopupOrder = async () => {
    if (effectiveAmount < 50) {
      setErrorMsg('Minimum top-up amount is ₱50.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setErrorMsg('Authentication session expired. Please log in again.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderType: 'balance_topup',
          topupAmount: effectiveAmount,
          provider: 'gcash',
          email: session.user?.email || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || 'Failed to initialize top-up order.');
        setLoading(false);
        return;
      }

      // Navigate directly to the GCash order verification screen
      window.location.href = `/order/${data.orderId}`;
    } catch (err: any) {
      console.error('[TopUpModal] Error:', err);
      setErrorMsg('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Top Up Web Balance</h2>
              <p className="text-xs text-zinc-400">GCash Express Payment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Selector */}
        <div className="py-5 space-y-4">
          <label className="text-xs font-medium text-zinc-300 block">Select Amount (PHP)</label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = !customAmount && amount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-mono font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.35)]'
                      : 'bg-zinc-900/60 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  ₱{amt.toLocaleString('en-PH')}
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-[11px] text-zinc-500 block mb-1">Or custom amount (min ₱50)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">₱</span>
              <input
                type="number"
                min="50"
                step="10"
                placeholder="Custom PHP"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-zinc-900/70 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-8 pr-4 text-sm font-mono text-white placeholder-zinc-600 transition-all outline-none"
              />
            </div>
          </div>

          {/* Payment Method Notice */}
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-start gap-3 text-xs text-zinc-300">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
              G
            </div>
            <div>
              <span className="text-white font-semibold">GCash Direct Transfer:</span> Send payment via GCash QR or Mobile Number. Your balance is credited automatically upon reference verification.
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-zinc-500">Total Due: </span>
            <span className="text-white font-mono font-bold text-sm">₱{effectiveAmount.toLocaleString('en-PH')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateTopupOrder}
              disabled={loading || effectiveAmount < 50}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-900/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating QR...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Pay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

