import { getServerClient } from '@/lib/supabase';
import { calculateReviewGapScore, GapAnalysis } from './review-gap';
import { calculateImprovementPotential } from './improvement';
import { calculateMarketValidation } from './market-validation';
import { calculateCompetitiveDensity } from './competition';
import type { OpportunityScoreInsert } from '@/types/database';

/**
 * BALANCED SCORE WEIGHTS - More evenly distributed
 * 
 * Philosophy: Every app is inspiration for spin-offs. Don't exclude apps,
 * but weight signals to find the best opportunities for indie devs.
 */
const SCORE_WEIGHTS = {
  reviewGap: 0.40,           // 40% - Pain points
  marketProof: 0.40,         // 40% - Proven revenue (Increased for arbitrage)
  improvement: 0.10,         // 10% - Beatable ratings
  competition: 0.10,         // 10% - Indie vs Big Tech
};

const THRESHOLDS = {
  mrrFloor: 2000,
  mrrGold: 40000,
  maxRatingCount: 50000,      // Lowered from 100k - prioritize smaller targets
  excellentRating: 4.4,
};

/**
 * Big company list - soft penalty, not exclusion
 */
const BIG_COMPANIES = [
  'Google', 'Apple', 'Microsoft', 'Meta', 'Facebook',
  'Amazon', 'Netflix', 'Spotify', 'Adobe', 'Salesforce',
  'Oracle', 'IBM', 'Samsung', 'Tencent', 'Alibaba',
  'Bytedance', 'TikTok', 'Snapchat', 'Twitter', 'X Corp',
  'Uber', 'Lyft', 'Airbnb', 'DoorDash', 'Instacart',
  'PayPal', 'Stripe', 'Square', 'Block',
];

/**
 * Get comprehensive app metadata
 */
async function getAppMetadata(appId: string): Promise<AppMetadata> {
  const supabase = getServerClient();

  const { data: app } = await supabase
    .from('apps')
    .select(`
      name,
      description,
      last_updated,
      release_date,
      developer_name,
      price,
      pricing_model,
      categories!apps_category_id_fkey (slug),
      app_metrics (rating, rating_count, review_count, downloads_estimate, revenue_estimate)
    `)
    .eq('id', appId)
    .single();

  if (!app) {
    return {
      reviewCount: 0,
      ratingCount: 0,
      averageRating: 0,
      categorySlug: null,
      developerName: null,
      lastUpdated: null,
      releaseDate: null,
      name: '',
      description: null,
      price: 0,
      pricingModel: 'free',
      downloadsEstimate: 0,
      revenueEstimate: 0,
    };
  }

  const metrics = Array.isArray(app.app_metrics) ? app.app_metrics : [];
  const latestMetrics = metrics.sort((a: { rating_count?: number }, b: { rating_count?: number }) =>
    (b.rating_count || 0) - (a.rating_count || 0)
  )[0];

  const categories = app.categories as unknown as { slug: string } | null;

  return {
    reviewCount: latestMetrics?.review_count || 0,
    ratingCount: latestMetrics?.rating_count || 0,
    averageRating: latestMetrics?.rating || 0,
    categorySlug: categories?.slug || null,
    developerName: app.developer_name || null,
    lastUpdated: app.last_updated ? new Date(app.last_updated) : null,
    releaseDate: app.release_date ? new Date(app.release_date) : null,
    name: app.name || '',
    description: app.description || null,
    price: app.price || 0,
    pricingModel: app.pricing_model || 'free',
    downloadsEstimate: latestMetrics?.downloads_estimate || 0,
    revenueEstimate: latestMetrics?.revenue_estimate || 0,
  };
}

/**
 * Check if developer is a big company (soft penalty)
 */
function isBigCompany(developerName: string | null): boolean {
  if (!developerName) return false;
  const nameLower = developerName.toLowerCase();
  return BIG_COMPANIES.some(company =>
    nameLower.includes(company.toLowerCase()) ||
    nameLower === company.toLowerCase()
  );
}

/**
 * Calculate Recency-Velocity Score (0-100)
 * Newer successful apps = proven demand in current market
 */
