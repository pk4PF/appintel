import { getServerClient } from '../src/lib/supabase';
import dotenv from 'dotenv';
import { ingestReviewsForApp } from '../src/services/review-ingestion';
import { generateAndStoreInsights } from '../src/services/review-analysis';
import { calculateOpportunityScore, storeOpportunityScore } from '../src/services/scoring/calculator';

dotenv.config({ path: '.env.local' });

async function fastTrack() {
    const supabase = getServerClient();

    // 1. Get apps ordered by rating count (proxy for popularity)
    // This ensures we hit the "big" apps first
    const { data: apps, error } = await supabase
        .from('apps')
        .select(`
        id, 
        app_store_id, 
        name,
        app_metrics(rating_count)
    `);

    if (error || !apps) {
        console.error('Error fetching apps:', error);
        return;
    }

    // Sort by rating count descended
    const sortedApps = apps.sort((a, b) => {
        const countA = (a.app_metrics as any)?.[0]?.rating_count || 0;
        const countB = (b.app_metrics as any)?.[0]?.rating_count || 0;
        return countB - countA;
    }).slice(0, 100); // Take top 100 after sorting

    console.log(`⚡ FAST TRACK: Processing top 100 POPULAR apps...`);

    for (let i = 0; i < sortedApps.length; i++) {
        const app = sortedApps[i];
        console.log(`\n[${i + 1}/${sortedApps.length}] Processing ${app.name} (${app.app_store_id})...`);

        try {
            // 2. Ingest reviews (100 per app, 11 countries)
            const ingestResult = await ingestReviewsForApp(app.id, app.app_store_id, 100);
            console.log(`   ✅ Ingested ${ingestResult.success} reviews.`);

            // 3. Generate insights
            if (ingestResult.success > 0) {
                await generateAndStoreInsights(app.id);
                console.log(`   ✅ Generated insights.`);
            }

            // 4. Calculate definitive score
            const scoreResult = await calculateOpportunityScore(app.id, '30d');
            await storeOpportunityScore(scoreResult);
            console.log(`   ✅ Re-calculated Score: ${scoreResult.score.toFixed(1)}`);

        } catch (e: any) {
            console.error(`   ❌ Failed to process ${app.name}:`, e.message);
        }
    }

    console.log('\n✨ Fast track complete. Dashboard page 1 should be fully populated!');
}

fastTrack().catch(console.error);
