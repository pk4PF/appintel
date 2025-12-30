import { getServerClient } from '@/lib/supabase';
import { ingestReviewsForApp } from '@/services/review-ingestion';
import { generateAndStoreInsights } from '@/services/review-analysis';
import ReviewsAnalysis from './ReviewsAnalysis';

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

interface AsyncReviewsProps {
    appId: string;
    appStoreId: string;
    appName: string;
    isAuthenticated: boolean;
    isPremium: boolean;
}

export default async function AsyncReviews({
    appId,
    appStoreId,
    appName,
    isAuthenticated,
    isPremium,
}: AsyncReviewsProps) {
    const supabase = getServerClient();

    // Fetch reviews
    let { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('app_id', appId)
        .order('review_date', { ascending: false })
        .limit(200);

    // ON-DEMAND INGESTION
    if (!reviewsData || reviewsData.length === 0) {
        console.log(`📥 On-demand ingestion for ${appName}`);
        await ingestReviewsForApp(appId, appStoreId, 50);
        const { data: freshReviews } = await supabase
            .from('reviews')
            .select('*')
            .eq('app_id', appId)
            .order('review_date', { ascending: false })
            .limit(200);
        reviewsData = freshReviews;
    }

    const reviews = (reviewsData || []) as Review[];

    // Fetch review insights
    let { data: insightsData } = await supabase
        .from('review_insights')
        .select('*')
        .eq('app_id', appId);

    // ON-DEMAND INSIGHT GENERATION
    if (isPremium && (!insightsData || insightsData.length === 0) && reviews.length > 0) {
        console.log(`💡 On-demand insight generation for ${appName}`);
        await generateAndStoreInsights(appId);

        // Refresh insights data
        const { data: freshInsights } = await supabase
            .from('review_insights')
            .select('*')
            .eq('app_id', appId);
        insightsData = freshInsights;
    }

    const insights = (insightsData || []) as ReviewInsight[];

    return (
        <ReviewsAnalysis
            reviews={reviews}
            insights={insights}
            appName={appName}
            isAuthenticated={isAuthenticated}
            isPremium={isPremium}
        />
    );
}
