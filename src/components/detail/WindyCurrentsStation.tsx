import React, { useEffect, useState } from 'react';
import { Incident, WindyMarineData } from '../../types.ts';
import useAppStore from '../../store/useAppStore.ts';
import WindyService from '../../services/WindyService.ts';
import {
  Waves,
  Compass,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Radio,
  ExternalLink,
  RefreshCw,
  Gauge,
  Activity,
  Layers,
  Columns,
  Globe,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface WindyCurrentsStationProps {
  incident: Incident | null;
}

export const WindyCurrentsStation: React.FC<WindyCurrentsStationProps> = ({ incident }) => {
  const {
    themeMode,
    toggleWindyRadar,
    setWindyData,
    windyData,
    weatherLayers,
    toggleWeatherLayer,
    mapBasemap,
    setMapBasemap,
    mapViewMode,
    setMapViewMode,
    splitOrientation,
    setSplitOrientation,
  } = useAppStore();
  const isLight = themeMode === 'daylight';

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tidal' | 'decomposition'>('tidal');

  const lat = incident?.lat ?? 19.385;
  const lon = incident?.lon ?? 71.352;

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await WindyService.getMarineCurrentsAndTides(lat, lon);
      setWindyData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [lat, lon]);

  if (!incident) return null;

  const tc = windyData?.tidalCurrent;
  const sc = windyData?.surfaceCurrent;
  const cd = windyData?.combinedHydrodynamicDrift;
  const wd = windyData?.windDrag;
  const chartData = windyData?.forecastTimeline || [];

  const isFlood = tc?.isFlood ?? true;
  const tidalSpeed = tc?.speedKts ?? 1.4;
  const streamBearing = tc?.streamBearingDeg ?? 48;
  const minutesToSlack = tc?.minutesToNextSlack ?? 135;
  const slackHrs = Math.floor(minutesToSlack / 60);
  const slackMins = minutesToSlack % 60;

  return (
    <div
      id="windy-marine-currents-station"
      className={`border p-3 rounded space-y-3 transition-colors duration-200 ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
      }`}
    >
      {/* Header with API Status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Waves className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] font-bold tracking-wider uppercase">
            Windy.com Marine & Tides
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 border ${
              isLight
                ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                : 'bg-cyan-950/60 border-cyan-700/50 text-cyan-300'
            }`}
            title="Connected using user Windy.com API Key"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>API: m3EDz...OMLa</span>
          </span>
          <button
            onClick={loadData}
            disabled={loading}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-slate-400'
            }`}
            title="Refresh hydrodynamic current calculation"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-tabs: Tidal Flux vs Drift Decomposition */}
      <div className={`flex border-b text-[10px] font-bold uppercase ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <button
          onClick={() => setActiveTab('tidal')}
          className={`px-2.5 py-1 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'tidal'
              ? 'border-cyan-400 text-cyan-400'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent opacity-50 hover:opacity-90 text-[#C8D6E0]'
          }`}
        >
          Tidal Streams (M2/S2)
        </button>
        <button
          onClick={() => setActiveTab('decomposition')}
          className={`px-2.5 py-1 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'decomposition'
              ? 'border-cyan-400 text-cyan-400'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent opacity-50 hover:opacity-90 text-[#C8D6E0]'
          }`}
        >
          Drift Decomposition
        </button>
      </div>

      {activeTab === 'tidal' ? (
        <>
          {/* Main Tidal Current Highlight Card */}
          <div
            className={`p-2.5 rounded border space-y-2 ${
              isLight ? 'bg-white border-slate-200' : 'bg-black/30 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isFlood ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ArrowDownLeft className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <div className="text-[10px] font-mono opacity-50 tracking-wider">
                    CURRENT TIDAL PHASE
                  </div>
                  <div
                    className={`text-xs font-bold font-mono ${
                      isFlood ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {tc?.phase || 'FLOOD STREAM'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-mono opacity-50">TIDAL VELOCITY</div>
                <div className="text-base font-bold font-mono text-cyan-400">
                  {tidalSpeed.toFixed(2)}{' '}
                  <span className="text-[10px] font-normal text-slate-400">KTS</span>
                </div>
              </div>
            </div>

            {/* Micro Details Grid */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/5 text-[10px] font-mono">
              <div className={`p-1.5 rounded ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                <div className="opacity-50 text-[9px]">STREAM BEARING</div>
                <div className="font-bold text-slate-200">
                  {String(streamBearing).padStart(3, '0')}° ({isFlood ? 'NE' : 'SW'})
                </div>
              </div>
              <div className={`p-1.5 rounded ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                <div className="opacity-50 text-[9px]">NEXT SLACK</div>
                <div className="font-bold text-amber-400 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>
                    {slackHrs}h {slackMins}m
                  </span>
                </div>
              </div>
              <div className={`p-1.5 rounded ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                <div className="opacity-50 text-[9px]">TIDAL RANGE</div>
                <div className="font-bold text-cyan-300">
                  {tc?.tidalRangeM ?? 2.8}m (SPR)
                </div>
              </div>
            </div>
          </div>

          {/* 24-Hour Oscillating Tidal Flux Chart */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono opacity-60">
              <span>24H TIDAL STREAM CURVE (FLOOD / EBB)</span>
              <span className="text-cyan-400">M2 SEMI-DIURNAL</span>
            </div>
            <div className="h-24 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 2, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="floodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF87" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#00FF87" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="ebbGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="5%" stopColor="#FFB347" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#FFB347" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="hourLabel"
                    tick={{ fontSize: 8, fill: isLight ? '#64748b' : '#94a3b8' }}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fontSize: 8, fill: isLight ? '#64748b' : '#94a3b8' }}
                    domain={[-2, 2]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? '#ffffff' : '#0F1318',
                      borderColor: isLight ? '#cbd5e1' : '#334155',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                    }}
                    formatter={(val: any) => [`${val} kts`, 'Tidal Velocity']}
                  />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="tidalVelocitySigned"
                    stroke="#00E5FF"
                    strokeWidth={1.5}
                    fill="url(#floodGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        /* Vector Decomposition Tab */
        <div className="space-y-2">
          <div
            className={`p-2 rounded border space-y-1.5 font-mono text-[11px] ${
              isLight ? 'bg-white border-slate-200' : 'bg-black/30 border-white/10'
            }`}
          >
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span>HYDRODYNAMIC COMPONENT</span>
              <span>VECTOR (SPD @ BRG)</span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-white/5">
              <span className="opacity-75 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Residual Ocean Current (ECMWF)
              </span>
              <span className="font-bold text-cyan-300">
                {sc?.speedKts ?? 1.8} kts @ {String(sc?.directionDeg ?? 68).padStart(3, '0')}°
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-white/5">
              <span className="opacity-75 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Astronomical Tidal Stream
              </span>
              <span className="font-bold text-emerald-400">
                {tidalSpeed.toFixed(1)} kts @ {String(streamBearing).padStart(3, '0')}°
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-white/5">
              <span className="opacity-75 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Wind Stokes Drift (3%)
              </span>
              <span className="font-bold text-amber-300">
                {wd?.stokesDriftKts ?? 0.36} kts @ {String(wd?.stokesDirDeg ?? 60).padStart(3, '0')}°
              </span>
            </div>

            <div className="flex justify-between items-center pt-1.5 border-t border-cyan-500/30 text-xs font-bold">
              <span className="text-white">NET SURFACE SPILL DRIFT</span>
              <span className="text-[#00FF87]">
                {cd?.netSpeedKts ?? 2.15} kts @ {String(cd?.netBearingDeg ?? 62).padStart(3, '0')}°
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Mode Map Action Controls (Tactical, Hybrid Overlay, Windy Below Tactical, Windy Only) */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            MAP DISPLAY MODE:
          </span>
          <span className="text-[10px] font-mono text-cyan-400 font-bold">
            {mapViewMode.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setMapViewMode('tactical')}
            className={`py-1.5 px-1.5 rounded border text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              mapViewMode === 'tactical'
                ? isLight
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow'
                : isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400'
            }`}
            title="Standard Leaflet tactical map"
          >
            <Layers className="w-3 h-3 shrink-0" />
            <span>TACTICAL</span>
          </button>

          <button
            onClick={() => {
              setMapViewMode('split');
              setSplitOrientation('stacked');
            }}
            className={`py-1.5 px-1.5 rounded border text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              mapViewMode === 'split'
                ? 'bg-amber-400 border-amber-500 text-black shadow font-bold'
                : isLight
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-amber-950/50 hover:bg-amber-900 border-amber-500/40 text-amber-300'
            }`}
            title="Display Windy currents map directly below the Tactical Leaflet map"
          >
            <Columns className="w-3 h-3 shrink-0" />
            <span>WINDY BELOW</span>
          </button>

          <button
            onClick={() => setMapViewMode('windy')}
            className={`py-1.5 px-1.5 rounded border text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              mapViewMode === 'windy'
                ? 'bg-blue-600 border-blue-500 text-white shadow font-bold'
                : isLight
                ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
                : 'bg-blue-950/40 hover:bg-blue-900 border-blue-500/30 text-blue-300'
            }`}
            title="Fullscreen animated Windy currents interface"
          >
            <Globe className="w-3 h-3 shrink-0" />
            <span>WINDY ONLY</span>
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => toggleWeatherLayer('currents')}
            className={`flex-1 py-1.5 px-2 rounded border text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              weatherLayers.currents
                ? isLight
                  ? 'bg-cyan-100 border-cyan-400 text-cyan-900'
                  : 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                : isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-600'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>OCEAN CURRENTS: {weatherLayers.currents ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={toggleWindyRadar}
            className="flex-1 py-1.5 px-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px] font-bold flex items-center justify-center gap-1.5 shadow cursor-pointer transition-colors"
            title="Open interactive Windy.com live animated currents & tides radar modal"
          >
            <ExternalLink className="w-3 h-3" />
            <span>RADAR MODAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WindyCurrentsStation;
