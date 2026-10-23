import { supabaseAdmin } from '@/lib/supabase';

export interface PaymentSettings {
  // PayMongo QRPH (In-Store Static QR)
  paymongoEnabled: boolean;
  paymongoName: string;
  paymongoQrUrl: string;
  paymongoFeePercent: number;

  // GCash Direct QR / Mobile
  gcashEnabled: boolean;
  gcashName: string;
  gcashNumber: string;
  gcashQrUrl: string;
  gcashFeePercent: number;

  // Maya Direct QR / Mobile
  mayaEnabled: boolean;
  mayaName: string;
  mayaNumber: string;
  mayaQrUrl: string;
  mayaFeePercent: number;

  // PayPal Friends & Family
  paypalEnabled: boolean;
  paypalEmail: string;
  paypalFeePercent: number;

  // Crypto (LTC / USDT)
  cryptoEnabled: boolean;
  cryptoLtc: string;
  cryptoUsdt: string;
  cryptoFeePercent: number;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  paymongoEnabled: true,
  paymongoName: 'ASYNC DEV',
  paymongoQrUrl: '',
  paymongoFeePercent: 3.5,

  gcashEnabled: true,
  gcashName: 'ASYNC DEV',
  gcashNumber: '09612345678',
  gcashQrUrl: '',
  gcashFeePercent: 0,

  mayaEnabled: true,
  mayaName: 'ASYNC DEV',
  mayaNumber: '09612345678',
  mayaQrUrl: '',
  mayaFeePercent: 0,

  paypalEnabled: true,
  paypalEmail: 'payment@asyncdevph.xyz',
  paypalFeePercent: 0,

  cryptoEnabled: true,
  cryptoLtc: '',
  cryptoUsdt: '',
  cryptoFeePercent: 0
};

export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    const { data: rows } = await supabaseAdmin
      .from('config')
      .select('key, value')
      .in('key', [
        'payment_paymongo_enabled',
        'payment_paymongo_name',
        'payment_paymongo_qr_url',
        'payment_paymongo_fee_percent',

        'payment_gcash_enabled',
        'payment_gcash_name',
        'payment_gcash_number',
        'payment_gcash_qr_url',
        'payment_gcash_fee_percent',

        'payment_maya_enabled',
        'payment_maya_name',
        'payment_maya_number',
        'payment_maya_qr_url',
        'payment_maya_fee_percent',

        'payment_paypal_enabled',
        'payment_paypal_email',
        'payment_paypal_fee_percent',

        'payment_crypto_enabled',
        'payment_crypto_ltc',
        'payment_crypto_usdt',
        'payment_crypto_fee_percent'
      ]);

    const settings: PaymentSettings = { ...DEFAULT_PAYMENT_SETTINGS };

    if (rows && Array.isArray(rows)) {
      for (const row of rows) {
        if (row.value === null || row.value === undefined) continue;
        const val = String(row.value).trim();

        switch (row.key) {
          case 'payment_paymongo_enabled':
            settings.paymongoEnabled = val !== 'false';
            break;
          case 'payment_paymongo_name':
            if (val) settings.paymongoName = val;
            break;
          case 'payment_paymongo_qr_url':
            settings.paymongoQrUrl = val;
            break;
          case 'payment_paymongo_fee_percent':
            settings.paymongoFeePercent = Math.max(0, parseFloat(val) || 0);
            break;

          case 'payment_gcash_enabled':
            settings.gcashEnabled = val !== 'false';
            break;
          case 'payment_gcash_name':
            if (val) settings.gcashName = val;
            break;
          case 'payment_gcash_number':
            if (val) settings.gcashNumber = val;
            break;
          case 'payment_gcash_qr_url':
            settings.gcashQrUrl = val;
            break;
          case 'payment_gcash_fee_percent':
            settings.gcashFeePercent = Math.max(0, parseFloat(val) || 0);
            break;

          case 'payment_maya_enabled':
            settings.mayaEnabled = val !== 'false';
            break;
          case 'payment_maya_name':
            if (val) settings.mayaName = val;
            break;
          case 'payment_maya_number':
            if (val) settings.mayaNumber = val;
            break;
          case 'payment_maya_qr_url':
            settings.mayaQrUrl = val;
            break;
          case 'payment_maya_fee_percent':
            settings.mayaFeePercent = Math.max(0, parseFloat(val) || 0);
            break;

          case 'payment_paypal_enabled':
            settings.paypalEnabled = val !== 'false';
            break;
          case 'payment_paypal_email':
            if (val) settings.paypalEmail = val;
            break;
          case 'payment_paypal_fee_percent':
            settings.paypalFeePercent = Math.max(0, parseFloat(val) || 0);
            break;

          case 'payment_crypto_enabled':
            settings.cryptoEnabled = val !== 'false';
            break;
          case 'payment_crypto_ltc':
            settings.cryptoLtc = val;
            break;
          case 'payment_crypto_usdt':
            settings.cryptoUsdt = val;
            break;
          case 'payment_crypto_fee_percent':
            settings.cryptoFeePercent = Math.max(0, parseFloat(val) || 0);
            break;
        }
      }
    }

    return settings;
  } catch (err) {
    console.warn('[Payment Settings] Error loading config, using defaults:', err);
    return DEFAULT_PAYMENT_SETTINGS;
  }
}
