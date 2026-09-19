import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const date7 = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const date30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    const [decryptionsRes, fixesRes, plansRes, d7Res, f7Res, d30Res, f30Res] = await Promise.all([
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

    const isOwner = userId === '719482630633947166' || userId === process.env.OWNER_USER_ID;
    const weeklyCount = (d7Res.count || 0) + (f7Res.count || 0);
    const monthlyCount = (d30Res.count || 0) + (f30Res.count || 0);

    return NextResponse.json({
      isOwner,
      decryptions: decryptionsRes.data || [],
      fixes: fixesRes.data || [],
      plans: plansRes.data || [],
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
