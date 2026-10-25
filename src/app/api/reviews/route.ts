import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || '';
const VOUCH_CHANNEL_ID = process.env.VOUCH_CHANNEL_ID || '1540909705805693019';

// In-memory cache for Discord messages (60s TTL)
let cachedReviews: any[] = [];
let cacheExpiresAt = 0;
let isSyncing = false;

// Persistent memory cache for Discord user profiles
const userProfileCache = new Map<string, { author: string; username?: string; avatar?: string }>();

async function fetchAndIndexReviews(): Promise<any[]> {
  if (isSyncing) return cachedReviews;
  isSyncing = true;

  try {
    const discordRes = await fetch(
      `https://discord.com/api/v10/channels/${VOUCH_CHANNEL_ID}/messages?limit=100`,
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
      return cachedReviews;
    }

    const messages = await discordRes.json();
    if (!Array.isArray(messages)) {
      return cachedReviews;
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
    cacheExpiresAt = Date.now() + 60000;

    // Persist full indexed reviews snapshot into Supabase config table for instant zero-lag cold start
    Promise.resolve(
      supabaseAdmin
        .from('config')
        .upsert(
          {
            key: 'indexed_reviews_cache',
            value: JSON.stringify(reviews)
          },
          { onConflict: 'key' }
        )
    ).catch((err) => console.warn('[Reviews API] Error indexing reviews to config:', err));

    return reviews;
  } finally {
    isSyncing = false;
  }
}

export async function GET() {
  try {
    const now = Date.now();

    // 1. In-memory hit
    if (cachedReviews.length > 0 && now < cacheExpiresAt) {
      return NextResponse.json({ reviews: cachedReviews });
    }

    // 2. Cold start / server restart: check indexed Supabase config table first for instant sub-50ms response
    if (cachedReviews.length === 0) {
      try {
        const { data: dbConfig } = await supabaseAdmin
          .from('config')
          .select('value')
          .eq('key', 'indexed_reviews_cache')
          .single();

        if (dbConfig?.value) {
          const parsed = JSON.parse(dbConfig.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cachedReviews = parsed;
            cacheExpiresAt = now + 60000;
            // Kick off background Discord sync asynchronously without blocking response
            fetchAndIndexReviews().catch(() => {});
            return NextResponse.json({ reviews: cachedReviews });
          }
        }
      } catch (err) {
        console.warn('[Reviews API] Cold start DB lookup error:', err);
      }
    }

    // 3. If cache is empty or expired, run sync
    const reviews = await fetchAndIndexReviews();
    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('[Reviews API] Fatal error:', error);
    return NextResponse.json({ reviews: cachedReviews });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    const callerDiscordId = auth.data.discordId;

    const body = await request.json().catch(() => ({}));
    const { licenseId, rating, comment, serviceName } = body;

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5 stars.' }, { status: 400 });
    }

    const cleanComment = (comment || '').trim();
    if (!cleanComment || cleanComment.length < 2) {
      return NextResponse.json({ error: 'Please enter a valid review comment.' }, { status: 400 });
    }

    // 1. Verify user holds an active or historical license
    let licQuery = supabaseAdmin
      .from('licenses')
      .select('id, redeemed_by')
      .eq('redeemed_by', callerDiscordId);

    if (licenseId) {
      licQuery = licQuery.eq('id', licenseId);
    }

    const { data: userLics, error: licErr } = await licQuery.limit(1);
    if (licErr || !userLics || userLics.length === 0) {
      return NextResponse.json({ error: 'You must own a redeemed license to submit a verified vouch.' }, { status: 403 });
    }

    // 2. Mark license vouch_given = true
    const targetLicId = userLics[0].id;
    await supabaseAdmin
      .from('licenses')
      .update({ vouch_given: true })
      .eq('id', targetLicId);

    // 3. Resolve user profile for avatar
    const { data: dbUser } = await supabaseAdmin
      .from('discord_users')
      .select('display_name, username, avatar_url')
      .eq('discord_user_id', callerDiscordId)
      .maybeSingle();

    const resolvedAvatar = dbUser?.avatar_url || auth.data.user.user_metadata?.avatar_url || `https://cdn.discordapp.com/embed/avatars/${parseInt(callerDiscordId.slice(-2) || '0', 10) % 5}.png`;

    // 4. Dispatch embed to Discord vouch channel (same format as bot)
    const stars = '⭐'.repeat(parsedRating) + '☆'.repeat(5 - parsedRating);

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
            { name: 'From', value: `<@${callerDiscordId}>`, inline: true }
          ],
          thumbnail: { url: resolvedAvatar },
          footer: { text: `User ID: ${callerDiscordId}` }
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
