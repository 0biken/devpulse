import { useEffect } from 'react';
import { fetchTab } from '../api';
import { sessionCache } from '../utils/cache';

export function useFeed(tabId, dispatch) {
  useEffect(() => {
    const fetchData = async (isBackground = false) => {
      // 1. Serve from cache immediately if available (Stale-While-Revalidate)
      if (!isBackground) {
        if (sessionCache.has(tabId)) {
          dispatch({ type: 'SET', tabId, items: sessionCache.get(tabId) });
        } else {
          dispatch({ type: 'LOADING', tabId });
        }
      }

      // 2. Fetch fresh data
      try {
        const items = await fetchTab(tabId);
        sessionCache.set(tabId, items);
        dispatch({ type: 'SET', tabId, items }); // Update UI with fresh data
      } catch (err) {
        // Only show error screen if it's not a background refresh AND we have no cached data
        if (!isBackground && !sessionCache.has(tabId)) {
          dispatch({ type: 'ERROR', tabId, error: err.message });
        } else {
          console.warn(`[DevPulse] Background refresh failed for ${tabId}:`, err);
        }
      }
    };

    // Initial fetch
    fetchData();

    // 3. Simulated Cron Job: Background polling every 5 minutes (300,000 ms)
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [tabId, dispatch]);
}
