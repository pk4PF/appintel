import { getServerClient } from '@/lib/supabase';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ReviewsAnalysis from '@/app/components/ReviewsAnalysis';
import SaveAppButton from '@/app/components/SaveAppButton';
import { ingestReviewsForApp } from '@/services/review-ingestion';
import { calculateMRRFromMetrics, formatMRR } from '@/services/mrr-calculator';

import { generateAndStoreInsights } from '@/services/review-analysis';

export const dynamic = 'force-dynamic';

interface AppDetail {
  id: string;
  app_store_id: string;
  name: string;
  icon_url: string | null;
  description: string | null;
  short_description: string | null;
  developer_name: string | null;
  developer_id: string | null;
  release_date: string | null;
  last_updated: string | null;
  price: number;
  pricing_model: string;
  minimum_os_version: string | null;
  size_bytes: number | null;
  languages: string[];
  content_rating: string | null;
  url: string | null;
  screenshots: string[] | null;
  ipad_screenshots: string[] | null;
  categories: { name: string; slug: string } | null;
  app_metrics: Array<{
    rating: number | null;
    rating_count: number | null;
    downloads_estimate: number | null;
    revenue_estimate: number | null;
    date: string;
  }>;
  opportunity_scores: Array<{
    score: number;
    momentum: number | null;
    demand_signal: number | null;
    user_satisfaction: number | null;
    monetization_potential: number | null;
    competitive_density: number | null;
    calculated_at: string;
  }>;
}

interface Review {
  id: string;
  author: string | null;
  title: string | null;
  review_text: string | null;
  rating: number;
  review_date: string | null;
  version: string | null;
}

interface ReviewInsight {
  id: string;
  insight_type: string;
  summary: string;
  evidence: string[] | null;
  frequency: number;
}

function formatNumber(num: number | null): string {
  if (num === null || num === undefined) return '—';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'text-[#ff9f0a]' : 'text-[#3d3d3d]'}>
          ★
        </span>
      ))}
    </div>
  );
}

export default async function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getServerClient();

  // Fetch app details
  const { data: app, error } = await supabase
    .from('apps')
    .select(`
      *,
      categories!apps_category_id_fkey (name, slug),
      app_metrics (rating, rating_count, downloads_estimate, revenue_estimate, date),
      opportunity_scores (score, momentum, demand_signal, user_satisfaction, monetization_potential, competitive_density, calculated_at)
    `)
    .eq('id', id)
    .single();

  if (error || !app) {
    notFound();
  }

  // Fetch reviews
  let { data: reviewsData } = await supabase
    .from('reviews')
    .select('*')
    .eq('app_id', id)
    .order('review_date', { ascending: false })
    .limit(200);

  // ON-DEMAND INGESTION
  if (!reviewsData || reviewsData.length === 0) {
    await ingestReviewsForApp(id, app.app_store_id, 50);
    const { data: freshReviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('app_id', id)
      .order('review_date', { ascending: false })
      .limit(200);
    reviewsData = freshReviews;
  }

  const reviews = (reviewsData || []) as Review[];

  // Fetch review insights
  let { data: insightsData } = await supabase
    .from('review_insights')
    .select('*')
    .eq('app_id', id);

  // ON-DEMAND INSIGHT GENERATION
  if ((!insightsData || insightsData.length === 0) && reviews.length > 0) {
    console.log(`💡 On-demand insight generation triggered for ${id}`);
    await generateAndStoreInsights(id);

    // Refresh insights data
    const { data: freshInsights } = await supabase
      .from('review_insights')
      .select('*')
      .eq('app_id', id);
    insightsData = freshInsights;
  }

  const insights = (insightsData || []) as ReviewInsight[];

  const appData = app as unknown as AppDetail;
  const metrics = appData.app_metrics?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  // Calculate dynamic metrics - CONFIDENT FIXED NUMBERS
  const totalDownloads = metrics?.downloads_estimate || (metrics?.rating_count ? metrics.rating_count * 100 : 0);
  const monthlyDownloads = Math.round(totalDownloads / 12);
  const mrr = calculateMRRFromMetrics(appData.pricing_model, appData.price, totalDownloads, appData.release_date);

  return (
    <div className="min-h-screen text-white py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Header Section */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            {appData.icon_url ? (
              <Image
                src={appData.icon_url}
                alt={appData.name}
                width={80}
                height={80}
                className="rounded-[22px] shadow-2xl"
              />
            ) : (
              <div className="w-20 h-20 bg-[#2d2d2d] rounded-[22px] flex items-center justify-center text-4xl shadow-2xl">
                📱
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">{appData.name}</h1>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1">
              <StarRating rating={Math.round(metrics?.rating || 0)} />
              <span className="text-sm font-bold ml-1">{metrics?.rating?.toFixed(1) || '0.0'}</span>
            </div>
            <span className="text-[#48484a]">•</span>
            <span className="text-sm text-[#86868b] font-medium">{formatNumber(metrics?.rating_count)} Ratings</span>
            {appData.url && (
              <>
                <span className="text-[#48484a]">•</span>
                <a href={appData.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#007AFF] font-bold hover:underline">App Store</a>
              </>
            )}
          </div>

          {/* Save Button */}
          <div className="mb-6">
            <SaveAppButton
              app={{
                id: appData.id,
                appStoreId: appData.app_store_id,
                name: appData.name,
                iconUrl: appData.icon_url,
                developerName: appData.developer_name,
                category: appData.categories?.name || null,
                metrics: {
                  rating: metrics?.rating || null,
                  ratingCount: metrics?.rating_count || null,
                  downloadsEstimate: metrics?.downloads_estimate || null,
                  revenueEstimate: metrics?.revenue_estimate || null,
                },
                opportunityScore: appData.opportunity_scores?.[0]?.score || null,
                releaseDate: appData.release_date
              }}
            />
          </div>

          {/* Performance Bar */}
          <div className="flex gap-4 w-full justify-center">
            <div className="bg-[#1c1c1e] px-8 py-4 rounded-2xl border border-white/5 flex flex-col items-center min-w-[160px]">
              <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1">Downloads</span>
              <span className="text-xl font-bold">{formatNumber(monthlyDownloads)}<span className="text-xs text-[#48484a] ml-1">/mo</span></span>
            </div>
            <div className="bg-[#1c1c1e] px-8 py-4 rounded-2xl border border-white/5 flex flex-col items-center min-w-[160px]">
              <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-1">Revenue</span>
              <span className="text-xl font-bold text-[#34c759]">{formatMRR(mrr)}<span className="text-xs text-[#48484a] ml-1">/mo</span></span>
            </div>
          </div>
        </div>

        {/* Reviews & Insights Section */}
        <div className="w-full">
          <ReviewsAnalysis
            reviews={reviews}
            insights={insights}
            appName={appData.name}
            isAuthenticated={true}
          />
        </div>

      </div>
    </div>
  );
}
