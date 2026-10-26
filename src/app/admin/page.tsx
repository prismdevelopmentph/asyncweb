'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DiscordLoginButton from '@/components/DiscordLoginButton';
import ImageCropModal from '@/components/ImageCropModal';
import { supabase } from '@/lib/supabase';
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  Database,
  PlusCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Wrench,
  Download,
  Search,
  ArrowLeft,
  Crown,
  Copy,
  Check,
  Unlock,
  Ban,
  Layers,
  Terminal,
  Activity,
  UserCheck,
  MoreVertical,
  Edit3,
  RotateCcw,
  Trash2,
  X,
  Upload,
  FileText,
  PackagePlus,
  Package,
  MessageSquare,
  Send,
  Shield,
  Users,
  Clock,
  ExternalLink,
  Laptop,
  CheckCircle,
  AlertTriangle,
  LogIn,
  ArrowUpRight,
  Zap,
  CreditCard,
  QrCode,
  Crop,
  Sliders,
  Coins,
  Percent,
  Eye,
  Tag
} from 'lucide-react';

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.057a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.793 8.18 1.793 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
);

function DiscordUserBadge({
  userId,
  userProfiles,
  onCopy,
  copiedKey,
  className = ''
}: {
  userId: string | null | undefined;
  userProfiles?: Record<string, { name: string; username?: string }>;
  onCopy?: (text: string) => void;
  copiedKey?: string | null;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const rawId = userId ? String(userId) : '';
  if (!rawId || rawId === 'Unknown' || rawId === 'N/A' || rawId === 'Guest / Unauthenticated') {
    return <span className="text-zinc-500 font-mono text-xs">{rawId || 'Unknown'}</span>;
  }

  const profile = userProfiles?.[rawId];
  let tooltipText = '';

  if (profile) {
    if (profile.name && profile.username && profile.name.toLowerCase() !== profile.username.toLowerCase()) {
      tooltipText = `${profile.name} (@${profile.username})`;
    } else {
      tooltipText = profile.name || profile.username || rawId;
    }
  } else if (rawId === '719482630633947166') {
    tooltipText = 'Mark (Owner)';
  } else if (rawId === 'ASYNC-V2') {
    tooltipText = 'ASYNC V2 Engine';
  }

  const hasResolvedName = Boolean(profile?.name || rawId === '719482630633947166' || rawId === 'ASYNC-V2');

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className={`font-mono text-xs select-all cursor-pointer transition-colors ${
          hasResolvedName
            ? 'text-purple-300 hover:text-white underline decoration-dotted decoration-purple-500/60 underline-offset-4'
            : 'text-zinc-300'
        }`}
      >
        {rawId}
      </span>

      {onCopy && (
        <button
          onClick={() => onCopy(rawId)}
          className="text-zinc-500 hover:text-zinc-200 transition-colors shrink-0 p-0.5 rounded hover:bg-zinc-800"
          title="Copy Discord ID"
        >
          {copiedKey === rawId ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Floating tooltip */}
      {hovered && tooltipText && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-0 h-0 flex items-center justify-center overflow-visible pointer-events-none z-50">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-purple-500/40 text-zinc-100 text-xs font-sans font-medium whitespace-nowrap shadow-2xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <span className="font-semibold tracking-wide text-zinc-100">{tooltipText}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Tabs & Modals
  const [activeTab, setActiveTab] = useState<'security' | 'generator' | 'products' | 'orders' | 'payments' | 'coupons' | 'audit' | 'chat'>('security');
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'delivered' | 'awaiting_payment' | 'rejected'>('all');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Order Detail Inspection Modal State
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<any | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Coupons Management State
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [couponFormCode, setCouponFormCode] = useState('');
  const [couponFormType, setCouponFormType] = useState<'percent' | 'fixed'>('percent');
  const [couponFormValue, setCouponFormValue] = useState('');
  const [couponFormMinSpend, setCouponFormMinSpend] = useState('0');
  const [couponFormMaxUses, setCouponFormMaxUses] = useState('');
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Payment Gateway Settings Configurator
  const [showPaymentConfig, setShowPaymentConfig] = useState(false);

  const [payConfigPaymongoEnabled, setPayConfigPaymongoEnabled] = useState(true);
  const [payConfigPaymongoAutomated, setPayConfigPaymongoAutomated] = useState(true);
  const [payConfigPaymongoSecretKey, setPayConfigPaymongoSecretKey] = useState('');
  const [payConfigPaymongoWebhookSecret, setPayConfigPaymongoWebhookSecret] = useState('');
  const [payConfigPaymongoName, setPayConfigPaymongoName] = useState('ASYNC DEV');
  const [payConfigPaymongoQrUrl, setPayConfigPaymongoQrUrl] = useState('');
  const [payConfigPaymongoFeePercent, setPayConfigPaymongoFeePercent] = useState('3.5');
  const [uploadingPaymongoQr, setUploadingPaymongoQr] = useState(false);

  const [payConfigGcashName, setPayConfigGcashName] = useState('');
  const [payConfigGcashNumber, setPayConfigGcashNumber] = useState('');
  const [payConfigGcashQrUrl, setPayConfigGcashQrUrl] = useState('');
  const [payConfigGcashEnabled, setPayConfigGcashEnabled] = useState(true);
  const [payConfigGcashFeePercent, setPayConfigGcashFeePercent] = useState('0');
  const [uploadingGcashQr, setUploadingGcashQr] = useState(false);

  const [payConfigMayaName, setPayConfigMayaName] = useState('');
  const [payConfigMayaNumber, setPayConfigMayaNumber] = useState('');
  const [payConfigMayaQrUrl, setPayConfigMayaQrUrl] = useState('');
  const [payConfigMayaEnabled, setPayConfigMayaEnabled] = useState(true);
  const [payConfigMayaFeePercent, setPayConfigMayaFeePercent] = useState('0');
  const [uploadingMayaQr, setUploadingMayaQr] = useState(false);

  const [payConfigPaypalEmail, setPayConfigPaypalEmail] = useState('');
  const [payConfigPaypalEnabled, setPayConfigPaypalEnabled] = useState(true);
  const [payConfigPaypalFeePercent, setPayConfigPaypalFeePercent] = useState('0');

  const [payConfigCryptoEnabled, setPayConfigCryptoEnabled] = useState(true);
  const [payConfigCryptoLtc, setPayConfigCryptoLtc] = useState('');
  const [payConfigCryptoUsdt, setPayConfigCryptoUsdt] = useState('');
  const [payConfigCryptoFeePercent, setPayConfigCryptoFeePercent] = useState('0');

  const [savingPayConfig, setSavingPayConfig] = useState(false);
  const [payConfigSavedSuccess, setPayConfigSavedSuccess] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropModalImgUrl, setCropModalImgUrl] = useState('');
  const [cropModalType, setCropModalType] = useState<'paymongo' | 'gcash' | 'maya'>('paymongo');
  const [auditSubTab, setAuditSubTab] = useState<'claims' | 'downloads' | 'unbans'>('claims');
  const [chatChannel, setChatChannel] = useState<'support' | 'general'>('support');
  const [chatTickets, setChatTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [sendingAdminChat, setSendingAdminChat] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [showGenLicenseModal, setShowGenLicenseModal] = useState(false);
  const [showManualBanModal, setShowManualBanModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Digital Products Management State
  const [productsList, setProductsList] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Product Form Fields
  interface AdminTierOption {
    id: string;
    tierKey: 'daily' | 'weekly' | 'monthly' | 'lifetime';
    name: string;
    pricePHP: string;
    discountPercent: string;
    dailyLimit: string;
  }
  const [prodTierOptions, setProdTierOptions] = useState<AdminTierOption[]>([]);
  const [prodPricingType, setProdPricingType] = useState<'single' | 'tiered'>('tiered');
  const [liveFxRate, setLiveFxRate] = useState<number>(58.5);
  const [prodDiscountPercent, setProdDiscountPercent] = useState<string>('0');
  const [prodDetails, setProdDetails] = useState<string>('');
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
  const [prodServiceScope, setProdServiceScope] = useState<string>('all');
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [prodStockPool, setProdStockPool] = useState('');
  const [prodBadge, setProdBadge] = useState('');
  const [prodIsActive, setProdIsActive] = useState(true);
  const [prodHighlight, setProdHighlight] = useState(false);
  const [prodSpecDeliveryLabel, setProdSpecDeliveryLabel] = useState('');
  const [prodSpecPlatform, setProdSpecPlatform] = useState('Windows 10 / 11');
  const [prodSpecQuotaLabel, setProdSpecQuotaLabel] = useState('');
  const [prodSpecAccessLevel, setProdSpecAccessLevel] = useState('Full Unrestricted');

  // Form Inputs: Manual Ban
  const [banIpAddress, setBanIpAddress] = useState('');
  const [banReason, setBanReason] = useState('');

  // Form Inputs: Generator License
  const [genLicKey, setGenLicKey] = useState('');
  const [genLicUserId, setGenLicUserId] = useState('');
  const [genLicScope, setGenLicScope] = useState('All');
  const [genLicTier, setGenLicTier] = useState<'daily' | 'weekly' | 'monthly' | 'lifetime'>('lifetime');
  const [genLicDailyLimit, setGenLicDailyLimit] = useState('');

  // Dropdown & Edit Limit Modal State
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const [showEditLimitModal, setShowEditLimitModal] = useState(false);
  const [editingLic, setEditingLic] = useState<any>(null);
  const [editLimitValue, setEditLimitValue] = useState('15');
  const [editQuotaMode, setEditQuotaMode] = useState<'isolated' | 'shared'>('isolated');
  const [genViewMode, setGenViewMode] = useState<'users' | 'keys'>('users');

  // Restock Modal State
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockService, setRestockService] = useState('');
  const [restockContent, setRestockContent] = useState('');
  const [restockFileName, setRestockFileName] = useState('');
  const [isRestockDragging, setIsRestockDragging] = useState(false);
  const restockFileInputRef = useRef<HTMLInputElement>(null);

  // Bundle Modal State
  const [showCreateBundleModal, setShowCreateBundleModal] = useState(false);
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [bundleSelectedServices, setBundleSelectedServices] = useState<number[]>([]);

  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Session & Auth Check
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ownerUserId = (user?.app_metadata as Record<string, any> | undefined)?.discord_id || user?.user_metadata?.provider_id || user?.user_metadata?.sub || user?.id;
  const isOwner = Boolean(ownerUserId && (ownerUserId === '719482630633947166' || ownerUserId === process.env.NEXT_PUBLIC_OWNER_USER_ID));

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const adminFetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const authHeaders = await getAuthHeaders();
    const headers = new Headers(init.headers || {});
    for (const [k, v] of Object.entries(authHeaders)) {
      headers.set(k, v);
    }
    return fetch(input, {
      ...init,
      headers,
    });
  };

  const CACHE_TTL_MS = 3600000; // 1 hour fallback TTL

  // 2. Fetch Admin Data
  const fetchAdminData = async (forceRefresh = false) => {
    if (!ownerUserId) return;

    const cacheKey = `async_admin_cache_v5_${ownerUserId}`;

    if (!forceRefresh) {
      try {
        const cachedStr = sessionStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          const hasStockEnriched = cached.data?.services?.some((s: any) => typeof s.stock_count === 'number');
          if (cached.data?.userProfiles && hasStockEnriched && Date.now() - cached.timestamp < 60000) {
            setAdminData(cached.data);
            setDataLoading(false);
            return;
          }
        }
      } catch (e) {}
    }

    setDataLoading(true);
    try {
      const res = await adminFetch(`/api/dashboard-data?userId=${encodeURIComponent(ownerUserId)}&admin=true`);
      if (res.ok) {
        const json = await res.json();
        setAdminData(json);
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: json }));
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user && isOwner) {
      fetchAdminData();
      fetchProducts();
      fetchOrders();
    }
  }, [user, isOwner]);

  // Digital Products Handlers
  const fetchProducts = async (isBackground = false) => {
    try {
      if (!isBackground && productsList.length === 0) {
        setProductsLoading(true);
      }
      const res = await adminFetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) {
          setProductsList(data.products);
        }
        if (data.liveRate) {
          setLiveFxRate(data.liveRate);
        }
        if (Array.isArray(data.services)) {
          setAvailableServices(data.services);
        }
        if (Array.isArray(data.packages)) {
          setAvailablePackages(data.packages);
        }
      }
    } catch (err) {
      console.error('[Admin] Error fetching products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Orders & Transactions Handlers
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await adminFetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          setOrdersList(data.orders);
        }
      }
    } catch (err) {
      console.error('[Admin] Error fetching orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    setProcessingOrderId(orderId);
    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_order', orderId })
      });
      const data = await res.json();
      if (data.ok) {
        fetchOrders();
        fetchAdminData(true);
      } else {
        alert(data.error || 'Failed to approve order');
      }
    } catch (e: any) {
      alert(e?.message || 'Error approving order');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setProcessingOrderId(orderId);
    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_order', orderId })
      });
      const data = await res.json();
      if (data.ok) {
        fetchOrders();
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch (e: any) {
      alert(e?.message || 'Error cancelling order');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt('Enter rejection reason (visible to customer):', 'Reference number invalid or transfer not received.');
    if (reason === null) return;
    setProcessingOrderId(orderId);
    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject_order', orderId, reason })
      });
      const data = await res.json();
      if (data.ok) {
        fetchOrders();
      } else {
        alert(data.error || 'Failed to reject order');
      }
    } catch (e: any) {
      alert(e?.message || 'Error rejecting order');
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Coupons Handlers
  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true);
      const res = await adminFetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.coupons)) {
          setCouponsList(data.coupons);
        }
      }
    } catch (err) {
      console.error('[Admin] Error fetching coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponFormCode.trim() || !couponFormValue) return;
    setSavingCoupon(true);
    setCouponError(null);
    try {
      const res = await adminFetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponFormCode.trim(),
          discountType: couponFormType,
          discountValue: Number(couponFormValue),
          minSpend: Number(couponFormMinSpend) || 0,
          maxUses: couponFormMaxUses ? Number(couponFormMaxUses) : null
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCouponError(data.error || 'Failed to create coupon.');
        return;
      }
      setShowCreateCouponModal(false);
      setCouponFormCode('');
      setCouponFormValue('');
      setCouponFormMinSpend('0');
      setCouponFormMaxUses('');
      fetchCoupons();
    } catch (err: any) {
      setCouponError(err?.message || 'Error creating coupon.');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (id: string, currentActive: boolean) => {
    try {
      const res = await adminFetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive })
      });
      if (res.ok) fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await adminFetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const res = await adminFetch('/api/admin/payment-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setPayConfigPaymongoEnabled(data.settings.paymongoEnabled !== false);
          setPayConfigPaymongoAutomated(data.settings.paymongoAutomated !== false);
          setPayConfigPaymongoSecretKey(data.settings.paymongoSecretKey || '');
          setPayConfigPaymongoWebhookSecret(data.settings.paymongoWebhookSecret || '');
          setPayConfigPaymongoName(data.settings.paymongoName || 'ASYNC DEV');
          setPayConfigPaymongoQrUrl(data.settings.paymongoQrUrl || '');
          setPayConfigPaymongoFeePercent(String(data.settings.paymongoFeePercent ?? 3.5));

          setPayConfigGcashName(data.settings.gcashName || '');
          setPayConfigGcashNumber(data.settings.gcashNumber || '');
          setPayConfigGcashQrUrl(data.settings.gcashQrUrl || '');
          setPayConfigGcashEnabled(data.settings.gcashEnabled !== false);
          setPayConfigGcashFeePercent(String(data.settings.gcashFeePercent ?? 0));

          setPayConfigMayaName(data.settings.mayaName || '');
          setPayConfigMayaNumber(data.settings.mayaNumber || '');
          setPayConfigMayaQrUrl(data.settings.mayaQrUrl || '');
          setPayConfigMayaEnabled(data.settings.mayaEnabled !== false);
          setPayConfigMayaFeePercent(String(data.settings.mayaFeePercent ?? 0));

          setPayConfigPaypalEmail(data.settings.paypalEmail || '');
          setPayConfigPaypalEnabled(data.settings.paypalEnabled !== false);
          setPayConfigPaypalFeePercent(String(data.settings.paypalFeePercent ?? 0));

          setPayConfigCryptoEnabled(data.settings.cryptoEnabled !== false);
          setPayConfigCryptoLtc(data.settings.cryptoLtc || '');
          setPayConfigCryptoUsdt(data.settings.cryptoUsdt || '');
          setPayConfigCryptoFeePercent(String(data.settings.cryptoFeePercent ?? 0));
        }
      }
    } catch (e) {
      console.warn('[Admin] fetchPaymentSettings:', e);
    }
  };

  const handleUploadQr = async (file: File, type: 'paymongo' | 'gcash' | 'maya') => {
    if (type === 'paymongo') setUploadingPaymongoQr(true);
    else if (type === 'gcash') setUploadingGcashQr(true);
    else setUploadingMayaQr(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);

      const res = await adminFetch('/api/admin/payment-settings', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.ok && data.url) {
        if (type === 'paymongo') setPayConfigPaymongoQrUrl(data.url);
        else if (type === 'gcash') setPayConfigGcashQrUrl(data.url);
        else setPayConfigMayaQrUrl(data.url);
      } else {
        alert(data.error || 'Failed to upload QR');
      }
    } catch (e: any) {
      alert(e?.message || 'Error uploading QR');
    } finally {
      if (type === 'paymongo') setUploadingPaymongoQr(false);
      else if (type === 'gcash') setUploadingGcashQr(false);
      else setUploadingMayaQr(false);
    }
  };

  const handleInitiateQrUpload = (file: File, type: 'paymongo' | 'gcash' | 'maya') => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropModalImgUrl(reader.result);
        setCropModalType(type);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedFile: File) => {
    setCropModalOpen(false);
    handleUploadQr(croppedFile, cropModalType);
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPayConfig(true);
    try {
      const res = await adminFetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymongoEnabled: payConfigPaymongoEnabled,
          paymongoAutomated: payConfigPaymongoAutomated,
          paymongoSecretKey: payConfigPaymongoSecretKey,
          paymongoWebhookSecret: payConfigPaymongoWebhookSecret,
          paymongoName: payConfigPaymongoName,
          paymongoQrUrl: payConfigPaymongoQrUrl,
          paymongoFeePercent: payConfigPaymongoFeePercent,

          gcashName: payConfigGcashName,
          gcashNumber: payConfigGcashNumber,
          gcashQrUrl: payConfigGcashQrUrl,
          gcashEnabled: payConfigGcashEnabled,
          gcashFeePercent: payConfigGcashFeePercent,

          mayaName: payConfigMayaName,
          mayaNumber: payConfigMayaNumber,
          mayaQrUrl: payConfigMayaQrUrl,
          mayaEnabled: payConfigMayaEnabled,
          mayaFeePercent: payConfigMayaFeePercent,

          paypalEmail: payConfigPaypalEmail,
          paypalEnabled: payConfigPaypalEnabled,
          paypalFeePercent: payConfigPaypalFeePercent,

          cryptoEnabled: payConfigCryptoEnabled,
          cryptoLtc: payConfigCryptoLtc,
          cryptoUsdt: payConfigCryptoUsdt,
          cryptoFeePercent: payConfigCryptoFeePercent
        })
      });
      const data = await res.json();
      if (data.ok) {
        setPayConfigSavedSuccess(true);
        setTimeout(() => setPayConfigSavedSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch (e: any) {
      alert(e?.message || 'Error saving settings');
    } finally {
      setSavingPayConfig(false);
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
      setProdFeatures(Array.isArray(product.features) ? product.features.join('\n') : '');
      setProdImageUrl(product.imageUrl || '');
      setProdDeliveryMode(product.deliveryMode || 'automated_license');
      setProdLicenseTier(product.licenseTier || '1day');
      setProdDailyLimit(product.dailyLimit ? String(product.dailyLimit) : '15');
      setProdServiceScope(product.serviceScope || 'all');
      setProdStockPool(Array.isArray(product.stockPool) ? product.stockPool.join('\n') : '');
      setProdBadge(product.badge || '');
      setProdIsActive(product.isActive !== undefined ? Boolean(product.isActive) : true);
      setProdHighlight(Boolean(product.highlight));
      setProdSpecDeliveryLabel(product.specDeliveryLabel || product.specs?.deliveryLabel || '');
      setProdSpecPlatform(product.specPlatform || product.specs?.platform || 'Windows 10 / 11');
      setProdSpecQuotaLabel(product.specQuotaLabel || product.specs?.quotaLabel || '');
      setProdSpecAccessLevel(product.specAccessLevel || product.specs?.accessLevel || 'Full Unrestricted');

      setProdDetails(product.details || '');
      setProdDiscountPercent(product.discountPercent !== undefined ? String(product.discountPercent) : '0');

      const isManual = (product.deliveryMode === 'stock_pool');
      const rawTiers = Array.isArray(product.tiers) ? product.tiers : (Array.isArray(product.tierOptions) ? product.tierOptions : []);
      const hasTiers = rawTiers.length > 0 && !isManual;
      setProdPricingType(hasTiers ? 'tiered' : 'single');

      if (rawTiers.length > 0) {
        setProdTierOptions(
          rawTiers.map((t: any, idx: number) => ({
            id: t.id || `tier_${Date.now()}_${idx}`,
            tierKey: (t.tier_key || t.tierKey || 'daily') as any,
            name: t.name || (t.tierKey === 'daily' ? '1 Day' : t.tierKey === 'weekly' ? '7 Days' : t.tierKey === 'monthly' ? '30 Days' : 'Lifetime'),
            pricePHP: String(t.price_php ?? t.pricePHP ?? '50'),
            discountPercent: String(t.discount_percent ?? t.discountPercent ?? '0'),
            dailyLimit: String(t.daily_limit ?? t.dailyLimit ?? '15')
          }))
        );
      } else {
        setProdTierOptions([]);
      }
    } else {
      setEditingProduct(null);
      setProdTitle('');
      setProdCategory('Digital Goods');
      setProdPriceUSD('');
      setProdPricePHP('50.00');
      setProdOrigUSD('');
      setProdOrigPHP('');
      setProdDiscountPercent('0');
      setProdDescription('');
      setProdDetails('');
      setProdFeatures('Instant digital delivery\n100% Replacement warranty');
      setProdImageUrl('');
      setProdDeliveryMode('automated_license');
      setProdPricingType('tiered');
      setProdLicenseTier('1day');
      setProdDailyLimit('15');
      setProdServiceScope('all');
      setProdStockPool('');
      setProdBadge('');
      setProdIsActive(true);
      setProdHighlight(false);
      setProdSpecDeliveryLabel('');
      setProdSpecPlatform('Windows 10 / 11');
      setProdSpecQuotaLabel('');
      setProdSpecAccessLevel('Full Unrestricted');
      setProdTierOptions([
        { id: 'opt_daily', tierKey: 'daily', name: '1 Day', pricePHP: '50.00', discountPercent: '0', dailyLimit: '15' },
        { id: 'opt_weekly', tierKey: 'weekly', name: '7 Days', pricePHP: '250.00', discountPercent: '0', dailyLimit: '15' },
        { id: 'opt_monthly', tierKey: 'monthly', name: '30 Days', pricePHP: '750.00', discountPercent: '0', dailyLimit: '15' },
        { id: 'opt_lifetime', tierKey: 'lifetime', name: 'Lifetime', pricePHP: '1500.00', discountPercent: '0', dailyLimit: '25' }
      ]);
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

      const res = await adminFetch('/api/admin/products/upload-image', {
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
      const isSinglePricing = prodPricingType === 'single' || prodDeliveryMode === 'stock_pool';

      const cleanTierOptions = isSinglePricing
        ? []
        : prodTierOptions.map((t) => {
            const key = t.tierKey;
            const defaultName = key === 'daily' ? '1 Day' : key === 'weekly' ? '7 Days' : key === 'monthly' ? '30 Days' : 'Lifetime';
            return {
              id: t.id,
              tier_key: key,
              name: t.name.trim() || defaultName,
              price_php: parseFloat(t.pricePHP) || 0,
              discount_percent: Math.min(100, Math.max(0, parseFloat(t.discountPercent) || 0)),
              daily_limit: parseInt(t.dailyLimit, 10) || 15
            };
          });

      const effectivePricePHP = isSinglePricing
        ? (parseFloat(prodPricePHP) || 0)
        : (cleanTierOptions[0]?.price_php || parseFloat(prodPricePHP) || 0);

      const payload = {
        id: editingProduct?.id,
        title: prodTitle.trim(),
        category: prodCategory.trim() || 'General',
        price_php: effectivePricePHP,
        discount_percent: parseFloat(prodDiscountPercent) || 0,
        description: prodDescription.trim(),
        details: prodDetails.trim(),
        features: prodFeatures.split('\n').map((s) => s.trim()).filter(Boolean),
        imageUrl: prodImageUrl.trim(),
        deliveryMode: prodDeliveryMode,
        licenseTier: prodLicenseTier,
        dailyLimit: parseInt(prodDailyLimit, 10) || 15,
        serviceScope: prodServiceScope,
        tiers: cleanTierOptions,
        tierOptions: cleanTierOptions,
        stockPool: prodStockPool.split('\n').map((s) => s.trim()).filter(Boolean),
        badge: prodBadge.trim(),
        isActive: prodIsActive,
        highlight: prodHighlight,
        specDeliveryLabel: prodSpecDeliveryLabel.trim(),
        specPlatform: prodSpecPlatform.trim() || 'Windows 10 / 11',
        specQuotaLabel: prodSpecQuotaLabel.trim(),
        specAccessLevel: prodSpecAccessLevel.trim() || 'Full Unrestricted',
      };

      const res = await adminFetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_product',
          ownerUserId: ownerUserId || '',
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
      const res = await adminFetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          ownerUserId: ownerUserId || '',
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
    if (!window.confirm(`Delete product "${title}"? This cannot be undone.`)) return;

    try {
      const res = await adminFetch(
        `/api/admin/products?id=${encodeURIComponent(productId)}`,
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
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (activeDropdownId !== null && !(e.target as HTMLElement).closest('.action-dropdown-container')) {
        setActiveDropdownId(null);
        setDropdownPos(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [activeDropdownId]);

  // ── HANDLERS ──

  const handleUnbanLockout = async (lockoutId: number, ipAddress: string) => {
    if (!confirm(`Unban IP / Device ${ipAddress}? This will restore access immediately.`)) return;
    setActionMessage('');
    setActionError('');

    try {
      const res = await adminFetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unban_security_lockout',
          ownerUserId,
          lockoutId,
          ipAddress,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to lift lockout');

      setActionMessage(json.message);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleManualBanIP = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage('');
    setActionError('');
    setSubmitting(true);

    try {
      const res = await adminFetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ban_security_ip',
          ownerUserId,
          ipAddress: banIpAddress.trim(),
          reason: banReason.trim() || 'Manual Admin Overriding Ban',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to ban IP');

      setActionMessage(json.message);
      setShowManualBanModal(false);
      setBanIpAddress('');
      setBanReason('');
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateGenLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage('');
    setActionError('');
    setSubmitting(true);

    try {
      const res = await adminFetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_generator_license',
          ownerUserId,
          targetUserId: genLicUserId.trim() || null,
          scope: genLicScope,
          tier: genLicTier,
          dailyLimit: genLicTier === 'lifetime' ? (genLicDailyLimit || null) : undefined,
          licenseKey: genLicKey.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate key');

      setActionMessage(`Generator License Created: ${json.license?.license_key}`);
      setShowGenLicenseModal(false);
      setGenLicUserId('');
      setGenLicKey('');
      setGenLicScope('All');
      setGenLicTier('lifetime');
      setGenLicDailyLimit('');
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleGenLicense = async (licenseId: number, currentActive: boolean) => {
    setActionMessage('');
    setActionError('');

    try {
      const res = await adminFetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_generator_license',
          ownerUserId,
          licenseId,
          currentActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to toggle license');

      setActionMessage(json.message);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleEditGenLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLic) return;
    setActionMessage('');
    setActionError('');
    setSubmitting(true);

    try {
      const res = await adminFetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_generator_license',
          ownerUserId,
          licenseId: editingLic.id,
          dailyLimit: editLimitValue,
          quotaMode: editQuotaMode,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update daily limit');

      setActionMessage(json.message);
      setShowEditLimitModal(false);
      setEditingLic(null);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetGenUsage = async (lic: any) => {
    if (!confirm(`Reset daily generation count for license key ${lic.license_key}?`)) return;
    setActionMessage('');
    setActionError('');

    try {
      const res = await adminFetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_generator_usage',
          ownerUserId,
          licenseId: lic.id,
          targetUserId: lic.redeemed_by || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to reset usage');

      setActionMessage(json.message);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleResetGenHwid = async (lic: any) => {
    const hwidInfo = lic.hwid ? `\n\nBound HWID: ${lic.hwid}` : '\n\n(Currently UNBOUND)';
    if (!confirm(`Reset and unbind HWID for license key ${lic.license_key}?${hwidInfo}\n\nThis will allow the user to bind a new hardware device on their next client launch.`)) return;
    setActionMessage('');
    setActionError('');

    try {
      const res = await adminFetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_generator_hwid',
          ownerUserId,
          licenseId: lic.id,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to reset HWID');

      setActionMessage(json.message);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleDeleteGenLicense = async (lic: any) => {
    if (!confirm(`PERMANENTLY DELETE license key ${lic.license_key}? This cannot be undone.`)) return;
    setActionMessage('');
    setActionError('');

    try {
      const res = await adminFetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_generator_license',
          ownerUserId,
          licenseId: lic.id,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete license');

      setActionMessage(json.message);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleName.trim()) {
      setActionError('Bundle name is required');
      return;
    }
    if (bundleSelectedServices.length === 0) {
      setActionError('Select at least one service to include in the bundle');
      return;
    }

    setActionMessage('');
    setActionError('');
    setSubmitting(true);

    try {
      const res = await adminFetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_package',
          ownerUserId,
          name: bundleName.trim(),
          description: bundleDescription.trim(),
          serviceIds: bundleSelectedServices,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create bundle');

      setActionMessage(json.message);
      setShowCreateBundleModal(false);
      setBundleName('');
      setBundleDescription('');
      setBundleSelectedServices([]);
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockService || !restockContent.trim()) return;

    setActionMessage('');
    setActionError('');
    setSubmitting(true);

    const lines = restockContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    try {
      const res = await adminFetch('/api/admin/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUserId,
          serviceName: restockService,
          lines,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to restock service stock');

      setActionMessage(json.message);
      setShowRestockModal(false);
      setRestockService('');
      setRestockContent('');
      setRestockFileName('');
      fetchAdminData(true);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const processRestockFiles = async (files: File[]) => {
    const txtFiles = files.filter((f) => f.name.toLowerCase().endsWith('.txt') || f.type === 'text/plain' || f.type === '');
    if (txtFiles.length === 0) return;

    try {
      const fileContents = await Promise.all(
        txtFiles.map(async (file) => {
          return await file.text();
        })
      );

      const combinedText = fileContents
        .join('\n')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .join('\n');

      setRestockContent((prev) => {
        const existingLines = prev
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        const newLines = combinedText.split('\n');
        const combinedUnique = Array.from(new Set([...existingLines, ...newLines]));
        return combinedUnique.join('\n');
      });

      const totalLines = combinedText.split('\n').filter(Boolean).length;
      if (txtFiles.length === 1) {
        setRestockFileName(`${txtFiles[0].name} (${totalLines} accounts loaded)`);
      } else {
        const names = txtFiles.map((f) => f.name).join(', ');
        setRestockFileName(`${txtFiles.length} files (${totalLines} total accounts): ${names}`);
      }
    } catch (err) {
      console.error('Error reading restock files:', err);
    }
  };

  const handleRestockFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    processRestockFiles(files);
  };

  // ── ADMIN CHAT & SUPPORT FUNCTIONS ──
  const fetchSupportTickets = async () => {
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat?channel=support&limit=100');
      if (res.ok) {
        const json = await res.json();
        const allMsgs: any[] = json.messages || [];

        const map = new Map<string, any>();
        allMsgs.forEach((m) => {
          const tid = m.ticket_id || m.sender_id;
          if (!map.has(tid)) {
            map.set(tid, {
              ticket_id: tid,
              sender_id: m.sender_id,
              sender_name: m.sender_name,
              sender_avatar: m.sender_avatar,
              last_message: m.content,
              last_time: m.created_at,
              unread_count: !m.is_admin ? 1 : 0,
            });
          } else {
            const existing = map.get(tid);
            existing.last_message = m.content;
            existing.last_time = m.created_at;
            if (!m.is_admin) existing.unread_count += 1;
          }
        });

        const ticketList = Array.from(map.values()).sort(
          (a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime()
        );
        setChatTickets(ticketList);

        if (!selectedTicketId && ticketList.length > 0) {
          setSelectedTicketId(ticketList[0].ticket_id);
        }
      }
    } catch (e) {
      console.error('[Admin Chat Error]:', e);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/chat?channel=support&ticketId=${encodeURIComponent(ticketId)}&limit=100`);
      if (res.ok) {
        const json = await res.json();
        setTicketMessages(json.messages || []);
      }
    } catch (e) {
      console.error('[Admin Ticket Messages Error]:', e);
    }
  };

  const fetchGeneralMessages = async () => {
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat?channel=general&limit=80');
      if (res.ok) {
        const json = await res.json();
        setTicketMessages(json.messages || []);
      }
    } catch (e) {
      console.error('[Admin General Chat Error]:', e);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      if (chatChannel === 'support') {
        fetchSupportTickets();
      } else {
        fetchGeneralMessages();
      }
    }
  }, [activeTab, chatChannel]);

  useEffect(() => {
    if (activeTab === 'chat' && chatChannel === 'support' && selectedTicketId) {
      fetchTicketMessages(selectedTicketId);
    }
  }, [activeTab, chatChannel, selectedTicketId]);

  useEffect(() => {
    if (activeTab !== 'chat') return;

    const channelSub = supabase
      .channel(`admin_chat_sub_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as any;
          if (chatChannel === 'general' && newMsg.channel === 'general') {
            setTicketMessages((prev) => [...prev, newMsg]);
          } else if (chatChannel === 'support' && newMsg.channel === 'support') {
            const tid = newMsg.ticket_id || newMsg.sender_id;
            if (tid === selectedTicketId) {
              setTicketMessages((prev) => [...prev, newMsg]);
            }
            setChatTickets((prev) => {
              const idx = prev.findIndex((t) => t.ticket_id === tid);
              if (idx !== -1) {
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  last_message: newMsg.content,
                  last_time: newMsg.created_at,
                };
                return updated.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
              }
              return [
                {
                  ticket_id: tid,
                  sender_id: newMsg.sender_id,
                  sender_name: newMsg.sender_name,
                  sender_avatar: newMsg.sender_avatar,
                  last_message: newMsg.content,
                  last_time: newMsg.created_at,
                  unread_count: 1,
                },
                ...prev,
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [activeTab, chatChannel, selectedTicketId]);

  const handleSendAdminMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminChatInput.trim() || sendingAdminChat) return;

    const content = adminChatInput.trim();
    setAdminChatInput('');
    setSendingAdminChat(true);

    const tempId = Date.now();
    const optimisticMsg: any = {
      id: tempId,
      channel: chatChannel,
      ticket_id: chatChannel === 'support' ? selectedTicketId : null,
      sender_id: ownerUserId || '',
      sender_name: 'Mark (Admin)',
      sender_avatar: user?.user_metadata?.avatar_url || null,
      content,
      is_admin: true,
      created_at: new Date().toISOString(),
    };

    setTicketMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: chatChannel,
          ticketId: chatChannel === 'support' ? selectedTicketId : null,
          senderId: ownerUserId || '',
          senderName: 'Mark (Admin)',
          senderAvatar: user?.user_metadata?.avatar_url || null,
          content,
          isAdmin: true,
        }),
      });

      if (!res.ok) {
        setTicketMessages((prev) => prev.filter((m) => m.id !== tempId));
        const err = await res.json();
        setActionError(err.error || 'Failed to dispatch chat reply');
      } else {
        const json = await res.json();
        if (json.message) {
          setTicketMessages((prev) =>
            prev.map((m) => (m.id === tempId ? json.message : m))
          );
        }
      }
    } catch (err: any) {
      setActionError(err.message || 'Error sending chat reply');
    } finally {
      setSendingAdminChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-xl">
          <Sparkles className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
        <p className="text-xs font-mono text-zinc-400 tracking-widest uppercase">Initializing Admin Console...</p>
      </div>
    );
  }

  // Security Gate: Non-owner access blocked
  if (!user || !isOwner) {
    const handleAdminDiscordLogin = () => {
      window.location.href = '/api/auth/discord/login';
    };

    return (
      <div className="min-h-screen bg-black text-zinc-100 relative overflow-hidden font-sans selection:bg-purple-600 selection:text-white dev-grid-bg flex flex-col justify-between">
        <Navbar />

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex-1 flex flex-col justify-center">
          <div className="py-4 sm:py-8 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Operations Showcase */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                {/* Status Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-mono mb-5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="tracking-wider uppercase">ASYNC CORE OPERATIONS // RESTRICTED ACCESS</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white font-sans leading-[1.15]">
                  System Operations & <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-400">
                    Control Infrastructure.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="max-w-xl text-zinc-400 text-sm sm:text-base mb-2 leading-relaxed font-normal">
                  Centralized administrative console for real-time security enforcement, generator license provisioning, stock tracking, and user audit telemetry.
                </p>

                {/* Core Administrative Capabilities */}
                <div className="mt-8 pt-6 border-t border-zinc-800/80">
                  <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    Subsystem Modules & Control Surfaces
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 text-rose-400">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-200">Security & Lockouts</div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate">Firewall enforcement & IP bans</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-400">
                        <Key className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-200">Generator Licenses</div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate">Key provisioning & daily limits</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-200">Stock & Inventory</div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate">Multi-service import & pools</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-200">Audit Telemetry</div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate">Claims & download records</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return Link to Storefront */}
                <a
                  href="https://asyncdevph.xyz"
                  className="mt-6 flex items-center justify-between gap-4 p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-900/50 transition-all duration-200 group shadow-lg shadow-purple-950/10 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-purple-400 group-hover:border-purple-500/40 transition-colors shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                        <span>Looking for customer storefront? Visit asyncdevph.xyz</span>
                        <span className="text-purple-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        Return to public product marketplace and digital goods
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </a>

                {/* Left Showcase Footer */}
                <div className="mt-8 text-xs text-zinc-600 font-mono">
                  &copy; 2026 ASYNC DEVELOPMENT. All rights reserved.
                </div>
              </div>

              {/* Right Column: Sleek Owner Auth Gateway */}
              <div className="lg:col-span-5">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/15 via-zinc-900/10 to-transparent rounded-3xl blur-2xl opacity-75" />

                  <div className="relative bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-purple-950/10 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-purple-400">
                        <Crown className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Owner Gateway
                      </div>
                    </div>

                    <h2 className="text-xl font-bold tracking-tight text-white mb-2">
                      Sign in to your account
                    </h2>
                    <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                      Authenticate with an authorized Discord Owner account to access core operations and generator administration.
                    </p>

                    {!user ? (
                      /* Continue with Discord Button */
                      <button
                        onClick={handleAdminDiscordLogin}
                        className="w-full py-3 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-150 shadow-[0_0_20px_rgba(88,101,242,0.35)] hover:shadow-[0_0_25px_rgba(88,101,242,0.5)] active:scale-[0.99] cursor-pointer"
                      >
                        <DiscordIcon className="w-5 h-5 fill-current" />
                        <span>Continue with Discord</span>
                      </button>
                    ) : (
                      /* Unauthorized Session Display + Switch Account */
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-left">
                          <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold mb-1">
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                            <span>Unauthorized Discord Account</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            Connected as <span className="font-mono text-zinc-200">{ownerUserId}</span>. This account does not have Owner privileges.
                          </p>
                        </div>

                        <button
                          onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.href = '/api/auth/discord/login';
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Switch to Owner Account</span>
                        </button>
                      </div>
                    )}

                    {/* Security Notice */}
                    <div className="mt-6 pt-5 border-t border-zinc-800/80 space-y-2.5">
                      <div className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed">
                        <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span>Secured session</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 leading-relaxed font-mono">
                        Access is strictly restricted to designated Owner Discord IDs. All unauthorized attempts are logged.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const securityLockouts = adminData?.securityLockouts || [];
  const generatorLicenses = adminData?.generatorLicenses || [];
  const services = adminData?.services || [];
  const packages = adminData?.packages || [];
  const claimLogs = adminData?.claimLogs || [];
  const downloadLogs = adminData?.downloadLogs || [];
  const userProfiles = adminData?.userProfiles || {};

  const matchDiscordUser = (id: string | null | undefined, query: string) => {
    if (!query) return true;
    const rawId = (id || '').toLowerCase();
    if (rawId.includes(query)) return true;
    const profile = userProfiles[id || ''];
    if (profile) {
      if ((profile.name || '').toLowerCase().includes(query)) return true;
      if ((profile.username || '').toLowerCase().includes(query)) return true;
    }
    return false;
  };

  const filteredLockouts = securityLockouts.filter((l: any) =>
    (l.ip_address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    matchDiscordUser(l.discord_user_id, searchQuery.toLowerCase())
  );

  const filteredGenLicenses = generatorLicenses.filter((lic: any) =>
    (lic.license_key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    matchDiscordUser(lic.redeemed_by, searchQuery.toLowerCase()) ||
    (lic.hwid || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lic.scope_label || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group generator licenses by user account
  const genUserGroupsMap = new Map<string, {
    userId: string;
    licenses: any[];
    totalLimit: number;
    totalUsed: number;
    hasActive: boolean;
    hwid: string | null;
  }>();

  for (const lic of filteredGenLicenses) {
    if (!lic.redeemed_by) continue;
    const uId = String(lic.redeemed_by);
    if (!genUserGroupsMap.has(uId)) {
      genUserGroupsMap.set(uId, {
        userId: uId,
        licenses: [],
        totalLimit: 0,
        totalUsed: 0,
        hasActive: false,
        hwid: null,
      });
    }
    const group = genUserGroupsMap.get(uId)!;
    group.licenses.push(lic);
    group.totalLimit += Number(lic.effective_limit ?? lic.daily_limit ?? 15);
    group.totalUsed += Number(lic.used_today || 0);
    if (lic.is_active) group.hasActive = true;
    if (lic.hwid && !group.hwid) group.hwid = lic.hwid;
  }

  const groupedGenUserList = Array.from(genUserGroupsMap.values());
  const unredeemedGenLicenses = filteredGenLicenses.filter((l: any) => !l.redeemed_by);

  const filteredClaimLogs = claimLogs.filter((c: any) =>
    (c.service_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    matchDiscordUser(c.discord_user_id, searchQuery.toLowerCase()) ||
    (c.raw_data || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.source || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDownloadLogs = downloadLogs.filter((d: any) =>
    matchDiscordUser(d.discord_user_id, searchQuery.toLowerCase()) ||
    (d.license_key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.ip_address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.user_agent || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeBannedLockoutsCount = securityLockouts.filter((l: any) => l.is_banned).length;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-purple-900/40 selection:text-white">
      <Navbar />

      {/* Main Wide Canvas: Generous breathing room without clutter */}
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-28 pb-24">

        {/* ── TOP HEADER BAR ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  System Administration
                </h1>
                <span className="text-[11px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 tracking-wider">
                  Owner
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Centralized operations, security enforcement, generator licenses & support desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <a
              href="https://asyncdevph.xyz/dashboard"
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </a>

            <button
              onClick={() => {
                fetchAdminData(true);
                fetchProducts();
                fetchOrders();
              }}
              disabled={dataLoading}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
              title="Refresh all metrics"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin text-purple-400' : 'text-zinc-400'}`} />
              <span>Sync Data</span>
            </button>
          </div>
        </div>

        {/* ── NOTIFICATIONS ── */}
        {actionMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-medium">{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage('')} className="text-emerald-400 hover:text-white text-xs">Dismiss</button>
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="font-medium">{actionError}</span>
            </div>
            <button onClick={() => setActionError('')} className="text-rose-400 hover:text-white text-xs">Dismiss</button>
          </div>
        )}

        {/* ── 2-COLUMN LAYOUT: LEFT SIDEBAR NAVIGATION + RIGHT CONTENT WORKSPACE ── */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* ── LEFT SIDEBAR NAVIGATION ── */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0 lg:sticky lg:top-28 space-y-4">
            <div className="p-3 rounded-3xl bg-zinc-900/90 border border-zinc-800/80 backdrop-blur-xl shadow-xl space-y-1.5">
              <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                Admin Console
              </div>

              {/* Navigation Items */}
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/70'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'security' ? 'bg-rose-500/20 text-rose-300' : 'bg-zinc-800/60 text-rose-400 group-hover:bg-zinc-800'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span>Security & Bans</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  activeTab === 'security'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                }`}>
                  {activeBannedLockoutsCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('generator');
                  fetchAdminData(true);
                }}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer ${
                  activeTab === 'generator'
                    ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/70'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'generator' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800/60 text-amber-400 group-hover:bg-zinc-800'
                  }`}>
                    <Key className="w-4 h-4" />
                  </div>
                  <span>Generator & Stock</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  activeTab === 'generator'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                }`}>
                  {generatorLicenses.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('products');
                  fetchProducts(true);
                }}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/70'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'products' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800/60 text-emerald-400 group-hover:bg-zinc-800'
                  }`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <span>Digital Products</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  activeTab === 'products'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                }`}>
                  {productsList.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('orders');
                  fetchOrders();
                  fetchPaymentSettings();
                }}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/70'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'orders' ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-800/60 text-purple-400 group-hover:bg-zinc-800'
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span>Orders & Payments</span>
                </div>
                {ordersList.filter((o) => o.status === 'pending').length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
                    {ordersList.filter((o) => o.status === 'pending').length}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                    {ordersList.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('payments');
                  fetchPaymentSettings();
                }}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer ${
                  activeTab === 'payments'
                    ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/70'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'payments' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800/60 text-amber-400 group-hover:bg-zinc-800'
                  }`}>
                    <Sliders className="w-4 h-4" />
                  </div>
                  <span>Payment Gateways</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  5 Rails
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('coupons');
                  fetchCoupons();
                }}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer ${
                  activeTab === 'coupons'
                    ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/70'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'coupons' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800/60 text-emerald-400 group-hover:bg-zinc-800'
                  }`}>
                    <Tag className="w-4 h-4" />
                  </div>
                  <span>Coupons & Promos</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  {couponsList.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/70'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'audit' ? 'bg-blue-500/20 text-blue-300' : 'bg-zinc-800/60 text-blue-400 group-hover:bg-zinc-800'
                  }`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <span>Audit Trail</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  activeTab === 'audit'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                }`}>
                  {claimLogs.length + downloadLogs.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/70'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'chat' ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-800/60 text-purple-400 group-hover:bg-zinc-800'
                  }`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span>Live Support</span>
                </div>
              </button>
            </div>

            {/* Quick System Badge in Sidebar */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Infrastructure</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 truncate">
                Supabase & Edge Runtime
              </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT WORKSPACE ── */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            {/* Top Search & Contextual Quick Actions (Hidden in Live Support) */}
            {activeTab !== 'chat' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search User ID, IP, Key, Service..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono transition-colors"
                  />
                </div>

                {activeTab === 'security' && (
                  <button
                    onClick={() => setShowManualBanModal(true)}
                    className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Ban IP</span>
                  </button>
                )}

                {activeTab === 'generator' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCreateBundleModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-purple-400" />
                      <span>Create Bundle</span>
                    </button>

                    <button
                      onClick={() => setShowGenLicenseModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Generate Key</span>
                    </button>
                  </div>
                )}

                {activeTab === 'products' && (
                  <button
                    onClick={() => handleOpenProductModal()}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                )}
              </div>
            )}

        {/* ── TAB 1: SECURITY & LOCKOUTS ── */}
        {activeTab === 'security' && (
          <section className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-mono text-xs text-rose-300 font-semibold">
                <Terminal className="w-4 h-4 text-rose-400" />
                <span>SECURITY ENFORCEMENT & IP LOCKOUTS ({filteredLockouts.length})</span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Edge Middleware Enforced</span>
            </div>

            <div className="overflow-x-auto min-h-[540px] max-h-[540px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-zinc-950 shadow-sm">
                  <tr className="border-b border-zinc-800/80 bg-zinc-950 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Visitor IP Address</th>
                    <th className="py-4 px-6">Account / Device</th>
                    <th className="py-4 px-6">Violation Reason</th>
                    <th className="py-4 px-6">Date Detected</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-mono">
                  {dataLoading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-rose-400" />
                        <span>Loading security lockout records...</span>
                      </td>
                    </tr>
                  ) : filteredLockouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-500 font-sans">
                        No active security lockouts found.
                      </td>
                    </tr>
                  ) : (
                    filteredLockouts.map((lockout: any) => {
                      const isBanned = lockout.is_banned;
                      const targetId = lockout.discord_user_id || 'Guest / Unauthenticated';

                      return (
                        <tr key={lockout.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-4 px-6 font-mono font-semibold text-rose-400 select-all">
                            {lockout.ip_address}
                          </td>
                          <td className="py-4 px-6 font-mono text-zinc-300">
                            {targetId.startsWith('dev_') ? (
                              <span className="text-purple-300">{targetId} (Device)</span>
                            ) : targetId.length > 5 ? (
                              <DiscordUserBadge userId={lockout.discord_user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                            ) : (
                              <span className="text-zinc-500">Guest / Unauthenticated</span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-medium text-zinc-200 font-sans">
                            {lockout.reason}
                          </td>
                          <td className="py-4 px-6 font-mono text-zinc-400 text-xs">
                            {new Date(lockout.created_at || Date.now()).toLocaleString()}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-mono font-medium whitespace-nowrap ${
                                isBanned
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {isBanned ? 'LOCKED' : 'RESTORED'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {isBanned ? (
                              <button
                                onClick={() => handleUnbanLockout(lockout.id, lockout.ip_address)}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-medium text-xs flex items-center gap-1.5 ml-auto transition-colors"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Unban IP</span>
                              </button>
                            ) : (
                              <span className="text-emerald-400 font-mono text-xs">Access Active</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── TAB 2: GENERATOR & STOCK ── */}
        {activeTab === 'generator' && (
          <div className="space-y-8">
            {/* Service Stock Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Service Inventory & Stock Levels</span>
                </h3>
                <button
                  onClick={() => fetchAdminData(true)}
                  disabled={dataLoading}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${dataLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Stock</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((svc: any) => {
                  const stockNum = svc.stock_count ?? 0;
                  const inStock = stockNum > 0;
                  return (
                    <div key={svc.id} className="bg-zinc-900/60 rounded-3xl p-5 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-white text-base tracking-wide flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                            {svc.name}
                          </span>
                        </div>

                        <div className="my-4 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Current Stock</div>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className={`text-2xl font-black font-mono tracking-tight ${inStock ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {stockNum.toLocaleString()}
                              </span>
                              <span className="text-[11px] text-zinc-500 font-medium font-mono">accounts</span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border ${
                            inStock 
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}>
                            {inStock ? 'AVAILABLE' : 'OUT OF STOCK'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                        <span className="text-xs text-zinc-500 font-mono">Stock Module</span>
                        <button
                          onClick={() => {
                            setRestockService(svc.name);
                            setShowRestockModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-200 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-purple-400" />
                          <span>Restock</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Packages / Bundles */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-400" />
                  <span>Configured Packages & Bundles ({packages.length})</span>
                </h3>
                <button
                  onClick={() => setShowCreateBundleModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Create a Bundle</span>
                </button>
              </div>

              {packages.length === 0 ? (
                <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/60 text-center">
                  <Package className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 mb-3">No bundled service packages created yet.</p>
                  <button
                    onClick={() => setShowCreateBundleModal(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create Your First Bundle</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.map((pkg: any) => (
                    <div key={pkg.id} className="bg-zinc-900/60 rounded-3xl p-5 border border-zinc-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-base tracking-wide flex items-center gap-2">
                          <Package className="w-4 h-4 text-purple-400" />
                          <span>{pkg.name}</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-[10px]">
                          BUNDLE
                        </span>
                      </div>

                      {pkg.description && (
                        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">{pkg.description}</p>
                      )}

                      <div className="pt-3 border-t border-zinc-800/80">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-2">Included Services:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {pkg.services?.map((sName: string, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-mono text-[11px]">
                              {sName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generator Access & User Management Table */}
            <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 font-mono text-xs text-amber-300 font-semibold">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>
                    {genViewMode === 'users'
                      ? `ACTIVE SUBSCRIBER ACCOUNTS (${groupedGenUserList.length})`
                      : `ALL RAW GENERATOR KEYS (${filteredGenLicenses.length})`}
                  </span>
                </div>

                {/* View Switcher Pills */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800/80 self-start sm:self-center font-mono text-xs">
                  <button
                    onClick={() => setGenViewMode('users')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      genViewMode === 'users'
                        ? 'bg-purple-600 text-white font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Active Users ({groupedGenUserList.length})
                  </button>
                  <button
                    onClick={() => setGenViewMode('keys')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      genViewMode === 'keys'
                        ? 'bg-zinc-800 text-white font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Raw Keys ({filteredGenLicenses.length})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto min-h-[540px] max-h-[540px] overflow-y-auto custom-scrollbar relative">
                {genViewMode === 'users' ? (
                  /* ── USER-CENTRIC FORMAT ── */
                  <table className="w-full min-w-[1000px] text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/80 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                        <th className="py-4 px-6 min-w-[200px]">User / Owner</th>
                        <th className="py-4 px-6 min-w-[320px]">Active Scopes (Hover for License)</th>
                        <th className="py-4 px-6">Daily Quota</th>
                        <th className="py-4 px-6">Hardware ID</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 font-mono">
                      {groupedGenUserList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-zinc-500 font-sans">
                            No active subscriber users found matching search.
                          </td>
                        </tr>
                      ) : (
                        groupedGenUserList.map((group: any, groupIdx: number) => {
                          const pct = group.totalLimit > 0 ? Math.min(100, Math.round((group.totalUsed / group.totalLimit) * 100)) : 0;
                          const primaryLic = group.licenses[0];
                          const isNearBottom = groupedGenUserList.length >= 4 && groupIdx >= groupedGenUserList.length - 2;

                          return (
                            <tr key={group.userId} className="hover:bg-zinc-800/30 transition-colors hover:z-30 relative">
                              {/* 1. User Badge */}
                              <td className="py-4 px-6 whitespace-nowrap min-w-[200px]">
                                <DiscordUserBadge
                                  userId={group.userId}
                                  userProfiles={userProfiles}
                                  onCopy={copyToClipboard}
                                  copiedKey={copiedKey}
                                />
                              </td>

                              {/* 2. Active Scope Pills (Hover reveals License Card) */}
                              <td className="py-4 px-6">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {group.licenses.map((lic: any) => {
                                    const scopeLabel = lic.scope_label || 'All Services';
                                    const isPkg = scopeLabel.startsWith('[Package]');
                                    const isAll = scopeLabel === 'All Services';

                                    return (
                                      <div key={lic.id} className="relative group/scope inline-block hover:z-50">
                                        <div
                                          className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all border ${
                                            isPkg
                                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:border-purple-400'
                                              : isAll
                                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-400'
                                              : 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:border-blue-400'
                                          }`}
                                        >
                                          <span>{scopeLabel.replace('[Package] ', '')}</span>
                                          <span className="text-[10px] opacity-75 font-normal uppercase">
                                            ({lic.tier || 'lifetime'})
                                          </span>
                                        </div>

                                        {/* Hover Tooltip Card */}
                                        <div
                                          className={`absolute left-0 hidden group-hover/scope:flex flex-col z-50 w-72 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-700 shadow-2xl text-xs font-mono text-zinc-300 animate-in fade-in zoom-in-95 pointer-events-auto ${
                                            isNearBottom
                                              ? 'bottom-full mb-2 after:absolute after:-bottom-3 after:left-0 after:w-full after:h-3 after:content-[\'\']'
                                              : 'top-full mt-2 before:absolute before:-top-3 before:left-0 before:w-full before:h-3 before:content-[\'\']'
                                          }`}
                                        >

                                          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">License Key</span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase">
                                              {lic.quota_mode || 'shared'} pool
                                            </span>
                                          </div>

                                          <div className="flex items-center justify-between py-2 font-bold text-white select-all">
                                            <span className="text-xs truncate">{lic.license_key}</span>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                copyToClipboard(lic.license_key);
                                              }}
                                              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 ml-2 transition-colors cursor-pointer"
                                              title="Copy License Key"
                                            >
                                              {copiedKey === lic.license_key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                          </div>

                                          <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 text-[11px] text-zinc-400">
                                            <div className="flex justify-between">
                                              <span>Daily Cap:</span>
                                              <span className="text-white font-semibold">{lic.used_today || 0} / {lic.effective_limit ?? lic.daily_limit ?? 15} used</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Expires:</span>
                                              <span className="text-zinc-200">
                                                {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Lifetime'}
                                              </span>
                                            </div>
                                            {lic.hwid && (
                                              <div className="flex justify-between items-center pt-1 text-[10px]">
                                                <span className="text-zinc-500">HWID:</span>
                                                <span className="truncate max-w-[140px] text-purple-300 font-mono">{lic.hwid}</span>
                                              </div>
                                            )}
                                          </div>

                                          {/* Quick Actions inside Hover Card */}
                                          <div className="pt-2 mt-2 border-t border-zinc-800/80 flex items-center justify-end gap-1.5">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingLic(lic);
                                                setEditLimitValue(String(lic.effective_limit ?? lic.daily_limit ?? 15));
                                                setEditQuotaMode((lic.quota_mode || 'shared') as 'isolated' | 'shared');
                                                setShowEditLimitModal(true);
                                              }}
                                              className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
                                            >
                                              <Edit3 className="w-3 h-3 text-purple-400" />
                                              <span>Edit</span>
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleResetGenUsage(lic);
                                              }}
                                              className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
                                            >
                                              <RotateCcw className="w-3 h-3 text-amber-400" />
                                              <span>Reset</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>

                              {/* 3. Daily Quota */}
                              <td className="py-4 px-6 font-mono whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold ${group.totalUsed >= group.totalLimit ? 'text-rose-400 font-bold' : 'text-zinc-200'}`}>
                                    {group.totalUsed} / {group.totalLimit}
                                  </span>
                                  <span className="text-zinc-500 text-[11px]">stacked</span>
                                </div>
                                <div className="w-24 h-1.5 rounded-full bg-zinc-800 overflow-hidden mt-1.5">
                                  <div
                                    className={`h-full transition-all ${pct >= 100 ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-400' : 'bg-purple-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>

                              {/* 4. Hardware ID */}
                              <td className="py-4 px-6 font-mono whitespace-nowrap">
                                {group.hwid ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <span className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded font-mono truncate max-w-[120px]">
                                      {group.hwid}
                                    </span>
                                    <button
                                      onClick={() => {
                                        const licWithHwid = group.licenses.find((l: any) => l.hwid);
                                        if (licWithHwid) handleResetGenHwid(licWithHwid);
                                      }}
                                      className="p-1 rounded hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                                      title="Reset HWID Binding"
                                    >
                                      <Unlock className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                                    UNBOUND
                                  </span>
                                )}
                              </td>

                              {/* 5. Status */}
                              <td className="py-4 px-6 whitespace-nowrap">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium ${
                                  group.hasActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                }`}>
                                  {group.hasActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>

                              {/* 6. Actions Dropdown */}
                              <td className="py-4 px-6 text-right whitespace-nowrap action-dropdown-container">
                                <div className="relative inline-block text-left">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (activeDropdownId === group.userId) {
                                        setActiveDropdownId(null);
                                        setDropdownPos(null);
                                      } else {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setDropdownPos({
                                          top: rect.bottom + 6,
                                          right: window.innerWidth - rect.right,
                                        });
                                        setActiveDropdownId(group.userId);
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                                  >
                                    <span>Options</span>
                                    <MoreVertical className="w-3.5 h-3.5 text-zinc-400" />
                                  </button>

                                  {activeDropdownId === group.userId && dropdownPos && (
                                    <div
                                      style={{ top: `${dropdownPos.top}px`, right: `${dropdownPos.right}px` }}
                                      className="fixed z-50 w-56 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 text-xs font-sans animate-in fade-in zoom-in-95"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {/* Edit Limit for Primary / First License */}
                                      <button
                                        onClick={() => {
                                          setEditingLic(primaryLic);
                                          setEditLimitValue(String(primaryLic.effective_limit ?? primaryLic.daily_limit ?? 15));
                                          setEditQuotaMode((primaryLic.quota_mode || 'shared') as 'isolated' | 'shared');
                                          setShowEditLimitModal(true);
                                          setActiveDropdownId(null);
                                        }}
                                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                                        <span>Edit Daily Limit & Mode</span>
                                      </button>

                                      {/* Reset Usage for this user */}
                                      <button
                                        onClick={() => {
                                          handleResetGenUsage(primaryLic);
                                          setActiveDropdownId(null);
                                        }}
                                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Reset Today's Usage</span>
                                      </button>

                                      {/* Reset HWID */}
                                      {group.hwid && (
                                        <button
                                          onClick={() => {
                                            const licWithHwid = group.licenses.find((l: any) => l.hwid);
                                            if (licWithHwid) handleResetGenHwid(licWithHwid);
                                            setActiveDropdownId(null);
                                          }}
                                          className="w-full px-3 py-2 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                                        >
                                          <Unlock className="w-3.5 h-3.5 text-blue-400" />
                                          <span>Reset HWID Lock</span>
                                        </button>
                                      )}

                                      {/* Toggle Active */}
                                      <button
                                        onClick={() => {
                                          handleToggleGenLicense(primaryLic.id, primaryLic.is_active);
                                          setActiveDropdownId(null);
                                        }}
                                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                                      >
                                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>{primaryLic.is_active ? 'Disable License' : 'Enable License'}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                ) : (
                  /* ── RAW KEYS FORMAT (FALLBACK) ── */
                  <table className="w-full min-w-[1100px] text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/80 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                        <th className="py-4 px-6">License Key</th>
                        <th className="py-4 px-6">Scope</th>
                        <th className="py-4 px-6">Tier</th>
                        <th className="py-4 px-6">Redeemed By</th>
                        <th className="py-4 px-6">Hardware ID</th>
                        <th className="py-4 px-6">Daily Usage</th>
                        <th className="py-4 px-6">Created</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 font-mono">
                      {filteredGenLicenses.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-16 text-center text-zinc-500 font-sans">
                            No generator licenses found matching search.
                          </td>
                        </tr>
                      ) : (
                        filteredGenLicenses.map((lic: any) => (
                          <tr key={lic.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-4 px-6 font-mono font-semibold text-zinc-200 select-all whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <span>{lic.license_key}</span>
                                <button onClick={() => copyToClipboard(lic.license_key)} className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800">
                                  {copiedKey === lic.license_key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-mono whitespace-nowrap">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-mono ${
                                  lic.scope_label?.startsWith('[Package]')
                                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                    : lic.scope_label === 'All Services'
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                                }`}
                              >
                                {lic.scope_label || 'All Services'}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-mono uppercase text-xs whitespace-nowrap text-zinc-400">
                              {lic.tier || 'lifetime'}
                            </td>
                            <td className="py-4 px-6 font-mono whitespace-nowrap min-w-[180px]">
                              {lic.redeemed_by ? (
                                <DiscordUserBadge userId={lic.redeemed_by} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                              ) : (
                                <span className="text-zinc-500 font-mono text-xs">UNREDEEMED</span>
                              )}
                            </td>
                            <td className="py-4 px-6 font-mono whitespace-nowrap">
                              {lic.hwid ? (
                                <div className="inline-flex items-center gap-2">
                                  <span className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 rounded font-mono truncate max-w-[150px]">
                                    {lic.hwid}
                                  </span>
                                  <button
                                    onClick={() => handleResetGenHwid(lic)}
                                    className="p-1 rounded hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 transition-colors"
                                    title="Reset / Unbind HWID"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                                  UNBOUND
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 font-mono whitespace-nowrap">
                              <span className={`font-semibold ${ (lic.used_today || 0) >= (lic.effective_limit ?? lic.daily_limit ?? 15) ? 'text-rose-400' : 'text-zinc-200' }`}>
                                {lic.used_today || 0} / {lic.effective_limit ?? lic.daily_limit ?? 15}
                              </span>
                              <span className="text-zinc-500 text-[11px] ml-1.5">used</span>
                            </td>
                            <td className="py-4 px-6 font-mono text-zinc-400 text-xs whitespace-nowrap">
                              {new Date(lic.created_at || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium ${lic.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                                {lic.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap action-dropdown-container">
                              <div className="relative inline-block text-left">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (activeDropdownId === lic.id) {
                                      setActiveDropdownId(null);
                                      setDropdownPos(null);
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setDropdownPos({
                                        top: rect.bottom + 6,
                                        right: window.innerWidth - rect.right,
                                      });
                                      setActiveDropdownId(lic.id);
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors"
                                >
                                  <span>Options</span>
                                  <MoreVertical className="w-3.5 h-3.5 text-zinc-400" />
                                </button>

                                {activeDropdownId === lic.id && dropdownPos && (
                                  <div
                                    style={{ top: `${dropdownPos.top}px`, right: `${dropdownPos.right}px` }}
                                    className="fixed z-50 w-52 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 text-xs font-sans animate-in fade-in zoom-in-95"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => {
                                        setEditingLic(lic);
                                        setEditLimitValue(String(lic.effective_limit ?? lic.daily_limit ?? 15));
                                        setEditQuotaMode((lic.quota_mode || 'isolated') as 'isolated' | 'shared');
                                        setShowEditLimitModal(true);
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2.5 transition-colors"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                                      <span>Edit Daily Limit</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleResetGenUsage(lic);
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2.5 transition-colors"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Reset Daily Usage</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleResetGenHwid(lic);
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2.5 transition-colors"
                                    >
                                      <Unlock className="w-3.5 h-3.5 text-blue-400" />
                                      <span>Reset HWID Binding</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleToggleGenLicense(lic.id, lic.is_active);
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-zinc-800 text-zinc-200 flex items-center gap-2.5 transition-colors"
                                    >
                                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>{lic.is_active ? 'Disable License' : 'Enable License'}</span>
                                    </button>

                                    <div className="h-px bg-zinc-800 my-1" />

                                    <button
                                      onClick={() => {
                                        handleDeleteGenLicense(lic);
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-rose-500/10 text-rose-400 flex items-center gap-2.5 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete Key</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: DIGITAL PRODUCTS & CATALOG ── */}
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
                  <div className="text-[11px] font-mono text-zinc-400">Manual Stocks (Mode B)</div>
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
            {productsLoading && productsList.length === 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[760px] overflow-y-auto pr-1">
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
                        className={`rounded-2xl bg-zinc-950/80 border p-5 flex flex-col justify-between transition-all ${
                          product.isActive
                            ? 'border-zinc-800/80 hover:border-zinc-700'
                            : 'border-zinc-800/40 opacity-60'
                        }`}
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
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                  product.isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
                                }`}
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
                                  / ${Number(product.priceUSD).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Multi-Tier Preview Pills in Admin */}
                          {Array.isArray(product.tierOptions) && product.tierOptions.length > 0 && (
                            <div className="flex flex-wrap gap-1 pb-3">
                              {product.tierOptions.map((t: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300"
                                >
                                  <span className="text-purple-400 font-semibold">{t.name}:</span> ₱{Number(t.pricePHP).toLocaleString()} (${Number(t.priceUSD).toFixed(2)})
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleProductStatus(product.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                                product.isActive
                                  ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                              }`}
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

        {/* ── TAB 4: ORDERS & TRANSACTIONS ── */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Header Strip & Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-zinc-400">Total Orders</div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5">{ordersList.length}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-zinc-400">Pending Approvals</div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-0.5">
                    {ordersList.filter((o) => o.status === 'pending').length}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-zinc-400">Delivered Licenses</div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                    {ordersList.filter((o) => o.status === 'delivered').length}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-zinc-400">Balance Top-Ups</div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-blue-400 mt-0.5">
                    {ordersList.filter((o) => o.order_type === 'balance_topup').length}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Zap className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Sub-Filters and Refresh */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setOrderFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                    orderFilter === 'all' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All ({ordersList.length})
                </button>
                <button
                  onClick={() => setOrderFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                    orderFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>Pending Approvals</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 text-[10px]">
                    {ordersList.filter((o) => o.status === 'pending').length}
                  </span>
                </button>
                <button
                  onClick={() => setOrderFilter('delivered')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                    orderFilter === 'delivered' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Delivered ({ordersList.filter((o) => o.status === 'delivered').length})
                </button>
                <button
                  onClick={() => setOrderFilter('awaiting_payment')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                    orderFilter === 'awaiting_payment' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Awaiting Payment ({ordersList.filter((o) => o.status === 'awaiting_payment').length})
                </button>
                <button
                  onClick={() => setOrderFilter('rejected')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                    orderFilter === 'rejected' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Rejected ({ordersList.filter((o) => o.status === 'rejected' || o.status === 'cancelled').length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab('payments');
                    fetchPaymentSettings();
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer border bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700/60"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configure Gateways &rarr;</span>
                </button>

                <button
                  onClick={() => fetchOrders()}
                  disabled={ordersLoading}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Orders</span>
                </button>
              </div>
            </div>

            {/* Orders List */}
            {ordersLoading && ordersList.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-zinc-500 animate-pulse bg-zinc-950 border border-zinc-800 rounded-3xl">
                Loading orders from database...
              </div>
            ) : ordersList.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-zinc-950/50 border border-zinc-800/80">
                <CreditCard className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white mb-1">No Orders Recorded</h4>
                <p className="text-xs text-zinc-400">Store purchases and balance top-ups will appear here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ordersList
                  .filter((ord) => {
                    if (orderFilter === 'pending') return ord.status === 'pending';
                    if (orderFilter === 'delivered') return ord.status === 'delivered';
                    if (orderFilter === 'awaiting_payment') return ord.status === 'awaiting_payment';
                    if (orderFilter === 'rejected') return ord.status === 'rejected' || ord.status === 'cancelled';
                    return true;
                  })
                  .map((ord) => {
                    const isOrdPending = ord.status === 'pending';
                    const isOrdDelivered = ord.status === 'delivered';
                    const isOrdAwaiting = ord.status === 'awaiting_payment';
                    const isOrdRejected = ord.status === 'rejected';
                    const memo = ord.payment_details?.paypal_note;
                    const customerRef = ord.payment_details?.customer_reference;
                    const rejectionReason = ord.payment_details?.rejection_reason;
                    const tierName = ord.tier_key ? `${ord.tier_key.toUpperCase()}` : '';

                    return (
                      <div
                        key={ord.id}
                        className={`p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                          isOrdPending ? 'border-amber-500/40 bg-amber-950/5' : isOrdRejected ? 'border-rose-500/30 bg-rose-950/5' : 'border-zinc-800/80'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Row 1: Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                              isOrdDelivered
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : isOrdPending
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                                : isOrdAwaiting
                                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                                : isOrdRejected
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}>
                              {ord.status === 'awaiting_payment' ? 'Awaiting Payment' : ord.status}
                            </span>

                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                              {ord.provider_label || ord.provider}
                            </span>

                            <span className="text-[11px] font-mono text-zinc-500">
                              {new Date(ord.created_at).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Row 2: Title & Details */}
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-sm font-bold text-white">
                              {ord.order_type === 'balance_topup'
                                ? 'Web Balance Top-Up'
                                : ord.products?.title || 'ASYNC Product License'}
                            </span>
                            {tierName && (
                              <span className="text-xs font-mono text-purple-400 font-semibold">
                                ({tierName})
                              </span>
                            )}
                            <span className="text-xs font-mono font-bold text-white ml-2">
                              {ord.currency === 'PHP' ? '₱' : '$'}{Number(ord.amount).toFixed(2)} {ord.currency}
                            </span>
                          </div>

                          {/* Row 3: Customer & Verification Data */}
                          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400">
                            <div>
                              Buyer:{' '}
                              {ord.email?.includes('@discord.asyncdevph.xyz') || ord.email?.includes('@discord.user') ? (
                                <span className="text-zinc-200">Discord Account</span>
                              ) : (
                                <span className="text-zinc-200">{ord.email}</span>
                              )}
                              {ord.discord_id && <span className="text-zinc-500"> ({ord.discord_id})</span>}
                            </div>

                            {memo && (
                              <div className="p-1 px-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                                Assigned Memo: <strong className="text-amber-300 select-all">&quot;{memo}&quot;</strong>
                              </div>
                            )}

                            {customerRef && (
                              <div className="p-1 px-2 rounded-lg bg-zinc-900 border border-purple-500/30 text-purple-300">
                                Submitted Ref #: <strong className="text-white select-all">{customerRef}</strong>
                              </div>
                            )}

                            {rejectionReason && (
                              <div className="p-1 px-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300">
                                Rejection Reason: <strong className="text-white">{rejectionReason}</strong>
                              </div>
                            )}
                          </div>

                          {/* Row 4: License Key if delivered */}
                          {isOrdDelivered && ord.license_key && (
                            <div className="pt-1 flex items-center gap-2">
                              <span className="text-[11px] font-mono text-zinc-500">Issued Key:</span>
                              <code className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/30 select-all">
                                {ord.license_key}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(ord.license_key);
                                  setCopiedKey(ord.license_key);
                                  setTimeout(() => setCopiedKey(null), 2000);
                                }}
                                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                              >
                                {copiedKey === ord.license_key ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                          <button
                            onClick={() => setSelectedOrderForModal(ord)}
                            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                            title="Inspect Full Order Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-400" />
                            <span>Inspect</span>
                          </button>
                          {(isOrdPending || isOrdAwaiting) && (
                            <>
                              <button
                                onClick={() => handleApproveOrder(ord.id)}
                                disabled={processingOrderId === ord.id}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{processingOrderId === ord.id ? 'Issuing Key...' : ord.order_type === 'balance_topup' ? 'Approve Top-Up' : 'Approve & Issue Key'}</span>
                              </button>

                              <button
                                onClick={() => handleRejectOrder(ord.id)}
                                disabled={processingOrderId === ord.id}
                                className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-white font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>

                              <button
                                onClick={() => handleCancelOrder(ord.id)}
                                disabled={processingOrderId === ord.id}
                                className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-mono text-xs transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          <a
                            href={`/order/${ord.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            title="View Customer Tracking Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: PAYMENT GATEWAYS & SURCHARGES ── */}
        {activeTab === 'payments' && (
          <form onSubmit={handleSavePaymentSettings} className="space-y-6">
            {/* Header with Quick Save */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-900/90 border border-amber-500/30 backdrop-blur-xl relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
                    <span>Payment Gateways & Surcharge Control</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Toggle active payment rails, configure percentage surcharge fees (auto-computed at checkout), and update QR photos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {payConfigSavedSuccess && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Gateways Saved!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingPayConfig}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingPayConfig ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{savingPayConfig ? 'Saving Changes...' : 'Save Gateway Settings'}</span>
                </button>
              </div>
            </div>

            {/* Gateway Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* RAIL 1: PayMongo QRPH (In-Store Static) */}
              <div className={`p-5 rounded-3xl bg-zinc-950/80 border space-y-4 transition-all ${
                payConfigPaymongoEnabled ? 'border-purple-500/40 shadow-lg shadow-purple-950/20' : 'border-zinc-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${payConfigPaymongoEnabled ? 'bg-purple-400 animate-pulse' : 'bg-zinc-600'}`} />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">PayMongo QRPH</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPayConfigPaymongoEnabled(!payConfigPaymongoEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        payConfigPaymongoEnabled ? 'bg-purple-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          payConfigPaymongoEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      payConfigPaymongoEnabled ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}>
                      {payConfigPaymongoEnabled ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-zinc-400">Gateway Surcharge Fee (%)</label>
                      <span className="text-[10px] text-purple-400">e.g. 3.5%</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={payConfigPaymongoFeePercent}
                        onChange={(e) => setPayConfigPaymongoFeePercent(e.target.value)}
                        placeholder="3.5"
                        className="w-full px-3 py-2 pr-8 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-zinc-500">%</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">Auto-added to customer checkout total.</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 mb-1 block">Account / Merchant Name</label>
                    <input
                      type="text"
                      value={payConfigPaymongoName}
                      onChange={(e) => setPayConfigPaymongoName(e.target.value)}
                      placeholder="e.g. ASYNC ENTERPRISES"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* AUTOMATED PAYMONGO CHECKOUT & WEBHOOK SETTINGS */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">Automated API Checkout</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPayConfigPaymongoAutomated(!payConfigPaymongoAutomated)}
                        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          payConfigPaymongoAutomated ? 'bg-purple-600' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            payConfigPaymongoAutomated ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {payConfigPaymongoAutomated && (
                      <div className="space-y-2.5 pt-1">
                        <div>
                          <label className="text-[10px] text-zinc-400 mb-1 block">PayMongo Secret Key</label>
                          <input
                            type="password"
                            value={payConfigPaymongoSecretKey}
                            onChange={(e) => setPayConfigPaymongoSecretKey(e.target.value)}
                            placeholder="sk_live_... or sk_test_..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-purple-300 font-mono placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 mb-1 block">Webhook Signing Secret</label>
                          <input
                            type="password"
                            value={payConfigPaymongoWebhookSecret}
                            onChange={(e) => setPayConfigPaymongoWebhookSecret(e.target.value)}
                            placeholder="whsk_..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-purple-300 font-mono placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-[10px] text-zinc-400 space-y-1">
                          <div className="text-zinc-300 font-bold">Register in PayMongo Dashboard:</div>
                          <div className="text-purple-300 select-all font-mono break-all">https://asyncdevph.xyz/api/webhooks/paymongo</div>
                          <div className="text-zinc-500">Events: checkout_session.payment.paid, payment.paid</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 mb-1 block">Static In-Store QR Photo</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 border border-zinc-700 flex items-center gap-2 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                        <span>{uploadingPaymongoQr ? 'Uploading...' : 'Upload QR Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingPaymongoQr}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleInitiateQrUpload(file, 'paymongo');
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {payConfigPaymongoQrUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCropModalImgUrl(payConfigPaymongoQrUrl);
                            setCropModalType('paymongo');
                            setCropModalOpen(true);
                          }}
                          className="px-2.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Adjust Frame"
                        >
                          <Crop className="w-3.5 h-3.5 text-purple-400" />
                          <span>Adjust Frame</span>
                        </button>
                      )}
                    </div>

                    {payConfigPaymongoQrUrl && (
                      <div className="mt-3 p-2 rounded-xl bg-zinc-900 border border-zinc-800 inline-block">
                        <img
                          src={payConfigPaymongoQrUrl}
                          alt="PayMongo QR Preview"
                          className="w-32 h-32 object-contain rounded-lg bg-white p-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RAIL 2: GCash Direct QR */}
              <div className={`p-5 rounded-3xl bg-zinc-950/80 border space-y-4 transition-all ${
                payConfigGcashEnabled ? 'border-blue-500/40 shadow-lg shadow-blue-950/20' : 'border-zinc-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${payConfigGcashEnabled ? 'bg-blue-400 animate-pulse' : 'bg-zinc-600'}`} />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">GCash Direct</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPayConfigGcashEnabled(!payConfigGcashEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        payConfigGcashEnabled ? 'bg-blue-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          payConfigGcashEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      payConfigGcashEnabled ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}>
                      {payConfigGcashEnabled ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-zinc-400">Gateway Surcharge Fee (%)</label>
                      <span className="text-[10px] text-blue-400">0% for direct</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={payConfigGcashFeePercent}
                        onChange={(e) => setPayConfigGcashFeePercent(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 pr-8 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-zinc-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 mb-1 block">Account Name</label>
                    <input
                      type="text"
                      value={payConfigGcashName}
                      onChange={(e) => setPayConfigGcashName(e.target.value)}
                      placeholder="e.g. MAIK R."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 mb-1 block">Mobile Number</label>
                    <input
                      type="text"
                      value={payConfigGcashNumber}
                      onChange={(e) => setPayConfigGcashNumber(e.target.value)}
                      placeholder="e.g. 0917 XXX XXXX"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 mb-1 block">GCash QR Photo</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 border border-zinc-700 flex items-center gap-2 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        <span>{uploadingGcashQr ? 'Uploading...' : 'Upload QR'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingGcashQr}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleInitiateQrUpload(file, 'gcash');
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {payConfigGcashQrUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCropModalImgUrl(payConfigGcashQrUrl);
                            setCropModalType('gcash');
                            setCropModalOpen(true);
                          }}
                          className="px-2.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Crop className="w-3.5 h-3.5 text-purple-400" />
                          <span>Adjust</span>
                        </button>
                      )}
                    </div>

                    {payConfigGcashQrUrl && (
                      <div className="mt-3 p-2 rounded-xl bg-zinc-900 border border-zinc-800 inline-block">
                        <img
                          src={payConfigGcashQrUrl}
                          alt="GCash QR Preview"
                          className="w-32 h-32 object-contain rounded-lg bg-white p-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RAIL 3: Maya Direct QR */}
              <div className={`p-5 rounded-3xl bg-zinc-950/80 border space-y-4 transition-all ${
                payConfigMayaEnabled ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/20' : 'border-zinc-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${payConfigMayaEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Maya Direct</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPayConfigMayaEnabled(!payConfigMayaEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        payConfigMayaEnabled ? 'bg-emerald-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          payConfigMayaEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      payConfigMayaEnabled ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}>
                      {payConfigMayaEnabled ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-zinc-400">Gateway Surcharge Fee (%)</label>
                      <span className="text-[10px] text-emerald-400">0% for direct</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={payConfigMayaFeePercent}
                        onChange={(e) => setPayConfigMayaFeePercent(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 pr-8 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-zinc-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 mb-1 block">Account Name</label>
                    <input
                      type="text"
                      value={payConfigMayaName}
                      onChange={(e) => setPayConfigMayaName(e.target.value)}
                      placeholder="e.g. MAIK R."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 mb-1 block">Mobile Number</label>
                    <input
                      type="text"
                      value={payConfigMayaNumber}
                      onChange={(e) => setPayConfigMayaNumber(e.target.value)}
                      placeholder="e.g. 0918 XXX XXXX"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 mb-1 block">Maya QR Photo</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 border border-zinc-700 flex items-center gap-2 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{uploadingMayaQr ? 'Uploading...' : 'Upload QR'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingMayaQr}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleInitiateQrUpload(file, 'maya');
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {payConfigMayaQrUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCropModalImgUrl(payConfigMayaQrUrl);
                            setCropModalType('maya');
                            setCropModalOpen(true);
                          }}
                          className="px-2.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Crop className="w-3.5 h-3.5 text-purple-400" />
                          <span>Adjust</span>
                        </button>
                      )}
                    </div>

                    {payConfigMayaQrUrl && (
                      <div className="mt-3 p-2 rounded-xl bg-zinc-900 border border-zinc-800 inline-block">
                        <img
                          src={payConfigMayaQrUrl}
                          alt="Maya QR Preview"
                          className="w-32 h-32 object-contain rounded-lg bg-white p-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RAIL 4: PayPal Friends & Family */}
              <div className={`p-5 rounded-3xl bg-zinc-950/80 border space-y-4 transition-all ${
                payConfigPaypalEnabled ? 'border-amber-500/40 shadow-lg shadow-amber-950/20' : 'border-zinc-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${payConfigPaypalEnabled ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">PayPal (F&F)</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPayConfigPaypalEnabled(!payConfigPaypalEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        payConfigPaypalEnabled ? 'bg-amber-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          payConfigPaypalEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      payConfigPaypalEnabled ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}>
                      {payConfigPaypalEnabled ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-zinc-400">Gateway Surcharge Fee (%)</label>
                      <span className="text-[10px] text-amber-400">Optional</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={payConfigPaypalFeePercent}
                        onChange={(e) => setPayConfigPaypalFeePercent(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 pr-8 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-zinc-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 mb-1 block">Receiver PayPal Email</label>
                    <input
                      type="email"
                      value={payConfigPaypalEmail}
                      onChange={(e) => setPayConfigPaypalEmail(e.target.value)}
                      placeholder="e.g. payment@asyncdevph.xyz"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                    <div className="text-white font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Automatic Verification Memos</span>
                    </div>
                    <p className="text-[10px] leading-relaxed">
                      Every PayPal order generates a unique randomized tracking memo for matching transfers.
                    </p>
                  </div>
                </div>
              </div>

              {/* RAIL 5: Crypto (LTC / USDT) */}
              <div className={`p-5 rounded-3xl bg-zinc-950/80 border space-y-4 transition-all ${
                payConfigCryptoEnabled ? 'border-amber-500/40 shadow-lg shadow-amber-950/20' : 'border-zinc-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${payConfigCryptoEnabled ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Crypto (LTC / USDT)</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPayConfigCryptoEnabled(!payConfigCryptoEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        payConfigCryptoEnabled ? 'bg-amber-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          payConfigCryptoEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      payConfigCryptoEnabled ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}>
                      {payConfigCryptoEnabled ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-zinc-400">Gateway Surcharge Fee (%)</label>
                      <span className="text-[10px] text-amber-400">Network cover</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={payConfigCryptoFeePercent}
                        onChange={(e) => setPayConfigCryptoFeePercent(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 pr-8 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-zinc-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 mb-1 block">Litecoin (LTC) Address</label>
                    <input
                      type="text"
                      value={payConfigCryptoLtc}
                      onChange={(e) => setPayConfigCryptoLtc(e.target.value)}
                      placeholder="e.g. L..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 mb-1 block">Tether (USDT) Address</label>
                    <input
                      type="text"
                      value={payConfigCryptoUsdt}
                      onChange={(e) => setPayConfigCryptoUsdt(e.target.value)}
                      placeholder="e.g. TRC-20 / ERC-20 Address"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* RAIL 6: Internal Store Web Balance (Informational) */}
              <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Store Web Balance</h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    CORE SYSTEM
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs text-zinc-400">
                  <p className="text-[11px] leading-relaxed">
                    Internal user credit balances linked directly to Discord IDs. Instant automated license generation with zero gateway fees (0%).
                  </p>
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <div className="text-white font-bold text-[11px]">Features:</div>
                    <div className="text-[10px] text-zinc-400">• 0% Transaction fees</div>
                    <div className="text-[10px] text-zinc-400">• Sub-second key generation</div>
                    <div className="text-[10px] text-zinc-400">• Top-up via PayPal &amp; QRPH</div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ── TAB: COUPONS & PROMOTIONAL DISCOUNTS ── */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            {/* Header Strip & Stats */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-900/90 border border-emerald-500/30 backdrop-blur-xl relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Coupons & Promo Codes</span>
                    <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      Non-Stacking Engine
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Create promo codes with custom percentage or flat deductions. Enforces regular-price-only eligibility.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 relative z-10 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowCreateCouponModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/60"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Coupon</span>
                </button>

                <button
                  type="button"
                  onClick={() => fetchCoupons()}
                  disabled={couponsLoading}
                  className="px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${couponsLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Coupons List */}
            {couponsLoading && couponsList.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-zinc-500 animate-pulse bg-zinc-950 border border-zinc-800 rounded-3xl">
                Loading coupons from database...
              </div>
            ) : couponsList.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-zinc-950/50 border border-zinc-800/80 space-y-3">
                <Tag className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-semibold text-white">No Promo Codes Created</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Generate promotional discount codes for your customers. Codes automatically apply strictly to regular-priced items.
                </p>
                <button
                  onClick={() => setShowCreateCouponModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all"
                >
                  Create First Coupon
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {couponsList.map((c) => (
                  <div
                    key={c.id}
                    className={`p-5 rounded-2xl bg-zinc-950/80 border transition-all flex flex-col justify-between gap-4 ${
                      c.is_active ? 'border-zinc-800/80' : 'border-zinc-800/40 opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono font-bold text-sm tracking-wider">
                          {c.code}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          c.is_active
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                        }`}>
                          {c.is_active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs font-mono">
                        <div className="text-white text-base font-bold">
                          {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `₱${Number(c.discount_value).toFixed(2)} OFF`}
                        </div>
                        <div className="text-zinc-400 text-[11px]">
                          Min Spend: {Number(c.min_spend) > 0 ? `₱${Number(c.min_spend).toFixed(2)}` : 'No minimum'}
                        </div>
                        <div className="text-zinc-500 text-[11px]">
                          Redemptions: <strong className="text-zinc-300">{c.times_used || 0}</strong> {c.max_uses ? `/ ${c.max_uses}` : '(Unlimited)'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(c.id, c.is_active)}
                        className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer text-[11px] font-semibold ${
                          c.is_active
                            ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: AUDIT TRAIL ── */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 w-fit">
              <button
                onClick={() => setAuditSubTab('claims')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${auditSubTab === 'claims' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Generator Claims ({claimLogs.length})
              </button>
              <button
                onClick={() => setAuditSubTab('downloads')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${auditSubTab === 'downloads' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                App Downloads ({downloadLogs.length})
              </button>
            </div>

            {auditSubTab === 'claims' ? (
              <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 font-mono text-xs text-blue-300 font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>LIVE GENERATION CLAIMS LOG</span>
                </div>

                <div className="overflow-x-auto min-h-[540px] max-h-[540px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-zinc-950 shadow-sm">
                      <tr className="border-b border-zinc-800/80 bg-zinc-950 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Service</th>
                        <th className="py-4 px-6">User ID</th>
                        <th className="py-4 px-6">Source</th>
                        <th className="py-4 px-6">Claim Timestamp</th>
                        <th className="py-4 px-6 text-right">Raw Output</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 font-mono">
                      {filteredClaimLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center text-zinc-500 font-sans">
                            No claim logs found.
                          </td>
                        </tr>
                      ) : (
                        filteredClaimLogs.map((c: any) => (
                          <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-4 px-6 font-semibold text-white">
                              {c.service_name}
                            </td>
                            <td className="py-4 px-6">
                              <DiscordUserBadge userId={c.discord_user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                            </td>
                            <td className="py-4 px-6 uppercase text-[11px] text-zinc-400">
                              {c.source || 'Web'}
                            </td>
                            <td className="py-4 px-6 text-zinc-400 text-xs">
                              {new Date(c.created_at || Date.now()).toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => copyToClipboard(c.raw_data)}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
                              >
                                {copiedKey === c.raw_data ? 'Copied' : 'Copy Output'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 font-mono text-xs text-blue-300 font-semibold flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>DESKTOP CLIENT DOWNLOAD HISTORY</span>
                </div>

                <div className="overflow-x-auto min-h-[540px] max-h-[540px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-zinc-950 shadow-sm">
                      <tr className="border-b border-zinc-800/80 bg-zinc-950 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                        <th className="py-4 px-6">User ID</th>
                        <th className="py-4 px-6">License Key</th>
                        <th className="py-4 px-6">IP Address</th>
                        <th className="py-4 px-6">Date Downloaded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 font-mono">
                      {filteredDownloadLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-16 text-center text-zinc-500 font-sans">
                            No download logs recorded.
                          </td>
                        </tr>
                      ) : (
                        filteredDownloadLogs.map((d: any) => (
                          <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-4 px-6">
                              <DiscordUserBadge userId={d.discord_user_id} userProfiles={userProfiles} onCopy={copyToClipboard} copiedKey={copiedKey} />
                            </td>
                            <td className="py-4 px-6 font-semibold text-zinc-300">
                              {d.license_key || 'Direct Auth'}
                            </td>
                            <td className="py-4 px-6 text-zinc-400">
                              {d.ip_address || '127.0.0.1'}
                            </td>
                            <td className="py-4 px-6 text-zinc-400 text-xs">
                              {new Date(d.downloaded_at || Date.now()).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: LIVE SUPPORT CHAT ── */}
        {activeTab === 'chat' && (
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-sm flex flex-col md:flex-row h-[750px]">
            {/* Left Ticket Navigation Panel */}
            <div className="w-full md:w-80 border-r border-zinc-800/80 flex flex-col bg-zinc-950/40">
              <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChatChannel('support')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chatChannel === 'support' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Tickets ({chatTickets.length})
                  </button>
                  <button
                    onClick={() => setChatChannel('general')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chatChannel === 'general' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    General
                  </button>
                </div>
              </div>

              {chatChannel === 'support' ? (
                <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
                  {chatTickets.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      No support tickets open.
                    </div>
                  ) : (
                    chatTickets.map((t) => (
                      <div
                        key={t.ticket_id}
                        onClick={() => setSelectedTicketId(t.ticket_id)}
                        className={`p-4 cursor-pointer transition-colors ${selectedTicketId === t.ticket_id ? 'bg-purple-950/20 border-l-2 border-purple-500' : 'hover:bg-zinc-900/40'}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-white text-xs truncate max-w-[150px]">
                            {t.sender_name || 'Member'}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(t.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate">{t.last_message}</p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-zinc-500">
                  Viewing Public General Chat feed.
                </div>
              )}
            </div>

            {/* Right Chat Message Pane */}
            <div className="flex-1 flex flex-col bg-zinc-900/20">
              <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/30 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {chatChannel === 'support' ? `Ticket: ${selectedTicketId || 'Select a ticket'}` : 'General Public Chat'}
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-mono">Real-time WebSocket active</p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {ticketMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                    No messages in this channel yet.
                  </div>
                ) : (
                  ticketMessages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${msg.is_admin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-zinc-400">
                          {msg.sender_name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-600">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.is_admin
                            ? 'bg-purple-600 text-white rounded-tr-none'
                            : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700/60'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendAdminMessage} className="p-4 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center gap-3">
                <input
                  type="text"
                  value={adminChatInput}
                  onChange={(e) => setAdminChatInput(e.target.value)}
                  placeholder={chatChannel === 'support' ? 'Type response to user...' : 'Post announcement to general...'}
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />
                <button
                  type="submit"
                  disabled={sendingAdminChat || !adminChatInput.trim()}
                  className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

          </div>
        </div>

      </main>

      {/* ── MODAL 1: MANUAL IP BAN ── */}
      {showManualBanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400" />
                <span>Issue Manual IP Ban</span>
              </h3>
              <button onClick={() => setShowManualBanModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualBanIP} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Target IP Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 112.204.180.1"
                  value={banIpAddress}
                  onChange={(e) => setBanIpAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Reason for Ban</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malicious inspection / abuse"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualBanModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  <span>Enforce Ban</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: GENERATE GENERATOR LICENSE ── */}
      {showGenLicenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <span>Issue Generator License Key</span>
              </h3>
              <button onClick={() => setShowGenLicenseModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateGenLicense} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Scope (Allowed Services)</label>
                <select
                  value={genLicScope}
                  onChange={(e) => setGenLicScope(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="All">All Services (Full Access)</option>
                  {packages.map((pkg: any) => (
                    <option key={pkg.id} value={`pkg_${pkg.id}`}>
                      Package: {pkg.name}
                    </option>
                  ))}
                  {services.map((svc: any) => (
                    <option key={svc.id} value={svc.name}>
                      Single: {svc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Tier / Duration</label>
                <select
                  value={genLicTier}
                  onChange={(e) => setGenLicTier(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="lifetime">Lifetime</option>
                  <option value="monthly">Monthly (30 Days)</option>
                  <option value="weekly">Weekly (7 Days)</option>
                  <option value="daily">Daily (24 Hours)</option>
                </select>
              </div>

              {genLicTier === 'lifetime' && (
                <div>
                  <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Custom Daily Generation Limit (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Defaults to 15 if empty"
                    value={genLicDailyLimit}
                    onChange={(e) => setGenLicDailyLimit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Pre-Assign to User ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Discord Snowflake ID (e.g. 719482630633947166)"
                  value={genLicUserId}
                  onChange={(e) => setGenLicUserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Custom Key String (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if left blank"
                  value={genLicKey}
                  onChange={(e) => setGenLicKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenLicenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  <span>Generate Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: RESTOCK STOCK ── */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                <span>Restock Service Inventory</span>
              </h3>
              <button onClick={() => setShowRestockModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Select Service</label>
                <select
                  required
                  value={restockService}
                  onChange={(e) => setRestockService(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Choose a service...</option>
                  {services.map((svc: any) => (
                    <option key={svc.id} value={svc.name}>
                      {svc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">
                  Stock Accounts Files (.txt)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRestockDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRestockDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRestockDragging(false);
                    const droppedFiles = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
                    if (droppedFiles.length > 0) {
                      processRestockFiles(droppedFiles);
                    }
                  }}
                  onClick={() => restockFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    isRestockDragging
                      ? 'border-purple-500 bg-purple-500/10 scale-[0.99]'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60'
                  }`}
                >
                  <input
                    ref={restockFileInputRef}
                    type="file"
                    accept=".txt"
                    multiple
                    onChange={handleRestockFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Upload className={`w-5 h-5 ${isRestockDragging ? 'text-purple-400 animate-bounce' : 'text-zinc-400'}`} />
                    <p className="text-xs text-zinc-300 font-medium">
                      Drag and drop multiple <span className="font-mono text-purple-400">.txt</span> files here, or <span className="text-purple-400 underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      Multiple files will merge and deduplicate accounts automatically
                    </p>
                  </div>
                </div>
                {restockFileName && (
                  <div className="mt-2 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-[11px] text-purple-300 font-mono">
                    <span className="truncate mr-2 font-medium">Loaded: {restockFileName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRestockFileName('');
                        setRestockContent('');
                        if (restockFileInputRef.current) restockFileInputRef.current.value = '';
                      }}
                      className="text-zinc-400 hover:text-white shrink-0 text-xs px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-zinc-400 uppercase">
                    Or Paste / Inspect Accounts
                  </label>
                  {restockContent.trim() && (
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {restockContent.split(/\r?\n/).filter((l) => l.trim().length > 0).length} accounts queued
                    </span>
                  )}
                </div>
                <textarea
                  required
                  rows={6}
                  placeholder={`user:pass\nuser2:pass2`}
                  value={restockContent}
                  onChange={(e) => setRestockContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload & Restock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: EDIT DAILY LIMIT ── */}
      {showEditLimitModal && editingLic && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-400" />
                <span>Adjust Daily Limit</span>
              </h3>
              <button onClick={() => setShowEditLimitModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditGenLicense} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">License Key</label>
                <p className="text-xs font-mono text-zinc-200 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 truncate">
                  {editingLic.license_key}
                </p>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Max Generations Per Day</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editLimitValue}
                  onChange={(e) => setEditLimitValue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Quota Policy Mode</label>
                <select
                  value={editQuotaMode}
                  onChange={(e) => setEditQuotaMode(e.target.value as 'isolated' | 'shared')}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50 cursor-pointer"
                >
                  <option value="isolated">Isolated (Strictly applies only to covered services)</option>
                  <option value="shared">Shared Pool (Can be used across any eligible service)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditLimitModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Limit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: CREATE BUNDLE ── */}
      {showCreateBundleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                <span>Create Service Bundle / Package</span>
              </h3>
              <button
                onClick={() => {
                  setShowCreateBundleModal(false);
                  setBundleName('');
                  setBundleDescription('');
                  setBundleSelectedServices([]);
                }}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBundle} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Bundle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Access Pass, Gaming Bundle"
                  value={bundleName}
                  onChange={(e) => setBundleName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Includes Rockstar, Steam, and Discord generator access"
                  value={bundleDescription}
                  onChange={(e) => setBundleDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase block mb-2">
                  Select Included Services ({bundleSelectedServices.length} selected)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
                  {services.length === 0 ? (
                    <div className="text-xs text-zinc-500 py-2">No services found</div>
                  ) : (
                    services.map((svc: any) => {
                      const isSelected = bundleSelectedServices.includes(svc.id);
                      return (
                        <label
                          key={svc.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                              : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBundleSelectedServices([...bundleSelectedServices, svc.id]);
                                } else {
                                  setBundleSelectedServices(bundleSelectedServices.filter((id) => id !== svc.id));
                                }
                              }}
                              className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 bg-zinc-800 cursor-pointer"
                            />
                            <span className="font-semibold text-xs text-white">{svc.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {svc.stock_count ?? 0} in stock
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateBundleModal(false);
                    setBundleName('');
                    setBundleDescription('');
                    setBundleSelectedServices([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !bundleName.trim() || bundleSelectedServices.length === 0}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Bundle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: ADD / EDIT DIGITAL PRODUCT ── */}
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

              {/* Row 2: Standard PHP Pricing & Discount % with Live USD Conversion */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-purple-400 font-semibold uppercase">
                      Pricing Structure
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {prodPricingType === 'single' ? 'Single Flat Price' : 'Multi-Tier Duration'}
                    </span>
                  </div>

                  {/* Toggle Pricing Model */}
                  <div className="flex items-center p-0.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setProdPricingType('single')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        prodPricingType === 'single'
                          ? 'bg-purple-600 text-white font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Single Flat Price
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProdPricingType('tiered');
                        if (prodTierOptions.length === 0) {
                          setProdTierOptions([
                            { id: 'opt_daily', tierKey: 'daily', name: '1 Day', pricePHP: '50.00', discountPercent: '0', dailyLimit: '15' },
                            { id: 'opt_weekly', tierKey: 'weekly', name: '7 Days', pricePHP: '250.00', discountPercent: '0', dailyLimit: '15' },
                            { id: 'opt_monthly', tierKey: 'monthly', name: '30 Days', pricePHP: '750.00', discountPercent: '0', dailyLimit: '15' },
                            { id: 'opt_lifetime', tierKey: 'lifetime', name: 'Lifetime', pricePHP: '1500.00', discountPercent: '0', dailyLimit: '25' }
                          ]);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        prodPricingType === 'tiered'
                          ? 'bg-purple-600 text-white font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Multi-Tier Duration
                    </button>
                  </div>
                </div>

                {prodPricingType === 'single' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1">
                    <div>
                      <label className="text-[11px] font-mono text-zinc-400 block mb-1">Product Price (PHP ₱) *</label>
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
                      <label className="text-[11px] font-mono text-zinc-400 block mb-1">Discount % (0 = Regular)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={prodDiscountPercent}
                        onChange={(e) => setProdDiscountPercent(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">Live Converted USD</div>
                      <div className="text-sm font-mono font-bold text-purple-300">
                        ≈ ${((parseFloat(prodPricePHP) || 0) * (1 - (parseFloat(prodDiscountPercent) || 0) / 100) / (liveFxRate || 58.5)).toFixed(2)} USD
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-xs text-zinc-400 font-mono">
                    Multi-tier duration pricing is active. Set specific pricing per duration (1 Day, 7 Days, etc.) below in the Fulfillment section.
                  </div>
                )}
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
                    onClick={() => {
                      setProdDeliveryMode('automated_license');
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      prodDeliveryMode === 'automated_license'
                        ? 'bg-purple-950/30 border-purple-500 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>Mode A: Automated Key Gen</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      Keys generated on-the-fly (`LIC-XXXX-XXXX-XXXX`). Never out of stock.
                    </p>
                  </div>

                  {/* Mode B card */}
                  <div
                    onClick={() => {
                      setProdDeliveryMode('stock_pool');
                      setProdPricingType('single');
                      setProdTierOptions([]);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      prodDeliveryMode === 'stock_pool'
                        ? 'bg-blue-950/30 border-blue-500 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <Database className="w-4 h-4 text-blue-400" />
                      <span>Mode B: Manual Stock</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      Pops items from your pasted stock list. Flat pricing per single item.
                    </p>
                  </div>
                </div>

                {/* Conditional Fields based on Delivery Mode */}
                {prodDeliveryMode === 'automated_license' ? (
                  <div className="space-y-4 pt-2">
                    {/* Service Scope selector */}
                    <div>
                      <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                        Target Service Scope (Option C: Discrete Product Binding)
                      </label>
                      <select
                        value={prodServiceScope}
                        onChange={(e) => setProdServiceScope(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                      >
                        <optgroup label="General Access Scope">
                          <option value="all">All Services (All-Access Unlimited Pass)</option>
                        </optgroup>

                        <optgroup label="Bundled Packages">
                          <option value="fivem">
                            FiveM Bundle ({(() => {
                              const fPkg = availablePackages.find((p: any) => p.name?.toLowerCase() === 'fivem bundle');
                              return (fPkg?.services && fPkg.services.length > 0)
                                ? fPkg.services.join(' + ')
                                : 'Rockstar + Steam + Discord + CyberGhost';
                            })()})
                          </option>
                          {availablePackages
                            .filter((pkg: any) => pkg.name?.toLowerCase() !== 'fivem bundle')
                            .map((pkg: any) => {
                              const svcList = Array.isArray(pkg.services) && pkg.services.length > 0 ? ` (${pkg.services.join(' + ')})` : '';
                              return (
                                <option key={pkg.id} value={`package:${pkg.name}`}>
                                  Package: {pkg.name}{svcList}
                                </option>
                              );
                            })}
                        </optgroup>

                        <optgroup label="Dedicated Discrete Services (Single Target Binding)">
                          {availableServices.map((svc: any) => (
                            <option key={svc.id} value={`service:${svc.name}`}>
                              Dedicated: {svc.name} Account Generator
                            </option>
                          ))}
                          <option value="single">Single Service (Generic / Unlocked)</option>
                        </optgroup>
                      </select>
                      <div className="text-[10px] font-mono text-zinc-500 mt-1">
                        Keys generated for this product will link directly to this service or package in <code>license_services</code>.
                      </div>
                    </div>

                    {/* Tier Options & Pricing Matrix */}
                    {prodPricingType === 'tiered' && (
                    <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
                            Multi-Tier Duration & Pricing Options
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Configure duration variants synced with the customer storefront
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProdTierOptions((prev) => [
                              ...prev,
                              {
                                id: 'tier_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
                                tierKey: 'monthly',
                                name: 'Custom Tier',
                                pricePHP: '500.00',
                                discountPercent: '0',
                                dailyLimit: '15'
                              }
                            ]);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-[11px] font-mono font-semibold text-purple-300 transition-all flex items-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add Option</span>
                        </button>
                      </div>

                      {/* Tier Matrix List */}
                      <div className="space-y-2.5">
                        {prodTierOptions.map((opt, idx) => (
                          <div
                            key={opt.id || idx}
                            className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 font-semibold">
                                Tier #{idx + 1}
                              </span>
                              {prodTierOptions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProdTierOptions((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="text-[10px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] font-mono text-zinc-500 block mb-0.5">Duration Key</label>
                                <select
                                  value={opt.tierKey}
                                  onChange={(e) => {
                                    const val = e.target.value as any;
                                    setProdTierOptions((prev) =>
                                      prev.map((item, i) =>
                                        i === idx
                                          ? {
                                              ...item,
                                              tierKey: val,
                                              name: item.name === '1 Day' || item.name === '7 Days' || item.name === '30 Days' || item.name === 'Lifetime'
                                                ? (val === 'daily' ? '1 Day' : val === 'weekly' ? '7 Days' : val === 'monthly' ? '30 Days' : 'Lifetime')
                                                : item.name
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-white focus:outline-none focus:border-purple-500"
                                >
                                  <option value="daily">daily (1 Day)</option>
                                  <option value="weekly">weekly (7 Days)</option>
                                  <option value="monthly">monthly (30 Days)</option>
                                  <option value="lifetime">lifetime (Lifetime)</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] font-mono text-zinc-500 block mb-0.5">Display Label</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 1 Day, 7 Days"
                                  value={opt.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProdTierOptions((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                                    );
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-white focus:outline-none focus:border-purple-500"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-mono text-zinc-500 block mb-0.5">Price PHP (₱) *</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  required
                                  placeholder="50.00"
                                  value={opt.pricePHP}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProdTierOptions((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, pricePHP: val } : item))
                                    );
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-white focus:outline-none focus:border-purple-500"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-mono text-zinc-500 block mb-0.5">Discount %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  value={opt.discountPercent}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProdTierOptions((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, discountPercent: val } : item))
                                    );
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-white focus:outline-none focus:border-purple-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-900 items-center">
                              <div>
                                <label className="text-[10px] font-mono text-zinc-500 block mb-0.5">Daily Limit (gens/day)</label>
                                <input
                                  type="number"
                                  placeholder="15"
                                  value={opt.dailyLimit}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProdTierOptions((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, dailyLimit: val } : item))
                                    );
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                                />
                              </div>

                              <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[10px] font-mono">
                                {(() => {
                                  const p = parseFloat(opt.pricePHP) || 0;
                                  const d = Math.min(100, Math.max(0, parseFloat(opt.discountPercent) || 0));
                                  const finalP = d > 0 ? Math.round(p * (1 - d / 100)) : p;
                                  const approxU = (finalP / (liveFxRate || 58.5)).toFixed(2);
                                  return (
                                    <div className="flex items-center justify-between">
                                      <span>Sale: <strong className="text-white">₱{finalP.toLocaleString()}</strong></span>
                                      <span>≈ <strong className="text-purple-300">${approxU} USD</strong></span>
                                      {d > 0 && <span className="text-emerald-400 font-bold">-{d}%</span>}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-mono text-zinc-400">
                        Available Stocks (One item per line: accounts, keys, or links)
                      </label>
                      <span className="text-[11px] font-mono text-blue-400 font-bold">
                        {prodStockPool.split('\n').filter((s) => s.trim()).length} In Stock
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

              {/* Storefront Specification Badges (4-Card Matrix) */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-purple-400 font-semibold uppercase">
                    Storefront Specification Badges (4-Card Matrix)
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    Shown directly below the product hero visual
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Delivery Mode Label
                    </label>
                    <input
                      type="text"
                      placeholder={prodDeliveryMode === 'stock_pool' ? 'Instant Delivery' : 'Instant License'}
                      value={prodSpecDeliveryLabel}
                      onChange={(e) => setProdSpecDeliveryLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">e.g. Instant Delivery, Direct Stock, Instant License</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Platform
                    </label>
                    <input
                      type="text"
                      placeholder="Windows 10 / 11"
                      value={prodSpecPlatform}
                      onChange={(e) => setProdSpecPlatform(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">e.g. Windows 10 / 11, All Platforms, Browser / Web, Android / iOS</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      {prodDeliveryMode === 'stock_pool' ? 'Stock Unit Label' : 'Daily Quota Label'}
                    </label>
                    <input
                      type="text"
                      placeholder={prodDeliveryMode === 'stock_pool' ? '1 Item per Unit' : '15 Accounts / Day'}
                      value={prodSpecQuotaLabel}
                      onChange={(e) => setProdSpecQuotaLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">e.g. 1 Item per Unit, Instant Dispatch, 25 gens/day</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Access Level Label
                    </label>
                    <input
                      type="text"
                      placeholder="Full Unrestricted"
                      value={prodSpecAccessLevel}
                      onChange={(e) => setProdSpecAccessLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">e.g. Full Unrestricted, Private Account, Lifetime Access</span>
                  </div>
                </div>
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

      {/* ── MODAL 7: SQUARE QR IMAGE CROPPER ── */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageUrl={cropModalImgUrl}
        title={cropModalType === 'gcash' ? 'Adjust GCash QR Frame' : 'Adjust Maya QR Frame'}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        outputSize={800}
      />

      {/* ── MODAL 8: ORDER DETAIL INSPECTION POP-UP ── */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-3xl rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Eye className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-mono font-bold text-white">Order Inspector</h3>
                  <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold border ${
                    selectedOrderForModal.status === 'delivered'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : selectedOrderForModal.status === 'pending'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : selectedOrderForModal.status === 'awaiting_payment'
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                      : selectedOrderForModal.status === 'rejected'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}>
                    {selectedOrderForModal.status}
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-500 flex items-center gap-2 pt-0.5">
                  <span>ID: <code className="text-zinc-300 select-all">{selectedOrderForModal.id}</code></span>
                  <span>•</span>
                  <span>{new Date(selectedOrderForModal.created_at).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedOrderForModal(null);
                  setShowRejectForm(false);
                }}
                className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid 1: Customer & Payment Rail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 font-mono text-xs">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">Customer Information</span>
                <div className="text-white font-semibold truncate">
                  {selectedOrderForModal.email?.includes('@discord.asyncdevph.xyz') || selectedOrderForModal.email?.includes('@discord.user')
                    ? 'Discord Account'
                    : selectedOrderForModal.email}
                </div>
                <div className="text-zinc-400 text-[11px]">Discord ID: {selectedOrderForModal.discord_id || 'Not linked / Web Buyer'}</div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 font-mono text-xs">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">Payment Channel</span>
                <div className="text-purple-300 font-bold">{selectedOrderForModal.provider_label || selectedOrderForModal.provider}</div>
                <div className="text-zinc-400 text-[11px]">Currency: {selectedOrderForModal.currency}</div>
              </div>
            </div>

            {/* Items Roster */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold block">Purchased Items</span>
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                {Array.isArray(selectedOrderForModal.payment_details?.cart_items) && selectedOrderForModal.payment_details.cart_items.length > 0 ? (
                  selectedOrderForModal.payment_details.cart_items.map((ci: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs font-mono py-1 border-b border-zinc-800/50 last:border-0">
                      <div>
                        <div className="text-white font-bold">{ci.title || 'Product'}</div>
                        <div className="text-[11px] text-zinc-400">{ci.tierName || ci.tierKey} × {ci.quantity || 1}</div>
                      </div>
                      <div className="text-zinc-200 font-semibold">
                        {selectedOrderForModal.currency === 'PHP' ? '₱' : '$'}{(Number(selectedOrderForModal.currency === 'USD' ? ci.priceUSD : ci.pricePHP) * (ci.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="text-white font-bold">{selectedOrderForModal.products?.title || (selectedOrderForModal.order_type === 'balance_topup' ? 'Web Balance Top-Up' : 'ASYNC Product License')}</div>
                      <div className="text-[11px] text-zinc-400">{selectedOrderForModal.tier_key || 'Standard Tier'}</div>
                    </div>
                    <div className="text-zinc-200 font-semibold">
                      {selectedOrderForModal.currency === 'PHP' ? '₱' : '$'}{Number(selectedOrderForModal.amount).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ledger Breakdown */}
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2 font-mono text-xs">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">Financial Breakdown</span>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Base Subtotal</span>
                <span>{selectedOrderForModal.currency === 'PHP' ? '₱' : '$'}{Number(selectedOrderForModal.payment_details?.base_amount || selectedOrderForModal.amount).toFixed(2)}</span>
              </div>

              {selectedOrderForModal.payment_details?.coupon_code && (
                <div className="flex items-center justify-between text-emerald-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span>Applied Coupon</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[10px]">
                      {selectedOrderForModal.payment_details.coupon_code}
                    </span>
                  </span>
                  <span>-{selectedOrderForModal.currency === 'PHP' ? '₱' : '$'}{Number(selectedOrderForModal.payment_details.discount_amount || 0).toFixed(2)}</span>
                </div>
              )}

              {Number(selectedOrderForModal.payment_details?.fee_amount || 0) > 0 && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Gateway Surcharge (+{selectedOrderForModal.payment_details?.fee_percent}%)</span>
                  <span className="text-amber-400">+{selectedOrderForModal.currency === 'PHP' ? '₱' : '$'}{Number(selectedOrderForModal.payment_details.fee_amount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800">
                <span>Total Amount Due</span>
                <span className="text-purple-400">{selectedOrderForModal.currency === 'PHP' ? '₱' : '$'}{Number(selectedOrderForModal.amount).toFixed(2)} {selectedOrderForModal.currency}</span>
              </div>
            </div>

            {/* Verification Proof & Customer Ref */}
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2 font-mono text-xs">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">Payment Verification & Proof</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-zinc-500">Customer Submitted Ref / TxID:</span>
                  <div className="text-white font-bold text-xs mt-0.5 select-all p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    {selectedOrderForModal.payment_details?.customer_reference || 'None submitted yet'}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500">Assigned Memo / Ref Code:</span>
                  <div className="text-amber-300 font-bold text-xs mt-0.5 select-all p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    {selectedOrderForModal.payment_details?.paypal_note || selectedOrderForModal.payment_details?.ref_code || 'N/A'}
                  </div>
                </div>
              </div>

              {selectedOrderForModal.license_key && (
                <div className="pt-2 border-t border-zinc-800/50">
                  <span className="text-zinc-500 text-[10px] block mb-1">Delivered Cryptographic License Key:</span>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                    <span className="select-all truncate mr-2">{selectedOrderForModal.license_key}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrderForModal.license_key);
                        alert('License key copied to clipboard!');
                      }}
                      className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {selectedOrderForModal.payment_details?.rejection_reason && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                  Rejection Reason: {selectedOrderForModal.payment_details.rejection_reason}
                </div>
              )}
            </div>

            {/* Administrative Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
              <div className="flex items-center gap-2">
                {(selectedOrderForModal.status === 'pending' || selectedOrderForModal.status === 'awaiting_payment') && (
                  <>
                    <button
                      onClick={async () => {
                        await handleApproveOrder(selectedOrderForModal.id);
                        setSelectedOrderForModal(null);
                      }}
                      disabled={processingOrderId === selectedOrderForModal.id}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/50 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedOrderForModal.order_type === 'balance_topup' ? 'Approve & Credit Balance' : 'Approve & Dispatch Key'}</span>
                    </button>

                    <button
                      onClick={() => setShowRejectForm(!showRejectForm)}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-mono font-medium transition-colors cursor-pointer"
                    >
                      <span>Reject...</span>
                    </button>

                    <button
                      onClick={async () => {
                        await handleCancelOrder(selectedOrderForModal.id);
                        setSelectedOrderForModal(null);
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                    >
                      <span>Cancel Order</span>
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedOrderForModal(null);
                  setShowRejectForm(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono cursor-pointer"
              >
                Close Inspector
              </button>
            </div>

            {/* Inline Reject Form */}
            {showRejectForm && (
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3 pt-3">
                <span className="text-xs font-mono font-bold text-rose-300 block">Reject Payment with Reason:</span>
                <input
                  type="text"
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="e.g. Reference number not found in bank ledger"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-rose-500/40 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 text-xs font-mono text-zinc-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!rejectReasonInput.trim()) return;
                      await handleRejectOrder(selectedOrderForModal.id);
                      setSelectedOrderForModal(null);
                      setShowRejectForm(false);
                      setRejectReasonInput('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-mono font-bold text-white"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 9: CREATE COUPON MODAL ── */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Tag className="w-4 h-4" />
                </span>
                <span className="text-sm font-mono font-bold text-white">Create Promo Code</span>
              </div>
              <button
                onClick={() => setShowCreateCouponModal(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold mb-1.5">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  value={couponFormCode}
                  onChange={(e) => setCouponFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="e.g. FLASH20"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 uppercase tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={couponFormType}
                    onChange={(e: any) => setCouponFormType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₱)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold mb-1.5">
                    Discount Value {couponFormType === 'percent' ? '(%)' : '(₱)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={couponFormValue}
                    onChange={(e) => setCouponFormValue(e.target.value)}
                    placeholder={couponFormType === 'percent' ? '10' : '50'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold mb-1.5">
                    Min Spend (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={couponFormMinSpend}
                    onChange={(e) => setCouponFormMinSpend(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold mb-1.5">
                    Max Uses (Optional)
                  </label>
                  <input
                    type="number"
                    value={couponFormMaxUses}
                    onChange={(e) => setCouponFormMaxUses(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="text-[11px] font-mono text-zinc-500 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
                Notice: Coupons automatically exclude items in cart that are already on sale or discounted.
              </div>

              {couponError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-400">
                  {couponError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setShowCreateCouponModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  {savingCoupon ? 'Creating...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
