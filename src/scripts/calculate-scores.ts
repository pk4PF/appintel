/**
 * Script to calculate opportunity scores for all apps
 * 
 * Usage:
 *   npx tsx src/scripts/calculate-scores.ts
 *   npx tsx src/scripts/calculate-scores.ts --window 7d
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { calculateAllScores, getTopOpportunities } from '@/services/scoring/calculator';

async function main() {
  console.log('📊 Starting opportunity score calculation...\n');

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Parse command line args for time window
  const args = process.argv.slice(2);
  let timeWindow: '7d' | '14d' | '30d' = '30d';
  
  const windowArg = args.find((a) => a.startsWith('--window'));
  if (windowArg) {
    const value = args[args.indexOf(windowArg) + 1] as '7d' | '14d' | '30d';
    if (['7d', '14d', '30d'].includes(value)) {
      timeWindow = value;
    }
  }

  try {
    // Calculate scores for all apps
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`CALCULATING SCORES (${timeWindow} window)`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    const results = await calculateAllScores(timeWindow);

    // Show top opportunities
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('TOP 20 OPPORTUNITIES');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const topOpportunities = await getTopOpportunities(20, timeWindow);

    for (const opp of topOpportunities) {
      if (!opp.app || opp.score === null || opp.score === undefined) continue;
      const bar = generateBar(opp.score);
      const category = opp.app?.categories?.name || 'Unknown';
      console.log(
        `${opp.rank.toString().padStart(2)}. ${opp.app?.name?.substring(0, 30).padEnd(30)} ${bar} ${(opp.score || 0).toFixed(1)} [${category}]`
      );
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SCORE DISTRIBUTION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Show score distribution
    const allOpportunities = await getTopOpportunities(500, timeWindow);
    const distribution = {
      excellent: allOpportunities.filter((o) => o.score >= 75).length,
      good: allOpportunities.filter((o) => o.score >= 60 && o.score < 75).length,
      moderate: allOpportunities.filter((o) => o.score >= 45 && o.score < 60).length,
      low: allOpportunities.filter((o) => o.score >= 30 && o.score < 45).length,
      poor: allOpportunities.filter((o) => o.score < 30).length,
    };

    console.log(`  🌟 Excellent (75+):  ${distribution.excellent}`);
    console.log(`  ✨ Good (60-74):     ${distribution.good}`);
    console.log(`  📊 Moderate (45-59): ${distribution.moderate}`);
    console.log(`  📉 Low (30-44):      ${distribution.low}`);
    console.log(`  ⚠️  Poor (<30):       ${distribution.poor}`);

    console.log('\n🎉 Scoring complete!');
    console.log(`\nProcessed ${results.success} apps, ${results.failed} failed`);
    console.log('\nThe API is now ready to serve opportunity rankings.');
    
  } catch (error) {
    console.error('\n❌ Scoring failed:', error);
    process.exit(1);
  }
}

function generateBar(score: number): string {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

main();

