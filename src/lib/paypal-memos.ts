import { supabaseAdmin } from '@/lib/supabase';

// Realistic everyday transaction memos for ban-evasion
const NATURAL_MEMOS = [
  'Football tickets',
  'Dinner refund',
  'Lunch split',
  'Movie tickets',
  'Concert pass',
  'Gym membership',
  'Coffee treat',
  'Weekend trip split',
  'Birthday gift',
  'Pizza last night',
  'Groceries share',
  'Gas money',
  'Uber ride split',
  'Badminton court fee',
  'Tennis session',
  'Board game night',
  'Festival pass',
  'Breakfast meetup',
  'Snack contribution',
  'Book loan return',
  'Study materials',
  'Camping gear rent',
  'Barbecue share',
  'Boba tea treat',
  'Karaoke night',
  'Bowling game',
  'Theme park ticket',
  'Art museum pass',
  'Ice cream round',
  'Potluck supplies',
  'Escape room fee',
  'Basketball court',
  'Arcade tokens',
  'Comic book share',
  'Skate park entry',
  'Swimming pass',
  'Bicycle repair share',
  'Photography print',
  'Cinema seats',
  'Dessert split'
];

/**
 * Returns a unique natural language memo that is not currently in use by another pending order.
 */
export async function getUniquePayPalMemo(): Promise<string> {
  try {
    const { data: pendingOrders } = await supabaseAdmin
      .from('orders')
      .select('payment_details')
      .eq('status', 'pending')
      .eq('provider', 'paypal');

    const activeMemos = new Set<string>();
    if (pendingOrders && Array.isArray(pendingOrders)) {
      for (const ord of pendingOrders) {
        const note = ord.payment_details?.paypal_note;
        if (note) activeMemos.add(note.toLowerCase().trim());
      }
    }

    // Filter available memos
    const available = NATURAL_MEMOS.filter((m) => !activeMemos.has(m.toLowerCase().trim()));

    if (available.length > 0) {
      const idx = Math.floor(Math.random() * available.length);
      return available[idx];
    }

    // Fallback if all 40 are busy: add a random 2-digit natural suffix
    const base = NATURAL_MEMOS[Math.floor(Math.random() * NATURAL_MEMOS.length)];
    const num = Math.floor(10 + Math.random() * 89);
    return `${base} ${num}`;
  } catch (err) {
    console.warn('[PayPal Memo] Failed to fetch active memos, using fallback:', err);
    return NATURAL_MEMOS[Math.floor(Math.random() * NATURAL_MEMOS.length)];
  }
}
