import { getServerClient } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { calculateMRRFromMetrics, formatMRR } from '@/services/mrr-calculator';
import { calculateIndieOpportunityScore } from '@/services/indie-score';

export const dynamic = 'force-dynamic';

// Types for the new query structure (querying from opportunity_scores)
interface OpportunityScoreWithApp {
    score: number;
    momentum: number | null;
    demand_signal: number | null;
    user_satisfaction: number | null;
    monetization_potential: number | null;
    competitive_density: number | null;
    apps: {
        id: string;
        app_store_id: string;
        name: string;
        icon_url: string | null;
        short_description: string | null;
        developer_name: string | null;
        category_id: string | null;
        price: number | null;
        pricing_model: string | null;
        categories: { name: string; slug: string } | null;
        app_metrics: Array<{
            rating: number | null;
            rating_count: number | null;
            downloads_estimate: number | null;
            date: string | null;
        }>;
    };
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

// Excluded categories (not relevant for indie opportunities)
const EXCLUDED_CATEGORY_SLUGS = ['books'];

// Max rating count - apps above this are blockbusters (too established)
const MAX_RATING_COUNT = 100000;

// Diversity filter - prevents too many similar apps from clustering
type ScoredItem = {
    indieScore: number;
    apps: { name: string; categories?: { name: string } | null };
};

function applyDiversityFilter<T extends ScoredItem>(items: T[]): T[] {
    // App type keywords for grouping similar apps
    const typeKeywords: Record<string, string[]> = {
        'habit': ['habit'],
        'tracker': ['tracker', 'tracking', 'log', 'logger'],
        'fitness': ['fitness', 'workout', 'exercise', 'gym'],
        'meditation': ['meditation', 'mindfulness', 'calm', 'zen'],
        'quit_addiction': ['quit', 'stop', 'sober', 'addiction', 'vape', 'vaping', 'smoke', 'smoking', 'alcohol'],
        'todo': ['todo', 'task', 'checklist', 'reminder'],
        'journal': ['journal', 'diary', 'gratitude'],
        'timer': ['timer', 'pomodoro', 'focus', 'clock'],
        'sleep': ['sleep', 'insomnia', 'dream'],
        'fasting': ['fasting', 'intermittent', 'fast'],
        'water': ['water', 'hydration', 'drink'],
        'calorie': ['calorie', 'nutrition', 'diet', 'food', 'meal'],
        'finance': ['budget', 'expense', 'savings', 'money'],
        'language': ['language', 'vocabulary', 'learn', 'flashcard'],
    };

    const maxPerType = 3; // Max apps of same type in top results
    const typeCounts: Record<string, number> = {};
    const result: T[] = [];

    for (const item of items) {
        const nameLower = item.apps.name.toLowerCase();
        const categoryLower = (item.apps.categories?.name || '').toLowerCase();
        const combined = `${nameLower} ${categoryLower}`;

        // Determine app type
        let appType = 'other';
        for (const [type, keywords] of Object.entries(typeKeywords)) {
            if (keywords.some(kw => combined.includes(kw))) {
                appType = type;
                break;
            }
        }

        // Check if we've exceeded the limit for this type
        const currentCount = typeCounts[appType] || 0;
        if (currentCount < maxPerType) {
            result.push(item);
            typeCounts[appType] = currentCount + 1;
        } else if (appType === 'other') {
            // Always include 'other' types for variety
            result.push(item);
        }
        // Skip if we've hit the limit for this type
    }

    return result;
}

function formatRatingCount(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-[#FF9500]' : 'text-[#3a3a3c]'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

function AppCard({ item, rank }: { item: OpportunityScoreWithApp; rank: number }) {
    const app = item.apps;
    // Sort metrics by date descending to get the latest
    const sortedMetrics = (app.app_metrics || []).sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    const latestMetrics = sortedMetrics[0];
    const rating = latestMetrics?.rating || 0;
    const ratingCount = latestMetrics?.rating_count || 0;
    const downloads = latestMetrics?.downloads_estimate || 0;

    // Calculate MRR estimate
    const mrr = calculateMRRFromMetrics(app.pricing_model, app.price, downloads);

    return (
        <Link
            href={`/app/${app.id}`}
            className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-white/10"
            suppressHydrationWarning
        >
            {/* Rank */}
            <span className="text-lg font-medium text-[#48484a] w-7 text-right tabular-nums flex-shrink-0 pt-1">{rank}</span>

            {/* Icon */}
            {app.icon_url ? (
                <Image
                    src={app.icon_url}
                    alt={app.name}
                    width={72}
                    height={72}
                    className="rounded-[16px] shadow-lg flex-shrink-0"
                    unoptimized
                />
            ) : (
                <div className="w-[72px] h-[72px] bg-[#2d2d2d] rounded-[16px] flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
                    📱
                </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="font-semibold text-white text-[16px] leading-snug mb-1">{app.name}</h3>
                <p className="text-[14px] text-[#8e8e93] mb-2">
                    {app.developer_name || app.categories?.name || 'App'}
                </p>
                {/* Star Rating + MRR */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <StarRating rating={rating} />
                        <span className="text-[13px] text-[#8e8e93]">
                            ({formatRatingCount(ratingCount)})
                        </span>
                    </div>
                    {/* MRR Badge */}
                    {mrr > 0 && (
                        <span className="px-2 py-0.5 bg-[#34c759]/20 text-[#34c759] text-[11px] font-semibold rounded">
                            {formatMRR(mrr)}/mo
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

const ITEMS_PER_PAGE = 100;

interface PageProps {
    searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
    try {
        const params = await searchParams;
        const currentPage = Math.max(1, parseInt(params.page || '1'));
        const categoryFilter = params.category;
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;

        const supabase = getServerClient();

        // Get IDs of excluded categories for filtering
        const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('id, name, slug');

        if (categoriesError) {
            console.error('Error fetching categories:', categoriesError);
        }

        const excludedCategoryIds = (categoriesData || [])
            .filter(c => EXCLUDED_CATEGORY_SLUGS.includes(c.slug || ''))
            .map(c => c.id);

        // Find the specific category ID if filtering
        const targetCategory = categoryFilter
            ? categoriesData?.find(c => c.slug === categoryFilter)
            : null;

        // Query from apps table directly, with optional opportunity scores
        let query = supabase
            .from('apps')
            .select(`
                id,
                app_store_id,
                name,
                icon_url,
                short_description,
                developer_name,
                category_id,
                price,
                pricing_model,
                release_date,
                categories!apps_category_id_fkey (name, slug),
                app_metrics (rating, rating_count, downloads_estimate, revenue_estimate, date),
                opportunity_scores (score, momentum, demand_signal, user_satisfaction, monetization_potential, competitive_density, time_window),
                reviews (id)
            `, { count: 'exact' });

        // Apply category filtering
        if (targetCategory) {
            query = query.eq('category_id', targetCategory.id);
        } else {
            // Exclude Books category apps when not specifically filtering
            for (const excludedId of excludedCategoryIds) {
                query = query.neq('category_id', excludedId);
            }
        }

        // Fetch apps
        const { data: appsData, count, error: appsError } = await query
            .range(offset, offset + ITEMS_PER_PAGE - 1);

        if (appsError) {
            console.error('Error fetching apps:', appsError);
            throw appsError;
        }

        const totalCount = count || 0;

        // Transform apps data to match expected format
        const items = (appsData || []).map(app => {
            // Get the 30d score if available
            const scores = (app.opportunity_scores as Array<{ score: number; momentum: number; demand_signal: number; user_satisfaction: number; monetization_potential: number; competitive_density: number; time_window: string }>) || [];
            const score30d = scores.find(s => s.time_window === '30d') || scores[0];

            // Check if app has reviews
            const reviews = (app as { reviews?: { id: string }[] }).reviews || [];
            const hasReviews = reviews.length > 0;

            return {
                score: score30d?.score || 0,
                momentum: score30d?.momentum || 0,
                demand_signal: score30d?.demand_signal || 0,
                user_satisfaction: score30d?.user_satisfaction || 0,
                monetization_potential: score30d?.monetization_potential || 0,
                competitive_density: score30d?.competitive_density || 0,
                hasReviews,
                apps: {
                    id: app.id,
                    app_store_id: app.app_store_id,
                    name: app.name,
                    icon_url: app.icon_url,
                    short_description: app.short_description,
                    developer_name: app.developer_name,
                    category_id: app.category_id,
                    price: app.price,
                    pricing_model: app.pricing_model,
                    release_date: (app as { release_date?: string }).release_date || null,
                    categories: (app.categories as unknown) as { name: string; slug: string } | null,
                    app_metrics: app.app_metrics || []
                }
            };
        })
            // Filter to only show apps with reviews
            .filter(item => item.hasReviews) as unknown as OpportunityScoreWithApp[];

        // Calculate Indie Opportunity Score for each app and sort by it
        const scoredItems = items.map(item => {
            const metrics = item.apps.app_metrics?.sort((m1, m2) =>
                new Date(m2.date || 0).getTime() - new Date(m1.date || 0).getTime()
            )[0];

            // Calculate revenue estimate for scoring
            const downloads = metrics?.downloads_estimate || 0;
            const revenueEstimate = calculateMRRFromMetrics(
                item.apps.pricing_model,
                item.apps.price,
                downloads
            );

            // For now, use a simple category density placeholder (will be refined later)
            // High downloads + low rating count in category = good opportunity
            const categoryDensityRatio = downloads > 0 ? downloads / 100 : 50;

            // Get category name for feasibility check
            const categoryName = item.apps.categories?.name || null;

            // Calculate app age from release_date
            let appAgeYears: number | null = null;
            const releaseDate = (item.apps as { release_date?: string | null }).release_date;
            if (releaseDate) {
                const releaseMs = new Date(releaseDate).getTime();
                const nowMs = Date.now();
                appAgeYears = (nowMs - releaseMs) / (1000 * 60 * 60 * 24 * 365);
            }

            const scoreBreakdown = calculateIndieOpportunityScore({
                revenueEstimate,
                ratingCount: metrics?.rating_count || null,
                rating: metrics?.rating || null,
                categoryDensityRatio,
                categoryName,
                appAgeYears,
                appName: item.apps.name
            });

            return {
                ...item,
                indieScore: scoreBreakdown.total,
                scoreBreakdown
            };
        });

        // Sort by Indie Opportunity Score (highest first)
        scoredItems.sort((a, b) => b.indieScore - a.indieScore);

        // Filter out apps with 0 score (inappropriate content or overly complex)
        const filteredItems = scoredItems.filter(item => item.indieScore > 0);

        // Apply diversity algorithm to prevent too many similar apps
        const diverseItems = applyDiversityFilter(filteredItems);

        // Pagination
        const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);
        const hasNextPage = currentPage < totalPages;
        const hasPrevPage = currentPage > 1;

        // Build URL for pagination
        const buildPageUrl = (page: number) => {
            const base = '/dashboard';
            const params = new URLSearchParams();
            if (page > 1) params.set('page', page.toString());
            if (categoryFilter) params.set('category', categoryFilter);
            const qs = params.toString();
            return qs ? `${base}?${qs}` : base;
        };

        // Get total count of tracked apps (after filtering blockbusters)
        const totalTrackedApps = totalCount || 0;

        return (
            <div className="min-h-screen text-white" suppressHydrationWarning>
                {/* Header */}
                <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
                    <div className="px-8 py-6">
                        <div className="flex flex-col gap-2 mb-6">
                            <h1 className="text-3xl font-bold">Dashboard</h1>
                            {targetCategory && (
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-[#007AFF]/20 text-[#007AFF] text-sm font-semibold rounded-full border border-[#007AFF]/30 flex items-center gap-2">
                                        Category: {targetCategory.name}
                                        <Link href="/dashboard" className="hover:text-white transition-colors text-xs ml-1">✕</Link>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Apps List */}
                <div className="px-8 py-6 relative z-10">
                    {/* Grid - 3 columns with good spacing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {diverseItems.map((item, index) => (
                            <AppCard
                                key={item.apps.id}
                                item={item}
                                rank={offset + index + 1}
                            />
                        ))}
                    </div>

                    {diverseItems.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-[#86868b] mb-3">No apps found.</p>
                            <p className="text-sm text-[#6e6e73]">Try adjusting your filters or run the seed script.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-white/10">
                            {hasPrevPage ? (
                                <Link
                                    href={buildPageUrl(currentPage - 1)}
                                    className="px-5 py-2 bg-[#1c1c1e] text-[#0A84FF] text-sm font-semibold rounded-full transition-all duration-200 hover:bg-[#0A84FF] hover:text-white"
                                >
                                    ← Previous
                                </Link>
                            ) : (
                                <span className="px-5 py-2 text-sm text-[#48484a]">← Previous</span>
                            )}

                            <span className="text-sm text-[#8e8e93]">
                                Page {currentPage} of {totalPages}
                            </span>

                            {hasNextPage ? (
                                <Link
                                    href={buildPageUrl(currentPage + 1)}
                                    className="px-5 py-2 bg-[#1c1c1e] text-[#0A84FF] text-sm font-semibold rounded-full transition-all duration-200 hover:bg-[#0A84FF] hover:text-white"
                                >
                                    Next →
                                </Link>
                            ) : (
                                <span className="px-5 py-2 text-sm text-[#48484a]">Next →</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error loading dashboard:', error);
        return (
            <div className="min-h-screen bg-black text-white" suppressHydrationWarning>
                <div className="px-8 py-6">
                    <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
                    <div className="text-center py-20">
                        <p className="text-[#ff3b30] mb-3 text-lg font-semibold">Error loading dashboard</p>
                        <p className="text-sm text-[#86868b] mb-4">
                            {error instanceof Error ? error.message : 'An unexpected error occurred'}
                        </p>
                        <p className="text-xs text-[#6e6e73]">
                            Check the server console for more details. The query may be timing out due to large dataset.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}
