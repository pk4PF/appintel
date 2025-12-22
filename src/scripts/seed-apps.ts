/**
 * Seed script to populate the database with initial app data
 * 
 * Usage:
 *   npx tsx src/scripts/seed-apps.ts
 * 
 * Before running:
 *   1. Set up your .env.local with Supabase and Apify credentials
 *   2. Run the SQL migration in Supabase
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { ingestFromAllCategories, ingestAppsBySearch, getAppCountsByCategory } from '@/services/app-ingestion';

// Search terms focused on emerging app categories and niches
// Great opportunities for solo founders and indie hackers
const EMERGING_APP_SEARCHES = [
  // AI-powered apps (hot trend)
  'ai assistant app',
  'ai photo editor',
  'ai writing app',
  'chatgpt app',
  
  // Health & Wellness (evergreen + growing)
  'habit tracker app',
  'mood tracker app', 
  'sleep app',
  'fasting tracker',
  'water reminder app',
  'mental health app',
  'breathing exercise app',
  
  // Productivity (high engagement)
  'focus timer app',
  'pomodoro app',
  'task manager app',
  'note taking app',
  'daily planner app',
  'journal app',
  
  // Finance (high monetization)
  'budget tracker app',
  'expense tracker app',
  'savings app',
  'investment app',
  
  // Lifestyle & Niche
  'meditation app',
  'workout app',
  'recipe app',
  'reading tracker',
  'language learning app',
  
  // Emerging trends
  'screen time app',
  'dopamine detox app',
  'self care app',
  'gratitude app',
  'affirmation app',
];

async function main() {
  console.log('🌱 Starting app seeding process...\n');
  console.log('This will fetch apps from Apify and store them in Supabase.\n');

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!process.env.APIFY_API_TOKEN) {
    console.error('❌ Missing APIFY_API_TOKEN');
    process.exit(1);
  }

  console.log('✓ Environment variables loaded\n');

  try {
    // Ingest emerging apps by search (focused on opportunities for indie hackers)
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Searching for emerging iOS apps in hot niches');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    let totalSuccess = 0;
    let totalSearches = EMERGING_APP_SEARCHES.length;
    let currentSearch = 0;
    
    for (const term of EMERGING_APP_SEARCHES) {
      currentSearch++;
      console.log(`\n[${currentSearch}/${totalSearches}] Searching: "${term}"`);
      
      const result = await ingestAppsBySearch(term, 30); // 30 apps per search
      totalSuccess += result.success;
      
      // Small delay between searches to be nice to the API
      await new Promise((r) => setTimeout(r, 2000));
    }
    
    console.log(`\n✅ Total apps ingested: ${totalSuccess}\n`);

    // Step 3: Print summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const counts = await getAppCountsByCategory();
    console.log('Apps by category:');
    for (const [category, count] of Object.entries(counts)) {
      console.log(`  ${category}: ${count}`);
    }
    
    const totalApps = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`\n✅ Total apps in database: ${totalApps}`);
    
    console.log('\n🎉 Seeding complete!');
    console.log('\nNext steps:');
    console.log('  1. Run: npx tsx src/scripts/fetch-reviews.ts');
    console.log('  2. Run: npx tsx src/scripts/calculate-scores.ts');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();

