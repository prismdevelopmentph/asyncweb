import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ownerUserId, targetUserId, username, planType, duration, licenseKey, quota, plan } = body;

    // Security Gate: Check if user is owner
    const isOwner = ownerUserId === '719482630633947166' || ownerUserId === process.env.OWNER_USER_ID;
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized: Owner access required' }, { status: 403 });
    }

    if (action === 'assign_plan') {
      if (!targetUserId) {
        return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
      }

      const planKey = `${planType || 'combo'}_${duration || 'month'}`;
      const expiresAt = duration === 'lifetime' ? null : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

      // Deactivate existing active plans for user
      await supabaseAdmin
        .from('plan_subscriptions')
        .update({ active: 0 })
        .eq('user_id', targetUserId);

      // Insert new active plan
      const { data, error } = await supabaseAdmin
        .from('plan_subscriptions')
        .insert({
          user_id: targetUserId,
          username: username || 'User',
          plan_key: planKey,
          assigned_by: ownerUserId,
          expires_at: expiresAt,
          active: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: `Plan ${planKey.toUpperCase()} assigned successfully.`, record: data });
    }

    if (action === 'revoke_plan') {
      const { planId } = body;
      if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 });

      const { error } = await supabaseAdmin
        .from('plan_subscriptions')
        .update({ active: 0 })
        .eq('id', planId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Plan subscription revoked.' });
    }

    if (action === 'generate_license') {
      if (!targetUserId) return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });

      const keyString = 'DCR-KEY-' + crypto.randomBytes(8).toString('hex').toUpperCase();
      const dailyQuota = parseInt(quota) || 50;
      const planName = plan || 'combo';

      const { data, error } = await supabaseAdmin
        .from('api_licenses')
        .insert({
          user_id: targetUserId,
          username: username || 'API User',
          license_key: keyString,
          plan: planName,
          daily_quota: dailyQuota,
          daily_used: 0,
          revoked: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'API License generated.', license: data });
    }

    if (action === 'reset_hwid') {
      const { licenseId } = body;
      if (!licenseId) return NextResponse.json({ error: 'Missing licenseId' }, { status: 400 });

      const { error } = await supabaseAdmin
        .from('api_licenses')
        .update({ hwid: null })
        .eq('id', licenseId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'HWID reset successfully.' });
    }

    if (action === 'toggle_license_status') {
      const { licenseId, currentRevoked } = body;
      if (!licenseId) return NextResponse.json({ error: 'Missing licenseId' }, { status: 400 });

      const newRevokedState = currentRevoked === 0 ? 1 : 0;
      const { error } = await supabaseAdmin
        .from('api_licenses')
        .update({ revoked: newRevokedState })
        .eq('id', licenseId);

      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: `License status changed to ${newRevokedState === 0 ? 'VALID' : 'REVOKED'}.`,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin management error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

