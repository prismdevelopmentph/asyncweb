const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/app/admin/page.tsx');
let fileContent = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update activeTab type
fileContent = fileContent.replace(
  "const [activeTab, setActiveTab] = useState<'security' | 'generator' | 'audit' | 'chat'>('security');",
  "const [activeTab, setActiveTab] = useState<'security' | 'generator' | 'products' | 'audit' | 'chat'>('security');"
);

// 2. Add product states after copiedKey
const stateInsertion = `  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Digital Products Management State
  const [productsList, setProductsList] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Product Form Fields
  const [prodTitle, setProdTitle] = useState('');
  const [prodCategory, setProdCategory] = useState('Generator Licenses');
  const [prodPriceUSD, setProdPriceUSD] = useState('');
  const [prodPricePHP, setProdPricePHP] = useState('');
  const [prodOrigUSD, setProdOrigUSD] = useState('');
  const [prodOrigPHP, setProdOrigPHP] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodFeatures, setProdFeatures] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodDeliveryMode, setProdDeliveryMode] = useState<'automated_license' | 'stock_pool'>('automated_license');
  const [prodLicenseTier, setProdLicenseTier] = useState<'1day' | '7day' | '30day' | 'lifetime'>('1day');
  const [prodDailyLimit, setProdDailyLimit] = useState('15');
  const [prodServiceScope, setProdServiceScope] = useState<'all' | 'fivem' | 'single'>('all');
  const [prodStockPool, setProdStockPool] = useState('');
  const [prodBadge, setProdBadge] = useState('');
  const [prodIsActive, setProdIsActive] = useState(true);
  const [prodHighlight, setProdHighlight] = useState(false);`;

fileContent = fileContent.replace(
  "  const [copiedKey, setCopiedKey] = useState<string | null>(null);",
  stateInsertion
);

// 3. Update useEffect and add handlers
const effectTarget = `  useEffect(() => {
    if (user && isOwner) {
      fetchAdminData();
    }
  }, [user, isOwner]);`;

