import { supabaseAdmin } from '@/lib/supabase';

export interface PaymentSettings {
  paypalEmail: string;
  gcashNumber: string;
  gcashName: string;
  gcashQrUrl: string;
  mayaNumber: string;
  mayaName: string;
  mayaQrUrl: string;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  paypalEmail: 'payment@asyncdevph.xyz',
  gcashNumber: '09612345678',
  gcashName: 'ASYNC DEV',
  gcashQrUrl: '',
  mayaNumber: '09612345678',
  mayaName: 'ASYNC DEV',
  mayaQrUrl: ''
};

export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    const { data: rows } = await supabaseAdmin
      .from('config')
      .select('key, value')
      .in('key', [
        'payment_paypal_email',
        'payment_gcash_number',
        'payment_gcash_name',
        'payment_gcash_qr_url',
        'payment_maya_number',
        'payment_maya_name',
        'payment_maya_qr_url'
      ]);

    const settings: PaymentSettings = { ...DEFAULT_PAYMENT_SETTINGS };

    if (rows && Array.isArray(rows)) {
      for (const row of rows) {
        if (!row.value) continue;
        if (row.key === 'payment_paypal_email') settings.paypalEmail = row.value.trim();
        if (row.key === 'payment_gcash_number') settings.gcashNumber = row.value.trim();
        if (row.key === 'payment_gcash_name') settings.gcashName = row.value.trim();
        if (row.key === 'payment_gcash_qr_url') settings.gcashQrUrl = row.value.trim();
        if (row.key === 'payment_maya_number') settings.mayaNumber = row.value.trim();
        if (row.key === 'payment_maya_name') settings.mayaName = row.value.trim();
        if (row.key === 'payment_maya_qr_url') settings.mayaQrUrl = row.value.trim();
      }
    }

    return settings;
  } catch (err) {
    console.warn('[Payment Settings] Error loading config, using defaults:', err);
    return DEFAULT_PAYMENT_SETTINGS;
  }
}
