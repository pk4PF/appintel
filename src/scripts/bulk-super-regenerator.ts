import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getServerClient } from '../lib/supabase';
import { generateAndStoreInsights } from '../services/review-analysis';

async function main() {
    const supabase = getServerClient();
    console.log('🚀 INITIALIZING 32-PAGE SUPER REGENERATION...');

    // Estimate: 32 pages at ~15 apps per page = ~480 apps
    // We'll fetch 500 apps with the highest opportunity scores
    const { data: apps, error } = await supabase
        .from('apps')
        .select(`
            id,
            name,
            opportunity_scores!inner(score)
        `)
        .order('score', { foreignTable: 'opportunity_scores', ascending: false })
        .limit(500);

    if (error) {
        console.error('Error fetching apps:', error);
        return;
    }

    console.log(`📡 Targeting ${apps.length} high-potential "Gaps" (approx 32 pages).`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < apps.length; i++) {
        const app = apps[i];
        const progress = (((i + 1) / apps.length) * 100).toFixed(1);

        try {
            await generateAndStoreInsights(app.id);
            successCount++;
            console.log(`[${progress}%] ✅ ${app.name}`);
        } catch (e) {
            failCount++;
            console.error(`[${progress}%] ❌ ${app.name}`);
        }

        // Add a tiny delay to avoid hitting rate limits too hard if running synchronously
        if (i % 5 === 0) {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    console.log('\n✨ BULK REGENERATION COMPLETE');
    console.log(`📈 Success: ${successCount}`);
    console.log(`📉 Failed: ${failCount}`);
    process.exit(0);
}

main();
