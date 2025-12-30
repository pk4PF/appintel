/**
 * Seed apps from iTunes API (no MRR filter for now)
 * 
 * Usage:
 *   npx tsx src/scripts/seed-5k-mrr-filtered.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { searchApps, iTunesApp } from '@/lib/itunes';
import { getServerClient } from '@/lib/supabase';
import type { AppInsert } from '@/types/database';

// HIGH-VALUE SEARCH TERMS (140 terms)
const SEARCH_TERMS = [
    // PRODUCTIVITY
    'task manager', 'to-do list', 'project management', 'habit tracker', 'goal tracker',
    'pomodoro timer', 'focus timer', 'daily planner', 'journal app', 'diary app',
    'writing app', 'markdown editor', 'text editor', 'document scanner', 'pdf editor',
    'note taking', 'reminder app', 'meeting scheduler', 'voice memo', 'transcription',
    'time tracker', 'time blocking', 'calendar app', 'agenda', 'weekly planner',

    // HEALTH & FITNESS
    'weight loss', 'gym tracker', 'home workout', 'yoga app', 'pilates',
    'running tracker', 'step counter', 'water reminder', 'meal planner', 'recipe app',
    'macro tracker', 'calorie counter', 'intermittent fasting', 'fasting timer', 'diet tracker',
    'meditation app', 'sleep tracker', 'sleep sounds', 'mental health', 'anxiety app',
    'therapy app', 'mood tracker', 'gratitude journal', 'breathing exercises', 'workout timer',

    // FINANCE
    'budget tracker', 'expense tracker', 'investment tracker', 'net worth tracker', 'bill reminder',
    'debt payoff', 'savings goal', 'money manager', 'receipt scanner', 'tax calculator',
    'spending tracker', 'financial planner', 'stock tracker', 'dividend tracker', 'portfolio tracker',
    'cryptocurrency tracker', 'bitcoin wallet', 'forex trading', 'stock alerts', 'invoice maker',

    // EDUCATION
    'study planner', 'exam prep', 'flashcard app', 'vocabulary builder', 'language learning',
    'math solver', 'homework helper', 'reading tracker', 'book notes', 'speed reading',
    'online course', 'skill learning', 'music practice', 'guitar tuner', 'piano app',
    'coding tutorial', 'typing practice', 'quiz maker', 'test prep', 'gre prep',

    // LIFESTYLE
    'home automation', 'smart home', 'cleaning schedule', 'chore tracker', 'grocery list',
    'travel planner', 'packing list', 'pet tracker', 'dog training', 'baby tracker',
    'wedding planner', 'event countdown', 'gift tracker', 'wishlist app', 'shopping list',
    'price tracker', 'coupon app', 'cashback', 'deal finder', 'loyalty card',

    // UTILITIES
    'vpn app', 'password manager', 'file manager', 'cloud storage', 'backup app',
    'parental control', 'screen time', 'ad blocker', 'qr scanner', 'wifi analyzer',
    'battery saver', 'cleaner app', 'zip extractor', 'unit converter', 'calculator pro',

    // CREATIVE
    'video editor', 'photo editor', 'collage maker', 'story maker', 'thumbnail maker',
    'drawing app', 'sketch app', 'animation app', 'music production', 'beat maker',
    'podcast recorder', 'voice changer', 'sound editor', 'video trimmer', 'subtitle editor',
];

function calculateMRR(app: iTunesApp): number {
    const totalDownloads = app.userRatingCount ? app.userRatingCount * 50 : 0;
    const price = app.price || 0;
    const desc = (app.description || '').toLowerCase();

    let pricingModel = 'free';
    if (price > 0) pricingModel = 'paid';
    else if (desc.includes('subscription') || desc.includes('premium')) pricingModel = 'subscription';
    else if (desc.includes('in-app')) pricingModel = 'freemium';

    const releaseDate = app.releaseDate ? new Date(app.releaseDate) : new Date();
    const monthsActive = Math.max(1, Math.floor((Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const monthlyDownloads = totalDownloads / Math.max(monthsActive, 12);

    if (pricingModel === 'subscription') {
        return Math.round(monthlyDownloads * 1.5 * 0.025 * (price > 0 ? price : 5.99));
    }
    if (pricingModel === 'freemium' || pricingModel === 'paid') {
        return Math.round(monthlyDownloads * 0.015 * (price > 0 ? price : 3.99));
    }
    return Math.round(monthlyDownloads * 2 * 0.05);
}

function transformToInsert(app: iTunesApp, categoryId: string | null): AppInsert {
    const desc = (app.description || '').toLowerCase();
    let pricingModel = 'free';
    if (app.price > 0) pricingModel = 'paid';
    else if (desc.includes('subscription') || desc.includes('premium')) pricingModel = 'subscription';
    else if (desc.includes('in-app')) pricingModel = 'freemium';

    return {
        app_store_id: app.trackId.toString(),
        name: app.trackName,
        icon_url: app.artworkUrl512 || app.artworkUrl100 || null,
        description: app.description || '',
        short_description: app.description?.substring(0, 200) || null,
        developer_name: app.artistName,
        developer_id: app.artistId?.toString() || null,
        category_id: categoryId,
        release_date: app.releaseDate ? new Date(app.releaseDate).toISOString().split('T')[0] : null,
        last_updated: app.currentVersionReleaseDate ? new Date(app.currentVersionReleaseDate).toISOString().split('T')[0] : null,
        price: app.price || 0,
        currency: app.currency || 'USD',
        pricing_model: pricingModel,
        minimum_os_version: app.minimumOsVersion || null,
        size_bytes: app.fileSizeBytes ? parseInt(app.fileSizeBytes) : null,
        languages: app.languageCodesISO2A || [],
        content_rating: app.contentAdvisoryRating || null,
        url: app.trackViewUrl || null,
    };
}

async function getCategoryByGenre(genreName: string): Promise<string | null> {
    const supabase = getServerClient();
    const slug = genreName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
    const { data } = await supabase.from('categories').select('id').eq('slug', slug).single();
    if (data) return data.id;

    const { data: newCat } = await supabase.from('categories').insert({ name: genreName, slug }).select('id').single();
    return newCat?.id || null;
}

async function upsertApp(appData: AppInsert, mrr: number, ratingCount: number, rating: number, downloads: number, date: string): Promise<string | null> {
    const supabase = getServerClient();

    const { data: app, error } = await supabase
        .from('apps')
        .upsert(appData, { onConflict: 'app_store_id', ignoreDuplicates: false })
        .select('id')
        .single();

    if (error) {
        console.error(`  ❌ ${appData.name}: ${error.message}`);
        return null;
    }

    await supabase.from('app_metrics').upsert({
        app_id: app.id,
        date,
        rating: rating || null,
        rating_count: ratingCount || null,
        downloads_estimate: downloads || null,
        revenue_estimate: mrr || null,
    }, { onConflict: 'app_id,date' });

    return app.id;
}

async function main() {
    console.log('🚀 Seeding apps from iTunes API\n');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing Supabase credentials');
        process.exit(1);
    }

    const today = new Date().toISOString().split('T')[0];
    const seenAppIds = new Set<string>();
    let totalFetched = 0, totalInserted = 0, totalSkipped = 0;

    console.log(`📋 ${SEARCH_TERMS.length} search terms to process\n`);

    for (let i = 0; i < SEARCH_TERMS.length; i++) {
        const term = SEARCH_TERMS[i];
        process.stdout.write(`[${(i + 1).toString().padStart(3)}/${SEARCH_TERMS.length}] "${term}"... `);

        try {
            const apps = await searchApps(term, 200);
            let termInserted = 0;

            for (const app of apps) {
                totalFetched++;
                const appStoreId = app.trackId.toString();

                if (seenAppIds.has(appStoreId)) {
                    totalSkipped++;
                    continue;
                }
                seenAppIds.add(appStoreId);

                const mrr = calculateMRR(app);
                const categoryId = app.primaryGenreName ? await getCategoryByGenre(app.primaryGenreName) : null;
                const appInsert = transformToInsert(app, categoryId);
                const downloads = app.userRatingCount ? app.userRatingCount * 50 : 0;

                const appId = await upsertApp(appInsert, mrr, app.userRatingCount || 0, app.averageUserRating || 0, downloads, today);
                if (appId) {
                    totalInserted++;
                    termInserted++;
                }
            }

            console.log(`✓ ${apps.length} found, ${termInserted} inserted`);
            await new Promise(r => setTimeout(r, 500));

        } catch (error) {
            console.log(`✗ ${error instanceof Error ? error.message : 'Error'}`);
        }

        if ((i + 1) % 20 === 0) {
            console.log(`\n--- ${totalInserted} inserted, ${totalSkipped} skipped ---\n`);
        }
    }

    console.log(`\n✅ Done! ${totalInserted} apps inserted.\n`);
}

main().catch(console.error);
