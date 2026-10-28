'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Package,
  Tag
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import CartCheckoutModal from '@/components/CartCheckoutModal';
import { supabase } from '@/lib/supabase';

export default function CartDrawer() {
  const pathname = usePathname();
  const {
    items,
    isOpen,
    openCart,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    totalCount,
    totalPHP,
    totalUSD,
    isHydrated
  } = useCart();

  // Strict storefront routing guard: restrict Cart pull tab & drawer exclusively to the storefront
  const isStorefront = useMemo(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.host.toLowerCase();
      if (host.startsWith('gen.') || host.startsWith('admin.') || host.startsWith('reseller.')) {
        return false;
      }
    }
    if (!pathname) return false;
    return (
      pathname === '/' ||
      pathname.startsWith('/products') ||
      pathname.startsWith('/order')
    );
  }, [pathname]);

  const [currency, setCurrency] = useState<'PHP' | 'USD'>('PHP');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

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
          items,
          currency
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

  const handleRemovePromo = () => {
    setAppliedCoupon(null);
    setPromoError(null);
  };

  // Fetch current user session for checkout modal
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  if (!isHydrated || !isStorefront) return null;

  const formatPrice = (usd: number, php: number) => {
    if (currency === 'USD') return `$${Number(usd).toFixed(2)}`;
    return `₱${Math.round(php).toLocaleString('en-US')}`;
  };

  return (
    <>
      {/* Floating Edge Pull Tab (Fixed flush right at vertical center) */}
      {!isOpen && (
        <button
          onClick={openCart}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center p-3 sm:p-3.5 rounded-l-2xl bg-zinc-950/90 hover:bg-zinc-900 border-l border-y border-zinc-800 hover:border-purple-500/50 text-white shadow-2xl backdrop-blur-md transition-all duration-200 group cursor-pointer active:scale-95"
          aria-label="Open Shopping Cart"
          title="Open Shopping Cart"
        >
          <div className="relative flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
            {totalCount > 0 && (
              <span className="absolute -top-2.5 -left-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-purple-600 border border-purple-400 text-[10px] font-mono font-bold flex items-center justify-center shadow-lg shadow-purple-950 animate-in zoom-in duration-150">
                {totalCount}
              </span>
            )}
          </div>
        </button>
      )}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={closeCart}
          />

          {/* Slide-over Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-950 border-l border-zinc-800 text-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <div>
              <div className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <span>SHOPPING CART</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={closeCart}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Items Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-mono font-bold text-zinc-300">Your cart is empty</div>
                <p className="text-xs text-zinc-500 max-w-xs">
                  Browse our high-performance developer tools, bypasses, and account bundles.
                </p>
              </div>
              <Link
                href="/products"
                onClick={closeCart}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-purple-950/40"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex gap-3.5"
                >
                  {/* Item Image Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <h4 className="text-xs font-mono font-bold text-white truncate leading-tight">
                          {item.title}
                        </h4>
                        <div className="text-[11px] font-mono text-purple-400 mt-0.5">
                          {item.tierName}
                          {item.dailyLimit ? ` (${item.dailyLimit} gens/day)` : ''}
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.cartItemId)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Stepper & Price Row */}
                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-l-lg transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 py-1 text-xs font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          disabled={item.quantity >= 20}
                          className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 disabled:cursor-not-allowed rounded-r-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="font-mono text-xs font-bold text-white">
                        {formatPrice(
                          item.priceUSD * item.quantity,
                          item.pricePHP * item.quantity
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-1 flex justify-end">
                <button
                  onClick={clearCart}
                  className="text-[11px] font-mono text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear all items
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-zinc-800/80 bg-zinc-900/60 space-y-4 shrink-0">
            {/* Promo Code Input & Applied State */}
            <div className="space-y-1.5">
              {!appliedCoupon ? (
                <form onSubmit={handleApplyPromo} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Promo / Coupon code"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 uppercase tracking-wider"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={promoLoading || !promoInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-mono font-bold text-zinc-200 transition-colors cursor-pointer shrink-0"
                  >
                    {promoLoading ? 'Checking...' : 'Apply'}
                  </button>
                </form>
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
                    onClick={handleRemovePromo}
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

            {/* Currency Selector & Subtotal */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">Currency</span>
                <div className="flex items-center p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px]">
                  <button
                    onClick={() => setCurrency('PHP')}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      currency === 'PHP'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    PHP
                  </button>
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      currency === 'USD'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>

              {appliedCoupon && Number(appliedCoupon.discountAmount) > 0 && (
                <div className="space-y-1 pt-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(totalUSD, totalPHP)}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-400 font-medium">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>
                      -{formatPrice(
                        currency === 'USD' ? Number(appliedCoupon.discountAmount) : 0,
                        currency === 'PHP' ? Number(appliedCoupon.discountAmount) : 0
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs font-mono text-zinc-400">Total Due</span>
                <span className="text-xl font-mono font-bold text-white">
                  {formatPrice(
                    appliedCoupon && currency === 'USD'
                      ? Math.max(0, totalUSD - Number(appliedCoupon.discountAmount))
                      : totalUSD,
                    appliedCoupon && currency === 'PHP'
                      ? Math.max(0, totalPHP - Number(appliedCoupon.discountAmount))
                      : totalPHP
                  )}
                </span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Safe payment</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Instant Access</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>24/7 Support</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => {
                closeCart();
                setIsCheckoutModalOpen(true);
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-purple-950/60"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
        </>
      )}

      {/* Cart Checkout Modal */}
      {isCheckoutModalOpen && (
        <CartCheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          currentUser={currentUser}
          appliedCoupon={appliedCoupon}
        />
      )}
    </>
  );
}

