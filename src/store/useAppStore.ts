import { create } from 'zustand';
import { Incident, VesselSuspect, VesselTrack, LiveVesselPosition, MetoceanConditions, WindyMarineData } from '../types.ts';

interface AppState {
  // Theme state
  themeMode: 'dark' | 'daylight';
  setThemeMode: (mode: 'dark' | 'daylight') => void;
  toggleThemeMode: () => void;

  // Incident & Selection state
  incidents: Incident[];
  selectedIncidentId: string | null;
  isDetailPanelOpen: boolean;
  setIncidents: (incidents: Incident[]) => void;
  selectIncident: (id: string | null) => void;
  toggleDetailPanel: () => void;

  // Vessel / track state
  vesselSuspects: VesselSuspect[];
  vesselTracks: VesselTrack[];
  selectedVesselMmsi: string | null;
  setSelectedVesselMmsi: (mmsi: string | null) => void;
  setVesselSuspects: (vs: VesselSuspect[]) => void;
  setVesselTracks: (vt: VesselTrack[]) => void;

  // Live AIS
  liveVessels: Record<string, LiveVesselPosition>;
  updateLiveVessel: (position: LiveVesselPosition) => void;

  // Timeline state
  timelineWindow: { start: Date; end: Date };
  timelineCursor: Date;
  playbackState: 'playing' | 'paused';
  playbackSpeed: number;
  setTimelineCursor: (date: Date) => void;
  setTimelineWindow: (window: { start: Date; end: Date }) => void;
  setPlaybackState: (state: 'playing' | 'paused') => void;
  setPlaybackSpeed: (speed: number) => void;

  // Historical Replay & Date Range Modal
  isReplayModalOpen: boolean;
  setIsReplayModalOpen: (open: boolean) => void;
  activeReplayPresetTitle: string;
  setActiveReplayPresetTitle: (title: string) => void;

  // Map layer visibility
  activeMapLayers: string[];
  toggleMapLayer: (layerId: string) => void;
  setLayerState: (layerId: string, enabled: boolean) => void;
  mapBasemap: 'auto' | 'dark' | 'light' | 'satellite' | 'ocean' | 'streets' | 'windy';
  setMapBasemap: (basemap: 'auto' | 'dark' | 'light' | 'satellite' | 'ocean' | 'streets' | 'windy') => void;

  // Multi-Mode Map Display (Tactical, Windy Only, Split Stacked/Side-by-side)
  mapViewMode: 'tactical' | 'windy' | 'split';
  setMapViewMode: (mode: 'tactical' | 'windy' | 'split') => void;
  splitOrientation: 'stacked' | 'side-by-side'; // Windy below tactical vs side-by-side
  setSplitOrientation: (orientation: 'stacked' | 'side-by-side') => void;

  // Weather and Tactical Toggles
  weatherLayers: {
    currents: boolean;
    tidalCurrents: boolean;
    winds: boolean;
    streamlines: boolean;
    sst: boolean;
    bathy: boolean;
    sarOverlay: boolean;
    aisTracks: boolean;
  };
  toggleWeatherLayer: (layer: keyof AppState['weatherLayers']) => void;

  // Windy.com Marine Currents & Radar Modal State
  isWindyRadarOpen: boolean;
  setIsWindyRadarOpen: (open: boolean) => void;
  toggleWindyRadar: () => void;
  windyOverlay: 'currents' | 'waves' | 'wind';
  setWindyOverlay: (overlay: 'currents' | 'waves' | 'wind') => void;
  windyData: WindyMarineData | null;
  setWindyData: (data: WindyMarineData | null) => void;

  // Metocean data
  metocean: MetoceanConditions;
  setMetocean: (metocean: MetoceanConditions) => void;

  // Analysis Drawer State
  activeDriftTab: 'hindcast' | 'forecast';
  setActiveDriftTab: (tab: 'hindcast' | 'forecast') => void;
  dispatchAlert: { active: boolean; message: string; timestamp: string } | null;
  triggerDispatch: () => void;
  dismissDispatch: () => void;
  evidenceExported: boolean;
  triggerExportEvidence: () => void;

  // Connection & Telemetry status
  wsStatus: 'live' | 'reconnecting' | 'disconnected';
  setWsStatus: (status: 'live' | 'reconnecting' | 'disconnected') => void;
  msgRatePerSec: number;
  satelliteStatus: 'ACTIVE' | 'CALIBRATING' | 'STANDBY';
  modelStatus: 'READY' | 'COMPUTING' | 'SYNCED';
}

