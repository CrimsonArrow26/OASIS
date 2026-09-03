import axios from 'axios';
import { API, WS } from '../../config/dataConfig.ts';
import { LiveVesselPosition, VesselTrack } from '../../types.ts';

export class AISAdapter {
  private socket: WebSocket | null = null;
  private reconnectTimer: any = null;

  static async getTracks(incidentId?: string): Promise<VesselTrack[]> {
    try {
      const res = await axios.get(API.TRACKS, { params: { incidentId } });
      return res.data;
    } catch {
      return [];
    }
  }

  connectWebSocket(
    boundingBox: [[number, number], [number, number]],
    onPosition: (pos: LiveVesselPosition) => void,
    onError?: (err: any) => void
  ): void {
    if (this.socket) {
      this.socket.close();
    }

    try {
      this.socket = new WebSocket(WS.AIS_STREAM);

      this.socket.onopen = () => {
        const subMessage = {
          APIKey: WS.AIS_API_KEY,
          BoundingBoxes: [boundingBox],
          FilterMessageTypes: ['PositionReport'],
        };
        this.socket?.send(JSON.stringify(subMessage));
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.MessageType === 'PositionReport') {
            const report = data.Message.PositionReport;
            const meta = data.MetaData;
            onPosition({
              mmsi: String(meta.MMSI),
              vesselName: meta.ShipName?.trim() || 'UNKNOWN',
              vesselType: 'CARGO',
              lat: report.Latitude,
              lon: report.Longitude,
              speed: report.Sog,
              course: report.Cog,
              timestamp: meta.time_utc,
            });
          }
        } catch (e) {
          onError?.(e);
        }
      };

      this.socket.onerror = (e) => {
        onError?.(e);
      };
    } catch (e) {
      onError?.(e);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
