// ─────────────────────────────────────────────────────────────────
// INTEGRATION TOGGLE
// Set USE_LIVE_DATA = true when real sources or live server are ready.
// ─────────────────────────────────────────────────────────────────
export const USE_LIVE_DATA = false;

// API endpoints (exposes local backend or external endpoints)
export const API = {
  INCIDENTS: '/api/incidents',
  DRIFT: '/api/drift',
  SAR_METADATA: '/api/sar',
  SAR_IMAGE: '/api/sar/image',
  VESSELS: '/api/vessels',
  TRACKS: '/api/tracks',
  DISPATCH: '/api/dispatch',
  EVIDENCE: '/api/evidence',
};

// WebSocket endpoints
export const WS = {
  AIS_STREAM: 'wss://stream.aisstream.io/v0/stream',
  AIS_API_KEY: 'DEMO_KEY',
  AIS_BOUNDING_BOX: [[0, 50], [30, 100]],
};

// Map config
export const MAP = {
  TILE_URL: 'https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=YOUR_KEY',
  WINDY_API_KEY: 'YOUR_WINDY_KEY_HERE',
  DEFAULT_CENTER: [28.236, -89.379] as [number, number],
  DEFAULT_ZOOM: 11.4,
};

// Timeline config
export const TIMELINE = {
  WINDOW_HOURS: 48,
  SPEED_OPTIONS: [0.5, 1, 2, 5, 10],
};
