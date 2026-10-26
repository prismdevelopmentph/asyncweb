import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwner } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return auth.response;
    const ownerUserId = auth.data.discordId;

    const body = await request.json();
    const { action, targetUserId, username, planType, duration, licenseKey, quota, plan } = body;

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

      // First fetch the target lockout record to get linked device token / discord ID
      let targetRecord: any = null;
      if (lockoutId) {
        const { data } = await supabaseAdmin.from('security_lockouts').select('ip_address, discord_user_id').eq('id', lockoutId).maybeSingle();
        targetRecord = data;
      }

      const targetIp = (ipAddress || targetRecord?.ip_address || '').trim();
      const targetUid = targetRecord?.discord_user_id ? String(targetRecord.discord_user_id).trim() : null;

      if (targetIp) {
        await supabaseAdmin.from('security_lockouts').update({ is_banned: false }).eq('ip_address', targetIp);
      }
      if (targetUid) {
        await supabaseAdmin.from('security_lockouts').update({ is_banned: false }).eq('discord_user_id', targetUid);
      }
      if (lockoutId) {
        await supabaseAdmin.from('security_lockouts').update({ is_banned: false }).eq('id', lockoutId);
      }

      return NextResponse.json({ success: true, message: `Security Lockout lifted for ${targetIp || 'device ' + targetUid}.` });
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
      const { targetUserId, dailyLimit, licenseKey, scope, tier = 'lifetime' } = body;

      const normalizedTier = String(tier || 'lifetime').toLowerCase();
      const validTiers = ['daily', 'weekly', 'monthly', 'lifetime'];
      if (!validTiers.includes(normalizedTier)) {
        return NextResponse.json({ error: 'Invalid tier. Choose daily, weekly, monthly, or lifetime.' }, { status: 400 });
      }

      // Hardcoded daily limits per accountgenerator.py
      const TIER_LIMITS: Record<string, number | null> = {
        daily: 5,
        weekly: 10,
        monthly: 15,
        lifetime: null, // uses custom limit or server default (null)
      };

      // Hardcoded durations in days per accountgenerator.py
      const TIER_DURATIONS: Record<string, number | null> = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        lifetime: null, // never expires
      };

      const customLimitInt = dailyLimit ? parseInt(dailyLimit, 10) : 0;
      if (customLimitInt > 0 && normalizedTier !== 'lifetime') {
        return NextResponse.json({ error: 'Custom limit can only be set for Lifetime tier.' }, { status: 400 });
      }

      // 1. Resolve scope (Package name / Service name / All Services)
      let service_ids: string[] = [];
      let package_id: string | null = null;
      let scope_label = 'All Services';

      const scopeInput = (scope || '').trim();

      if (scopeInput && scopeInput.toLowerCase() !== 'all') {
        let matchedPkg: { id: string; name: string } | null = null;

        // Check if scope has 'pkg_' prefix (from admin select dropdown value)
        if (scopeInput.toLowerCase().startsWith('pkg_')) {
          const rawPkgId = scopeInput.replace(/^pkg_/i, '').trim();
          const { data: pkgById } = await supabaseAdmin
            .from('packages')
            .select('id, name')
            .eq('id', rawPkgId)
            .limit(1);

          if (pkgById && pkgById.length > 0) {
            matchedPkg = pkgById[0];
          }
        }

        // Try package name match if not matched by ID
        if (!matchedPkg) {
          const { data: pkgByName } = await supabaseAdmin
            .from('packages')
            .select('id, name')
            .ilike('name', scopeInput)
            .limit(1);

          if (pkgByName && pkgByName.length > 0) {
            matchedPkg = pkgByName[0];
          }
        }

        if (matchedPkg) {
          package_id = matchedPkg.id;
          scope_label = matchedPkg.name;

          const { data: psData } = await supabaseAdmin
            .from('package_services')
            .select('service_id')
            .eq('package_id', package_id);

          service_ids = (psData || []).map((row: any) => row.service_id);
        } else {
          // Try individual service
          const { data: svcData } = await supabaseAdmin
            .from('services')
            .select('id, name')
            .ilike('name', scopeInput)
            .limit(1);

          if (!svcData || svcData.length === 0) {
            return NextResponse.json({ error: `"${scopeInput}" is not a known service or package.` }, { status: 400 });
          }

          service_ids = [svcData[0].id];
          scope_label = svcData[0].name;
        }
      }

      // 2. Generate unique key if not provided (matching accountgenerator.py format LIC-XXXX-XXXX-XXXX)
      const generateKey = () => {
        const seg = () => crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
        return `LIC-${seg()}-${seg()}-${seg()}`;
      };

      let genKey = licenseKey?.trim() ? licenseKey.trim().toUpperCase() : generateKey();

      // Ensure key uniqueness
      let attempts = 0;
      while (attempts < 5) {
        const { data: existing } = await supabaseAdmin
          .from('licenses')
          .select('id')
          .eq('license_key', genKey)
          .maybeSingle();

        if (!existing) break;
        genKey = generateKey();
        attempts++;
      }

      // 3. Expiry Calculation
      const durationDays = TIER_DURATIONS[normalizedTier];
      let expires_at: string | null = null;
      if (durationDays) {
        expires_at = new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString();
      }

      // 4. Daily limit assignment
      let finalDailyLimit: number | null = null;
      if (normalizedTier === 'lifetime') {
        finalDailyLimit = customLimitInt > 0 ? customLimitInt : null;
      } else {
        finalDailyLimit = TIER_LIMITS[normalizedTier];
      }

      // 5. Insert License Record
      const { data: newLic, error: insertError } = await supabaseAdmin
        .from('licenses')
        .insert({
          license_key: genKey,
          license_type: 'account',
          package_id: package_id,
          is_active: true,
          tier: normalizedTier,
          daily_limit: finalDailyLimit,
          expires_at: expires_at,
          redeemed_by: targetUserId ? targetUserId.trim() : null,
          redeemed_at: targetUserId ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError || !newLic) {
        throw insertError || new Error('Failed to create license');
      }

      // 6. Insert license_services junction entries if scope is restricted
      if (service_ids.length > 0) {
        const junctionRows = service_ids.map((sid) => ({
          license_id: newLic.id,
          service_id: sid,
        }));

        await supabaseAdmin.from('license_services').insert(junctionRows);
      }

      // 6b. If bound to a target user, ensure user_limits row is initialized with this license
      if (targetUserId) {
        try {
          await supabaseAdmin
            .from('user_limits')
            .insert({
              discord_user_id: targetUserId.trim(),
              license_id: String(newLic.id),
              count: 0,
              updated_at: new Date().toISOString(),
            });
        } catch {
          // Non-blocking if unique constraint or duplicate
        }
      }

      // 7. Post to Discord license log channel if configured
      try {
        const botToken = (
          process.env.DISCORD_BOT_TOKEN ||
          process.env.Discord_bot_token ||
          process.env.discord_bot_token ||
          process.env.DISCORD_TOKEN ||
          process.env.Discord_token ||
          process.env.discord_token
        )?.trim();

        if (botToken) {
          const { data: configRow } = await supabaseAdmin
            .from('config')
            .select('value')
            .eq('key', 'log_license_channel_id')
            .maybeSingle();

          const logChannelId = configRow?.value?.trim();
          if (logChannelId) {
            const limitLabel = normalizedTier === 'lifetime'
              ? (customLimitInt > 0 ? `${customLimitInt}/day (custom)` : 'Server default')
              : `${TIER_LIMITS[normalizedTier]}/day`;

            const expiryLabel = expires_at
              ? `<t:${Math.floor(new Date(expires_at).getTime() / 1000)}:F>`
              : 'Never (Lifetime)';

            const tierLabel = normalizedTier.charAt(0).toUpperCase() + normalizedTier.slice(1);

            const discordPayload = {
              embeds: [
                {
                  title: 'License Generated',
                  color: 0x22c55e, // Green
                  timestamp: new Date().toISOString(),
                  fields: [
                    { name: 'License Key', value: `\`${genKey}\``, inline: false },
                    { name: 'Tier', value: tierLabel, inline: true },
                    { name: 'Grants Access To', value: scope_label, inline: true },
                    { name: 'Daily Limit', value: limitLabel, inline: true },
                    { name: 'Expires', value: expiryLabel, inline: true },
                    { name: 'Generated By', value: `<@${ownerUserId}> (Web Admin)`, inline: true },
                  ],
                },
              ],
            };

            await fetch(`https://discord.com/api/v10/channels/${logChannelId}/messages`, {
              method: 'POST',
              headers: {
                Authorization: `Bot ${botToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(discordPayload),
            });
          }
        }
      } catch (logErr) {
        console.error('[Generate License Log Error]:', logErr);
      }

      return NextResponse.json({
        success: true,
        message: `Generator License ${genKey} created (${scope_label} - ${normalizedTier.toUpperCase()}).`,
        license: {
          ...newLic,
          scope_label,
        },
      });
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

      const updates: Record<string, any> = { daily_limit: newLimit };
      if (body.quotaMode && (body.quotaMode === 'isolated' || body.quotaMode === 'shared')) {
        updates.quota_mode = body.quotaMode;
      }
      const { error } = await supabaseAdmin
        .from('licenses')
        .update(updates)
        .eq('id', licenseId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: `Daily limit updated to ${newLimit} accounts/day.` });
    }

    if (action === 'reset_generator_usage') {
      const { licenseId, targetUserId } = body;
      if (!licenseId && !targetUserId) {
        return NextResponse.json({ error: 'Missing licenseId or targetUserId' }, { status: 400 });
      }

      const nowIso = new Date().toISOString();

      const todayStr = new Date().toISOString().split('T')[0];
      if (licenseId) {
        await supabaseAdmin
          .from('license_daily_usages')
          .delete()
          .eq('license_id', licenseId)
          .eq('usage_date', todayStr);
        await supabaseAdmin
          .from('user_limits')
          .update({ count: 0, updated_at: nowIso })
          .eq('license_id', String(licenseId));
      }

      if (targetUserId) {
        await supabaseAdmin
          .from('user_limits')
          .update({ count: 0, updated_at: nowIso })
          .eq('discord_user_id', String(targetUserId));
      }

      return NextResponse.json({ success: true, message: 'User generation claims reset to 0.' });
    }

    if (action === 'reset_generator_hwid') {
      const { licenseId } = body;
      if (!licenseId) return NextResponse.json({ error: 'Missing licenseId' }, { status: 400 });

      const { error } = await supabaseAdmin
        .from('licenses')
        .update({ hwid: null })
        .eq('id', licenseId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Generator License HWID reset successfully.' });
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

    if (action === 'create_package') {
      const { name, description, serviceIds } = body;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Bundle name is required' }, { status: 400 });
      }
      if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
        return NextResponse.json({ error: 'Select at least one service to include in the bundle' }, { status: 400 });
      }

      const { data: existingPkg } = await supabaseAdmin
        .from('packages')
        .select('id')
        .ilike('name', name.trim())
        .maybeSingle();

      if (existingPkg) {
        return NextResponse.json({ error: `A bundle with name "${name.trim()}" already exists` }, { status: 400 });
      }

      const { data: newPkg, error: pkgErr } = await supabaseAdmin
        .from('packages')
        .insert({
          name: name.trim(),
          description: description?.trim() || null,
        })
        .select()
        .single();

      if (pkgErr || !newPkg) {
        throw pkgErr || new Error('Failed to create bundle package');
      }

      const junctionRows = serviceIds.map((sid: number | string) => ({
        package_id: newPkg.id,
        service_id: Number(sid),
      }));

      const { error: psErr } = await supabaseAdmin.from('package_services').insert(junctionRows);
      if (psErr) throw psErr;

      return NextResponse.json({
        success: true,
        message: `Bundle "${newPkg.name}" created with ${serviceIds.length} services.`,
        package: newPkg,
      });
    }

    if (action === 'delete_package') {
      const { packageId } = body;
      if (!packageId) return NextResponse.json({ error: 'Missing packageId' }, { status: 400 });

      await supabaseAdmin.from('package_services').delete().eq('package_id', packageId);
      const { error } = await supabaseAdmin.from('packages').delete().eq('id', packageId);
      if (error) throw error;

      return NextResponse.json({ success: true, message: 'Bundle deleted successfully.' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin management error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

