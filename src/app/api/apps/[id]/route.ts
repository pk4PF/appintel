import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import type { Review, SimilarApp } from '@/types/database';

// Types for the joined query result
interface AppMetric {
  date: string;
  rating: number | null;
  rating_count: number | null;
  review_count: number | null;
  downloads_estimate: number | null;
  revenue_estimate: number | null;
  rank_category: number | null;
}

interface OpportunityScoreRow {
  score: number;
  momentum: number | null;
  demand_signal: number | null;
  user_satisfaction: number | null;
  monetization_potential: number | null;
  competitive_density: number | null;
  time_window: string;
  calculated_at: string;
}

interface ReviewInsightRow {
  insight_type: string;
  summary: string;
  evidence: string[] | null;
  frequency: number;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

interface AppWithRelations {
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
  currency: string;
  pricing_model: string;
  minimum_os_version: string | null;
  content_rating: string | null;
  url: string | null;
  categories: CategoryRow | null;
  app_metrics: AppMetric[];
  opportunity_scores: OpportunityScoreRow[];
  review_insights: ReviewInsightRow[];
}

interface SimilarAppResult {
  similarity_score: number | null;
  positioning_diff: string | null;
  similar_app: {
    id: string;
    name: string;
    icon_url: string | null;
    pricing_model: string;
  } | null;
}

/**
 * GET /api/apps/[id]
 * Get detailed information for a single app
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const timeWindow = searchParams.get('window') || '30d';

  const supabase = getServerClient();

  try {
    // Fetch app with all related data
    const { data, error } = await supabase
      .from('apps')
      .select(`
        *,
        categories!apps_category_id_fkey (id, name, slug),
        app_metrics (
          date,
          rating,
          rating_count,
          review_count,
          downloads_estimate,
          revenue_estimate,
          rank_category
        ),
        opportunity_scores (
          score,
          momentum,
          demand_signal,
          user_satisfaction,
          monetization_potential,
          competitive_density,
          time_window,
          calculated_at
        ),
        review_insights (
          insight_type,
          summary,
          evidence,
          frequency
        )
      `)
      .eq('id', id)
      .single();

    const app = data as unknown as AppWithRelations | null;

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'App not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Get recent reviews separately (limited)
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .eq('app_id', id)
      .order('review_date', { ascending: false })
      .limit(20);
    const reviews = reviewsData as unknown as Review[] | null;

    // Get similar apps
    const { data: similarAppsData } = await supabase
      .from('similar_apps')
      .select(`
        similarity_score,
        positioning_diff,
        similar_app:apps!similar_apps_similar_app_id_fkey (
          id,
          name,
          icon_url,
          pricing_model
        )
      `)
      .eq('app_id', id)
      .order('similarity_score', { ascending: false })
      .limit(5);
    const similarApps = similarAppsData as unknown as SimilarAppResult[] | null;

    // Get metrics history (last 30 days)
    const metricsHistory = (app.app_metrics || [])
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    // Get the relevant opportunity score
    const scores = app.opportunity_scores || [];
    const relevantScore = scores.find((s) => s.time_window === timeWindow) || scores[0];

    // Organize review insights
    const insights = app.review_insights || [];
    const organizedInsights = {
      complaints: insights.filter((i) => i.insight_type === 'complaint'),
      praises: insights.filter((i) => i.insight_type === 'praise'),
      featureRequests: insights.filter((i) => i.insight_type === 'feature_request'),
      missedOpportunities: insights.filter((i) => i.insight_type === 'missed_opportunity'),
    };

    // Transform response
    const response = {
      id: app.id,
      appStoreId: app.app_store_id,
      name: app.name,
      icon: app.icon_url,
      description: app.description,
      shortDescription: app.short_description,
      developer: {
        name: app.developer_name,
        id: app.developer_id,
      },
      category: app.categories,
      releaseDate: app.release_date,
      lastUpdated: app.last_updated,
      price: app.price,
      currency: app.currency,
      pricingModel: app.pricing_model,
      minimumOsVersion: app.minimum_os_version,
      contentRating: app.content_rating,
      url: app.url,
      
      // Current metrics
      metrics: {
        rating: metricsHistory[metricsHistory.length - 1]?.rating,
        ratingCount: metricsHistory[metricsHistory.length - 1]?.rating_count,
        downloads: metricsHistory[metricsHistory.length - 1]?.downloads_estimate,
        revenue: metricsHistory[metricsHistory.length - 1]?.revenue_estimate,
        categoryRank: metricsHistory[metricsHistory.length - 1]?.rank_category,
      },
      
      // Metrics history for charts
      metricsHistory: metricsHistory.map((m) => ({
        date: m.date,
        rating: m.rating,
        ratingCount: m.rating_count,
        downloads: m.downloads_estimate,
      })),
      
      // Opportunity score
      opportunityScore: relevantScore ? {
        score: relevantScore.score,
        components: {
          momentum: relevantScore.momentum,
          demand: relevantScore.demand_signal,
          satisfaction: relevantScore.user_satisfaction,
          monetization: relevantScore.monetization_potential,
          competition: relevantScore.competitive_density,
        },
        timeWindow: relevantScore.time_window,
        calculatedAt: relevantScore.calculated_at,
      } : null,
      
      // User voice (review insights)
      userVoice: organizedInsights,
      
      // Recent reviews
      recentReviews: (reviews || []).map((r) => ({
        id: r.id,
        author: r.author,
        title: r.title,
        text: r.review_text,
        rating: r.rating,
        date: r.review_date,
        version: r.version,
      })),
      
      // Similar apps
      similarApps: (similarApps || []).map((s) => ({
        app: s.similar_app,
        similarity: s.similarity_score,
        positioningDiff: s.positioning_diff,
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Error fetching app:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
