import { getServerClient } from '@/lib/supabase';

/**
 * Calculate demand signal score (0-100)
 * 
 * Demand signal measures market interest in this type of app.
 * High demand = users are actively seeking solutions in this space
 * 
 * Components:
 * - Absolute download volume (normalized by category)
 * - Review engagement (reviews relative to downloads)
 * - Recency of activity (recent downloads/reviews weighted higher)
 */
export async function calculateDemandSignal(
  appId: string,
  timeWindow: '7d' | '14d' | '30d' = '30d'
): Promise<{ score: number; details: DemandDetails }> {
  const supabase = getServerClient();

  const days = timeWindow === '7d' ? 7 : timeWindow === '14d' ? 14 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get app with category info
  const { data: app, error: appError } = await supabase
    .from('apps')
    .select(`
      id,
      category_id,
      app_metrics (
        downloads_estimate,
        review_count,
        rating_count,
        date
      )
    `)
    .eq('id', appId)
    .single();

  if (appError || !app) {
    return {
      score: 50,
      details: {
        downloadVolume: 0,
        reviewEngagement: 0,
        categoryAvgDownloads: 0,
        demandRatio: 1,
      },
    };
  }

  // Get latest metrics
  const metrics = Array.isArray(app.app_metrics) ? app.app_metrics : [];
  const latestMetrics = metrics
    .filter((m) => m.date >= startDate.toISOString().split('T')[0])
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (!latestMetrics) {
    return {
      score: 50,
      details: {
        downloadVolume: 0,
        reviewEngagement: 0,
        categoryAvgDownloads: 0,
        demandRatio: 1,
      },
    };
  }

  // Get category average downloads for comparison
  let categoryAvgDownloads = 10000; // Default baseline
  if (app.category_id) {
    const { data: categoryApps } = await supabase
      .from('apps')
      .select(`
        app_metrics (downloads_estimate)
      `)
      .eq('category_id', app.category_id);

    if (categoryApps && categoryApps.length > 0) {
      const allDownloads = categoryApps.flatMap((a) => {
        const m = Array.isArray(a.app_metrics) ? a.app_metrics : [];
        return m.map((x) => x.downloads_estimate).filter((d): d is number => d !== null);
      });
      
      if (allDownloads.length > 0) {
        categoryAvgDownloads = allDownloads.reduce((a, b) => a + b, 0) / allDownloads.length;
      }
    }
  }

  const downloads = latestMetrics.downloads_estimate || 0;
  const reviewCount = latestMetrics.review_count || 0;

  // Calculate demand ratio (app downloads / category average)
  const demandRatio = categoryAvgDownloads > 0 ? downloads / categoryAvgDownloads : 1;

  // Calculate review engagement (reviews per 1000 downloads)
  const reviewEngagement = downloads > 0 ? (reviewCount / downloads) * 1000 : 0;

  // Calculate composite score
  let score = 50;

  // Demand ratio contribution (up to ±35 points)
  // Ratio > 1 means above average demand
  if (demandRatio > 1) {
    score += Math.min((demandRatio - 1) * 20, 35);
  } else {
    score -= Math.min((1 - demandRatio) * 20, 25);
  }

  // Review engagement contribution (up to ±15 points)
  // High engagement (>50 reviews per 1000 downloads) is positive
  const engagementBaseline = 20; // 2% review rate
  if (reviewEngagement > engagementBaseline) {
    score += Math.min((reviewEngagement - engagementBaseline) / 10, 15);
  } else {
    score -= Math.min((engagementBaseline - reviewEngagement) / 10, 10);
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score * 100) / 100,
    details: {
      downloadVolume: downloads,
      reviewEngagement: Math.round(reviewEngagement * 100) / 100,
      categoryAvgDownloads: Math.round(categoryAvgDownloads),
      demandRatio: Math.round(demandRatio * 100) / 100,
    },
  };
}

interface DemandDetails {
  downloadVolume: number;
  reviewEngagement: number;
  categoryAvgDownloads: number;
  demandRatio: number;
}

