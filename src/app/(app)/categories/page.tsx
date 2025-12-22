import { getServerClient } from '@/lib/supabase';
import Link from 'next/link';

interface CategoryWithStats {
  id: string;
  name: string;
  slug: string;
  app_store_id: number | null;
  appCount: number;
  avgRating: number;
  avgScore: number;
  totalDownloads: number;
}

interface AppForStats {
  id: string;
  app_metrics: Array<{ rating: number | null; downloads_estimate: number | null }>;
  opportunity_scores: Array<{ score: number }>;
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
  'business': '💼',
  'developer-tools': '🔧',
  'education': '🎓',
  'entertainment': '🎭',
  'finance': '💰',
  'games': '🎮',
  'graphics-design': '🎨',
  'health-fitness': '💪',
  'lifestyle': '🌟',
  'medical': '⚕️',
  'music': '🎵',
  'news': '📰',
  'photo-video': '📷',
  'productivity': '⚡',
  'reference': '📚',
  'social-networking': '💬',
  'sports': '⚽',
  'travel': '✈️',
  'utilities': '🔨',
  'weather': '🌤️',
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default async function CategoriesPage() {
  const supabase = getServerClient();

  // Get all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  // Get app counts and stats per category
  const categoryStats: CategoryWithStats[] = await Promise.all(
    (categories || []).map(async (category: any) => {
      const { data: apps } = await supabase
        .from('apps')
        .select(`
          id,
          app_metrics (rating, downloads_estimate),
          opportunity_scores (score)
        `)
        .eq('category_id', category.id);

      const typedApps = apps as unknown as AppForStats[] | null;
      const appCount = typedApps?.length || 0;

      let avgRating = 0;
      let avgScore = 0;
      let totalDownloads = 0;

      if (typedApps && typedApps.length > 0) {
        const ratings = typedApps
          .flatMap(a => (Array.isArray(a.app_metrics) ? a.app_metrics : []))
          .map(m => m.rating)
          .filter((r): r is number => r !== null);

        const scores = typedApps
          .flatMap(a => (Array.isArray(a.opportunity_scores) ? a.opportunity_scores : []))
          .map(s => s.score)
          .filter((s): s is number => s !== null);

        const downloads = typedApps
          .flatMap(a => (Array.isArray(a.app_metrics) ? a.app_metrics : []))
          .map(m => m.downloads_estimate)
          .filter((d): d is number => d !== null);

        avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        totalDownloads = downloads.reduce((a, b) => a + b, 0);
      }

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        app_store_id: category.app_store_id,
        appCount,
        avgRating: Math.round(avgRating * 10) / 10,
        avgScore: Math.round(avgScore * 10) / 10,
        totalDownloads,
      };
    })
  );

  // Sort by app count (most first), filter out empty categories
  const sortedCategories = categoryStats
    .filter(c => c.appCount > 0)
    .sort((a, b) => b.appCount - a.appCount);

  const totalApps = sortedCategories.reduce((sum, c) => sum + c.appCount, 0);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/10">
        <h1 className="text-3xl font-bold">Categories</h1>
      </div>

      {/* Categories Grid */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCategories.map((category) => {
            const icon = CATEGORY_ICONS[category.slug] || '📱';

            return (
              <Link
                key={category.id}
                href={`/dashboard?category=${category.slug}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-[#1d1d1f] hover:bg-[#2d2d2d] transition-colors group"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center text-2xl shadow-lg">
                  {icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white group-hover:text-[#007AFF] transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-[#86868b]">
                    {category.appCount} apps
                  </p>
                </div>

                {/* Arrow */}
                <svg className="w-5 h-5 text-[#6e6e73] group-hover:text-[#86868b] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>

        {sortedCategories.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#86868b] mb-3">No categories found.</p>
            <p className="text-sm text-[#6e6e73]">Run the seed script to populate data.</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 pt-8 border-t border-white/10 flex justify-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{sortedCategories.length}</p>
            <p className="text-sm text-[#86868b]">Categories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{totalApps.toLocaleString()}</p>
            <p className="text-sm text-[#86868b]">Total Apps</p>
          </div>
        </div>
      </div>
    </div>
  );
}
