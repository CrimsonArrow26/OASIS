import { useEffect, useState } from 'react';
import DataService from '../services/DataService.ts';
import useAppStore from '../store/useAppStore.ts';
import { Incident } from '../types.ts';

export function useIncidents() {
  const { incidents, setIncidents, selectedIncidentId, selectIncident } = useAppStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const data = await DataService.getIncidents();
        if (mounted) {
          setIncidents(data);
          if (data.length > 0 && !selectedIncidentId) {
            selectIncident(data[0].id);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load incidents');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [setIncidents, selectedIncidentId, selectIncident]);

  const selectedIncident = incidents.find((inc) => inc.id === selectedIncidentId) || null;

  return { incidents, selectedIncident, loading, error };
}

export default useIncidents;
