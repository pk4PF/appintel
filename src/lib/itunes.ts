/**
 * iTunes Search API Client - FREE, no API key required!
 * 
 * Apple's official API for searching the App Store.
 * Docs: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 */

export interface iTunesApp {
    trackId: number;
    trackName: string;
    bundleId?: string;
    artistName: string;
    artistId?: number;
    artworkUrl60?: string;
    artworkUrl100?: string;
    artworkUrl512?: string;
    averageUserRating?: number;
    averageUserRatingForCurrentVersion?: number;
    userRatingCount?: number;
    userRatingCountForCurrentVersion?: number;
    price: number;
    formattedPrice?: string;
    currency?: string;
    releaseDate?: string;
    currentVersionReleaseDate?: string;
    description?: string;
    version?: string;
    primaryGenreName?: string;
    primaryGenreId?: number;
    genres?: string[];
    genreIds?: string[];
    trackViewUrl?: string;
    sellerUrl?: string;
    fileSizeBytes?: string;
    minimumOsVersion?: string;
    supportedDevices?: string[];
    screenshotUrls?: string[];
    ipadScreenshotUrls?: string[];
    contentAdvisoryRating?: string;
    languageCodesISO2A?: string[];
    trackContentRating?: string;
}

interface iTunesSearchResponse {
    resultCount: number;
    results: iTunesApp[];
}

/**
 * Search for iOS apps using Apple's iTunes Search API (FREE!)
 */
export async function searchApps(
    term: string,
    limit = 50,
    country = 'us'
): Promise<iTunesApp[]> {
    const url = new URL('https://itunes.apple.com/search');
    url.searchParams.set('term', term);
    url.searchParams.set('country', country);
    url.searchParams.set('media', 'software');
    url.searchParams.set('entity', 'software');
    url.searchParams.set('limit', Math.min(limit, 200).toString());

    console.log(`  📡 Fetching from iTunes API: ${term}`);

    const response = await fetch(url.toString(), {
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status} ${response.statusText}`);
    }

    const data: iTunesSearchResponse = await response.json();
    console.log(`  ✓ Found ${data.resultCount} apps`);

    return data.results;
}

/**
 * Look up an app by its App Store ID
 */
export async function lookupApp(
    appId: string | number,
    country = 'us'
): Promise<iTunesApp | null> {
    const url = new URL('https://itunes.apple.com/lookup');
    url.searchParams.set('id', appId.toString());
    url.searchParams.set('country', country);

    const response = await fetch(url.toString(), {
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status} ${response.statusText}`);
    }

    const data: iTunesSearchResponse = await response.json();
    return data.results[0] || null;
}

/**
 * Look up multiple apps by their App Store IDs (max 200)
 */
export async function lookupApps(
    appIds: (string | number)[],
    country = 'us'
): Promise<iTunesApp[]> {
    if (appIds.length === 0) return [];
    if (appIds.length > 200) {
        console.warn('iTunes lookup limited to 200 IDs, truncating...');
        appIds = appIds.slice(0, 200);
    }

    const url = new URL('https://itunes.apple.com/lookup');
    url.searchParams.set('id', appIds.join(','));
    url.searchParams.set('country', country);

    const response = await fetch(url.toString(), {
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status} ${response.statusText}`);
    }

    const data: iTunesSearchResponse = await response.json();
    return data.results;
}