const effectReplacement = `  useEffect(() => {
    if (user && isOwner) {
      fetchAdminData();
      fetchProducts();
    }
  }, [user, isOwner]);

  // Digital Products Handlers
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) {
          setProductsList(data.products);
        }
      }
    } catch (err) {
      console.error('[Admin] Error fetching products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleOpenProductModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setProdTitle(product.title || '');
      setProdCategory(product.category || 'Generator Licenses');
      setProdPriceUSD(product.priceUSD !== undefined ? String(product.priceUSD) : '');
      setProdPricePHP(product.pricePHP !== undefined ? String(product.pricePHP) : '');
      setProdOrigUSD(product.originalPriceUSD ? String(product.originalPriceUSD) : '');
      setProdOrigPHP(product.originalPricePHP ? String(product.originalPricePHP) : '');
      setProdDescription(product.description || '');
      setProdFeatures(Array.isArray(product.features) ? product.features.join('\\n') : '');
      setProdImageUrl(product.imageUrl || '');
      setProdDeliveryMode(product.deliveryMode || 'automated_license');
      setProdLicenseTier(product.licenseTier || '1day');
      setProdDailyLimit(product.dailyLimit ? String(product.dailyLimit) : '15');
      setProdServiceScope(product.serviceScope || 'all');
      setProdStockPool(Array.isArray(product.stockPool) ? product.stockPool.join('\\n') : '');
      setProdBadge(product.badge || '');
      setProdIsActive(product.isActive !== undefined ? Boolean(product.isActive) : true);
      setProdHighlight(Boolean(product.highlight));
    } else {
      setEditingProduct(null);
      setProdTitle('');
      setProdCategory('Generator Licenses');
      setProdPriceUSD('1.00');
      setProdPricePHP('50.00');
      setProdOrigUSD('');
      setProdOrigPHP('');
      setProdDescription('');
      setProdFeatures('Instant cryptographic key\\nDaily automated reset\\n100% Replacement warranty');
      setProdImageUrl('');
      setProdDeliveryMode('automated_license');
      setProdLicenseTier('1day');
      setProdDailyLimit('15');
      setProdServiceScope('all');
      setProdStockPool('');
      setProdBadge('');
      setProdIsActive(true);
      setProdHighlight(false);
    }
    setShowProductModal(true);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('ownerUserId', ownerUserId || '719482630633947166');

      const res = await fetch('/api/admin/products/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        alert(data.error || 'Failed to upload image.');
        return;
      }

      setProdImageUrl(data.url);
    } catch (err: any) {
      console.error('[Admin] Image upload error:', err);
      alert('Network error while uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim()) {
      alert('Please enter a product title.');
      return;
    }

    try {
      setSavingProduct(true);
      const payload = {
        id: editingProduct?.id,
        title: prodTitle.trim(),
        category: prodCategory.trim() || 'General',
        priceUSD: parseFloat(prodPriceUSD) || 0,
        pricePHP: parseFloat(prodPricePHP) || 0,
        originalPriceUSD: prodOrigUSD ? parseFloat(prodOrigUSD) : undefined,
        originalPricePHP: prodOrigPHP ? parseFloat(prodOrigPHP) : undefined,
        description: prodDescription.trim(),
        features: prodFeatures.split('\\n').map((s) => s.trim()).filter(Boolean),
        imageUrl: prodImageUrl.trim(),
        deliveryMode: prodDeliveryMode,
        licenseTier: prodLicenseTier,
        dailyLimit: parseInt(prodDailyLimit, 10) || 15,
        serviceScope: prodServiceScope,
        stockPool: prodStockPool.split('\\n').map((s) => s.trim()).filter(Boolean),
        badge: prodBadge.trim(),
        isActive: prodIsActive,
        highlight: prodHighlight,
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_product',
          ownerUserId: ownerUserId || '719482630633947166',
          product: payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to save product.');
        return;
      }

      await fetchProducts();
      setShowProductModal(false);
    } catch (err) {
      console.error('[Admin] Error saving product:', err);
      alert('Network error while saving product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleProductStatus = async (productId: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          ownerUserId: ownerUserId || '719482630633947166',
          productId,
        }),
      });
      if (res.ok) {
        setProductsList((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isActive: !p.isActive } : p))
        );
      }
    } catch (err) {
      console.error('[Admin] Error toggling product status:', err);
    }
  };

  const handleDeleteProduct = async (productId: string, title: string) => {
    if (!window.confirm(\`Delete product "\${title}"? This cannot be undone.\`)) return;

    try {
      const res = await fetch(
        \`/api/admin/products?id=\${encodeURIComponent(productId)}&ownerUserId=\${encodeURIComponent(
          ownerUserId || '719482630633947166'
        )}\`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setProductsList((prev) => prev.filter((p) => p.id !== productId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete product.');
      }
    } catch (err) {
      console.error('[Admin] Error deleting product:', err);
    }
  };`;

fileContent = fileContent.replace(effectTarget, effectReplacement);

// 4. Add Products tab button to navigation ribbon
const navRibbonTarget = `<button
              onClick={() => setActiveTab('audit')}`;

const navRibbonReplacement = `<button
              onClick={() => {
                setActiveTab('products');
                fetchProducts();
              }}
              className={\`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap \${
                activeTab === 'products'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }\`}
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Digital Products</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {productsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}`;

fileContent = fileContent.replace(navRibbonTarget, navRibbonReplacement);

// 5. Add Quick Action Add Product button
const quickActionTarget = `{activeTab === 'generator' && (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowCreateBundleModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-xs flex items-center gap-2 transition-all shadow-sm shrink-0"
                >
                  <Package className="w-4 h-4 text-purple-400" />
                  <span>Create a Bundle</span>
                </button>

                <button
                  onClick={() => setShowGenLicenseModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Generate Key</span>
                </button>
              </div>
            )}`;

