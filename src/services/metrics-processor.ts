import { getServerClient } from '@/lib/supabase';
import type { AppMetricsInsert } from '@/types/database';

/**
 * Calculate daily metrics snapshot for an app
 * This aggregates review data and calculates derived metrics
 */
export async function calculateDailyMetrics(appId: string): Promise<AppMetricsInsert | null> {
  const supabase = getServerClient();
  const today = new Date().toISOString().split('T')[0];

  // Get app's current review stats
  const { data: reviews, error: reviewError } = await supabase
    .from('reviews')
    .select('rating')
    .eq('app_id', appId);

  if (reviewError) {
    console.error('Error fetching reviews:', reviewError);
    return null;
  }

  // Calculate metrics from reviews
  const ratings = reviews?.map((r) => r.rating) || [];
  const avgRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null;

  // Get the most recent metrics for reference (for download/revenue estimates)
  // Exclude today's date to get the previous metrics (in case we're updating today's entry)
  const { data: lastMetricsArray } = await supabase
    .from('app_metrics')
    .select('*')
    .eq('app_id', appId)
    .lt('date', today) // Get metrics from before today
    .order('date', { ascending: false })
    .limit(1);
  
  const lastMetrics = lastMetricsArray && lastMetricsArray.length > 0 ? lastMetricsArray[0] : null;

  // Estimate downloads based on review count (industry average: ~1-2% of users leave reviews)
  // This is a rough proxy - real data would come from a paid source
  const estimatedDownloads = ratings.length > 0 
    ? Math.round(ratings.length * 50) // Conservative 2% conversion
    : lastMetrics?.downloads_estimate || null;

  // Use review count from reviews table if available, otherwise preserve previous rating_count
  // This prevents overwriting App Store rating counts for apps we haven't fetched reviews for yet
  const reviewCount = ratings.length;
  const ratingCount = reviewCount > 0 
    ? reviewCount 
    : (lastMetrics?.rating_count || 0);

  // Use calculated rating from reviews if available, otherwise preserve previous rating
  const finalRating = avgRating 
    ? Math.round(avgRating * 10) / 10 
    : lastMetrics?.rating || null;

  const metrics: AppMetricsInsert = {
    app_id: appId,
    date: today,
    rating: finalRating,
    rating_count: ratingCount,
    review_count: reviewCount,
    downloads_estimate: estimatedDownloads,
    revenue_estimate: lastMetrics?.revenue_estimate || null,
    rank_category: lastMetrics?.rank_category || null,
    rank_overall: lastMetrics?.rank_overall || null,
  };

  return metrics;
}

/**
 * Update metrics for all apps
 */
export async function updateAllMetrics(): Promise<{ success: number; failed: number }> {
  const supabase = getServerClient();
  const today = new Date().toISOString().split('T')[0];

  console.log(`\n📊 Updating metrics for ${today}\n`);

  // Get all apps
  const { data: apps, error } = await supabase
    .from('apps')
    .select('id, name');

  if (error) {
    console.error('Error fetching apps:', error);
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  for (const app of apps || []) {
    const metrics = await calculateDailyMetrics(app.id);
    
    if (metrics) {
      const { error: insertError } = await supabase
        .from('app_metrics')
        .upsert(metrics, { onConflict: 'app_id,date' });

      if (insertError) {
        console.error(`  ✗ ${app.name}: ${insertError.message}`);
        failed++;
      } else {
        console.log(`  ✓ ${app.name}`);
        success++;
      }
    } else {
      failed++;
    }
  }

  console.log(`\n✅ Metrics updated: ${success} success, ${failed} failed`);
  return { success, failed };
}

/**
 * Get metrics history for an app
 */
export async function getMetricsHistory(
  appId: string,
  days = 30
): Promise<{
  dates: string[];
  ratings: (number | null)[];
  downloads: (number | null)[];
  reviewCounts: (number | null)[];
}> {
  const supabase = getServerClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('app_metrics')
    .select('date, rating, downloads_estimate, review_count')
    .eq('app_id', appId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error || !data) {
    return { dates: [], ratings: [], downloads: [], reviewCounts: [] };
  }

  return {
    dates: data.map((m) => m.date),
    ratings: data.map((m) => m.rating),
    downloads: data.map((m) => m.downloads_estimate),
    reviewCounts: data.map((m) => m.review_count),
  };
}

/**
 * Calculate trend direction from a series of values
 * Returns: 'up', 'down', or 'flat'
 */
export function calculateTrend(values: (number | null)[]): 'up' | 'down' | 'flat' {
  const validValues = values.filter((v): v is number => v !== null);
  
  if (validValues.length < 2) {
    return 'flat';
  }

  // Simple linear regression slope
  const n = validValues.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = validValues.reduce((a, b) => a + b, 0);
  const sumXY = validValues.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Threshold for considering it "flat"
  const avgValue = sumY / n;
  const threshold = avgValue * 0.01; // 1% of average

  if (slope > threshold) return 'up';
  if (slope < -threshold) return 'down';
  return 'flat';
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Get category-level metrics aggregation
 */
export async function getCategoryMetrics(categoryId: string) {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('apps')
    .select(`
      id,
      app_metrics (
        rating,
        downloads_estimate,
        rating_count
      )
    `)
    .eq('category_id', categoryId);

  if (error || !data) {
    return null;
  }

  // Flatten metrics
  const allMetrics = data.flatMap((app) => 
    Array.isArray(app.app_metrics) ? app.app_metrics : []
  );

  if (allMetrics.length === 0) {
    return null;
  }

  const ratings = allMetrics.map((m) => m.rating).filter((r): r is number => r !== null);
  const downloads = allMetrics.map((m) => m.downloads_estimate).filter((d): d is number => d !== null);

  return {
    appCount: data.length,
    avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
    totalDownloads: downloads.reduce((a, b) => a + b, 0),
    avgDownloadsPerApp: downloads.reduce((a, b) => a + b, 0) / data.length,
  };
}

