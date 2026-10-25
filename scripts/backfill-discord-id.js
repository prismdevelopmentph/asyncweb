// web/scripts/backfill-discord-id.js
// One-time backfill script to populate app_metadata.discord_id from user_metadata.provider_id

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[BACKFILL ERROR] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runBackfill() {
  console.log('[BACKFILL] Starting Discord ID migration to app_metadata...');

  let page = 1;
  const perPage = 100;
  let hasMore = true;
  let totalChecked = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error(`[BACKFILL ERROR] Failed to list users on page ${page}:`, error.message);
      break;
    }

    const users = data?.users || [];
    if (users.length === 0) {
      hasMore = false;
      break;
    }

    for (const u of users) {
      totalChecked++;
      const currentDiscordId = u.app_metadata?.discord_id;
      const providerId =
        u.user_metadata?.provider_id ||
        u.user_metadata?.sub ||
        (u.identities?.find((id) => id.provider === 'discord')?.id);

      if (currentDiscordId) {
        // Already set
        totalSkipped++;
        if (currentDiscordId === '719482630633947166') {
          console.log(`[BACKFILL] Owner account ${u.email} already has discord_id: ${currentDiscordId}`);
        }
        continue;
      }

      if (providerId) {
        const cleanDiscordId = String(providerId).trim();
        const { error: updateErr } = await supabase.auth.admin.updateUserById(u.id, {
          app_metadata: {
            ...(u.app_metadata || {}),
            discord_id: cleanDiscordId,
            provider: 'discord',
          },
        });

        if (updateErr) {
          console.error(`[BACKFILL ERROR] Failed to update user ${u.id} (${u.email}):`, updateErr.message);
        } else {
          totalUpdated++;
          console.log(`[BACKFILL] Updated user ${u.email} -> app_metadata.discord_id = ${cleanDiscordId}`);
          if (cleanDiscordId === '719482630633947166') {
            console.log(`[BACKFILL] >>> SUCCESS: Owner account ${u.email} verified and set to ${cleanDiscordId} <<<`);
          }
        }
      } else {
        console.warn(`[BACKFILL WARNING] User ${u.id} (${u.email}) has no discoverable Discord ID in metadata or identities.`);
      }
    }

    if (users.length < perPage) {
      hasMore = false;
    } else {
      page++;
    }
  }

  console.log(`[BACKFILL COMPLETE] Checked: ${totalChecked} | Updated: ${totalUpdated} | Already set: ${totalSkipped}`);
}

runBackfill().catch((err) => {
  console.error('[BACKFILL FATAL]:', err);
  process.exit(1);
});
