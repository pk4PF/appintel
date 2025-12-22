import { getServerClient } from '../../lib/supabase';

/**
 * Gap keywords - signals of missing features or unmet needs
 */
const GAP_KEYWORDS = [
  // Direct feature requests
  'wish', 'wishing', 'wished',
  'need', 'needs', 'needed',
  'want', 'wants', 'wanted',
  'missing', 'miss',
  'should have', 'should be',
  'would be nice', 'would be great', 'would love',
  'please add', 'please include', 'please make',
  'hoping', 'hope for', 'hope they',
  'waiting for', 'still waiting',
  'expected', 'expecting',

  // Limitations
  'can\'t', 'cannot', 'couldn\'t',
  'doesn\'t', 'does not', 'don\'t', 'do not',
  'won\'t', 'will not', 'wouldn\'t',
  'unable to', 'no way to', 'no option',
  'not able', 'not possible',
  'lacks', 'lacking',
  'limited', 'limitation',
  'only', 'just', // e.g. "only lets you..."

  // Comparisons
  'other apps', 'unlike other',
  'competitor', 'competitors',
  'used to', 'before', 'previous version',
  'why no', 'why not', 'why can\'t',
  'why doesn\'t', 'why isn\'t',
];

/**
 * Frustration keywords - emotional signals of dissatisfaction
 */
const FRUSTRATION_KEYWORDS = [
  'frustrating', 'frustrated', 'frustration',
  'annoying', 'annoyed', 'annoyance',
  'disappointed', 'disappointing', 'disappointment',
  'useless', 'worthless', 'pointless',
  'waste of', 'waste', 'wasted',
  'terrible', 'horrible', 'awful',
  'ridiculous', 'absurd',
  'unacceptable', 'unbelievable',
  'broken', 'breaks', 'broke',
  'fails', 'failed', 'failure',
  'hate', 'hated', 'hates',
  'regret', 'regretted',
  'worst', 'bad', 'badly',
];

/**
 * Specific actionable issues - things that can be fixed
 */
const ACTIONABLE_ISSUES = [
  // Technical issues (fixable)
  'crash', 'crashes', 'crashed', 'crashing',
  'bug', 'bugs', 'buggy', 'glitch', 'glitches',
  'slow', 'lag', 'laggy', 'sluggish',
  'freeze', 'freezes', 'frozen', 'freezing',
  'error', 'errors',
  'loading', 'load time', 'takes forever',
  'battery', 'drains', 'drain',
  'memory', 'storage',

  // UX issues (improvable)
  'confusing', 'confused', 'confusion',
  'complicated', 'complex', 'difficult',
  'hard to use', 'hard to find', 'hard to understand',
  'intuitive', 'not intuitive',
  'cluttered', 'messy', 'disorganized',
  'outdated', 'old design', 'ugly',
  'small text', 'can\'t read', 'hard to read',
  'navigation', 'navigate',

  // Content/Features (addable)
  'ads', 'advertisement', 'too many ads', 'ad-free',
  'subscription', 'expensive', 'overpriced', 'price', 'cost',
  'paywall', 'pay wall', 'premium',
  'login', 'sign in', 'account', 'password',
  'sync', 'syncing', 'synchronize', 'backup',
  'offline', 'internet', 'connection',
  'widget', 'widgets', 'notification', 'notifications',
  'dark mode', 'theme', 'customization', 'customize',
  'export', 'import', 'share', 'sharing',
];

/**
 * Positive keywords for what works
 */
const POSITIVE_KEYWORDS = [
  'love', 'loved', 'loving',
  'great', 'excellent', 'amazing', 'awesome',
  'perfect', 'perfectly',
  'best', 'better', 'good',
  'easy', 'simple', 'intuitive',
  'helpful', 'useful', 'works',
  'beautiful', 'clean', 'nice',
  'fast', 'quick', 'smooth',
  'reliable', 'solid', 'stable',
  'recommend', 'recommended',
  'thank', 'thanks', 'grateful',
];

export interface GapAnalysis {
  // Overall gap score (0-100) - higher = more opportunity
  gapScore: number;

  // Breakdown
  totalReviews: number;
  negativeReviews: number;

  // Gap signals found
  gapSignals: {
    keyword: string;
    count: number;
    examples: string[];
  }[];

  // Frustration level (0-100)
  frustrationLevel: number;

  // Actionable issues found
  actionableIssues: {
    category: 'technical' | 'ux' | 'feature' | 'pricing';
    issue: string;
    count: number;
    examples: string[];
  }[];

