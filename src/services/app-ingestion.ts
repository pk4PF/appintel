import { getServerClient } from '@/lib/supabase';
import {
  fetchAppsByCategory,
  fetchAppsBySearch,
  fetchAppDetails,
  AppStoreAppResult,
  CATEGORY_URLS,
  CategorySlug,
} from '@/lib/apify';
import type { AppInsert, AppMetricsInsert, Category } from '@/types/database';

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
    screenshots: screenshots.length > 0 ? screenshots : null,
    ipad_screenshots: ipadScreenshots.length > 0 ? ipadScreenshots : null,
  };
}

/**
 * Transform app result to metrics insert
 */
function transformToMetrics(
  app: AppStoreAppResult,
  appId: string,
  date: string
): AppMetricsInsert {
  // Extract rating from iTunes format
  const rating = app.averageUserRating || app.score || null;
  const ratingCount = app.userRatingCount || null;

  // Estimate downloads (rough proxy: ~50x review count)
  const estimatedDownloads = ratingCount ? Math.round(ratingCount * 50) : null;

  return {
    app_id: appId,
    date,
    rating: rating ? Math.round(rating * 10) / 10 : null,
    rating_count: ratingCount,
    review_count: ratingCount,
    downloads_estimate: estimatedDownloads,
    revenue_estimate: null,
  };
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

  return app.id;
}

/**
 * Ingest apps from a specific category
 */
export async function ingestAppsFromCategory(
  categorySlug: CategorySlug,
  maxItems = 100
): Promise<{ success: number; failed: number }> {
  console.log(`\n📱 Ingesting apps from category: ${categorySlug}`);

  const category = await getCategoryBySlug(categorySlug);
  const categoryId = category?.id || null;

  const today = new Date().toISOString().split('T')[0];
  let success = 0;
  let failed = 0;

  try {
    // Use search term instead of category URL (actor works better with search)
    const searchTerm = categorySlug.replace(/-/g, ' '); // "health-fitness" -> "health fitness"
    const apps = await fetchAppsBySearch(searchTerm, maxItems);
    console.log(`Found ${apps.length} apps`);

    for (const app of apps) {
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
  console.log(`\n🔍 Searching for apps: "${searchTerm}"`);

  const today = new Date().toISOString().split('T')[0];
  let success = 0;
  let failed = 0;

  try {
    const allResults = await fetchAppsBySearch(searchTerm, maxItems);

    // Filter to only include actual iOS apps (not podcasts, books, songs, etc.)
    const apps = allResults.filter(app => {
      const kind = app.kind || app.wrapperType;
      const url = app.trackViewUrl || app.url || '';
      // Must be software AND have an apps.apple.com URL
      const isSoftware = kind === 'software' || kind === 'iosSoftware' || kind === 'macSoftware';
      const isAppStoreUrl = url.includes('apps.apple.com');
      return isSoftware && isAppStoreUrl;
    });

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

/**
 * Bulk ingest from multiple categories
 */
export async function ingestFromAllCategories(
  appsPerCategory = 50
): Promise<{ total: number; success: number; failed: number }> {
  console.log('\n🚀 Starting bulk ingestion from all categories\n');

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

