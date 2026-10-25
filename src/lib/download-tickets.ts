import { NextResponse } from 'next/server';
import crypto from 'crypto';

interface DownloadTicket {
  discordId: string;
  isOwner: boolean;
  expiresAt: number;
}

// In-memory one-time download tickets cache (60 seconds TTL)
const ticketStore = new Map<string, DownloadTicket>();

export function createDownloadTicket(discordId: string, isOwner: boolean): string {
  const code = `dl_${crypto.randomBytes(24).toString('base64url')}`;
  const expiresAt = Date.now() + 60 * 1000; // 60s valid

  // Clean expired tickets if store exceeds 500 entries
  if (ticketStore.size > 500) {
    const now = Date.now();
    for (const [k, v] of ticketStore.entries()) {
      if (v.expiresAt <= now) ticketStore.delete(k);
    }
  }

  ticketStore.set(code, { discordId, isOwner, expiresAt });
  return code;
}

export function consumeDownloadTicket(code: string): DownloadTicket | null {
  if (!code || !ticketStore.has(code)) return null;
  const ticket = ticketStore.get(code)!;
  ticketStore.delete(code); // One-time use

  if (Date.now() > ticket.expiresAt) {
    return null; // Expired
  }

  return ticket;
}
