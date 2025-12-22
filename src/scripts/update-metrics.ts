/**
 * Script to update app metrics from reviews
 * 
 * Usage:
 *   npx tsx src/scripts/update-metrics.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { updateAllMetrics } from '@/services/metrics-processor';

async function main() {
  console.log('📊 Starting metrics update...\n');
  
  const result = await updateAllMetrics();
  
  console.log(`\n✅ Complete: ${result.success} apps updated, ${result.failed} failed`);
}

main().catch(console.error);






