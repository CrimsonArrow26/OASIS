import React from 'react';
import { Incident } from '../../types.ts';
import useAppStore from '../../store/useAppStore.ts';
import CompassRose from './CompassRose.tsx';
import { ShieldAlert, FileDown, CheckCircle } from 'lucide-react';

interface DriftPredictionProps {
  incident: Incident | null;
}

export const DriftPrediction: React.FC<DriftPredictionProps> = ({ incident }) => {
  const {
    activeDriftTab,
    setActiveDriftTab,
    dispatchAlert,
    triggerDispatch,
    evidenceExported,
    triggerExportEvidence,
    themeMode,
  } = useAppStore();
  const isLight = themeMode === 'daylight';

  if (!incident) return null;

  return (
    <div className={`border p-3 rounded space-y-3 transition-colors duration-200 ${
      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
    }`}>
      {/* Header and Tabs matching Bento Grid reference */}
      <div>
        <div className={`flex border-b mb-2.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <button
            onClick={() => setActiveDriftTab('hindcast')}
            className={`text-[10px] font-bold px-3 py-1.5 uppercase transition-colors cursor-pointer ${
              activeDriftTab === 'hindcast'
                ? 'border-b-2 border-[#FFB347] text-[#FFB347]'
                : isLight ? 'text-slate-500 hover:text-slate-800' : 'opacity-40 hover:opacity-80 text-[#C8D6E0]'
            }`}
          >
            HINDCAST (-12H)
          </button>
          <button
            onClick={() => setActiveDriftTab('forecast')}
            className={`text-[10px] font-bold px-3 py-1.5 uppercase transition-colors cursor-pointer ${
              activeDriftTab === 'forecast'
                ? 'border-b-2 border-[#FFB347] text-[#FFB347]'
                : isLight ? 'text-slate-500 hover:text-slate-800' : 'opacity-40 hover:opacity-80 text-[#C8D6E0]'
            }`}
          >
            FORECAST (+24H)
          </button>
        </div>
      </div>

      {/* Compass Rose Widget */}
      <CompassRose
        headingDeg={incident.drift?.dominantCurrentDir || 68}
        speedKts={incident.drift?.surfaceCurrentKts || 1.8}
        label={`${String(incident.drift?.dominantCurrentDir || 68).padStart(3, '0')}°`}
        subLabel={`${incident.drift?.surfaceCurrentKts || 1.8} KTS`}
      />

      {/* Uncertainty Bar in Bento Grid style */}
      <div className="space-y-1">
        <div className={`flex justify-between text-[10px] font-mono ${isLight ? 'text-slate-500' : 'opacity-60'}`}>
          <span>MODEL UNCERTAINTY</span>
          <span className="text-[#FFB347]">±30% CONE</span>
        </div>
        <div className={`h-1.5 w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/5'}`}>
          <div className="h-full bg-[#FFB347] w-[70%] rounded-full" />
        </div>
      </div>

      {/* Numerical specifications */}
      <div className={`border rounded p-2.5 font-mono text-xs space-y-1.5 ${
        isLight ? 'bg-white border-slate-200' : 'bg-black/20 border-white/10'
      }`}>
        <div className="flex justify-between items-center text-[11px]">
          <span className="opacity-50">ORIGIN:</span>
          <span className={isLight ? 'text-slate-800 font-semibold' : 'text-[#C8D6E0]'}>
            {incident.drift?.originLat ? `${incident.drift.originLat.toFixed(4)}°N, ${Math.abs(incident.drift.originLon).toFixed(4)}°W` : '28.201°N 089.421°W'}
          </span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="opacity-50">DISCHARGE:</span>
          <span className="text-[#FFB347]">{incident.drift?.dischargeWindow || '2024-05-24 20:00 - 22:30 UTC'}</span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="opacity-50">CURRENT:</span>
          <span className={isLight ? 'text-emerald-700 font-semibold' : 'text-[#00FF87]'}>
            {incident.drift?.surfaceCurrentKts || 1.8} KTS @ {String(incident.drift?.dominantCurrentDir || 68).padStart(3, '0')}°
          </span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="opacity-50">WIND:</span>
          <span className={isLight ? 'text-slate-800' : 'text-[#C8D6E0]'}>
            {incident.drift?.localWindKts || 12} KTS @ {String(incident.drift?.dominantWindDir || 45).padStart(3, '0')}°
          </span>
        </div>
      </div>

      {/* Dispatch notification banner if triggered */}
      {dispatchAlert && (
        <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/40 rounded p-2 text-xs font-mono text-[#FF3B3B] flex items-start gap-2 animate-bounce">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">CG-08 COMMAND DISPATCH INITIATED</div>
            <div className="text-[10px] opacity-80 mt-0.5 leading-tight">
              {dispatchAlert.message}
            </div>
          </div>
        </div>
      )}

      {/* Export evidence feedback banner */}
      {evidenceExported && (
        <div className="bg-[#00FF87]/10 border border-[#00FF87]/30 rounded p-2 text-xs font-mono text-[#00FF87] flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <div className="text-[11px]">
            DOSSIER GENERATED: SHA-256 HASH VERIFIED
          </div>
        </div>
      )}

      {/* Operational action buttons in Bento grid */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={triggerDispatch}
          className="flex items-center justify-center gap-1.5 bg-[#FF3B3B]/15 hover:bg-[#FF3B3B]/25 border border-[#FF3B3B]/40 text-[#FF3B3B] rounded py-2 px-2 text-[10px] font-mono font-bold tracking-wider transition-colors active:scale-95 cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          DISPATCH CG-08
        </button>

        <button
          onClick={triggerExportEvidence}
          className={`flex items-center justify-center gap-1.5 rounded py-2 px-2 text-[10px] font-mono tracking-wider transition-colors active:scale-95 cursor-pointer border ${
            isLight
              ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-[#C8D6E0]'
          }`}
        >
          <FileDown className="w-3.5 h-3.5" />
          EXPORT EVID
        </button>
      </div>
    </div>
  );
};

export default DriftPrediction;
