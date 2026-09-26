import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, serviceName } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required to generate accounts.' }, { status: 401 });
    }

    if (!serviceName) {
      return NextResponse.json({ error: 'Service name is required.' }, { status: 400 });
    }

    // 1. Verify user active license
    const { data: licenseData } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('redeemed_by', userId)
      .eq('is_active', true)
      .limit(1);

    if (!licenseData || licenseData.length === 0) {
      return NextResponse.json({
        error: 'You do not have an active license plan. Please redeem a key first.'
      }, { status: 403 });
    }

    const license = licenseData[0];
    
    // Determine daily limit: NULL daily_limit falls back to server config or default 15
    let dailyLimit = 15;
    if (license.daily_limit !== null && license.daily_limit !== undefined) {
      dailyLimit = license.daily_limit;
    } else {
      const { data: configData } = await supabaseAdmin
        .from('config')
        .select('value')
        .ilike('key', 'generate_limit%')
        .limit(1);
      if (configData && configData.length > 0) {
        dailyLimit = parseInt(configData[0].value, 10) || 15;
      }
    }

    // 2. Check user limits today in user_limits
    const { data: limitData } = await supabaseAdmin
      .from('user_limits')
      .select('id, count')
      .eq('discord_user_id', userId)
      .eq('license_id', String(license.id))
      .limit(1);

    const currentCount = limitData?.[0]?.count || 0;
    if (currentCount >= dailyLimit) {
      return NextResponse.json({
        error: `You have reached your daily generation limit (${currentCount}/${dailyLimit}). Resets at midnight.`
      }, { status: 429 });
    }

    // 3. Find service ID
    const { data: serviceData } = await supabaseAdmin
      .from('services')
      .select('id, name, fields')
      .ilike('name', serviceName)
      .limit(1);

    if (!serviceData || serviceData.length === 0) {
      return NextResponse.json({
        error: `${serviceName} is currently out of stock.`
      }, { status: 404 });
    }

    const serviceId = serviceData[0].id;

    // 4. Atomically claim 1 unused account from accounts table
    const { data: accountData } = await supabaseAdmin
      .from('accounts')
      .select('id, data')
      .eq('service_id', serviceId)
      .eq('is_used', false)
      .limit(1);

    if (!accountData || accountData.length === 0) {
      return NextResponse.json({
        error: `${serviceName} is currently out of stock.`
      }, { status: 404 });
    }

    const account = accountData[0];
    const nowStr = new Date().toISOString();

    // Mark account as claimed: set is_used = true, claimed_by = userId, claimed_at = nowStr
    const { error: updateAccErr } = await supabaseAdmin
      .from('accounts')
      .update({
        is_used: true,
        claimed_by: userId,
        claimed_at: nowStr
      })
      .eq('id', account.id);

    if (updateAccErr) {
      console.error('[Account Claim Update Error]:', updateAccErr);
      return NextResponse.json({ error: 'Failed to claim account.' }, { status: 500 });
    }

    // 5. Update user_limits count
    if (limitData && limitData.length > 0) {
      await supabaseAdmin
        .from('user_limits')
        .update({
          count: currentCount + 1,
          updated_at: nowStr
        })
        .eq('id', limitData[0].id);
    } else {
      await supabaseAdmin
        .from('user_limits')
        .insert({
          discord_user_id: userId,
          license_id: String(license.id),
          service_id: serviceId,
          count: 1,
          updated_at: nowStr
        });
    }

    // Extract raw account string from JSONB data (data->>'raw')
    let accountText = '';
    if (account.data && typeof account.data === 'object') {
      accountText = account.data.raw || account.data.data || JSON.stringify(account.data);
    } else if (typeof account.data === 'string') {
      try {
        const parsed = JSON.parse(account.data);
        accountText = parsed.raw || parsed.data || account.data;
      } catch {
        accountText = account.data;
      }
    }

    return NextResponse.json({
      success: true,
      service: serviceData[0].name,
      accountData: accountText,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });
  } catch (error: any) {
    console.error('[Account Claim Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate account.' },
      { status: 500 }
    );
  }
}