const defaultStart = new Date('2024-05-23T14:00:00Z');
const defaultEnd = new Date('2024-05-25T14:32:08Z');
const defaultCursor = new Date('2024-05-24T21:18:00Z'); // Selected incident origin

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
  themeMode: 'dark',
  setThemeMode: (mode) => set({ themeMode: mode }),
  toggleThemeMode: () => set((state) => ({ themeMode: state.themeMode === 'dark' ? 'daylight' : 'dark' })),

  // Incident & Selection state
  incidents: [],
  selectedIncidentId: 'OSP-2024-0051',
  isDetailPanelOpen: true,
  setIncidents: (incidents) => set({ incidents }),
  selectIncident: (id) =>
    set({
      selectedIncidentId: id,
      isDetailPanelOpen: id !== null,
    }),
  toggleDetailPanel: () =>
    set((state) => ({ isDetailPanelOpen: !state.isDetailPanelOpen })),

  // Vessel / track state
  vesselSuspects: [],
  vesselTracks: [],
  selectedVesselMmsi: null,
  setSelectedVesselMmsi: (mmsi) => set({ selectedVesselMmsi: mmsi }),
  setVesselSuspects: (vs) => set({ vesselSuspects: vs }),
  setVesselTracks: (vt) => set({ vesselTracks: vt }),

  // Live AIS
  liveVessels: {},
  updateLiveVessel: (position) =>
    set((state) => ({
      liveVessels: { ...state.liveVessels, [position.mmsi]: position },
    })),

  // Timeline state
  timelineWindow: { start: defaultStart, end: defaultEnd },
  timelineCursor: defaultCursor,
  playbackState: 'paused',
  playbackSpeed: 1,
  setTimelineCursor: (date) => set({ timelineCursor: date }),
  setTimelineWindow: (window) => set({ timelineWindow: window }),
  setPlaybackState: (state) => set({ playbackState: state }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  // Historical Replay & Date Range Modal
  isReplayModalOpen: false,
  setIsReplayModalOpen: (open) => set({ isReplayModalOpen: open }),
  activeReplayPresetTitle: 'Gulf Incident Window (48h)',
  setActiveReplayPresetTitle: (title) => set({ activeReplayPresetTitle: title }),

  // Map layer visibility
  activeMapLayers: ['spill-polygons', 'spill-pulse', 'vessel-tracks', 'drift-hindcast', 'radius-ring', 'live-vessels'],
  toggleMapLayer: (layerId) =>
    set((state) => ({
      activeMapLayers: state.activeMapLayers.includes(layerId)
        ? state.activeMapLayers.filter((l) => l !== layerId)
        : [...state.activeMapLayers, layerId],
    })),
  setLayerState: (layerId, enabled) =>
    set((state) => ({
      activeMapLayers: enabled
        ? Array.from(new Set([...state.activeMapLayers, layerId]))
        : state.activeMapLayers.filter((l) => l !== layerId),
    })),
  mapBasemap: 'satellite',
  setMapBasemap: (basemap) => set({ mapBasemap: basemap }),

  // Multi-Mode Map State Implementation
  mapViewMode: 'tactical',
  setMapViewMode: (mode) => set({ mapViewMode: mode }),
  splitOrientation: 'stacked',
  setSplitOrientation: (orientation) => set({ splitOrientation: orientation }),

  // Weather & Tactical controls
  weatherLayers: {
    currents: true,
    tidalCurrents: true,
    winds: false,
    streamlines: true,
    sst: false,
    bathy: false,
    sarOverlay: true,
    aisTracks: true,
  },
  toggleWeatherLayer: (layer) =>
    set((state) => {
      const nextLayers = { ...state.weatherLayers, [layer]: !state.weatherLayers[layer] };
      let overlay = state.windyOverlay;
      if (layer === 'currents' && nextLayers.currents) {
        overlay = 'currents';
        nextLayers.winds = false; // mutually exclusive for cleaner view
      } else if (layer === 'winds' && nextLayers.winds) {
        overlay = 'wind';
        nextLayers.currents = false;
      }
      return {
        weatherLayers: nextLayers,
        windyOverlay: overlay,
      };
    }),

  // Windy.com Marine Currents & Radar Modal
  isWindyRadarOpen: false,
  setIsWindyRadarOpen: (open) => set({ isWindyRadarOpen: open }),
  toggleWindyRadar: () => set((state) => ({ isWindyRadarOpen: !state.isWindyRadarOpen })),
  windyOverlay: 'currents',
  setWindyOverlay: (overlay) => set({ windyOverlay: overlay }),
  windyData: null,
  setWindyData: (data) => set({ windyData: data }),

  // Metocean real-time values
  metocean: {
    windKts: 12,
    windDirDeg: 45,
    windDirCardinal: 'NNE',
    windGustsKts: 18,
    currentKts: 1.8,
    currentDirDeg: 68,
    currentDirCardinal: 'ENE',
    seaSurfaceTempC: 24.6,
    waveHeightM: 1.1,
  },
  setMetocean: (metocean) => set({ metocean }),

  // Analysis Drawer
  activeDriftTab: 'hindcast',
  setActiveDriftTab: (tab) => set({ activeDriftTab: tab }),
  dispatchAlert: null,
  triggerDispatch: () =>
    set({
      dispatchAlert: {
        active: true,
        message: 'USCG-08 SECTOR NEW ORLEANS DISPATCHED TO 28°14\'12"N 089°22\'45"W. INTERCEPT VESSEL: MV NORDIC TITAN.',
        timestamp: new Date().toISOString(),
      },
    }),
  dismissDispatch: () => set({ dispatchAlert: null }),
  evidenceExported: false,
  triggerExportEvidence: () => {
    set({ evidenceExported: true });
    setTimeout(() => set({ evidenceExported: false }), 4000);
  },

  // Connection status
  wsStatus: 'live',
  setWsStatus: (status) => set({ wsStatus: status }),
  msgRatePerSec: 1402,
  satelliteStatus: 'ACTIVE',
  modelStatus: 'READY',
}));

export default useAppStore;