const quickActionReplacement = `{activeTab === 'generator' && (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowCreateBundleModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-xs flex items-center gap-2 transition-all shadow-sm shrink-0"
                >
                  <Package className="w-4 h-4 text-purple-400" />
                  <span>Create a Bundle</span>
                </button>

                <button
                  onClick={() => setShowGenLicenseModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Generate Key</span>
                </button>
              </div>
            )}

            {activeTab === 'products' && (
              <button
                onClick={() => handleOpenProductModal()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}`;

fileContent = fileContent.replace(quickActionTarget, quickActionReplacement);

// 6. Add Products Tab Content View
const tabViewTarget = `{/* ── TAB 4: AUDIT TRAIL ── */}`;

const tabViewReplacement = `{/* ── TAB 3: DIGITAL PRODUCTS & CATALOG ── */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Header Strip & Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-zinc-400">Total Catalog Items</div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5">{productsList.length}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-zinc-400">Active On Storefront</div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                    {productsList.filter((p) => p.isActive).length}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-zinc-400">Automated Gen (Mode A)</div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-0.5">
                    {productsList.filter((p) => p.deliveryMode === 'automated_license').length}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Zap className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-zinc-400">Stock Pools (Mode B)</div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-blue-400 mt-0.5">
                    {productsList
                      .filter((p) => p.deliveryMode === 'stock_pool')
                      .reduce((sum, p) => sum + (p.stockPool?.length || 0), 0)}{' '}
                    <span className="text-xs text-zinc-500 font-normal">units</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Database className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Catalog List / Cards */}
            {productsLoading ? (
              <div className="p-12 text-center rounded-3xl bg-zinc-950/40 border border-zinc-800">
                <RefreshCw className="w-6 h-6 text-zinc-500 animate-spin mx-auto mb-2" />
                <div className="text-xs text-zinc-400 font-mono">Loading digital products...</div>
              </div>
            ) : productsList.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-zinc-950/40 border border-zinc-800">
                <Package className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-white mb-1">No Digital Products in Catalog</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                  Add digital products, software licenses, or game accounts to make them available for purchase on the storefront.
                </p>
                <button
                  onClick={() => handleOpenProductModal()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                >
                  Create First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productsList
                  .filter((p) => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      p.title?.toLowerCase().includes(q) ||
                      p.category?.toLowerCase().includes(q) ||
                      p.description?.toLowerCase().includes(q)
                    );
                  })
                  .map((product) => {
                    const isStockPool = product.deliveryMode === 'stock_pool';
                    const currentStock = isStockPool ? (product.stockPool?.length || 0) : null;

                    return (
                      <div
                        key={product.id}
                        className={\`rounded-2xl bg-zinc-950/80 border p-5 flex flex-col justify-between transition-all \${
                          product.isActive
                            ? 'border-zinc-800/80 hover:border-zinc-700'
                            : 'border-zinc-800/40 opacity-60'
                        }\`}
                      >
                        <div>
                          {/* Image Thumbnail / Fallback Header */}
                          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 mb-4 flex items-center justify-center">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-zinc-600">
                                <Package className="w-8 h-8 mb-1 opacity-50" />
                                <span className="text-[10px] font-mono">No Image</span>
                              </div>
                            )}

                            {/* Badges on top of image */}
                            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                              {product.badge && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-600/90 text-white shadow-md">
                                  {product.badge}
                                </span>
                              )}
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300">
                                {product.category}
                              </span>
                            </div>

                            <div className="absolute top-2 right-2">
                              <span
                                className={\`text-[10px] font-mono px-2 py-0.5 rounded-full border \${
                                  product.isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
                                }\`}
                              >
                                {product.isActive ? 'Active' : 'Hidden'}
                              </span>
                            </div>
                          </div>

                          {/* Title & Description */}
                          <h4 className="text-base font-bold text-white mb-1">{product.title}</h4>
                          <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                            {product.description || 'No description provided.'}
                          </p>

                          {/* Features Preview */}
                          {Array.isArray(product.features) && product.features.length > 0 && (
                            <div className="space-y-1 mb-4">
                              {product.features.slice(0, 3).map((f: string, i: number) => (
                                <div key={i} className="text-[11px] text-zinc-300 flex items-center gap-1.5 truncate">
                                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="truncate">{f}</span>
                                </div>
                              ))}
                              {product.features.length > 3 && (
                                <div className="text-[10px] text-zinc-500 font-mono">
                                  +{product.features.length - 3} more features
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          {/* Fulfillment & Delivery Indicator */}
                          <div className="pt-3 pb-3 border-t border-zinc-900 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              {isStockPool ? (
                                <>
                                  <Database className="w-3.5 h-3.5 text-blue-400" />
                                  <span className={currentStock > 0 ? 'text-blue-400' : 'text-rose-400'}>
                                    Stock: {currentStock} units
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="text-amber-300">
                                    Auto Gen ({product.licenseTier || '1day'})
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Dual Price Preview */}
                            <div className="text-right">
                              <div className="font-mono font-bold text-white text-sm">
                                ₱{Number(product.pricePHP).toFixed(2)}{' '}
                                <span className="text-zinc-500 font-normal text-xs">
                                  / \${Number(product.priceUSD).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleProductStatus(product.id)}
                              className={\`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 \${
                                product.isActive
                                  ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                              }\`}
                            >
                              <span>{product.isActive ? 'Hide' : 'Activate'}</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenProductModal(product)}
                                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id, product.title)}
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs transition-all"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: AUDIT TRAIL ── */}`;

