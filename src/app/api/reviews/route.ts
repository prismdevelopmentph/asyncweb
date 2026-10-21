import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || '';
const VOUCH_CHANNEL_ID = process.env.VOUCH_CHANNEL_ID || '1540909705805693019';

// In-memory cache for Discord messages (60s TTL)
let cachedReviews: any[] = [];
let cacheExpiresAt = 0;

export async function GET() {
  try {
    const now = Date.now();
    if (cachedReviews.length > 0 && now < cacheExpiresAt) {
      return NextResponse.json({ reviews: cachedReviews });
    }

    const discordRes = await fetch(
      `https://discord.com/api/v10/channels/${VOUCH_CHANNEL_ID}/messages?limit=50`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        next: { revalidate: 60 }
      }
    );

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error('[Reviews API] Discord fetch error:', discordRes.status, errText);
      return NextResponse.json({ reviews: cachedReviews });
    }

    const messages = await discordRes.json();
    if (!Array.isArray(messages)) {
      return NextResponse.json({ reviews: [] });
    }

    const reviews: any[] = [];

    for (const msg of messages) {
      const embed = msg.embeds?.[0];
      if (!embed) continue;

      // Extract user ID from footer or content
      const footerText = embed.footer?.text || '';
      const userIdMatch = footerText.match(/User ID:\s*(\d+)/i) || (embed.fields?.find((f: any) => f.name === 'From')?.value || '').match(/<@!?(\d+)>/);
      const userId = userIdMatch ? userIdMatch[1] : '';

      // Count stars in Rating field
      const ratingField = embed.fields?.find((f: any) => f.name?.toLowerCase().includes('rating'))?.value || '';
      const starCount = (ratingField.match(/⭐/g) || []).length || 5;

      // Extract service name
      const serviceField = embed.fields?.find((f: any) => f.name?.toLowerCase().includes('service'))?.value || 'Account Generator';

      // Clean comment description
      const comment = (embed.description || '').replace(/^["']|["']$/g, '').trim();
      if (!comment) continue;

      const avatarUrl = embed.thumbnail?.url || '/images/Profile.png';
      const timestamp = embed.timestamp || msg.timestamp;

      reviews.push({
        id: msg.id,
        userId,
        author: userId ? `Client #${userId.slice(-4)}` : 'Verified Client',
        avatar: avatarUrl,
        rating: Math.min(Math.max(starCount, 1), 5),
        service: serviceField,
        comment,
        timestamp,
        date: new Date(timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      });
    }

    cachedReviews = reviews;
    cacheExpiresAt = now + 60000;

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('[Reviews API] Fatal error:', error);
    return NextResponse.json({ reviews: cachedReviews });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, licenseId, rating, comment, serviceName, avatarUrl } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required to submit review.' }, { status: 401 });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5 stars.' }, { status: 400 });
    }

    const cleanComment = (comment || '').trim();
    if (!cleanComment || cleanComment.length < 2) {
      return NextResponse.json({ error: 'Please enter a valid review comment.' }, { status: 400 });
    }

    // 1. Update Supabase license vouch_given = true
    if (licenseId) {
      await supabaseAdmin
        .from('licenses')
        .update({ vouch_given: true })
        .eq('id', licenseId);
    } else {
      await supabaseAdmin
        .from('licenses')
        .update({ vouch_given: true })
        .eq('redeemed_by', String(userId));
    }

    // 2. Dispatch embed to Discord vouch channel (same format as bot)
    const stars = '⭐'.repeat(parsedRating) + '☆'.repeat(5 - parsedRating);
    const resolvedAvatar = avatarUrl || `https://cdn.discordapp.com/embed/avatars/${parseInt(userId.slice(-2) || '0', 10) % 5}.png`;

    const discordPayload = {
      embeds: [
        {
          title: 'New Vouch',
          description: `"${cleanComment}"`,
          color: 15844367, // Gold
          timestamp: new Date().toISOString(),
          fields: [
            { name: 'Rating', value: stars, inline: true },
            { name: 'Service', value: serviceName || 'Acc Gen', inline: true },
            { name: 'From', value: `<@${userId}>`, inline: true }
          ],
          thumbnail: { url: resolvedAvatar },
          footer: { text: `User ID: ${userId}` }
        }
      ]
    };

    try {
      const sendRes = await fetch(`https://discord.com/api/v10/channels/${VOUCH_CHANNEL_ID}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(discordPayload)
      });

      if (!sendRes.ok) {
        console.warn('[Vouch Submit] Discord post warning:', sendRes.status, await sendRes.text());
      }
    } catch (err) {
      console.warn('[Vouch Submit] Discord post network error:', err);
    }

    // Bust review cache so it refreshes immediately
    cachedReviews = [];
    cacheExpiresAt = 0;

    return NextResponse.json({
      success: true,
      message: 'Vouch submitted successfully. Generator unlocked.'
    });
  } catch (err: any) {
    console.error('[Vouch Submit] Fatal error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit review.' }, { status: 500 });
  }
}
