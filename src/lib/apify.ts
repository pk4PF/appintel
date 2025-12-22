import { ApifyClient } from 'apify-client';

// Lazy initialization of Apify client
let apifyClient: ApifyClient | null = null;

function getApifyClient(): ApifyClient {
  if (!apifyClient) {
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      throw new Error('APIFY_API_TOKEN is not set in environment variables');
    }
    apifyClient = new ApifyClient({ token: apifyToken });
  }
  return apifyClient;
}

// Actor IDs for App Store scraping
export const ACTORS = {
  APP_STORE_SCRAPER: 'epctex/appstore-scraper', // Main scraper for app data and reviews
} as const;

// Types for Apify actor inputs/outputs
export interface AppStoreScraperInput {
  country?: string;
  startUrls?: { url: string }[];
  searchTerms?: string[];
  categoryUrls?: string[];
  maxItems?: number;
  proxy?: {
    useApifyProxy: boolean;
  };
}

export interface AppStoreAppResult {
  // iTunes API fields (what the actor actually returns)
  trackId?: number;
  collectionId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  wrapperType?: string;
  kind?: string;
  artworkUrl100?: string;
  artworkUrl512?: string;
  artworkUrl60?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  price?: number;
  formattedPrice?: string;
  releaseDate?: string;
  currentVersionReleaseDate?: string;
  description?: string;
  screenshotUrls?: string[];
  ipadScreenshotUrls?: string[];
  supportedDevices?: string[];
  contentAdvisoryRating?: string;
  primaryGenreName?: string;
  genres?: string[];
  languageCodesISO2A?: string[];
  fileSizeBytes?: string;
  minimumOsVersion?: string;
  trackViewUrl?: string;
  collectionViewUrl?: string;
  artistViewUrl?: string;
  version?: string;
  // Legacy fields (for compatibility and fallbacks)
  id?: string;
  appId?: string;
  title?: string;
  url?: string;
  icon?: string;
  developer?: string;
  developerId?: string;
  score?: number;
  reviewsCount?: number;
  free?: boolean;
  currency?: string;
  size?: string;
  requiredOsVersion?: string;
  released?: string;
  updated?: string;
  languages?: string[];
  contentRating?: string;
}

/**
 * Run an Apify actor and wait for results
 */
export async function runActor<T>(
  actorId: string,
  input: Record<string, unknown>
): Promise<T[]> {
  const client = getApifyClient();

  console.log(`Running actor: ${actorId}`);

  const run = await client.actor(actorId).call(input);

  console.log(`Actor run finished. Status: ${run.status}`);

  if (run.status !== 'SUCCEEDED') {
    throw new Error(`Actor run failed with status: ${run.status}`);
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  console.log(`Retrieved ${items.length} items from dataset`);

  return items as T[];
}

/**
 * Fetch apps from a category
 */
export async function fetchAppsByCategory(
  categoryUrl: string,
  maxItems = 100,
  country = 'us'
): Promise<AppStoreAppResult[]> {
  return runActor<AppStoreAppResult>(ACTORS.APP_STORE_SCRAPER, {
    country,
    startUrls: [categoryUrl], // Actor expects array of URL strings
    maxItems,
    proxy: {
      useApifyProxy: true,
    },
  });
}

/**
 * Fetch apps by search term
 */
export async function fetchAppsBySearch(
  searchTerm: string,
  maxItems = 50,
  country = 'us'
): Promise<AppStoreAppResult[]> {
  return runActor<AppStoreAppResult>(ACTORS.APP_STORE_SCRAPER, {
    country,
    term: searchTerm,
    mode: 'search',
    mediaType: 'software', // Only get iOS apps, not podcasts/books/movies
    maxItems,
    proxy: {
      useApifyProxy: true,
    },
  });
}

/**
 * Fetch app details by URL
 */
export async function fetchAppDetails(
  appUrls: string[],
  country = 'us'
): Promise<AppStoreAppResult[]> {
  return runActor<AppStoreAppResult>(ACTORS.APP_STORE_SCRAPER, {
    country,
    startUrls: appUrls, // Actor expects array of URL strings
    proxy: {
      useApifyProxy: true,
    },
  });
}

// iOS App Store category URLs
export const CATEGORY_URLS = {
  productivity: 'https://apps.apple.com/us/charts/iphone/productivity-apps/6007',
  utilities: 'https://apps.apple.com/us/charts/iphone/utilities-apps/6002',
  'health-fitness': 'https://apps.apple.com/us/charts/iphone/health-fitness-apps/6013',
  finance: 'https://apps.apple.com/us/charts/iphone/finance-apps/6015',
  lifestyle: 'https://apps.apple.com/us/charts/iphone/lifestyle-apps/6012',
  'photo-video': 'https://apps.apple.com/us/charts/iphone/photo-video-apps/6008',
  education: 'https://apps.apple.com/us/charts/iphone/education-apps/6017',
  entertainment: 'https://apps.apple.com/us/charts/iphone/entertainment-apps/6016',
  'social-networking': 'https://apps.apple.com/us/charts/iphone/social-networking-apps/6005',
  shopping: 'https://apps.apple.com/us/charts/iphone/shopping-apps/6024',
  'food-drink': 'https://apps.apple.com/us/charts/iphone/food-drink-apps/6023',
  travel: 'https://apps.apple.com/us/charts/iphone/travel-apps/6003',
  business: 'https://apps.apple.com/us/charts/iphone/business-apps/6000',
  news: 'https://apps.apple.com/us/charts/iphone/news-apps/6009',
  weather: 'https://apps.apple.com/us/charts/iphone/weather-apps/6001',
} as const;

export type CategorySlug = keyof typeof CATEGORY_URLS;

