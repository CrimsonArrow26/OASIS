import React from 'react';
import { VesselSuspect } from '../../types.ts';
import { AlertTriangle, Ship } from 'lucide-react';
import useAppStore from '../../store/useAppStore.ts';

interface VesselSuspectCardProps {
  suspect: VesselSuspect;
  isSelected?: boolean;
  onSelect?: (mmsi: string) => void;
}

export const VesselSuspectCard: React.FC<VesselSuspectCardProps> = ({
  suspect,
  isSelected,
  onSelect,
}) => {
  const { themeMode } = useAppStore();
  const isLight = themeMode === 'daylight';
  const matchPct = Math.round(suspect.scores.overall * 100);
  const isTopMatch = suspect.rank === 1;

  return (
    <div
      onClick={() => onSelect?.(suspect.mmsi)}
      className={`p-2.5 rounded-r transition-all cursor-pointer border-l-2 ${
        isTopMatch
          ? isLight
            ? 'bg-amber-500/10 border-[#FFB347] hover:bg-amber-500/15'
            : 'bg-black/30 border-[#FFB347] hover:bg-black/40'
          : isLight
          ? 'bg-slate-200/50 border-slate-300 hover:bg-slate-200/80'
          : 'bg-black/20 border-white/20 opacity-75 hover:opacity-100'
      }`}
    >
      {/* Title with Rank, Name, and Match % */}
      <div className="flex justify-between items-center text-[11px] mb-1">
        <span className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-[#C8D6E0]'}`}>
          #{suspect.rank} {suspect.vesselName}
        </span>
        <span className={`font-mono font-semibold flex-shrink-0 ml-1 ${
          isLight ? 'text-emerald-700' : 'text-[#00FF87]'
        }`}>
          {matchPct}% Match
        </span>
      </div>

      {/* Subtitle: Type • MMSI */}
      <div className={`text-[10px] font-mono truncate ${isLight ? 'text-slate-500' : 'opacity-60'}`}>
        {suspect.vesselType} • MMSI: {suspect.mmsi}
      </div>

      {/* Speed & Intersect Offset */}
      <div className={`flex justify-between text-[10px] font-mono mt-1 ${isLight ? 'text-slate-600' : 'opacity-80'}`}>
        <span>Speed: {suspect.speedKts} kts</span>
        <span className="text-[#FFB347]">Intersect: {suspect.intersectOffset}</span>
      </div>

      {/* AIS Gap Indicator if Dark Ship detected */}
      {suspect.aisGapDetected && (
        <div className="mt-1.5 flex items-center gap-1 text-[9px] bg-[#FF3B3B]/20 text-[#FF3B3B] px-1.5 py-0.5 rounded border border-[#FF3B3B]/30 font-mono font-bold w-fit">
          <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
          <span>AIS GAP DETECTED ({suspect.aisGapDurationMinutes}m)</span>
        </div>
      )}
    </div>
  );
};

export default VesselSuspectCard;
