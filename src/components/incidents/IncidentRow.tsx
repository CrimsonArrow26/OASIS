import React from 'react';
import { Incident } from '../../types.ts';
import useAppStore from '../../store/useAppStore.ts';

interface IncidentRowProps {
  incident: Incident;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

// Convert decimal degrees to DMS format for authentic military presentation
function toDMS(lat: number, lon: number): string {
  const latDeg = Math.floor(Math.abs(lat));
  const latMin = Math.floor((Math.abs(lat) - latDeg) * 60);
  const latSec = Math.floor(((Math.abs(lat) - latDeg) * 60 - latMin) * 60);
  const latDir = lat >= 0 ? 'N' : 'S';

  const lonDeg = Math.floor(Math.abs(lon));
  const lonMin = Math.floor((Math.abs(lon) - lonDeg) * 60);
  const lonSec = Math.floor(((Math.abs(lon) - lonDeg) * 60 - lonMin) * 60);
  const lonDir = lon >= 0 ? 'E' : 'W';

  return `${String(latDeg).padStart(2, '0')}°${String(latMin).padStart(2, '0')}'${String(latSec).padStart(2, '0')}"${latDir} ${String(lonDeg).padStart(3, '0')}°${String(lonMin).padStart(2, '0')}'${String(lonSec).padStart(2, '0')}"${lonDir}`;
}

export const IncidentRow: React.FC<IncidentRowProps> = ({
  incident,
  isSelected,
  onSelect,
}) => {
  const { themeMode } = useAppStore();
  const isLight = themeMode === 'daylight';
  const confidencePercent = (incident.confidenceScore * 100).toFixed(0);

  const severityColor =
    incident.severity === 'critical'
      ? 'bg-[#FF3B3B]/20 text-[#FF3B3B] border-[#FF3B3B]/30'
      : incident.severity === 'high'
      ? 'bg-[#FFB347]/20 text-[#FFB347] border-[#FFB347]/30'
      : 'bg-[#00FF87]/20 text-emerald-600 dark:text-[#00FF87] border-[#00FF87]/30';

  const dotColor =
    incident.severity === 'critical'
      ? 'bg-[#FF3B3B]'
      : incident.severity === 'high'
      ? 'bg-[#FFB347]'
      : 'bg-[#00FF87]';

  return (
    <div
      onClick={() => onSelect(incident.id)}
      className={`p-3 rounded transition-all cursor-pointer select-none border ${
        isSelected
          ? isLight
            ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
            : 'bg-[#00FF87]/5 border-[#00FF87]/30 shadow-[0_0_12px_rgba(0,255,135,0.08)]'
          : isLight
          ? 'bg-slate-100/60 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
    >
      {/* Top row: ID + Status + Severity Pill */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          <span className={`text-[12px] font-mono font-bold tracking-wide ${
            isLight ? 'text-slate-900' : 'text-[#C8D6E0]'
          }`}>
            {incident.id}
          </span>
        </div>
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${severityColor}`}>
          {incident.severity.toUpperCase()}
        </span>
      </div>

      {/* Bento Grid 2-column detail telemetry matching reference */}
      <div className={`grid grid-cols-2 gap-y-1 text-[11px] ${
        isLight ? 'text-slate-600' : 'opacity-70'
      }`}>
        <span>Detected</span>
        <span className={`font-mono text-right ${isLight ? 'text-slate-800' : 'text-[#C8D6E0]'}`}>
          {incident.detectedAt ? incident.detectedAt.slice(11, 16) + 'Z' : '06:14Z'}
        </span>

        <span>Est. Spill Area</span>
        <span className="font-mono text-right text-[#FFB347] font-semibold">
          {incident.areaKm2} km²
        </span>

        <span>SAR Confidence</span>
        <span className={`font-mono text-right font-semibold ${isLight ? 'text-emerald-700' : 'text-[#00FF87]'}`}>
          {confidencePercent}%
        </span>

        <span>Coordinates</span>
        <span className={`font-mono text-right text-[10px] truncate ${isLight ? 'text-slate-700' : 'text-[#C8D6E0]'}`}>
          {incident.lat.toFixed(2)}°N, {Math.abs(incident.lon).toFixed(2)}°W
        </span>
      </div>

      {/* Progress Bar for Confidence */}
      <div className={`mt-2.5 w-full h-1 rounded-full overflow-hidden ${
        isLight ? 'bg-slate-200' : 'bg-white/5'
      }`}>
        <div
          className={`h-full rounded-full ${isLight ? 'bg-emerald-600' : 'bg-[#00FF87]'}`}
          style={{ width: `${confidencePercent}%` }}
        />
      </div>
    </div>
  );
};

export default IncidentRow;
