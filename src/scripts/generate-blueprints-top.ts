import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getServerClient } from '../lib/supabase';
import { generateAndStoreInsights } from '../services/review-analysis';

async function main() {
    const supabase = getServerClient();
    console.log('🚀 Fast-tracking blueprints for top apps...');

    // Get top 20 apps by score or rating count
    const { data: apps, error } = await supabase
        .from('apps')
        .select(`
            id,
            name,
            opportunity_scores!inner(score)
        `)
        .order('score', { foreignTable: 'opportunity_scores', ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching apps:', error);
        return;
    }

    console.log(`Found ${apps.length} high-potential apps to blueprint.`);

    for (const app of apps) {
        try {
            await generateAndStoreInsights(app.id);
            console.log(`✅ Blueprinted: ${app.name}`);
        } catch (e) {
            console.error(`❌ Failed: ${app.name}`, e);
        }
    }

    console.log('✨ Top apps now have full business blueprints.');
    process.exit(0);
}

main();
