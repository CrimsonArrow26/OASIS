import { USE_LIVE_DATA, WS } from '../config/dataConfig.ts';
import { MockAdapter } from './adapters/MockAdapter.ts';
import { AISAdapter } from './adapters/AISAdapter.ts';
import { SARAdapter } from './adapters/SARAdapter.ts';
import { DriftAdapter } from './adapters/DriftAdapter.ts';
import { Incident, VesselSuspect, VesselTrack, SARMetadata, LiveVesselPosition } from '../types.ts';

class DataServiceClass {
  private aisAdapter: AISAdapter;
  private isLive = USE_LIVE_DATA;

  constructor() {
    this.aisAdapter = new AISAdapter();
  }

  public getIsLive(): boolean {
    return this.isLive;
  }

  public setLiveMode(val: boolean): void {
    this.isLive = val;
  }

  async getIncidents(): Promise<Incident[]> {
    if (this.isLive) {
      try {
        const response = await fetch('/api/incidents');
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Live incident fetch failed, falling back to mock adapter', e);
      }
    }
    return MockAdapter.getIncidents();
  }

  async getVesselSuspects(incidentId: string): Promise<VesselSuspect[]> {
    if (this.isLive) {
      try {
        const response = await fetch(`/api/vessels?incidentId=${encodeURIComponent(incidentId)}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Live suspects fetch failed, falling back to mock adapter', e);
      }
    }
    return MockAdapter.getVesselSuspects(incidentId);
  }

  async getVesselTracks(incidentId?: string, windowHours: number = 48): Promise<VesselTrack[]> {
    if (this.isLive) {
      try {
        const response = await fetch(`/api/tracks?incidentId=${encodeURIComponent(incidentId || '')}&windowHours=${windowHours}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('Live tracks fetch failed, falling back to mock adapter', e);
      }
    }
    return MockAdapter.getVesselTracks(incidentId);
  }

  async getDrift(incidentId: string): Promise<any> {
    if (this.isLive) {
      return DriftAdapter.getDrift(incidentId);
    }
    return MockAdapter.getDrift(incidentId);
  }

  async getSARMetadata(incidentId: string): Promise<SARMetadata | null> {
    if (this.isLive) {
      return SARAdapter.getMetadata(incidentId);
    }
    return MockAdapter.getSARMetadata(incidentId);
  }

  connectAISStream(
    boundingBox: [[number, number], [number, number]] = WS.AIS_BOUNDING_BOX as any,
    onMessage: (msg: LiveVesselPosition) => void,
    onError?: (err: any) => void
  ): () => void {
    if (this.isLive) {
      this.aisAdapter.connectWebSocket(boundingBox, onMessage, onError);
    } else {
      // In mock mode, simulate realistic live telemetry stream around Gulf of Mexico
      const demoVessels = [
        { mmsi: '636019842', name: 'MV NORDIC TITAN', type: 'CRUDE TANKER', lat: 28.350, lon: -89.270, spd: 11.4, cog: 58 },
        { mmsi: '538007231', name: 'SEAWAY PIONEER', type: 'CHEM TANKER', lat: 28.240, lon: -89.440, spd: 13.0, cog: 312 },
        { mmsi: '244710000', name: 'ATLANTIC TRADER', type: 'BULK CARRIER', lat: 28.210, lon: -89.370, spd: 9.8, cog: 125 },
        { mmsi: '352001890', name: 'PACIFIC VOYAGER', type: 'CONTAINER', lat: 28.220, lon: -89.370, spd: 16.1, cog: 30 },
        { mmsi: '367112000', name: 'GULF GUARDIAN (USCG)', type: 'PATROL CUTTER', lat: 28.310, lon: -89.410, spd: 22.4, cog: 145 },
      ];

      const interval = setInterval(() => {
        const v = demoVessels[Math.floor(Math.random() * demoVessels.length)];
        const jitterLat = (Math.random() - 0.5) * 0.002;
        const jitterLon = (Math.random() - 0.5) * 0.002;
        onMessage({
          mmsi: v.mmsi,
          vesselName: v.name,
          vesselType: v.type,
          lat: v.lat + jitterLat,
          lon: v.lon + jitterLon,
          speed: +(v.spd + (Math.random() - 0.5) * 0.3).toFixed(1),
          course: (v.cog + Math.floor((Math.random() - 0.5) * 4)) % 360,
          timestamp: new Date().toISOString(),
        });
      }, 1500);

      return () => clearInterval(interval);
    }

    return () => this.disconnectAISStream();
  }

  disconnectAISStream(): void {
    this.aisAdapter.disconnect();
  }
}

export const DataService = new DataServiceClass();
export default DataService;
