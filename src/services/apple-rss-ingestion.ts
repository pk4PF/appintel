
import { getServerClient } from '@/lib/supabase';
import { AppInsert, AppMetricsInsert, Category } from '@/types/database';

interface RSSAppEntry {
    'im:name': { label: string };
    'im:image': { label: string; attributes: { height: string } }[];
    summary: { label: string };
    'im:price': { label: string; attributes: { amount: string; currency: string } };
    'im:contentType': { attributes: { term: string; label: string } };
    rights: { label: string };
    title: { label: string };
    link: { attributes: { rel: string; type: string; href: string } } | { attributes: { rel: string; type: string; href: string } }[];
    id: { label: string; attributes: { 'im:id': string; 'im:bundleId': string } };
    'im:artist': { label: string; attributes: { href: string } };
    category: { attributes: { 'im:id': string; term: string; scheme: string; label: string } };
    'im:releaseDate': { label: string; attributes: { label: string } };
}

interface RSSFeedResponse {
    feed: {
        entry: RSSAppEntry[];
        updated: { label: string };
        rights: { label: string };
        title: { label: string };
        icon: { label: string };
        link: { attributes: { rel: string; type: string; href: string } }[];
        id: { label: string };
    };
}

const GENRE_IDS: Record<string, string> = {
    'medical': '6020',
    'health-fitness': '6013',
    'productivity': '6007',
    'utilities': '6002',
    'finance': '6015',
    'lifestyle': '6012',
    'photo-video': '6008',
    'education': '6017',
    'entertainment': '6016',
    'social-networking': '6005',
    'shopping': '6024',
    'business': '6000',
    'news': '6009',
    'weather': '6001',
    'food-drink': '6023',
    'travel': '6003'
};

async function getCategoryBySlug(slug: string): Promise<Category | null> {
    const supabase = getServerClient();
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();
    if (error) return null;
    return data;
}

export async function fetchAppsByCategoryRSS(categorySlug: string, limit = 100, country = 'us'): Promise<{ success: number; failed: number }> {
    const genreId = GENRE_IDS[categorySlug];
    if (!genreId) {
        console.error(`Unknown category slug: ${categorySlug}`);
        return { success: 0, failed: 0 };
    }

    console.log(`\n📱 Fetching RSS for category: ${categorySlug} (Genre: ${genreId})...`);

    // Fetch Top Free (most volume) and Top Paid if needed. Let's start with Top Free.
    // Limit max is usually 200 for RSS.
    const url = `https://itunes.apple.com/${country}/rss/topfreeapplications/limit=${limit}/genre=${genreId}/json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: RSSFeedResponse = await response.json();
        const entries = data.feed.entry || [];

        console.log(`Found ${entries.length} apps via RSS.`);

        const category = await getCategoryBySlug(categorySlug);
        const categoryId = category?.id || null;

        let success = 0;
        let failed = 0;
        const supabase = getServerClient();

        for (const entry of entries) {
            try {
                // Parse Entry
                const appStoreId = entry.id.attributes['im:id'];
                const name = entry['im:name'].label;
                const developer = entry['im:artist'].label;
                const description = entry.summary?.label || '';
                const priceStr = entry['im:price'].attributes.amount;
                const price = parseFloat(priceStr);
                const currency = entry['im:price'].attributes.currency;
                const releaseDate = entry['im:releaseDate'].label;
                const icon = entry['im:image'][entry['im:image'].length - 1].label; // Largest icon

                // Find URL
                let appUrl = '';
                if (Array.isArray(entry.link)) {
                    appUrl = entry.link.find(l => l.attributes.type === 'text/html')?.attributes.href || entry.link[0].attributes.href;
                } else if (entry.link) {
                    appUrl = entry.link.attributes.href;
                }

                const appData: AppInsert = {
                    app_store_id: appStoreId,
                    name: name,
                    developer_name: developer,
                    description: description,
                    short_description: description.substring(0, 200),
                    icon_url: icon,
                    price: price,
                    currency: currency,
                    pricing_model: price > 0 ? 'paid' : 'free',
                    category_id: categoryId,
                    release_date: releaseDate,
                    url: appUrl,
                    // Missing fields in RSS
                    last_updated: new Date().toISOString(), // Fallback
                    languages: [],
                    size_bytes: null,
                    minimum_os_version: null,
                    content_rating: null,
                    // screenshots: null,
                    // ipad_screenshots: null,
                };

                // Upsert App
                const { data: app, error: appError } = await supabase
                    .from('apps')
                    .upsert(appData, { onConflict: 'app_store_id' })
                    .select('id')
                    .single();

                if (appError) {
                    console.error(`Error inserting ${name}:`, appError.message);
                    failed++;
                    continue;
                }

                // Insert Metrics (Placeholder for rating derived from reviews later? RSS feed doesn't have rating count usually)
                // Actually some RSS feeds have it, but this standard one might not.
                // We'll insert a basic metrics entry so the app shows up.
                const today = new Date().toISOString().split('T')[0];

                await supabase.from('app_metrics').upsert({
                    app_id: app.id,
                    date: today,
                    rating: null, // We don't have it from this RSS
                    rating_count: null,
                    review_count: null,
                    downloads_estimate: null
                }, { onConflict: 'app_id,date' });

                success++;
                process.stdout.write('.'); // Dot progress

            } catch (e: any) {
                failed++;
            }
        }
        console.log(`\nCategory ${categorySlug}: ${success} success, ${failed} failed`);
        return { success, failed };

    } catch (error) {
        console.error(`Error fetching RSS for ${categorySlug}:`, error);
        return { success: 0, failed: 0 };
    }
}
