import { getServerClient } from '@/lib/supabase';

/**
 * Calculate Improvement Potential Score (0-100)
 * 
 * The golden opportunity: apps that people USE but aren't HAPPY with
 * 
 * High score indicators:
 * - Rating 2.5-3.8 (sweet spot - not terrible, not great)
 * - High downloads relative to low rating (people need it but hate it)
 * - Recent negative reviews (current problems, not historical)
 * - Stale updates (developer gave up or is slow)
 * - Growing category (market is active)
 */
export async function calculateImprovementPotential(
  appId: string
): Promise<{ score: number; details: ImprovementDetails }> {
  const supabase = getServerClient();
  
  // Get app data with metrics and reviews
  const { data: app, error } = await supabase
    .from('apps')
    .select(`
      id,
      name,
      last_updated,
      release_date,
      category_id,
      app_metrics (rating, rating_count, downloads_estimate),
      reviews (rating, review_date)
    `)
    .eq('id', appId)
    .single();
  
  if (error || !app) {
    return {
      score: 50,
      details: {
        rating: 0,
        ratingCount: 0,
        downloadsEstimate: 0,
        daysSinceUpdate: 0,
        recentNegativeReviews: 0,
        improvementSignals: [],
      },
    };
  }
  
  // Extract metrics
  const metrics = Array.isArray(app.app_metrics) ? app.app_metrics : [];
  const latestMetrics = metrics.sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0))[0];
  
  const rating = latestMetrics?.rating || 0;
  const ratingCount = latestMetrics?.rating_count || 0;
  const downloadsEstimate = latestMetrics?.downloads_estimate || 0;
  
  // Calculate days since update
  const daysSinceUpdate = app.last_updated
    ? Math.floor((Date.now() - new Date(app.last_updated).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  // Count recent negative reviews (last 60 days)
  const reviews = Array.isArray(app.reviews) ? app.reviews : [];
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  const recentNegativeReviews = reviews.filter(r => 
    r.rating <= 2 && r.review_date && new Date(r.review_date) > sixtyDaysAgo
  ).length;
  
  const recentReviews = reviews.filter(r => 
    r.review_date && new Date(r.review_date) > sixtyDaysAgo
  ).length;
  
  // Calculate improvement score
  let score = 50;
  const improvementSignals: string[] = [];
  
  // RATING SWEET SPOT (up to +25)
  // Apps rated 2.5-3.5 have the most improvement potential
  if (rating >= 2.5 && rating <= 3.5) {
    score += 25;
    improvementSignals.push('Rating in improvement sweet spot (2.5-3.5)');
  } else if (rating > 3.5 && rating < 4.0) {
    score += 15;
    improvementSignals.push('Moderate rating - room for improvement');
  } else if (rating >= 4.0 && rating < 4.3) {
    score += 5;
    improvementSignals.push('Good rating but could be better');
  } else if (rating < 2.5 && rating > 0) {
    score -= 10;
    improvementSignals.push('Very low rating - market might be broken');
  } else if (rating >= 4.5) {
    score -= 15;
    improvementSignals.push('Excellent rating - hard to beat');
  }
  
  // DOWNLOAD/RATING RATIO (up to +20)
  // High downloads + low rating = people NEED this but current options suck
  if (downloadsEstimate > 0 && rating > 0 && rating < 4.0) {
    const downloadPerRating = downloadsEstimate / (ratingCount || 1);
    
    if (downloadPerRating > 100 && rating < 3.5) {
      score += 20;
      improvementSignals.push('High demand despite low rating');
    } else if (downloadPerRating > 50 && rating < 3.8) {
      score += 10;
      improvementSignals.push('Good demand relative to rating');
    }
  }
  
  // STALE UPDATES (up to +15)
  // App not updated = developer gave up or is slow
  if (daysSinceUpdate > 365) {
    score += 15;
    improvementSignals.push('Not updated in over a year - abandoned?');
  } else if (daysSinceUpdate > 180) {
    score += 10;
    improvementSignals.push('Not updated in 6+ months');
  } else if (daysSinceUpdate > 90) {
    score += 5;
    improvementSignals.push('Infrequent updates');
  } else if (daysSinceUpdate < 30) {
    score -= 5;
    improvementSignals.push('Recently updated - active developer');
  }
  
  // RECENT NEGATIVE REVIEWS (up to +15)
  // Current problems = current opportunity
  if (recentReviews > 0) {
    const negativeRatio = recentNegativeReviews / recentReviews;
    
    if (negativeRatio >= 0.3 && recentNegativeReviews >= 5) {
      score += 15;
      improvementSignals.push('Many recent negative reviews');
    } else if (negativeRatio >= 0.2 && recentNegativeReviews >= 3) {
      score += 10;
      improvementSignals.push('Some recent negative reviews');
    }
  }
  
  // REVIEW VOLUME (up to +10)
  // More reviews = more data, more market validation
  if (ratingCount >= 1000 && ratingCount <= 50000) {
    score += 10;
    improvementSignals.push('Good review volume - validated market');
  } else if (ratingCount >= 500 && ratingCount < 1000) {
    score += 5;
    improvementSignals.push('Decent review volume');
  } else if (ratingCount > 50000) {
    score -= 5;
    improvementSignals.push('Very established - harder to compete');
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  return {
    score: Math.round(score),
    details: {
      rating,
      ratingCount,
      downloadsEstimate,
      daysSinceUpdate,
      recentNegativeReviews,
      improvementSignals,
    },
  };
}

interface ImprovementDetails {
  rating: number;
  ratingCount: number;
  downloadsEstimate: number;
  daysSinceUpdate: number;
  recentNegativeReviews: number;
  improvementSignals: string[];
}






