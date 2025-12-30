import { getServerClient } from '@/lib/supabase';
import {
  fetchAppsByCategory,
  fetchAppDetails,
  AppStoreAppResult,
  CATEGORY_URLS,
  CategorySlug,
} from '@/lib/apify';
import { searchApps, iTunesApp } from '@/lib/itunes';
import type { AppInsert, AppMetricsInsert, Category } from '@/types/database';
import { calculateOpportunityScore } from './opportunity-scoring';

/**
 * Transform Apify app result to our database schema
 */
function transformAppToInsert(
  app: AppStoreAppResult,
  categoryId: string | null
): AppInsert {
  // Extract app_store_id from iTunes format (trackId) or fallback
  const appStoreId = app.trackId?.toString() ||
    app.collectionId?.toString() ||
    app.appId ||
    app.id;

  if (!appStoreId) {
    throw new Error('No app_store_id found in response');
  }

  // Extract name
  const name = app.trackName || app.collectionName || app.title || 'Unknown';

  // Extract developer
  const developer = app.artistName || app.developer || 'Unknown';

  // Extract icon (use highest resolution available)
  const icon = app.artworkUrl512 || app.artworkUrl100 || app.artworkUrl60 || app.icon || null;

  // Extract description
  const description = app.description || '';

  // Extract price
  const price = app.price || 0;
  const currency = app.formattedPrice?.match(/[A-Z]{3}/)?.[0] || app.currency || 'USD';

  // Determine pricing model
  let pricingModel = 'free';
  if (price > 0) {
    pricingModel = 'paid';
  } else if (description.toLowerCase().includes('subscription')) {
    pricingModel = 'subscription';
  } else if (description.toLowerCase().includes('in-app')) {
    pricingModel = 'freemium';
  }

  // Extract release date
  const releaseDate = app.releaseDate || app.released;
  const lastUpdated = app.currentVersionReleaseDate || app.updated;

  // Extract size
  let sizeBytes: number | null = null;
  if (app.fileSizeBytes) {
    sizeBytes = parseInt(app.fileSizeBytes);
  } else if (app.size) {
    const match = app.size.match(/^([\d.]+)\s*(KB|MB|GB)/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      const multipliers: Record<string, number> = {
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
      };
      sizeBytes = Math.round(value * (multipliers[unit] || 1));
    }
  }

  // Extract URL
  const url = app.trackViewUrl || app.collectionViewUrl || app.url || null;

  // Extract languages
  const languages = app.languageCodesISO2A || app.languages || [];

  // Extract content rating
  const contentRating = app.contentAdvisoryRating || app.contentRating || null;

  // Extract minimum OS version
  const minimumOsVersion = app.minimumOsVersion || app.requiredOsVersion || null;

  // Extract developer ID
  const developerId = app.artistViewUrl?.match(/id(\d+)/)?.[1] || app.developerId || null;

  // Extract screenshots
  const screenshots = app.screenshotUrls || [];
  const ipadScreenshots = app.ipadScreenshotUrls || [];

  return {
    app_store_id: appStoreId,
    name,
    icon_url: icon,
    description,
    short_description: description?.substring(0, 200) || null,
    developer_name: developer,
    developer_id: developerId,
    category_id: categoryId,
    release_date: releaseDate ? new Date(releaseDate).toISOString().split('T')[0] : null,
    last_updated: lastUpdated ? new Date(lastUpdated).toISOString().split('T')[0] : null,
    price,
    currency,
    pricing_model: pricingModel,
    minimum_os_version: minimumOsVersion,
    size_bytes: sizeBytes,
    languages,
    content_rating: contentRating,
    url,
  };
}

import { estimateAppGrowth, fetchTopAppIds } from '@/lib/app-intelligence';

/**
 * Transform app result to metrics insert with intelligence estimates
 */
function transformToMetrics(
  app: AppStoreAppResult,
  appId: string,
  date: string,
  categoryName = 'Unknown'
): AppMetricsInsert {
  const rating = app.averageUserRating || app.score || 0;
  const ratingCount = app.userRatingCount || 0;
  const pricingModel = app.price && app.price > 0 ? 'paid' : (app.description?.toLowerCase().includes('subscription') ? 'subscription' : 'freemium');
  const releaseDate = app.releaseDate || app.released || null;

  // Use our new Intelligence Model
  const intelligence = estimateAppGrowth(
    ratingCount,
    rating,
    categoryName,
    pricingModel,
    releaseDate
  );

  return {
    app_id: appId,
    date,
    rating: rating ? Math.round(rating * 10) / 10 : null,
    rating_count: ratingCount,
    review_count: ratingCount,
    downloads_estimate: intelligence.downloadsMonthly, // Monthly estimate for better "emergence" tracking
    revenue_estimate: intelligence.revenueMonthly,
  };
}

