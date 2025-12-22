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

  // If we have revenue estimate, use it directly
  if (revenueEstimate > 0) {
    return { mrr: revenueEstimate, method: 'estimated' };
  }

  // Calculate app age in months
  const releaseDate = app.release_date ? new Date(app.release_date) : new Date();
  const monthsActive = Math.max(1, Math.floor((Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  // Monthly downloads roughly = Total / Months Active (capped at 12 for "current" run-rate)
  // For old apps, we assume they reached a steady state or declined
  const currentMonthlyDownloads = totalDownloads / Math.max(monthsActive, 12);

  // Category-specific download multiplier (if we were estimating from ratings, but here we have downloads_estimate)
  // We'll trust downloads_estimate but apply conservative conversion

  // Calculate based on pricing model
  const pricingModel = app.pricing_model || 'free';
  const price = app.price || 0;

  if (pricingModel === 'subscription') {
    // Subscription: 2.5% conversion, average $6/month
    const avgMonthlyPrice = price > 0 ? price : 5.99;
    const conversionRate = 0.025;
    const activeUsers = currentMonthlyDownloads * 1.5; // Assume 1.5x monthly downloads are active/retained
    const mrr = activeUsers * conversionRate * avgMonthlyPrice;
    return { mrr: Math.round(mrr), method: 'subscription' };
  }

  if (pricingModel === 'freemium' || pricingModel === 'paid') {
    // IAP or Paid: 1.5% conversion
    const avgPrice = price > 0 ? price : 3.99;
    const conversionRate = 0.015;
    const mrr = currentMonthlyDownloads * conversionRate * avgPrice;
    return { mrr: Math.round(mrr), method: pricingModel === 'freemium' ? 'iap' : 'paid' };
  }

  // Free apps: estimate from ads
  const adRevenuePerUser = 0.05; // $0.05 per user per month
  const activeUsers = currentMonthlyDownloads * 2;
  const mrr = activeUsers * adRevenuePerUser;

  return { mrr: Math.round(mrr), method: 'estimated' };
}

/**
 * Calculate MRR from metrics directly (for use in queries)
 */
export function calculateMRRFromMetrics(
  pricingModel: string | null,
  price: number | null,
  downloadsEstimate: number | null,
  releaseDate?: string | null
): number {
  const totalDownloads = downloadsEstimate || 0;
  const model = pricingModel || 'free';
  const appPrice = price || 0;

  // Estimate current monthly downloads from total
  const date = releaseDate ? new Date(releaseDate) : new Date();
  const monthsActive = Math.max(1, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const currentMonthlyDownloads = totalDownloads / Math.max(monthsActive, 12);

  if (model === 'subscription') {
    const avgMonthlyPrice = appPrice > 0 ? appPrice : 5.99;
    const conversionRate = 0.025;
    const activeUsers = currentMonthlyDownloads * 1.5;
    return Math.round(activeUsers * conversionRate * avgMonthlyPrice);
  }

  if (model === 'freemium' || model === 'paid') {
    const avgPrice = appPrice > 0 ? appPrice : 3.99;
    const conversionRate = 0.015;
    return Math.round(currentMonthlyDownloads * conversionRate * avgPrice);
  }

  // Free apps
  const adRevenuePerUser = 0.05;
  const activeUsers = currentMonthlyDownloads * 2;
  return Math.round(activeUsers * adRevenuePerUser);
}

/**
 * Format MRR for display
 */
export function formatMRR(mrr: number): string {
  if (mrr >= 1000000) return `$${(mrr / 1000000).toFixed(1)}M`;
  if (mrr >= 1000) return `$${(mrr / 1000).toFixed(1)}K`;
  return `$${mrr}`;
}






