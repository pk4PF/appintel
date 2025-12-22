import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

// Type for the query result
interface RankingRow {
  score: number;
  momentum: number | null;
  demand_signal: number | null;
  user_satisfaction: number | null;
  monetization_potential: number | null;
  competitive_density: number | null;
  calculated_at: string;
  apps: {
    id: string;
    app_store_id: string;
    name: string;
    icon_url: string | null;
    short_description: string | null;
    developer_name: string | null;
    release_date: string | null;
    price: number;
    pricing_model: string;
    category_id: string | null;
    url: string | null;
    categories: { id: string; name: string; slug: string } | null;
    app_metrics: Array<{
      rating: number | null;
      rating_count: number | null;
      downloads_estimate: number | null;
    }>;
  };
}

/**
 * GET /api/rankings
 * Get top opportunities ranked by score
 * 
 * Query params:
 *   - limit: number (default 50, max 100)
 *   - category: category slug
 *   - window: 7d | 14d | 30d (default 30d)
 *   - minScore: minimum opportunity score
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const categorySlug = searchParams.get('category');
  const timeWindow = searchParams.get('window') || '30d';
  const minScore = parseFloat(searchParams.get('minScore') || '0');

  const supabase = getServerClient();

  try {
    // If category filter, get category ID first
    let categoryId: string | null = null;
    if (categorySlug) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      categoryId = (category as { id: string } | null)?.id || null;
    }

    // Build query for opportunity scores
    let query = supabase
      .from('opportunity_scores')
      .select(`
        score,
        momentum,
        demand_signal,
        user_satisfaction,
        monetization_potential,
        competitive_density,
        calculated_at,
        apps!inner (
          id,
          app_store_id,
          name,
          icon_url,
          short_description,
          developer_name,
          release_date,
          price,
          pricing_model,
          category_id,
          url,
          categories!apps_category_id_fkey (id, name, slug),
          app_metrics (rating, rating_count, downloads_estimate)
        )
      `)
      .eq('time_window', timeWindow)
      .gte('score', minScore)
      .order('score', { ascending: false })
      .limit(limit);

    if (categoryId) {
      query = query.eq('apps.category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Cast to proper type
    const rows = data as unknown as RankingRow[] | null;

    // Transform to ranked list
    const rankings = (rows || []).map((row, index) => {
      const app = row.apps;
      
      const metrics = Array.isArray(app?.app_metrics) 
        ? app.app_metrics[0] 
        : null;

      // Calculate days since launch
      let daysSinceLaunch: number | null = null;
      if (app?.release_date) {
        const releaseDate = new Date(app.release_date);
        const now = new Date();
        daysSinceLaunch = Math.floor((now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Interpret score level
      let scoreLevel: string;
      let scoreColor: string;
      if (row.score >= 75) {
        scoreLevel = 'excellent';
        scoreColor = '#22c55e';
      } else if (row.score >= 60) {
        scoreLevel = 'good';
        scoreColor = '#84cc16';
      } else if (row.score >= 45) {
        scoreLevel = 'moderate';
        scoreColor = '#eab308';
      } else if (row.score >= 30) {
        scoreLevel = 'low';
        scoreColor = '#f97316';
      } else {
        scoreLevel = 'poor';
        scoreColor = '#ef4444';
      }

      return {
        rank: index + 1,
        app: {
          id: app?.id,
          appStoreId: app?.app_store_id,
          name: app?.name,
          icon: app?.icon_url,
          description: app?.short_description,
          developer: app?.developer_name,
          url: app?.url,
          category: app?.categories,
          daysSinceLaunch,
          pricingModel: app?.pricing_model,
        },
        metrics: metrics ? {
          rating: metrics.rating,
          ratingCount: metrics.rating_count,
          downloads: metrics.downloads_estimate,
        } : null,
        opportunityScore: {
          score: row.score,
          level: scoreLevel,
          color: scoreColor,
          components: {
            momentum: row.momentum,
            demand: row.demand_signal,
            satisfaction: row.user_satisfaction,
            monetization: row.monetization_potential,
            competition: row.competitive_density,
          },
        },
        calculatedAt: row.calculated_at,
      };
    });

    // Filter out any null apps (shouldn't happen but safety check)
    const validRankings = rankings.filter((r) => r.app?.id);

    return NextResponse.json({
      rankings: validRankings,
      meta: {
        count: validRankings.length,
        timeWindow,
        category: categorySlug || 'all',
        minScore,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Error fetching rankings:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
