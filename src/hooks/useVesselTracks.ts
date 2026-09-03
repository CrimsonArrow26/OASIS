import { useEffect, useState } from 'react';
import DataService from '../services/DataService.ts';
import useAppStore from '../store/useAppStore.ts';
import { VesselSuspect, VesselTrack } from '../types.ts';

export function useVesselTracks(incidentId: string | null) {
  const { vesselSuspects, vesselTracks, setVesselSuspects, setVesselTracks } = useAppStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incidentId) return;

    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [suspects, tracks] = await Promise.all([
          DataService.getVesselSuspects(incidentId),
          DataService.getVesselTracks(incidentId),
        ]);
        if (mounted) {
          setVesselSuspects(suspects);
          setVesselTracks(tracks);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load suspects and tracks');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [incidentId, setVesselSuspects, setVesselTracks]);

  return { vesselSuspects, vesselTracks, loading, error };
}

export default useVesselTracks;
