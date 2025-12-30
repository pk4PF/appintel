/**
 * Saved Apps Store - localStorage-based persistence for tracking apps
 */

export interface AppSnapshot {
  date: string;
  rating: number | null;
  ratingCount: number | null;
  downloadsEstimate: number | null;
  revenueEstimate: number | null;
  opportunityScore: number | null;
}

export interface SavedApp {
  id: string;
  appStoreId: string;
  name: string;
  iconUrl: string | null;
  developerName: string | null;
  category: string | null;
  savedAt: string;
  lastRefresh: string;
  history: AppSnapshot[];
}

const STORAGE_KEY = 'app-gap-saved-apps';

/**
 * Get all saved apps from localStorage
 */
export function getSavedApps(): SavedApp[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading saved apps:', error);
    return [];
  }
}

/**
 * Save an app to the tracking list
 */
export function saveApp(app: {
  id: string;
  appStoreId: string;
  name: string;
  iconUrl: string | null;
  developerName: string | null;
  category: string | null;
  metrics?: {
    rating: number | null;
    ratingCount: number | null;
    downloadsEstimate: number | null;
    revenueEstimate: number | null;
  };
  opportunityScore?: number | null;
}): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const apps = getSavedApps();

    // Check if already saved
    if (apps.some(a => a.id === app.id)) {
      return false; // Already saved
    }

    const now = new Date().toISOString();

    // Create initial snapshot
    const initialSnapshot: AppSnapshot = {
      date: now,
      rating: app.metrics?.rating ?? null,
      ratingCount: app.metrics?.ratingCount ?? null,
      downloadsEstimate: app.metrics?.downloadsEstimate ?? null,
      revenueEstimate: app.metrics?.revenueEstimate ?? null,
      opportunityScore: app.opportunityScore ?? null,
    };

    const savedApp: SavedApp = {
      id: app.id,
      appStoreId: app.appStoreId,
      name: app.name,
      iconUrl: app.iconUrl,
      developerName: app.developerName,
      category: app.category,
      savedAt: now,
      lastRefresh: now,
      history: [initialSnapshot],
    };

    apps.push(savedApp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));

    return true;
  } catch (error) {
    console.error('Error saving app:', error);
    return false;
  }
}

/**
 * Remove an app from the tracking list
 */
export function unsaveApp(id: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const apps = getSavedApps();
    const filtered = apps.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing app:', error);
    return false;
  }
}

/**
 * Check if an app is saved
 */
export function isAppSaved(id: string): boolean {
  const apps = getSavedApps();
  return apps.some(a => a.id === id);
}

/**
 * Add a new snapshot to an app's history
 */
export function addSnapshot(id: string, snapshot: Omit<AppSnapshot, 'date'>): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const apps = getSavedApps();
    const appIndex = apps.findIndex(a => a.id === id);

    if (appIndex === -1) return false;

    const now = new Date().toISOString();

    apps[appIndex].history.push({
      ...snapshot,
      date: now,
    });
    apps[appIndex].lastRefresh = now;

    // Keep only last 90 days of history
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    apps[appIndex].history = apps[appIndex].history.filter(
      h => new Date(h.date) > ninetyDaysAgo
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    return true;
  } catch (error) {
    console.error('Error adding snapshot:', error);
    return false;
  }
}

/**
 * Get a specific saved app by ID
 */
export function getSavedApp(id: string): SavedApp | null {
  const apps = getSavedApps();
  return apps.find(a => a.id === id) || null;
}

/**
 * Get apps that need refresh (older than 24 hours)
 */
export function getAppsNeedingRefresh(): SavedApp[] {
  const apps = getSavedApps();
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  return apps.filter(app => new Date(app.lastRefresh) < twentyFourHoursAgo);
}

/**
 * Calculate trend for a metric over the history
 */
export function calculateTrend(
  app: SavedApp,
  metric: 'rating' | 'ratingCount' | 'downloadsEstimate' | 'opportunityScore'
): {
  direction: 'up' | 'down' | 'flat';
  change: number;
  percentChange: number;
} {
  const history = app.history;

  if (history.length < 2) {
    return { direction: 'flat', change: 0, percentChange: 0 };
  }

  const latest = history[history.length - 1][metric];
  const oldest = history[0][metric];

  if (latest === null || oldest === null || oldest === 0) {
    return { direction: 'flat', change: 0, percentChange: 0 };
  }

  const change = latest - oldest;
  const percentChange = (change / oldest) * 100;

  let direction: 'up' | 'down' | 'flat' = 'flat';
  if (percentChange > 1) direction = 'up';
  else if (percentChange < -1) direction = 'down';

  return {
    direction,
    change: Math.round(change * 100) / 100,
    percentChange: Math.round(percentChange * 100) / 100,
  };
}

/**
 * Export saved apps data as JSON
 */
export function exportSavedApps(): string {
  return JSON.stringify(getSavedApps(), null, 2);
}

/**
 * Import saved apps data from JSON
 */
export function importSavedApps(json: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error importing apps:', error);
    return false;
  }
}






