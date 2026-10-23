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

    // ── FORM DATA (QR Photo Upload) ──
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const type = (formData.get('type') as string) || 'gcash'; // 'gcash' | 'maya'

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
      paypalEmail,
      gcashNumber,
      gcashName,
      gcashQrUrl,
      gcashEnabled,
      mayaNumber,
      mayaName,
      mayaQrUrl,
      mayaEnabled
    } = body;

    const upserts = [
      { key: 'payment_paypal_email', value: (paypalEmail || '').trim() },
      { key: 'payment_gcash_number', value: (gcashNumber || '').trim() },
      { key: 'payment_gcash_name', value: (gcashName || '').trim() },
      { key: 'payment_gcash_qr_url', value: (gcashQrUrl || '').trim() },
      { key: 'payment_gcash_enabled', value: gcashEnabled !== false ? 'true' : 'false' },
      { key: 'payment_maya_number', value: (mayaNumber || '').trim() },
      { key: 'payment_maya_name', value: (mayaName || '').trim() },
      { key: 'payment_maya_qr_url', value: (mayaQrUrl || '').trim() },
      { key: 'payment_maya_enabled', value: mayaEnabled !== false ? 'true' : 'false' }
    ];

    for (const item of upserts) {
      await supabaseAdmin
        .from('config')
        .upsert({ key: item.key, value: item.value });
    }

    const updated = await getPaymentSettings();
    return NextResponse.json({ ok: true, settings: updated, message: 'Payment settings saved successfully.' });
  } catch (err: any) {
    console.error('[Payment Settings API] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

