import { fetchAppsByCategoryRSS } from '../src/services/apple-rss-ingestion';
import dotenv from 'dotenv';
import { CategorySlug } from '../src/lib/apify';

dotenv.config({ path: '.env.local' });

// Aligning with the keys in GENRE_IDS in apple-rss-ingestion.ts
// which matches CategorySlug generally but verify keys
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
    'shopping'
];

async function boostIngestion() {
    console.log('🚀 Starting Boost Ingestion via RSS (free, up to 200 apps per category)...');

    for (const category of CATEGORIES) {
        // RSS limit is typically ~200 max.
        const limit = 200;

        console.log(`\n👉 Processing ${category}...`);
        try {
            await fetchAppsByCategoryRSS(category, limit);
        } catch (error) {
            console.error(`❌ Failed to ingest ${category}:`, error);
        }

        // Small delay
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n✨ Boost Ingestion Complete!');
}

boostIngestion().catch(console.error);
