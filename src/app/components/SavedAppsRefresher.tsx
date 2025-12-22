'use client';

import { useEffect, useCallback } from 'react';
import { getAppsNeedingRefresh, addSnapshot, getSavedApp } from '@/lib/savedApps';

const REFRESH_CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour

export default function SavedAppsRefresher() {
  const refreshApp = useCallback(async (appId: string) => {
    try {
      const response = await fetch(`/api/apps/${appId}`);
      if (!response.ok) return false;
      
      const data = await response.json();
      const app = data.app;
      
      if (!app) return false;
      
      // Get the latest metrics
      const metrics = app.app_metrics?.[0];
      const opportunityScore = app.opportunity_scores?.[0]?.score;
      
      // Add new snapshot
      addSnapshot(appId, {
        rating: metrics?.rating ?? null,
        ratingCount: metrics?.rating_count ?? null,
        downloadsEstimate: metrics?.downloads_estimate ?? null,
        revenueEstimate: metrics?.revenue_estimate ?? null,
        opportunityScore: opportunityScore ?? null,
      });
      
      console.log(`[SavedAppsRefresher] Refreshed app: ${app.name}`);
      return true;
    } catch (error) {
      console.error(`[SavedAppsRefresher] Error refreshing app ${appId}:`, error);
      return false;
    }
  }, []);

  const checkAndRefresh = useCallback(async () => {
    const appsToRefresh = getAppsNeedingRefresh();
    
    if (appsToRefresh.length === 0) {
      return;
    }
    
    console.log(`[SavedAppsRefresher] Found ${appsToRefresh.length} apps needing refresh`);
    
    // Refresh apps one at a time with a delay to avoid overwhelming the API
    for (const app of appsToRefresh) {
      await refreshApp(app.id);
      // Wait 2 seconds between refreshes
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }, [refreshApp]);

  useEffect(() => {
    // Initial check after a short delay (let page load first)
    const initialTimeout = setTimeout(() => {
      checkAndRefresh();
    }, 10000); // 10 seconds after mount

    // Set up periodic checks
    const interval = setInterval(() => {
      checkAndRefresh();
    }, REFRESH_CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [checkAndRefresh]);

  // This component doesn't render anything
  return null;
}






