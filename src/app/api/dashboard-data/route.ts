import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const isAdminRequest = searchParams.get('admin') === 'true';

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const isOwner = userId === '719482630633947166' || userId === process.env.OWNER_USER_ID;
    const date7 = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const date30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    // If Owner requests Admin Panel Data: Fetch global database records
    if (isAdminRequest && isOwner) {
      const [licensesRes, plansRes, decryptionsRes, fixesRes] = await Promise.all([
        supabaseAdmin
          .from('api_licenses')
          .select('*')
          .order('id', { ascending: false }),
        supabaseAdmin
          .from('plan_subscriptions')
          .select('*')
          .order('id', { ascending: false }),
        supabaseAdmin
          .from('decryptions')
          .select('*')
          .order('id', { ascending: false })
          .limit(100),
        supabaseAdmin
          .from('fixes')
          .select('*')
          .order('id', { ascending: false })
          .limit(100),
      ]);

      return NextResponse.json({
        isOwner: true,
        licenses: licensesRes.data || [],
        plans: plansRes.data || [],
        decryptions: decryptionsRes.data || [],
        fixes: fixesRes.data || [],
      });
    }

    // Standard User Dashboard Data query
    const [decryptionsRes, fixesRes, plansRes, licensesRes, d7Res, f7Res, d30Res, f30Res] = await Promise.all([
      supabaseAdmin
        .from('decryptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('fixes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('plan_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('active', 1)
        .order('expires_at', { ascending: false }),
      supabaseAdmin
        .from('api_licenses')
        .select('*')
        .eq('user_id', userId)
        .eq('revoked', 0),
      supabaseAdmin
        .from('decryptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', date7),
      supabaseAdmin
        .from('fixes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', date7),
      supabaseAdmin
        .from('decryptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', date30),
      supabaseAdmin
        .from('fixes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', date30),
    ]);

    const weeklyCount = (d7Res.count || 0) + (f7Res.count || 0);
    const monthlyCount = (d30Res.count || 0) + (f30Res.count || 0);

    return NextResponse.json({
      isOwner,
      decryptions: decryptionsRes.data || [],
      fixes: fixesRes.data || [],
      plans: plansRes.data || [],
      licenses: licensesRes.data || [],
      usage: {
        weekly: weeklyCount,
        monthly: monthlyCount,
      }
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
