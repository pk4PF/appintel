import { getServerClient } from '../src/lib/supabase';
import { generateAndStoreInsights } from '../src/services/review-analysis';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function bulkGenerateAll() {
    const supabase = getServerClient();

    console.log('🔍 Finding apps WITHOUT spinoff ideas...\n');

    // Get all app IDs with insights
    const appIdsWithInsights = new Set<string>();
    let insightOffset = 0;
    while (true) {
        const { data } = await supabase
            .from('review_insights')
            .select('app_id')
            .range(insightOffset, insightOffset + 999);
        if (!data || data.length === 0) break;
        data.forEach(r => appIdsWithInsights.add(r.app_id));
        insightOffset += 1000;
        if (data.length < 1000) break;
    }
    console.log(`Found ${appIdsWithInsights.size} apps with existing insights`);

    // Get ALL apps with pagination
    const allApps: Array<{ id: string, name: string }> = [];
    let appOffset = 0;
    while (true) {
        const { data } = await supabase
            .from('apps')
            .select('id, name')
            .order('name')
            .range(appOffset, appOffset + 999);
        if (!data || data.length === 0) break;
        allApps.push(...data);
        appOffset += 1000;
        if (data.length < 1000) break;
    }
    console.log(`Found ${allApps.length} total apps`);

    // Filter to apps without insights
    const appsToProcess = allApps.filter(app => !appIdsWithInsights.has(app.id));
    console.log(`🚀 Processing ${appsToProcess.length} apps without spinoff ideas...\n`);

    let processed = 0;
    let failed = 0;

    for (let i = 0; i < appsToProcess.length; i++) {
        const app = appsToProcess[i];
        try {
            if (i % 100 === 0) {
                console.log(`[${i}/${appsToProcess.length}] Processing...`);
            }
            await generateAndStoreInsights(app.id);
            processed++;
        } catch (e: any) {
            failed++;
        }
        await new Promise(r => setTimeout(r, 20));
    }

    console.log(`\n✨ Done! Processed: ${processed}, Failed: ${failed}`);
}

bulkGenerateAll().catch(console.error);