  // What works (for context)
  whatWorks: {
    feature: string;
    count: number;
  }[];

  // Improvement opportunities summary
  opportunities: string[];

  // Improvement potential (can this realistically be made better?)
  improvementPotential: 'high' | 'medium' | 'low';
}

/**
 * Deep analysis of reviews to extract gaps and opportunities
 */
export async function analyzeReviewGaps(appId: string): Promise<GapAnalysis> {
  const supabase = getServerClient();

  // Fetch all reviews for the app
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating, review_text, title')
    .eq('app_id', appId);

  if (error || !reviews || reviews.length === 0) {
    return {
      gapScore: 50, // Neutral
      totalReviews: 0,
      negativeReviews: 0,
      gapSignals: [],
      frustrationLevel: 0,
      actionableIssues: [],
      whatWorks: [],
      opportunities: [],
      improvementPotential: 'low',
    };
  }

  const totalReviews = reviews.length;
  const negativeReviews = reviews.filter(r => r.rating <= 2);
  const positiveReviews = reviews.filter(r => r.rating >= 4);
  const midReviews = reviews.filter(r => r.rating === 3);

  // Gap signals analysis (from negative + mid reviews)
  const gapSourceReviews = [...negativeReviews, ...midReviews];
  const gapSignals: Map<string, { count: number; examples: string[] }> = new Map();

  for (const review of gapSourceReviews) {
    const text = `${review.title || ''} ${review.review_text || ''}`.toLowerCase();
    if (!text.trim()) continue;

    for (const keyword of GAP_KEYWORDS) {
      if (text.includes(keyword)) {
        const existing = gapSignals.get(keyword) || { count: 0, examples: [] };
        existing.count++;
        if (existing.examples.length < 3) {
          // Extract a snippet around the keyword
          const snippet = extractSnippet(text, keyword);
          if (snippet && !existing.examples.includes(snippet)) {
            existing.examples.push(snippet);
          }
        }
        gapSignals.set(keyword, existing);
      }
    }
  }

  // Convert and sort gap signals
  const sortedGapSignals = Array.from(gapSignals.entries())
    .map(([keyword, data]) => ({ keyword, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15 gap signals

  // Frustration analysis
  let frustrationCount = 0;
  for (const review of negativeReviews) {
    const text = `${review.title || ''} ${review.review_text || ''}`.toLowerCase();
    for (const keyword of FRUSTRATION_KEYWORDS) {
      if (text.includes(keyword)) {
        frustrationCount++;
        break; // Count each review only once
      }
    }
  }
  const frustrationLevel = negativeReviews.length > 0
    ? Math.round((frustrationCount / negativeReviews.length) * 100)
    : 0;

  // Actionable issues analysis
  const issueCategories = {
    technical: ['crash', 'bug', 'slow', 'lag', 'freeze', 'error', 'battery', 'memory', 'loading'],
    ux: ['confusing', 'complicated', 'hard to', 'intuitive', 'cluttered', 'outdated', 'navigation', 'small text'],
    feature: ['sync', 'offline', 'widget', 'notification', 'dark mode', 'export', 'import', 'share', 'customiz'],
    pricing: ['subscription', 'expensive', 'overpriced', 'price', 'paywall', 'premium', 'ads', 'ad-free'],
  };

  const actionableIssues: GapAnalysis['actionableIssues'] = [];

  for (const [category, keywords] of Object.entries(issueCategories)) {
    for (const keyword of keywords) {
      let count = 0;
      const examples: string[] = [];

      for (const review of gapSourceReviews) {
        const text = `${review.title || ''} ${review.review_text || ''}`.toLowerCase();
        if (text.includes(keyword)) {
          count++;
          if (examples.length < 2) {
            const snippet = extractSnippet(text, keyword);
            if (snippet) examples.push(snippet);
          }
        }
      }

      if (count >= 1) { // LIVER: Changed from 2 to 1 to catch high-signal single reviews
        actionableIssues.push({
          category: category as 'technical' | 'ux' | 'feature' | 'pricing',
          issue: keyword,
          count,
          examples,
        });
      }
    }
  }

  // Sort by count and take top issues
  actionableIssues.sort((a, b) => b.count - a.count);
  const topIssues = actionableIssues.slice(0, 10);

  // What works analysis (from positive reviews)
  const positiveFeatures: Map<string, number> = new Map();
  for (const review of positiveReviews) {
    const text = `${review.title || ''} ${review.review_text || ''}`.toLowerCase();
    for (const keyword of POSITIVE_KEYWORDS) {
      if (text.includes(keyword)) {
        positiveFeatures.set(keyword, (positiveFeatures.get(keyword) || 0) + 1);
      }
    }
  }

  const whatWorks = Array.from(positiveFeatures.entries())
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Generate opportunity summary
  const opportunities: string[] = [];

  // Top technical fixes
  const technicalIssues = topIssues.filter(i => i.category === 'technical');
  if (technicalIssues.length > 0) {
    opportunities.push(`Fix technical issues: ${technicalIssues.slice(0, 3).map(i => i.issue).join(', ')}`);
  }

  // Top UX improvements
  const uxIssues = topIssues.filter(i => i.category === 'ux');
  if (uxIssues.length > 0) {
    opportunities.push(`Improve UX: ${uxIssues.slice(0, 3).map(i => i.issue).join(', ')}`);
  }

  // Top feature requests
  const featureIssues = topIssues.filter(i => i.category === 'feature');
  if (featureIssues.length > 0) {
    opportunities.push(`Add features: ${featureIssues.slice(0, 3).map(i => i.issue).join(', ')}`);
  }

  // Pricing opportunity
  const pricingIssues = topIssues.filter(i => i.category === 'pricing');
  if (pricingIssues.length > 0) {
    opportunities.push(`Pricing opportunity: Users complain about ${pricingIssues.slice(0, 2).map(i => i.issue).join(', ')}`);
  }

  // Calculate gap score
  let gapScore = 50; // Start neutral

  // More gap signals = more opportunity (up to +25)
  const totalGapSignals = sortedGapSignals.reduce((sum, s) => sum + s.count, 0);
  gapScore += Math.min(totalGapSignals * 2, 25);

  // High frustration = users want better (up to +15)
  gapScore += Math.min(frustrationLevel * 0.15, 15);

  // Actionable issues = things you can actually fix (up to +20)
  const actionableCount = topIssues.reduce((sum, i) => sum + i.count, 0);
  gapScore += Math.min(actionableCount * 1.5, 20);

  // Negative review ratio bonus (sweet spot: 20-40% negative)
  const negativeRatio = negativeReviews.length / totalReviews;
  if (negativeRatio >= 0.2 && negativeRatio <= 0.4) {
    gapScore += 15; // Sweet spot - enough complaints but app isn't garbage
  } else if (negativeRatio > 0.4 && negativeRatio <= 0.6) {
    gapScore += 10; // Lots of issues, but might be salvageable
  } else if (negativeRatio > 0.6) {
    gapScore -= 10; // Too many issues - market might be broken
  }

  // Review volume bonus (more reviews = more signal)
  if (totalReviews >= 50) {
    gapScore += 10; // Good sample size
  } else if (totalReviews >= 20) {
    gapScore += 5;
  }

  // Clamp score
  gapScore = Math.max(0, Math.min(100, gapScore));

  // Determine improvement potential
  let improvementPotential: 'high' | 'medium' | 'low' = 'medium';
  if (topIssues.length >= 5 && frustrationLevel >= 30 && negativeRatio >= 0.2) {
    improvementPotential = 'high';
  } else if (topIssues.length < 2 || negativeRatio < 0.1) {
    improvementPotential = 'low';
  }

  return {
    gapScore: Math.round(gapScore),
    totalReviews,
    negativeReviews: negativeReviews.length,
    gapSignals: sortedGapSignals,
    frustrationLevel,
    actionableIssues: topIssues,
    whatWorks,
    opportunities,
    improvementPotential,
  };
}

/**
 * Extract a snippet around a keyword (for context)
 */
function extractSnippet(text: string, keyword: string, contextLength = 60): string {
  const index = text.indexOf(keyword);
  if (index === -1) return '';

  const start = Math.max(0, index - contextLength / 2);
  const end = Math.min(text.length, index + keyword.length + contextLength / 2);

  let snippet = text.slice(start, end).trim();

  // Add ellipsis if truncated
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Calculate the Review Gap Score for opportunity scoring (0-100)
 * This is the main signal for the new scoring system
 */
export async function calculateReviewGapScore(appId: string): Promise<{
  score: number;
  details: GapAnalysis;
}> {
  const analysis = await analyzeReviewGaps(appId);

  return {
    score: analysis.gapScore,
    details: analysis,
  };
}






