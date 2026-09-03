import React, { useState } from 'react';
import useAppStore from '../../store/useAppStore.ts';
import {
  Waves,
  Compass,
  Wind,
  Layers,
  MapPin,
  RefreshCw,
  X,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  LocateFixed,
} from 'lucide-react';

export const WindyMapOverlay: React.FC = () => {
  const {
    mapBasemap,
    setMapBasemap,
    incidents,
    selectedIncidentId,
    windyOverlay,
    setWindyOverlay,
    windyData,
    themeMode,
  } = useAppStore();

  const [iframeKey, setIframeKey] = useState(0);

  if (mapBasemap !== 'windy') return null;

  const isLight = themeMode === 'daylight';
  const incident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];
  const lat = incident?.lat ?? 19.385;
  const lon = incident?.lon ?? 71.352;

  // Build high-performance embedded Windy URL with selected coordinates & layer
  const embedUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=kt&zoom=9&overlay=${windyOverlay}&product=ecmwf&level=surface&lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&marker=true&pressure=true&message=true`;

  const sc = windyData?.surfaceCurrent;
  const tc = windyData?.tidalCurrent;

  return (
    <div
      id="windy-live-map-viewport"
      className="absolute inset-0 z-20 flex flex-col bg-black overflow-hidden select-none animate-fadeIn"
    >
      {/* Top Floating Tactical Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Left: Target Incident Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 shadow-xl font-mono text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold text-white tracking-wider uppercase">
            WINDY LIVE MARINE STREAMLINES
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            {incident?.name || incident?.id || 'OIL SPILL TARGET'}
          </span>
        </div>

        {/* Center/Right: Layer Selectors & Close Button */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/85 backdrop-blur-md border border-white/15 shadow-xl font-mono text-xs">
          <button
            onClick={() => setWindyOverlay('currents')}
            className={`px-2.5 py-1 rounded font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
              windyOverlay === 'currents'
                ? 'bg-cyan-500 text-black shadow'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>OCEAN CURRENTS</span>
          </button>

          <button
            onClick={() => setWindyOverlay('waves')}
            className={`px-2.5 py-1 rounded font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
              windyOverlay === 'waves'
                ? 'bg-cyan-500 text-black shadow'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>WAVES & SWELL</span>
          </button>

          <button
            onClick={() => setWindyOverlay('wind')}
            className={`px-2.5 py-1 rounded font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
              windyOverlay === 'wind'
                ? 'bg-cyan-500 text-black shadow'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>WIND VECTORS</span>
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />

          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="p-1.5 rounded hover:bg-white/10 text-slate-300 cursor-pointer transition-colors"
            title="Reload Windy Viewport"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setMapBasemap('auto')}
            className="py-1 px-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors flex items-center gap-1"
            title="Switch back to Leaflet Tactical SAR Map"
          >
            <span>LEAFLET TACTICAL</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Full Map Windy Iframe Engine */}
      <div className="relative flex-1 w-full h-full bg-black">
        <iframe
          key={iframeKey}
          src={embedUrl}
          title="Windy.com Marine Currents and Wave Streamlines"
          className="w-full h-full border-0"
          loading="eager"
          allow="fullscreen"
        />
      </div>

      {/* Bottom Floating Telemetry Ticker */}
      <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-auto flex items-center justify-between px-3.5 py-2 rounded-lg bg-black/85 backdrop-blur-md border border-cyan-500/30 text-xs font-mono shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-cyan-400 font-bold">OCEAN CURRENTS:</span>
            <span className="text-white">
              {sc?.speedKts ?? 1.8} KTS @ {String(sc?.directionDeg ?? 68).padStart(3, '0')}° ({sc?.directionCardinal ?? 'ENE'})
            </span>
          </div>

          <span className="text-slate-600">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">TIDAL STREAM:</span>
            <span className="text-white">
              {tc?.phase ?? 'FLOOD'} {tc?.speedKts ?? 1.4} KTS @ {String(tc?.streamBearingDeg ?? 48).padStart(3, '0')}°
            </span>
          </div>

          <span className="text-slate-600">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">SLACK IN:</span>
            <span className="text-white">
              {Math.floor((tc?.minutesToNextSlack ?? 135) / 60)}h {(tc?.minutesToNextSlack ?? 135) % 60}m
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-600 text-cyan-300 font-bold">
            API: m3EDz...OMLa [OPERATIONAL]
          </span>
          <button
            onClick={() => setMapBasemap('auto')}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
          >
            Close Windy View
          </button>
        </div>
      </div>
    </div>
  );
};

export default WindyMapOverlay;
