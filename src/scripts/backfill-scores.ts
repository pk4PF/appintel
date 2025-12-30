
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { calculateOpportunityScore } from '../services/opportunity-scoring';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillScores() {
    console.log('🚀 Starting Opportunity Score Backfill...');

    // 1. Fetch all apps with their latest metrics
    // We need to join with app_metrics.
    // We'll take the most recent metric for each app.

    const { data: apps, error } = await supabase
        .from('apps')
        .select(`
      *,
      app_metrics (
        *
      )
    `);

    if (error) {
        console.error('Error fetching apps:', error);
        return;
    }

    console.log(`Found ${apps.length} apps to process.`);

    let successCount = 0;
    let failCount = 0;

    for (const app of apps) {
        try {
            // Get latest metric
            const metrics = app.app_metrics?.sort((a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0];

            if (!metrics) {
                console.log(`⚠️ Skipping ${app.name} (No metrics found)`);
                continue;
            }

            // Calculate Score
            const scores = calculateOpportunityScore(
                app as any, // Cast because shape from DB matches Insert shape closely enough for this
                metrics as any
            );

            // Insert Score (using upsert to update existing)
            const { error: insertError } = await supabase
                .from('opportunity_scores')
                .upsert({
                    app_id: app.id,
                    ...scores,
                    calculated_at: new Date().toISOString()
                }, { onConflict: 'app_id,time_window' });

            if (insertError) {
                console.error(`Error saving score for ${app.name}:`, insertError);
                failCount++;
            } else {
                console.log(`✓ Scored ${app.name}: ${scores.score}`);
                successCount++;
            }

        } catch (err) {
            console.error(`Error processing ${app.name}:`, err);
            failCount++;
        }
    }

    console.log(`\n✅ Backfill Complete: ${successCount} updated, ${failCount} failed.`);
}

backfillScores();
