import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

// Type for search results
interface SearchResultApp {
  id: string;
  app_store_id: string;
  name: string;
  icon_url: string | null;
  short_description: string | null;
  developer_name: string | null;
  release_date: string | null;
  pricing_model: string;
  categories: { id: string; name: string; slug: string } | null;
  app_metrics: Array<{
    rating: number | null;
    rating_count: number | null;
    downloads_estimate: number | null;
  }>;
  opportunity_scores: Array<{
    score: number;
    time_window: string;
  }>;
}

/**
 * GET /api/search
 * Search apps by name, description, or keywords
 * 
 * Query params:
 *   - q: search query (required)
 *   - limit: number (default 20, max 50)
 *   - category: filter by category slug
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const query = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const categorySlug = searchParams.get('category');

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  const supabase = getServerClient();

  try {
    // Prepare search query for full-text search
    // Convert "habit tracker" to "habit & tracker" for AND search
    const searchTerms = query
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 1)
      .map((t) => t.replace(/[^a-zA-Z0-9]/g, ''))
      .join(' & ');

    // Get category ID if filtering
    let categoryId: string | null = null;
    if (categorySlug) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      categoryId = (category as { id: string } | null)?.id || null;
    }

    // Search using PostgreSQL full-text search
    let searchQuery = supabase
      .from('apps')
      .select(`
        id,
        app_store_id,
        name,
        icon_url,
        short_description,
        developer_name,
        release_date,
        pricing_model,
        categories!apps_category_id_fkey (id, name, slug),
        app_metrics (rating, rating_count, downloads_estimate),
        opportunity_scores (score, time_window)
      `)
      .textSearch('name', searchTerms, { type: 'websearch' })
      .limit(limit);

    if (categoryId) {
      searchQuery = searchQuery.eq('category_id', categoryId);
    }

    const { data: fullTextResultsData } = await searchQuery;
    const fullTextResults = fullTextResultsData as unknown as SearchResultApp[] | null;

    // Also do a simple ILIKE search as fallback for partial matches
    let ilikeQuery = supabase
      .from('apps')
      .select(`
        id,
        app_store_id,
        name,
        icon_url,
        short_description,
        developer_name,
        release_date,
        pricing_model,
        categories!apps_category_id_fkey (id, name, slug),
        app_metrics (rating, rating_count, downloads_estimate),
        opportunity_scores (score, time_window)
      `)
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (categoryId) {
      ilikeQuery = ilikeQuery.eq('category_id', categoryId);
    }

    const { data: ilikeResultsData } = await ilikeQuery;
    const ilikeResults = ilikeResultsData as unknown as SearchResultApp[] | null;

    // Combine and deduplicate results
    const allResults = [...(fullTextResults || []), ...(ilikeResults || [])];
    const uniqueResults = Array.from(
      new Map(allResults.map((app) => [app.id, app])).values()
    );

    // Transform results
    const results = uniqueResults.slice(0, limit).map((app) => {
      const metrics = Array.isArray(app.app_metrics) 
        ? app.app_metrics[0] 
        : null;
      
      const scores = Array.isArray(app.opportunity_scores)
        ? app.opportunity_scores.find((s) => s.time_window === '30d') || app.opportunity_scores[0]
        : null;

      return {
        id: app.id,
        appStoreId: app.app_store_id,
        name: app.name,
        icon: app.icon_url,
        description: app.short_description,
        developer: app.developer_name,
        releaseDate: app.release_date,
        pricingModel: app.pricing_model,
        category: app.categories,
        metrics: metrics ? {
          rating: metrics.rating,
          ratingCount: metrics.rating_count,
          downloads: metrics.downloads_estimate,
        } : null,
        opportunityScore: scores?.score || null,
      };
    });

    // Sort by opportunity score (highest first)
    results.sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));

    return NextResponse.json({
      query,
      results,
      count: results.length,
    });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
