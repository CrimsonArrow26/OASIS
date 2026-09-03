import React from 'react';
import { Incident } from '../../types.ts';
import useAppStore from '../../store/useAppStore.ts';

interface SpillAnalysisProps {
  incident: Incident | null;
}

export const SpillAnalysis: React.FC<SpillAnalysisProps> = ({ incident }) => {
  const { themeMode } = useAppStore();
  const isLight = themeMode === 'daylight';
  if (!incident) return null;

  return (
    <div className="space-y-2.5">
      {/* Bento Grid Detection Geometry Box */}
      <div className={`p-3 rounded border transition-colors duration-200 ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141A22] border-white/10'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] opacity-50 uppercase tracking-wider">
            DETECTION GEOMETRY
          </span>
          <span className={`text-[10px] font-mono text-[#FFB347] px-1.5 py-0.5 rounded border ${
            isLight ? 'bg-amber-50 border-amber-200' : 'bg-white/5 border-white/10'
          }`}>
            {incident.oilType || 'HEAVY FUEL / CRUDE'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className={`border-r ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
            <div className={`text-[16px] font-bold font-mono leading-tight ${
              isLight ? 'text-emerald-700' : 'text-[#00FF87]'
            }`}>
              {incident.areaKm2}
            </div>
            <div className="text-[9px] opacity-40 uppercase tracking-wider mt-0.5">
              AREA KM²
            </div>
          </div>

          <div className={`border-r ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
            <div className={`text-[16px] font-bold font-mono leading-tight ${
              isLight ? 'text-slate-800' : 'text-[#C8D6E0]'
            }`}>
              {incident.geometry?.lengthKm || '8.2'}
            </div>
            <div className="text-[9px] opacity-40 uppercase tracking-wider mt-0.5">
              LENGTH KM
            </div>
          </div>

          <div>
            <div className="text-[16px] font-bold font-mono text-[#FFB347] leading-tight">
              {String(incident.geometry?.orientationDeg || 68).padStart(3, '0')}°
            </div>
            <div className="text-[9px] opacity-40 uppercase tracking-wider mt-0.5">
              HEADING
            </div>
          </div>
        </div>
      </div>

      {/* Spatial Dimensions Footer */}
      <div className={`border rounded px-3 py-1.5 flex items-center justify-between text-[11px] font-mono transition-colors duration-200 ${
        isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0A0C0F] border-white/10'
      }`}>
        <span className="opacity-50">AXIS:</span>
        <span className={isLight ? 'text-slate-900 font-semibold' : 'text-[#C8D6E0]'}>
          {incident.geometry?.lengthKm || 8.2} km × {incident.geometry?.widthKm || 1.4} km
        </span>
        <span className={isLight ? 'text-emerald-700 font-semibold' : 'text-[#00FF87]'}>
          CONF: {(incident.confidenceScore * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

export default SpillAnalysis;
