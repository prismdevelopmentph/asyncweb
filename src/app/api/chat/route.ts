import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel') || 'general';
  const ticketId = searchParams.get('ticketId'); // Required for support tickets if not admin
  const limitParam = parseInt(searchParams.get('limit') || '50', 10);
  const limit = Math.min(Math.max(limitParam, 10), 100);

  const before = searchParams.get('before'); // ISO timestamp to fetch older messages

  try {
    let query = supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('channel', channel);

    if (channel === 'support') {
      if (ticketId) {
        query = query.eq('ticket_id', ticketId);
      }
    }

    if (before) {
      query = query.lt('created_at', before);
    }

    // Always fetch latest descending, then reverse so bottom is most recent
    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error('[Chat API GET Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reverse so oldest appears first in feed, newest at bottom (like iMessage/WhatsApp)
    const messages = (data || []).reverse();

    return NextResponse.json({ success: true, messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, ticketId, senderId, senderName, senderAvatar, content, isAdmin } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    if (!senderId || !senderName) {
      return NextResponse.json({ error: 'Sender information is required' }, { status: 400 });
    }

    const trimmedContent = content.trim().slice(0, 500); // 500 char limit

    const isOwner = senderId === '719482630633947166' || senderId === process.env.OWNER_USER_ID;

    // Support Channel: Any authenticated/logged-in user can message (unlicensed allowed).
    // General Channel: Must hold an active license or VIP subscription.
    if (!isOwner && !isAdmin && channel === 'general') {
      const nowStr = new Date().toISOString();
      const [genLicenseRes, planRes] = await Promise.all([
        supabaseAdmin
          .from('licenses')
          .select('id, expires_at, is_active')
          .eq('redeemed_by', senderId)
          .eq('is_active', true)
          .limit(1),
        supabaseAdmin
          .from('plan_subscriptions')
          .select('id, expires_at, active')
          .eq('user_id', senderId)
          .eq('active', 1)
          .limit(1)
      ]);

      const hasActiveGen = (genLicenseRes.data || []).some((l: any) => !l.expires_at || l.expires_at > nowStr);
      const hasActivePlan = (planRes.data || []).some((p: any) => !p.expires_at || p.expires_at > nowStr);

      if (!hasActiveGen && !hasActivePlan) {
        return NextResponse.json({ 
          error: 'An active license or VIP subscription is required to chat in General.' 
        }, { status: 403 });
      }
    }

    // Determine target ticket ID for support channel
    let effectiveTicketId: string | null = null;
    if (channel === 'support') {
      if (isAdmin || isOwner) {
        if (!ticketId) {
          return NextResponse.json({ error: 'Ticket ID is required for admin replies' }, { status: 400 });
        }
        effectiveTicketId = String(ticketId);
      } else {
        effectiveTicketId = String(senderId); // For user, their ticket ID is their own discord ID
      }
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        channel: channel === 'support' ? 'support' : 'general',
        ticket_id: effectiveTicketId,
        sender_id: String(senderId),
        sender_name: String(senderName).slice(0, 50),
        sender_avatar: senderAvatar || null,
        content: trimmedContent,
        is_admin: Boolean(isAdmin || isOwner),
      })
      .select()
      .single();

    if (error) {
      console.error('[Chat API POST Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data });
  } catch (err: any) {
    console.error('[Chat API POST Exception]:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

