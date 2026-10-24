'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Coins,
  Tag
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

export type PaymentRail = 'paymongo_qrph' | 'gcash' | 'maya' | 'paypal' | 'crypto' | 'balance';

export default function CheckoutModal({
  isOpen,
  onClose,
  product,
  tier,
  currentUser
}: CheckoutModalProps) {
  const router = useRouter();

  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentRail>('paymongo_qrph');
  const [emailInput, setEmailInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

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
          // Set initial provider to first enabled rail
          if (data.settings.paymongoEnabled) setSelectedProvider('paymongo_qrph');
          else if (data.settings.gcashEnabled) setSelectedProvider('gcash');
          else if (data.settings.mayaEnabled) setSelectedProvider('maya');
          else if (data.settings.paypalEnabled) setSelectedProvider('paypal');
          else if (data.settings.cryptoEnabled) setSelectedProvider('crypto');
          else setSelectedProvider('balance');
        }
      })
      .catch((e) => console.warn('[CheckoutModal] Error fetching payment settings:', e));
  }, []);

  // Fetch live web balance
  useEffect(() => {
    if (discordId) {
      fetch(`/api/user/balance?discordId=${discordId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) setBalancePHP(Number(data.balancePHP || 0));
        })
        .catch((e) => console.warn('[CheckoutModal] Balance error:', e));
    }
  }, [discordId]);

  if (!isOpen) return null;

  // Surcharge computation
  const getFeePercent = (provider: PaymentRail): number => {
    if (!paymentSettings) return 0;
    if (provider === 'paymongo_qrph') return Number(paymentSettings.paymongoFeePercent || 0);
    if (provider === 'gcash') return Number(paymentSettings.gcashFeePercent || 0);
    if (provider === 'maya') return Number(paymentSettings.mayaFeePercent || 0);
    if (provider === 'paypal') return Number(paymentSettings.paypalFeePercent || 0);
    if (provider === 'crypto') return Number(paymentSettings.cryptoFeePercent || 0);
    return 0; // 'balance' is always 0%
  };

  const activeFeePercent = getFeePercent(selectedProvider);
  const isUsdProvider = selectedProvider === 'paypal' || selectedProvider === 'crypto';

  const rawBasePrice = isUsdProvider ? tier.priceUSD : tier.pricePHP;
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const basePrice = Math.max(0, rawBasePrice - discountAmount);
  const feeAmount = Math.round((basePrice * (activeFeePercent / 100)) * 100) / 100;
  const finalPrice = Math.round((basePrice + feeAmount) * 100) / 100;

  const hasEnoughBalance = balancePHP >= basePrice;

  const handleApplyPromo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promoInput.trim()) return;

    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoInput.trim(),
          items: [{
            productId: product.id,
            pricePHP: tier.pricePHP,
            priceUSD: tier.priceUSD,
            quantity: 1,
            hasDiscount: tier.hasDiscount,
            discountPercent: tier.discountPercent,
            originalPricePHP: tier.originalPricePHP
          }],
          currency: isUsdProvider ? 'USD' : 'PHP'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPromoError(data.error || 'Invalid coupon code.');
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(data);
      setPromoInput('');
    } catch (err: any) {
      setPromoError(err?.message || 'Failed to validate promo code.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const email = emailInput.trim();
    if (!email && !discordId) {
      setErrorMsg('Please provide a valid email address for delivery.');
      return;
    }

    if (selectedProvider === 'balance' && !hasEnoughBalance) {
      setErrorMsg(`Insufficient Web Balance. You need ₱${basePrice} but have ₱${balancePHP}.`);
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
          couponCode: appliedCoupon?.code || null,
          orderType: 'product_purchase'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || 'Failed to initiate order session.');
        setSubmitting(false);
        return;
      }

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
        <form onSubmit={handleCheckout} className="p-6 space-y-5 overflow-y-auto">
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

          {/* Customer Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">
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
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold">
              SELECT PAYMENT METHOD:
            </label>

            <div className="grid grid-cols-1 gap-2">
              {/* Option 1: PayMongo QRPH */}
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
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        Universal QR scan via GCash, Maya, ShopeePay, or Banking Apps
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-white shrink-0">
                    ₱{Math.round(tier.pricePHP * (1 + (paymentSettings?.paymongoFeePercent || 0) / 100)).toLocaleString('en-PH')}
                  </div>
                </div>
              )}

              {/* Option 2: GCash Direct */}
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
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        Direct GCash QR Code / Mobile Transfer
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-white shrink-0">
                    ₱{Math.round(tier.pricePHP * (1 + (paymentSettings?.gcashFeePercent || 0) / 100)).toLocaleString('en-PH')}
                  </div>
                </div>
              )}

              {/* Option 3: Maya Direct */}
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
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        Direct Maya QR / Mobile Transfer
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-white shrink-0">
                    ₱{Math.round(tier.pricePHP * (1 + (paymentSettings?.mayaFeePercent || 0) / 100)).toLocaleString('en-PH')}
                  </div>
                </div>
              )}

              {/* Option 4: PayPal Friends & Family */}
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
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        Friends &amp; Family note dispatch
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-white shrink-0">
                    ${(tier.priceUSD * (1 + (paymentSettings?.paypalFeePercent || 0) / 100)).toFixed(2)} USD
                  </div>
                </div>
              )}

              {/* Option 5: Crypto (LTC / USDT) */}
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
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        Direct blockchain transfer
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-white shrink-0">
                    ${(tier.priceUSD * (1 + (paymentSettings?.cryptoFeePercent || 0) / 100)).toFixed(2)} USD
                  </div>
                </div>
              )}

              {/* Option 6: Store Balance */}
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
                        INSTANT KEY
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      Available: ₱{balancePHP.toLocaleString('en-PH')} PHP
                    </div>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-white shrink-0">
                  ₱{tier.pricePHP.toLocaleString('en-PH')}
                </div>
              </div>
            </div>
          </div>

          {/* Promo Code Input & Applied State */}
          <div className="space-y-1.5">
            {!appliedCoupon ? (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Promo / Coupon code"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 uppercase tracking-wider"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-mono font-bold text-zinc-200 transition-colors cursor-pointer shrink-0"
                >
                  {promoLoading ? 'Checking...' : 'Apply'}
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-[11px] text-purple-200 truncate">
                    {appliedCoupon.message}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setPromoError(null);
                  }}
                  className="p-1 rounded hover:bg-purple-500/20 text-zinc-400 hover:text-white transition-colors cursor-pointer ml-2 shrink-0"
                  title="Remove Promo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {promoError && (
              <div className="text-[11px] font-mono text-rose-400 leading-tight">
                {promoError}
              </div>
            )}
          </div>

          {/* Surcharge & Total Breakdown */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Item Subtotal</span>
              <span>{isUsdProvider ? `$${rawBasePrice.toFixed(2)} USD` : `₱${rawBasePrice.toLocaleString('en-PH')} PHP`}</span>
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
                {isUsdProvider ? `$${finalPrice.toFixed(2)} USD` : `₱${finalPrice.toLocaleString('en-PH')} PHP`}
              </span>
            </div>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-purple-950/60"
            >
              <span>
                {submitting
                  ? 'Initiating Order Session...'
                  : `Pay Now · ${isUsdProvider ? `$${finalPrice.toFixed(2)} USD` : `₱${finalPrice.toLocaleString('en-PH')} PHP`}`}
              </span>
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
