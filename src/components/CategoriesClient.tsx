'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Package,
  Sparkles,
  ArrowRight,
  Key,
  Server,
  Layers,
  Shield,
  Zap,
  CheckCircle2,
  ExternalLink,
  Search
} from 'lucide-react';
import { CatalogProduct } from '@/lib/catalog';

interface CategorySummary {
  id: string;
  slug: string;
  label: string;
  count: number;
  hasHighlight: boolean;
  minPricePHP: number;
  minPriceUSD: number;
  sampleProducts: string[];
}

interface CategoriesClientProps {
  categories: CategorySummary[];
  products: CatalogProduct[];
  liveRate: number;
}

export default function CategoriesClient({ categories, products }: CategoriesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = categories.filter((cat) =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.sampleProducts.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCategoryIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('bundle') || l.includes('package')) return Server;
    if (l.includes('tool') || l.includes('dev')) return Zap;
    if (l.includes('asset')) return Layers;
    return Key;
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col relative selection:bg-purple-600 selection:text-white overflow-hidden dev-grid-bg">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 sm:pb-28 relative z-10 w-full space-y-12">
        {/* Header Banner */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-purple-300 text-[11px] font-mono">
            <Package className="w-3.5 h-3.5 text-purple-400" />
            <span className="tracking-wider uppercase">DEPARTMENTS // CATEGORY HUB</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans">
            Product <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-400">Categories</span>
          </h1>

          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
            Explore ASYNC development solutions grouped by specialized category. From single-service licenses to comprehensive multi-game bundles.
          </p>

          {/* Search Box */}
          <div className="pt-2 max-w-md mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories or products..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-purple-500/60 focus:outline-none text-xs text-zinc-200 placeholder-zinc-500 transition-colors font-sans"
              />
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => {
            const Icon = getCategoryIcon(cat.label);
            return (
              <div
                key={cat.id}
                className={`group rounded-3xl bg-zinc-950/80 border p-6 flex flex-col justify-between transition-all duration-200 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/20 relative overflow-hidden ${
                  cat.hasHighlight ? 'border-purple-500/40' : 'border-zinc-800/80'
                }`}
              >
                {cat.hasHighlight && (
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                )}

                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-purple-400 group-hover:scale-110 group-hover:border-purple-500/40 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {cat.count} {cat.count === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>

                  {/* Category Title */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {cat.label}
                  </h3>

                  {/* Sample Items in Category */}
                  <div className="space-y-2 mb-6">
                    <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                      INCLUDED PRODUCTS:
                    </div>
                    <div className="space-y-1.5">
                      {cat.sampleProducts.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-zinc-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="line-clamp-1">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Starting at</div>
                    <div className="text-sm font-mono font-bold text-white">
                      ₱{cat.minPricePHP.toLocaleString('en-PH')} / ${cat.minPriceUSD.toFixed(2)}
                    </div>
                  </div>

                  <Link
                    href={`/products?category=${encodeURIComponent(cat.label)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold font-mono transition-all group-hover:translate-x-0.5"
                  >
                    <span>Browse</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </section>

        {/* Global Catalog Link Banner */}
        <section className="p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-zinc-950 to-zinc-950 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs font-mono text-purple-400 mb-1">UNFILTERED ACCESS</div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Prefer to browse all items together?</h3>
            <p className="text-xs text-zinc-400 max-w-xl">
              Inspect our full inventory with real-time multi-tier pricing, instant stock badges, and interactive duration selectors.
            </p>
          </div>
          <Link
            href="/products"
            className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono flex items-center gap-2 shadow-lg transition-all shrink-0"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
