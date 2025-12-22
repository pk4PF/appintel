import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

// Types for query results
interface AppListItem {
  id: string;
  app_store_id: string;
  name: string;
  icon_url: string | null;
  short_description: string | null;
  developer_name: string | null;
  release_date: string | null;
  price: number;
  pricing_model: string;
  url: string | null;
  categories: { id: string; name: string; slug: string } | null;
  app_metrics: Array<{
    rating: number | null;
    rating_count: number | null;
    downloads_estimate: number | null;
  }>;
  opportunity_scores: Array<{
    score: number;
    momentum: number | null;
    demand_signal: number | null;
    user_satisfaction: number | null;
    monetization_potential: number | null;
    competitive_density: number | null;
    time_window: string;
  }>;
}

/**
 * GET /api/apps
 * List all apps with optional filtering
 * 
 * Query params:
 *   - limit: number (default 50)
 *   - offset: number (default 0)
 *   - category: category slug
 *   - pricing: free | paid | freemium | subscription
 *   - sort: score | name | release_date | rating
 *   - order: asc | desc
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const categorySlug = searchParams.get('category');
  const pricing = searchParams.get('pricing');
  const sort = searchParams.get('sort') || 'score';
  const order = searchParams.get('order') || 'desc';
  const timeWindow = searchParams.get('window') || '30d';

  const supabase = getServerClient();

  try {
    // Get category ID if filtering by category
    let categoryId: string | null = null;
    if (categorySlug) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      
      categoryId = (category as { id: string } | null)?.id || null;
    }

    // Build query
    let query = supabase
      .from('apps')
      .select(`
        id,
        app_store_id,
        name,
        icon_url,
        short_description,
        developer_name,
        release_date,
        price,
        pricing_model,
        url,
        categories!apps_category_id_fkey (id, name, slug),
        app_metrics (rating, rating_count, downloads_estimate),
        opportunity_scores!inner (
          score,
          momentum,
          demand_signal,
          user_satisfaction,
          monetization_potential,
          competitive_density,
          time_window
        )
      `)
      .eq('opportunity_scores.time_window', timeWindow)
      .range(offset, offset + limit - 1);

    // Apply category filter
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Apply pricing filter
    if (pricing) {
      query = query.eq('pricing_model', pricing);
    }

    // Apply sorting
    if (sort === 'score') {
      query = query.order('score', { 
        ascending: order === 'asc',
        referencedTable: 'opportunity_scores'
      });
    } else if (sort === 'name') {
      query = query.order('name', { ascending: order === 'asc' });
    } else if (sort === 'release_date') {
      query = query.order('release_date', { ascending: order === 'asc' });
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Cast and transform response
    const rawApps = data as unknown as AppListItem[] | null;
    const apps = (rawApps || []).map((app) => {
      const metrics = Array.isArray(app.app_metrics) 
        ? app.app_metrics[0] 
        : app.app_metrics;
      const scores = Array.isArray(app.opportunity_scores)
        ? app.opportunity_scores[0]
        : app.opportunity_scores;

      return {
        id: app.id,
        appStoreId: app.app_store_id,
        name: app.name,
        icon: app.icon_url,
        description: app.short_description,
        developer: app.developer_name,
        releaseDate: app.release_date,
        price: app.price,
        pricingModel: app.pricing_model,
        url: app.url,
        category: app.categories,
        metrics: metrics ? {
          rating: metrics.rating,
          ratingCount: metrics.rating_count,
          downloads: metrics.downloads_estimate,
        } : null,
        opportunityScore: scores ? {
          score: scores.score,
          momentum: scores.momentum,
          demand: scores.demand_signal,
          satisfaction: scores.user_satisfaction,
          monetization: scores.monetization_potential,
          competition: scores.competitive_density,
        } : null,
      };
    });

    return NextResponse.json({
      apps,
      pagination: {
        limit,
        offset,
        total: count || apps.length,
      },
    });
  } catch (err) {
    console.error('Error fetching apps:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
