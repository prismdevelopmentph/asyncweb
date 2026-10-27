'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';
import { supabase } from '@/lib/supabase';
import {
  Copy,
  Search,
  Clock,
  Info,
  ChevronDown,
  Sparkles,
  Key,
  RefreshCw,
  Lock,
  LogIn,
  X,
  CheckCircle2,
  Download,
  ShieldCheck,
  Shield,
  ArrowUpRight,
  Zap,
  Star,
  MessageSquare
} from 'lucide-react';

// --- Redeem Key Configuration ---
const REDEEM_BASE_URL = (process.env.NEXT_PUBLIC_REDEEM_TARGET_URL || 'https://netflix.com').replace(/\/+$/, '');

function parseAndSortTokens(rawToken: unknown): string[] {
  let list: string[] = [];
  if (Array.isArray(rawToken)) {
    list = rawToken.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof rawToken === 'string') {
    list = rawToken.split(/[\r\n]+/).map((t) => t.trim()).filter(Boolean);
  }
  return list.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function getDeviceUrl(token: string, device: 'pc' | 'phone' | 'tv'): string {
  const enc = encodeURIComponent(token);
  if (device === 'phone') return `${REDEEM_BASE_URL}/unsupported?nftoken=${enc}`;
  if (device === 'tv') return `${REDEEM_BASE_URL}/tv2?nftoken=${enc}`;
  return `${REDEEM_BASE_URL}/?nftoken=${enc}`;
}

// --- Official Brand Icon Components (SimpleIcons Vectors) ---
const SteamIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.265 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.057a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.793 8.18 1.793 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
);

const RockstarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.971 6.816h3.241c1.469 0 2.741-.448 2.741-2.084 0-1.3-1.117-1.576-2.19-1.576H6.748l-.777 3.66Zm12.834 8.753h5.168l-4.664 3.228.755 5.087-4.041-3.07L10.599 24l2.536-5.392s-2.95-3.075-2.947-3.075c-.198-.262-.265-.936-.265-1.226 0-.367.024-.739.049-1.134.028-.451.058-.933.058-1.476 0-1.338-.59-2.038-2.036-2.038H5.283l-1.18 5.525H.026L3.269 0h7.672c2.852 0 5.027.702 5.027 3.936 0 2.276-1.12 3.894-3.592 4.233v.045c1.162.276 1.598 1.062 1.598 2.527 0 .585-.018 1.098-.034 1.581-.015.428-.03.834-.03 1.243 0 .525.137 1.382.48 1.968h.567l3.028-5.06.82 5.096Zm-1.233-2.948-2.187 3.654h-3.457l2.103 2.189-1.73 3.672 3.777-2.218 2.976 2.263-.553-3.731 3.093-2.139h-3.43l-.592-3.69Z" />
  </svg>
);

const NetflixIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="m5.398 0 8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398zm8.489 0v9.172l4.715 13.33V0h-4.715zM5.398 1.5V24c1.873-.225 2.81-.312 4.715-.398V14.83L5.398 1.5z" />
  </svg>
);

const CyberGhostIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.705 2.349a4.874 4.874 0 00-4.39 2.797L6.033 7.893h14.606c.41 0 .692.308.692.668 0 .359-.282.666-.692.666H2.592L0 14.772h2.824c-.796 1.72-1.002 2.567-1.002 3.26 0 2.105 1.72 3.62 4.416 3.62h8.239c1.771 0 3.337-1.412 3.337-3.03 0-1.411-1.206-2.515-2.772-2.515H5.596c-.873 0-1.284-.59-.924-1.335h11.859c4.004 0 7.469-3.029 7.469-6.802 0-3.183-2.618-5.621-6.16-5.621z" />
  </svg>
);

const ValorantIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.053 0l7.632 17.509h-3.41L.643 0h3.41zm15.894 0L12.316 17.509h3.41L23.357 0h-3.41zM11.973 24l-3.864-8.868h7.728L11.973 24z" />
  </svg>
);

// --- Client-Side RFC 6238 TOTP Generator (SHA-1, 6-Digits, 30s Period) ---
function base32ToArrayBuffer(base32: string): ArrayBuffer {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const u8 = new Uint8Array(output.length);
  u8.set(output);
  return u8.buffer as ArrayBuffer;
}

function intToArrayBuffer(num: number): ArrayBuffer {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, Math.floor(num / 0x100000000), false);
  view.setUint32(4, num >>> 0, false);
  return buffer;
}

async function generateTotpCode(secretBase32: string): Promise<string> {
  try {
    if (typeof window === 'undefined' || !window.crypto?.subtle) return '';
    const keyBuffer = base32ToArrayBuffer(secretBase32);
    if (keyBuffer.byteLength === 0) return '';

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const epoch = Math.floor(Date.now() / 1000);
    const step = Math.floor(epoch / 30);
    const counterBuffer = intToArrayBuffer(step);

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const hmac = new Uint8Array(signature);

    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  } catch {
    return '';
  }
}

// --- Types & Cache ---
interface HistoryItem {
  id: string;
  service: string;
  date: string;
  dataText: string;
}

