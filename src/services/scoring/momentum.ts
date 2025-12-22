import { getServerClient } from '@/lib/supabase';
import { calculateTrend, calculatePercentChange } from '@/services/metrics-processor';

/**
 * Calculate momentum score (0-100)
 * 
 * Momentum measures how quickly an app is growing relative to its baseline.
 * High momentum = rapid growth in downloads/reviews/ratings
 * 
 * Components:
 * - Download growth rate (vs 7/14/30 day averages)
 * - Review velocity (new reviews per day)
 * - Rating trend (improving or declining)
 */
export async function calculateMomentum(
  appId: string,
  timeWindow: '7d' | '14d' | '30d' = '30d'
): Promise<{ score: number; details: MomentumDetails }> {
  const supabase = getServerClient();
  
  const days = timeWindow === '7d' ? 7 : timeWindow === '14d' ? 14 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get metrics history
  const { data: metrics, error } = await supabase
    .from('app_metrics')
    .select('*')
    .eq('app_id', appId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error || !metrics || metrics.length < 2) {
    return {
      score: 50, // Neutral score if no data
      details: {
        downloadGrowth: 0,
        reviewVelocity: 0,
        ratingTrend: 'flat',
        dataPoints: metrics?.length || 0,
      },
    };
  }

  // Calculate download growth
  const downloads = metrics.map((m) => m.downloads_estimate).filter((d): d is number => d !== null);
  let downloadGrowth = 0;
  if (downloads.length >= 2) {
    const firstHalf = downloads.slice(0, Math.floor(downloads.length / 2));
    const secondHalf = downloads.slice(Math.floor(downloads.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    downloadGrowth = calculatePercentChange(firstAvg, secondAvg);
  }

  // Calculate review velocity (reviews per day)
  const reviewCounts = metrics.map((m) => m.review_count).filter((r): r is number => r !== null);
  let reviewVelocity = 0;
  if (reviewCounts.length >= 2) {
    const reviewGrowth = reviewCounts[reviewCounts.length - 1] - reviewCounts[0];
    reviewVelocity = reviewGrowth / days;
  }

  // Calculate rating trend
  const ratings = metrics.map((m) => m.rating);
  const ratingTrend = calculateTrend(ratings);

  // Calculate composite momentum score
  let score = 50; // Start neutral

  // Download growth contribution (up to ±30 points)
  if (downloadGrowth > 0) {
    score += Math.min(downloadGrowth / 2, 30); // +30 max for 60%+ growth
  } else {
    score += Math.max(downloadGrowth / 2, -20); // -20 max for declining
  }

  // Review velocity contribution (up to ±15 points)
  // 5+ reviews/day is excellent, 0 is neutral
  score += Math.min(reviewVelocity * 3, 15);

  // Rating trend contribution (up to ±5 points)
  if (ratingTrend === 'up') score += 5;
  if (ratingTrend === 'down') score -= 5;

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score * 100) / 100,
    details: {
      downloadGrowth: Math.round(downloadGrowth * 100) / 100,
      reviewVelocity: Math.round(reviewVelocity * 100) / 100,
      ratingTrend,
      dataPoints: metrics.length,
    },
  };
}

interface MomentumDetails {
  downloadGrowth: number;
  reviewVelocity: number;
  ratingTrend: 'up' | 'down' | 'flat';
  dataPoints: number;
}

