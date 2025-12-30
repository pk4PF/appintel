import { getServerClient } from '../lib/supabase';
import { fetchAppReviewsMultiCountry, ReviewResult } from './apple-reviews-rss';
import type { ReviewInsert } from '@/types/database';

/**
 * Transform RSS review result to our database schema
 */
function transformReviewToInsert(
  review: ReviewResult,
  appId: string
): ReviewInsert {
  return {
    app_id: appId,
    review_id: review.id,
    author: review.author,
    title: review.title,
    review_text: review.text,
    rating: review.rating,
    review_date: review.date ? new Date(review.date).toISOString().split('T')[0] : null,
    version: review.version,
    processed: false,
  };
}

/**
 * Fetch and store reviews for a single app using FREE RSS feed
 */
export async function ingestReviewsForApp(
  appId: string,
  appStoreId: string,
  maxReviews = 100
): Promise<{ success: number; failed: number }> {
  const supabase = getServerClient();

  console.log(`  📝 Fetching reviews for app ${appStoreId} via RSS...`);

  let success = 0;
  let failed = 0;

  try {
    // Fetch from multiple countries to get more diverse reviews
    const reviews = await fetchAppReviewsMultiCountry(appStoreId, undefined, Math.ceil(maxReviews / 4));
    console.log(`    Found ${reviews.length} reviews`);

    if (reviews.length === 0) {
      return { success: 0, failed: 0 };
    }

    const reviewInserts = reviews.map(review => transformReviewToInsert(review, appId));

    // Batch upsert for better performance
    const { error } = await supabase
      .from('reviews')
      .upsert(reviewInserts, {
        onConflict: 'app_id,review_id',
        ignoreDuplicates: true,
      });

    if (error) {
      console.error(`    Error inserting reviews:`, error.message);
      failed = reviews.length;
    } else {
      success = reviews.length;
    }
  } catch (error) {
    console.error(`    Error fetching reviews:`, error);
  }

  console.log(`    ✓ ${success} reviews stored, ${failed} skipped/failed`);
  return { success, failed };
}

/**
 * Fetch reviews for top N apps by rating count
 * Prioritizes apps without reviews first, then apps with high rating counts
 */
export async function ingestReviewsForTopApps(
  limit = 100,
  reviewsPerApp = 100
): Promise<{ appsProcessed: number; totalReviews: number }> {
  const supabase = getServerClient();

  console.log(`\n📚 Fetching reviews for top ${limit} apps via Apify\n`);

  // First, get apps without reviews (priority)
  const { data: appsWithoutReviews } = await supabase
    .from('apps')
    .select(`
      id,
      app_store_id,
      name,
      reviews!left (id)
    `)
    .is('reviews.id', null)
    .limit(limit);

  // Then, get apps with reviews but prioritize by rating count
  const remainingLimit = limit - (appsWithoutReviews?.length || 0);
  const { data: appsWithReviews } = remainingLimit > 0 ? await supabase
    .from('apps')
    .select(`
      id,
      app_store_id,
      name,
      app_metrics!inner (rating_count)
    `)
    .order('created_at', { ascending: false })
    .limit(remainingLimit) : { data: [] };

  // Combine: apps without reviews first, then apps with reviews
  const allApps = [
    ...(appsWithoutReviews || []).map(app => ({ ...app, hasReviews: false })),
    ...(appsWithReviews || []).map(app => ({ ...app, hasReviews: true }))
  ];

  if (allApps.length === 0) {
    console.log('No apps to process');
    return { appsProcessed: 0, totalReviews: 0 };
  }

  let appsProcessed = 0;
  let totalReviews = 0;

  // Process in batches to speed up
  const BATCH_SIZE = 10;

  for (let i = 0; i < allApps.length; i += BATCH_SIZE) {
    const batch = allApps.slice(i, i + BATCH_SIZE);
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allApps.length / BATCH_SIZE)} (${batch.length} apps)...`);

    const results = await Promise.all(batch.map(async (app) => {
      console.log(`  Fetching reviews for: ${app.name}${app.hasReviews ? ' (updating)' : ' (new)'}`);
      return ingestReviewsForApp(app.id, app.app_store_id, reviewsPerApp);
    }));

    const batchSuccess = results.reduce((acc, r) => acc + r.success, 0);
    appsProcessed += results.length;
    totalReviews += batchSuccess;

    // Small delay between batches to avoid strict rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n✅ Processed ${appsProcessed} apps, ${totalReviews} total reviews`);
  return { appsProcessed, totalReviews };
}

/**
 * Get apps that need reviews fetched
 */
export async function getAppsNeedingReviews(limit = 50) {
  const supabase = getServerClient();

  // Get apps with no reviews yet
  const { data, error } = await supabase
    .from('apps')
    .select(`
      id,
      app_store_id,
      name,
      reviews (id)
    `)
    .is('reviews', null)
    .limit(limit);

  if (error) {
    console.error('Error:', error);
    return [];
  }

  // Filter to apps with no reviews
  return (data || []).filter((app) =>
    !app.reviews || (Array.isArray(app.reviews) && app.reviews.length === 0)
  );
}

/**
 * Get review statistics for an app
 */
export async function getReviewStats(appId: string) {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('reviews')
    .select('rating, review_date')
    .eq('app_id', appId);

  if (error || !data) {
    return null;
  }

  const ratings = data.map((r) => r.rating);
  const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

  const ratingDistribution = {
    1: ratings.filter((r) => r === 1).length,
    2: ratings.filter((r) => r === 2).length,
    3: ratings.filter((r) => r === 3).length,
    4: ratings.filter((r) => r === 4).length,
    5: ratings.filter((r) => r === 5).length,
  };

  // Reviews in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentReviews = data.filter(
    (r) => r.review_date && new Date(r.review_date) > thirtyDaysAgo
  ).length;

  return {
    totalReviews: data.length,
    averageRating: avgRating,
    ratingDistribution,
    recentReviews,
    reviewVelocity: recentReviews / 30, // reviews per day
  };
}

/**
 * Get all reviews for an app
 */
export async function getAppReviews(
  appId: string,
  options: { limit?: number; offset?: number; minRating?: number } = {}
) {
  const supabase = getServerClient();
  const { limit = 50, offset = 0, minRating } = options;

  let query = supabase
    .from('reviews')
    .select('*')
    .eq('app_id', appId)
    .order('review_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (minRating) {
    query = query.gte('rating', minRating);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data;
}

