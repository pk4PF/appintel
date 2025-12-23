/**
 * Seed HIGH-EARNING apps using Apple's FREE iTunes Search API
 * 
 * Usage:
 *   npx tsx src/scripts/seed-itunes.ts
 * 
 * NO API KEY REQUIRED! This uses Apple's official public API.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { searchApps, iTunesApp } from '@/lib/itunes';
import { getServerClient } from '@/lib/supabase';
import type { AppInsert, AppMetricsInsert } from '@/types/database';

// HIGH-REVENUE SEARCH TERMS (subscription-focused)
const HIGH_REVENUE_SEARCHES = [
    // === SUBSCRIPTION POWERHOUSES ===
    'subscription tracker',
    'premium',

    // === PRODUCTIVITY ===
    'pdf editor',
    'document scanner',
    'calendar pro',
    'vpn',
    'password manager',
    'time tracker',
    'note taking',

    // === HEALTH & FITNESS ===
    'workout tracker',
    'fitness app',
    'diet tracker',
    'meditation',
    'sleep tracker',
    'fasting app',
    'calorie counter',

    // === CREATIVE TOOLS ===
    'video editor',
    'photo editor',
    'music production',

    // === FINANCE ===
    'stock trading',
    'crypto portfolio',
    'budget tracker',
    'expense tracker',
    'invoice',

    // === UTILITIES ===
    'cloud storage',
    'parental control',
    'screen time',
    'ad blocker',

    // === EDUCATION ===
    'language learning',
    'flashcard',
    'coding app',
];

/**
 * Transform iTunes app to our database schema
 */
function transformToInsert(app: iTunesApp, categoryId: string | null): AppInsert {
    let pricingModel = 'free';
    if (app.price > 0) {
        pricingModel = 'paid';
    } else if (app.description?.toLowerCase().includes('subscription')) {
        pricingModel = 'subscription';
    } else if (app.description?.toLowerCase().includes('in-app')) {
        pricingModel = 'freemium';
    }

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

/**
 * Transform to metrics
 */
function transformToMetrics(app: iTunesApp, appId: string, date: string): AppMetricsInsert {
    const downloadEstimate = app.userRatingCount ? Math.round(app.userRatingCount * 50) : null;

    return {
        app_id: appId,
        date,
        rating: app.averageUserRating ? Math.round(app.averageUserRating * 10) / 10 : null,
        rating_count: app.userRatingCount || null,
        review_count: app.userRatingCount || null,
        downloads_estimate: downloadEstimate,
        revenue_estimate: null,
    };
}

/**
 * Get or create category by genre name
 */
async function getCategoryByGenre(genreName: string): Promise<string | null> {
    const supabase = getServerClient();
    const slug = genreName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');

    const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .single();

    return data?.id || null;
}

/**
 * Upsert an app and its metrics
 */
async function upsertApp(
    appData: AppInsert,
    metricsData: Omit<AppMetricsInsert, 'app_id'>
): Promise<string | null> {
    const supabase = getServerClient();

    const { data: app, error: appError } = await supabase
        .from('apps')
        .upsert(appData, {
            onConflict: 'app_store_id',
            ignoreDuplicates: false,
        })
        .select('id')
        .single();

    if (appError) {
        console.error(`  ✗ Error upserting ${appData.name}:`, appError.message);
        return null;
    }

    const { error: metricsError } = await supabase
        .from('app_metrics')
        .upsert(
            { ...metricsData, app_id: app.id },
            { onConflict: 'app_id,date' }
        );

    if (metricsError) {
        console.error(`  ✗ Error inserting metrics for ${appData.name}:`, metricsError.message);
    }

    return app.id;
}

async function main() {
    console.log('💰 Seeding HIGH-EARNING apps using FREE iTunes API\n');
    console.log('No API key required! Using Apple\'s official public API.\n');

    // Check required env vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing Supabase credentials');
        process.exit(1);
    }

    console.log('✓ Environment loaded\n');

    const today = new Date().toISOString().split('T')[0];
    let totalSuccess = 0;
    let totalFailed = 0;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Searching for HIGH-REVENUE iOS apps');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (let i = 0; i < HIGH_REVENUE_SEARCHES.length; i++) {
        const term = HIGH_REVENUE_SEARCHES[i];
        console.log(`\n[${i + 1}/${HIGH_REVENUE_SEARCHES.length}] Searching: "${term}"`);

        try {
            const apps = await searchApps(term, 50);

            for (const app of apps) {
                try {
                    const categoryId = app.primaryGenreName
                        ? await getCategoryByGenre(app.primaryGenreName)
                        : null;

                    const appInsert = transformToInsert(app, categoryId);
                    const metricsData = transformToMetrics(app, '', today);

                    const appId = await upsertApp(appInsert, metricsData);

                    if (appId) {
                        totalSuccess++;
                        if (app.userRatingCount && app.userRatingCount > 1000) {
                            console.log(`  💰 ${app.trackName} (${app.userRatingCount.toLocaleString()} ratings)`);
                        }
                    } else {
                        totalFailed++;
                    }
                } catch (err) {
                    totalFailed++;
                }
            }

            // Small delay between searches
            await new Promise(r => setTimeout(r, 500));

        } catch (error) {
            console.error(`  ✗ Search failed:`, error);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n✅ Added ${totalSuccess} apps, ${totalFailed} failed\n`);
    console.log('Next steps:');
    console.log('  1. npx tsx src/scripts/calculate-scores.ts');
    console.log('  2. Check dashboard for higher-revenue apps!');
}

main();
