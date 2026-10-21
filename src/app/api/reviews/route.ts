import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || '';
const VOUCH_CHANNEL_ID = process.env.VOUCH_CHANNEL_ID || '1540909705805693019';

// In-memory cache for Discord messages (60s TTL)
let cachedReviews: any[] = [];
let cacheExpiresAt = 0;

// Persistent memory cache for Discord user profiles
const userProfileCache = new Map<string, { author: string; username?: string; avatar?: string }>();

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

    // 1. Extract all unique user IDs from messages
    const rawUserIds = messages
      .map((msg: any) => {
        const embed = msg.embeds?.[0];
        if (!embed) return '';
        const footerText = embed.footer?.text || '';
        const userIdMatch =
          footerText.match(/User ID:\s*(\d+)/i) ||
          (embed.fields?.find((f: any) => f.name === 'From')?.value || '').match(/<@!?(\d+)>/);
        return userIdMatch ? userIdMatch[1] : '';
      })
      .filter(Boolean);

    const uniqueUserIds = Array.from(new Set(rawUserIds));

    // 2. Resolve user profiles (In-Memory Cache -> Supabase discord_users -> Discord REST API)
    const userProfiles = new Map<string, { author: string; username?: string; avatar?: string }>();
    const missingFromMemory: string[] = [];

    for (const uid of uniqueUserIds) {
      if (userProfileCache.has(uid)) {
        userProfiles.set(uid, userProfileCache.get(uid)!);
      } else {
        missingFromMemory.push(uid);
      }
    }

    if (missingFromMemory.length > 0) {
      try {
        const { data: dbUsers } = await supabaseAdmin
          .from('discord_users')
          .select('discord_user_id, display_name, username, avatar_url')
          .in('discord_user_id', missingFromMemory);

        (dbUsers || []).forEach((u: any) => {
          const author = u.display_name || u.username;
          if (author) {
            const profile = {
              author,
              username: u.username || undefined,
              avatar: u.avatar_url || undefined
            };
            userProfiles.set(String(u.discord_user_id), profile);
            userProfileCache.set(String(u.discord_user_id), profile);
          }
        });
      } catch (err) {
        console.warn('[Reviews API] Error querying discord_users from Supabase:', err);
      }
    }

    // 3. Any users still unresolved -> fetch from Discord REST API
    const stillMissing = uniqueUserIds.filter((uid) => !userProfiles.has(uid));
    if (stillMissing.length > 0 && DISCORD_BOT_TOKEN) {
      await Promise.allSettled(
        stillMissing.map(async (uid) => {
          try {
            const uRes = await fetch(`https://discord.com/api/v10/users/${uid}`, {
              headers: {
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json'
              }
            });
            if (uRes.ok) {
              const u = await uRes.json();
              const author = u.global_name || u.username || `Discord User`;
              const username = u.username || undefined;
              const avatar = u.avatar
                ? `https://cdn.discordapp.com/avatars/${uid}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}`
                : undefined;

              const profile = { author, username, avatar };
              userProfiles.set(uid, profile);
              userProfileCache.set(uid, profile);

              // Persist into Supabase discord_users table
              Promise.resolve(
                supabaseAdmin
                  .from('discord_users')
                  .upsert(
                    {
                      discord_user_id: uid,
                      display_name: author,
                      username: username || null,
                      avatar_url: avatar || null,
                      updated_at: new Date().toISOString()
                    },
                    { onConflict: 'discord_user_id' }
                  )
              ).catch(() => {});
            }
          } catch (e) {
            console.warn(`[Reviews API] Failed to fetch discord user ${uid}:`, e);
          }
        })
      );
    }

    const reviews: any[] = [];

    for (const msg of messages) {
      const embed = msg.embeds?.[0];
      if (!embed) continue;

      // Extract user ID from footer or content
      const footerText = embed.footer?.text || '';
      const userIdMatch =
        footerText.match(/User ID:\s*(\d+)/i) ||
        (embed.fields?.find((f: any) => f.name === 'From')?.value || '').match(/<@!?(\d+)>/);
      const userId = userIdMatch ? userIdMatch[1] : '';

      // Count stars in Rating field
      const ratingField = embed.fields?.find((f: any) => f.name?.toLowerCase().includes('rating'))?.value || '';
      const starCount = (ratingField.match(/⭐/g) || []).length || 5;

      // Extract service name
      const serviceField = embed.fields?.find((f: any) => f.name?.toLowerCase().includes('service'))?.value || 'Account Generator';

      // Clean comment description
      const comment = (embed.description || '').replace(/^["']|["']$/g, '').trim();
      if (!comment) continue;

      const profile = userId ? userProfiles.get(userId) : null;
      const author = profile?.author || (userId ? `Client #${userId.slice(-4)}` : 'Verified Client');
      const username = profile?.username;
      const avatarUrl = profile?.avatar || embed.thumbnail?.url || '/images/Profile.png';
      const timestamp = embed.timestamp || msg.timestamp;

      reviews.push({
        id: msg.id,
        userId,
        author,
        username,
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