function calculateRecencyVelocity(metadata: AppMetadata): { score: number; signals: string[] } {
  let score = 50;
  const signals: string[] = [];

  const now = new Date();
  const appAgeMonths = metadata.releaseDate
    ? Math.floor((now.getTime() - metadata.releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 999;

  const appAgeYears = appAgeMonths / 12;

  // RECENCY BONUS (up to +25)
  if (appAgeYears < 1.5 && metadata.ratingCount >= 500) {
    score += 25;
    signals.push('🆕 New app (<18mo) with traction - GOLDEN signal');
  } else if (appAgeYears < 2 && metadata.ratingCount >= 200) {
    score += 20;
    signals.push('Fresh app (<2y) gaining users');
  } else if (appAgeYears > 4) {
    // Old app - could be modernization opportunity
    if (metadata.lastUpdated) {
      const daysSinceUpdate = Math.floor((now.getTime() - metadata.lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate > 365) {
        score += 15; // Modernization opportunity!
        signals.push('🔧 Old app, not updated in 1y+ - modernization opportunity');
      } else if (daysSinceUpdate > 180) {
        score += 10;
        signals.push('Old app with slow updates');
      } else {
        score -= 10; // Old and actively maintained = hard to compete
        signals.push('Established app with active updates');
      }
    }
  }

  // VELOCITY (downloads per month since launch)
  if (metadata.downloadsEstimate > 0 && appAgeMonths > 0) {
    const velocity = metadata.downloadsEstimate / appAgeMonths;

    if (velocity > 1000) {
      score += 15;
      signals.push('🚀 High growth velocity');
    } else if (velocity > 500) {
      score += 10;
      signals.push('Good growth rate');
    } else if (velocity < 50 && metadata.ratingCount < 100) {
      score -= 5;
      signals.push('Low traction');
    }
  }

  return { score: Math.max(0, Math.min(100, score)), signals };
}

/**
 * Calculate Market Proof Score (0-100)
 * Is there money in this space?
 */
function calculateMarketProof(metadata: AppMetadata): { score: number; mrr: number; signals: string[] } {
  let score = 50;
  const signals: string[] = [];

  // Estimate MRR
  let mrr = metadata.revenueEstimate;

  if (!mrr && metadata.downloadsEstimate > 0) {
    // Estimate based on pricing model
    const downloads = metadata.downloadsEstimate;

    if (metadata.pricingModel === 'subscription') {
      const avgMonthlyPrice = metadata.price > 0 ? metadata.price : 7.5;
      const conversionRate = 0.03;
      const activeUsers = downloads * 0.1;
      mrr = Math.round(activeUsers * conversionRate * avgMonthlyPrice);
    } else if (metadata.pricingModel === 'freemium' || metadata.pricingModel === 'paid') {
      const avgPrice = metadata.price > 0 ? metadata.price : 4;
      const conversionRate = 0.02;
      mrr = Math.round(downloads * conversionRate * avgPrice);
    } else {
      // Free apps - estimate from ads
      const activeUsers = downloads * 0.15;
      mrr = Math.round(activeUsers * 0.10);
    }
  }

  // MRR scoring (up to +30)
  if (mrr >= 50000) {
    score += 30;
    signals.push('💰 $50k+/mo - huge market');
  } else if (mrr >= THRESHOLDS.mrrGold) {
    score += 25;
    signals.push('💰 $20k+/mo - solid market');
  } else if (mrr >= 10000) {
    score += 20;
    signals.push('💵 $10k+/mo - good opportunity');
  } else if (mrr >= THRESHOLDS.mrrFloor) {
    score += 15;
    signals.push('💵 $5k+/mo - viable market');
  } else if (mrr >= 1000) {
    score += 5;
    signals.push('Small market but validated');
  } else {
    score -= 10;
    signals.push('⚠️ Low revenue - needs better monetization');
  }

  // Subscription model bonus
  if (metadata.pricingModel === 'subscription') {
    score += 5;
    signals.push('Subscription model = recurring revenue');
  }

  return { score: Math.max(0, Math.min(100, score)), mrr, signals };
}

/**
 * Calculate the composite opportunity score for an app
 * 
 * NEW BALANCED APPROACH: 
 * - No hard exclusions (every app is spin-off inspiration)
 * - More evenly distributed weights
 * - Soft penalties instead of filters
 */
export async function calculateOpportunityScore(
  appId: string,
  timeWindow: '7d' | '14d' | '30d' = '30d'
): Promise<OpportunityScoreResult> {
  // Get app metadata
  const metadata = await getAppMetadata(appId);

  // Calculate all component details in parallel (we still need the data, but we'll use it simply)
  const [reviewGap, improvement, competition, marketValidation] = await Promise.all([
    calculateReviewGapScore(appId),
    calculateImprovementPotential(appId),
    calculateCompetitiveDensity(appId),
    calculateMarketValidation(appId),
  ]);

  const marketProof = calculateMarketProof(metadata);
  const recencyVelocity = calculateRecencyVelocity(metadata);

  // SIMPLE SPINOFF ALGORITHM (0-100)
  let score = 0;
  const detailedSignals: string[] = [];

  // 1. REVENUE VALIDATION (Max 40 pts)
  // Proven money in the niche is the most important signal
  if (marketProof.mrr >= 3000) {
    score += 40;
    detailedSignals.push('💰 High Validation: >$3k/mo revenue');
  } else if (marketProof.mrr >= 1000) {
    score += 20;
    detailedSignals.push('💵 Validated: >$1k/mo revenue');
  } else {
    detailedSignals.push('⚠️ Unvalidated: Low revenue niche');
  }

  // 2. WRITTEN CRITICISM (Max 40 pts)
  // Do users have enough complaints to justify a spinoff?
  const hasReviews = reviewGap.details.totalReviews > 0;
  const negativeReviews = reviewGap.details.negativeReviews || 0;
  const gapSignalsCount = reviewGap.details.gapSignals.length;

  if (hasReviews && negativeReviews > 0) {
    score += 20;
    detailedSignals.push(`📝 Found ${negativeReviews} written complaints`);

    if (gapSignalsCount >= 5) {
      score += 20;
      detailedSignals.push('🔥 Deep Gaps: Multiple specific missing features identified');
    } else if (gapSignalsCount >= 2) {
      score += 10;
      detailedSignals.push('✨ Some gaps identified in reviews');
    }
  }

  // 3. THE ARBITRAGE SIGNAL (Max 20 pts + Bonus)
  // High Revenue + Low Rating = Pure Arbitrage Opportunity
  let arbitragePts = 0;

  if (marketProof.mrr >= 5000) {
    if (metadata.averageRating <= 3.5) {
      arbitragePts += 20;
      detailedSignals.push('💎 VULNERABLE GIANT: High revenue with critical user dissatisfaction');
    } else if (metadata.averageRating <= 4.0) {
      arbitragePts += 10;
      detailedSignals.push('📈 Market Gap: Strong revenue with major room for improvement');
    }
  }

  // Stale Incumbent Bonus
  if (metadata.lastUpdated) {
    const monthsSinceUpdate = (Date.now() - metadata.lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceUpdate > 12 && marketProof.mrr >= 2000) {
      arbitragePts += 15;
      detailedSignals.push('🏆 Stale Winner: Successful app abandoned for 12mo+');
    }
  }

  score += arbitragePts;

  // 4. INDIE DEV FILTERS (Multipliers)
  // We want to actively push down apps that are NOT indie-friendly
  let multiplier = 1.0;

  // Big Tech Penalty: Indie devs shouldn't try a direct spinoff against Google/Meta/etc.
  const bigCo = isBigCompany(metadata.developerName);
  if (bigCo) {
    multiplier *= 0.2; // HARD penalty
    detailedSignals.push('🛡️ Big Tech: Corporate incumbent (Extreme barrier to entry)');
  }

  // Blockbuster Penalty: If it has > 50k ratings, it's too established for a simple spinoff
  if (metadata.ratingCount > 50000) {
    multiplier *= 0.5;
    detailedSignals.push('🏔️ Blockbuster: App is too established (Too much gravity)');
  }

  // If it's a MASSIVE app (>250k ratings), it's almost impossible to unseat with a direct spinoff
  if (metadata.ratingCount > 250000) {
    multiplier *= 0.2;
    detailedSignals.push('🌋 Megalith: Virtually unassailable for individual indie spinoffs');
  }

  // Final adjusted score
  const finalScore = Math.max(0, Math.min(100, score * multiplier));

  return {
    appId,
    timeWindow,
    score: finalScore,
    components: {
      reviewGap: reviewGap.score,
      recencyVelocity: recencyVelocity.score,
      marketProof: marketProof.score,
      competition: competition.score,
      improvement: improvement.score,
    },
    details: {
      reviewGap: reviewGap.details,
      recencyVelocity: detailedSignals,
      marketProof: { mrr: marketProof.mrr, signals: marketProof.signals },
      competition: competition.details,
      improvement: improvement.details,
    },
    metadata: {
      hasReviews,
      mrr: marketProof.mrr,
      appAgeMonths: metadata.releaseDate
        ? Math.floor((Date.now() - metadata.releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
        : null,
      isBigCompany: bigCo,
    },
    interpretation: interpretScore(finalScore),
  };
}

/**
 * Interpret the opportunity score in human terms
 */
function interpretScore(score: number): ScoreInterpretation {
  if (score >= 70) {
    return {
      level: 'excellent',
      label: 'Prime Spinoff Target',
      description: 'Massive user pain in a validated market. Indie-friendly and reachable for solo devs.',
      color: '#22c55e',
    };
  } else if (score >= 55) {
    return {
      level: 'good',
      label: 'Strong Opportunity',
      description: 'Clear gaps in current options. Solid potential for an independent spinoff.',
      color: '#84cc16',
    };
  } else if (score >= 40) {
    return {
      level: 'moderate',
      label: 'Valid Idea',
      description: 'Steady market with some complaints. Harder if competing with corps.',
      color: '#eab308',
    };
  } else if (score >= 25) {
    return {
      level: 'low',
      label: 'Niche / Tough',
      description: 'Few gaps or high incumbent satisfaction. Hard for small players.',
      color: '#f97316',
    };
  } else {
    return {
      level: 'poor',
      label: 'Saturated',
      description: 'Corporate incumbents or small market. Best used for inspiration.',
      color: '#ef4444',
    };
  }
}

/**
 * Store the calculated opportunity score in the database
 */
export async function storeOpportunityScore(
  result: OpportunityScoreResult
): Promise<boolean> {
  const supabase = getServerClient();

  const safeNum = (val: number) => (isNaN(val) || val === null || val === undefined) ? 50 : val;

  // Map component names to DB columns
  const scoreInsert: OpportunityScoreInsert = {
    app_id: result.appId,
    score: safeNum(result.score),
    momentum: safeNum(result.components.reviewGap), // DB column: stores reviewGap
    demand_signal: safeNum(result.components.recencyVelocity), // DB column: stores recencyVelocity
    user_satisfaction: safeNum(result.components.competition), // DB column: stores competition
    monetization_potential: safeNum(result.components.marketProof), // DB column: stores marketProof
    competitive_density: safeNum(result.components.improvement), // DB column: stores improvement
    time_window: result.timeWindow,
  };

  const { error } = await supabase
    .from('opportunity_scores')
    .upsert(scoreInsert, { onConflict: 'app_id,time_window' });

  if (error) {
    console.error(`Error storing score for ${result.appId}:`, error);
    return false;
  }

  return true;
}

/**
 * Calculate and store scores for all apps
 */
export async function calculateAllScores(
  timeWindow: '7d' | '14d' | '30d' = '30d'
): Promise<{ success: number; failed: number }> {
  const supabase = getServerClient();

  console.log(`\n📊 Calculating opportunity scores with SIMPLE SPINOFF algorithm (${timeWindow} window)\n`);
  console.log('Criteria: Revenue Hurdle ($1k/$3k) | User Criticism (Reviews) | Spinoff Potential (Niche Accessibility)\n');

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
    try {
      const result = await calculateOpportunityScore(app.id, timeWindow);
      const stored = await storeOpportunityScore(result);

      if (stored) {
        const level = result.interpretation.level;
        const icon = level === 'excellent' ? '🌟' :
          level === 'good' ? '✨' :
            level === 'moderate' ? '📊' :
              level === 'low' ? '📉' : '⚠️';
        const mrrStr = result.metadata.mrr > 0 ? ` $${Math.round(result.metadata.mrr / 1000)}k` : '';
        console.log(`  ${icon} ${app.name}: ${result.score.toFixed(1)} (${level})${mrrStr}`);
        success++;
      } else {
        console.log(`  ✗ ${app.name}: Failed to store`);
        failed++;
      }
    } catch (err) {
      console.error(`  ✗ ${app.name}: ${err}`);
      failed++;
    }
  }

  console.log(`\n✅ Scoring complete: ${success} success, ${failed} failed`);
  return { success, failed };
}

/**
 * Get top opportunities (highest scoring apps)
 */
export async function getTopOpportunities(
  limit = 50,
  timeWindow: '7d' | '14d' | '30d' = '30d',
  categoryId?: string
): Promise<RankedOpportunity[]> {
  const supabase = getServerClient();

  const { data: booksCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'books')
    .single();

  const booksCategoryId = booksCategory?.id;

  let query = supabase
    .from('opportunity_scores')
    .select(`
      *,
      apps (
        id,
        name,
        icon_url,
        category_id,
        release_date,
        pricing_model,
        developer_name,
        categories!apps_category_id_fkey (name, slug),
        app_metrics (rating_count, revenue_estimate)
      )
    `)
    .eq('time_window', timeWindow)
    .gt('score', 0)
    .order('score', { ascending: false })
    .limit(limit * 2);

  if (categoryId) {
    query = query.eq('apps.category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching top opportunities:', error);
    return [];
  }

  // Soft filter - don't exclude, just limit display
  const filteredData = (data || []).filter((row) => {
    if (!row.apps) return false;

    // Reduce visibility of books category
    if (row.apps.category_id === booksCategoryId) return false;

    return true;
  }).slice(0, limit);

  return filteredData.map((row, index) => ({
    rank: index + 1,
    score: row.score,
    app: row.apps,
    components: {
      reviewGap: row.momentum,
      recencyVelocity: row.demand_signal,
      marketProof: row.monetization_potential,
      competition: row.user_satisfaction,
      improvement: row.competitive_density,
    },
    interpretation: interpretScore(row.score),
  }));
}

// Types
interface AppMetadata {
  reviewCount: number;
  ratingCount: number;
  averageRating: number;
  categorySlug: string | null;
  developerName: string | null;
  lastUpdated: Date | null;
  releaseDate: Date | null;
  name: string;
  description: string | null;
  price: number;
  pricingModel: string;
  downloadsEstimate: number;
  revenueEstimate: number;
}

export interface OpportunityScoreResult {
  appId: string;
  timeWindow: string;
  score: number;
  components: {
    reviewGap: number;
    recencyVelocity: number;
    marketProof: number;
    competition: number;
    improvement: number;
  };
  details: {
    reviewGap: GapAnalysis | { excluded: boolean };
    recencyVelocity: string[];
    marketProof: { mrr: number; signals: string[] };
    competition: unknown;
    improvement: unknown;
  };
  metadata: {
    hasReviews: boolean;
    mrr: number;
    appAgeMonths: number | null;
    isBigCompany: boolean;
  };
  interpretation: ScoreInterpretation;
}

export interface ScoreInterpretation {
  level: 'excellent' | 'good' | 'moderate' | 'low' | 'poor';
  label: string;
  description: string;
  color: string;
}

export interface RankedOpportunity {
  rank: number;
  score: number;
  app: {
    id: string;
    name: string;
    icon_url: string | null;
    category_id: string | null;
    release_date: string | null;
    pricing_model: string;
    developer_name: string | null;
    categories: { name: string; slug: string } | null;
  } | null;
  components: {
    reviewGap: number | null;
    recencyVelocity: number | null;
    marketProof: number | null;
    competition: number | null;
    improvement: number | null;
  };
  interpretation: ScoreInterpretation;
}
