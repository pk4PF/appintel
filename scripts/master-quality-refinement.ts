import { getServerClient } from '../src/lib/supabase';
import { ingestReviewsForApp } from '../src/services/review-ingestion';
import { generateAndStoreInsights } from '../src/services/review-analysis';
import { cleanAppDescription } from '../src/services/ai-analysis';
import { calculateOpportunityScore, storeOpportunityScore } from '../src/services/scoring/calculator';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

/**
 * MASTER QUALITY REFINEMENT SCRIPT
 * Focuses on the top indie opportunities and makes them "ship-ready"
 */
async function refineQuality() {
    const supabase = getServerClient();

    console.log('🚀 Starting Master Quality Refinement...\n');

    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY is missing. High-quality analysis will be skipped.');
        // We'll continue anyway to at least fetch reviews
    }

    // 1. Get categories we care about
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug');

    if (!categories) return;

    // 2. For each category, get the top 20 indie-friendly apps
    // (Indie-friendly = 100-10K ratings, not a big corp)
    const BIG_COMPANIES = ['google', 'microsoft', 'apple', 'meta', 'facebook', 'amazon', 'adobe', 'netflix', 'spotify'];

    for (const cat of categories) {
        console.log(`\n📂 Processing Category: ${cat.name} (${cat.slug})`);

        const { data: apps } = await supabase
            .from('apps')
            .select(`
                id, 
                app_store_id, 
                name, 
                description,
                developer_name,
                app_metrics(rating_count)
            `)
            .eq('category_id', cat.id)
            .limit(100);

        const indieApps = (apps || []).filter(app => {
            const ratingCount = app.app_metrics?.[0]?.rating_count || 0;
            const devName = (app.developer_name || '').toLowerCase();
            const isBig = BIG_COMPANIES.some(c => devName.includes(c));
            return ratingCount >= 50 && ratingCount <= 20000 && !isBig;
        }).slice(0, 5); // Just do top 5 per category to start for speed & cost

        console.log(`   Found ${indieApps.length} high-potential indie apps.`);

        for (let i = 0; i < indieApps.length; i++) {
            const app = indieApps[i];
            console.log(`   [${i + 1}/${indieApps.length}] ${app.name} (${app.app_store_id})`);

            try {
                // A. INGEST REVIEWS (If we don't have enough)
                const { count: reviewCount } = await supabase
                    .from('reviews')
                    .select('*', { count: 'exact', head: true })
                    .eq('app_id', app.id);

                if ((reviewCount || 0) < 10) {
                    console.log('      📝 Fetching fresh reviews...');
                    await ingestReviewsForApp(app.id, app.app_store_id, 50);
                } else {
                    console.log(`      ✅ Already have ${reviewCount} reviews.`);
                }

                // B. CLEAN DESCRIPTION (If LLM available)
                if (process.env.OPENAI_API_KEY) {
                    console.log('      🧹 Cleaning description with AI...');
                    const cleaned = await cleanAppDescription(app.name, app.description || '');
                    if (cleaned) {
                        await supabase
                            .from('apps')
                            .update({
                                short_description: cleaned.summary,
                                // We could add a 'target_audience' column later
                            })
                            .eq('id', app.id);
                    }
                }

                // C. GENERATE INSIGHTS (The Spinoff Goldmine)
                console.log('      🧠 Generating AI spinoffs...');
                await generateAndStoreInsights(app.id);

                // D. RECALCULATE SCORE (Now with fresh review data!)
                console.log('      📊 Recalculating opportunity score...');
                const scoreResult = await calculateOpportunityScore(app.id, '30d');
                await storeOpportunityScore(scoreResult);
                console.log(`      ✅ Final Score: ${scoreResult.score.toFixed(1)} (${scoreResult.interpretation.level})`);

            } catch (err: any) {
                console.error(`      ❌ Failed: ${err.message}`);
            }

            // Small delay
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log('\n✨ Quality Refinement Cycle Complete!');
}

refineQuality().catch(console.error);
