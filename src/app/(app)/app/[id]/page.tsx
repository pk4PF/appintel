import { getServerClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SaveAppButton from '@/app/components/SaveAppButton';
import { calculateMRRFromMetrics, formatMRR } from '@/services/mrr-calculator';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = await params;
  const supabase = getServerClient();
  const { data: app } = await supabase.from('apps').select('name').eq('id', id).single();

  return {
    title: app ? `${app.name} | App Gap Analysis` : "Market Gap Analysis",
    description: `See the revenue data and AI blueprints for ${app?.name || 'this app'}. Find the market gaps and build a better spinoff.`,
  };
}

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
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-[#FFD60A]' : 'text-[#2c2c2e]'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function MetricCard({ label, value, suffix, color = 'white' }: { label: string; value: string; suffix?: string; color?: string }) {
  const colorClasses = {
    white: 'text-white',
    green: 'text-[#34c759]',
    purple: 'text-[#a78bfa]',
    blue: 'text-[#8b5cf6]',
  };

  return (
    <div className="bg-white/5 px-6 py-6 rounded-[32px] border border-white/5 flex flex-col items-center min-w-[160px] shadow-2xl shadow-black/20 active:scale-105 transition-transform duration-200">
      <span className="text-[10px] font-black text-[#6e6e73] uppercase tracking-[0.2em] mb-3">{label}</span>
      <span className={`text-2xl font-black tracking-tighter ${colorClasses[color as keyof typeof colorClasses] || 'text-white'}`}>
        {value}
        {suffix && <span className="text-xs text-[#48484a] font-bold ml-1 uppercase tracking-widest">{suffix}</span>}
      </span>
    </div>
  );
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase());

export default async function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getServerClient(); // Service role for data ops
  const supabaseAuth = await createClient(); // SSR client for auth

  // Check auth and premium status
  const { data: { user } } = await supabaseAuth.auth.getUser();
  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email?.toLowerCase() || ''));
  const isPremium = !!(user?.user_metadata?.is_premium || isAdmin);

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

  const appData = app as unknown as AppDetail;
  const metrics = appData.app_metrics?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  // Calculate dynamic metrics
  const ratingCount = metrics?.rating_count || 0;

  // High-volume apps have much higher rating-to-download ratios
  let ratingMultiplier = 150; // Base: 1 rating per 150 downloads
  if (ratingCount > 1000) ratingMultiplier = 350;
  if (ratingCount > 5000) ratingMultiplier = 800;
  if (ratingCount > 20000) ratingMultiplier = 1500;

  const totalDownloads = metrics?.downloads_estimate || (ratingCount * ratingMultiplier);

  // Estimate current monthly downloads (roughly Total / years active, or Total / 12)
  const appAgeMonths = appData.release_date ? Math.max(1, Math.floor((Date.now() - new Date(appData.release_date).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 12;
  const currentMonthlyDownloads = Math.round(totalDownloads / appAgeMonths);
  const mrr = calculateMRRFromMetrics(
    appData.pricing_model,
    appData.price,
    totalDownloads,
    appData.release_date,
    metrics?.revenue_estimate
  );

  return (
    <div className="min-h-screen bg-[#171717] text-white">
      {/* Back Button */}
      <div className="px-8 py-6 border-b border-white/5 bg-[#171717]/80 backdrop-blur-xl sticky top-0 z-50">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black text-[#6e6e73] hover:text-[#8b5cf6] transition-all uppercase tracking-[0.2em] group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Gaps
        </Link>
      </div>

      <div className="px-8 py-12">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Icon */}
            <div className="relative">
              {appData.icon_url ? (
                <Image
                  src={appData.icon_url}
                  alt={appData.name}
                  width={100}
                  height={100}
                  className="rounded-[24px] shadow-2xl"
                  unoptimized
                />
              ) : (
                <div className="w-[100px] h-[100px] bg-[#1c1c1e] rounded-[24px] flex items-center justify-center text-4xl shadow-2xl">
                  📱
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-[#8b5cf6]/10 text-[#a78bfa] text-[10px] font-black rounded-full border border-[#8b5cf6]/20 uppercase tracking-widest">
                  Market Gap Analysis
                </span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter mb-2">{appData.name}</h1>
              <p className="text-[#86868b] font-bold uppercase tracking-widest text-xs">{appData.developer_name || 'Developer'}</p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(metrics?.rating || 0)} />
                  <span className="text-sm font-semibold">{metrics?.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-sm text-[#6e6e73]">({formatNumber(metrics?.rating_count)} ratings)</span>
                </div>
                {appData.url && (
                  <>
                    <span className="text-[#3a3a3c]">•</span>
                    <a
                      href={appData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#007AFF] font-medium hover:underline"
                    >
                      View on App Store →
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="md:ml-auto">
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
                  releaseDate: appData.release_date
                }}
              />
            </div>
          </div>

          {/* Intelligence Metrics */}
          <div className="flex flex-wrap justify-center md:justify-start gap-6">
            <MetricCard
              label="Monthly Downloads"
              value={formatNumber(currentMonthlyDownloads)}
              color="white"
            />
            <MetricCard
              label="Monthly Revenue"
              value={formatMRR(mrr)}
              suffix="/mo"
              color="purple"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
