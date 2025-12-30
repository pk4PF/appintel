import { getServerClient } from '@/lib/supabase';

/**
 * Estimate Monthly Recurring Revenue (MRR) for an app
 * Based on pricing model, downloads, and conversion rates
 */
export async function estimateMRR(appId: string): Promise<{
  mrr: number;
  method: 'subscription' | 'iap' | 'paid' | 'estimated' | 'unknown';
}> {
  const supabase = getServerClient();

  const { data: app } = await supabase
    .from('apps')
    .select(`
      price,
      pricing_model,
      release_date,
      app_metrics (downloads_estimate, revenue_estimate)
    `)
    .eq('id', appId)
    .single();

  if (!app) {
    return { mrr: 0, method: 'unknown' };
  }

  const metrics = Array.isArray(app.app_metrics) ? app.app_metrics : [];
  const latestMetrics = metrics.sort((a: { downloads_estimate?: number | null }, b: { downloads_estimate?: number | null }) =>
    (b.downloads_estimate || 0) - (a.downloads_estimate || 0)
  )[0];

  const totalDownloads = latestMetrics?.downloads_estimate || 0;
  const revenueEstimate = latestMetrics?.revenue_estimate || 0;

  // Calculate Formula MRR first
  const formulaMRR = calculateMRRFromMetrics(
    app.pricing_model,
    app.price,
    totalDownloads,
    app.release_date,
    revenueEstimate
  );

  // Use the higher of the two (stale estimates in DB shouldn't nerf the value)
  const finalMRR = Math.max(formulaMRR, revenueEstimate || 0);

  return { mrr: finalMRR, method: formulaMRR > (revenueEstimate || 0) ? 'subscription' : 'estimated' };
}

/**
 * Calculate MRR from metrics directly (for use in queries)
 */
export function calculateMRRFromMetrics(
  pricingModel: string | null,
  price: number | null,
  downloadsEstimate: number | null,
  releaseDate?: string | null,
  revenueEstimate?: number | null
): number {
  const totalDownloads = downloadsEstimate || 0;
  if (totalDownloads === 0) return 0;

  const model = pricingModel?.toLowerCase() || 'free';
  const appPrice = price || 0;

  // 2. Estimate current monthly downloads from total
  const date = releaseDate ? new Date(releaseDate) : new Date();
  const monthsActive = Math.max(1, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  // For older apps, we assume a decay in monthly downloads
  const avgMonthlyDownloads = totalDownloads / monthsActive;

  // High-growth apps (lots of downloads in short time) shouldn't decay
  let currentMonthlyDownloads = avgMonthlyDownloads;
  if (monthsActive > 12 && totalDownloads < 100000) {
    // Only decay for smaller, older apps
    currentMonthlyDownloads = avgMonthlyDownloads * 0.7;
  }

  if (model === 'subscription') {
    // High-tier apps (Atoms, meditation, etc.) convert MUCH better
    // Professional apps have 5-10% conversion from monthly downloads
    const avgMonthlyPrice = appPrice > 0 ? appPrice : 9.99;

    // Progressive conversion rate based on volume (popular apps convert better)
    let conversionRate = 0.06; // Base 6%
    if (totalDownloads > 500000) conversionRate = 0.10; // 10% for massive apps
    if (totalDownloads > 5000000) conversionRate = 0.18; // 18% for global brands (Atoms, etc)

    // Brand Power: Top apps can charge premium subscriptions
    const brandMultiplier = totalDownloads > 1000000 ? 1.4 : 1.0;

    const formulaMRR = Math.round(currentMonthlyDownloads * conversionRate * avgMonthlyPrice * brandMultiplier);
    return Math.max(formulaMRR, revenueEstimate || 0);
  }

  if (model === 'freemium' || model === 'paid') {
    const avgPrice = appPrice > 0 ? appPrice : 7.99;
    const conversionRate = model === 'paid' ? 1.0 : 0.04;
    const formulaMRR = Math.round(currentMonthlyDownloads * conversionRate * avgPrice);
    return Math.max(formulaMRR, revenueEstimate || 0);
  }

  // Free apps (Ads revenue)
  const adRevenuePerDownload = 0.25; // Increased from 0.15 for better realism
  const baseRevenue = Math.round(currentMonthlyDownloads * adRevenuePerDownload);

  // Use DB estimate as a floor, but prioritize formula
  return Math.max(baseRevenue, revenueEstimate || 0);
}

/**
 * Format MRR for display
 */
export function formatMRR(mrr: number): string {
  if (mrr >= 1000000) return `$${(mrr / 1000000).toFixed(1)}M`;
  if (mrr >= 1000) return `$${(mrr / 1000).toFixed(1)}K`;
  return `$${mrr}`;
}
