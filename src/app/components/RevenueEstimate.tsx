'use client';

interface RevenueEstimateProps {
  downloads: number | null;
  ratingCount: number | null;
  pricingModel: string;
  category: string | null;
  price: number;
}

// Industry benchmarks by category (rough estimates)
const CATEGORY_BENCHMARKS: Record<string, {
  revenuePerDownload: number;
  conversionRate: number;
  avgLTV: number;
}> = {
  'finance': { revenuePerDownload: 0.85, conversionRate: 0.04, avgLTV: 35 },
  'health-fitness': { revenuePerDownload: 0.50, conversionRate: 0.06, avgLTV: 25 },
  'productivity': { revenuePerDownload: 0.65, conversionRate: 0.05, avgLTV: 30 },
  'education': { revenuePerDownload: 0.40, conversionRate: 0.03, avgLTV: 20 },
  'entertainment': { revenuePerDownload: 0.25, conversionRate: 0.02, avgLTV: 12 },
  'games': { revenuePerDownload: 0.35, conversionRate: 0.02, avgLTV: 18 },
  'lifestyle': { revenuePerDownload: 0.45, conversionRate: 0.04, avgLTV: 22 },
  'social-networking': { revenuePerDownload: 0.15, conversionRate: 0.01, avgLTV: 10 },
  'photo-video': { revenuePerDownload: 0.55, conversionRate: 0.05, avgLTV: 28 },
  'utilities': { revenuePerDownload: 0.60, conversionRate: 0.06, avgLTV: 26 },
  'shopping': { revenuePerDownload: 0.20, conversionRate: 0.015, avgLTV: 15 },
  'default': { revenuePerDownload: 0.40, conversionRate: 0.03, avgLTV: 20 },
};

// Pricing model multipliers
const PRICING_MULTIPLIERS: Record<string, number> = {
  'subscription': 2.5,
  'freemium': 1.5,
  'paid': 1.0,
  'free': 0.3,
};

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
}

function getRevenueTier(monthlyRevenue: number): { label: string; color: string } {
  if (monthlyRevenue >= 100000) return { label: 'Top 1%', color: '#34c759' };
  if (monthlyRevenue >= 50000) return { label: 'Top 5%', color: '#30d158' };
  if (monthlyRevenue >= 10000) return { label: 'Top 10%', color: '#007AFF' };
  if (monthlyRevenue >= 5000) return { label: 'Top 25%', color: '#5856d6' };
  if (monthlyRevenue >= 1000) return { label: 'Top 50%', color: '#ff9f0a' };
  return { label: 'Below Median', color: '#6e6e73' };
}

export default function RevenueEstimate({
  downloads,
  ratingCount,
  pricingModel,
  category,
  price,
  releaseDate,
}: RevenueEstimateProps & { releaseDate?: string | null }) {
  // Estimate total downloads from rating count if not available
  const totalDownloads = downloads || (ratingCount ? ratingCount * 80 : 0);

  if (totalDownloads === 0) {
    return null;
  }

  // Calculate monthly downloads factor in app age
  const date = releaseDate ? new Date(releaseDate) : new Date();
  const monthsActive = Math.max(1, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const monthlyDownloads = Math.round(totalDownloads / Math.max(monthsActive, 12));

  // Get category benchmarks
  const categorySlug = category?.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '') || 'default';
  const benchmark = CATEGORY_BENCHMARKS[categorySlug] || CATEGORY_BENCHMARKS['default'];

  // Refined conversion rates
  const conversionRate = pricingModel === 'subscription' ? 0.025 : 0.015;
  const avgPrice = price > 0 ? price : (pricingModel === 'subscription' ? 5.99 : 3.99);

  // MRR estimation
  let monthlyRevenue = 0;
  if (pricingModel === 'subscription') {
    const activeUsers = monthlyDownloads * 1.5;
    monthlyRevenue = activeUsers * conversionRate * avgPrice;
  } else {
    monthlyRevenue = monthlyDownloads * conversionRate * avgPrice;
  }

  const tier = getRevenueTier(monthlyRevenue);

  return (
    <div className="bg-[#1d1d1f] rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Revenue Analysis</h2>
        <span
          className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-[#86868b] uppercase tracking-wider"
        >
          {tier.label}
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs text-[#86868b] mb-1 font-medium uppercase tracking-wider">Est. Monthly Revenue</p>
          <p className="text-4xl font-bold text-[#34c759] tracking-tighter">
            {formatCurrency(monthlyRevenue)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-[10px] text-[#86868b] uppercase font-bold tracking-widest mb-1">Downloads</p>
            <p className="text-lg font-semibold text-white">{formatNumber(monthlyDownloads)}<span className="text-[10px] text-[#86868b] ml-1">/mo</span></p>
          </div>
          <div>
            <p className="text-[10px] text-[#86868b] uppercase font-bold tracking-widest mb-1">Conversion</p>
            <p className="text-lg font-semibold text-white">{(benchmark.conversionRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-[#6e6e73] mt-6 italic">
        * Estimates based on industry benchmarks for {category || 'Generic'} apps.
      </p>
    </div>
  );
}






