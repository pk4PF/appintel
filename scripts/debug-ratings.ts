
import { getServerClient } from '../src/lib/supabase';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkHighRatingApps() {
    const supabase = getServerClient();

    // Check top 10 apps by rating_count
    const { data: topApps, error } = await supabase
        .from('apps')
        .select('name, app_metrics(rating_count), reviews(id)')
        .not('app_metrics', 'is', null)
        .order('rating_count', { ascending: false, foreignTable: 'app_metrics' })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- Top 10 Apps by Rating Count ---');
    topApps?.forEach(app => {
        const ratingCount = Array.isArray(app.app_metrics)
            ? app.app_metrics[0]?.rating_count
            : (app.app_metrics as any)?.rating_count;

        const reviewCount = Array.isArray(app.reviews) ? app.reviews.length : 0;

        console.log(`App: ${app.name}, Ratings: ${ratingCount}, Ingested Reviews: ${reviewCount}`);
    });


    // Check 10 apps with rating_count > 1000 but NO reviews
    console.log('\n--- Sample Apps > 1000 Ratings but NO Reviews ---');
    // We can't easily do complex cross-table filtering in one simple call without custom query, 
    // but let's try a hybrid approach: fetch high validated apps and check if reviews are empty

    // Note: PostgREST doesn't support filtering on foreign table fields easily in the top-level where clause without specific config.
    // So we fetch apps with metrics, then filter in memory for this diagnostic.

    const { data: popularApps } = await supabase
        .from('app_metrics')
        .select('rating_count, app_id, apps(name, reviews(id))')
        .gt('rating_count', 1000)
        .limit(20);

    const missingReviews = popularApps?.filter((item: any) => {
        const hasReviews = item.apps?.reviews && item.apps.reviews.length > 0;
        return !hasReviews;
    });

    if (missingReviews && missingReviews.length > 0) {
        console.log(`Found ${missingReviews.length} apps in this sample batch.`);
        missingReviews.slice(0, 5).forEach((item: any) => {
            console.log(`Candidate: ${item.apps?.name}, Ratings: ${item.rating_count}`);
        });
    } else {
        console.log('No apps found in this sample batch with > 1000 ratings and 0 reviews.');
    }
}

checkHighRatingApps();
