'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Clock,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Zap,
  ArrowRight,
  RefreshCw,
  QrCode,
  XCircle,
  Ban
} from 'lucide-react';

interface OrderItem {
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface OrderData {
  ok: boolean;
  id: string;
  status: 'awaiting_payment' | 'pending' | 'paid' | 'delivered' | 'cancelled' | 'rejected' | 'payment_mismatch' | 'fulfillment_failed';
  provider: 'balance' | 'qrph' | 'paypal' | 'paymongo_qrph' | 'gcash' | 'maya' | 'crypto';
  providerLabel: string;
  email: string;
  amount: number;
  total: number;
  subtotal: number;
  baseAmount?: number;
  feeAmount?: number;
  feePercent?: number;
  currency: string;
  paypalEmail?: string | null;
  paypalNote?: string | null;
  gcashNumber?: string | null;
  gcashName?: string | null;
  gcashQrUrl?: string | null;
  gcashEnabled?: boolean;
  mayaNumber?: string | null;
  mayaName?: string | null;
  mayaQrUrl?: string | null;
  mayaEnabled?: boolean;
  paymongoQrUrl?: string | null;
  paymongoName?: string | null;
  paymongoCheckoutUrl?: string | null;
  paymongoSessionId?: string | null;
  cryptoLtc?: string | null;
  cryptoUsdt?: string | null;
  qrImageUrl?: string | null;
  refCode?: string | null;
  customerRef?: string | null;
  rejectionReason?: string | null;
  hasSubmittedRef?: boolean;
  createdAt: string;
  paidAt?: string | null;
  deliveredAt?: string | null;
  licenseKey?: string | null;
  couponCode?: string | null;
  discountAmount?: number;
  expiresAt?: string;
  remainingSeconds?: number;
  lockWindowSeconds?: number;
  items: OrderItem[];
}

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copy states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Reference number input
  const [referenceInput, setReferenceInput] = useState('');
  const [submittingRef, setSubmittingRef] = useState(false);
  const [refSuccess, setRefSuccess] = useState(false);

  // Cancellation states
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // PayMongo Automated Session state
  const [generatingPmSession, setGeneratingPmSession] = useState(false);

