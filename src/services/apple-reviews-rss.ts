/**
 * Apple iTunes RSS Feed for App Store Reviews
 * This is a FREE, official API from Apple for fetching app reviews
 * 
 * Endpoint format:
 * https://itunes.apple.com/{country}/rss/customerreviews/id={appId}/sortby={sort}/json
 * 
 * Limitations:
 * - Returns up to 50 reviews per page
 * - Up to 10 pages available per country (500 reviews total per country)
 */

interface iTunesReviewEntry {
    author: {
        uri: { label: string };
        name: { label: string };
        label: string;
    };
    'im:version': { label: string };
    'im:rating': { label: string };
    id: { label: string };
    title: { label: string };
    content: { label: string };
    link: { attributes: { href: string } };
    updated: { label: string };
}

interface iTunesReviewFeed {
    feed: {
        entry?: iTunesReviewEntry[];
        link?: Array<{ attributes: { rel: string; href: string } }>;
        'im:name'?: { label: string }; // Exists on some pages, we use it to identify app info entries
    };
}

export interface ReviewResult {
    id: string;
    author: string;
    authorUrl: string;
    version: string;
    rating: number;
    title: string;
    text: string;
    url: string;
    date: string;
    country: string;
}

/**
 * Fetch reviews for an app using Apple's free RSS feed
 */
export async function fetchAppReviewsFromRSS(
    appStoreId: string,
    country = 'us',
    maxReviews = 100,
    sortBy: 'mostrecent' | 'mosthelpful' = 'mostrecent'
): Promise<ReviewResult[]> {
    const reviews: ReviewResult[] = [];
    const maxPages = Math.min(10, Math.ceil(maxReviews / 50)); // Max 10 pages, 50 per page

    for (let page = 1; page <= maxPages; page++) {
        if (reviews.length >= maxReviews) break;

        const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appStoreId}/sortby=${sortBy}/json`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                },
                next: { revalidate: 3600 }, // Cache for 1 hour
            });

            if (!response.ok) {
                if (response.status !== 404) {
                    console.log(`  Page ${page} (${country}): HTTP ${response.status}`);
                }
                break;
            }

            const data: iTunesReviewFeed = await response.json();

            if (!data.feed?.entry || (Array.isArray(data.feed.entry) && data.feed.entry.length === 0)) {
                // Not really an error, just no more reviews
                break;
            }

            const entries = Array.isArray(data.feed.entry) ? data.feed.entry : [data.feed.entry];

            for (const entry of entries) {
                // Skip the app info entry (usually the first one if not using page=1 correctly, 
                // but Apple's JSON format sometimes includes it)
                if ((entry as any)['im:name']) continue;

                if (reviews.length >= maxReviews) break;

                reviews.push({
                    id: entry.id?.label || String(Math.random()),
                    author: entry.author?.name?.label || 'Anonymous',
                    authorUrl: entry.author?.uri?.label || '',
                    version: entry['im:version']?.label || '',
                    rating: parseInt(entry['im:rating']?.label || '0', 10),
                    title: entry.title?.label || '',
                    text: entry.content?.label || '',
                    url: entry.link?.attributes?.href || '',
                    date: entry.updated?.label || new Date().toISOString(),
                    country,
                });
            }

            // Small delay to be nice to Apple's servers
            await new Promise(r => setTimeout(r, 100));

        } catch (error) {
            console.error(`  Error fetching page ${page} (${country}):`, error);
            break;
        }
    }

    return reviews;
}

/**
 * Fetch reviews from multiple countries for a single app
 */
export async function fetchAppReviewsMultiCountry(
    appStoreId: string,
    countries = ['us', 'gb', 'ca', 'au', 'de', 'fr', 'es', 'it', 'br', 'in', 'jp'],
    maxPerCountry = 50
): Promise<ReviewResult[]> {
    const allReviews: ReviewResult[] = [];
    const seenIds = new Set<string>();

    for (const country of countries) {
        const countryReviews = await fetchAppReviewsFromRSS(appStoreId, country, maxPerCountry);

        for (const review of countryReviews) {
            if (!seenIds.has(review.id)) {
                allReviews.push(review);
                seenIds.add(review.id);
            }
        }

        // Delay between countries
        await new Promise(r => setTimeout(r, 300));
    }

    return allReviews;
}

/**
 * Batch fetch reviews for multiple apps
 */
export async function fetchReviewsForApps(
    apps: Array<{ id: string; appStoreId: string; name: string }>,
    reviewsPerApp = 100,
    countries = ['us']
): Promise<Map<string, ReviewResult[]>> {
    const results = new Map<string, ReviewResult[]>();

    for (const app of apps) {
        console.log(`\nFetching reviews for: ${app.name}`);
        const reviews = await fetchAppReviewsMultiCountry(app.appStoreId, countries, reviewsPerApp);
        results.set(app.id, reviews);

        // Delay between apps
        await new Promise(r => setTimeout(r, 500));
    }

    return results;
}
