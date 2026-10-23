'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  X,
  Sparkles,
  Zap,
  CreditCard,
  QrCode,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  Wallet
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    categoryLabel?: string;
    imageUrl?: string;
    badge?: string;
  };
  tier: {
    tierKey: string;
    name: string;
    pricePHP: number;
    priceUSD: number;
    originalPricePHP?: number;
    originalPriceUSD?: number;
    discountPercent?: number;
    hasDiscount?: boolean;
    dailyLimit?: number;
  };
  currentUser?: any;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  product,
  tier,
  currentUser
}: CheckoutModalProps) {
  const router = useRouter();

  const [selectedProvider, setSelectedProvider] = useState<'balance' | 'qrph' | 'paypal'>('paypal');
  const [emailInput, setEmailInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User web balance
  const [balancePHP, setBalancePHP] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const discordId =
    currentUser?.user_metadata?.provider_id ||
    currentUser?.user_metadata?.sub ||
    currentUser?.identities?.find((i: any) => i.provider === 'discord')?.identity_data?.sub ||
    currentUser?.id ||
    null;

  const defaultEmail = currentUser?.email || '';

  useEffect(() => {
    if (defaultEmail && !emailInput) {
      setEmailInput(defaultEmail);
    }
  }, [defaultEmail]);

  // Fetch live web balance
  useEffect(() => {
    if (discordId) {
      setLoadingBalance(true);
      fetch(`/api/user/balance?discordId=${discordId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) setBalancePHP(Number(data.balancePHP || 0));
        })
        .catch((e) => console.warn(e))
        .finally(() => setLoadingBalance(false));
    }
  }, [discordId]);

  if (!isOpen) return null;

  const hasEnoughBalance = balancePHP >= tier.pricePHP;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const email = emailInput.trim();
    if (!email && !discordId) {
      setErrorMsg('Please provide a valid email address for delivery.');
      return;
    }

    if (selectedProvider === 'balance' && !hasEnoughBalance) {
      setErrorMsg(`Insufficient Web Balance. You need ₱${tier.pricePHP} but have ₱${balancePHP}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          tierKey: tier.tierKey,
          provider: selectedProvider,
          email: email || `${discordId}@discord.asyncdevph.xyz`,
          discordId: discordId || null,
          orderType: 'product_purchase'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || 'Failed to initiate order session.');
        setSubmitting(false);
        return;
      }

      // Route directly to order tracking screen
      router.push(`/order/${data.orderId}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div
        className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Lock className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
              SECURE CHECKOUT // ASYNC STORE
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleCheckout} className="p-6 space-y-5">
          
          {/* Product Summary Header */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">
                {product.categoryLabel || 'SOFTWARE LICENSE'}
              </span>
              <h3 className="text-sm font-bold text-white leading-tight mt-0.5">
                {product.title}
              </h3>
              <div className="text-xs font-mono text-zinc-400 mt-1">
                Selected: <span className="text-white font-semibold">{tier.name}</span>
                {tier.dailyLimit && <span className="text-zinc-500"> ({tier.dailyLimit} gens/day)</span>}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-base font-mono font-bold text-white">
                ₱{tier.pricePHP.toLocaleString('en-PH')} / ${tier.priceUSD.toFixed(2)}
              </div>
              {tier.hasDiscount && tier.discountPercent && (
                <div className="text-[10px] font-mono text-emerald-400">
                  Save {tier.discountPercent}%
                </div>
              )}
            </div>
          </div>

          {/* Delivery Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">
              DELIVERY EMAIL ADDRESS:
            </label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. you@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors font-sans"
            />
            <span className="text-[10px] text-zinc-500 block">
              License key and order receipt will be linked to this email address.
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400">
              SELECT PAYMENT METHOD:
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              
              {/* Option 1: Web Balance */}
              <div
                onClick={() => setSelectedProvider('balance')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedProvider === 'balance'
                    ? 'bg-purple-950/20 border-purple-500 text-white shadow-sm'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${selectedProvider === 'balance' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Web Balance</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-normal">
                        INSTANT KEY
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      Available: ₱{balancePHP.toLocaleString('en-PH')} PHP
                    </div>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-white">
                  ₱{tier.pricePHP.toLocaleString('en-PH')}
                </div>
              </div>

              {/* Option 2: QRPH Payment (GCash / Maya) */}
              <div
                onClick={() => setSelectedProvider('qrph')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedProvider === 'qrph'
                    ? 'bg-purple-950/20 border-purple-500 text-white shadow-sm'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${selectedProvider === 'qrph' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>QRPH Payment</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-normal">
                        LOCAL PH
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      Direct QR scan via GCash, Maya, or any QRPH banking app
                    </div>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-white">
                  ₱{tier.pricePHP.toLocaleString('en-PH')}
                </div>
              </div>

              {/* Option 3: PayPal Friends & Family */}
              <div
                onClick={() => setSelectedProvider('paypal')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedProvider === 'paypal'
                    ? 'bg-purple-950/20 border-purple-500 text-white shadow-sm'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${selectedProvider === 'paypal' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>PayPal (Friends & Family)</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-normal">
                        ZERO FEES
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      Stealth natural memo matching
                    </div>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-white">
                  ${tier.priceUSD.toFixed(2)} USD
                </div>
              </div>

            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{submitting ? 'Creating Order Session...' : 'Continue to Payment'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-mono text-zinc-500">
              🔒 256-bit encrypted checkout session • Instant cryptographic dispatch
            </span>
          </div>

        </form>
      </div>

    </div>
  );
}

