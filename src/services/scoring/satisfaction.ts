import { getServerClient } from '@/lib/supabase';
import { getReviewStats } from '@/services/review-ingestion';

/**
 * Calculate user satisfaction score (0-100)
 * 
 * Satisfaction measures how well the app meets user expectations.
 * Low satisfaction = opportunity to build something better
 * 
 * Note: For our use case, LOWER satisfaction can mean HIGHER opportunity!
 * 
 * Components:
 * - Average rating (inverse weighted - lower is more opportunity)
 * - Rating consistency (high variance = unmet needs)
 * - Sentiment from reviews (complaints = gaps to fill)
 */
export async function calculateSatisfaction(
  appId: string
): Promise<{ score: number; opportunityScore: number; details: SatisfactionDetails }> {
  const supabase = getServerClient();

  // Get review stats
  const stats = await getReviewStats(appId);
  
  if (!stats) {
    return {
      score: 50,
      opportunityScore: 50, // Neutral - no data
      details: {
        averageRating: 0,
        ratingVariance: 0,
        negativeReviewRatio: 0,
        totalReviews: 0,
      },
    };
  }

  // Get negative reviews for sentiment analysis
  const { data: negativeReviews } = await supabase
    .from('reviews')
    .select('rating, review_text')
    .eq('app_id', appId)
    .lte('rating', 2);

  const negativeCount = negativeReviews?.length || 0;
  const negativeRatio = stats.totalReviews > 0 ? negativeCount / stats.totalReviews : 0;
  
  // Analyze review text for specific, actionable pain points
  const painPointScore = analyzePainPoints(negativeReviews || []);

  // Calculate rating variance
  const dist = stats.ratingDistribution;
  const mean = stats.averageRating;
  const variance = Object.entries(dist).reduce((sum, [rating, count]) => {
    return sum + count * Math.pow(parseInt(rating) - mean, 2);
  }, 0) / stats.totalReviews;

  // User satisfaction score (how happy users are)
  let satisfactionScore = 50;
  
  // Rating contribution (4.5+ = excellent, 2.5 or below = poor)
  satisfactionScore += (stats.averageRating - 3) * 20; // ±40 points max
  
  // High variance means inconsistent experience (-10 points max)
  if (variance > 1.5) {
    satisfactionScore -= Math.min((variance - 1.5) * 5, 10);
  }
  
  // Clamp satisfaction
  satisfactionScore = Math.max(0, Math.min(100, satisfactionScore));

  // Opportunity score (inverse of satisfaction for builder context)
  // Low satisfaction = high opportunity to build better
  // But not TOO low - if an app has 1-star average, maybe the market is bad
  let opportunityScore = 50;
  
  // Sweet spot: apps rated 2.5-3.5 have the most opportunity
  // (users want the app to work, but it's not meeting expectations)
  if (stats.averageRating >= 2.5 && stats.averageRating <= 3.5) {
    opportunityScore += 30; // High opportunity zone
  } else if (stats.averageRating > 3.5 && stats.averageRating < 4.0) {
    opportunityScore += 20; // Moderate opportunity
  } else if (stats.averageRating >= 4.0 && stats.averageRating < 4.5) {
    opportunityScore += 10; // Some opportunity (incremental improvements)
  } else if (stats.averageRating < 2.5) {
    opportunityScore -= 10; // Market might be fundamentally broken
  }

  // High negative ratio = more user pain = more opportunity
  opportunityScore += Math.min(negativeRatio * 50, 20);

  // High variance = users have mixed experiences = opportunity to be consistent
  opportunityScore += Math.min(variance * 5, 10);
  
  // PAIN POINT ANALYSIS - Specific, actionable complaints = high opportunity
  opportunityScore += painPointScore;

  // Clamp opportunity score
  opportunityScore = Math.max(0, Math.min(100, opportunityScore));

  return {
    score: Math.round(satisfactionScore * 100) / 100,
    opportunityScore: Math.round(opportunityScore * 100) / 100,
    details: {
      averageRating: Math.round(stats.averageRating * 100) / 100,
      ratingVariance: Math.round(variance * 100) / 100,
      negativeReviewRatio: Math.round(negativeRatio * 100) / 100,
      totalReviews: stats.totalReviews,
    },
  };
}

/**
 * Analyze review text for specific, actionable pain points
 * Returns score bonus (0-20) based on specificity and fixability of complaints
 */
function analyzePainPoints(reviews: Array<{ review_text?: string | null }>): number {
  if (!reviews || reviews.length === 0) return 0;
  
  // Specific, actionable complaint keywords (high opportunity)
  const specificComplaints = [
    'crash', 'crashes', 'crashed', 'crashing',
    'bug', 'bugs', 'buggy',
    'slow', 'lag', 'laggy', 'freeze', 'freezes', 'frozen',
    'missing feature', 'no feature', 'lacks', 'doesn\'t have',
    'poor support', 'no support', 'support', 'customer service',
    'confusing', 'hard to use', 'difficult', 'complicated',
    'outdated', 'old design', 'needs update',
    'expensive', 'overpriced', 'price', 'cost',
    'ads', 'advertisement', 'too many ads',
    'privacy', 'data', 'tracking',
    'login', 'account', 'password', 'sign in'
  ];
  
  // Vague complaints (lower opportunity)
  const vagueComplaints = [
    'bad', 'terrible', 'awful', 'worst', 'hate', 'disappointed',
    'waste', 'garbage', 'trash'
  ];
  
  let specificCount = 0;
  let vagueCount = 0;
  let totalTextLength = 0;
  
  reviews.forEach(review => {
    const text = (review.review_text || '').toLowerCase();
    if (text.length === 0) return;
    
    totalTextLength += text.length;
    
    // Count specific complaints
    specificComplaints.forEach(keyword => {
      if (text.includes(keyword)) {
        specificCount++;
      }
    });
    
    // Count vague complaints
    vagueComplaints.forEach(keyword => {
      if (text.includes(keyword)) {
        vagueCount++;
      }
    });
  });
  
  if (totalTextLength === 0) return 0;
  
  // Calculate specificity ratio
  const specificityRatio = specificCount / Math.max(specificCount + vagueCount, 1);
  
  // Calculate complaint density (complaints per review)
  const complaintDensity = (specificCount + vagueCount) / reviews.length;
  
  // Score based on:
  // - High specificity = actionable = high opportunity (+15 max)
  // - High density = common problem = high opportunity (+5 max)
  let score = 0;
  
  if (specificityRatio > 0.6) {
    score += 15; // Mostly specific complaints = actionable opportunity
  } else if (specificityRatio > 0.4) {
    score += 10; // Mixed complaints = moderate opportunity
  } else {
    score += 5; // Mostly vague = lower opportunity
  }
  
  // Density bonus
  if (complaintDensity > 2) {
    score += 5; // High complaint density = common problem
  }
  
  return Math.min(score, 20); // Cap at 20 points
}

interface SatisfactionDetails {
  averageRating: number;
  ratingVariance: number;
  negativeReviewRatio: number;
  totalReviews: number;
}

