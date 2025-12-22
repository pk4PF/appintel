import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import type { Category } from '@/types/database';

interface AppWithMetrics {
  id: string;
  app_metrics: Array<{ rating: number | null; downloads_estimate: number | null }>;
  opportunity_scores: Array<{ score: number }>;
}

/**
 * GET /api/categories
 * List all categories with app counts and aggregate stats
 */
export async function GET() {
  const supabase = getServerClient();

  try {
    // Get all categories
    const { data: categoriesData, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    const categories = categoriesData as unknown as Category[] | null;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get app counts and stats per category
    const categoryStats = await Promise.all(
      (categories || []).map(async (category) => {
        // Get apps in this category with their scores
        const { data: appsData } = await supabase
          .from('apps')
          .select(`
            id,
            app_metrics (rating, downloads_estimate),
            opportunity_scores (score)
          `)
          .eq('category_id', category.id);
        
        const apps = appsData as unknown as AppWithMetrics[] | null;

        const appCount = apps?.length || 0;

        // Calculate aggregate stats
        let avgRating = 0;
        let avgOpportunityScore = 0;
        let totalDownloads = 0;

        if (apps && apps.length > 0) {
          const ratings = apps
            .flatMap((a) => {
              const m = Array.isArray(a.app_metrics) ? a.app_metrics : [];
              return m.map((x) => x.rating).filter((r): r is number => r !== null);
            });
          
          const scores = apps
            .flatMap((a) => {
              const s = Array.isArray(a.opportunity_scores) ? a.opportunity_scores : [];
              return s.map((x) => x.score).filter((s): s is number => s !== null);
            });

          const downloads = apps
            .flatMap((a) => {
              const m = Array.isArray(a.app_metrics) ? a.app_metrics : [];
              return m.map((x) => x.downloads_estimate).filter((d): d is number => d !== null);
            });

          avgRating = ratings.length > 0 
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
            : 0;
          
          avgOpportunityScore = scores.length > 0 
            ? scores.reduce((a, b) => a + b, 0) / scores.length 
            : 0;
          
          totalDownloads = downloads.reduce((a, b) => a + b, 0);
        }

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          appStoreId: category.app_store_id,
          stats: {
            appCount,
            avgRating: Math.round(avgRating * 10) / 10,
            avgOpportunityScore: Math.round(avgOpportunityScore * 10) / 10,
            totalDownloads,
          },
        };
      })
    );

    // Sort by app count (most apps first)
    categoryStats.sort((a, b) => b.stats.appCount - a.stats.appCount);

    return NextResponse.json({
      categories: categoryStats,
      total: categoryStats.length,
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
