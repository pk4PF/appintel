/**
 * Script to fetch reviews for apps in the database
 * 
 * Usage:
 *   npx tsx src/scripts/fetch-reviews.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { ingestReviewsForTopApps } from '@/services/review-ingestion';
import { updateAllMetrics } from '@/services/metrics-processor';

async function main() {
  console.log('📝 Starting review ingestion...\n');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }

  try {
    // Fetch reviews for top 100 apps - Now using FREE Apple RSS
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('STEP 1: Fetching reviews (via FREE Apple RSS)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const reviewResults = await ingestReviewsForTopApps(100, 50);

    console.log(`\nReviews fetched: ${reviewResults.totalReviews}`);
    console.log(`Apps processed: ${reviewResults.appsProcessed}`);

    // Update metrics based on new reviews
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('STEP 2: Updating metrics');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await updateAllMetrics();

    console.log('\n🎉 Review ingestion complete!');
    console.log('\nNext step:');
    console.log('  Run: npx tsx src/scripts/calculate-scores.ts');

  } catch (error) {
    console.error('\n❌ Review ingestion failed:', error);
    process.exit(1);
  }
}

main();