/**
 * Filter results to only include actual iOS apps
 */
function filterAppResults(allResults: AppStoreAppResult[]): AppStoreAppResult[] {
  return allResults.filter(app => {
    const kind = app.kind || app.wrapperType;
    const url = app.trackViewUrl || app.url || '';
    const name = app.trackName || app.collectionName || app.title || '';
    const description = app.description || '';

    // Must be software AND have an apps.apple.com URL
    // Also explicitly exclude known non-app subdomains
    const isSoftware = kind === 'software' || kind === 'iosSoftware' || kind === 'macSoftware';
    const isAppStoreUrl = url.includes('apps.apple.com') &&
      !url.includes('podcasts.apple.com') &&
      !url.includes('books.apple.com') &&
      !url.includes('music.apple.com');

    // Check for explicit non-app terms in name or description
    const isExplicitNonApp =
      name.toLowerCase().includes('radio show') ||
      name.toLowerCase().includes('podcast episode') ||
      description.toLowerCase().includes('sony award-winning radio sitcom') ||
      description.toLowerCase().includes('this is a radio program') ||
      description.toLowerCase().includes('this podcast');

    // Exclude apps with primary names in Non-Latin scripts (CJK, Arabic, etc.) to ensure US focus
    // This allows accented characters but blocks Chinese/Japanese/Korean/Arabic/Cyrillic primary titles
    const isNonLatin = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\u0400-\u04FF\u0600-\u06FF]/.test(name);

    return isSoftware && isAppStoreUrl && !isExplicitNonApp && !isNonLatin;
  });
}

/**
 * Get or create category by slug
 */
async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error(`Error fetching category ${slug}:`, error);
    return null;
  }

  return data;
}

/**
 * Upsert an app and its initial metrics
 */
async function upsertApp(
  appData: AppInsert,
  metricsData: Omit<AppMetricsInsert, 'app_id'>
): Promise<string | null> {
  const supabase = getServerClient();

  // Upsert the app
  const { data: app, error: appError } = await supabase
    .from('apps')
    .upsert(appData, {
      onConflict: 'app_store_id',
      ignoreDuplicates: false,
    })
    .select('id')
    .single();

  if (appError) {
    console.error(`Error upserting app ${appData.name}:`, appError);
    return null;
  }

  // Insert metrics (upsert on app_id + date)
  const { error: metricsError } = await supabase
    .from('app_metrics')
    .upsert(
      { ...metricsData, app_id: app.id },
      { onConflict: 'app_id,date' }
    );

  if (metricsError) {
    console.error(`Error inserting metrics for ${appData.name}:`, metricsError);
  }

  // Handle Score calculations separately to ensure they use metrics
  try {
    const intelligence = estimateAppGrowth(
      metricsData.rating_count || 0,
      metricsData.rating || 0,
      appData.category_id || 'Unknown',
      appData.pricing_model || 'free',
      appData.release_date || null
    );

    const { error: scoreError } = await supabase
      .from('opportunity_scores')
      .upsert({
        app_id: app.id,
        score: intelligence.gapScore,
        momentum: intelligence.momentumScore,
        demand_signal: Math.min(100, Math.round(Math.log10((metricsData.rating_count || 0) + 1) * 20)),
        user_satisfaction: Math.round((metricsData.rating || 0) * 20),
        monetization_potential: appData.pricing_model === 'subscription' ? 100 : 70,
        competitive_density: metricsData.rating_count && metricsData.rating_count > 1000 ? 80 : 30,
        time_window: 'all_time',
        calculated_at: new Date().toISOString()
      }, { onConflict: 'app_id,time_window' });
  } catch (err) {
    console.error(`Error scoring app ${appData.name}:`, err);
  }

  // --- Calculate and Insert Opportunity Score ---
  try {
    const scores = calculateOpportunityScore(appData, metricsData);

    // We only keep the latest score for simplicity in V1 (or could log history)
    // Using upsert on app_id to keep one active score per app (if constraint exists)
    // Wait, the schema allows multiple scores. The unique constraint might be id, or app_id+time_window.
    // Let's assume we want one primary score for now, but the table allows history.
    // We'll insert a new one or update the latest.

    // Check if we already have a score for today/this window? 
    // For V1 let's just insert/update a single record for 'all_time' window to keep it simple for the dashboard.
    // Actually the PRD implies a single current score.

    // We'll treat it as a "current status" upsert if possible, or just insert new. 
    // To allow re-running, let's delete old score for this window and insert new? 
    // Or just insert and we query "latest".

    // Let's look at schema: opportunity_scores has no unique constraint on app_id in the create table usually,
    // but good practice for "current score" is often needed.
    // Let's just insert for now, and we can query `order by calculated_at desc limit 1`.

    const { error: scoreError } = await supabase
      .from('opportunity_scores')
      .upsert({
        app_id: app.id,
        ...scores,
        calculated_at: new Date().toISOString()
      }, { onConflict: 'app_id,time_window' });

    if (scoreError) {
      console.error(`Error inserting score for ${appData.name}:`, scoreError);
    }

  } catch (err) {
    console.error(`Error calculating score for ${appData.name}:`, err);
  }

  return app.id;
}

