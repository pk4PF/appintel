
import { getServerClient } from '../src/lib/supabase';
import dotenv from 'dotenv';
import { ingestReviewsForApp } from '../src/services/review-ingestion';
import { generateAndStoreInsights } from '../src/services/review-analysis';
import { calculateOpportunityScore, storeOpportunityScore } from '../src/services/scoring/calculator';

dotenv.config({ path: '.env.local' });

async function processMissingReviews() {
    const supabase = getServerClient();
    const LIMIT = 50; // Process 50 apps at a time

    console.log('🔍 Finding high-potential apps that are missing review data...');


    // Get apps via app_metrics to ensure we have rating counts
    // Target: 100 - 100,000 ratings (Indie sweet spot)
    const { data: metrics, error } = await supabase
        .from('app_metrics')
        .select(`
            rating_count,
            app_id,
            apps!inner (
                id,
                name,
                app_store_id,
                developer_name,
                reviews (id)
            )
        `)
        .gt('rating_count', 100)
        .lt('rating_count', 100000)
        .order('rating_count', { ascending: false })
        .limit(LIMIT * 4); // Fetch more to filter in memory

    if (error) {
        console.error('Error fetching apps:', error);
        return;
    }

    // Filter validation:
    // 1. Must have NO reviews (or very few)
    // 2. Must NOT be Big Tech (simple filter)
    const BIG_TECH = ['Google', 'Facebook', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Uber', 'Airbnb', 'WhatsApp', 'Instagram', 'TikTok'];

    const appsToProcess = metrics
        .map((m: any) => ({
            ...m.apps,
            rating_count: m.rating_count
        }))
        .filter(app => {
            // Check reviews
            const hasReviews = app.reviews && app.reviews.length > 0;
            if (hasReviews) return false;

            // Check Big Tech
            if (app.developer_name && BIG_TECH.some((t: string) => app.developer_name.includes(t))) return false;
            // Check App Name for obvious ones
            if (BIG_TECH.some((t: string) => app.name.includes(t))) return false;

            return true;
        })
        .slice(0, LIMIT);

    console.log(`🚀 Found ${appsToProcess.length} candidate apps (Sweet spot ratings, NO reviews). Starting ingestion...`);

    for (let i = 0; i < appsToProcess.length; i++) {
        const app = appsToProcess[i];

        console.log(`\n[${i + 1}/${appsToProcess.length}] Processing ${app.name} (${app.rating_count} ratings)...`);

        try {
            // 1. Ingest reviews
            const ingestResult = await ingestReviewsForApp(app.id, app.app_store_id, 50);

            if (ingestResult.success > 0) {
                console.log(`   ✅ Ingested ${ingestResult.success} reviews.`);

                // 2. Generate insights
                await generateAndStoreInsights(app.id);
                console.log(`   ✅ Generated insights.`);

                // 3. Calculate & Store Score
                const scoreResult = await calculateOpportunityScore(app.id, '30d');
                await storeOpportunityScore(scoreResult);
                console.log(`   ✅ New Opportunity Score: ${scoreResult.score.toFixed(1)} (${scoreResult.interpretation.level})`);
            } else {
                console.log(`   ⚠️ No reviews found for valid ingestion.`);
            }

        } catch (e: any) {
            console.error(`   ❌ Failed to process ${app.name}:`, e.message);
        }

        // Delay to be nice to APIs
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n✨ Batch complete!');
}

processMissingReviews().catch(console.error);
