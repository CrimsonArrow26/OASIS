import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import useAppStore from '../../store/useAppStore.ts';
import { Incident, VesselSuspect, VesselTrack } from '../../types.ts';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Layers,
  Wind,
  Waves,
  Eye,
  Crosshair,
  MapPin,
  Ship as ShipIcon,
  Radio,
  Globe,
  Columns,
} from 'lucide-react';
import WindyRadarModal from './WindyRadarModal.tsx';
import WindyLiveView from './WindyLiveView.tsx';
import WindyService from '../../services/WindyService.ts';
import {
  createShipLeafletIcon,
  createVesselPopupHtml,
} from './shipMarkers.ts';

interface MapViewProps {
  selectedIncident: Incident | null;
  vesselSuspects: VesselSuspect[];
  vesselTracks: VesselTrack[];
}

// Ultra-reliable basemap tile providers with no restrictive keys or CORS blocking
const BASEMAP_TILES: Record<string, { url: string; attribution: string; maxZoom: number; subdomains?: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=cb1_2v98_1_f2dbdc85462582aec6ae472c',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    maxZoom: 19,
    subdomains: 'abcd',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_2v98_1_f2dbdc85462582aec6ae472c',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    maxZoom: 19,
    subdomains: 'abcd',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery',
    maxZoom: 18,
  },
  ocean: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri Ocean Bathymetry',
    maxZoom: 16,
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    subdomains: 'abc',
  },
};

