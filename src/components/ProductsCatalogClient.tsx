'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Sparkles,
  ArrowRight,
  Key,
  Check,
  Search,
  Server,
  Zap,
  Layers,
  ArrowLeft,
  Package
} from 'lucide-react';
import { CatalogProduct } from '@/lib/catalog';
import CheckoutModal from '@/components/CheckoutModal';
import { supabase } from '@/lib/supabase';

type Currency = 'PHP' | 'USD';

interface ProductsCatalogClientProps {
  initialProducts: CatalogProduct[];
  liveRate: number;
  initialCategories: Array<{ id: string; slug: string; label: string; count: number; hasHighlight: boolean }>;
}

export default function ProductsCatalogClient({
  initialProducts,
  liveRate,
  initialCategories
}: ProductsCatalogClientProps) {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('category');

  const [currency, setCurrency] = useState<Currency>('PHP');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>({});
  const [checkoutTarget, setCheckoutTarget] = useState<{ product: any; tier: any } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) setCurrentUser(data.session.user);
    });
  }, []);

  // Sync category from URL query param if present
  useEffect(() => {
    if (urlCategory) {
      const match = initialCategories.find(
        (c) => c.label.toLowerCase() === urlCategory.toLowerCase() || c.slug === urlCategory.toLowerCase()
      );
      if (match) {
        setSelectedCategory(match.slug);
      }
    }
  }, [urlCategory, initialCategories]);

  // Dynamic categories with real product counts
  const categories = useMemo(() => {
    return [
      { id: 'all', slug: 'all', label: 'All Products', count: initialProducts.length },
      ...initialCategories.map((c) => ({
        id: c.slug,
        slug: c.slug,
        label: c.label,
        count: initialProducts.filter((p) => p.categorySlug === c.slug).length
      }))
    ];
  }, [initialProducts, initialCategories]);

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.categorySlug === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [initialProducts, selectedCategory, searchQuery]);

  const formatPrice = (usd: number, php: number) => {
    if (currency === 'PHP') {
      return `₱${php.toLocaleString('en-PH')}`;
    }
    return `$${usd.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col relative selection:bg-purple-600 selection:text-white overflow-hidden dev-grid-bg">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 sm:pb-28 relative z-10 w-full space-y-10">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-purple-400">Products</span>
            {selectedCategory !== 'all' && (
              <>
                <span>/</span>
                <span className="text-zinc-200 uppercase">
                  {categories.find((c) => c.slug === selectedCategory)?.label || selectedCategory}
                </span>
              </>
            )}
          </div>
          <span className="text-zinc-500 font-mono text-[11px]">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} available
          </span>
        </div>

        {/* Section Header Controls: Title + Currency Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-purple-300 text-[10px] font-mono mb-1.5">
              <Layers className="w-3 h-3 text-purple-400" />
              <span>COMPLETE CATALOG</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-sans">
              All Products & Licenses
            </h1>
          </div>

          {/* Currency Switcher: PHP vs USD */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
            <span className="text-xs text-zinc-400 font-mono hidden xs:inline">Currency:</span>
            <div className="inline-flex p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setCurrency('PHP')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  currency === 'PHP'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <span>🇵🇭 PHP (₱)</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  currency === 'USD'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <span>🇺🇸 USD ($)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Controls: Category Tabs + Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCategory === cat.slug
                    ? 'bg-zinc-800 border-zinc-700 text-white shadow-sm'
                    : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  selectedCategory === cat.slug ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Real-time Search Box */}
          <div className="relative min-w-[240px] md:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or services..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-purple-500/60 focus:outline-none text-xs text-zinc-200 placeholder-zinc-500 transition-colors font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-zinc-950/50 border border-zinc-800/80">
            <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No products match your filter</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              Try searching with different keywords or reset to view all categories.
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 hover:text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((license) => {
              const Icon = license.category.toLowerCase().includes('bundle') ? Sparkles : Key;
              const activeTierKey = selectedTiers[license.id] || license.tierOptions?.[0]?.tierKey || 'daily';
              const activeTier = license.tierOptions?.find((t: any) => t.tierKey === activeTierKey) || license.tierOptions?.[0];

              const currentPriceUSD = activeTier ? Number(activeTier.priceUSD) : license.priceUSD;
              const currentPricePHP = activeTier ? Number(activeTier.pricePHP) : license.pricePHP;
              const currentOrigUSD = activeTier?.originalPriceUSD !== undefined ? Number(activeTier.originalPriceUSD) : license.originalPriceUSD;
              const currentOrigPHP = activeTier?.originalPricePHP !== undefined ? Number(activeTier.originalPricePHP) : license.originalPricePHP;

              return (
                <article
                  key={license.id}
                  className={`group rounded-3xl bg-zinc-950/80 border flex flex-col justify-between overflow-hidden transition-all duration-200 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/15 ${
                    license.highlight
                      ? 'border-purple-500/40 relative'
                      : 'border-zinc-800/80'
                  }`}
                >
                  {license.highlight && (
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                  )}

                  {/* Card Media Header (16:9 aspect) */}
                  <Link
                    href={`/products/${license.id}`}
                    className={`relative w-full aspect-[16/9] bg-gradient-to-br ${license.gradient} p-5 flex flex-col justify-between border-b border-zinc-800/80 overflow-hidden block cursor-pointer`}
                  >
                    {license.imageUrl ? (
                      <>
                        <Image
                          src={license.imageUrl}
                          alt={license.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent pointer-events-none" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-40 pointer-events-none" />
                    )}

                    {/* Top Badges */}
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-200 font-semibold backdrop-blur-md">
                        {license.badge || license.categoryLabel}
                      </span>

                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-300 backdrop-blur-md">
                        <span className={`w-1.5 h-1.5 rounded-full ${license.isOutOfStock ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
                        <span>{license.isOutOfStock ? 'Sold Out' : 'Instant'}</span>
                      </div>
                    </div>

                    {/* Center Art Icon (Shown if no custom image) */}
                    {!license.imageUrl && (
                      <div className="relative z-10 flex items-center justify-center py-2">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:border-purple-500/40 transition-all duration-200 shadow-lg">
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                    )}

                    {/* Bottom Media Bar */}
                    <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-zinc-300 backdrop-blur-xs">
                      <span>{license.deliveryType}</span>
                      <span className="text-zinc-400">
                        {license.deliveryMode === 'stock_pool'
                          ? (license.isOutOfStock ? 'Out of stock' : `${license.stockCount} in stock`)
                          : license.deliveryTime}
                      </span>
                    </div>
                  </Link>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta Category Indicator */}
                      <div className="text-[11px] font-mono text-purple-400 mb-1.5 uppercase tracking-wider">
                        {license.categoryLabel}
                      </div>

                      {/* Title */}
                      <Link href={`/products/${license.id}`} className="block">
                        <h3 className="text-base font-bold text-white group-hover:text-purple-200 transition-colors leading-snug mb-2 hover:underline">
                          {license.title}
                        </h3>
                      </Link>

                      {/* Description */}
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-3">
                        {license.description}
                      </p>

                      {/* Interactive Duration Tier Switcher */}
                      {license.tierOptions && license.tierOptions.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1.5 px-0.5">
                            <span>SELECT DURATION:</span>
                            <span className="text-purple-400 font-semibold">
                              {activeTier?.dailyLimit ? `${activeTier.dailyLimit} gens/day` : activeTier?.name}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800">
                            {license.tierOptions.map((opt: any) => {
                              const isSelected = (activeTier?.tierKey || activeTierKey) === opt.tierKey;
                              return (
                                <button
                                  key={opt.tierKey}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedTiers((prev) => ({ ...prev, [license.id]: opt.tierKey }));
                                  }}
                                  className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-center text-[11px] font-mono font-medium transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-purple-600 text-white font-bold shadow-sm shadow-purple-950 border border-purple-400/40'
                                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                  }`}
                                >
                                  {opt.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Feature Preview Bullets */}
                      <div className="space-y-1.5 mb-5 pb-5 border-b border-zinc-800/80">
                        {license.features.slice(0, 2).map((feat: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                            <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <span className="text-zinc-400 line-clamp-1">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pricing and Action Trigger */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-mono font-bold text-white">
                            {formatPrice(currentPriceUSD, currentPricePHP)}
                          </span>
                          {Boolean(activeTier?.hasDiscount && currentOrigPHP) && (
                            <>
                              <span className="text-xs text-zinc-500 line-through font-mono">
                                {formatPrice(currentOrigUSD || 0, currentOrigPHP || 0)}
                              </span>
                              {activeTier?.discountPercent && (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                  -{activeTier.discountPercent}%
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                          {activeTier ? `${activeTier.name} Access` : 'Direct Pricing'}
                        </div>
                      </div>

                      {/* Purchase Action Trigger */}
                      <button
                        type="button"
                        onClick={() => setCheckoutTarget({ product: license, tier: activeTier })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold font-mono transition-all cursor-pointer shadow-md shadow-purple-950/40 group/btn"
                      >
                        <span>Purchase</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </main>

      {/* Checkout Modal */}
      {checkoutTarget && (
        <CheckoutModal
          isOpen={Boolean(checkoutTarget)}
          onClose={() => setCheckoutTarget(null)}
          product={checkoutTarget.product}
          tier={checkoutTarget.tier}
          currentUser={currentUser}
        />
      )}

      <Footer />
    </div>
  );
}

