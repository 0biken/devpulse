import { useEffect } from 'react';
import { fetchTab } from '../api';
import { sessionCache } from '../utils/cache';

export function useFeed(tabId, dispatch) {
  useEffect(() => {
    if (sessionCache.has(tabId)) {
      dispatch({ type: 'SET', tabId, items: sessionCache.get(tabId) });
      return;
    }
    dispatch({ type: 'LOADING', tabId });
    fetchTab(tabId)
      .then(items => {
        sessionCache.set(tabId, items);
        dispatch({ type: 'SET', tabId, items });
      })
      .catch(err => {
        dispatch({ type: 'ERROR', tabId, error: err.message });
      });
  }, [tabId, dispatch]);
}
