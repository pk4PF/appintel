import { getServerClient } from '@/lib/supabase';

/**
 * Calculate competitive density score (0-100)
 * 
 * Competitive density measures how crowded the market is.
 * HIGH score = LOW competition = more opportunity
 * 
 * Components:
 * - Number of apps in category (fewer = better)
 * - Concentration of downloads (if top 3 dominate, harder to compete)
 * - Recency of new entrants (stale market = opportunity)
 * - Rating distribution (if all apps are 4.5+, hard to differentiate)
 */
export async function calculateCompetitiveDensity(
  appId: string
): Promise<{ score: number; details: CompetitionDetails }> {
  const supabase = getServerClient();

  // Get app's category
  const { data: app, error: appError } = await supabase
    .from('apps')
    .select('category_id')
    .eq('id', appId)
    .single();

  if (appError || !app?.category_id) {
    return {
      score: 50,
      details: {
        appsInCategory: 0,
        top3Concentration: 0,
        avgCategoryRating: 0,
        newEntrantsLast90Days: 0,
        marketOpenness: 'unknown',
      },
    };
  }

  // Get all apps in category with metrics
  const { data: categoryApps, error: categoryError } = await supabase
    .from('apps')
    .select(`
      id,
      release_date,
      app_metrics (
        downloads_estimate,
        rating
      )
    `)
    .eq('category_id', app.category_id);

  if (categoryError || !categoryApps) {
    return {
      score: 50,
      details: {
        appsInCategory: 0,
        top3Concentration: 0,
        avgCategoryRating: 0,
        newEntrantsLast90Days: 0,
        marketOpenness: 'unknown',
      },
    };
  }

  const appsInCategory = categoryApps.length;

  // Calculate top 3 download concentration
  const appDownloads = categoryApps.map((a) => {
    const metrics = Array.isArray(a.app_metrics) ? a.app_metrics : [];
    const latestDownloads = metrics
      .map((m) => m.downloads_estimate)
      .filter((d): d is number => d !== null)
      .sort((a, b) => b - a)[0];
    return latestDownloads || 0;
  }).sort((a, b) => b - a);

  const totalDownloads = appDownloads.reduce((a, b) => a + b, 0);
  const top3Downloads = appDownloads.slice(0, 3).reduce((a, b) => a + b, 0);
  const top3Concentration = totalDownloads > 0 ? top3Downloads / totalDownloads : 0;

  // Calculate average category rating
  const allRatings = categoryApps.flatMap((a) => {
    const metrics = Array.isArray(a.app_metrics) ? a.app_metrics : [];
    return metrics.map((m) => m.rating).filter((r): r is number => r !== null);
  });
  const avgCategoryRating = allRatings.length > 0
    ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
    : 0;

  // Count new entrants in last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const newEntrants = categoryApps.filter(
    (a) => a.release_date && new Date(a.release_date) > ninetyDaysAgo
  ).length;

  // Calculate competition score (inverse - high score = low competition)
  let score = 50;

  // Fewer apps in category = less competition (up to +20)
  // Baseline: 50 apps is "normal"
  if (appsInCategory < 50) {
    score += Math.min((50 - appsInCategory) / 2, 20);
  } else {
    score -= Math.min((appsInCategory - 50) / 10, 15);
  }

  // Lower top 3 concentration = more room (up to +20)
  // If top 3 have >80% of downloads, very concentrated
  if (top3Concentration < 0.5) {
    score += Math.min((0.5 - top3Concentration) * 40, 20);
  } else if (top3Concentration > 0.8) {
    score -= Math.min((top3Concentration - 0.8) * 50, 20);
  }

  // More new entrants = active market, but also more competition
  // Sweet spot: 5-15 new entrants
  if (newEntrants >= 5 && newEntrants <= 15) {
    score += 10; // Active but not overcrowded
  } else if (newEntrants < 5) {
    score += 5; // Stale market - might be opportunity
  } else if (newEntrants > 15) {
    score -= 10; // Too crowded
  }

  // CATEGORY UNDERSERVED SCORE - Reward categories with few good options
  // If category average rating < 3.8 AND < 20 apps = Underserved market = high opportunity
  if (avgCategoryRating < 3.8 && appsInCategory < 20) {
    score += 25; // Underserved market - big opportunity
  } else if (avgCategoryRating < 3.8 && appsInCategory < 50) {
    score += 15; // Somewhat underserved
  } else if (avgCategoryRating >= 4.3 && appsInCategory > 20) {
    score -= 15; // Saturated market - all apps are good, hard to differentiate
  } else if (avgCategoryRating > 4.3) {
    score -= 10; // High average rating = hard to differentiate
  } else if (avgCategoryRating < 3.8) {
    score += 10; // Underserved market
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine market openness label
  let marketOpenness: 'open' | 'moderate' | 'crowded' | 'dominated' | 'unknown';
  if (score >= 70) marketOpenness = 'open';
  else if (score >= 50) marketOpenness = 'moderate';
  else if (score >= 30) marketOpenness = 'crowded';
  else marketOpenness = 'dominated';

  return {
    score: Math.round(score * 100) / 100,
    details: {
      appsInCategory,
      top3Concentration: Math.round(top3Concentration * 100) / 100,
      avgCategoryRating: Math.round(avgCategoryRating * 100) / 100,
      newEntrantsLast90Days: newEntrants,
      marketOpenness,
    },
  };
}

interface CompetitionDetails {
  appsInCategory: number;
  top3Concentration: number;
  avgCategoryRating: number;
  newEntrantsLast90Days: number;
  marketOpenness: 'open' | 'moderate' | 'crowded' | 'dominated' | 'unknown';
}

