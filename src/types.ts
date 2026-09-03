export type IncidentSeverity = 'critical' | 'high' | 'medium';
export type IncidentStatus = 'active' | 'resolved' | 'monitoring';

export interface IncidentGeometry {
  lengthKm: number;
  widthKm: number;
  orientationDeg: number;
  perimeterKm: number;
  polygonGeoJSON: {
    type: string;
    coordinates: number[][][];
  };
}

export interface IncidentDrift {
  originLat: number;
  originLon: number;
  originUncertaintyRadiusKm: number;
  hindcastPath: [number, number][]; // [lat, lon] array, past -> origin
  forecastPath: [number, number][]; // [lat, lon] array, origin -> future
  forecastUncertaintyCone: {
    type: string;
    coordinates: number[][][];
  };
  dominantCurrentDir: number; // degrees
  dominantWindDir: number;    // degrees
  estimatedAgeHours: number;
  surfaceCurrentKts?: number;
  localWindKts?: number;
  dischargeWindow?: string;
}

export interface Incident {
  id: string;                    // e.g. "OSP-2024-0047"
  name?: string;
  lat: number;                   // centroid latitude
  lon: number;                   // centroid longitude
  detectedAt: string;            // ISO 8601 UTC - satellite pass time
  estimatedOriginAt: string;     // ISO 8601 UTC - hindcast result
  severity: IncidentSeverity;
  confidenceScore: number;       // 0.0 - 1.0 (e.g. 0.946)
  areaKm2: number;               // detected slick area
  sarImageUrl: string;
  status: IncidentStatus;
  geometry: IncidentGeometry;
  drift: IncidentDrift;
  oilType?: string;              // "HEAVY FUEL/CRUDE"
}

export interface VesselSuspectScores {
  proximity: number;           // 0.0 - 1.0
  trajectory: number;
  aisGap: number;              // anomaly score
  vesselTypePrior: number;
  overall: number;             // weighted composite match e.g. 0.92
}

export interface VesselSuspect {
  incidentId: string;
  rank: number;                  // 1 = top suspect
  mmsi: string;                  // "636019842"
  vesselName: string;            // "MV NORDIC TITAN"
  vesselType: string;            // "CRUDE TANKER"
  flag: string;                  // "Liberia"
  imoNumber: string;
  speedKts: number;
  courseDeg: number;
  intersectOffset: string;       // "-02h 15m"
  scores: VesselSuspectScores;
  aisGapDetected: boolean;
  aisGapStart: string | null;
  aisGapEnd: string | null;
  aisGapDurationMinutes: number | null;
}

export interface TrackPoint {
  lat: number;
  lon: number;
  timestamp: string;           // ISO 8601
  speed: number;               // knots
  course: number;              // degrees
  status: string;              // "Under way" | "At anchor" | "Moored"
}

export interface VesselTrack {
  incidentId?: string;
  mmsi: string;
  vesselName: string;
  vesselType: string;
  points: TrackPoint[];
  trackColor: string;          // hex
}

export interface SARMetadata {
  incidentId: string;
  acquisitionDate: string;     // ISO 8601
  satellite: string;           // "Sentinel-1A"
  orbitNumber: number;
  polarization: string;        // "VV + VH (DUAL CROSS)"
  resolutionM: number;         // 10
  incidenceAngleDeg: number;   // 34.2
  processingLevel: string;     // "10m / PIXEL (IW GRD)"
  imageUrl: string;
  maskUrl?: string;
  backscatterDb: string;       // "-21.4 dB (ATTENUATED)"
  anomalyDesc: string;         // "[ANOMALY: ATTENUATED-VV]"
}

export interface LiveVesselPosition {
  mmsi: string;
  vesselName: string;
  vesselType: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  timestamp: string;
}

export interface MetoceanConditions {
  windKts: number;
  windDirDeg: number;
  windDirCardinal: string;
  windGustsKts: number;
  currentKts: number;
  currentDirDeg: number;
  currentDirCardinal: string;
  seaSurfaceTempC: number;
  waveHeightM: number;
}

export type TidalPhase = 'FLOOD' | 'EBB' | 'HIGH SLACK' | 'LOW SLACK';

export interface TidalCurrentPoint {
  time: string;
  hourLabel: string;
  tidalVelocitySigned: number;
  tidalSpeedKts: number;
  tidalBearingDeg: number;
  oceanCurrentKts: number;
  netDriftKts: number;
  phase: 'FLOOD' | 'EBB' | 'SLACK';
}

export interface WindyMarineData {
  source: string;
  coordinates: { lat: number; lon: number };
  timestamp: string;
  surfaceCurrent: {
    speedKts: number;
    speedMps: number;
    directionDeg: number;
    directionCardinal: string;
    seaSurfaceTempC: number;
    waveHeightM: number;
  };
  tidalCurrent: {
    phase: TidalPhase;
    description: string;
    speedKts: number;
    speedMps: number;
    streamBearingDeg: number;
    isFlood: boolean;
    minutesToNextSlack: number;
    tidalRangeM: number;
    constituentM2: string;
    floodAxisDeg: number;
    ebbAxisDeg: number;
  };
  windDrag: {
    windSpeedKts: number;
    windDirDeg: number;
    stokesDriftKts: number;
    stokesDirDeg: number;
  };
  combinedHydrodynamicDrift: {
    netSpeedKts: number;
    netBearingDeg: number;
    driftClassification: string;
  };
  forecastTimeline: TidalCurrentPoint[];
  embedConfig: {
    keyMasked: string;
    overlay: string;
    product: string;
    lat: number;
    lon: number;
  };
}
