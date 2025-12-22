import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Import the analysis function dynamically since it uses the lib
import { generateAndStoreInsights } from '../services/review-analysis';

async function main() {
    console.log('🔄 Regenerating insights with improved niche versions...\n');

    // Get apps that have reviews
    const { data: apps, error } = await supabase
        .from('apps')
        .select('id, name')
        .order('name');

    if (error) {
        console.error('Error fetching apps:', error);
        process.exit(1);
    }

    console.log(`Found ${apps?.length || 0} apps to process\n`);

    let success = 0;
    let failed = 0;

    for (const app of apps || []) {
        try {
            // Delete existing insights for this app
            await supabase.from('review_insights').delete().eq('app_id', app.id);

            // Generate new insights with improved logic
            await generateAndStoreInsights(app.id);

            console.log(`✓ ${app.name}`);
            success++;
        } catch (e) {
            console.log(`✗ ${app.name}: ${(e as Error).message}`);
            failed++;
        }
    }

    console.log(`\n✅ Done! Success: ${success}, Failed: ${failed}`);
}

main().catch(console.error);
