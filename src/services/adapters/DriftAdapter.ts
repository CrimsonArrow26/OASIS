import axios from 'axios';
import { API } from '../../config/dataConfig.ts';

export class DriftAdapter {
  static async getDrift(incidentId: string): Promise<any> {
    try {
      const res = await axios.get(`${API.DRIFT}/${incidentId}`);
      return res.data;
    } catch {
      return null;
    }
  }
}
