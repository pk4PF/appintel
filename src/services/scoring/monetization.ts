import { getServerClient } from '@/lib/supabase';

/**
 * Calculate monetization potential score (0-100)
 * 
 * Monetization potential measures how viable it is to make money in this space.
 * 
 * Components:
 * - Category monetization success (are apps in this category making money?)
 * - Pricing model distribution (subscription vs one-time vs free)
 * - Revenue per download estimates
 * - User willingness to pay (based on category norms)
 */
export async function calculateMonetizationPotential(
  appId: string
): Promise<{ score: number; details: MonetizationDetails }> {
  const supabase = getServerClient();

  // Get app with category
  const { data: app, error: appError } = await supabase
    .from('apps')
    .select(`
      id,
      price,
      pricing_model,
      category_id,
      app_metrics (
        downloads_estimate,
        revenue_estimate
      )
    `)
    .eq('id', appId)
    .single();

  if (appError || !app) {
    return {
      score: 50,
      details: {
        categoryPaidRatio: 0,
        avgCategoryPrice: 0,
        revenuePerDownload: 0,
        pricingModel: 'unknown',
      },
    };
  }

  // Get category pricing distribution
  let categoryPaidRatio = 0.3; // Default assumption
  let avgCategoryPrice = 0;
  const categoryPricingModels: Record<string, number> = {};

  if (app.category_id) {
    const { data: categoryApps } = await supabase
      .from('apps')
      .select('price, pricing_model')
      .eq('category_id', app.category_id);

    if (categoryApps && categoryApps.length > 0) {
      const paidApps = categoryApps.filter((a) => a.price > 0 || a.pricing_model !== 'free');
      categoryPaidRatio = paidApps.length / categoryApps.length;

      const prices = categoryApps.map((a) => a.price).filter((p) => p > 0);
      avgCategoryPrice = prices.length > 0 
        ? prices.reduce((a, b) => a + b, 0) / prices.length 
        : 0;

      // Count pricing models
      for (const a of categoryApps) {
        const model = a.pricing_model || 'free';
        categoryPricingModels[model] = (categoryPricingModels[model] || 0) + 1;
      }
    }
  }

  // Calculate revenue per download
  const metrics = Array.isArray(app.app_metrics) ? app.app_metrics : [];
  const latestMetrics = metrics.sort((a, b) => 
    (b.downloads_estimate || 0) - (a.downloads_estimate || 0)
  )[0];

  let revenuePerDownload = 0;
  if (latestMetrics?.downloads_estimate && latestMetrics?.revenue_estimate) {
    revenuePerDownload = latestMetrics.revenue_estimate / latestMetrics.downloads_estimate;
  }

  // Calculate monetization score
  let score = 50;

  // Category paid ratio contribution (up to ±20 points)
  // Higher ratio = users in this category are willing to pay
  score += (categoryPaidRatio - 0.3) * 50;

  // Subscription model presence (up to +15 points)
  // Categories with successful subscriptions have recurring revenue potential
  const subscriptionRatio = (categoryPricingModels['subscription'] || 0) / 
    Object.values(categoryPricingModels).reduce((a, b) => a + b, 1);
  score += subscriptionRatio * 15;

  // Average category price (up to +10 points)
  // Higher prices = users accept paying more
  if (avgCategoryPrice > 5) {
    score += Math.min((avgCategoryPrice - 5) / 2, 10);
  }

  // Revenue per download (up to +15 points)
  if (revenuePerDownload > 0.5) {
    score += Math.min((revenuePerDownload - 0.5) * 10, 15);
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score * 100) / 100,
    details: {
      categoryPaidRatio: Math.round(categoryPaidRatio * 100) / 100,
      avgCategoryPrice: Math.round(avgCategoryPrice * 100) / 100,
      revenuePerDownload: Math.round(revenuePerDownload * 100) / 100,
      pricingModel: app.pricing_model || 'free',
    },
  };
}

interface MonetizationDetails {
  categoryPaidRatio: number;
  avgCategoryPrice: number;
  revenuePerDownload: number;
  pricingModel: string;
}

