/**
 * Automated Live FX Exchange Rate & Currency Converter
 * Real-time PHP -> USD conversion with in-memory 1-hour cache.
 */

let cachedRate: number | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache
const DEFAULT_FALLBACK_RATE = 58.5; // Resilient fallback rate

export async function getUsdToPhpRate(): Promise<number> {
  const now = Date.now();
  if (cachedRate && now - lastFetchedAt < CACHE_TTL_MS) {
    return cachedRate;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.PHP && typeof data.rates.PHP === 'number') {
        const val = Number(data.rates.PHP);
        cachedRate = val;
        lastFetchedAt = now;
        return val;
      }
    }
  } catch (err) {
    console.warn('[FX Rate] Failed to fetch live rate, using cached/fallback:', err);
  }

  return cachedRate !== null ? cachedRate : DEFAULT_FALLBACK_RATE;
}

export function convertPhpToUsd(phpPrice: number, rate: number): number {
  if (!phpPrice || phpPrice <= 0 || !rate || rate <= 0) return 0;
  const usd = phpPrice / rate;
  // Round up to 2 decimal places cleanly
  return Math.round((usd + Number.EPSILON) * 100) / 100;
}

export function computePricing(basePhp: number, discountPercent: number = 0, rate: number = 58.5) {
  const cleanBase = Math.max(0, Number(basePhp) || 0);
  const cleanDiscount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const hasDiscount = cleanDiscount > 0;

  const finalPhp = hasDiscount ? Math.round(cleanBase * (1 - cleanDiscount / 100)) : cleanBase;
  const originalPhp = hasDiscount ? cleanBase : undefined;

  const finalUsd = convertPhpToUsd(finalPhp, rate);
  const originalUsd = originalPhp ? convertPhpToUsd(originalPhp, rate) : undefined;

  return {
    pricePHP: finalPhp,
    priceUSD: finalUsd,
    originalPricePHP: originalPhp,
    originalPriceUSD: originalUsd,
    discountPercent: cleanDiscount,
    hasDiscount
  };
}
