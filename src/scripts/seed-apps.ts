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

import { ingestFromAllCategories, ingestAppsBySearch, getAppCountsByCategory, ingestRisingApps } from '@/services/app-ingestion';
import { CategorySlug } from '@/lib/apify';

// Search terms focused on emerging app categories and niches
// Great opportunities for solo founders and indie hackers
const EMERGING_APP_SEARCHES = [
  // AI & New Tech (Hot)
  'ai assistant', 'ai writing', 'ai art generator', 'ai avatar', 'chatgpt client',
  'ai photo enhancer', 'ai voice changer', 'ai music generator', 'ai tutor',
  'ai pdf summarizer', 'ai legal assistant', 'ai coding', 'ai interior design',
  'ai therapist', 'ai homework helper', 'ai resume builder', 'ai email generator',

  // Health & Fitness (Evergreen)
  'workout planner', 'gym tracker', 'yoga for beginners', 'pilates app', 'calisthenics',
  'intermittent fasting', 'keto diet tracker', 'macro tracker', 'water reminder',
  'sleep cycle', 'meditation guide', 'running tracker', 'home workout',
  'hiit timer', 'stretch exercise', 'posture corrector', 'weight loss clinic',
  'step counter', 'pedometer', 'walking app', 'cycling computer', 'swimming log',

  // Mental Health & Self Care
  'anxiety relief', 'mood journal', 'cbt therapy', 'affirmations', 'gratitude journal',
  'sobriety tracker', 'panic attack help', 'adhd organizer', 'mindfulness coach',
  'shadow work journal', 'attachment style', 'therapy chat', 'self harm help',
  'breathing exercises', 'manifestation', 'vision board', 'dream journal',

  // Productivity & Focus
  'pomodoro timer', 'bullet journal', 'habit tracker', 'time blocking', 'deep work',
  'notion templates', 'focus music', 'to do list', 'project manager', 'note taking',
  'mind mapping', 'flashcards', 'study planner', 'anki', 'second brain',
  'read later', 'rss reader', 'white noise', 'background sounds', 'noise machine',

  // Finance & Business
  'expense tracker', 'budget planner', 'subscription manager', 'stock tracker',
  'crypto portfolio', 'freelance invoice', 'business card scanner', 'mileage tracker',
  'tax calculator', 'net worth tracker', 'dividend tracker', 'bills reminder',
  'receipt organizer', 'digital wallet', 'investment guide', 'saving goal',

  // Hobbies & Lifestyle
  'plant identifier', 'garden planner', 'star gazing', 'bird watching',
  'recipe manager', 'meal planner', 'cocktail recipes', 'wine scanner',
  'knitting patterns', 'guitar tuner', 'piano lessons', 'drawing tutorials',
  'mushroom guide', 'rock identifier', 'insect ID', 'astronomy', 'night sky',
  'origami', 'calligraphy', 'painting', 'crochet', 'fishing forecast',

  // Relationships & Social
  'couple journal', 'relationship questions', 'date ideas', 'baby milestones',
  'wedding planner', 'party games', 'truth or dare', 'quiz maker',
  'co-parenting', 'pregnancy tracker', 'baby feed', 'pet health', 'dog training',
  'roommate app', 'family calendar', 'shared list',

  // Travel & Local
  'trip planner', 'packing list', 'currency converter', 'flight tracker',
  'camping spots', 'hiking trails', 'solo travel', 'language exchange',
  'rv life', 'national parks', 'beach guide', 'surf report', 'skis tracks',
  'city guide', 'offline maps', 'translation', 'translator',

  // Tools & Utilities
  'pdf scanner', 'qr code generator', 'video compressor', 'wifi analyzer',
  'password manager', 'vpn client', 'ad blocker', 'weather radar',
  'speed test', 'unit converter', 'calculator plus', 'scanner app',
  'remote control', 'mouse server', 'file manager', 'storage cleaner',
  'font installer', 'keyboard skins', 'dark mode', 'widgets', 'icon pack',

  // Creator Economy & Social Media
  'video caption', 'teleprompter', 'thumbnail maker', 'instagram planner',
  'tiktok editor', 'hashtag generator', 'link in bio', 'social media scheduler',
  'logo maker', 'intro maker', 'remove background', 'photo retouch',
  'font maker', 'story templates', 'reels editor', 'color palette',

  // B2B & Freelance
  'invoice maker', 'receipt scanner', 'contract maker', 'inventory tracker',
  'shift scheduler', 'appointment booking', 'client manager', 'pos system',
  'business plan', 'signature app', 'time sheet', 'crm', 'cold email',
  'proposals', 'client portal', 'lead gen', 'networking',

  // Education & Self Improvement
  'language learning', 'vocabulary builder', 'math solver', 'coding for kids',
  'chess tutor', 'speed reading', 'memory training', 'typing test',
  'driving test', 'anatomy learning', 'periodic table', 'history facts',
  'philosophy', 'curiosity', 'daily quotes', 'vocabulary', 'word of the day',

  // Generic Search To Cast Wide Net
  'minimalist', 'clean', 'simple', 'pro', 'tracker', 'log', 'planner',
  'essential', 'companion', 'smart', 'easy', 'custom', 'personalized',
  'indie', 'new 2024', 'new 2025', 'trending', 'hidden gem', 'breakout',
  'best of', 'toolkit', 'utility', 'helper', 'assistant', 'manager',
  'easy budget',
  'smart assistant', 'fast video', 'pro editor', 'new 2024', 'new 2025',
  'best apps', 'track anything', 'my companion', 'weekly goals'
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
    let totalSuccess = 0;
    const totalSearches = EMERGING_APP_SEARCHES.length;
    let currentSearch = 0;

    // Step 1: Ingest from all major categories
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Ingesting top apps from all categories');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const categoryResult = await ingestFromAllCategories(200);
    totalSuccess += categoryResult.success;

    // Step 2: Ingest "Rising" apps (RSS Top Charts)
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Ingesting RISING apps (Discovery Mode)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const categories: CategorySlug[] = [
      'productivity', 'utilities', 'health-fitness', 'finance', 'lifestyle',
      'photo-video', 'education', 'entertainment', 'social-networking',
      'shopping', 'medical'
    ];

    for (const cat of categories) {
      const result = await ingestRisingApps(cat, 100);
      totalSuccess += result.success;
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Step 3: Ingest emerging apps by search (focused on opportunities for indie hackers)
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Searching for emerging iOS apps in hot niches');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const term of EMERGING_APP_SEARCHES) {
      currentSearch++;
      console.log(`\n[${currentSearch}/${totalSearches}] Searching: "${term}"`);

      const result = await ingestAppsBySearch(term, 200); // 200 apps per search (iTunes max)
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

