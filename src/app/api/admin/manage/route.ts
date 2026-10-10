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

    if (action === 'unban_security_lockout') {
      const { lockoutId, ipAddress } = body;
      if (!lockoutId && !ipAddress) return NextResponse.json({ error: 'Missing lockoutId or ipAddress' }, { status: 400 });

      let query = supabaseAdmin.from('security_lockouts').update({ is_banned: false });
      if (lockoutId) query = query.eq('id', lockoutId);
      else query = query.eq('ip_address', ipAddress);

      const { error } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, message: `Security Lockout lifted for ${ipAddress || 'record #' + lockoutId}.` });
    }

    if (action === 'ban_security_ip') {
      const { ipAddress, reason } = body;
      if (!ipAddress) return NextResponse.json({ error: 'Missing ipAddress' }, { status: 400 });

      const { error } = await supabaseAdmin.from('security_lockouts').upsert(
        {
          ip_address: ipAddress.trim(),
          reason: reason || 'Manual Admin Ban',
          user_agent: 'Admin Console Manual Override',
          url: 'https://asyncdevph.xyz/admin',
          is_banned: true,
          notified_discord: false,
          created_at: new Date().toISOString()
        },
        { onConflict: 'ip_address' }
      );

      if (error) throw error;
      return NextResponse.json({ success: true, message: `IP Address ${ipAddress} manually banned.` });
    }

    if (action === 'generate_generator_license') {
      const { targetUserId, dailyLimit, licenseKey } = body;
      const genKey = licenseKey || ('LIC-' + crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase());

      const { data, error } = await supabaseAdmin
        .from('licenses')
        .insert({
          license_key: genKey,
          redeemed_by: targetUserId || null,
          daily_limit: dailyLimit ? parseInt(dailyLimit) : 15,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: `Generator License ${genKey} created.`, license: data });
    }

    if (action === 'toggle_generator_license') {
      const { licenseId, currentActive } = body;
      if (!licenseId) return NextResponse.json({ error: 'Missing licenseId' }, { status: 400 });

      const { error } = await supabaseAdmin
        .from('licenses')
        .update({ is_active: !currentActive })
        .eq('id', licenseId);

      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: `Generator License status updated to ${!currentActive ? 'ACTIVE' : 'INACTIVE'}.`,
      });
    }

    if (action === 'edit_generator_license') {
      const { licenseId, dailyLimit } = body;
      if (!licenseId) return NextResponse.json({ error: 'Missing licenseId' }, { status: 400 });

      const newLimit = parseInt(dailyLimit);
      if (isNaN(newLimit) || newLimit < 1) {
        return NextResponse.json({ error: 'Invalid daily limit' }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from('licenses')
        .update({ daily_limit: newLimit })
        .eq('id', licenseId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: `Daily limit updated to ${newLimit} accounts/day.` });
    }

    if (action === 'reset_generator_usage') {
      const { licenseId, targetUserId } = body;
      if (!licenseId && !targetUserId) return NextResponse.json({ error: 'Missing licenseId or targetUserId' }, { status: 400 });

      if (targetUserId) {
        await supabaseAdmin.from('claims').delete().eq('user_id', String(targetUserId));
      }

      return NextResponse.json({ success: true, message: `User generation claims reset successfully.` });
    }

    if (action === 'delete_generator_license') {
      const { licenseId } = body;
      if (!licenseId) return NextResponse.json({ error: 'Missing licenseId' }, { status: 400 });

      await supabaseAdmin.from('license_services').delete().eq('license_id', licenseId);

      const { error } = await supabaseAdmin
        .from('licenses')
        .delete()
        .eq('id', licenseId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: `Generator License deleted permanently.` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin management error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

