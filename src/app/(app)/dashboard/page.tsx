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

interface App {
    id: string;
    name: string;
    icon_url: string | null;
    developer_name: string | null;
    pricing_model: string | null;
    price: number | null;
    categories: { name: string; slug: string } | null;
    app_metrics: Array<{
        rating: number | null;
        rating_count: number | null;
        downloads_estimate: number | null;
    }>;
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
            className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-white/10"
        >
            {/* Icon */}
            {app.icon_url ? (
                <Image
                    src={app.icon_url}
                    alt={app.name}
                    width={64}
                    height={64}
                    className="rounded-[14px] shadow-lg flex-shrink-0"
                    unoptimized
                />
            ) : (
                <div className="w-16 h-16 bg-[#2d2d2d] rounded-[14px] flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
                    📱
                </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-[15px] leading-snug mb-0.5 truncate">{app.name}</h3>
                <p className="text-[13px] text-[#8e8e93] mb-2 truncate">
                    {app.developer_name || app.categories?.name || 'App'}
                </p>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <StarRating rating={rating} />
                        <span className="text-[12px] text-[#8e8e93]">
                            ({formatRatingCount(ratingCount)})
                        </span>
                    </div>
                    {mrr > 0 && (
                        <span className="px-2 py-0.5 bg-[#34c759]/20 text-[#34c759] text-[10px] font-semibold rounded">
                            {formatMRR(mrr)}/mo
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

interface PageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const query = params.q?.trim() || '';

    const supabase = getServerClient();
    let apps: App[] = [];

    if (query.length >= 2) {
        // Search for apps matching the query
        const { data, error } = await supabase
            .from('apps')
            .select(`
                id,
                name,
                icon_url,
                developer_name,
                pricing_model,
                price,
                categories!apps_category_id_fkey (name, slug),
                app_metrics (rating, rating_count, downloads_estimate)
            `)
            .ilike('name', `%${query}%`)
            .limit(50);

        if (!error && data) {
            apps = data as App[];
        }
    }

    return (
        <div className="min-h-screen text-white">
            {/* Centered Search Container */}
            <div className={`flex flex-col items-center justify-center transition-all duration-500 ${query ? 'pt-8' : 'pt-[20vh]'}`}>
                {/* Logo/Title */}
                <div className={`text-center mb-8 transition-all duration-500 ${query ? 'scale-75' : ''}`}>
                    <h1 className="text-5xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-[#34c759] via-[#30d158] to-[#63e6be] bg-clip-text text-transparent">
                            AppGap
                        </span>
                    </h1>
                    <p className="text-[#8e8e93] text-lg">Find your next app opportunity</p>
                </div>

                {/* Search Bar */}
                <form action="/dashboard" method="GET" className="w-full max-w-2xl px-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-[#8e8e93]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Search for any app..."
                            autoFocus
                            className="w-full pl-14 pr-6 py-4 bg-[#1c1c1e] border border-[#3a3a3c] rounded-2xl text-white text-lg placeholder-[#6e6e73] focus:outline-none focus:border-[#34c759] focus:ring-2 focus:ring-[#34c759]/20 transition-all"
                        />
                    </div>
                </form>

                {/* Results or Empty State */}
                <div className="w-full max-w-4xl px-6 mt-8">
                    {query && apps.length > 0 && (
                        <>
                            <p className="text-[#8e8e93] text-sm mb-4">
                                Found {apps.length} apps for &quot;{query}&quot;
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {apps.map((app) => (
                                    <AppCard key={app.id} app={app} />
                                ))}
                            </div>
                        </>
                    )}

                    {query && apps.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-[#8e8e93] text-lg mb-2">No apps found for &quot;{query}&quot;</p>
                            <p className="text-[#6e6e73] text-sm">Try a different search term</p>
                        </div>
                    )}

                    {!query && (
                        <div className="text-center py-8">
                            <p className="text-[#6e6e73] text-sm">
                                Search for apps like &quot;meditation&quot;, &quot;budget tracker&quot;, or &quot;fitness&quot;
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