export const MapView: React.FC<MapViewProps> = ({
  selectedIncident,
  vesselSuspects,
  vesselTracks,
}) => {
  const {
    weatherLayers,
    toggleWeatherLayer,
    metocean,
    timelineCursor,
    activeDriftTab,
    themeMode,
    selectedVesselMmsi,
    setSelectedVesselMmsi,
    toggleWindyRadar,
    isWindyRadarOpen,
    windyData,
    setWindyData,
    mapBasemap,
    setMapBasemap,
    mapViewMode,
    setMapViewMode,
    splitOrientation,
    setSplitOrientation,
  } = useAppStore();

  const isDark = themeMode !== 'daylight';
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups for clean updates
  const spillGroupRef = useRef<L.LayerGroup | null>(null);
  const shipsGroupRef = useRef<L.LayerGroup | null>(null);
  const tracksGroupRef = useRef<L.LayerGroup | null>(null);
  const weatherGroupRef = useRef<L.LayerGroup | null>(null);

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(10);

  // Initial center covering Indian waters (Arabian Sea / Mumbai High sector)
  const defaultCenter: [number, number] = [19.3850, 71.3520];

  // Active basemap key resolved directly from store mapBasemap and themeMode
  const activeBasemapKey = mapBasemap === 'auto' ? (isDark ? 'dark' : 'light') : mapBasemap;

  // Helper to reliably apply basemap tile layers
  const applyTileLayer = useCallback((map: L.Map, basemapKey: string) => {
    if (tileLayerRef.current && map.hasLayer(tileLayerRef.current)) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const config = BASEMAP_TILES[basemapKey] || (isDark ? BASEMAP_TILES.dark : BASEMAP_TILES.light);
    const tileLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: config.subdomains || 'abc',
    }).addTo(map);

    tileLayer.bringToBack();
    tileLayerRef.current = tileLayer;
  }, [isDark]);

  // Automatically fetch real-time Windy hydrodynamic data for current incident
  useEffect(() => {
    const lat = selectedIncident?.lat ?? defaultCenter[0];
    const lon = selectedIncident?.lon ?? defaultCenter[1];
    WindyService.getMarineCurrentsAndTides(lat, lon)
      .then((data) => {
        setWindyData(data);
      })
      .catch((err) => {
        console.warn('Failed to load Windy marine telemetry:', err);
      });
  }, [selectedIncident?.id, selectedIncident?.lat, selectedIncident?.lon, setWindyData]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter = selectedIncident ? [selectedIncident.lat, selectedIncident.lon] as [number, number] : defaultCenter;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 9,
      minZoom: 3,
      maxZoom: 18,
      worldCopyJump: false,
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
    });

    // Immediately attach the active basemap tiles to the new map
    applyTileLayer(map, activeBasemapKey);

    // Create Layer Groups
    const tracksGroup = L.layerGroup().addTo(map);
    const spillGroup = L.layerGroup().addTo(map);
    const weatherGroup = L.layerGroup().addTo(map);
    const shipsGroup = L.layerGroup().addTo(map);

    tracksGroupRef.current = tracksGroup;
    spillGroupRef.current = spillGroup;
    weatherGroupRef.current = weatherGroup;
    shipsGroupRef.current = shipsGroup;

    // Mouse movement telemetry
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({ lat: e.latlng.lat, lon: e.latlng.lng });
    });

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapRef.current = map;

    // ResizeObserver to smoothly adapt Leaflet when sidebars open/collapse
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Update Basemap Tile Layer whenever active basemap key changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applyTileLayer(map, activeBasemapKey);
  }, [activeBasemapKey, applyTileLayer]);

  // Invalidate Leaflet map size whenever layout mode or split orientation changes
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [mapViewMode, splitOrientation]);

  // Helper to compute geographic course over ground (bearing) between two points
  const computeTrackBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    if (Math.abs(dLat) < 0.00001 && Math.abs(dLon) < 0.00001) return 0;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(dLon);

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
    return Math.round(bearing);
  };

  // 3. Interpolate Vessel Position along Track based on Timeline Cursor
  const interpolatedVessels = useMemo(() => {
    const cursorMs = timelineCursor.getTime();

    return vesselTracks.map((track) => {
      const suspect = vesselSuspects.find((s) => s.mmsi === track.mmsi);
      const points = track.points;
      if (!points || points.length === 0) return null;

      // Find segment matching cursor
      let currentLat = points[0].lat;
      let currentLon = points[0].lon;
      let currentSpeed = points[0].speed;
      let currentCourse = points[0].course;

      const firstMs = new Date(points[0].timestamp).getTime();
      const lastMs = new Date(points[points.length - 1].timestamp).getTime();

      if (cursorMs <= firstMs) {
        currentLat = points[0].lat;
        currentLon = points[0].lon;
        currentSpeed = points[0].speed;
        currentCourse = points.length >= 2
          ? computeTrackBearing(points[0].lat, points[0].lon, points[1].lat, points[1].lon)
          : points[0].course;
      } else if (cursorMs >= lastMs) {
        const last = points[points.length - 1];
        currentLat = last.lat;
        currentLon = last.lon;
        currentSpeed = last.speed;
        currentCourse = points.length >= 2
          ? computeTrackBearing(points[points.length - 2].lat, points[points.length - 2].lon, last.lat, last.lon)
          : last.course;
      } else {
        // Interpolate between two points
        for (let i = 0; i < points.length - 1; i++) {
          const t1 = new Date(points[i].timestamp).getTime();
          const t2 = new Date(points[i + 1].timestamp).getTime();
          if (cursorMs >= t1 && cursorMs <= t2) {
            const ratio = (cursorMs - t1) / (t2 - t1);
            currentLat = points[i].lat + (points[i + 1].lat - points[i].lat) * ratio;
            currentLon = points[i].lon + (points[i + 1].lon - points[i].lon) * ratio;
            currentSpeed = points[i].speed + (points[i + 1].speed - points[i].speed) * ratio;
            const segmentBearing = computeTrackBearing(points[i].lat, points[i].lon, points[i + 1].lat, points[i + 1].lon);
            currentCourse = segmentBearing !== 0 ? segmentBearing : points[i].course;
            break;
          }
        }
      }

      // Check if vessel is currently in an AIS dark gap
      let isDarkGap = false;
      if (suspect?.aisGapDetected && suspect.aisGapStart && suspect.aisGapEnd) {
        const gapStartMs = new Date(suspect.aisGapStart).getTime();
        const gapEndMs = new Date(suspect.aisGapEnd).getTime();
        isDarkGap = cursorMs >= gapStartMs && cursorMs <= gapEndMs;
      }

      return {
        mmsi: track.mmsi,
        vesselName: track.vesselName,
        vesselType: track.vesselType,
        trackColor: track.trackColor,
        lat: currentLat,
        lon: currentLon,
        speed: currentSpeed,
        course: currentCourse,
        isDarkGap,
        rank: suspect?.rank || 99,
        matchPct: suspect?.scores.overall ? Math.round(suspect.scores.overall * 100) : undefined,
        flag: suspect?.flag,
        imo: suspect?.imoNumber,
      };
    }).filter(Boolean);
  }, [vesselTracks, vesselSuspects, timelineCursor]);

  // 4. Render Vessels (Realistic Ships with Hull Silhouettes, Heading, & Vectors)
  useEffect(() => {
    const group = shipsGroupRef.current;
    if (!group) return;

    group.clearLayers();

    interpolatedVessels.forEach((vessel) => {
      if (!vessel) return;

      const isSelected = selectedVesselMmsi === vessel.mmsi || vessel.rank === 1;

      // Realistic Ship DivIcon
      const shipIcon = createShipLeafletIcon({
        vesselName: vessel.vesselName,
        vesselType: vessel.vesselType,
        course: vessel.course,
        speed: vessel.speed,
        trackColor: vessel.trackColor,
        isSelected,
        isDarkGap: vessel.isDarkGap,
        isDark,
        matchPct: vessel.matchPct,
        mmsi: vessel.mmsi,
      });

      const marker = L.marker([vessel.lat, vessel.lon], {
        icon: shipIcon,
        zIndexOffset: isSelected ? 1000 : 500 - vessel.rank * 10,
      });

      // Rich tactical popup
      const popupContent = createVesselPopupHtml({
        vesselName: vessel.vesselName,
        vesselType: vessel.vesselType,
        mmsi: vessel.mmsi,
        speed: vessel.speed,
        course: vessel.course,
        flag: vessel.flag,
        imo: vessel.imo,
        matchPct: vessel.matchPct,
        isDarkGap: vessel.isDarkGap,
        isDark,
      });

      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -10],
      });

      marker.on('click', () => {
        setSelectedVesselMmsi(vessel.mmsi);
      });

      marker.addTo(group);
    });
  }, [interpolatedVessels, selectedVesselMmsi, isDark]);

  // 5. Render Oil Spill Area WITH DASHED LINES and Reconnaissance Delimitation
  useEffect(() => {
    const group = spillGroupRef.current;
    if (!group) return;

    group.clearLayers();

    if (!selectedIncident) return;

    const cursorMs = timelineCursor.getTime();
    const originMs = selectedIncident.estimatedOriginAt ? new Date(selectedIncident.estimatedOriginAt).getTime() : 0;
    const detectedMs = selectedIncident.detectedAt ? new Date(selectedIncident.detectedAt).getTime() : 0;

    // A. 8 NM Incident Surveillance Perimeter (Tactical Circle with Dashed Lines)
    if (weatherLayers.bathy || true) {
      const containmentCircle = L.circle([selectedIncident.lat, selectedIncident.lon], {
        radius: 8 * 1852, // 8 Nautical Miles in meters (~14.8 km)
        color: isDark ? '#475569' : '#94A3B8',
        weight: 1.5,
        dashArray: '6, 6', // CRISP DASHED LINE
        fillColor: isDark ? '#00FF87' : '#047857',
        fillOpacity: 0.02,
        interactive: false,
      });
      containmentCircle.addTo(group);
    }

    // B. Replay Stage Calculation
    const isPreSpill = originMs > 0 && cursorMs < originMs;
    const isDischarging = originMs > 0 && cursorMs >= originMs && cursorMs < detectedMs;

    if (isPreSpill) {
      // PRE-SPILL: Dashed surveillance boundary around origin point
      const originLat = selectedIncident.drift?.originLat || selectedIncident.lat;
      const originLon = selectedIncident.drift?.originLon || selectedIncident.lon;

      const preSpillCircle = L.circle([originLat, originLon], {
        radius: 1200,
        color: '#00FF87',
        weight: 2,
        dashArray: '6, 4', // DASHED LINE
        fillColor: '#00FF87',
        fillOpacity: 0.08,
      });
      preSpillCircle.addTo(group);

      const preSpillLabel = L.divIcon({
        className: 'pre-spill-label',
        html: `
          <div style="background: rgba(10, 12, 15, 0.9); border: 1px solid #00FF87; color: #00FF87; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 9px; font-weight: bold; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
            PRE-DISCHARGE SECTOR (CLEAR WATER)
          </div>
        `,
        iconSize: [220, 20],
        iconAnchor: [110, 10], // Centered above
      });
      L.marker([originLat + 0.012, originLon], { icon: preSpillLabel, interactive: false }).addTo(group);
      return;
    }

    // C. PRIMARY OIL SPILL POLYGON WITH DASHED LINES
    if (selectedIncident.geometry?.polygonGeoJSON?.coordinates?.[0]) {
      const rawCoords = selectedIncident.geometry.polygonGeoJSON.coordinates[0];
      // Convert [lon, lat] GeoJSON to Leaflet [lat, lon]
      let latlngs: [number, number][] = rawCoords.map(([lon, lat]) => [lat, lon]);

      // If in discharging stage, scale polygon around origin
      if (isDischarging) {
        const factor = Math.max(0.2, (cursorMs - originMs) / (detectedMs - originMs));
        const originLat = selectedIncident.drift?.originLat || selectedIncident.lat;
        const originLon = selectedIncident.drift?.originLon || selectedIncident.lon;

        latlngs = latlngs.map(([lat, lon]) => [
          originLat + (lat - originLat) * factor,
          originLon + (lon - originLon) * factor,
        ]);
      }

      // Outer Oil Spill Polygon with High-Visibility DASHED LINE
      const primarySpillPolygon = L.polygon(latlngs, {
        color: '#FF3B3B', // High visibility alert red
        weight: 2.5,
        dashArray: '8, 6', // CRISP DASHED OUTLINE AS REQUESTED
        dashOffset: '0',
        lineCap: 'round',
        lineJoin: 'round',
        fillColor: isDark ? '#05070A' : '#1E293B',
        fillOpacity: isDischarging ? 0.5 : 0.72,
        className: 'animated-dashed-polygon',
      });

      // Hover / Click tooltip for oil spill
      primarySpillPolygon.bindTooltip(
        `<strong>OIL SPILL DELIMITATION (SAR DETECTED)</strong><br/>
         Area: ${selectedIncident.areaKm2} km² | Type: ${selectedIncident.oilType || 'HEAVY FUEL / CRUDE'}<br/>
         Confidence: ${(selectedIncident.confidenceScore * 100).toFixed(0)}% (Sentinel-1A SAR)`,
        { sticky: true, className: 'tactical-spill-tooltip' }
      );

      primarySpillPolygon.addTo(group);

      // Inner Accent Glow Polygon with tighter Dashed Lines for depth
      const innerDashedContour = L.polygon(latlngs, {
        color: '#FFB347', // Warning amber dashed inner contour
        weight: 1.2,
        dashArray: '4, 4', // INNER SECONDARY DASHED LINE
        fill: false,
        interactive: false,
      });
      innerDashedContour.addTo(group);
    }

    // D. Spill Origin Point with Concentric Dashed Uncertainty Ring
    if (selectedIncident.drift) {
      const { originLat, originLon, originUncertaintyRadiusKm = 2.4 } = selectedIncident.drift;

      // Origin Marker Icon
      const originIcon = L.divIcon({
        className: 'origin-marker-icon',
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; items-center; justify-content: center;">
            <div style="position: absolute; width: 20px; height: 20px; border-radius: 50%; border: 2px dashed #00FF87; animation: pulse-ring 2s infinite;"></div>
            <div style="width: 8px; height: 8px; background: #00FF87; border-radius: 50%; margin: auto; box-shadow: 0 0 8px #00FF87;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const originMarker = L.marker([originLat, originLon], { icon: originIcon });
      const originDateStr = selectedIncident.estimatedOriginAt
        ? new Date(selectedIncident.estimatedOriginAt).toUTCString().replace('GMT', 'UTC')
        : '2024-05-24 21:18 UTC';
      originMarker.bindTooltip(
        `<b>ESTIMATED SPILL ORIGIN</b><br/>${originDateStr}<br/>Uncertainty: ±${originUncertaintyRadiusKm} km`,
        { direction: 'top' }
      );
      originMarker.addTo(group);

      // Origin Uncertainty Radius (Dashed Circle)
      const originCircle = L.circle([originLat, originLon], {
        radius: originUncertaintyRadiusKm * 1000,
        color: '#00FF87',
        weight: 1.5,
        dashArray: '5, 5', // DASHED LINE
        fillColor: '#00FF87',
        fillOpacity: 0.05,
        interactive: false,
      });
      originCircle.addTo(group);

      // E. Hindcast Drift Track (Dashed Line from Origin to Centroid)
      if (selectedIncident.drift.hindcastPath && (activeDriftTab === 'hindcast' || true)) {
        const hindcastPolyline = L.polyline(selectedIncident.drift.hindcastPath, {
          color: '#00FF87',
          weight: 2,
          dashArray: '5, 4', // DASHED LINE
          lineCap: 'round',
        });
        hindcastPolyline.bindTooltip('HINDCAST DRIFT TRAJECTORY (-12H)', { sticky: true });
        hindcastPolyline.addTo(group);
      }

      // F. Forecast Drift Track (Dashed Line from Centroid into Future)
      if (selectedIncident.drift.forecastPath && activeDriftTab === 'forecast') {
        const forecastPolyline = L.polyline(selectedIncident.drift.forecastPath, {
          color: '#FFB347',
          weight: 2,
          dashArray: '4, 4', // DASHED LINE
          lineCap: 'round',
        });
        forecastPolyline.bindTooltip('FORECAST DRIFT TRAJECTORY (+24H)', { sticky: true });
        forecastPolyline.addTo(group);
      }
    }
  }, [selectedIncident, timelineCursor, activeDriftTab, weatherLayers.bathy, isDark]);

  // 6. Render AIS Historical Tracks
  useEffect(() => {
    const group = tracksGroupRef.current;
    if (!group) return;

    group.clearLayers();

    if (!weatherLayers.aisTracks) return;

    vesselTracks.forEach((track) => {
      const points = track.points.map((p) => [p.lat, p.lon] as [number, number]);
      if (points.length < 2) return;

      const suspect = vesselSuspects.find((s) => s.mmsi === track.mmsi);
      const isTopSuspect = suspect?.rank === 1;

      // Normal Track line
      const line = L.polyline(points, {
        color: track.trackColor,
        weight: isTopSuspect ? 2.5 : 1.5,
        opacity: isTopSuspect ? 0.9 : 0.6,
        dashArray: isTopSuspect ? undefined : '3, 3',
      });

      line.bindTooltip(`${track.vesselName} (${track.vesselType})`, { sticky: true });
      line.addTo(group);

      // If top suspect has an AIS gap, draw that section with alert dashed red
      if (isTopSuspect && suspect?.aisGapDetected && points.length >= 4) {
        const gapSegment = [points[2], points[3]];
        const gapLine = L.polyline(gapSegment, {
          color: '#FF3B3B',
          weight: 3.5,
          dashArray: '6, 6', // DASHED AIS GAP
          opacity: 1,
        });
        gapLine.bindTooltip('CRITICAL AIS TRANSMISSION SILENCE GAP (135m)', { sticky: true });
        gapLine.addTo(group);
      }
    });
  }, [vesselTracks, vesselSuspects, weatherLayers.aisTracks]);

    // Re-center map when selected incident changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedIncident) return;
    map.flyTo([selectedIncident.lat, selectedIncident.lon], 10, {
      duration: 1.2,
    });
  }, [selectedIncident?.id]);

  // 7. Render Metocean Currents & Winds Vectors with Windy Telemetry
  useEffect(() => {
    const group = weatherGroupRef.current;
    if (!group) return;

    group.clearLayers();

    const centerLat = selectedIncident?.lat ?? defaultCenter[0];
    const centerLon = selectedIncident?.lon ?? defaultCenter[1];
    const curDir = windyData?.surfaceCurrent?.directionDeg ?? selectedIncident?.drift?.dominantCurrentDir ?? 68;
    const curSpeed = windyData?.surfaceCurrent?.speedKts ?? 1.8;
    const windDir = selectedIncident?.drift?.dominantWindDir ?? 45;

    // Render Currents Vector Field
    if (weatherLayers.currents) {
      const gridOffsetsLat = [-0.22, -0.11, 0, 0.11, 0.22];
      const gridOffsetsLon = [-0.26, -0.13, 0, 0.13, 0.26];

      gridOffsetsLat.forEach((dLat, rIdx) => {
        gridOffsetsLon.forEach((dLon, cIdx) => {
          const lat = centerLat + dLat;
          const lon = centerLon + dLon;
          // Natural hydrodynamic drift perturbation
          const localDir = (curDir + ((rIdx - 2) * 4) + ((cIdx - 2) * 3) + 360) % 360;
          const cssRotate = localDir - 90;
          const arrowIcon = L.divIcon({
            className: 'current-vector-icon',
            html: `
              <div style="transform: rotate(${cssRotate}deg); transform-origin: center; display: flex; align-items: center; filter: drop-shadow(0 0 6px rgba(0, 255, 135, 0.7));">
                <div style="width: 22px; height: 2.5px; background: linear-gradient(90deg, rgba(0, 255, 135, 0.2), #00FF87); border-radius: 2px;"></div>
                <div style="width: 0; height: 0; border-top: 4px solid transparent; border-bottom: 4px solid transparent; border-left: 8px solid #00FF87;"></div>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });
          const marker = L.marker([lat, lon], { icon: arrowIcon, interactive: true });
          marker.bindTooltip(
            `OCEAN CURRENT VECTOR: ${curSpeed.toFixed(1)} KTS @ ${String(localDir).padStart(3, '0')}°`,
            { direction: 'top', offset: [0, -10] }
          );
          marker.addTo(group);
        });
      });
    }

    // Render Wind Vector Field
    if (weatherLayers.winds) {
      const windLats = [centerLat - 0.12, centerLat, centerLat + 0.12];
      const windLons = [centerLon - 0.15, centerLon, centerLon + 0.15];

      windLats.forEach((lat) => {
        windLons.forEach((lon) => {
          const cssWindRotate = (windDir + 90) % 360;
          const windIcon = L.divIcon({
            className: 'wind-vector-icon',
            html: `
              <div style="transform: rotate(${cssWindRotate}deg); transform-origin: center; display: flex; align-items: center;">
                <div style="width: 16px; height: 1.5px; background: ${isDark ? 'rgba(200, 214, 224, 0.4)' : 'rgba(100, 116, 139, 0.55)'};"></div>
                <div style="width: 0; height: 0; border-top: 2.5px solid transparent; border-bottom: 2.5px solid transparent; border-left: 5px solid ${isDark ? 'rgba(200, 214, 224, 0.5)' : 'rgba(100, 116, 139, 0.7)'};"></div>
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });
          L.marker([lat, lon], { icon: windIcon, interactive: false }).addTo(group);
        });
      });
    }

    // Render SAR Swath Bounding Box around active incident
    if (weatherLayers.sarOverlay && selectedIncident) {
      const { lat, lon } = selectedIncident;
      const sarBounds: [number, number][] = [
        [lat - 0.22, lon - 0.30],
        [lat + 0.22, lon - 0.30],
        [lat + 0.22, lon + 0.30],
        [lat - 0.22, lon + 0.30],
      ];
      const sarRect = L.polygon(sarBounds, {
        color: '#00FF87',
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#00FF87',
        fillOpacity: 0.03,
      });
      sarRect.addTo(group);

      // Floating SAR Swath Label at Top Edge
      const sarLabel = L.divIcon({
        className: 'sar-swath-label',
        html: `
          <div style="background: rgba(10, 12, 15, 0.9); border: 1px solid #00FF87; color: #00FF87; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 9px; font-weight: bold; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
            ${selectedIncident.id} SAR SATELLITE SWATH COVERAGE
          </div>
        `,
        iconSize: [220, 20],
        iconAnchor: [110, 10], // Centered at the top edge
      });
      L.marker([lat + 0.22, lon], { icon: sarLabel, interactive: false }).addTo(group);
    }
  }, [weatherLayers, selectedIncident, isDark, windyData]);

  // Fit view to sector
  const handleFitSector = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedIncident) {
      map.flyTo([selectedIncident.lat, selectedIncident.lon], 10, { duration: 1.2 });
    } else {
      map.flyTo(defaultCenter, 10.2, { duration: 1.2 });
    }
  }, [selectedIncident]);

  // Zoom controls
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  return (
    <div className="flex-1 relative flex flex-col min-w-0 bg-[#0A0C0F] overflow-hidden select-none">
      {/* 1. Tactical Floating Map Header Controls & Sector Badge in Single Non-Overlapping Row */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[1000] flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: View Mode Switcher, Basemap Selector, and Quick Layer Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap pointer-events-auto">
          {/* Map Display Mode: Tactical, Windy Below (Split), Windy Full */}
          <div
            className={`flex items-center rounded border p-0.5 shadow-lg backdrop-blur-md text-[10px] font-mono font-bold ${
              isDark
                ? 'bg-[#0F1318]/90 border-cyan-500/40 text-cyan-300'
                : 'bg-white/95 border-cyan-300 text-cyan-900'
            }`}
          >
            <button
              onClick={() => setMapViewMode('tactical')}
              className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                mapViewMode === 'tactical'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'hover:opacity-100 opacity-70'
              }`}
              title="Tactical Leaflet map only"
            >
              <Layers className="w-3 h-3" />
              <span>TACTICAL</span>
            </button>

            <button
              onClick={() => {
                setMapViewMode('split');
                setSplitOrientation('stacked');
              }}
              className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                mapViewMode === 'split'
                  ? 'bg-amber-400 text-black font-bold shadow'
                  : 'hover:opacity-100 opacity-70'
              }`}
              title="Show actual Windy currents map below Tactical Leaflet map"
            >
              <Columns className="w-3 h-3" />
              <span>WINDY BELOW</span>
            </button>

            <button
              onClick={() => setMapViewMode('windy')}
              className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                mapViewMode === 'windy'
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'hover:opacity-100 opacity-70'
              }`}
              title="Fullscreen interactive Windy currents and waves interface"
            >
              <Globe className="w-3 h-3" />
              <span>WINDY FULL</span>
            </button>
          </div>

          {/* Split Orientation Switcher (Only visible in Split mode) */}
          {mapViewMode === 'split' && (
            <div
              className={`flex items-center rounded border p-0.5 shadow-lg backdrop-blur-md text-[10px] font-mono ${
                isDark
                  ? 'bg-[#0F1318]/90 border-amber-500/40 text-amber-300'
                  : 'bg-white/95 border-amber-300 text-amber-800'
              }`}
            >
              <button
                onClick={() => setSplitOrientation('stacked')}
                className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                  splitOrientation === 'stacked'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'hover:opacity-100 opacity-70'
                }`}
                title="Stack Windy Currents map below the Tactical Leaflet map"
              >
                STACKED
              </button>
              <button
                onClick={() => setSplitOrientation('side-by-side')}
                className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                  splitOrientation === 'side-by-side'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'hover:opacity-100 opacity-70'
                }`}
                title="Show Tactical and Windy side-by-side"
              >
                SIDE-BY-SIDE
              </button>
            </div>
          )}

          {/* Basemap Switcher (Dark, Light, Ocean, Satellite) */}
          {mapViewMode !== 'windy' && (
            <div
              className={`flex items-center rounded border p-0.5 shadow-lg backdrop-blur-md text-[10px] font-mono font-bold ${
                isDark
                  ? 'bg-[#0F1318]/90 border-white/10 text-[#C8D6E0]'
                  : 'bg-white/95 border-slate-200 text-slate-700'
              }`}
            >
              <button
                onClick={() => setMapBasemap('auto')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  mapBasemap === 'auto'
                    ? isDark
                      ? 'bg-[#00FF87]/20 text-[#00FF87] border border-[#00FF87]/40 font-bold'
                      : 'bg-emerald-600 text-white font-bold'
                    : 'hover:opacity-100 opacity-60'
                }`}
                title="Auto sync with Theme"
              >
                AUTO
              </button>
              <button
                onClick={() => setMapBasemap('dark')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  mapBasemap === 'dark'
                    ? 'bg-black text-[#00FF87] border border-[#00FF87]/40 font-bold'
                    : 'hover:opacity-100 opacity-60'
                }`}
                title="Tactical Dark Basemap"
              >
                DARK
              </button>
              <button
                onClick={() => setMapBasemap('light')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  mapBasemap === 'light'
                    ? 'bg-slate-200 text-slate-900 border border-slate-400 font-bold'
                    : 'hover:opacity-100 opacity-60'
                }`}
                title="Positron Light Basemap"
              >
                LIGHT
              </button>
              <button
                onClick={() => setMapBasemap('ocean')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  mapBasemap === 'ocean'
                    ? isDark
                      ? 'bg-blue-900/60 text-cyan-400 border border-cyan-500/40 font-bold'
                      : 'bg-blue-600 text-white font-bold'
                    : 'hover:opacity-100 opacity-60'
                }`}
                title="Esri Ocean Bathymetry"
              >
                OCEAN
              </button>
              <button
                onClick={() => setMapBasemap('satellite')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  mapBasemap === 'satellite'
                    ? 'bg-emerald-950 text-[#00FF87] border border-[#00FF87]/40 font-bold'
                    : 'hover:opacity-100 opacity-60'
                }`}
                title="Esri World Satellite Imagery"
              >
                SATELLITE
              </button>
            </div>
          )}

          {/* Quick Layer Toggles (Tracks, Currents, Winds, SAR Swath, Radar) */}
          {mapViewMode !== 'windy' && (
            <div
              className={`flex items-center rounded border p-0.5 shadow-lg backdrop-blur-md text-[10px] font-mono ${
                isDark
                  ? 'bg-[#0F1318]/90 border-white/10 text-[#C8D6E0]'
                  : 'bg-white/95 border-slate-200 text-slate-700'
              }`}
            >
              <button
                onClick={() => toggleWeatherLayer('aisTracks')}
                className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                  weatherLayers.aisTracks
                    ? isDark
                      ? 'bg-[#00FF87]/15 text-[#00FF87] font-bold'
                      : 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'opacity-50 hover:opacity-100'
                }`}
                title="Toggle AIS Voyage Tracks"
              >
                <ShipIcon className="w-3 h-3" />
                TRACKS
              </button>
              <button
                onClick={() => toggleWeatherLayer('currents')}
                className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                  weatherLayers.currents
                    ? isDark
                      ? 'bg-[#00FF87]/15 text-[#00FF87] font-bold'
                      : 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'opacity-50 hover:opacity-100'
                }`}
                title="Toggle Ocean Currents Vectors"
              >
                <Waves className="w-3 h-3" />
                CURRENTS
              </button>
              <button
                onClick={() => toggleWeatherLayer('winds')}
                className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                  weatherLayers.winds
                    ? isDark
                      ? 'bg-[#00FF87]/15 text-[#00FF87] font-bold'
                      : 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'opacity-50 hover:opacity-100'
                }`}
                title="Toggle Wind Vectors"
              >
                <Wind className="w-3 h-3" />
                WINDS
              </button>
              <button
                onClick={() => toggleWeatherLayer('sarOverlay')}
                className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                  weatherLayers.sarOverlay
                    ? isDark
                      ? 'bg-[#00FF87]/15 text-[#00FF87] font-bold'
                      : 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'opacity-50 hover:opacity-100'
                }`}
                title="Toggle Sentinel-1A SAR Swath"
              >
                <Eye className="w-3 h-3" />
                SAR SWATH
              </button>

              <div className="h-3 w-px bg-white/15 mx-0.5" />

              <button
                onClick={toggleWindyRadar}
                className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                  isWindyRadarOpen
                    ? 'bg-cyan-500 text-black font-bold'
                    : isDark
                    ? 'bg-white/5 hover:bg-white/10 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Open Detached Windy.com Radar Modal"
              >
                <span>RADAR MODAL</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Critical Slick / Incident Indicator Pill (Shrink-0 and never overlapped) */}
        {selectedIncident && (
          <div className="pointer-events-auto shrink-0 hidden md:flex items-center">
            <div
              className={`px-2.5 py-1 rounded border shadow-lg backdrop-blur-md font-mono text-[10px] flex items-center gap-2 ${
                isDark
                  ? 'bg-[#0F1318]/90 border-white/10 text-[#C8D6E0]'
                  : 'bg-white/95 border-slate-200 text-slate-800'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-[#FF3B3B] animate-ping" />
              <span className="font-bold text-[#FF3B3B]">
                {selectedIncident?.severity === 'critical' ? 'CRITICAL SLICK:' : 'SLICK:'}
              </span>
              <span className="font-bold">#{selectedIncident?.id}</span>
              <span className="opacity-40">|</span>
              <span className="text-[#FFB347]">DASHED CONTOUR</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Core Map Display Engine: Multi-Mode Layout (Tactical, Split/Stacked, Windy Full) */}
      <div
        className={`w-full h-full flex ${
          mapViewMode === 'split'
            ? splitOrientation === 'stacked'
              ? 'flex-col'
              : 'flex-row'
            : 'relative'
        } overflow-hidden`}
      >
        {/* Tactical Leaflet Map Container */}
        <div
          className={`relative ${
            mapViewMode === 'split'
              ? splitOrientation === 'stacked'
                ? 'w-full h-1/2 border-b border-cyan-500/30'
                : 'w-1/2 h-full border-r border-cyan-500/30'
              : mapViewMode === 'windy'
              ? 'hidden'
              : 'w-full h-full'
          }`}
        >
          {/* Leaflet Tactical Canvas */}
          <div
            id="tactical-leaflet-map"
            ref={mapContainerRef}
            className="w-full h-full z-0 cursor-crosshair"
          />

          {/* Split Mode Tactical Badge */}
          {mapViewMode === 'split' && (
            <div className="absolute top-14 left-3 z-[900] pointer-events-none px-2 py-0.5 rounded bg-black/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
              TACTICAL AIS & SPILL FORECAST (LEAFLET)
            </div>
          )}
        </div>

        {/* Split Mode: Actual Windy Live Currents Map (Just below or side-by-side) */}
        {mapViewMode === 'split' && (
          <div
            className={`relative ${
              splitOrientation === 'stacked' ? 'w-full h-1/2' : 'w-1/2 h-full'
            }`}
          >
            <WindyLiveView layout="split" showBar={true} />
          </div>
        )}

        {/* Fullscreen Windy View (When Windy Only mode is selected) */}
        {mapViewMode === 'windy' && (
          <div className="absolute inset-0 z-20">
            <WindyLiveView layout="fullscreen" showBar={true} />
          </div>
        )}
      </div>

      {/* 3. Tactical Zoom & Fit Controls (Right side - hidden in Windy Only mode) */}
      {mapViewMode !== 'windy' && (
        <div className="absolute bottom-16 right-3 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
          <button
            onClick={handleZoomIn}
            className={`p-2 rounded border shadow-lg backdrop-blur-md transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#0F1318]/90 border-white/10 text-[#C8D6E0] hover:bg-[#141A22] hover:text-white'
                : 'bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className={`p-2 rounded border shadow-lg backdrop-blur-md transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#0F1318]/90 border-white/10 text-[#C8D6E0] hover:bg-[#141A22] hover:text-white'
                : 'bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitSector}
            className={`p-2 rounded border shadow-lg backdrop-blur-md transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#0F1318]/90 border-white/10 text-[#00FF87] hover:bg-[#141A22]'
                : 'bg-white/95 border-slate-200 text-emerald-700 hover:bg-slate-100'
            }`}
            title="Fit to Incident Sector & Coastline"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Bottom Tactical Telemetry Bar (Mouse Coords, Zoom, Scale, Land Status) */}
      <div className={`absolute bottom-2 left-3 right-3 z-[1000] h-8 rounded border px-3 flex items-center justify-between pointer-events-auto backdrop-blur-md text-[10px] font-mono ${
        isDark ? 'bg-[#0F1318]/90 border-white/10 text-[#C8D6E0]' : 'bg-white/95 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#00FF87]">
            <Crosshair className="w-3.5 h-3.5" />
            <span>
              {mouseCoords
                ? `${Math.abs(mouseCoords.lat).toFixed(4)}°${mouseCoords.lat >= 0 ? 'N' : 'S'}, ${Math.abs(mouseCoords.lon).toFixed(4)}°${mouseCoords.lon >= 0 ? 'E' : 'W'}`
                : selectedIncident
                ? `${Math.abs(selectedIncident.lat).toFixed(4)}°${selectedIncident.lat >= 0 ? 'N' : 'S'}, ${Math.abs(selectedIncident.lon).toFixed(4)}°${selectedIncident.lon >= 0 ? 'E' : 'W'}`
                : '28.2367°N, 089.3792°W'}
            </span>
          </div>
          <span className="opacity-40">|</span>
          <span className="opacity-60">
            SECTOR: <strong className={isDark ? 'text-white' : 'text-slate-900'}>
              {selectedIncident?.name ? selectedIncident.name.toUpperCase() : 'MISSISSIPPI CANYON / LA DELTA'}
            </strong>
          </span>
          <span className="opacity-40">|</span>
          <span className="opacity-60">
            BASEMAP: <strong className="text-[#FFB347] uppercase">{activeBasemapKey}</strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 border-b-2 border-dashed border-[#FF3B3B]"></span>
            <span className="text-[#FF3B3B] font-bold">OIL SPILL (DASHED)</span>
          </div>

          <div className="flex items-center gap-1.5 opacity-75">
            <span>ZOOM:</span>
            <span className="font-bold">{currentZoom}</span>
          </div>

          <button
            onClick={handleFitSector}
            className={`px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/5 border-white/10 hover:border-[#00FF87] text-[#00FF87]'
                : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            FIT SECTOR
          </button>
        </div>
      </div>

      {/* 5. Detached Windy.com Marine Currents & Tidal Radar Modal */}
      <WindyRadarModal />
    </div>
  );
};

export default MapView;
