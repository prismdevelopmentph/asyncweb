const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/app/page.tsx');
let fileContent = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add products state and fetch effect in HomePage
const targetState = `  const [currency, setCurrency] = useState<Currency>('PHP');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live Real Reviews State
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);`;

const replacementState = `  const [currency, setCurrency] = useState<Currency>('PHP');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live Real Reviews State
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  // Dynamic Storefront Digital Products State
  const [products, setProducts] = useState<any[]>(LICENSES);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.products) && data.products.length > 0) {
          const mapped = data.products.map((p: any) => ({
            id: p.id,
            title: p.title,
            category: p.category?.toLowerCase().includes('bundle') ? 'bundle' : 'single',
            categoryLabel: p.category || 'General',
            badge: p.badge || (p.highlight ? 'RECOMMENDED' : undefined),
            priceUSD: Number(p.priceUSD) || 0,
            pricePHP: Number(p.pricePHP) || 0,
            originalPriceUSD: p.originalPriceUSD ? Number(p.originalPriceUSD) : undefined,
            originalPricePHP: p.originalPricePHP ? Number(p.originalPricePHP) : undefined,
            description: p.description || '',
            features: Array.isArray(p.features) ? p.features : [],
            deliveryType: p.deliveryType || 'Instant Cryptographic Key',
            deliveryTime: 'Instant Delivery',
            icon: p.category?.toLowerCase().includes('bundle') ? Sparkles : Key,
            gradient: p.highlight
              ? 'from-purple-600/20 via-zinc-900/80 to-black'
              : 'from-purple-900/40 via-zinc-900/60 to-black',
            highlight: Boolean(p.highlight),
            imageUrl: p.imageUrl || '',
            deliveryMode: p.deliveryMode || 'automated_license',
            stockCount: p.stockCount,
            isOutOfStock: p.isOutOfStock
          }));
          setProducts(mapped);
        }
      })
      .catch((err) => console.error('[Storefront] Error loading products:', err));
  }, []);`;

fileContent = fileContent.replace(targetState, replacementState);

// 2. Update filteredLicenses to filter `products` instead of hardcoded `LICENSES`
fileContent = fileContent.replace(
  'return LICENSES.filter((item) => {',
  'return products.filter((item) => {'
);

// 3. Update Card Media Header to render image if present
const targetCardHeader = `<div className={\`relative w-full aspect-[16/9] bg-gradient-to-br \${license.gradient} p-5 flex flex-col justify-between border-b border-zinc-800/80 overflow-hidden\`}>
                      {/* Ambient Grid Accent */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-40 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-200 font-semibold backdrop-blur-md">
                          {license.badge || license.categoryLabel}
                        </span>

                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-300 backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Instant</span>
                        </div>
                      </div>

                      {/* Center Art Icon */}
                      <div className="relative z-10 flex items-center justify-center py-2">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:border-purple-500/40 transition-all duration-200 shadow-lg">
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>

                      {/* Bottom Media Bar */}
                      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>{license.deliveryType}</span>
                        <span className="text-zinc-500">{license.deliveryTime}</span>
                      </div>
                    </div>`;

const replacementCardHeader = `<div className={\`relative w-full aspect-[16/9] bg-gradient-to-br \${license.gradient} p-5 flex flex-col justify-between border-b border-zinc-800/80 overflow-hidden\`}>
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
                          <span className={\`w-1.5 h-1.5 rounded-full \${license.isOutOfStock ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}\`} />
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
                            ? (license.isOutOfStock ? 'Out of stock' : \`\${license.stockCount} in stock\`)
                            : license.deliveryTime}
                        </span>
                      </div>
                    </div>`;

fileContent = fileContent.replace(targetCardHeader, replacementCardHeader);

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Successfully updated storefront page.tsx with dynamic products & image support!');
