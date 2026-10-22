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
  QrCode
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
  status: 'pending' | 'paid' | 'delivered' | 'cancelled';
  provider: 'balance' | 'qrph' | 'paypal';
  providerLabel: string;
  email: string;
  amount: number;
  total: number;
  subtotal: number;
  currency: string;
  paypalEmail?: string | null;
  paypalNote?: string | null;
  gcashNumber?: string | null;
  gcashName?: string | null;
  mayaNumber?: string | null;
  mayaName?: string | null;
  qrImageUrl?: string | null;
  refCode?: string | null;
  customerRef?: string | null;
  createdAt: string;
  paidAt?: string | null;
  deliveredAt?: string | null;
  licenseKey?: string | null;
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

    // Poll every 3.5 seconds while status is pending or paid (until delivered)
    const interval = setInterval(() => {
      fetchOrder();
    }, 3500);

    return () => clearInterval(interval);
  }, [id]);

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
        setTimeout(() => setRefSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRef(false);
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
  const isPaid = order.status === 'paid' || isDelivered;
  const isPending = order.status === 'pending';

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col relative selection:bg-purple-600 selection:text-white overflow-hidden dev-grid-bg">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20 w-full space-y-6">
        
        {/* ── 1. HEADER CARD ── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 space-y-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl border shrink-0 ${
              isDelivered
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {isDelivered ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6 animate-pulse" />}
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 font-sans">
                {isDelivered
                  ? 'Your License Key is Delivered'
                  : order.provider === 'balance'
                  ? 'Processing Order'
                  : `Complete your ${order.providerLabel} payment`}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {isDelivered
                  ? 'Your payment is confirmed. Your cryptographic license key is ready to use below.'
                  : 'Follow the steps below. Once we confirm your payment, your items unlock here automatically.'}
              </p>
            </div>
          </div>

          {/* 3-Step Progress Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
            {/* Step 1: Ordered */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold bg-emerald-500 text-black shrink-0">
                ✓
              </span>
              <span className="text-xs font-mono font-medium text-white">Ordered</span>
            </div>

            {/* Step 2: Paid */}
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                isPaid ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {isPaid ? '✓' : '2'}
              </span>
              <span className={`text-xs font-mono font-medium ${isPaid ? 'text-white' : 'text-zinc-500'}`}>
                Paid
              </span>
            </div>

            {/* Step 3: Delivered */}
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                isDelivered ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
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
                  <div className="text-xs font-mono text-zinc-400 mb-2">YOUR CRYPTOGRAPHIC LICENSE KEY:</div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 font-mono text-sm sm:text-base font-bold text-emerald-300 select-all">
                    <span>{order.licenseKey}</span>
                    <button
                      onClick={() => handleCopy(order.licenseKey!, 'delivered_key')}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors ml-2 cursor-pointer"
                      title="Copy Key"
                    >
                      {copiedField === 'delivered_key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <a
                    href={`https://gen.asyncdevph.xyz?key=${encodeURIComponent(order.licenseKey)}`}
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
                    {copiedField === 'copy_main' ? 'Copied!' : 'Copy Key'}
                  </button>
                </div>
              </div>
            )}

            {/* PENDING STATE: PAYPAL F&F CARD */}
            {isPending && order.provider === 'paypal' && (
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
                    ALREADY SENT? ENTER YOUR PAYPAL TRANSACTION ID (OPTIONAL):
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
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-mono text-zinc-200 transition-colors"
                    >
                      {refSuccess ? 'Saved ✓' : submittingRef ? 'Saving...' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PENDING STATE: GCASH / MAYA QR CARD */}
            {isPending && order.provider === 'qrph' && (
              <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-purple-500/30 space-y-6">
                <div className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                  GCASH & MAYA QR PAYMENT
                </div>

                {/* Send Exactly Box */}
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400">Send exactly</span>
                  <span className="text-xl sm:text-2xl font-mono font-bold text-white">
                    ₱{order.amount.toLocaleString('en-PH')} PHP
                  </span>
                </div>

                {/* Mobile Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500">GCASH MOBILE:</span>
                    <div className="flex items-center justify-between font-mono text-xs font-semibold text-white">
                      <span>{order.gcashNumber} ({order.gcashName})</span>
                      <button
                        onClick={() => handleCopy(order.gcashNumber!, 'gcash')}
                        className="p-1 rounded bg-zinc-800 text-zinc-300"
                      >
                        {copiedField === 'gcash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500">MAYA MOBILE:</span>
                    <div className="flex items-center justify-between font-mono text-xs font-semibold text-white">
                      <span>{order.mayaNumber} ({order.mayaName})</span>
                      <button
                        onClick={() => handleCopy(order.mayaNumber!, 'maya')}
                        className="p-1 rounded bg-zinc-800 text-zinc-300"
                      >
                        {copiedField === 'maya' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instructions & Reference Submission */}
                <form onSubmit={handleSubmitReference} className="space-y-3 pt-2 border-t border-zinc-800/80">
                  <div className="text-xs text-zinc-400">
                    After completing the transfer, enter your <strong>13-digit GCash/Maya Reference Number</strong> below for immediate admin validation:
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
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-mono font-semibold text-white transition-all cursor-pointer"
                    >
                      {refSuccess ? 'Submitted ✓' : submittingRef ? 'Saving...' : 'Verify Ref #'}
                    </button>
                  </div>
                </form>
              </div>
            )}
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
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {isDelivered ? 'Delivered' : isPaid ? 'Paid' : 'Pending'}
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
                  <span>{order.currency === 'PHP' ? '₱' : '$'}{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold text-white pt-1">
                  <span>Total</span>
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
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}