/**
 * Ingest apps from a specific category
 */
export async function ingestAppsFromCategory(
  categorySlug: CategorySlug,
  maxItems = 400
): Promise<{ success: number; failed: number }> {
  console.log(`\n📱 Ingesting apps from category: ${categorySlug}`);

  const category = await getCategoryBySlug(categorySlug);
  const categoryId = category?.id || null;

  const today = new Date().toISOString().split('T')[0];
  let success = 0;
  let failed = 0;

  try {
    // Use free iTunes Search API (no Apify proxy needed, avoids 403 errors)
    const searchTerm = categorySlug.replace(/-/g, ' '); // "health-fitness" -> "health fitness"
    const allResults = await searchApps(searchTerm, maxItems);
    const apps = filterAppResults(allResults as unknown as AppStoreAppResult[]);
    console.log(`Found ${apps.length} apps (filtered from ${allResults.length} results)`);

    for (const app of apps) {
      try {
        const appInsert = transformAppToInsert(app, categoryId);
        const metricsInsert = transformToMetrics(app, '', today, categorySlug);

        const appId = await upsertApp(appInsert, metricsInsert);

        if (appId) {
          success++;
          const appName = app.trackName || app.collectionName || app.title || 'Unknown';
          console.log(`  ✓ ${appName}`);
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }
  } catch (error) {
    console.error(`Error ingesting category ${categorySlug}:`, error);
  }

  console.log(`Category ${categorySlug}: ${success} success, ${failed} failed`);
  return { success, failed };
}

/**
 * Ingest apps by search term
 */
export async function ingestAppsBySearch(
  searchTerm: string,
  maxItems = 50
): Promise<{ success: number; failed: number }> {
  console.log(`\n🔍 Searching (iTunes API): "${searchTerm}"`);

  const today = new Date().toISOString().split('T')[0];
  let success = 0;
  let failed = 0;

  try {
    const allResults = await searchApps(searchTerm, maxItems);
    const apps = filterAppResults(allResults as unknown as AppStoreAppResult[]);

    console.log(`Found ${apps.length} apps (filtered from ${allResults.length} results)`);

    for (const app of apps) {
      // Try to match category by genre
      let categoryId: string | null = null;
      const genre = app.primaryGenreName;
      if (genre) {
        const categorySlug = genre.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
        const category = await getCategoryBySlug(categorySlug);
        categoryId = category?.id || null;
      }

      try {
        const appInsert = transformAppToInsert(app, categoryId);
        const metricsInsert = transformToMetrics(app, '', today);

        const appId = await upsertApp(appInsert, metricsInsert);

        if (appId) {
          success++;
          const appName = app.trackName || app.collectionName || app.title || 'Unknown';
          console.log(`  ✓ ${appName}`);
        } else {
          failed++;
          const appName = app.trackName || app.collectionName || app.title || 'Unknown';
          console.log(`  ✗ ${appName}`);
        }
      } catch (error) {
        failed++;
        const appName = app.trackName || app.collectionName || app.title || 'Unknown';
        console.log(`  ✗ ${appName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error(`Error searching for "${searchTerm}":`, error);
  }

  return { success, failed };
}

/**
 * Ingest a single app by URL
 */
export async function ingestAppByUrl(
  appUrl: string
): Promise<string | null> {
  console.log(`\n📲 Ingesting app: ${appUrl}`);

  const today = new Date().toISOString().split('T')[0];

  try {
    const apps = await fetchAppDetails([appUrl]);

    if (apps.length === 0) {
      console.error('App not found');
      return null;
    }

    const app = apps[0];

    // Try to match category
    let categoryId: string | null = null;
    const genre = app.primaryGenreName;
    if (genre) {
      const categorySlug = genre.toLowerCase().replace(/\s+/g, '-');
      const category = await getCategoryBySlug(categorySlug);
      categoryId = category?.id || null;
    }

    const appInsert = transformAppToInsert(app, categoryId);
    const metricsInsert = transformToMetrics(app, '', today);

    const appId = await upsertApp(appInsert, metricsInsert);

    if (appId) {
      const appName = app.trackName || app.collectionName || app.title || 'Unknown';
      console.log(`  ✓ ${appName} (${appId})`);
      return appId;
    }
  } catch (error) {
    console.error(`Error ingesting app:`, error);
  }

  return null;
}

const CATEGORY_IDS: Record<CategorySlug, string> = {
  productivity: '6007',
  utilities: '6002',
  'health-fitness': '6013',
  finance: '6015',
  lifestyle: '6012',
  'photo-video': '6008',
  education: '6017',
  entertainment: '6016',
  'social-networking': '6005',
  shopping: '6024',
  'food-drink': '6023',
  travel: '6003',
  business: '6000',
  news: '6009',
  weather: '6001',
  medical: '6020',
};

/**
 * Ingest "Rising" apps using RSS feeds (Top Free/Grossing)
 */
export async function ingestRisingApps(
  categorySlug: CategorySlug,
  limit = 100
): Promise<{ success: number; failed: number }> {
  console.log(`\n📈 Ingesting RISING apps (RSS): ${categorySlug}`);

  const categoryId = CATEGORY_IDS[categorySlug];
  if (!categoryId) {
    console.error(`No ID found for category: ${categorySlug}`);
    return { success: 0, failed: 0 };
  }

  const category = await getCategoryBySlug(categorySlug);
  const dbCategoryId = category?.id || null;
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Get Top Free and Top Grossing IDs (Mix of emergence and profit)
    const [freeIds, grossingIds] = await Promise.all([
      fetchTopAppIds(categoryId, limit, 'topfreeapplications'),
      fetchTopAppIds(categoryId, 50, 'topgrossingapplications')
    ]);

    const allIds = Array.from(new Set([...freeIds, ...grossingIds]));
    console.log(`Found ${allIds.length} unique rising app IDs`);

    // 2. Lookup full details via iTunes API
    const { lookupApps } = await import('@/lib/itunes');
    const apps = await lookupApps(allIds);

    let success = 0;
    let failed = 0;

    for (const app of apps) {
      try {
        const appInsert = transformAppToInsert(app as any, dbCategoryId);
        const metricsInsert = transformToMetrics(app as any, '', today, categorySlug);
        const appId = await upsertApp(appInsert, metricsInsert);
        if (appId) success++; else failed++;
      } catch (err) {
        failed++;
      }
    }

    return { success, failed };
  } catch (err) {
    console.error(`Error ingesting rising apps for ${categorySlug}:`, err);
    return { success: 0, failed: 0 };
  }
}

/**
 * Bulk ingest from multiple categories
 */
export async function ingestFromAllCategories(
  appsPerCategory = 200
): Promise<{ total: number; success: number; failed: number }> {
  console.log('\n🚀 Starting bulk ingestion from all categories\n');

  /**
   * Bulk ingest from multiple categories
   */

  const categories: CategorySlug[] = [
    'productivity',
    'utilities',
    'health-fitness',
    'finance',
    'lifestyle',
    'photo-video',
    'education',
    'entertainment',
    'social-networking',
    'shopping',
    'medical',
  ];

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const category of categories) {
    const { success, failed } = await ingestAppsFromCategory(category, appsPerCategory);
    totalSuccess += success;
    totalFailed += failed;

    // Small delay between categories to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(`\n✅ Ingestion complete: ${totalSuccess} success, ${totalFailed} failed`);

  return {
    total: totalSuccess + totalFailed,
    success: totalSuccess,
    failed: totalFailed,
  };
}

/**
 * Get all apps with their latest metrics
 */
export async function getAllAppsWithMetrics() {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('apps')
    .select(`
      *,
      categories!apps_category_id_fkey (*),
      app_metrics (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching apps:', error);
    return [];
  }

  return data;
}

/**
 * Get apps count by category
 */
export async function getAppCountsByCategory() {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('apps')
    .select('category_id, categories!apps_category_id_fkey(name)')
    .not('category_id', 'is', null);

  if (error) {
    console.error('Error fetching app counts:', error);
    return {};
  }

  // Count apps per category
  const counts: Record<string, number> = {};
  for (const app of data || []) {
    const categories = app.categories as unknown as { name: string } | null;
    const categoryName = categories?.name || 'Unknown';
    counts[categoryName] = (counts[categoryName] || 0) + 1;
  }

  return counts;
}

