'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/CheckoutModal';
import { CatalogProduct } from '@/lib/catalog';
import { supabase } from '@/lib/supabase';
import {
  Check,
  ShieldCheck,
  Zap,
  Sparkles,
  Clock,
  ArrowRight,
  ChevronRight,
  Headphones,
  CheckCircle2,
  Share2,
  Copy,
  Layers,
  Server,
  Lock,
  Package,
  QrCode,
  Shield,
  ShoppingBag
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface ProductDetailClientProps {
  product: CatalogProduct;
  liveRate: number;
  related: CatalogProduct[];
}

export default function ProductDetailClient({
  product,
  liveRate,
  related
}: ProductDetailClientProps) {
  const [currency, setCurrency] = useState<'PHP' | 'USD'>('PHP');
  const [selectedTierKey, setSelectedTierKey] = useState<string>(
    product.tierOptions[0]?.tierKey || 'lifetime'
  );
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem, openCart } = useCart();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) setCurrentUser(data.session.user);
    });
  }, []);

  const fallbackFlatTier = {
    id: `flat_${product.id}`,
    tierKey: 'flat',
    name: 'Direct Access',
    pricePHP: Number(product.pricePHP) || 0,
    priceUSD: Number(product.priceUSD) || 0,
    originalPricePHP: Number(product.originalPricePHP) || 0,
    originalPriceUSD: Number(product.originalPriceUSD) || 0,
    discountPercent: Number(product.discountPercent) || 0,
    hasDiscount: Boolean(product.hasDiscount),
    dailyLimit: 0,
  };

  const activeTier =
    product.tierOptions?.find((t) => t.tierKey === selectedTierKey) ||
    product.tierOptions?.[0] ||
    fallbackFlatTier;

  const currentPricePHP = activeTier ? activeTier.pricePHP : product.pricePHP;
  const currentPriceUSD = activeTier ? activeTier.priceUSD : product.priceUSD;
  const currentOrigPHP = activeTier ? activeTier.originalPricePHP : product.originalPricePHP;
  const currentOrigUSD = activeTier ? activeTier.originalPriceUSD : product.originalPriceUSD;
  const hasDiscount = Boolean(activeTier?.hasDiscount && currentOrigPHP);
  const discountPercent = activeTier?.discountPercent || product.discountPercent;

  const handleAddToCart = () => {
    if (!activeTier || product.isOutOfStock) return;
    addItem({
      productId: product.id,
      title: product.title,
      imageUrl: product.imageUrl,
      categoryLabel: product.categoryLabel,
      tierKey: activeTier.tierKey,
      tierName: activeTier.name,
      dailyLimit: activeTier.dailyLimit,
      pricePHP: currentPricePHP,
      priceUSD: currentPriceUSD,
      originalPricePHP: currentOrigPHP,
      originalPriceUSD: currentOrigUSD,
      discountPercent: discountPercent,
      hasDiscount: hasDiscount,
      deliveryMode: product.deliveryMode
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    openCart();
  };

  const formatPrice = (usd: number, php: number) => {
    if (currency === 'USD') {
      return `$${Number(usd).toFixed(2)}`;
    }
    return `₱${Math.round(php).toLocaleString('en-US')}`;
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-purple-600/30 selection:text-purple-200">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* ── BREADCRUMBS & SHARE ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 text-xs font-mono">
          <nav className="flex items-center gap-1.5 text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <Link href="/products" className="hover:text-white transition-colors">
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <Link
              href={`/products?category=${product.categorySlug}`}
              className="hover:text-purple-400 transition-colors"
            >
              {product.categoryLabel}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="text-zinc-200 truncate max-w-[200px] sm:max-w-none">
              {product.title}
            </span>
          </nav>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer text-xs"
            title="Copy Share Link"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* ── 2-COLUMN PRODUCT GRID (FLK-INSPIRED) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ══════════════════════════════════════════
              LEFT COLUMN: VISUALS, SPECS & DESCRIPTION (7 COLS)
              ══════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Hero Media Showcase */}
            <div className="relative rounded-3xl bg-zinc-900/40 border border-zinc-800/80 overflow-hidden shadow-2xl p-6 sm:p-8 backdrop-blur">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  {product.badge || product.categoryLabel}
                </span>

                <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Automated Delivery</span>
                </span>
              </div>

              {/* Product Visual */}
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-zinc-800/60 flex items-center justify-center group">
                {product.imageUrl && !imgError ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 750px"
                    onError={() => setImgError(true)}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-950/50">
                      <Server className="w-10 h-10" />
                    </div>
                    <div>
                      <div className="font-mono text-lg font-bold text-white tracking-wide">
                        {product.title}
                      </div>
                      <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest mt-1">
                        ASYNC Enterprise Engine
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Key Attributes Grid (4-Card Matrix) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                  Delivery Mode
                </div>
                <div className="font-bold text-zinc-200 truncate">
                  {(product as any).specs?.deliveryLabel || (product.deliveryMode === 'stock_pool' ? 'Instant Delivery' : 'Instant License')}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                  Platform
                </div>
                <div className="font-bold text-zinc-200 truncate">
                  {(product as any).specs?.platform || 'Windows 10 / 11'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                  {product.deliveryMode === 'stock_pool' ? 'Stock Unit' : 'Daily Quota'}
                </div>
                <div className="font-bold text-purple-400 truncate">
                  {(product as any).specs?.quotaLabel || (
                    product.deliveryMode === 'stock_pool'
                      ? '1 Item per Unit'
                      : (activeTier?.dailyLimit ? `${activeTier.dailyLimit} Accounts / Day` : 'Standard Quota')
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                  Access Level
                </div>
                <div className="font-bold text-emerald-400 truncate">
                  {(product as any).specs?.accessLevel || 'Full Unrestricted'}
                </div>
              </div>
            </div>

            {/* 3. Included Features & Capabilities */}
            <div className="p-6 sm:p-7 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-purple-400 uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Included Features & Specifications</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {product.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs text-zinc-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Description & Overview */}
            <div className="p-6 sm:p-7 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4 text-sm leading-relaxed text-zinc-300">
              <div className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Product Overview
              </div>
              <p className="whitespace-pre-line text-zinc-300 font-sans">
                {product.description}
              </p>

              {product.details && (
                <div className="pt-4 border-t border-zinc-800/80">
                  <div className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Redemption & Operational Guidelines
                  </div>
                  <p className="whitespace-pre-line text-xs font-mono text-zinc-400">
                    {product.details}
                  </p>
                </div>
              )}
            </div>

            {/* 5. Trust & Redemption Doctrine */}
            <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-3.5">
              <Shield className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-mono font-bold text-zinc-200">
                  Automated Cryptographic Dispatch
                </div>
                <div className="text-zinc-400 leading-relaxed font-sans">
                  Upon approval of payment, your unique entitlement key is generated automatically by the server and immediately displayed on-screen. Redemptions sync across both web and Discord bot.
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              RIGHT COLUMN: STICKY PURCHASE CARD (5 COLS)
              ══════════════════════════════════════════ */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="p-6 sm:p-7 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur space-y-6">
              {/* Product Header & Live Stock */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                    {product.categoryLabel}
                  </span>

                  {/* Stock Status Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      {product.deliveryMode === 'stock_pool'
                        ? product.isOutOfStock
                          ? 'Sold Out'
                          : `${product.stockCount} in Stock`
                        : 'In Stock · Instant Delivery'}
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl font-bold font-mono text-white tracking-tight">
                  {product.title}
                </h1>
              </div>

              {/* Price Header with Currency Toggle */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    {product.tierOptions?.length > 0 && activeTier?.name ? `${activeTier.name} Access` : 'Total Price'}
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-mono font-bold text-white tracking-tight">
                      {formatPrice(currentPriceUSD, currentPricePHP)}
                    </span>

                    {hasDiscount && (
                      <>
                        <span className="text-sm font-mono text-zinc-500 line-through">
                          {formatPrice(currentOrigUSD || 0, currentOrigPHP || 0)}
                        </span>
                        {discountPercent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            -{discountPercent}%
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Currency Switcher */}
                <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs">
                  <button
                    onClick={() => setCurrency('PHP')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      currency === 'PHP'
                        ? 'bg-purple-600 text-white font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    PHP
                  </button>
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      currency === 'USD'
                        ? 'bg-purple-600 text-white font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>

              {/* Duration / Tier Selector Tabs */}
              {product.tierOptions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span>Select Duration Variant</span>
                    <span className="text-purple-400 text-[11px] font-semibold">
                      {activeTier?.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {product.tierOptions.map((opt) => {
                      const isSelected = opt.tierKey === selectedTierKey;
                      const optPrice = currency === 'USD' ? opt.priceUSD : opt.pricePHP;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedTierKey(opt.tierKey)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                            isSelected
                              ? 'bg-purple-600/15 border-purple-500 shadow-md shadow-purple-950/40 text-white'
                              : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-xs font-bold text-white">
                              {opt.name}
                            </span>
                            {opt.hasDiscount && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                -{opt.discountPercent}%
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-xs mt-1 text-purple-300 font-semibold">
                            {formatPrice(opt.priceUSD, opt.pricePHP)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Primary Action Buttons (Add to Cart + Buy Now) */}
              <div className="space-y-2.5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={product.isOutOfStock}
                    onClick={handleAddToCart}
                    className={`py-3.5 px-4 rounded-2xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      product.isOutOfStock
                        ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                        : 'bg-zinc-900/90 hover:bg-zinc-850 hover:border-purple-500/60 border border-zinc-700/80 text-white'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-purple-400" />
                    <span>{addedToCart ? 'Added to Cart ✓' : 'Add to Cart'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={product.isOutOfStock}
                    onClick={() => setIsCheckoutOpen(true)}
                    className={`py-3.5 px-4 rounded-2xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      product.isOutOfStock
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-950/60 hover:shadow-purple-900/80 hover:translate-y-[-1px]'
                    }`}
                  >
                    <span>
                      {product.isOutOfStock
                        ? 'Sold Out'
                        : `Buy Now · ${formatPrice(currentPriceUSD, currentPricePHP)}`}
                    </span>
                    {!product.isOutOfStock && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-[11px] font-mono text-center text-zinc-500">
                  Instant Dispatch &bull; Encrypted Token &bull; Lifetime Vouch Guarantee
                </div>
              </div>

              {/* Trust Badges & Supported Payment Methods */}
              <div className="pt-4 border-t border-zinc-800/80 space-y-3 font-mono text-xs">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Supported Payment Rails
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px]">
                    QRPH Payment
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px]">
                    PayPal
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px]">
                    Store Balance
                  </span>
                </div>

                <div className="space-y-2 pt-2 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Safe payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Instant Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Headphones className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RELATED PRODUCTS ROW ── */}
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-zinc-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-mono text-white">
                  Related Products
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Discover more tools and service licenses in our catalog
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((rel) => {
                const relTier = rel.tierOptions[0];
                return (
                  <Link
                    key={rel.id}
                    href={`/products/${rel.id}`}
                    className="p-5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-purple-500/50 transition-all group block shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">
                        {rel.categoryLabel}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {currency === 'USD' ? `$${rel.priceUSD.toFixed(2)}` : `₱${Math.round(rel.pricePHP).toLocaleString()}`}
                      </span>
                    </div>

                    <div className="font-mono font-bold text-sm text-zinc-200 group-hover:text-purple-300 transition-colors line-clamp-1">
                      {rel.title}
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {rel.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between text-xs font-mono text-zinc-500 pt-3 border-t border-zinc-800/60">
                      <span>{relTier ? `${relTier.name}` : 'Instant Access'}</span>
                      <span className="text-purple-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Inspect &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ── CHECKOUT MODAL DRAWER ── */}
      {isCheckoutOpen && activeTier && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          product={product}
          tier={activeTier}
          currentUser={currentUser}
        />
      )}

      <Footer />
    </div>
  );
}