  // 15-Minute Payment Lock Countdown Timer
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (order?.remainingSeconds !== undefined) {
      setSecondsLeft(order.remainingSeconds);
    }
  }, [order?.remainingSeconds]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0 || order?.status !== 'awaiting_payment' || order?.hasSubmittedRef) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          fetchOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, order?.status, order?.hasSubmittedRef]);

  const formatLockTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Fetch order data
  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/order/${id}?t=${Date.now()}`);
      if (!res.ok) {
        if (res.status === 404) setError('Order not found');
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setOrder(data);
        if (data.customerRef) setReferenceInput(data.customerRef);
      }
    } catch (err: any) {
      console.warn('[Order] Fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!order) return;
    // Halt live polling if order has reached terminal or review status
    if (order.status === 'delivered' || order.status === 'cancelled' || order.status === 'payment_mismatch' || order.status === 'fulfillment_failed') return;

    const interval = setInterval(() => {
      fetchOrder();
    }, 3500);

    return () => clearInterval(interval);
  }, [id, order?.status]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/order/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCancelError(data.error || 'Failed to cancel order.');
        return;
      }
      setShowCancelModal(false);
      await fetchOrder();
    } catch (err: any) {
      setCancelError(err?.message || 'Network error occurred.');
    } finally {
      setCancelling(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceInput.trim()) return;
    setSubmittingRef(true);
    try {
      const res = await fetch(`/api/order/${id}/submit-ref`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceNumber: referenceInput.trim() })
      });
      if (res.ok) {
        setRefSuccess(true);
        fetchOrder();
        setTimeout(() => setRefSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRef(false);
    }
  };

  const handleLaunchPayMongo = async () => {
    if (order?.paymongoCheckoutUrl) {
      window.location.href = order.paymongoCheckoutUrl;
      return;
    }
    setGeneratingPmSession(true);
    try {
      const res = await fetch('/api/paymongo/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id })
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Failed to initialize PayMongo checkout session.');
      }
    } catch (err: any) {
      alert(err.message || 'Error launching PayMongo session.');
    } finally {
      setGeneratingPmSession(false);
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between dev-grid-bg">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-24">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
            <span>Loading order session...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between dev-grid-bg">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-24 px-4 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h2 className="text-xl font-bold text-white mb-1">Order Not Found</h2>
          <p className="text-xs text-zinc-400 max-w-sm mb-6">
            We couldn&apos;t locate this order identifier. Please check your link or browse the catalog.
          </p>
          <Link
            href="/products"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-medium transition-all"
          >
            Return to Products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isDelivered = order.status === 'delivered';
  const isRejected = order.status === 'rejected';
  const isCancelled = order.status === 'cancelled';
  const isMismatch = order.status === 'payment_mismatch';
  const isFulfillmentFailed = order.status === 'fulfillment_failed';
  const isPaymentSubmitted = !isRejected && !isCancelled && !isMismatch && !isFulfillmentFailed && Boolean(order.paidAt || order.hasSubmittedRef || order.customerRef || refSuccess || order.status === 'pending');
  const isPaid = !isRejected && !isCancelled && !isMismatch && !isFulfillmentFailed && (order.status === 'paid' || isPaymentSubmitted || isDelivered);
  const isPending = !isCancelled && !isMismatch && !isFulfillmentFailed && (order.status === 'pending' || order.status === 'awaiting_payment');
  const canCancel = !isDelivered && !isCancelled && !isMismatch && !isFulfillmentFailed && order.status !== 'paid';

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col relative selection:bg-purple-600 selection:text-white overflow-hidden dev-grid-bg">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20 w-full space-y-6">
        
        {/* ── 1. HEADER CARD ── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl border shrink-0 ${
                isDelivered
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isCancelled
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  : isRejected || isMismatch || isFulfillmentFailed
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                {isDelivered ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : isCancelled ? (
                  <XCircle className="w-6 h-6" />
                ) : isRejected || isMismatch || isFulfillmentFailed ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6 animate-pulse" />
                )}
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 font-sans">
                  {isDelivered
                    ? 'Your License Key is Delivered'
                    : isCancelled
                    ? 'Order Cancelled'
                    : isRejected
                    ? 'Payment Verification Rejected'
                    : isMismatch
                    ? 'Payment Under Review'
                    : isFulfillmentFailed
                    ? 'License Generation Delayed'
                    : isPaymentSubmitted
                    ? 'Payment Submitted // Pending Staff Approval'
                    : order.provider === 'balance'
                    ? 'Processing Order'
                    : `Complete your ${order.providerLabel} payment`}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {isDelivered
                    ? 'Your payment is confirmed. Your cryptographic license key is ready to use below.'
                    : isCancelled
                    ? 'This order has been cancelled. No payment was captured and no license keys will be generated.'
                    : isRejected
                    ? 'Staff could not verify the submitted payment. Please check the reason below and submit the correct reference.'
                    : isMismatch
                    ? 'Payment discrepancy detected: The received amount does not match the invoice. Your order is under manual administrative review. Please contact support on Discord.'
                    : isFulfillmentFailed
                    ? 'Your payment is confirmed. Automated license generation encountered a temporary delay — staff have been notified and will issue your key shortly.'
                    : isPaymentSubmitted
                    ? 'We have recorded your transfer reference. An administrator is verifying the funds. Your license key will unlock here automatically.'
                    : 'Follow the steps below. Once we confirm your payment, your items unlock here automatically.'}
                </p>
              </div>
            </div>

            {/* Header Right Action */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
              {order.status === 'awaiting_payment' && !order.hasSubmittedRef && secondsLeft !== null && secondsLeft > 0 && (
                <div className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
                  secondsLeft < 120
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : secondsLeft < 300
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Lock: {formatLockTimer(secondsLeft)}</span>
                </div>
              )}

              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-800/60 text-zinc-400 hover:text-rose-300 text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Cancel Order</span>
                </button>
              )}

              {isCancelled && (
                <Link
                  href="/products"
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-purple-950/50"
                >
                  <span>Browse Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* 3-Step Progress Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
            {/* Step 1: Ordered */}
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                isCancelled ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500 text-black'
              }`}>
                {isCancelled ? '—' : '✓'}
              </span>
              <span className={`text-xs font-mono font-medium ${isCancelled ? 'text-zinc-500 line-through' : 'text-white'}`}>
                Ordered
              </span>
            </div>

            {/* Step 2: Paid / Cancelled */}
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                isCancelled
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : isPaid
                  ? 'bg-emerald-500 text-black'
                  : isRejected
                  ? 'bg-rose-500 text-white'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {isCancelled ? '✕' : isPaid ? '✓' : isRejected ? '!' : '2'}
              </span>
              <div className="flex flex-col">
                <span className={`text-xs font-mono font-medium ${
                  isCancelled
                    ? 'text-rose-400 font-semibold'
                    : isPaid
                    ? 'text-white'
                    : isRejected
                    ? 'text-rose-400'
                    : 'text-zinc-500'
                }`}>
                  {isCancelled ? 'Cancelled' : isRejected ? 'Rejected' : 'Paid'}
                </span>
                {isPaymentSubmitted && !isDelivered && !isCancelled && (
                  <span className="text-[9px] font-mono text-amber-400">Verifying</span>
                )}
              </div>
            </div>

            {/* Step 3: Delivered */}
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                isDelivered ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {isDelivered ? '✓' : '3'}
              </span>
              <span className={`text-xs font-mono font-medium ${isDelivered ? 'text-white' : 'text-zinc-500'}`}>
                Delivered
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. TWO-COLUMN SPLIT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Payment & Key Delivery) */}
          <div className="lg:col-span-7 space-y-6">

            {/* CANCELLED STATE CARD */}
            {isCancelled && (
              <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-5">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                    <XCircle className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="text-base font-bold text-white font-sans">
                      Order Terminated
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      This order was cancelled by the customer. No payment was captured, no reference codes are pending review, and no digital licenses will be dispatched for this session.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="text-zinc-400">
                    Looking for a different payment method or product tier?
                  </div>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-lg shadow-purple-950/50"
                  >
                    <span>Return to Store</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* REJECTED STATE CARD */}
            {isRejected && (
              <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>PAYMENT VERIFICATION REJECTED BY ADMIN</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    Action Required
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-mono text-zinc-400 mb-1">REASON GIVEN:</div>
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-rose-500/40 text-sm font-mono font-semibold text-rose-200">
                    {order.rejectionReason || 'Reference number invalid or transfer not received.'}
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  If this was a typo or you transferred under a different reference number, update it below and click <strong>Re-Submit Payment</strong> for re-verification.
                </p>
                <form onSubmit={handleSubmitReference} className="pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={referenceInput}
                      onChange={(e) => setReferenceInput(e.target.value)}
                      placeholder="Enter correct Reference Number / TxID"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingRef || !referenceInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-mono font-semibold text-white transition-all cursor-pointer"
                    >
                      {refSuccess ? 'Re-submitted ✓' : submittingRef ? 'Submitting...' : 'Re-Submit Payment'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* DELIVERED STATE: KEY REVEAL CARD */}
            {isDelivered && order.licenseKey && (
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-black border border-emerald-500/40 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>FULFILLED // ACTIVE LICENSE</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">Verified</span>
                </div>

                <div>
                  <div className="text-xs font-mono text-emerald-400 font-bold mb-2 uppercase tracking-wider">
                    {order.licenseKey.includes(',') ? 'YOUR ACTIVATED LICENSE KEYS' : 'YOUR LICENSE KEY IS NOW ACTIVATED'}
                  </div>
                  <div className="space-y-2">
                    {order.licenseKey.split(',').map((k, kIdx) => {
                      const cleanK = k.trim();
                      return (
                        <div
                          key={kIdx}
                          className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 font-mono text-xs sm:text-sm font-bold text-emerald-300 select-all"
                        >
                          <span className="truncate">{cleanK}</span>
                          <button
                            onClick={() => handleCopy(cleanK, `delivered_key_${kIdx}`)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors ml-2 cursor-pointer shrink-0"
                            title="Copy Key"
                          >
                            {copiedField === `delivered_key_${kIdx}` ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <a
                    href={`https://gen.asyncdevph.xyz?key=${encodeURIComponent(order.licenseKey.split(',')[0].trim())}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs transition-all shadow-lg shadow-emerald-950/40"
                  >
                    <span>Launch Generator Portal</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleCopy(order.licenseKey!, 'copy_main')}
                    className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-mono text-xs transition-all cursor-pointer"
                  >
                    {copiedField === 'copy_main' ? 'Copied!' : 'Copy All Keys'}
                  </button>
                </div>
              </div>
            )}

            {/* PENDING SUBMISSION NOTIFICATION CARD */}
            {isPaymentSubmitted && !isDelivered && (
              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span>PAYMENT SUBMITTED // PENDING STAFF VERIFICATION</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                    Step 2 / 3
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  We have received your payment reference (<strong className="font-mono text-white">{order.customerRef || referenceInput}</strong>). A staff member is currently confirming the transaction in the ledger. Your license will automatically unlock here once verified.
                </p>
                <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 pt-1 border-t border-amber-500/20">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Auto-sync active every 3 seconds — no need to refresh this page.</span>
                </div>
              </div>
            )}

            {/* PENDING STATE: PAYPAL F&F CARD */}
            {isPending && order.provider === 'paypal' && !isPaymentSubmitted && (
              <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-purple-500/30 space-y-6">
                <div className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                  PAYPAL PAYMENT
                </div>

                {/* Send Exactly Box */}
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400">Send exactly</span>
                  <span className="text-xl sm:text-2xl font-mono font-bold text-white">
                    ${order.amount.toFixed(2)} USD
                  </span>
                </div>

                {/* PayPal Recipient */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-zinc-400">To PayPal address:</span>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 font-mono text-xs sm:text-sm text-zinc-200">
                    <span className="truncate">{order.paypalEmail}</span>
                    <button
                      onClick={() => handleCopy(order.paypalEmail!, 'paypal_email')}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 ml-2 cursor-pointer transition-colors"
                      title="Copy Email"
                    >
                      {copiedField === 'paypal_email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* PayPal Note / Memo */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-zinc-400">Write exactly this in the note:</span>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 font-mono text-xs sm:text-sm font-semibold text-white">
                    <span className="truncate">{order.paypalNote}</span>
                    <button
                      onClick={() => handleCopy(order.paypalNote!, 'paypal_note')}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 ml-2 cursor-pointer transition-colors"
                      title="Copy Note"
                    >
                      {copiedField === 'paypal_note' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-2 text-xs text-zinc-400 leading-relaxed font-sans pt-2 border-t border-zinc-800/80">
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Send as <strong>Friends & Family</strong> (no fees, no cover).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>The note and the exact amount are how we match your payment — don&apos;t change either.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>This page updates automatically once we confirm — usually within a few minutes.</span>
                  </div>
                </div>

                {/* Optional TxID input */}
                <form onSubmit={handleSubmitReference} className="pt-2">
                  <div className="text-[11px] font-mono text-zinc-500 mb-1.5">
                    ALREADY SENT? ENTER YOUR PAYPAL TRANSACTION ID:
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={referenceInput}
                      onChange={(e) => setReferenceInput(e.target.value)}
                      placeholder="e.g. 5PK3829104829104A"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingRef || !referenceInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-mono font-semibold text-white transition-all cursor-pointer"
                    >
                      {refSuccess ? 'Submitted ✓' : submittingRef ? 'Saving...' : 'Submit Payment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PENDING STATE: PAYMONGO QRPH PAYMENT CARD */}
            {isPending && order.provider === 'paymongo_qrph' && (
              <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-purple-500/30 space-y-6">
                <div className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                  <span>PAYMONGO QRPH PAYMENT</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Instant QRPH Rail</span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400">Send exactly</span>
                  <span className="text-xl sm:text-2xl font-mono font-bold text-white">
                    ₱{order.amount.toLocaleString('en-PH')} PHP
                  </span>
                </div>

                {/* AUTOMATED PAYMONGO CHECKOUT ACTION */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-purple-950/60 to-purple-900/40 border border-purple-500/40 space-y-2.5 text-center shadow-lg shadow-purple-950/30">
                  <div className="text-xs font-mono font-bold text-purple-200 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Real-Time Automated PayMongo Available</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 max-w-sm mx-auto">
                    Launch the official PayMongo checkout page to pay with dynamic QR Ph or direct e-wallets. Zero receipt upload required.
                  </p>
                  <button
                    type="button"
                    onClick={handleLaunchPayMongo}
                    disabled={generatingPmSession}
                    className="w-full py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-950/40"
                  >
                    {generatingPmSession ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    <span>
                      {order.paymongoCheckoutUrl
                        ? 'Proceed to PayMongo Checkout Page'
                        : generatingPmSession
                        ? 'Creating Checkout Session...'
                        : 'Launch Automated PayMongo Checkout'}
                    </span>
                  </button>
                  <div className="text-[10px] font-mono text-zinc-400">
                    ⚡ Instant auto-fulfillment: your license key unlocks seconds after payment.
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col items-center text-center space-y-4 max-w-sm mx-auto w-full">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase">Scan via Any Banking App / E-Wallet</span>
                  </div>

                  {order.paymongoQrUrl || order.qrImageUrl ? (
                    <div className="relative w-52 h-52 rounded-xl overflow-hidden border border-zinc-700 bg-white p-2 shadow-md">
                      <Image
                        src={order.paymongoQrUrl || order.qrImageUrl!}
                        alt="PayMongo QRPH Code"
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-52 h-52 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center p-3 text-zinc-500 text-[11px] font-mono">
                      <QrCode className="w-8 h-8 mb-1.5 text-purple-400 opacity-80" />
                      <span>QRPH Code Pending</span>
                    </div>
                  )}

                  <div className="w-full text-left space-y-1 font-mono text-xs pt-1">
                    <div className="text-[10px] text-zinc-500 uppercase">Merchant Name:</div>
                    <div className="text-white font-semibold truncate">{order.paymongoName || 'ASYNC ENTERPRISES'}</div>
                  </div>
                </div>

                <form onSubmit={handleSubmitReference} className="space-y-3 pt-3 border-t border-zinc-800/80">
                  <div className="text-xs text-zinc-400">
                    After scanning and completing payment, enter your <strong>Reference Number / Trace No.</strong> below:
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={referenceInput}
                      onChange={(e) => setReferenceInput(e.target.value)}
                      placeholder="e.g. 102948291048"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingRef || !referenceInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-mono font-bold text-white transition-all cursor-pointer shadow-md shadow-purple-950/40"
                    >
                      {refSuccess ? 'Submitted ✓' : submittingRef ? 'Saving...' : 'Submit Payment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PENDING STATE: CRYPTO PAYMENT CARD (LTC / USDT) */}
            {isPending && order.provider === 'crypto' && (
              <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-purple-500/30 space-y-6">
                <div className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                  <span>CRYPTO DIRECT PAYMENT</span>
                  <span className="text-[10px] text-zinc-500 font-normal">LTC &bull; USDT</span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400">Send exactly</span>
                  <span className="text-xl sm:text-2xl font-mono font-bold text-white">
                    ${order.amount.toFixed(2)} USD
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {order.cryptoLtc && (
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold text-amber-400">Litecoin (LTC) Address</div>
                      <div className="flex items-center justify-between text-zinc-200">
                        <span className="truncate select-all">{order.cryptoLtc}</span>
                        <button
                          onClick={() => handleCopy(order.cryptoLtc!, 'crypto_ltc')}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 ml-2 cursor-pointer shrink-0"
                          title="Copy LTC Address"
                        >
                          {copiedField === 'crypto_ltc' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {order.cryptoUsdt && (
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold text-emerald-400">Tether (USDT) Address</div>
                      <div className="flex items-center justify-between text-zinc-200">
                        <span className="truncate select-all">{order.cryptoUsdt}</span>
                        <button
                          onClick={() => handleCopy(order.cryptoUsdt!, 'crypto_usdt')}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 ml-2 cursor-pointer shrink-0"
                          title="Copy USDT Address"
                        >
                          {copiedField === 'crypto_usdt' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmitReference} className="space-y-3 pt-3 border-t border-zinc-800/80">
                  <div className="text-xs text-zinc-400">
                    After broadcasting your transaction, enter your <strong>TxID / Blockchain Hash</strong> below:
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={referenceInput}
                      onChange={(e) => setReferenceInput(e.target.value)}
                      placeholder="e.g. b8f9a2c... (Transaction Hash)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingRef || !referenceInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-mono font-bold text-white transition-all cursor-pointer shadow-md shadow-purple-950/40"
                    >
                      {refSuccess ? 'Submitted ✓' : submittingRef ? 'Saving...' : 'Submit Payment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PENDING STATE: QRPH / GCASH / MAYA PAYMENT CARD */}
            {isPending && (order.provider === 'qrph' || order.provider === 'gcash' || order.provider === 'maya') && (() => {
              const showGcash = order.provider === 'gcash' || (order.provider === 'qrph' && order.gcashEnabled !== false);
              const showMaya = order.provider === 'maya' || (order.provider === 'qrph' && order.mayaEnabled !== false);
              const singleCard = (showGcash && !showMaya) || (!showGcash && showMaya);

              return (
                <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-purple-500/30 space-y-6">
                  <div className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{order.provider === 'gcash' ? 'GCASH TRANSFER' : order.provider === 'maya' ? 'MAYA TRANSFER' : 'QRPH PAYMENT'}</span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      {order.provider === 'gcash'
                        ? 'GCash Accepted'
                        : order.provider === 'maya'
                        ? 'Maya Accepted'
                        : showGcash && showMaya
                        ? 'GCash & Maya Accepted'
                        : 'Philippine E-Wallet'}
                    </span>
                  </div>

                  {/* Send Exactly Box */}
                  <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400">Send exactly</span>
                    <span className="text-xl sm:text-2xl font-mono font-bold text-white">
                      ₱{order.amount.toLocaleString('en-PH')} PHP
                    </span>
                  </div>

                  {/* Dynamic QR Code Display (Adjusts based on GCash / Maya enabled states) */}
                  <div className={`grid gap-4 ${singleCard ? 'grid-cols-1 max-w-sm mx-auto w-full' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    {/* GCash Card */}
                    {showGcash && (
                      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col items-center text-center space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-xs font-mono font-bold text-white uppercase">GCash Transfer</span>
                        </div>

                        {order.gcashQrUrl ? (
                          <div className="relative w-44 h-44 rounded-xl overflow-hidden border border-zinc-700 bg-white p-1 shadow-md">
                            <Image
                              src={order.gcashQrUrl}
                              alt="GCash QR Code"
                              fill
                              unoptimized
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-44 h-44 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center p-3 text-zinc-500 text-[11px] font-mono">
                            <QrCode className="w-8 h-8 mb-1.5 text-blue-400 opacity-80" />
                            <span>Send via Mobile #</span>
                          </div>
                        )}

                        <div className="w-full text-left space-y-1 font-mono text-xs pt-1">
                          <div className="text-[10px] text-zinc-500 uppercase">Account Name:</div>
                          <div className="text-white font-semibold truncate">{order.gcashName || 'ASYNC DEV'}</div>
                          <div className="text-[10px] text-zinc-500 uppercase pt-1">Mobile Number:</div>
                          <div className="flex items-center justify-between text-zinc-200">
                            <span>{order.gcashNumber}</span>
                            <button
                              onClick={() => handleCopy(order.gcashNumber!, 'gcash')}
                              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                            >
                              {copiedField === 'gcash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Maya Card */}
                    {showMaya && (
                      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col items-center text-center space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs font-mono font-bold text-white uppercase">Maya Transfer</span>
                        </div>

                        {order.mayaQrUrl ? (
                          <div className="relative w-44 h-44 rounded-xl overflow-hidden border border-zinc-700 bg-white p-1 shadow-md">
                            <Image
                              src={order.mayaQrUrl}
                              alt="Maya QR Code"
                              fill
                              unoptimized
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-44 h-44 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center p-3 text-zinc-500 text-[11px] font-mono">
                            <QrCode className="w-8 h-8 mb-1.5 text-emerald-400 opacity-80" />
                            <span>Send via Mobile #</span>
                          </div>
                        )}

                        <div className="w-full text-left space-y-1 font-mono text-xs pt-1">
                          <div className="text-[10px] text-zinc-500 uppercase">Account Name:</div>
                          <div className="text-white font-semibold truncate">{order.mayaName || 'ASYNC DEV'}</div>
                          <div className="text-[10px] text-zinc-500 uppercase pt-1">Mobile Number:</div>
                          <div className="flex items-center justify-between text-zinc-200">
                            <span>{order.mayaNumber}</span>
                            <button
                              onClick={() => handleCopy(order.mayaNumber!, 'maya')}
                              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                            >
                              {copiedField === 'maya' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!showGcash && !showMaya && (
                      <div className="p-8 text-center text-zinc-400 font-mono text-xs col-span-2 rounded-2xl bg-zinc-900 border border-zinc-800">
                        Payment gateways are temporarily offline for maintenance. Please notify support.
                      </div>
                    )}
                  </div>

                  {/* Instructions & Reference Submission */}
                  <form onSubmit={handleSubmitReference} className="space-y-3 pt-3 border-t border-zinc-800/80">
                    <div className="text-xs text-zinc-400">
                      After completing the transfer, enter your <strong>Reference Number</strong> below and click <strong>Submit Payment</strong>:
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={referenceInput}
                        onChange={(e) => setReferenceInput(e.target.value)}
                        placeholder="e.g. 102948291048"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="submit"
                        disabled={submittingRef || !referenceInput.trim()}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-mono font-bold text-white transition-all cursor-pointer shadow-md shadow-purple-950/40"
                      >
                        {refSuccess ? 'Submitted ✓' : submittingRef ? 'Saving...' : 'Submit Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              );
            })()}
          </div>

          {/* Right Column (Order Summary & Details) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* ORDER SUMMARY */}
            <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
                  ORDER SUMMARY
                </span>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  isDelivered
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isCancelled
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    : isRejected
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : isPaid
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {isDelivered ? 'Delivered' : isCancelled ? 'Cancelled' : isRejected ? 'Rejected' : isPaid ? 'Paid' : 'Pending'}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 pt-1">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-white leading-snug">{item.productName}</div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        {item.variantName} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-white shrink-0">
                      {order.currency === 'PHP' ? '₱' : '$'}{item.lineTotal.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal & Total */}
              <div className="pt-4 border-t border-zinc-800/80 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>{order.currency === 'PHP' ? '₱' : '$'}{(order.baseAmount ?? order.subtotal).toFixed(2)}</span>
                </div>

                {Boolean(order.discountAmount && order.discountAmount > 0) && (
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span>Promo Discount</span>
                      {order.couponCode && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                          {order.couponCode}
                        </span>
                      )}
                    </span>
                    <span className="text-emerald-400 font-semibold">-{order.currency === 'PHP' ? '₱' : '$'}{order.discountAmount?.toFixed(2)}</span>
                  </div>
                )}

                {Boolean(order.feeAmount && order.feeAmount > 0) && (
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Gateway Fee (+{order.feePercent}%)</span>
                    <span className="text-amber-400">+{order.currency === 'PHP' ? '₱' : '$'}{order.feeAmount?.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-base font-bold text-white pt-1 border-t border-zinc-800/50">
                  <span>Total Due</span>
                  <span className="text-purple-400">
                    {order.currency === 'PHP' ? '₱' : '$'}{order.total.toFixed(2)} {order.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* DETAILS */}
            <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 space-y-3 text-xs font-mono">
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold mb-1">
                DETAILS
              </div>

              {/* Order ID */}
              <div className="space-y-1">
                <span className="text-zinc-500 text-[10px]">Order ID</span>
                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                  <span className="truncate mr-2">{order.id}</span>
                  <button
                    onClick={() => handleCopy(order.id, 'order_id')}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    {copiedField === 'order_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-zinc-500 text-[10px]">Items</span>
                  <div className="text-white font-medium">{order.items.length}</div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">Payment</span>
                  <div className="text-white font-medium truncate">{order.providerLabel}</div>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-zinc-500 text-[10px]">Billed to</span>
                <div className="text-white font-medium truncate">{order.email}</div>
              </div>

              {/* Timestamps */}
              <div className="pt-3 border-t border-zinc-800/80 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Ordered
                  </span>
                  <span className="text-zinc-300">{formatDate(order.createdAt)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                    Paid
                  </span>
                  <span className="text-zinc-300">{formatDate(order.paidAt)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${isDelivered ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                    Delivered
                  </span>
                  <span className="text-zinc-300">{formatDate(order.deliveredAt)}</span>
                </div>
              </div>

              {/* Cancel Button in Details */}
              {canCancel && (
                <div className="pt-3 border-t border-zinc-800/80">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-800/60 text-zinc-400 hover:text-rose-400 text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel this order</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Cancel Order Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className="relative w-full max-w-md rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-mono font-bold text-white">Cancel Order</span>
                </div>
                <button
                  onClick={() => !cancelling && setShowCancelModal(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-zinc-300 leading-relaxed font-sans">
                <p>
                  Are you sure you want to cancel this order (<strong className="font-mono text-white">{order.id}</strong>)?
                </p>
                <p className="text-zinc-500">
                  Any pending transfer references submitted for this order will be discarded. This action cannot be reversed.
                </p>
              </div>

              {cancelError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-400">
                  {cancelError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono font-medium transition-colors cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelOrder}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {cancelling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Yes, Cancel Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

