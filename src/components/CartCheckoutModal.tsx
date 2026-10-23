'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  Wallet,
  ShoppingBag
} from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';

interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

export default function CartCheckoutModal({
  isOpen,
  onClose,
  currentUser
}: CartCheckoutModalProps) {
  const router = useRouter();
  const { items, totalPHP, totalUSD, clearCart } = useCart();

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
        .catch((e) => console.warn('[CartCheckout] Balance check warning:', e))
        .finally(() => setLoadingBalance(false));
    }
  }, [discordId]);

  if (!isOpen || items.length === 0) return null;

  const hasEnoughBalance = balancePHP >= totalPHP;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const email = emailInput.trim();
    if (!email && !discordId) {
      setErrorMsg('Please provide a valid email address for delivery.');
      return;
    }

    if (selectedProvider === 'balance' && !hasEnoughBalance) {
      setErrorMsg(`Insufficient Web Balance. Required: ₱${totalPHP.toLocaleString('en-PH')}, Available: ₱${balancePHP.toLocaleString('en-PH')}`);
      return;
    }

    setSubmitting(true);

    try {
      // 1. Silent stock verification for any finite pooled items
      const pooledItems = items.filter((i) => i.deliveryMode === 'stock_pool');
      if (pooledItems.length > 0) {
        try {
          const stockRes = await fetch('/api/v2/stock');
          if (stockRes.ok) {
            const stockData = await stockRes.json();
            const stockMap = stockData.stock || {};

            for (const pItem of pooledItems) {
              const key = pItem.title.toLowerCase();
              let available = 999;
              if (key.includes('steam')) available = stockMap.steam ?? 0;
              else if (key.includes('discord')) available = stockMap.discord ?? 0;
              else if (key.includes('rockstar')) available = stockMap.rockstar ?? 0;
              else if (key.includes('cyberghost') || key.includes('vpn')) available = stockMap.cyberghost ?? 0;

              if (available < pItem.quantity) {
                setErrorMsg(`"${pItem.title}" has insufficient stock (${available} remaining). Please adjust quantity.`);
                setSubmitting(false);
                return;
              }
            }
          }
        } catch (stockErr) {
          console.warn('[CartCheckout] Stock check bypassed on network warning:', stockErr);
        }
      }

      // 2. Create Order Session with cart items payload
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          email: email || `${discordId}@discord.asyncdevph.xyz`,
          discordId: discordId || null,
          orderType: 'product_purchase',
          cartItems: items.map((i) => ({
            productId: i.productId,
            tierKey: i.tierKey,
            tierName: i.tierName,
            title: i.title,
            pricePHP: i.pricePHP,
            priceUSD: i.priceUSD,
            quantity: i.quantity,
            deliveryMode: i.deliveryMode
          }))
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || 'Failed to initiate order session.');
        setSubmitting(false);
        return;
      }

      // 3. Clear cart and redirect to order tracking screen
      clearCart();
      onClose();
      router.push(`/order/${data.orderId}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Lock className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
              CART CHECKOUT // ASYNC STORE
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
        <form onSubmit={handleCheckout} className="p-6 space-y-5 overflow-y-auto">
          {/* Cart Items Summary Box */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
              <span>Items in Cart ({items.length})</span>
              <span className="text-purple-400">
                ₱{totalPHP.toLocaleString('en-PH')} / ${totalUSD.toFixed(2)}
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 divide-y divide-zinc-800/50">
              {items.map((item) => (
                <div key={item.cartItemId} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="truncate flex-1">
                    <div className="font-bold text-white truncate">{item.title}</div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      {item.tierName} &times; {item.quantity}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-zinc-200 shrink-0">
                    ₱{(item.pricePHP * item.quantity).toLocaleString('en-PH')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Provider Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">
              Select Payment Method
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* PayPal (Friends & Family) */}
              <button
                type="button"
                onClick={() => setSelectedProvider('paypal')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedProvider === 'paypal'
                    ? 'bg-purple-600/10 border-purple-500 shadow-md shadow-purple-950/40 text-white'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <CreditCard className={`w-4 h-4 ${selectedProvider === 'paypal' ? 'text-purple-400' : 'text-zinc-500'}`} />
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    USD
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">PayPal</div>
                  <div className="text-[10px] text-zinc-500">Friends & Family</div>
                </div>
              </button>

              {/* QRPH / GCash / Maya */}
              <button
                type="button"
                onClick={() => setSelectedProvider('qrph')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedProvider === 'qrph'
                    ? 'bg-purple-600/10 border-purple-500 shadow-md shadow-purple-950/40 text-white'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <QrCode className={`w-4 h-4 ${selectedProvider === 'qrph' ? 'text-purple-400' : 'text-zinc-500'}`} />
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    PHP
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">QRPH Payment</div>
                  <div className="text-[10px] text-zinc-500">GCash / Maya</div>
                </div>
              </button>

              {/* Store Web Balance */}
              <button
                type="button"
                onClick={() => setSelectedProvider('balance')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedProvider === 'balance'
                    ? 'bg-purple-600/10 border-purple-500 shadow-md shadow-purple-950/40 text-white'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Wallet className={`w-4 h-4 ${selectedProvider === 'balance' ? 'text-purple-400' : 'text-zinc-500'}`} />
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    INSTANT
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Store Balance</div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {discordId ? `₱${balancePHP.toLocaleString('en-PH')}` : 'Requires Login'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Delivery Email Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">
              Delivery Email Address
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. yourname@gmail.com"
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <p className="text-[11px] text-zinc-500">
              License keys and order receipt will be dispatched to this email.
            </p>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-zinc-400">
            <div className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safe payment</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Instant Access</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>24/7 Support</span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-purple-950/60"
            >
              <span>
                {submitting
                  ? 'Initiating Order Session...'
                  : `Pay Now · ${
                      selectedProvider === 'paypal'
                        ? `$${totalUSD.toFixed(2)} USD`
                        : `₱${totalPHP.toLocaleString('en-PH')} PHP`
                    }`}
              </span>
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
