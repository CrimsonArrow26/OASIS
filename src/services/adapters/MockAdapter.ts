import incidentsData from '../../mock/incidents.json';
import vesselsData from '../../mock/vessels.json';
import tracksData from '../../mock/tracks.json';
import driftData from '../../mock/drift.json';
import sarMetadataData from '../../mock/sar-metadata.json';
import { Incident, VesselSuspect, VesselTrack, SARMetadata } from '../../types.ts';

export class MockAdapter {
  static async getIncidents(): Promise<Incident[]> {
    // Return structured incidents matching PRD schema
    return incidentsData as unknown as Incident[];
  }

  static async getVesselSuspects(incidentId: string): Promise<VesselSuspect[]> {
    const list = vesselsData as unknown as VesselSuspect[];
    return list.filter((v) => v.incidentId === incidentId);
  }

  static async getVesselTracks(incidentId?: string): Promise<VesselTrack[]> {
    const tracks = tracksData as unknown as VesselTrack[];
    if (!incidentId) return tracks;
    const filtered = tracks.filter((t) => !t.incidentId || t.incidentId === incidentId);
    return filtered.length > 0 ? filtered : tracks;
  }

  static async getDrift(incidentId: string): Promise<any> {
    const map = driftData as Record<string, any>;
    return map[incidentId] || null;
  }

  static async getSARMetadata(incidentId: string): Promise<SARMetadata | null> {
    const map = sarMetadataData as Record<string, SARMetadata>;
    return map[incidentId] || null;
  }
}
