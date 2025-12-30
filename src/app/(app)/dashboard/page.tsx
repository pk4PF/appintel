import { getServerClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import DashboardList from '@/app/components/DashboardList';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const supabase = getServerClient();
    const supabaseAuth = await createClient();

    // Check auth
    const { data: { user } } = await supabaseAuth.auth.getUser();

    const { data: apps, error } = await supabase
        .from('apps')
        .select(`
            id, 
            name, 
            icon_url, 
            developer_name, 
            release_date, 
            price, 
            pricing_model,
            categories!apps_category_id_fkey (name),
            app_metrics (rating, rating_count, downloads_estimate, revenue_estimate, date),
            opportunity_scores (score, momentum, calculated_at)
        `)
        .order('id', { ascending: false }) // Use stable order for pagination
        .limit(10000);

    if (error) {
        console.error("Error fetching apps:", error);
    }

    // Transform data
    const dashboardApps = (apps || [])
        .map((app: any) => {
            // Get latest metrics
            const latestMetrics = app.app_metrics?.sort((a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0] || { rating: 0, rating_count: 0, downloads_estimate: 0, revenue_estimate: 0 };

            // Get latest score
            const scoreData = app.opportunity_scores?.sort((a: any, b: any) =>
                new Date(b.calculated_at).getTime() - new Date(a.calculated_at).getTime()
            )[0];

            return {
                id: app.id,
                name: app.name,
                icon_url: app.icon_url,
                developer_name: app.developer_name,
                release_date: app.release_date,
                price: app.price,
                pricing_model: app.pricing_model,
                category: app.categories?.name || 'Unknown',
                rating: latestMetrics.rating || 0,
                rating_count: latestMetrics.rating_count || 0,
                downloads_estimate: latestMetrics.downloads_estimate || 0,
                revenue_estimate: latestMetrics.revenue_estimate || 0,
                opportunity_score: scoreData?.score || 0,
                momentum: scoreData?.momentum || 0,
            };
        });

    return (
        <div className="min-h-screen bg-[#171717] text-white">
            {/* Header */}
            <div className="px-8 py-12 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-[#8b5cf6]/5 blur-[120px] pointer-events-none" />

                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 mb-6">
                                <div className="w-1 h-1 rounded-full bg-[#34c759]" />
                                <span className="text-[10px] font-black text-[#8b5cf6] uppercase tracking-[0.2em]">Live Intelligence</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">App Intel Explorer</h1>
                            <p className="text-[#a1a1a1] text-lg font-medium max-w-2xl">
                                Identifying the best emerging opportunities on the App Store.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 md:px-8 py-10">
                <div className="max-w-[1600px] mx-auto">
                    <DashboardList apps={dashboardApps} />
                </div>
            </div>
        </div>
    );
}
