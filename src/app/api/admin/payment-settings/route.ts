import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPaymentSettings } from '@/lib/payment-settings';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getPaymentSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // ── FORM DATA (QR Photo Upload: paymongo | gcash | maya) ──
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const type = (formData.get('type') as string) || 'paymongo'; // 'paymongo' | 'gcash' | 'maya'

      if (!file) {
        return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
      }

      const mimeType = file.type || 'image/png';
      const extension = mimeType.split('/')[1]?.replace('+xml', '') || 'png';
      const randomHex = crypto.randomBytes(4).toString('hex');
      const fileName = `qr_${type}_${Date.now()}_${randomHex}.${extension}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from('product-images')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return NextResponse.json({ ok: true, url: publicUrlData.publicUrl });
    }

    // ── JSON BODY (Update Payment Config) ──
    const body = await req.json();
    const {
      paymongoEnabled,
      paymongoAutomated,
      paymongoSecretKey,
      paymongoWebhookSecret,
      paymongoName,
      paymongoQrUrl,
      paymongoFeePercent,

      gcashEnabled,
      gcashName,
      gcashNumber,
      gcashQrUrl,
      gcashFeePercent,

      mayaEnabled,
      mayaName,
      mayaNumber,
      mayaQrUrl,
      mayaFeePercent,

      paypalEnabled,
      paypalEmail,
      paypalFeePercent,

      cryptoEnabled,
      cryptoLtc,
      cryptoUsdt,
      cryptoFeePercent
    } = body;

    const upserts = [
      { key: 'payment_paymongo_enabled', value: paymongoEnabled !== false ? 'true' : 'false' },
      { key: 'payment_paymongo_automated', value: paymongoAutomated !== false ? 'true' : 'false' },
      { key: 'payment_paymongo_secret_key', value: (paymongoSecretKey || '').trim() },
      { key: 'payment_paymongo_webhook_secret', value: (paymongoWebhookSecret || '').trim() },
      { key: 'payment_paymongo_name', value: (paymongoName || '').trim() },
      { key: 'payment_paymongo_qr_url', value: (paymongoQrUrl || '').trim() },
      { key: 'payment_paymongo_fee_percent', value: String(Math.max(0, parseFloat(paymongoFeePercent) || 0)) },

      { key: 'payment_gcash_enabled', value: gcashEnabled !== false ? 'true' : 'false' },
      { key: 'payment_gcash_name', value: (gcashName || '').trim() },
      { key: 'payment_gcash_number', value: (gcashNumber || '').trim() },
      { key: 'payment_gcash_qr_url', value: (gcashQrUrl || '').trim() },
      { key: 'payment_gcash_fee_percent', value: String(Math.max(0, parseFloat(gcashFeePercent) || 0)) },

      { key: 'payment_maya_enabled', value: mayaEnabled !== false ? 'true' : 'false' },
      { key: 'payment_maya_name', value: (mayaName || '').trim() },
      { key: 'payment_maya_number', value: (mayaNumber || '').trim() },
      { key: 'payment_maya_qr_url', value: (mayaQrUrl || '').trim() },
      { key: 'payment_maya_fee_percent', value: String(Math.max(0, parseFloat(mayaFeePercent) || 0)) },

      { key: 'payment_paypal_enabled', value: paypalEnabled !== false ? 'true' : 'false' },
      { key: 'payment_paypal_email', value: (paypalEmail || '').trim() },
      { key: 'payment_paypal_fee_percent', value: String(Math.max(0, parseFloat(paypalFeePercent) || 0)) },

      { key: 'payment_crypto_enabled', value: cryptoEnabled !== false ? 'true' : 'false' },
      { key: 'payment_crypto_ltc', value: (cryptoLtc || '').trim() },
      { key: 'payment_crypto_usdt', value: (cryptoUsdt || '').trim() },
      { key: 'payment_crypto_fee_percent', value: String(Math.max(0, parseFloat(cryptoFeePercent) || 0)) }
    ];

    for (const item of upserts) {
      await supabaseAdmin
        .from('config')
        .upsert({ key: item.key, value: item.value });
    }

    const updated = await getPaymentSettings();
    return NextResponse.json({ ok: true, settings: updated, message: 'Payment gateway configuration saved successfully.' });
  } catch (err: any) {
    console.error('[Payment Settings API] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
