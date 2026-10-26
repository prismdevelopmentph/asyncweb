import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser, isOwnerDiscordId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticketId = searchParams.get('ticketId');
  const limitParam = parseInt(searchParams.get('limit') || '50', 10);
  const limit = Math.min(Math.max(limitParam, 10), 100);
  const before = searchParams.get('before');

  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    const callerDiscordId = auth.data.discordId;
    const isOwner = isOwnerDiscordId(callerDiscordId);

    let query = supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('channel', 'support');

    if (!isOwner) {
      // Regular users can only see their own support ticket
      query = query.eq('ticket_id', callerDiscordId);
    } else {
      // Admin/owner can view a specific ticket or all tickets if none specified
      if (ticketId) {
        query = query.eq('ticket_id', ticketId);
      }
    }

    if (before) {
      query = query.lt('created_at', before);
    }

    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error('[Chat API GET Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const messages = (data || []).reverse();
    return NextResponse.json({ success: true, messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    const callerDiscordId = auth.data.discordId;
    const isOwner = isOwnerDiscordId(callerDiscordId);

    const body = await request.json().catch(() => ({}));
    const { ticketId, content } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    const trimmedContent = content.trim().slice(0, 500);

    // Fetch user profile from discord_users or auth metadata for trustworthy display name and avatar
    const { data: dbUser } = await supabaseAdmin
      .from('discord_users')
      .select('display_name, username, avatar_url')
      .eq('discord_user_id', callerDiscordId)
      .maybeSingle();

    const senderName = dbUser?.display_name || dbUser?.username || auth.data.user.user_metadata?.custom_claims?.global_name || auth.data.user.user_metadata?.full_name || 'Member';
    const senderAvatar = dbUser?.avatar_url || auth.data.user.user_metadata?.avatar_url || null;

    // Determine target ticket ID for support channel
    let effectiveTicketId: string | null = null;
    if (isOwner) {
      if (!ticketId) {
        return NextResponse.json({ error: 'Ticket ID is required for admin replies' }, { status: 400 });
      }
      effectiveTicketId = String(ticketId);
    } else {
      effectiveTicketId = callerDiscordId;
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        channel: 'support',
        ticket_id: effectiveTicketId,
        sender_id: callerDiscordId,
        sender_name: String(senderName).slice(0, 50),
        sender_avatar: senderAvatar,
        content: trimmedContent,
        is_admin: isOwner,
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
