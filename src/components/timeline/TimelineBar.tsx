import React from 'react';
import useAppStore from '../../store/useAppStore.ts';
import useTimeline from '../../hooks/useTimeline.ts';
import { Incident } from '../../types.ts';
import TimelineScrubber from './TimelineScrubber.tsx';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
} from 'lucide-react';

interface TimelineBarProps {
  selectedIncident: Incident | null;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({ selectedIncident }) => {
  const {
    timelineWindow,
    timelineCursor,
    playbackState,
    playbackSpeed,
    setTimelineCursor,
    setPlaybackState,
    setPlaybackSpeed,
  } = useTimeline();

  const { themeMode, setIsReplayModalOpen, activeReplayPresetTitle } = useAppStore();
  const isLight = themeMode === 'daylight';

  const isPlaying = playbackState === 'playing';

  // Toggle playback speed
  const cycleSpeed = () => {
    const speeds = [0.5, 1, 2, 5, 10, 30];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  // Step 1 hour back
  const stepBack1Hour = () => {
    const prev = new Date(timelineCursor.getTime() - 60 * 60 * 1000);
    if (prev >= timelineWindow.start) setTimelineCursor(prev);
    else setTimelineCursor(timelineWindow.start);
  };

  // Step 1 hour forward
  const stepForward1Hour = () => {
    const next = new Date(timelineCursor.getTime() + 60 * 60 * 1000);
    if (next <= timelineWindow.end) setTimelineCursor(next);
    else setTimelineCursor(timelineWindow.end);
  };

  // Skip to start
  const skipToStart = () => {
    setTimelineCursor(timelineWindow.start);
  };

  // Skip to live (end)
  const skipToLive = () => {
    setTimelineCursor(timelineWindow.end);
    setPlaybackState('paused');
  };

  // Format cursor time
  const yyyy = timelineCursor.getUTCFullYear();
  const mm = String(timelineCursor.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(timelineCursor.getUTCDate()).padStart(2, '0');
  const hh = String(timelineCursor.getUTCHours()).padStart(2, '0');
  const min = String(timelineCursor.getUTCMinutes()).padStart(2, '0');
  const ss = String(timelineCursor.getUTCSeconds()).padStart(2, '0');

  return (
    <div
      className={`h-[88px] border-t px-6 flex items-center justify-between z-50 select-none shrink-0 gap-6 transition-colors duration-200 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-lg'
          : 'bg-[#0F1318] border-white/10 text-[#C8D6E0]'
      }`}
    >
      {/* Left Playback Controls in Bento circular style */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={skipToStart}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
              : 'border-white/20 text-[#C8D6E0] hover:bg-white/5'
          }`}
          title="Skip to Start"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={stepBack1Hour}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
              : 'border-white/20 text-[#C8D6E0] hover:bg-white/5'
          }`}
          title="Step Back 1 Hour"
        >
          <Rewind className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setPlaybackState(isPlaying ? 'paused' : 'playing')}
          className="w-10 h-10 rounded-full bg-[#00FF87] hover:bg-[#00FF87]/90 text-black flex items-center justify-center transition-all active:scale-95 shadow-[0_0_12px_rgba(0,255,135,0.4)] cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play Replay Simulation'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black translate-x-0.5" />}
        </button>

        <button
          onClick={stepForward1Hour}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
              : 'border-white/20 text-[#C8D6E0] hover:bg-white/5'
          }`}
          title="Step Forward 1 Hour"
        >
          <FastForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={skipToLive}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isLight
              ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
              : 'border-white/20 text-[#C8D6E0] hover:bg-white/5'
          }`}
          title="Skip to Live"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Speed multiplier pill */}
        <button
          onClick={cycleSpeed}
          className={`ml-1 px-2.5 py-1 rounded border text-[10px] font-mono transition-colors cursor-pointer ${
            isLight
              ? 'bg-slate-100 border-slate-300 text-slate-700 hover:border-[#00FF87]'
              : 'bg-white/5 border-white/10 hover:border-[#00FF87] text-[#C8D6E0]'
          }`}
          title="Playback speed multiplier"
        >
          {playbackSpeed}x
        </button>

        {/* Date Range / Replay Configuration Launcher */}
        <button
          onClick={() => setIsReplayModalOpen(true)}
          className={`ml-1 px-2.5 py-1 rounded border text-[10px] font-mono font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1 ${
            isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : 'bg-[#00FF87]/10 border-[#00FF87]/30 text-[#00FF87] hover:bg-[#00FF87]/20'
          }`}
          title="Configure Surveillance Date Range & Presets"
        >
          <span>DATE RANGE</span>
        </button>
      </div>

      {/* Center Scrubber */}
      <TimelineScrubber selectedIncident={selectedIncident} />

      {/* Right Bento Clock Display */}
      <div
        className={`text-right shrink-0 pl-4 border-l ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}
      >
        <div className={`text-[13px] font-mono font-bold leading-none ${isLight ? 'text-slate-800' : 'text-[#C8D6E0]'}`}>
          {yyyy}-{mm}-{dd}
        </div>
        <div className="text-[18px] font-mono text-[#00FF87] font-medium tracking-tight mt-1">
          {hh}:{min}:{ss} <span className="text-[11px] opacity-60">UTC</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineBar;