const STOCK_CACHE_KEY = 'generator_stock_cache';
const CACHE_TTL_MS = 60_000; // 1 minute

const defaultStock = {
  steam: 0,
  discord: 0,
  rockstar: 0,
  cyberghost: 0,
  netflix: 0,
  valorant: 0,
};

function readStockCache(): typeof defaultStock | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STOCK_CACHE_KEY);
    if (!raw) return null;
    const { ts, stock } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return stock;
  } catch {
    return null;
  }
}

function writeStockCache(stock: typeof defaultStock) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STOCK_CACHE_KEY, JSON.stringify({ ts: Date.now(), stock }));
  } catch {}
}

export default function AccountGeneratorPage() {
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Live Generator State
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Account Generated Popup Modal State
  const [generatedModal, setGeneratedModal] = useState<{
    service: string;
    dataText: string;
  } | null>(null);

  // License Activation Modal State
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [licenseInput, setLicenseInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);

  const [userPlan, setUserPlan] = useState<{
    hasPlan: boolean;
    name: string;
    expiresAt: string | null;
    dailyUsed: number;
    dailyLimit: number;
    allowedServices?: string[] | 'all';
    vouchGiven?: boolean;
    licenseId?: string | null;
    licenses?: Array<{
      id: string;
      licenseKey: string;
      tier: string;
      quotaMode: 'isolated' | 'shared';
      dailyLimit: number;
      usedToday: number;
      remainingToday: number;
      expiresAt: string | null;
      services: string[];
    }>;
    serviceQuotas?: Record<string, {
      serviceName: string;
      isUnlocked: boolean;
      isolatedLimit: number;
      isolatedUsed: number;
      isolatedRemaining: number;
      sharedAvailable: number;
      totalAvailable: number;
      licenseKeys?: string[];
    }>;
  }>({
    hasPlan: false,
    name: 'No active plan',
    expiresAt: null,
    dailyUsed: 0,
    dailyLimit: 0,
    allowedServices: [],
    vouchGiven: true,
    licenseId: null,
    licenses: [],
    serviceQuotas: {}
  });

  // Vouch / Customer Review Modal State
  const [showVouchModal, setShowVouchModal] = useState(false);
  const [pendingVouchService, setPendingVouchService] = useState<{ serviceName: string; currentStock: number } | null>(null);
  const [vouchRating, setVouchRating] = useState<number>(5);
  const [vouchComment, setVouchComment] = useState<string>('');
  const [isSubmittingVouch, setIsSubmittingVouch] = useState(false);
  const [vouchError, setVouchError] = useState<string | null>(null);

  const [stock, setStock] = useState<typeof defaultStock>(() => readStockCache() ?? defaultStock);
  const [stockLoading, setStockLoading] = useState(() => readStockCache() === null);

  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);

  // UI Component States
  const [historySearch, setHistorySearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Get Discord User ID
  const discordUserId = useMemo(() => {
    if (!user) return null;
    return user.user_metadata?.provider_id || user.user_metadata?.sub || user.id;
  }, [user]);

  const [downloadingClient, setDownloadingClient] = useState(false);

  // 2FA Authenticator States
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpSecondsLeft, setTotpSecondsLeft] = useState(30);

  // Redeem Key States
  const [redeemKeyInput, setRedeemKeyInput] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccessData, setRedeemSuccessData] = useState<{
    email_pass?: string;
    key_code?: string;
    expires_in?: string;
    tokens: string[];
  } | null>(null);
  const [activeDevice, setActiveDevice] = useState<'pc' | 'phone' | 'tv'>('pc');

  const handleRedeemKey = async () => {
    const key = redeemKeyInput.trim().toUpperCase();
    if (!key) return;

    setRedeemLoading(true);
    setRedeemError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setRedeemError('Please log in with Discord first.');
        setRedeemLoading(false);
        return;
      }

      const res = await fetch('/api/verify-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key })
      });

      if (!res.ok) {
        if (res.status === 401) {
          setRedeemError('Session expired. Please log in again.');
        } else {
          const errData = await res.json().catch(() => ({}));
          setRedeemError(errData.error || errData.message || 'Connection failed.');
        }
        setRedeemLoading(false);
        return;
      }

      const data = await res.json();
      const isSuccess = data.success === true || String(data.success).toLowerCase() === 'true';

      if (isSuccess && data.token) {
        const sorted = parseAndSortTokens(data.token);
        setRedeemSuccessData({
          email_pass: data.email_pass,
          key_code: data.key_code,
          expires_in: data.expires_in,
          tokens: sorted
        });
        setRedeemError(null);
      } else {
        setRedeemError(data.error || data.message || 'Invalid activation key.');
      }
    } catch {
      setRedeemError('Connection failed.');
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleResetRedeem = () => {
    setRedeemKeyInput('');
    setRedeemSuccessData(null);
    setRedeemError(null);
    setActiveDevice('pc');
  };

  // Browser Tab Title
  useEffect(() => {
    document.title = 'Generator Panel | ASYNC DEVELOPMENT';
  }, []);

  // Real-time 2FA Code generator & countdown ticker
  useEffect(() => {
    let mounted = true;

    const updateTotp = async () => {
      const sec = 30 - (Math.floor(Date.now() / 1000) % 30);
      if (mounted) setTotpSecondsLeft(sec);

      const cleanKey = totpSecret.replace(/[\s-]/g, '').toUpperCase();
      if (!cleanKey) {
        if (mounted) setTotpCode('');
        return;
      }

      const code = await generateTotpCode(cleanKey);
      if (mounted) setTotpCode(code);
    };

    updateTotp();
    const interval = setInterval(updateTotp, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [totpSecret]);

  const handleDownloadApp = async () => {
    if (authLoading) {
      triggerToast('Initializing account session, please wait...');
      return;
    }
    if (!discordUserId) {
      triggerToast('Please log in with Discord first.');
      return;
    }
    if (!userPlan.hasPlan) {
      triggerToast('Active license plan required to download the desktop app.');
      return;
    }

    setDownloadingClient(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        triggerToast('Session expired. Please log in again.');
        setDownloadingClient(false);
        return;
      }

      const res = await fetch('/api/download/ticket', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        triggerToast(errJson.error || 'Failed to generate download ticket.');
        setDownloadingClient(false);
        return;
      }

      const data = await res.json();
      if (data.downloadUrl) {
        window.location.href = data.downloadUrl;
      } else {
        triggerToast('Could not resolve download ticket.');
      }
    } catch (err) {
      console.error('[Download App Error]:', err);
      triggerToast('Failed to start download. Please try again.');
    } finally {
      setTimeout(() => setDownloadingClient(false), 3000);
    }
  };

  // Fast Parallel Status Fetcher
  const fetchStatus = useCallback(async (_uid?: string | null) => {
    setLoadingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/generator/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.userPlan) setUserPlan(data.userPlan);
        if (data.stock) {
          setStock(data.stock);
          writeStockCache(data.stock);
        }
        if (Array.isArray(data.history)) setHistoryList(data.history);
      }
    } catch (err) {
      console.error('[Generator Page] Error fetching status:', err);
    } finally {
      setLoadingStatus(false);
      setStockLoading(false);
    }
  }, []);

  // License Activation Handler
  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = licenseInput.trim().toUpperCase();
    if (!cleanKey || activating) return;

    if (!user) {
      triggerToast('Please log in with Discord first');
      return;
    }

    if (!cleanKey.startsWith('LIC-')) {
      setActivationError('Invalid format. License keys must start with LIC- (e.g. LIC-XXXX-XXXX-XXXX)');
      return;
    }

    setActivating(true);
    setActivationError(null);
    setActivationSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/generator/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          key: cleanKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActivationError(data.error || 'Failed to activate license key.');
      } else {
        setActivationSuccess(data.message || 'License activated successfully!');
        setLicenseInput('');
        triggerToast(data.message || 'License activated!');
        if (discordUserId) {
          await fetchStatus(discordUserId);
        }
        setTimeout(() => {
          setActivateModalOpen(false);
          setActivationSuccess(null);
        }, 1600);
      }
    } catch (err: any) {
      setActivationError(err.message || 'Network error activating license.');
    } finally {
      setActivating(false);
    }
  };

  // Block background scrolling and handle Escape key when Modal is open
  useEffect(() => {
    if (generatedModal || activateModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setGeneratedModal(null);
          setActivateModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [generatedModal, activateModalOpen]);

  // Single Mount Execution: Resolve auth session then fetch status once with Discord ID
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;

      setUser(user);
      setAuthLoading(false);

      const discordId = user
        ? (user.user_metadata?.provider_id || user.user_metadata?.sub || user.id)
        : null;

      await fetchStatus(discordId);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const sUser = session?.user ?? null;
      setUser(sUser);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchStatus]);

  // User Login Handler
  const handleDiscordLogin = () => {
    setAuthLoading(true);
    window.location.href = '/login?redirect=/generator';
  };

  const handleSubmitVouch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanComment = vouchComment.trim();
    if (!cleanComment || cleanComment.length < 2) {
      setVouchError('Please submit a true review to continue generating.');
      return;
    }

    setIsSubmittingVouch(true);
    setVouchError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: discordUserId,
          licenseId: userPlan.licenseId,
          rating: vouchRating,
          comment: cleanComment,
          serviceName: pendingVouchService?.serviceName || 'Acc Gen',
          avatarUrl: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setUserPlan(prev => ({ ...prev, vouchGiven: true }));
      setShowVouchModal(false);
      triggerToast('Review verified! Continuing generation...');

      if (pendingVouchService) {
        const { serviceName, currentStock } = pendingVouchService;
        setPendingVouchService(null);
        handleClaimAccount(serviceName, currentStock, true);
      }
    } catch (err: any) {
      setVouchError(err.message || 'Error submitting review.');
    } finally {
      setIsSubmittingVouch(false);
    }
  };

  // Account Claim / Generation Handler
  const handleClaimAccount = async (serviceName: string, currentStock: number, bypassVouchCheck = false) => {
    if (!user) {
      triggerToast('Please log in with Discord first');
      return;
    }

    if (!userPlan.hasPlan) {
      triggerToast('No active plan found. Redeem a key or check roles.');
      return;
    }

    if (currentStock <= 0) {
      triggerToast(`${serviceName} is currently out of stock`);
      return;
    }

    // Customer Review Gate: If false, user must submit a true review before continuing
    if (!bypassVouchCheck && userPlan.vouchGiven === false) {
      setPendingVouchService({ serviceName, currentStock });
      setVouchComment('');
      setVouchRating(5);
      setVouchError(null);
      setShowVouchModal(true);
      return;
    }

    if (claiming) return;

    setClaiming(true);
    triggerToast(`Generating ${serviceName} account...`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/generator/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          serviceName
        })
      });

      const contentType = res.headers.get('content-type') || '';
      let json: any = {};
      if (contentType.includes('application/json')) {
        json = await res.json().catch(() => ({}));
      } else {
        json = { error: 'Security Lockout Active. Refresh the page or appeal on Discord.' };
      }

      if (!res.ok) {
        triggerToast(json.error || `Failed to generate ${serviceName}`);
      } else {
        // Open Popup Modal with raw account details
        setGeneratedModal({
          service: json.service || serviceName,
          dataText: json.accountData
        });
        triggerToast(`Successfully generated ${serviceName} account!`);
        fetchStatus(discordUserId);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error claiming account.');
    } finally {
      setClaiming(false);
    }
  };

  // Copy text helper
  const handleCopyText = (text: string, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    triggerToast(label);
  };

  // Services Config Grid (Steam, Discord, Rockstar, CyberGhost, Netflix, Valorant)
  const servicesConfig = [
    {
      id: 'steam',
      name: 'Steam',
      icon: SteamIcon,
      leftCount: stock.steam,
      color: 'text-[#66c0f4]',
      bgGlow: 'hover:border-[#66c0f4]/50 hover:shadow-[0_0_20px_rgba(102,192,244,0.15)]'
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: DiscordIcon,
      leftCount: stock.discord,
      color: 'text-[#5865f2]',
      bgGlow: 'hover:border-[#5865f2]/50 hover:shadow-[0_0_20px_rgba(88,101,242,0.15)]'
    },
    {
      id: 'rockstar',
      name: 'Rockstar',
      icon: RockstarIcon,
      leftCount: stock.rockstar,
      color: 'text-[#ffab00]',
      bgGlow: 'hover:border-[#ffab00]/50 hover:shadow-[0_0_20px_rgba(255,171,0,0.15)]'
    },
    {
      id: 'cyberghost',
      name: 'CyberGhost',
      icon: CyberGhostIcon,
      leftCount: stock.cyberghost,
      color: 'text-[#10b981]',
      bgGlow: 'hover:border-[#10b981]/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]'
    },
    {
      id: 'netflix',
      name: 'Netflix',
      icon: NetflixIcon,
      leftCount: stock.netflix,
      color: 'text-[#e50914]',
      bgGlow: 'hover:border-[#e50914]/50 hover:shadow-[0_0_20px_rgba(229,9,20,0.15)]'
    },
    {
      id: 'valorant',
      name: 'Valorant',
      icon: ValorantIcon,
      leftCount: stock.valorant,
      color: 'text-[#ff4655]',
      bgGlow: 'hover:border-[#ff4655]/50 hover:shadow-[0_0_20px_rgba(255,70,85,0.15)]'
    }
  ];

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      const matchesType = typeFilter === 'all' || item.service.toLowerCase().includes(typeFilter.toLowerCase());
      const matchesSearch =
        !historySearch.trim() ||
        item.service.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.dataText.toLowerCase().includes(historySearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [historyList, typeFilter, historySearch]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-hidden font-sans selection:bg-purple-600 selection:text-white dev-grid-bg">
      
      {/* Top Header Navigation */}
      <Navbar />

      {/* Main Workspace Canvas */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        
        {/* Session Loading Spinner */}
        {authLoading ? (
          <div className="py-28 flex flex-col items-center justify-center text-center">
            <div className="w-9 h-9 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
            <span className="text-xs font-mono text-zinc-400 tracking-wider">
              Verifying credentials...
            </span>
          </div>
        ) : !user ? (
          /* Dedicated Split-Screen Showcase & Authentication Gateway */
          <div className="py-4 sm:py-8 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: ASYNC Infrastructure Showcase */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                {/* Status Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-mono mb-5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="tracking-wider uppercase">ASYNC TOOLS // CLOUD INFRASTRUCTURE</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white font-sans leading-[1.15]">
                  Instant Digital <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-400">
                    Account Delivery
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="max-w-xl text-zinc-400 text-sm sm:text-base mb-2 leading-relaxed font-normal">
                  Receive your account details instantly across supported gaming and entertainment services. Built for fast delivery, real-time availability, and a smooth access experience.
                </p>

                {/* Live Platform Ecosystem Badges */}
                <div className="mt-8 pt-6 border-t border-zinc-800/80">
                  <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    Supported Platforms & Ecosystems
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {servicesConfig.map((svc) => {
                      const IconComp = svc.icon;
                      return (
                        <div
                          key={svc.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                        >
                          <div className={`w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 ${svc.color}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-200 truncate">{svc.name}</div>
                            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-400" />
                              Active Pool
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Link to Store Card */}
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
                        <span>Need license keys? Visit our store</span>
                        <span className="text-purple-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        Get instant access to tier licenses and generator quotas at asyncdevph.xyz
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

              {/* Right Column: Sleek Auth Gateway */}
              <div className="lg:col-span-5">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/15 via-zinc-900/10 to-transparent rounded-3xl blur-2xl opacity-75" />

                  <div className="relative bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-purple-950/10 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-purple-400">
                        <Lock className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        OAuth Gateway
                      </div>
                    </div>

                    <h2 className="text-xl font-bold tracking-tight text-white mb-2">
                      Sign in to your account
                    </h2>
                    <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                      Sign in with your username or email to access your active generator keys, inventory queues, and account history.
                    </p>

                    <button
                      onClick={handleDiscordLogin}
                      className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-150 shadow-[0_0_20px_rgba(147,51,234,0.35)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] active:scale-[0.99] cursor-pointer font-mono"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In with Credentials</span>
                    </button>

                    <p className="mt-3.5 text-center text-xs text-zinc-400">
                      Don&apos;t have credentials?{' '}
                      <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                        Create an account
                      </Link>
                    </p>

                    {/* Security Notice */}
                    <div className="mt-6 pt-5 border-t border-zinc-800/80 space-y-2.5">
                      <div className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed">
                        <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span>Secured session</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 leading-relaxed font-mono">
                        By signing in, you agree to our Terms of Service. Generator access is restricted to authorized license holders.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Status Ribbon */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/80 rounded-2xl p-4 sm:p-5 border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight text-white">
                      Account Generator
                    </h1>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">
                    Instant multi-service account generation & license key manager
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="font-mono text-[11px] uppercase tracking-wider">Engine Online</span>
                </div>

                {userPlan.hasPlan ? (
                  <button
                    onClick={handleDownloadApp}
                    disabled={downloadingClient}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 hover:text-white font-mono font-medium transition-colors shadow-sm disabled:opacity-50"
                    title="Download Desktop App (ASYNC V2)"
                  >
                    <Download className={`w-3.5 h-3.5 text-purple-400 ${downloadingClient ? 'animate-bounce' : ''}`} />
                    <span>{downloadingClient ? 'Downloading...' : 'Download App'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => triggerToast('Active license plan required to download the desktop app.')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 text-xs text-zinc-500 font-mono font-medium cursor-not-allowed opacity-75 hover:border-zinc-700/50"
                    title="Active license required to download"
                  >
                    <Lock className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Download App</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setActivationError(null);
                    setActivationSuccess(null);
                    setActivateModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs text-purple-200 hover:text-white font-mono font-medium transition-colors shadow-sm"
                  title="Activate or Redeem a License Key"
                >
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  <span>Activate License</span>
                </button>

                <button
                  onClick={() => fetchStatus(discordUserId)}
                  disabled={loadingStatus}
                  className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
                  title="Refresh Records"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin text-purple-400' : ''}`} />
                </button>
              </div>
            </div>
            
            {/* Panel 1: Generator Main Panel */}
            <section className="bg-zinc-950/80 rounded-2xl p-6 sm:p-8 border border-zinc-800">
              
              {/* Header Title & Active Plan */}
              <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Generator Services</h2>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">
                      {loadingStatus ? (
                        <span className="inline-block w-28 h-3.5 bg-zinc-800 rounded animate-pulse" />
                      ) : userPlan.hasPlan ? (
                        <span className="text-purple-300 font-semibold">{userPlan.name} · Expiry: {userPlan.expiresAt || 'Never'}</span>
                      ) : (
                        <span>No active plan</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-License Stacked Quota Tray */}
              {userPlan.hasPlan && userPlan.licenses && userPlan.licenses.length > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                      Bound Licenses ({userPlan.licenses.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {userPlan.licenses.map((lic) => {
                      const pct = lic.dailyLimit > 0 ? Math.min(100, Math.round((lic.usedToday / lic.dailyLimit) * 100)) : 0;
                      return (
                        <div key={lic.id} className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between gap-2">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                              <div className="font-mono text-xs font-bold text-white truncate select-all">
                                {lic.licenseKey}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                  {lic.tier}
                                </span>
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                                  {lic.quotaMode}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                              {lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Lifetime'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-zinc-400 truncate max-w-[130px]">
                                {lic.services.join(', ')}
                              </span>
                              <span className={pct >= 100 ? 'text-rose-400 font-bold' : 'text-zinc-300'}>
                                {lic.usedToday}/{lic.dailyLimit}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                              <div
                                className={"h-full transition-all " + (pct >= 100 ? "bg-rose-500" : pct >= 75 ? "bg-amber-400" : "bg-purple-500")}
                                style={{ width: pct + "%" }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* 6 Core Service Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
                  {servicesConfig.map((svc) => {
                    const IconComp = svc.icon;
                    const isOutOfStock = svc.leftCount === 0;
                    const svcKey = svc.name.toLowerCase();
                    const quotaInfo = userPlan.serviceQuotas?.[svcKey] || userPlan.serviceQuotas?.[svc.id.toLowerCase()];
                    const isCoveredByPlan = userPlan.hasPlan && (
                      userPlan.allowedServices === 'all' ||
                      (Array.isArray(userPlan.allowedServices) && (
                        userPlan.allowedServices.includes(svc.id) ||
                        userPlan.allowedServices.includes(svcKey)
                      )) ||
                      (quotaInfo ? quotaInfo.isUnlocked : false)
                    );
                    const isQuotaExhausted = quotaInfo ? quotaInfo.totalAvailable <= 0 : false;
                    const canClaim = isCoveredByPlan && !isQuotaExhausted;

                    return (
                      <button
                        key={svc.id}
                        disabled={claiming || !canClaim}
                        onClick={() => handleClaimAccount(svc.name, svc.leftCount)}
                        className={`p-4 rounded-xl border border-zinc-800/80 flex flex-col items-center justify-center text-center transition-all duration-150 group relative ${
                          !isCoveredByPlan
                            ? 'opacity-35 grayscale-[50%] cursor-not-allowed bg-zinc-950'
                            : isQuotaExhausted
                            ? 'opacity-50 border-rose-500/30 bg-rose-950/10 cursor-not-allowed'
                            : isOutOfStock && !stockLoading
                            ? 'opacity-60 bg-zinc-950 hover:bg-zinc-900/60 cursor-pointer'
                            : 'bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 hover:-translate-y-0.5 cursor-pointer'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center mb-2.5 ${svc.color}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-semibold text-white group-hover:text-zinc-200 transition-colors truncate w-full">
                          {svc.name}
                        </div>

                        {/* Stock count + Quota Headroom badge */}
                        <div className="flex flex-col items-center gap-0.5 mt-1 w-full">
                          <div className={`text-[11px] font-mono font-medium ${isOutOfStock && !stockLoading ? 'text-rose-400 font-semibold' : 'text-zinc-400'}`}>
                            {stockLoading ? (
                              <span className="inline-block w-8 h-3.5 bg-zinc-800 rounded animate-pulse mt-0.5" />
                            ) : isOutOfStock ? (
                              '0 left'
                            ) : (
                              `${svc.leftCount.toLocaleString()} left`
                            )}
                          </div>
                          {!isCoveredByPlan ? (
                            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 mt-1">
                              Locked
                            </span>
                          ) : isQuotaExhausted ? (
                            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold mt-1">
                              Daily Limit Reached
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2FA Authenticator Tool Bar (Option B) */}
              <div className="mt-5 p-3 sm:p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-inner">
                {/* Left: Title & Icon */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-white tracking-wide">
                    2FA Authenticator
                  </div>
                </div>

                {/* Middle: Secret Input Box */}
                <div className="relative flex-1 max-w-xl">
                  <input
                    type="text"
                    value={totpSecret}
                    onChange={(e) => setTotpSecret(e.target.value.replace(/[\s-]/g, '').toUpperCase())}
                    placeholder="Paste 2FA Secret Key (e.g. 5P5VWCZF4RAZKCG...)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors pr-8 select-all"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  {totpSecret && (
                    <button
                      onClick={() => {
                        setTotpSecret('');
                        setTotpCode('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Clear key"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Right: Code Display & Countdown & Copy Button */}
                <div className="flex items-center gap-2 shrink-0 justify-end">
                  {totpCode ? (
                    <div className="flex items-center gap-2.5 bg-zinc-950 border border-emerald-500/40 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                      <span className="font-mono text-base font-black text-emerald-400 tracking-wider">
                        {totpCode.slice(0, 3)} {totpCode.slice(3)}
                      </span>
                      <div
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          totpSecondsLeft <= 5
                            ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                        title="Seconds remaining"
                      >
                        {totpSecondsLeft}s
                      </div>
                      <button
                        onClick={() => handleCopyText(totpCode, 'Copied 2FA Code!')}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        title="Copy 6-digit code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-zinc-500 px-3 py-2 bg-zinc-950/60 border border-zinc-800/60 rounded-lg">
                      {totpSecret ? 'Invalid Secret Key' : 'Waiting for 2FA key...'}
                    </div>
                  )}
                </div>
              </div>

              {/* Redeem Key Card */}
              <div className="mt-5 p-3 sm:p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col gap-3 shadow-inner">
                {!redeemSuccessData ? (
                  <>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                      {/* Left: Title & Icon */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                          <Key className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-white tracking-wide">
                          Redeem Key
                        </div>
                      </div>

                      {/* Middle: Input Box */}
                      <div className="relative flex-1 max-w-xl">
                        <input
                          type="text"
                          value={redeemKeyInput}
                          onChange={(e) => setRedeemKeyInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleRedeemKey();
                            }
                          }}
                          placeholder="KEY-XXXX-XXXX-XXXX"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500/50 transition-colors uppercase select-all"
                          spellCheck={false}
                          autoComplete="off"
                          disabled={redeemLoading}
                        />
                        {redeemKeyInput && !redeemLoading && (
                          <button
                            type="button"
                            onClick={() => setRedeemKeyInput('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            title="Clear input"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Right: Submit Button */}
                      <div className="flex items-center gap-2 shrink-0 justify-end">
                        <button
                          type="button"
                          onClick={handleRedeemKey}
                          disabled={redeemLoading || !redeemKeyInput.trim()}
                          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-900 disabled:text-zinc-600 border border-rose-500/30 disabled:border-zinc-800 text-xs text-white font-mono font-medium transition-colors shadow-sm disabled:cursor-not-allowed"
                        >
                          {redeemLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Checking...</span>
                            </>
                          ) : (
                            <>
                              <Key className="w-3.5 h-3.5" />
                              <span>Redeem Key</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Inline Error Box */}
                    {redeemError && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center font-mono">
                        <div className="text-xs font-bold text-rose-400 mb-0.5">Invalid KEY</div>
                        <div className="text-[11px] text-zinc-300">{redeemError}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Success Header */}
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-emerald-400 tracking-wide font-mono">
                          Key Redeemed Successfully
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetRedeem}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-mono font-medium transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Redeem another key</span>
                      </button>
                    </div>

                    {/* Account Details Box */}
                    <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Account Credentials</div>
                          <div className="text-zinc-200 text-xs font-mono break-all mt-0.5 select-all font-semibold">
                            {redeemSuccessData.email_pass || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Your KEY</div>
                          <div className="text-zinc-400 text-xs font-mono break-all mt-0.5 select-all">
                            {redeemSuccessData.key_code || '—'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Device Selector */}
                    <div className="grid grid-cols-3 gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => setActiveDevice('pc')}
                        className={`py-2 px-3 rounded-lg border text-xs font-mono font-medium transition-colors text-center ${
                          activeDevice === 'pc'
                            ? 'bg-rose-500/10 border-rose-500/60 text-white font-bold'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDevice('phone')}
                        className={`py-2 px-3 rounded-lg border text-xs font-mono font-medium transition-colors text-center ${
                          activeDevice === 'phone'
                            ? 'bg-rose-500/10 border-rose-500/60 text-white font-bold'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        Mobile
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDevice('tv')}
                        className={`py-2 px-3 rounded-lg border text-xs font-mono font-medium transition-colors text-center ${
                          activeDevice === 'tv'
                            ? 'bg-rose-500/10 border-rose-500/60 text-white font-bold'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        Smart TV
                      </button>
                    </div>

                    {/* Token Nodes */}
                    <div className="flex flex-col gap-2.5 w-full">
                      {redeemSuccessData.tokens.map((token, idx) => {
                        const url = getDeviceUrl(token, activeDevice);
                        const tokenPreview = token.length > 16 ? `${token.substring(0, 16)}...` : token;
                        return (
                          <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-rose-500 tracking-wider text-[11px]">
                                SESSION NODE {idx + 1}
                              </span>
                              <span className="text-[10px] text-zinc-500 select-all">
                                {tokenPreview}
                              </span>
                            </div>
                            <div className="text-[11px] text-emerald-400 bg-zinc-900/80 border border-zinc-800/80 rounded px-2.5 py-1.5 break-all select-all font-mono">
                              {url}
                            </div>
                            <div className="flex items-center gap-2 pt-0.5">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                              >
                                Open
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyText(url, 'Link copied to clipboard!')}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-medium transition-colors"
                              >
                                Copy Link
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Status Footer */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono w-full pt-1 border-t border-zinc-800/60">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Valid until:</span>
                        <span className="text-zinc-300 font-medium">{redeemSuccessData.expires_in || 'N/A'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Generator Panel Footer */}
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pt-5 mt-6 border-t border-zinc-800/80">
                <div className="font-medium">
                  Daily: <span className="text-white">{userPlan.dailyUsed}/{userPlan.dailyLimit}</span>
                </div>
                <div className="font-medium text-zinc-500">Resets at 12AM PHT</div>
              </div>
            </section>

            {/* Panel 2: Generation History Panel */}
            <section className="bg-zinc-950/80 rounded-2xl p-6 sm:p-8 border border-zinc-800">
              
              {/* Panel Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
                  <Clock size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Generation History</h2>
                  <p className="text-xs text-zinc-400">Your last 50 generated accounts</p>
                </div>
              </div>

              {/* Notice Callout */}
              <div className="bg-zinc-900/50 rounded-xl p-3.5 border border-zinc-800 flex items-center gap-3 mb-6 text-xs text-zinc-400">
                <Info size={15} className="text-purple-400 shrink-0" />
                <div>
                  History is automatically cleared every 24 hours. <strong className="text-white font-medium">Copy anything you want to keep.</strong>
                </div>
              </div>

              {/* History Toolbar (Filter & Search) */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 flex-1">
                  {/* Type Filter Select */}
                  <div className="relative">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="appearance-none bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 pr-8 text-xs font-medium text-zinc-200 focus:outline-none focus:border-zinc-700 cursor-pointer min-w-[130px]"
                    >
                      <option value="all" className="bg-zinc-950">All types</option>
                      <option value="steam" className="bg-zinc-950">Steam</option>
                      <option value="discord" className="bg-zinc-950">Discord</option>
                      <option value="rockstar" className="bg-zinc-950">Rockstar</option>
                      <option value="cyberghost" className="bg-zinc-950">CyberGhost</option>
                      <option value="netflix" className="bg-zinc-950">Netflix</option>
                      <option value="valorant" className="bg-zinc-950">Valorant</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  </div>

                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search history..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Account Count Badge */}
              <div className="text-xs text-zinc-500 mb-3 font-mono font-medium">
                {filteredHistory.length} account{filteredHistory.length !== 1 ? 's' : ''}
              </div>

              {/* History Items List (Scrollable container) */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredHistory.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl font-mono">
                    No generation history found.
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-900/40 hover:bg-zinc-900/70 rounded-xl p-3.5 border border-zinc-800/80 hover:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-200 shrink-0 font-bold font-mono text-xs">
                          {item.service[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-white">{item.service}</span>
                            <span className="text-[11px] text-zinc-500 font-mono">{item.date}</span>
                          </div>
                          <div className="text-xs text-zinc-300 font-mono break-all leading-relaxed">
                            {item.dataText}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyText(item.dataText)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 shrink-0 self-end sm:self-center transition-colors"
                      >
                        <Copy size={12} />
                        Copy
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Main Site Footer */}
      <Footer />

      {/* Account Generated Modal */}
      
      {/* Customer Review / Vouch Submission Modal */}
      {showVouchModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-150"
        >
          <div className="relative z-10 w-full max-w-md bg-zinc-950 rounded-3xl p-6 sm:p-7 border border-zinc-800 shadow-2xl text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Submit Customer Review</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">Required to unlock account generation</p>
                </div>
              </div>
              <button
                onClick={() => setShowVouchModal(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-5">
              Share your genuine feedback on ASYNC account generator delivery and stock. Once your review is submitted, your account generation unlocks immediately.
            </p>

            <form onSubmit={handleSubmitVouch} className="space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Your Rating
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setVouchRating(s)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= vouchRating ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-white ml-2">
                    {vouchRating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Written Review
                </label>
                <textarea
                  rows={3}
                  value={vouchComment}
                  onChange={(e) => {
                    setVouchComment(e.target.value);
                    if (vouchError) setVouchError(null);
                  }}
                  placeholder="Write an honest review about generator speed, stock quality, or ease of use..."
                  className="w-full p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 focus:border-purple-500/60 focus:outline-none text-xs text-zinc-200 placeholder-zinc-500 resize-none font-sans"
                />
              </div>

              {vouchError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300">
                  {vouchError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingVouch}
                className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isSubmittingVouch ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Submit Review & Continue</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {generatedModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden"
        >
          {/* Backdrop Click Dismiss */}
          <div
            className="absolute inset-0 z-0"
            onClick={() => setGeneratedModal(null)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-lg bg-zinc-950 rounded-2xl p-6 sm:p-7 border border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
            
            {/* Top Close Icon Button */}
            <button
              onClick={() => setGeneratedModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Close Modal"
            >
              <X size={15} />
            </button>

            {/* Modal Title */}
            <div className="pr-8 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {generatedModal.service} Account Generated
              </h3>
            </div>

            {/* Inner Raw Account Code Box */}
            <div className="bg-black border border-zinc-800 rounded-xl p-3.5 font-mono text-xs text-zinc-200 break-all select-all leading-relaxed my-4">
              {generatedModal.dataText}
            </div>

            {/* Action Buttons: Copy & Close */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleCopyText(generatedModal.dataText, 'Account credentials copied!')}
                className="flex-1 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Copy size={14} />
                Copy
              </button>

              <button
                onClick={() => setGeneratedModal(null)}
                className="flex-1 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate License Modal */}
      {activateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-150"
        >
          <div
            className="fixed inset-0"
            onClick={() => !activating && setActivateModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-zinc-950 border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-950/40 text-left animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Key className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    License Activation
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Enter your LIC key to unlock generator access
                  </p>
                </div>
              </div>

              <button
                disabled={activating}
                onClick={() => setActivateModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleActivateLicense} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium text-zinc-300 mb-1.5">
                  License Key
                </label>
                <input
                  type="text"
                  value={licenseInput}
                  onChange={(e) => {
                    setLicenseInput(e.target.value.toUpperCase());
                    setActivationError(null);
                  }}
                  placeholder="LIC-XXXX-XXXX-XXXX"
                  disabled={activating}
                  maxLength={30}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 transition-colors uppercase tracking-wider"
                />
              </div>

              {activationError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs font-mono leading-relaxed">
                  {activationError}
                </div>
              )}

              {activationSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{activationSuccess}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-[11px] text-zinc-400 font-sans space-y-1">
                <p>• Each license key can only be redeemed once and is bound to your account.</p>
                <p>• Don't have a license? Join our Discord server to purchase one.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!licenseInput.trim() || activating}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-900/30 font-mono"
                >
                  {activating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>Activate License</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={activating}
                  onClick={() => setActivateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium text-xs transition-colors font-mono"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs px-4 py-2.5 rounded-xl shadow-xl font-mono">
          {toast}
        </div>
      )}

      {/* Floating Live Chat & Support Widget */}
      <ChatWidget user={user} hasPlan={userPlan.hasPlan} />
    </div>
  );
}
