import axios from 'axios';
import { API } from '../../config/dataConfig.ts';
import { SARMetadata } from '../../types.ts';

export class SARAdapter {
  static async getMetadata(incidentId: string): Promise<SARMetadata | null> {
    try {
      const res = await axios.get(`${API.SAR_METADATA}/${incidentId}`);
      return res.data;
    } catch {
      return null;
    }
  }

  static getImageUrl(incidentId: string): string {
    return `${API.SAR_IMAGE}/${incidentId}`;
  }
}
