import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, toolType, fileUrl: initialFileUrl, fileName, keyType, keyData } = body;

    if (!userId || !toolType || !initialFileUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, toolType, fileUrl' },
        { status: 400 }
      );
    }

    let finalDownloadUrl = initialFileUrl;

    // 1. Check if user is Owner or Subscribed
    const isOwner = userId === '719482630633947166' || userId === process.env.OWNER_USER_ID;

    const { data: activePlans } = await supabaseAdmin
      .from('plan_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', 1);

    const hasPlan = isOwner || (activePlans && activePlans.length > 0);
    if (!hasPlan) {
      return NextResponse.json(
        { error: 'Active subscription required. Please purchase a Monthly or Lifetime VIP plan in Discord.' },
        { status: 403 }
      );
    }

    // 2. Check Plan Usage Limits for Monthly Subscribers
    const activePlan = activePlans?.[0];
    const planKeyStr = (activePlan?.plan_key || '').toLowerCase();
    const isLifetime = isOwner || planKeyStr.includes('lifetime');

    if (!isLifetime) {
      const date7 = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const date30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

      const [d7, f7, d30, f30] = await Promise.all([
        supabaseAdmin.from('decryptions').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', date7),
        supabaseAdmin.from('fixes').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', date7),
        supabaseAdmin.from('decryptions').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', date30),
        supabaseAdmin.from('fixes').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', date30),
      ]);

      const weeklyUsed = (d7.count || 0) + (f7.count || 0);
      const monthlyUsed = (d30.count || 0) + (f30.count || 0);

      const isDumper = planKeyStr.includes('dumper');
      const weeklyLimit = isDumper ? 40 : 60;
      const monthlyLimit = isDumper ? 120 : 180;

      if (weeklyUsed >= weeklyLimit || monthlyUsed >= monthlyLimit) {
        return NextResponse.json(
          { error: `Plan usage limit reached. (${weeklyUsed}/${weeklyLimit} weekly, ${monthlyUsed}/${monthlyLimit} monthly). Limit resets rolling weekly.` },
          { status: 429 }
        );
      }
    }

    // 3. Dispatch to Processing Engine on Port 3847
    const vpsApiUrl = process.env.VPS_API_URL;
    let jobId: string | null = null;

    if (vpsApiUrl) {
      try {
        const toolEndpoint = toolType === 'fixer' ? 'fix' : 'decrypt';
        const serviceKey = process.env.VPS_SERVICE_KEY || 'DCR-SVC-MK9N3XPQ-R8VL2WT7-J5YH6BFZ';

        const vpsRes = await fetch(`${vpsApiUrl}/api/${toolEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-License-Key': serviceKey,
          },
          body: JSON.stringify({
            sourceUrl: initialFileUrl,
            noKey: keyType === 'none',
            key: keyData || undefined,
          }),
        });

        if (!vpsRes.ok) {
          const errText = await vpsRes.text();
          throw new Error(`Engine rejected job: ${errText}`);
        }

        const vpsJson = await vpsRes.json();
        jobId = vpsJson.jobId || null;
      } catch (vpsErr: any) {
        console.error('[Engine API Pipeline Error]', vpsErr.message);
        return NextResponse.json(
          { error: `Processing Engine Error: ${vpsErr.message}` },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Job initiated successfully.',
      jobId,
    });
  } catch (err: any) {
    console.error('Error in process-job API route:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
