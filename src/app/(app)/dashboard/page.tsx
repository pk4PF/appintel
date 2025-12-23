import { getServerClient } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { calculateMRRFromMetrics, formatMRR } from '@/services/mrr-calculator';

export const dynamic = 'force-dynamic';

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
                    className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-[#FF9500]' : 'text-[#3a3a3c]'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

interface App {
    id: string;
    name: string;
    icon_url: string | null;
    developer_name: string | null;
    pricing_model: string | null;
    price: number | null;
    app_metrics: Array<{
        rating: number | null;
        rating_count: number | null;
        downloads_estimate: number | null;
    }>;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    apps: App[];
}

function AppCard({ app }: { app: App }) {
    const latestMetrics = app.app_metrics?.[0];
    const rating = latestMetrics?.rating || 0;
    const ratingCount = latestMetrics?.rating_count || 0;
    const downloads = latestMetrics?.downloads_estimate || 0;
    const mrr = calculateMRRFromMetrics(app.pricing_model, app.price, downloads);

    return (
        <Link
            href={`/app/${app.id}`}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
        >
            {/* Icon */}
            {app.icon_url ? (
                <Image
                    src={app.icon_url}
                    alt={app.name}
                    width={52}
                    height={52}
                    className="rounded-[12px] shadow-md flex-shrink-0"
                    unoptimized
                />
            ) : (
                <div className="w-[52px] h-[52px] bg-[#2d2d2d] rounded-[12px] flex items-center justify-center text-xl shadow-md flex-shrink-0">
                    📱
                </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white text-[14px] leading-snug mb-0.5 truncate">{app.name}</h3>
                <p className="text-[12px] text-[#8e8e93] mb-1 truncate">
                    {app.developer_name || 'Developer'}
                </p>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <StarRating rating={rating} />
                        <span className="text-[11px] text-[#6e6e73]">
                            ({formatRatingCount(ratingCount)})
                        </span>
                    </div>
                    {mrr > 0 && (
                        <span className="px-1.5 py-0.5 bg-[#34c759]/20 text-[#34c759] text-[10px] font-semibold rounded">
                            {formatMRR(mrr)}/mo
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

function CategorySection({ category }: { category: Category }) {
    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">{category.name}</h2>
                <span className="text-[13px] text-[#8e8e93]">{category.apps.length} apps</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {category.apps.slice(0, 8).map((app) => (
                    <AppCard key={app.id} app={app} />
                ))}
            </div>
            {category.apps.length > 8 && (
                <div className="mt-3 text-center">
                    <span className="text-[13px] text-[#6e6e73]">
                        +{category.apps.length - 8} more apps
                    </span>
                </div>
            )}
        </div>
    );
}

export default async function DashboardPage() {
    const supabase = getServerClient();

    // Fetch all categories with their apps
    const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');

    // Fetch all apps with metrics
    const { data: appsData } = await supabase
        .from('apps')
        .select(`
            id,
            name,
            icon_url,
            developer_name,
            pricing_model,
            price,
            category_id,
            app_metrics (rating, rating_count, downloads_estimate)
        `)
        .not('category_id', 'is', null)
        .limit(500);

    // Group apps by category
    const categoriesWithApps: Category[] = (categoriesData || [])
        .map(cat => ({
            ...cat,
            apps: (appsData || [])
                .filter(app => app.category_id === cat.id)
                .sort((a, b) => {
                    const aRatings = a.app_metrics?.[0]?.rating_count || 0;
                    const bRatings = b.app_metrics?.[0]?.rating_count || 0;
                    return bRatings - aRatings;
                }) as App[]
        }))
        .filter(cat => cat.apps.length > 0)
        .sort((a, b) => b.apps.length - a.apps.length);

    const totalApps = categoriesWithApps.reduce((sum, cat) => sum + cat.apps.length, 0);

    return (
        <div className="min-h-screen text-white">
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/10">
                <h1 className="text-3xl font-bold mb-1">Browse Apps</h1>
                <p className="text-[#8e8e93]">
                    {totalApps.toLocaleString()} apps across {categoriesWithApps.length} categories
                </p>
            </div>

            {/* Categories */}
            <div className="px-8 py-8">
                {categoriesWithApps.map((category) => (
                    <CategorySection key={category.id} category={category} />
                ))}

                {categoriesWithApps.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-[#86868b] mb-3">No apps found.</p>
                        <p className="text-sm text-[#6e6e73]">Run the seed script to populate apps.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
