'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  Coins
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { PaymentRail } from '@/components/CheckoutModal';

interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  appliedCoupon?: any;
}

export default function CartCheckoutModal({
  isOpen,
  onClose,
  currentUser,
  appliedCoupon
}: CartCheckoutModalProps) {
  const router = useRouter();
  const { items, totalPHP, totalUSD, clearCart, closeCart } = useCart();

  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentRail>('paymongo_qrph');
  const [emailInput, setEmailInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User web balance
  const [balancePHP, setBalancePHP] = useState<number>(0);

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

  // Fetch payment settings
  useEffect(() => {
    fetch('/api/payment-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.settings) {
          setPaymentSettings(data.settings);
          if (data.settings.paymongoEnabled) setSelectedProvider('paymongo_qrph');
          else if (data.settings.gcashEnabled) setSelectedProvider('gcash');
          else if (data.settings.mayaEnabled) setSelectedProvider('maya');
          else if (data.settings.paypalEnabled) setSelectedProvider('paypal');
          else if (data.settings.cryptoEnabled) setSelectedProvider('crypto');
          else setSelectedProvider('balance');
        }
      })
      .catch((e) => console.warn('[CartCheckoutModal] Error fetching settings:', e));
  }, []);

  // Fetch live web balance
  useEffect(() => {
    if (discordId) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        } else {
          return;
        }
        fetch('/api/user/balance', { headers })
          .then((res) => res.json())
          .then((data) => {
            if (data.ok) setBalancePHP(Number(data.balancePHP || 0));
          })
          .catch((e) => console.warn('[CartCheckout] Balance check warning:', e));
      });
    }
  }, [discordId]);

  if (!isOpen || items.length === 0) return null;

  // Fee computation
  const getFeePercent = (provider: PaymentRail): number => {
    if (!paymentSettings) return 0;
    if (provider === 'paymongo_qrph') return Number(paymentSettings.paymongoFeePercent || 0);
    if (provider === 'gcash') return Number(paymentSettings.gcashFeePercent || 0);
    if (provider === 'maya') return Number(paymentSettings.mayaFeePercent || 0);
    if (provider === 'paypal') return Number(paymentSettings.paypalFeePercent || 0);
    if (provider === 'crypto') return Number(paymentSettings.cryptoFeePercent || 0);
    return 0;
  };

  const activeFeePercent = getFeePercent(selectedProvider);
  const isUsdProvider = selectedProvider === 'paypal' || selectedProvider === 'crypto';

  const rawBaseTotal = isUsdProvider ? totalUSD : totalPHP;
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const baseTotal = Math.max(0, rawBaseTotal - discountAmount);
  const feeAmount = Math.round((baseTotal * (activeFeePercent / 100)) * 100) / 100;
  const finalTotal = Math.round((baseTotal + feeAmount) * 100) / 100;

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
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider: selectedProvider,
          email: email || `${discordId}@discord.asyncdevph.xyz`,
          discordId: discordId || null,
          orderType: 'product_purchase',
          couponCode: appliedCoupon?.code || null,
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

      // 3. Clear cart, close drawer, and redirect to order tracking screen
      clearCart();
      closeCart();
      onClose();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      router.push(`/order/${data.orderId}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
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

            <div className="max-h-36 overflow-y-auto space-y-2 pr-1 divide-y divide-zinc-800/50">
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

            <div className="grid grid-cols-1 gap-2">
              {/* PayMongo QRPH */}
              {(!paymentSettings || paymentSettings.paymongoEnabled) && (
                <div
                  onClick={() => setSelectedProvider('paymongo_qrph')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedProvider === 'paymongo_qrph'
                      ? 'bg-purple-950/20 border-purple-500 text-white shadow-sm'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${selectedProvider === 'paymongo_qrph' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>PayMongo QRPH</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                          INSTORE QRPH
                        </span>
                        {Number(paymentSettings?.paymongoFeePercent || 0) > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            +{paymentSettings.paymongoFeePercent}% FEE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400">GCash, Maya, ShopeePay, Bank QR</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-white shrink-0">
                    ₱{Math.round(totalPHP * (1 + (paymentSettings?.paymongoFeePercent || 0) / 100)).toLocaleString('en-PH')}
                  </div>
                </div>
              )}

              {/* GCash Direct */}
              {paymentSettings?.gcashEnabled && (
                <div
                  onClick={() => setSelectedProvider('gcash')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedProvider === 'gcash'
                      ? 'bg-purple-950/20 border-purple-500 text-white shadow-sm'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${selectedProvider === 'gcash' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>GCash Direct</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">
                          E-WALLET
                        </span>
                        {Number(paymentSettings?.gcashFeePercent || 0) > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            +{paymentSettings.gcashFeePercent}% FEE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400">Direct GCash Mobile / QR</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-white shrink-0">
                    ₱{Math.round(totalPHP * (1 + (paymentSettings?.gcashFeePercent || 0) / 100)).toLocaleString('en-PH')}
                  </div>
                </div>
              )}

              {/* Maya Direct */}
              {paymentSettings?.mayaEnabled && (
                <div
                  onClick={() => setSelectedProvider('maya')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedProvider === 'maya'
                      ? 'bg-purple-950/20 border-purple-500 text-white shadow-sm'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${selectedProvider === 'maya' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Maya Direct</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                          E-WALLET
                        </span>
                        {Number(paymentSettings?.mayaFeePercent || 0) > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            +{paymentSettings.mayaFeePercent}% FEE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400">Direct Maya Mobile / QR</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-white shrink-0">
                    ₱{Math.round(totalPHP * (1 + (paymentSettings?.mayaFeePercent || 0) / 100)).toLocaleString('en-PH')}
                  </div>
                </div>
              )}

              {/* PayPal */}
              {(!paymentSettings || paymentSettings.paypalEnabled) && (
                <div
                  onClick={() => setSelectedProvider('paypal')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
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
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>PayPal</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                          USD
                        </span>
                        {Number(paymentSettings?.paypalFeePercent || 0) > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            +{paymentSettings.paypalFeePercent}% FEE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400">Friends &amp; Family dispatch</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-white shrink-0">
                    ${(totalUSD * (1 + (paymentSettings?.paypalFeePercent || 0) / 100)).toFixed(2)} USD
                  </div>
                </div>
              )}

              {/* Crypto */}
              {paymentSettings?.cryptoEnabled && (
                <div
                  onClick={() => setSelectedProvider('crypto')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedProvider === 'crypto'
                      ? 'bg-purple-950/20 border-purple-500 text-white shadow-sm'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${selectedProvider === 'crypto' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Crypto</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          LTC / USDT
                        </span>
                        {Number(paymentSettings?.cryptoFeePercent || 0) > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            +{paymentSettings.cryptoFeePercent}% FEE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400">Direct blockchain transfer</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-white shrink-0">
                    ${(totalUSD * (1 + (paymentSettings?.cryptoFeePercent || 0) / 100)).toFixed(2)} USD
                  </div>
                </div>
              )}

              {/* Web Balance */}
              <div
                onClick={() => setSelectedProvider('balance')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
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
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Store Balance</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                        INSTANT
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {discordId ? `Available: ₱${balancePHP.toLocaleString('en-PH')} PHP` : 'Requires Discord Login'}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-white shrink-0">
                  ₱{totalPHP.toLocaleString('en-PH')}
                </div>
              </div>
            </div>
          </div>

          {/* Surcharge & Total Breakdown */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Cart Subtotal</span>
              <span>{isUsdProvider ? `$${rawBaseTotal.toFixed(2)} USD` : `₱${rawBaseTotal.toLocaleString('en-PH')} PHP`}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <span>Coupon Discount</span>
                  {appliedCoupon?.code && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                      {appliedCoupon.code}
                    </span>
                  )}
                </span>
                <span>-{isUsdProvider ? `$${discountAmount.toFixed(2)} USD` : `₱${discountAmount.toFixed(2)} PHP`}</span>
              </div>
            )}
            {activeFeePercent > 0 && (
              <div className="flex items-center justify-between text-zinc-400">
                <span>Gateway Fee (+{activeFeePercent}%)</span>
                <span className="text-amber-400">+{isUsdProvider ? `$${feeAmount.toFixed(2)} USD` : `₱${feeAmount.toFixed(2)} PHP`}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-bold text-white pt-1 border-t border-zinc-800/60">
              <span>Total Due</span>
              <span className="text-purple-400">
                {isUsdProvider ? `$${finalTotal.toFixed(2)} USD` : `₱${finalTotal.toLocaleString('en-PH')} PHP`}
              </span>
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
              className="w-full py-4 px-5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-purple-950/60"
            >
              <span>
                {submitting
                  ? 'Initiating Order Session...'
                  : `Pay Now · ${isUsdProvider ? `$${finalTotal.toFixed(2)} USD` : `₱${finalTotal.toLocaleString('en-PH')} PHP`}`}
              </span>
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
