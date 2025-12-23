/**
 * Seed script to populate the database with HIGH-EARNING apps ($20k+ MRR targets)
 * 
 * Usage:
 *   npx tsx src/scripts/seed-high-earners.ts
 * 
 * Strategy:
 *   1. Search for apps with high-revenue keywords (subscription, premium, pro)
 *   2. Target categories known for high ARPU (productivity, finance, health)
 *   3. Focus on apps that are still buildable by indie devs
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { ingestAppsBySearch, getAppCountsByCategory } from '@/services/app-ingestion';

// HIGH-REVENUE SEARCH TERMS
// These correlate with subscription/premium apps that have proven revenue
const HIGH_REVENUE_SEARCHES = [
    // === SUBSCRIPTION POWERHOUSES ===
    'subscription app ios',
    'premium app',
    'pro app subscription',

    // === PRODUCTIVITY (B2B/prosumer - high willingness to pay) ===
    'pdf editor pro',
    'document scanner pro',
    'calendar app pro',
    'email client app',
    'vpn app premium',
    'password manager app',
    'time tracking app',
    'project management app',
    'note taking app premium',

    // === HEALTH & FITNESS (subscription kings) ===
    'workout app subscription',
    'fitness app premium',
    'diet tracker premium',
    'meditation app subscription',
    'sleep tracker premium',
    'fasting app premium',
    'calorie counter premium',

    // === CREATIVE TOOLS (high ARPU) ===
    'video editor pro ios',
    'photo editor premium',
    'music production app',
    'drawing app pro',
    'podcast app pro',

    // === FINANCE (high-value users) ===
    'stock trading app',
    'crypto portfolio app',
    'investment app',
    'budgeting app premium',
    'invoice app',
    'expense tracker pro',

    // === UTILITIES (sticky, recurring) ===
    'cloud storage app',
    'backup app ios',
    'parental control app',
    'screen time app',
    'ad blocker app',
    'qr code scanner pro',

    // === EDUCATION (high retention) ===
    'language learning app',
    'flashcard app premium',
    'kids education app',
    'coding app ios',

    // === LIFESTYLE (niche but lucrative) ===
    'dating app premium',
    'weather app pro',
    'recipe app premium',
    'wine app subscription',
];

async function main() {
    console.log('💰 Starting HIGH-EARNER app seeding...\n');
    console.log('Strategy: Targeting subscription/premium apps with proven revenue\n');

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
        console.log('\n💡 You need an Apify API token to scrape apps.');
        console.log('   Get one free at: https://apify.com/\n');
        process.exit(1);
    }

    console.log('✓ Environment variables loaded\n');

    try {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('Searching for HIGH-REVENUE iOS apps');
        console.log('═══════════════════════════════════════════════════════════════\n');

        let totalSuccess = 0;
        const totalSearches = HIGH_REVENUE_SEARCHES.length;
        let currentSearch = 0;

        for (const term of HIGH_REVENUE_SEARCHES) {
            currentSearch++;
            console.log(`\n[${currentSearch}/${totalSearches}] Searching: "${term}"`);

            const result = await ingestAppsBySearch(term, 25); // 25 apps per search
            totalSuccess += result.success;

            // Delay between searches to be nice to the API
            await new Promise((r) => setTimeout(r, 2500));
        }

        console.log(`\n✅ Total apps ingested: ${totalSuccess}\n`);

        // Print summary
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

        console.log('\n🎉 High-earner seeding complete!');
        console.log('\nNext steps:');
        console.log('  1. Run: npx tsx src/scripts/fetch-reviews.ts');
        console.log('  2. Run: npx tsx src/scripts/calculate-scores.ts');
        console.log('  3. Check dashboard for higher-revenue apps!');

    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    }
}

main();
