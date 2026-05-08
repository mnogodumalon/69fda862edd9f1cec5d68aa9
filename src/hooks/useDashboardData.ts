import { useState, useEffect, useMemo, useCallback } from 'react';
import type { GluehweinErlebnis } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [gluehweinErlebnis, setGluehweinErlebnis] = useState<GluehweinErlebnis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [gluehweinErlebnisData] = await Promise.all([
        LivingAppsService.getGluehweinErlebnis(),
      ]);
      setGluehweinErlebnis(gluehweinErlebnisData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [gluehweinErlebnisData] = await Promise.all([
          LivingAppsService.getGluehweinErlebnis(),
        ]);
        setGluehweinErlebnis(gluehweinErlebnisData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  return { gluehweinErlebnis, setGluehweinErlebnis, loading, error, fetchAll };
}