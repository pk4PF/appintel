/**
 * App Intelligence Engine
 * 
 * Provides estimated metrics (downloads, revenue, momentum) using public signals.
 * Logic inspired by Sensor Tower and Mobile Action estimations.
 */

export interface AppIntelligence {
    downloadsMonthly: number;
    revenueMonthly: number;
    momentumScore: number;
    gapScore: number;
}

/**
 * Estimate monthly downloads and revenue based on rating count, rating, and era.
 */
export function estimateAppGrowth(
    ratingCount: number,
    rating: number,
    category: string,
    pricingModel: string,
    releaseDate: string | null
): AppIntelligence {
    const now = new Date();
    const launch = releaseDate ? new Date(releaseDate) : new Date();
    const ageInDays = Math.max(1, (now.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24));

    // 1. Download Multiplier (K-Factor)
    // Utilities usually have fewer reviews/dl (~80x), Games have more reviews/dl (~40x)
    let kFactor = 50;
    const cat = category.toLowerCase();
    if (cat.includes('utility') || cat.includes('productivity')) kFactor = 85;
    if (cat.includes('game')) kFactor = 35;
    if (cat.includes('health') || cat.includes('finance')) kFactor = 65;

    // 2. Estimated Downloads (Total & Monthly)
    const estTotalDownloads = ratingCount * kFactor;
    // Estimate last month's downloads (higher for new apps showing traction)
    const isBreakingOut = ageInDays < 60 && ratingCount > 20;
    const growthRate = isBreakingOut ? 0.4 : 0.15; // Assumption: breaking apps got 40% of their dls recently
    const downloadsMonthly = Math.round(estTotalDownloads * growthRate);

    // 3. Estimated Revenue
    // Based on average Revenue Per Download (RPD) in the category
    let rpd = 0.1; // Baseline $0.10 per download
    if (pricingModel === 'subscription') rpd = 1.2;
    if (pricingModel === 'freemium') rpd = 0.45;
    if (pricingModel === 'paid') rpd = 2.5; // High confidence but one-time

    // Category boosts
    if (cat.includes('finance')) rpd *= 2.0;
    if (cat.includes('business')) rpd *= 1.8;
    if (cat.includes('health')) rpd *= 1.5;

    const revenueMonthly = Math.round(downloadsMonthly * rpd);

    // 4. Momentum Score (0-100)
    // Higher for younger apps with high rating volume
    const velocity = ratingCount / ageInDays;
    let momentumScore = Math.min(100, Math.round(velocity * 10));
    if (isBreakingOut) momentumScore = Math.max(85, momentumScore);

    // 5. Gap Score (PRD logic)
    // High satisfaction GAP when rating is 3.0-4.0 + high momentum
    let gapScore = 50;
    if (rating < 3.8 && momentumScore > 70) gapScore = 90; // High demand, poor execution = BIG GAP
    else if (rating < 4.2) gapScore = 75;
    else gapScore = 40; // Harder to beat

    return {
        downloadsMonthly,
        revenueMonthly,
        momentumScore,
        gapScore
    };
}

/**
 * Fetch Top App IDs for a category using Apple's FREE RSS feeds.
 * This identifies "Rising" apps before they hit the global search top results.
 */
export async function fetchTopAppIds(
    categoryId: string,
    limit = 100,
    type: 'topfreeapplications' | 'toppaidapplications' | 'topgrossingapplications' = 'topfreeapplications'
): Promise<string[]> {
    const url = `https://itunes.apple.com/us/rss/${type}/limit=${limit}/genre=${categoryId}/json`;

    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        const entries = data.feed.entry || [];
        return entries.map((e: any) => e.id.attributes['im:id'] as string);
    } catch (err) {
        console.error('Error fetching RSS:', err);
        return [];
    }
}
