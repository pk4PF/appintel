/**
 * Indie Opportunity Score Calculator
 * 
 * Calculates a 0-100 score based on:
 * 1. Revenue Signal (30%) - Proven market, sweet spot $5K-$50K/mo
 * 2. Competition Opportunity (25%) - Beatable, sweet spot 1K-10K ratings
 * 3. Improvement Potential (25%) - Room for better, sweet spot 3-4 stars
 * 4. Category Opportunity (20%) - Low supply, high demand
 */

interface ScoringInput {
    revenueEstimate: number | null;
    ratingCount: number | null;
    rating: number | null;
    categoryDensityRatio: number | null; // avg downloads per app in category / num apps
    categoryName: string | null; // Category name for feasibility check
    appAgeYears: number | null; // How old is the app (years since release)
    appName: string | null; // App name for keyword filtering
}

interface ScoreBreakdown {
    total: number;
    revenue: number;
    competition: number;
    improvement: number;
    category: number;
    feasibility: number;
}

/**
 * Calculate Revenue Signal score (0-100)
 * Sweet spot: $5K-$50K/mo
 */
function calculateRevenueScore(revenue: number | null): number {
    if (revenue === null || revenue === 0) return 20;

    if (revenue < 500) return 20;
    if (revenue < 5000) return 60;
    if (revenue < 50000) return 100;
    if (revenue < 200000) return 80;
    return 40; // Too big, dominated market
}

/**
 * Calculate Competition Opportunity score (0-100)
 * Sweet spot: 1K-10K ratings
 */
function calculateCompetitionScore(ratingCount: number | null): number {
    if (ratingCount === null || ratingCount === 0) return 30;

    if (ratingCount < 100) return 30;
    if (ratingCount < 1000) return 60;
    if (ratingCount < 10000) return 100;
    if (ratingCount < 50000) return 70;
    if (ratingCount < 100000) return 40;
    return 10; // Blockbuster, too hard to compete
}

/**
 * Calculate Improvement Potential score (0-100)
 * Sweet spot: 3.0-4.0 stars
 */
function calculateImprovementScore(rating: number | null): number {
    if (rating === null || rating === 0) return 50;

    if (rating < 2.0) return 50;
    if (rating < 3.0) return 80;
    if (rating < 4.0) return 100;
    if (rating < 4.5) return 70;
    return 40; // Already excellent, hard to beat
}

/**
 * Calculate Category Opportunity score (0-100)
 * Based on supply/demand ratio in category
 */
function calculateCategoryScore(densityRatio: number | null): number {
    if (densityRatio === null) return 50;

    // Higher ratio = more demand per app = better opportunity
    // Normalize to 0-100 scale (adjust thresholds based on your data)
    if (densityRatio > 10000) return 100; // High demand, low supply
    if (densityRatio > 5000) return 85;
    if (densityRatio > 1000) return 70;
    if (densityRatio > 500) return 55;
    if (densityRatio > 100) return 40;
    return 20; // Crowded category
}

/**
 * Calculate the full Indie Opportunity Score
 */
export function calculateIndieOpportunityScore(input: ScoringInput): ScoreBreakdown {
    const revenue = calculateRevenueScore(input.revenueEstimate);
    const competition = calculateCompetitionScore(input.ratingCount);
    const improvement = calculateImprovementScore(input.rating);
    const category = calculateCategoryScore(input.categoryDensityRatio);
    const feasibility = calculateFeasibilityScore(input.categoryName, input.appAgeYears, input.appName);

    // Weighted formula (redistributed to include feasibility)
    const total = Math.round(
        revenue * 0.25 +
        competition * 0.20 +
        improvement * 0.20 +
        category * 0.15 +
        feasibility * 0.20
    );

    return {
        total,
        revenue,
        competition,
        improvement,
        category,
        feasibility,
    };
}

/**
 * Calculate Indie Feasibility score (0-100)
 * Penalizes complex categories that require significant infrastructure
 */
function calculateFeasibilityScore(
    categoryName: string | null,
    appAgeYears: number | null,
    appName: string | null
): number {
    let score = 70; // Default: somewhat feasible for indies

    // Complex keywords - if app name OR category contains these, it's too complex
    const complexKeywords = [
        'hotel', 'booking', 'travel', 'flight', 'airline', 'airbnb', 'vacation', 'resort',
        'banking', 'bank', 'finance', 'payment', 'credit', 'loan', 'mortgage', 'invest',
        'dating', 'tinder', 'match', 'social network',
        'medical', 'healthcare', 'insurance', 'hospital', 'doctor', 'prescription',
        'real estate', 'property', 'rent', 'apartment',
        'food delivery', 'doordash', 'uber', 'lyft', 'rideshare', 'taxi',
        'streaming', 'netflix', 'spotify'
    ];

    // Simple/indie-friendly keywords  
    const simpleKeywords = [
        'habit', 'tracker', 'timer', 'pomodoro', 'focus', 'meditation',
        'journal', 'diary', 'notes', 'todo', 'reminder', 'checklist',
        'fitness', 'workout', 'exercise', 'running', 'walking', 'steps',
        'sleep', 'water', 'fasting', 'calorie', 'weight',
        'budget', 'expense', 'savings', 'money tracker',
        'vocabulary', 'learning', 'study', 'flashcard', 'quiz'
    ];

    // Inappropriate content filter - set score to 0
    const inappropriateKeywords = [
        'bdsm', 'adult', 'xxx', 'porn', 'nsfw', 'fetish', 'kink'
    ];

    const categoryLower = (categoryName || '').toLowerCase();
    const nameLower = (appName || '').toLowerCase();
    const combined = `${categoryLower} ${nameLower}`;

    // Check for inappropriate content first - hard filter
    for (const inappropriate of inappropriateKeywords) {
        if (combined.includes(inappropriate)) {
            return 0; // Filter out completely
        }
    }

    // Check for complex apps (both category AND name)
    for (const complex of complexKeywords) {
        if (combined.includes(complex)) {
            score = 5; // Almost zero - too complex for beginners
            break;
        }
    }

    // Check for simple/indie-friendly apps (only if not already penalized)
    if (score > 20) {
        for (const simple of simpleKeywords) {
            if (combined.includes(simple)) {
                score = 90; // Great for indies
                break;
            }
        }
    }

    // Age penalty: older apps are more established/harder to compete with
    if (appAgeYears !== null) {
        if (appAgeYears > 8) {
            score = Math.max(score - 25, 5); // Very old - established market
        } else if (appAgeYears > 5) {
            score = Math.max(score - 15, 10); // Mature app
        } else if (appAgeYears > 3) {
            score = Math.max(score - 5, 20); // Moderate age
        } else if (appAgeYears < 1) {
            score = Math.min(score + 15, 100); // Very new - emerging trend!
        } else if (appAgeYears < 2) {
            score = Math.min(score + 10, 100); // Newer trend
        }
    }

    return score;
}

/**
 * Get score badge color based on total score
 */
export function getScoreColor(score: number): string {
    if (score >= 80) return '#34c759'; // Green - Excellent
    if (score >= 65) return '#30d158'; // Light green - Good
    if (score >= 50) return '#ff9f0a'; // Orange - Moderate
    if (score >= 35) return '#ff6b6b'; // Red-orange - Low
    return '#ff453a'; // Red - Poor
}

/**
 * Get score label based on total score
 */
export function getScoreLabel(score: number): string {
    if (score >= 80) return 'Hot Opportunity';
    if (score >= 65) return 'Good Potential';
    if (score >= 50) return 'Worth Exploring';
    if (score >= 35) return 'Limited Potential';
    return 'Low Opportunity';
}
