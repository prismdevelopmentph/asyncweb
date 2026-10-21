const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const botToken = envFile.match(/DISCORD_BOT_TOKEN=(.+)/)[1].trim();
const supabase = createClient(url, key);

async function indexAll() {
  console.log('Fetching Discord messages from channel 1540909705805693019...');
  const channelRes = await fetch('https://discord.com/api/v10/channels/1540909705805693019/messages?limit=100', {
    headers: { Authorization: `Bot ${botToken}` }
  });
  const messages = await channelRes.json();
  console.log('Total messages fetched:', messages.length);

  const rawUserIds = messages
    .map(m => {
      const embed = m.embeds?.[0];
      if (!embed) return '';
      const footerText = embed.footer?.text || '';
      const userIdMatch = footerText.match(/User ID:\s*(\d+)/i) || (embed.fields?.find(f => f.name === 'From')?.value || '').match(/<@!?(\d+)>/);
      return userIdMatch ? userIdMatch[1] : '';
    })
    .filter(Boolean);
  const uniqueUserIds = Array.from(new Set(rawUserIds));

  const { data: dbUsers } = await supabase.from('discord_users').select('discord_user_id, display_name, username, avatar_url').in('discord_user_id', uniqueUserIds);
  const userMap = new Map();
  (dbUsers || []).forEach(u => {
    userMap.set(String(u.discord_user_id), {
      author: u.display_name || u.username,
      username: u.username || undefined,
      avatar: u.avatar_url || undefined
    });
  });

  const missing = uniqueUserIds.filter(id => !userMap.has(id));
  console.log('Resolving missing users from Discord:', missing.length);

  for (const uid of missing) {
    try {
      const uRes = await fetch(`https://discord.com/api/v10/users/${uid}`, {
        headers: { Authorization: `Bot ${botToken}` }
      });
      if (uRes.ok) {
        const u = await uRes.json();
        const author = u.global_name || u.username || 'Verified Client';
        const username = u.username || undefined;
        const avatar = u.avatar ? `https://cdn.discordapp.com/avatars/${uid}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}` : undefined;
        userMap.set(uid, { author, username, avatar });

        await supabase.from('discord_users').upsert({
          discord_user_id: uid,
          display_name: author,
          username: username || null,
          avatar_url: avatar || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'discord_user_id' });
      }
    } catch(e) {
      console.warn('Error resolving user', uid, e);
    }
  }

  const reviews = [];
  for (const msg of messages) {
    const embed = msg.embeds?.[0];
    if (!embed) continue;
    const footerText = embed.footer?.text || '';
    const userIdMatch = footerText.match(/User ID:\s*(\d+)/i) || (embed.fields?.find(f => f.name === 'From')?.value || '').match(/<@!?(\d+)>/);
    const userId = userIdMatch ? userIdMatch[1] : '';

    const ratingField = embed.fields?.find(f => f.name?.toLowerCase().includes('rating'))?.value || '';
    const starCount = (ratingField.match(/⭐/g) || []).length || 5;
    const serviceField = embed.fields?.find(f => f.name?.toLowerCase().includes('service'))?.value || 'Account Generator';
    const comment = (embed.description || '').replace(/^["']|["']$/g, '').trim();
    if (!comment) continue;

    const profile = userId ? userMap.get(userId) : null;
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

  console.log('Total indexed reviews:', reviews.length);

  const { error } = await supabase.from('config').upsert({
    key: 'indexed_reviews_cache',
    value: JSON.stringify(reviews)
  }, { onConflict: 'key' });

  if (error) {
    console.error('Failed to save to config:', error);
  } else {
    console.log('Successfully saved to Supabase config (indexed_reviews_cache)!');
  }
}

indexAll();

