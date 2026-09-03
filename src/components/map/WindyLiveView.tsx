import React, { useState } from 'react';
import useAppStore from '../../store/useAppStore.ts';
import {
  Waves,
  Compass,
  Wind,
  RefreshCw,
  ExternalLink,
  MapPin,
  Layers,
  Sparkles,
} from 'lucide-react';

interface WindyLiveViewProps {
  layout?: 'underlay' | 'split' | 'fullscreen';
  className?: string;
  showBar?: boolean;
}

export const WindyLiveView: React.FC<WindyLiveViewProps> = ({
  layout = 'underlay',
  className = '',
  showBar = true,
}) => {
  const {
    incidents,
    selectedIncidentId,
    windyOverlay,
    setWindyOverlay,
    windyData,
    themeMode,
    splitOrientation,
    setSplitOrientation,
    setMapViewMode,
  } = useAppStore();

  const [iframeKey, setIframeKey] = useState(0);
  const incident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];
  const lat = incident?.lat ?? 19.385;
  const lon = incident?.lon ?? 71.352;
  const isLight = themeMode === 'daylight';

  // Build high-performance embedded Windy URL with selected coordinates & layer
  const embedUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=kt&zoom=9&overlay=${windyOverlay}&product=ecmwf&level=surface&lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&marker=true&pressure=true&message=true`;

  const sc = windyData?.surfaceCurrent;
  const tc = windyData?.tidalCurrent;

  return (
    <div
      className={`relative w-full h-full flex flex-col bg-[#050B14] overflow-hidden ${className}`}
    >
      {/* Optional Top Bar for Split / Fullscreen layouts */}
      {showBar && (
        <div
          className={`flex items-center justify-between px-3 py-1.5 z-10 border-b text-xs font-mono select-none ${
            isLight
              ? 'bg-slate-100 border-slate-300 text-slate-800'
              : 'bg-[#0A101D] border-cyan-900/40 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold tracking-wider uppercase text-cyan-400">
              WINDY LIVE CURRENTS & HYDRODYNAMICS
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              {lat.toFixed(3)}°N, {lon.toFixed(3)}°E
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-white text-[11px] font-semibold hidden sm:inline truncate max-w-[200px]">
              {incident?.name || incident?.id}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Layer toggles */}
            <div className="flex items-center rounded border p-0.5 border-cyan-500/30 bg-black/40 text-[10px]">
              <button
                onClick={() => setWindyOverlay('currents')}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  windyOverlay === 'currents'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Ocean Currents"
              >
                <Waves className="w-3 h-3" />
                <span>CURRENTS</span>
              </button>
              <button
                onClick={() => setWindyOverlay('waves')}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  windyOverlay === 'waves'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Waves & Sea Swell"
              >
                <Compass className="w-3 h-3" />
                <span>WAVES</span>
              </button>
              <button
                onClick={() => setWindyOverlay('wind')}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  windyOverlay === 'wind'
                    ? 'bg-cyan-500 text-black shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Surface Wind Streamlines"
              >
                <Wind className="w-3 h-3" />
                <span>WIND</span>
              </button>
            </div>

            {/* Split orientation toggle when in split layout */}
            {layout === 'split' && (
              <button
                onClick={() =>
                  setSplitOrientation(
                    splitOrientation === 'stacked' ? 'side-by-side' : 'stacked'
                  )
                }
                className="px-2 py-0.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] cursor-pointer"
                title="Toggle Stacked (Windy Below) or Side-by-Side"
              >
                {splitOrientation === 'stacked' ? 'STACKED (BELOW)' : 'SIDE-BY-SIDE'}
              </button>
            )}

            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Reload Windy View"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Embedded Live Windy Streamlines Iframe */}
      <div className="relative flex-1 w-full h-full bg-[#050B14]">
        <iframe
          key={iframeKey}
          src={embedUrl}
          title="Windy.com Live Marine Hydrodynamics"
          className="w-full h-full border-0"
          loading="eager"
          allow="fullscreen"
        />
      </div>

      {/* Floating Mini Hydro Telemetry Pill for Split / Fullscreen */}
      {showBar && (
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none flex items-center gap-3 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-cyan-500/40 text-[10px] font-mono text-white shadow-xl">
          <div className="flex items-center gap-1 text-cyan-400 font-bold">
            <Waves className="w-3 h-3" />
            <span>CURRENTS:</span>
            <span className="text-white">
              {sc?.speedKts ?? 1.8} kts @ {String(sc?.directionDeg ?? 68).padStart(3, '0')}°
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <span>TIDE:</span>
            <span className="text-white">
              {tc?.phase ?? 'FLOOD'} {tc?.speedKts ?? 1.4} kts
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WindyLiveView;
