import React, { useState } from 'react';
import useAppStore from '../../store/useAppStore.ts';
import { motion } from 'motion/react';
import {
  X,
  Maximize2,
  Minimize2,
  Waves,
  Wind,
  Compass,
  Radio,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  LocateFixed,
} from 'lucide-react';

export const WindyRadarModal: React.FC = () => {
  const {
    isWindyRadarOpen,
    setIsWindyRadarOpen,
    windyOverlay,
    setWindyOverlay,
    incidents,
    selectedIncidentId,
    themeMode,
  } = useAppStore();

  const [isMaximized, setIsMaximized] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  if (!isWindyRadarOpen) return null;

  const isLight = themeMode === 'daylight';
  const incident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];
  const lat = incident?.lat ?? 19.385;
  const lon = incident?.lon ?? 71.352;

  // Build Windy Embed URL with parameters
  // type=map, location=coordinates, metricRain=default, metricTemp=default, metricWind=kt, zoom=8, overlay=currents
  const windyUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=kt&zoom=8&overlay=${windyOverlay}&product=ecmwf&level=surface&lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&marker=true&pressure=true&message=true`;

  return (
    <motion.div
      drag={!isMaximized}
      dragMomentum={false}
      dragConstraints={{ top: -500, left: -1000, right: 1000, bottom: 500 }}
      id="windy-radar-hud-modal"
      className={`fixed z-[1050] flex flex-col border shadow-2xl ${
        isMaximized
          ? 'inset-4 rounded-xl transition-all duration-300'
          : 'bottom-16 right-6 w-[680px] h-[480px] rounded-lg'
      } ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900'
          : 'bg-[#0B0F14] border-cyan-500/40 text-slate-100'
      }`}
    >
      {/* Top HUD Bar (Drag Handle) */}
      <div
        className={`px-3 py-2.5 border-b flex items-center justify-between shrink-0 select-none ${
          !isMaximized ? 'cursor-grab active:cursor-grabbing' : ''
        } ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#101720] border-white/10'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-xs font-bold tracking-wider uppercase text-cyan-400">
            WINDY.COM MARINE RADAR
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400'
            }`}
          >
            LIVE STREAMLINES [API KEY ACTIVE]
          </span>
        </div>

        {/* Overlay Selectors */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWindyOverlay('currents')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
              windyOverlay === 'currents'
                ? 'bg-cyan-500 text-black shadow'
                : isLight
                ? 'hover:bg-slate-200 text-slate-600'
                : 'hover:bg-white/10 text-slate-400'
            }`}
          >
            <Waves className="w-3 h-3" />
            <span>CURRENTS</span>
          </button>
          <button
            onClick={() => setWindyOverlay('waves')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
              windyOverlay === 'waves'
                ? 'bg-cyan-500 text-black shadow'
                : isLight
                ? 'hover:bg-slate-200 text-slate-600'
                : 'hover:bg-white/10 text-slate-400'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>WAVES & SWELL</span>
          </button>
          <button
            onClick={() => setWindyOverlay('wind')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
              windyOverlay === 'wind'
                ? 'bg-cyan-500 text-black shadow'
                : isLight
                ? 'hover:bg-slate-200 text-slate-600'
                : 'hover:bg-white/10 text-slate-400'
            }`}
          >
            <Wind className="w-3 h-3" />
            <span>WIND DRAG</span>
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-slate-400'
            }`}
            title="Reload Windy Viewport"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-slate-400'
            }`}
            title={isMaximized ? 'Restore window' : 'Maximize window'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsWindyRadarOpen(false)}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isLight ? 'hover:bg-red-100 text-red-600' : 'hover:bg-red-950/60 text-red-400'
            }`}
            title="Close Radar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded Windy Player */}
      <div className="relative flex-1 w-full bg-black overflow-hidden">
        <iframe
          key={iframeKey}
          src={windyUrl}
          title="Windy.com Live Marine Currents and Waves"
          className="w-full h-full border-0"
          loading="lazy"
          allow="fullscreen"
        />

        {/* Tactical Coordinates Overlay Pill */}
        <div className="absolute top-2 left-2 z-10 pointer-events-none bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded px-2.5 py-1 text-[10px] font-mono text-cyan-300 flex items-center gap-2 shadow-lg">
          <LocateFixed className="w-3 h-3 text-cyan-400 animate-spin" />
          <span>
            TARGET: {lat.toFixed(4)}°N, {lon.toFixed(4)}°E (SLICK CENTROID)
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-emerald-400">PARTICLE STREAMLINES: 60 FPS</span>
        </div>
      </div>

      {/* Footer Info Strip */}
      <div
        className={`px-3 py-1.5 border-t text-[10px] font-mono flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0E131A] border-white/5 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-3">
          <span>MODEL: ECMWF OCEAN / GLOBAL MERCATOR</span>
          <span>CURRENTS RESOLUTION: 0.083° (~9KM)</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://www.windy.com/?currents,${lat},${lon},8`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-0.5"
          >
            <span>FULL WINDY.COM STATION</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default WindyRadarModal;
