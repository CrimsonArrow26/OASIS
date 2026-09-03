import { useEffect, useState } from 'react';
import DataService from '../services/DataService.ts';

export function useDrift(incidentId: string | null) {
  const [drift, setDrift] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incidentId) return;

    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await DataService.getDrift(incidentId);
        if (mounted) setDrift(data);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load drift prediction');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [incidentId]);

  return { drift, loading, error };
}

export default useDrift;
