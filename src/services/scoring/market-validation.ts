import { getServerClient } from '@/lib/supabase';

/**
 * Calculate Market Validation Score (0-100)
 * 
 * Is there proven demand for this type of app?
 * 
 * High score indicators:
 * - Sufficient downloads (people want this)
 * - Active reviews (engaged users)
 * - Category has activity (not a dead market)
 * - Similar apps exist (validates the idea)
 */
export async function calculateMarketValidation(
  appId: string
): Promise<{ score: number; details: MarketValidationDetails }> {
  const supabase = getServerClient();
  
  // Get app data
  const { data: app, error } = await supabase
    .from('apps')
    .select(`
      id,
      category_id,
      release_date,
      app_metrics (rating_count, downloads_estimate, review_count),
      reviews (review_date)
    `)
    .eq('id', appId)
    .single();
  
  if (error || !app) {
    return {
      score: 50,
      details: {
        downloadsEstimate: 0,
        ratingCount: 0,
        categorySize: 0,
        recentCategoryActivity: 0,
        validationSignals: [],
      },
    };
  }
  
  // Extract metrics
  const metrics = Array.isArray(app.app_metrics) ? app.app_metrics : [];
  const latestMetrics = metrics.sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0))[0];
  
  const ratingCount = latestMetrics?.rating_count || 0;
  const downloadsEstimate = latestMetrics?.downloads_estimate || 0;
  
  // Get category activity
  let categorySize = 0;
  let recentCategoryActivity = 0;
  
  if (app.category_id) {
    // Count apps in category
    const { count: categoryCount } = await supabase
      .from('apps')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', app.category_id);
    
    categorySize = categoryCount || 0;
    
    // Count apps released in last 90 days in category
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { count: recentCount } = await supabase
      .from('apps')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', app.category_id)
      .gte('release_date', ninetyDaysAgo.toISOString().split('T')[0]);
    
    recentCategoryActivity = recentCount || 0;
  }
  
  // Calculate validation score
  let score = 50;
  const validationSignals: string[] = [];
  
  // DOWNLOAD VALIDATION (up to +25)
  // Downloads prove people want this type of app
  if (downloadsEstimate >= 100000) {
    score += 25;
    validationSignals.push('Strong download volume - validated market');
  } else if (downloadsEstimate >= 50000) {
    score += 20;
    validationSignals.push('Good download volume');
  } else if (downloadsEstimate >= 10000) {
    score += 15;
    validationSignals.push('Decent download volume');
  } else if (downloadsEstimate >= 1000) {
    score += 10;
    validationSignals.push('Some market traction');
  } else if (downloadsEstimate < 1000 && downloadsEstimate > 0) {
    score -= 5;
    validationSignals.push('Limited downloads - unproven market');
  }
  
  // RATING VOLUME VALIDATION (up to +15)
  // More ratings = more engaged users
  if (ratingCount >= 10000) {
    score += 15;
    validationSignals.push('High engagement - many ratings');
  } else if (ratingCount >= 1000) {
    score += 10;
    validationSignals.push('Good engagement');
  } else if (ratingCount >= 100) {
    score += 5;
    validationSignals.push('Some engagement');
  } else if (ratingCount < 50) {
    score -= 10;
    validationSignals.push('Low engagement - not validated');
  }
  
  // CATEGORY ACTIVITY (up to +10)
  // Active category = alive market
  if (recentCategoryActivity >= 10) {
    score += 10;
    validationSignals.push('Active category with new entrants');
  } else if (recentCategoryActivity >= 5) {
    score += 5;
    validationSignals.push('Moderately active category');
  } else if (recentCategoryActivity === 0 && categorySize > 10) {
    score -= 5;
    validationSignals.push('Stale category - no new apps');
  }
  
  // CATEGORY SIZE (up to +10)
  // Some competition validates the idea
  if (categorySize >= 20 && categorySize <= 100) {
    score += 10;
    validationSignals.push('Healthy category size');
  } else if (categorySize >= 10 && categorySize < 20) {
    score += 5;
    validationSignals.push('Small but active category');
  } else if (categorySize > 100) {
    score += 5; // Less bonus for crowded categories
    validationSignals.push('Large category - established market');
  } else if (categorySize < 10) {
    score -= 5;
    validationSignals.push('Very small category - niche or unproven');
  }
  
  // RECENT REVIEWS (up to +10)
  // Recent reviews = currently active users
  const reviews = Array.isArray(app.reviews) ? app.reviews : [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentReviews = reviews.filter(r => 
    r.review_date && new Date(r.review_date) > thirtyDaysAgo
  ).length;
  
  if (recentReviews >= 10) {
    score += 10;
    validationSignals.push('Active recent reviews');
  } else if (recentReviews >= 5) {
    score += 5;
    validationSignals.push('Some recent reviews');
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  return {
    score: Math.round(score),
    details: {
      downloadsEstimate,
      ratingCount,
      categorySize,
      recentCategoryActivity,
      validationSignals,
    },
  };
}

interface MarketValidationDetails {
  downloadsEstimate: number;
  ratingCount: number;
  categorySize: number;
  recentCategoryActivity: number;
  validationSignals: string[];
}






