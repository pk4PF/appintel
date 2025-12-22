import { getServerClient } from '../src/lib/supabase';
import dotenv from 'dotenv';
import { ingestReviewsForApp } from '../src/services/review-ingestion';
import { generateAndStoreInsights } from '../src/services/review-analysis';
import { calculateOpportunityScore, storeOpportunityScore } from '../src/services/scoring/calculator';

dotenv.config({ path: '.env.local' });

async function bulkProcess() {
    const supabase = getServerClient();

    // 1. Get all apps ordered by their 30d opportunity score (high to low)
    // This ensures the first page of the dashboard is populated first
    const { data: scoreItems, error } = await supabase
        .from('opportunity_scores')
        .select('app_id, score, apps!inner(id, app_store_id, name)')
        .eq('time_window', '30d')
        .order('score', { ascending: false });

    if (error || !scoreItems) {
        console.error('Error fetching apps:', error);
        return;
    }

    const apps = scoreItems.map(item => item.apps);
    console.log(`🚀 Starting prioritized bulk processing for ${apps.length} apps (Window: 30d)...`);

    for (let i = 0; i < apps.length; i++) {
        const app = apps[i] as any;
        if (!app) continue;
        console.log(`\n[${i + 1}/${apps.length}] Processing ${app.name} (${app.app_store_id}) [Score: ${scoreItems[i].score}]...`);

        try {
            // 2. Ingest reviews (increase limit to 100 for better data)
            const ingestResult = await ingestReviewsForApp(app.id, app.app_store_id, 100);
            console.log(`   ✅ Ingested ${ingestResult.success} reviews.`);

            // 3. Generate insights (if we have reviews)
            if (ingestResult.success > 0) {
                await generateAndStoreInsights(app.id);
                console.log(`   ✅ Generated insights.`);
            } else {
                // Double check if reviews exist but were just not fetched just now
                const { count: existingReviews } = await supabase
                    .from('reviews')
                    .select('*', { count: 'exact', head: true })
                    .eq('app_id', app.id);

                if (existingReviews && existingReviews > 0) {
                    await generateAndStoreInsights(app.id);
                    console.log(`   ✅ Generated insights from ${existingReviews} existing reviews.`);
                } else {
                    console.log(`   ⚠️ No reviews found, skipping insights.`);
                }
            }

            // 4. RECALCULATE SCORE (Now with review data!)
            const scoreResult = await calculateOpportunityScore(app.id, '30d');
            await storeOpportunityScore(scoreResult);
            console.log(`   ✅ Re-calculated Score: ${scoreResult.score.toFixed(1)} (${scoreResult.interpretation.level})`);

        } catch (e: any) {
            console.error(`   ❌ Failed to process ${app.name}:`, e.message);
        }

        // Tiny delay to avoid hitting Apple RSS too hard
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n✨ Bulk processing complete!');
}

bulkProcess().catch(console.error);
