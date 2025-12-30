
import { fetchAppsByCategoryRSS } from '../src/services/apple-rss-ingestion';
import { ingestReviewsForTopApps } from '../src/services/review-ingestion';
import { calculateAllScores } from '../src/services/scoring/calculator';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CATEGORIES = [
    'medical',
    'health-fitness',
    'productivity',
    'utilities',
    'finance',
    'lifestyle',
    'photo-video',
    'education',
    'entertainment',
    'social-networking',
    'shopping',
    'business',
    'card-games', // Some extra valid ones if possible, but let's stick to the list in GENRE_IDS
];

// Ensure keys match GENRE_IDS in apple-rss-ingestion.ts
const VALID_CATEGORIES = [
    'medical',
    'health-fitness',
    'productivity',
    'utilities',
    'finance',
    'lifestyle',
    'photo-video',
    'education',
    'entertainment',
    'social-networking',
    'shopping',
    'business',
    'news',
    'weather',
    'food-drink',
    'travel'
];

async function run() {
    console.log('🚀 STARTING MASSIVE INGESTION PIPELINE');
    console.log('=======================================');

    // 1. Ingest Apps
    console.log('\nPHASE 1: Fetching App Lists (RSS Top 200 per category)');
    for (const cat of VALID_CATEGORIES) {
        // 200 is typical RSS limit
        await fetchAppsByCategoryRSS(cat, 200);
        await new Promise(r => setTimeout(r, 800)); // Rate limit niceness
    }

    // 2. Ingest Reviews
    // We want to process A LOT of apps. 
    // ingestReviewsForTopApps prioritizes apps with NO reviews first.
    // Since specific rating_count is null for RSS apps, they won't sort by popularity well,
    // but they WILL be picked up by the "no reviews" filter in `ingestReviewsForTopApps` (lines 86-95).
    console.log('\nPHASE 2: Fetching Reviews for up to 3000 apps');
    await ingestReviewsForTopApps(3000, 30); // 30 reviews is enough for initial signal

    // 3. Calculate Scores
    console.log('\nPHASE 3: Calculating Opportunity Scores');
    await calculateAllScores('30d');

    console.log('\n✨✨ PIPELINE COMPLETE ✨✨');
    console.log('Dashboard should now have thousands of apps.');
}

run().catch(console.error);
