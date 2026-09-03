import React, { useRef, useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore.ts';
import { Incident } from '../../types.ts';
import { Satellite, Droplet } from 'lucide-react';

interface TimelineScrubberProps {
  selectedIncident: Incident | null;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({ selectedIncident }) => {
  const {
    timelineWindow,
    timelineCursor,
    setTimelineCursor,
    themeMode,
    setIsReplayModalOpen,
    activeReplayPresetTitle,
  } = useAppStore();

  const isLight = themeMode === 'daylight';

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const startTime = timelineWindow.start.getTime();
  const endTime = timelineWindow.end.getTime();
  const totalDuration = Math.max(1, endTime - startTime);

  // Calculate percentage of cursor
  const cursorTime = timelineCursor.getTime();
  const cursorPercent = Math.min(100, Math.max(0, ((cursorTime - startTime) / totalDuration) * 100));

  // Incident origin percentage (e.g. 2024-05-24 21:18 UTC)
  const originDate = selectedIncident?.estimatedOriginAt
    ? new Date(selectedIncident.estimatedOriginAt)
    : new Date('2024-05-24T21:18:00Z');
  const originPercent = Math.min(100, Math.max(0, ((originDate.getTime() - startTime) / totalDuration) * 100));

  // SAR Pass percentage (e.g. 2024-05-25 00:14 UTC)
  const sarPassDate = selectedIncident?.detectedAt
    ? new Date(selectedIncident.detectedAt)
    : new Date('2024-05-25T00:14:22Z');
  const sarPassPercent = Math.min(100, Math.max(0, ((sarPassDate.getTime() - startTime) / totalDuration) * 100));

  // Handle scrubber drag
  const handleSeek = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const newTime = new Date(startTime + ratio * totalDuration);
    setTimelineCursor(newTime);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSeek(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleSeek(e.clientX);
      }
    };
    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Generate 8 evenly spaced time ticks
  const ticks = [];
  const tickCount = 8;
  for (let i = 0; i <= tickCount; i++) {
    const t = new Date(startTime + (i / tickCount) * totalDuration);
    const mm = String(t.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(t.getUTCDate()).padStart(2, '0');
    const hh = String(t.getUTCHours()).padStart(2, '0');
    const min = String(t.getUTCMinutes()).padStart(2, '0');
    const label = `${mm}-${dd} ${hh}:${min}`;
    ticks.push({
      percent: (i / tickCount) * 100,
      label,
    });
  }

  // Duration in hours
  const hoursDuration = (totalDuration / (1000 * 60 * 60)).toFixed(0);

  return (
    <div className="flex-1 flex flex-col justify-center px-4">
      {/* Top Labels row matching Image 5 */}
      <div className={`flex justify-between items-center text-[10px] font-mono mb-1 ${isLight ? 'text-slate-500' : 'text-[#6B8499]'}`}>
        <span className="flex items-center gap-1 text-[#FFB347]">
          <span>INCIDENT ORIGIN 21:18 UTC</span>
        </span>

        {/* Clickable Historical Replay Window Label */}
        <button
          onClick={() => setIsReplayModalOpen(true)}
          className={`px-2 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 font-semibold ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-white/5 hover:bg-white/10 border-white/15 text-[#C8D6E0]'
          }`}
          title="Click to change replay date range"
        >
          <span>REPLAY WINDOW: {activeReplayPresetTitle} ({hoursDuration}H)</span>
        </button>

        <span className="text-[#00FF87] flex items-center gap-1 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87] animate-ping"></span>
          LIVE EDGE
        </span>
      </div>

      {/* Scrubber track container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className={`relative h-6 rounded cursor-pointer select-none overflow-visible border ${
          isLight
            ? 'bg-slate-200/80 border-slate-300 shadow-inner'
            : 'bg-white/5 border-white/10'
        }`}
      >
        {/* Subtle grid dashes along track */}
        <div className="absolute inset-0 flex justify-between px-4 items-center pointer-events-none opacity-25">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className={`w-0.5 h-2.5 ${isLight ? 'bg-slate-600' : 'bg-white/40'}`} />
          ))}
        </div>

        {/* Progress fill from start to cursor */}
        <div
          className={`absolute top-0 left-0 bottom-0 ${
            isLight
              ? 'bg-emerald-500/25 border-r-2 border-emerald-600'
              : 'bg-[#00FF87]/20 border-r border-[#00FF87]/60'
          }`}
          style={{ width: `${cursorPercent}%` }}
        />

        {/* Shaded AIS Gap interval (Dark Ship Window) */}
        {originPercent >= 0 && originPercent <= 100 && (
          <div
            className="absolute top-0 bottom-0 bg-[#FF3B3B]/20 border-x border-[#FF3B3B]/50"
            style={{
              left: `${Math.max(0, originPercent - 4)}%`,
              width: '8%',
            }}
            title="AIS Gap Interval (Dark Ship Window: 150m)"
          />
        )}

        {/* Origin Marker (Droplet Flag) */}
        {originPercent >= 0 && originPercent <= 100 && (
          <div
            className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none z-10"
            style={{ left: `${originPercent}%` }}
          >
            <div className="w-[1.5px] h-full bg-[#FF3B3B]" />
            <div className="absolute -top-4 bg-[#FF3B3B]/25 border border-[#FF3B3B]/50 rounded px-1 text-[8px] font-mono text-[#FF3B3B] whitespace-nowrap flex items-center gap-0.5 font-bold shadow-sm">
              <Droplet className="w-2 h-2 fill-[#FF3B3B]" />
              <span>ORIGIN: 21:18</span>
            </div>
          </div>
        )}

        {/* SAR Satellite Pass Marker */}
        {sarPassPercent >= 0 && sarPassPercent <= 100 && (
          <div
            className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none z-10"
            style={{ left: `${sarPassPercent}%` }}
          >
            <div className="w-[1.5px] h-full bg-[#00FF87]" />
            <div className={`absolute -bottom-4 border rounded px-1 text-[8px] font-mono text-[#00FF87] whitespace-nowrap flex items-center gap-0.5 font-bold shadow-sm ${
              isLight ? 'bg-slate-900 border-emerald-400' : 'bg-black/90 border-[#00FF87]/40'
            }`}>
              <Satellite className="w-2 h-2 text-[#00FF87]" />
              <span>SAR PASS: 00:14</span>
            </div>
          </div>
        )}

        {/* Draggable Scrubber Thumb in Bento Diamond Style */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#00FF87] rotate-45 shadow-[0_0_10px_rgba(0,255,135,0.7)] -ml-[7px] pointer-events-none z-20 transition-transform"
          style={{ left: `${cursorPercent}%` }}
        />
      </div>

      {/* Time ticks row underneath track */}
      <div className={`relative h-4 mt-1 text-[9px] font-mono opacity-60 ${isLight ? 'text-slate-600' : 'text-[#6B8499]'}`}>
        {ticks.map((tick, idx) => (
          <div
            key={idx}
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${tick.percent}%` }}
          >
            <div className={`w-[1px] h-1 ${isLight ? 'bg-slate-400' : 'bg-white/20'}`} />
            <span className="whitespace-nowrap mt-0.5">{tick.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineScrubber;
