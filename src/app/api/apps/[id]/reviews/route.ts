import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import type { Review, ReviewInsight } from '@/types/database';

/**
 * GET /api/apps/[id]/reviews
 * Get reviews for an app with optional filtering
 * 
 * Query params:
 *   - limit: number (default 50)
 *   - offset: number (default 0)
 *   - minRating: 1-5
 *   - maxRating: 1-5
 *   - sort: date | rating | helpful
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  const minRating = parseInt(searchParams.get('minRating') || '1');
  const maxRating = parseInt(searchParams.get('maxRating') || '5');
  const sort = searchParams.get('sort') || 'date';

  const supabase = getServerClient();

  try {
    // Build query
    let query = supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('app_id', id)
      .gte('rating', minRating)
      .lte('rating', maxRating);

    // Apply sorting
    if (sort === 'date') {
      query = query.order('review_date', { ascending: false });
    } else if (sort === 'rating') {
      query = query.order('rating', { ascending: false });
    } else if (sort === 'helpful') {
      query = query.order('helpful_count', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    const reviews = data as Review[] | null;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get review insights for this app
    const { data: insightsData } = await supabase
      .from('review_insights')
      .select('*')
      .eq('app_id', id);
    const insights = insightsData as ReviewInsight[] | null;

    // Calculate rating distribution
    const { data: allReviewsData } = await supabase
      .from('reviews')
      .select('rating')
      .eq('app_id', id);
    const allReviews = allReviewsData as { rating: number }[] | null;

    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const review of allReviews || []) {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating]++;
      }
    }

    const totalReviews = allReviews?.length || 0;
    const avgRating = totalReviews > 0
      ? (allReviews || []).reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Transform reviews
    const transformedReviews = (reviews || []).map((review) => ({
      id: review.id,
      author: review.author,
      title: review.title,
      text: review.review_text,
      rating: review.rating,
      date: review.review_date,
      version: review.version,
      country: review.country,
      helpfulCount: review.helpful_count,
    }));

    // Organize insights
    const organizedInsights = {
      complaints: (insights || []).filter((i) => i.insight_type === 'complaint'),
      praises: (insights || []).filter((i) => i.insight_type === 'praise'),
      featureRequests: (insights || []).filter((i) => i.insight_type === 'feature_request'),
    };

    return NextResponse.json({
      reviews: transformedReviews,
      insights: organizedInsights,
      stats: {
        total: count || totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        distribution: ratingDistribution,
      },
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
