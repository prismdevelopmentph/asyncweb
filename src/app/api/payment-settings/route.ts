import { NextResponse } from 'next/server';
import { getPaymentSettings } from '@/lib/payment-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getPaymentSettings();
    return NextResponse.json({
      ok: true,
      settings: {
        paymongoEnabled: settings.paymongoEnabled,
        paymongoName: settings.paymongoName,
        paymongoFeePercent: settings.paymongoFeePercent,

        gcashEnabled: settings.gcashEnabled,
        gcashName: settings.gcashName,
        gcashFeePercent: settings.gcashFeePercent,

        mayaEnabled: settings.mayaEnabled,
        mayaName: settings.mayaName,
        mayaFeePercent: settings.mayaFeePercent,

        paypalEnabled: settings.paypalEnabled,
        paypalFeePercent: settings.paypalFeePercent,

        cryptoEnabled: settings.cryptoEnabled,
        cryptoFeePercent: settings.cryptoFeePercent
      }
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