fileContent = fileContent.replace(tabViewTarget, tabViewReplacement);

// 7. Add Modal before final footer
const modalTarget = `      <Footer />
    </div>
  );
}`;

const modalReplacement = `      {/* ── MODAL 5: ADD / EDIT DIGITAL PRODUCT ── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {editingProduct ? 'Edit Digital Product' : 'Add New Digital Product'}
                  </h3>
                  <p className="text-xs text-zinc-400">Configure specifications, pricing, imagery, and delivery mode</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
              {/* Row 1: Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FiveM Spoofer Lifetime"
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Generator Licenses, Cheats, Accounts"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              {/* Row 2: Dual Pricing (PHP & USD) */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                <div className="text-xs font-mono text-purple-400 font-semibold uppercase">
                  Dual Currency Pricing
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">PHP Price (₱) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="50.00"
                      value={prodPricePHP}
                      onChange={(e) => setProdPricePHP(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">PHP Strike (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="100.00"
                      value={prodOrigPHP}
                      onChange={(e) => setProdOrigPHP(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">USD Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="1.00"
                      value={prodPriceUSD}
                      onChange={(e) => setProdPriceUSD(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">USD Strike ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="2.00"
                      value={prodOrigUSD}
                      onChange={(e) => setProdOrigUSD(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Product Image Upload & Preview */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-purple-400 font-semibold uppercase">
                    Product Image (Direct Upload to Supabase CDN)
                  </label>
                  {prodImageUrl && (
                    <button
                      type="button"
                      onClick={() => setProdImageUrl('')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-mono"
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* File Pick button */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-800 hover:border-purple-500/50 rounded-2xl cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/80 transition-all text-center">
                      <Upload className="w-5 h-5 text-purple-400 mb-1" />
                      <span className="text-xs font-medium text-zinc-300">
                        {uploadingImage ? 'Uploading to Supabase CDN...' : 'Click to Upload Image File'}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5">PNG, JPG, WEBP up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={handleProductImageUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500 font-mono">OR URL:</span>
                      <input
                        type="url"
                        placeholder="https://example.com/image.png"
                        value={prodImageUrl}
                        onChange={(e) => setProdImageUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    {prodImageUrl ? (
                      <img src={prodImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-600">Preview</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 4: Fulfillment Mode Selector (Mode A vs Mode B) */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-4">
                <div className="text-xs font-mono text-purple-400 font-semibold uppercase">
                  Fulfillment & Delivery Engine
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mode A card */}
                  <div
                    onClick={() => setProdDeliveryMode('automated_license')}
                    className={\`p-3.5 rounded-xl border cursor-pointer transition-all \${
                      prodDeliveryMode === 'automated_license'
                        ? 'bg-purple-950/30 border-purple-500 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }\`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>Mode A: Automated Key Gen</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      Keys generated on-the-fly (\`LIC-XXXX-XXXX-XXXX\`). Never out of stock.
                    </p>
                  </div>

                  {/* Mode B card */}
                  <div
                    onClick={() => setProdDeliveryMode('stock_pool')}
                    className={\`p-3.5 rounded-xl border cursor-pointer transition-all \${
                      prodDeliveryMode === 'stock_pool'
                        ? 'bg-blue-950/30 border-blue-500 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }\`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <Database className="w-4 h-4 text-blue-400" />
                      <span>Mode B: Manual Stock Pool</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      Pops items from your pasted stock list. Shows exact inventory count.
                    </p>
                  </div>
                </div>

                {/* Conditional Fields based on Delivery Mode */}
                {prodDeliveryMode === 'automated_license' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-mono text-zinc-400 block mb-1">License Tier</label>
                      <select
                        value={prodLicenseTier}
                        onChange={(e) => setProdLicenseTier(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="1day">1 Day Access</option>
                        <option value="7day">7 Days Access</option>
                        <option value="30day">30 Days Access</option>
                        <option value="lifetime">Lifetime</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-zinc-400 block mb-1">Daily Limit</label>
                      <input
                        type="number"
                        value={prodDailyLimit}
                        onChange={(e) => setProdDailyLimit(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                        placeholder="15"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-zinc-400 block mb-1">Scope</label>
                      <select
                        value={prodServiceScope}
                        onChange={(e) => setProdServiceScope(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="all">All Services (All-Access)</option>
                        <option value="fivem">FiveM Bundle (Rockstar + Steam + Discord)</option>
                        <option value="single">Single Service</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-mono text-zinc-400">
                        Stock Pool Items (One item per line: keys, credentials, or links)
                      </label>
                      <span className="text-[11px] font-mono text-blue-400 font-bold">
                        {prodStockPool.split('\\n').filter((s) => s.trim()).length} Items in Pool
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={prodStockPool}
                      onChange={(e) => setProdStockPool(e.target.value)}
                      placeholder="user1:pass1&#10;user2:pass2&#10;KEY-XXXX-YYYY"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Row 5: Badge, Features, Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. POPULAR, BEST VALUE, LIMITED"
                    value={prodBadge}
                    onChange={(e) => setProdBadge(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="flex items-center gap-6 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodIsActive}
                      onChange={(e) => setProdIsActive(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-purple-600 focus:ring-0"
                    />
                    <span className="text-xs text-zinc-300 font-medium">Active on Storefront</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodHighlight}
                      onChange={(e) => setProdHighlight(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-purple-600 focus:ring-0"
                    />
                    <span className="text-xs text-zinc-300 font-medium">Highlight Border</span>
                  </label>
                </div>
              </div>

              {/* Bullet Features (One per line) */}
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">
                  Bullet Features (One per line)
                </label>
                <textarea
                  rows={3}
                  value={prodFeatures}
                  onChange={(e) => setProdFeatures(e.target.value)}
                  placeholder="Instant cryptographic key&#10;Daily automated reset&#10;100% Replacement warranty"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Comprehensive technical breakdown of this product..."
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || uploadingImage}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  {savingProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingProduct ? 'Update Product' : 'Create Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}`;

fileContent = fileContent.replace(modalTarget, modalReplacement);

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Successfully patched admin/page.tsx with Digital Products Manager!');
