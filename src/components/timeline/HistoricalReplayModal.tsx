import React, { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore.ts';
import {
  Calendar,
  Clock,
  Play,
  RotateCcw,
  CloudUpload,
  CheckCircle2,
  Bookmark,
  History,
  X,
  FastForward,
  ShieldAlert,
} from 'lucide-react';
import { FirebaseService, FirebaseHistoricalReplay } from '../../services/firebase.ts';

interface PresetOption {
  id: string;
  title: string;
  badge: string;
  description: string;
  startDate: string;
  endDate: string;
  cursorDate: string;
  speed: number;
}

const PRESETS: PresetOption[] = [
  {
    id: 'gulf-spill-48h',
    title: 'Gulf Spill Attribution Window (Primary)',
    badge: '48H EVENT',
    description: 'MV NORDIC TITAN passage, AIS silence gap, origin discharge at 21:18 UTC, and Sentinel-1A SAR detection pass.',
    startDate: '2024-05-23T14:00:00Z',
    endDate: '2024-05-25T14:32:08Z',
    cursorDate: '2024-05-24T18:00:00Z',
    speed: 5,
  },
  {
    id: 'rapid-focus-24h',
    title: 'Discharge & Detection Rapid Focus',
    badge: '24H CORE',
    description: 'Focused 24-hour sequence centered directly on the dark ship gap, spill origin, and drift trajectory.',
    startDate: '2024-05-24T12:00:00Z',
    endDate: '2024-05-25T12:00:00Z',
    cursorDate: '2024-05-24T18:00:00Z',
    speed: 2,
  },
  {
    id: 'pre-incident-baseline',
    title: 'Pre-Incident Surveillance Baseline',
    badge: 'BASELINE',
    description: 'Normal merchant vessel traffic corridors in Mississippi Canyon before the critical spill discharge anomaly.',
    startDate: '2024-05-21T00:00:00Z',
    endDate: '2024-05-23T14:00:00Z',
    cursorDate: '2024-05-21T00:00:00Z',
    speed: 10,
  },
  {
    id: 'extended-5day-investigation',
    title: 'Comprehensive 5-Day Multi-Agency Chronology',
    badge: '5-DAY FULL',
    description: 'Complete multi-day sequence covering vessel approaches, discharge event, weather shifts, and USCG intercept dispatch.',
    startDate: '2024-05-22T00:00:00Z',
    endDate: '2024-05-27T00:00:00Z',
    cursorDate: '2024-05-22T00:00:00Z',
    speed: 10,
  },
];

export const HistoricalReplayModal: React.FC = () => {
  const {
    isReplayModalOpen,
    setIsReplayModalOpen,
    timelineWindow,
    setTimelineWindow,
    timelineCursor,
    setTimelineCursor,
    playbackSpeed,
    setPlaybackSpeed,
    setPlaybackState,
    themeMode,
    activeReplayPresetTitle,
    setActiveReplayPresetTitle,
  } = useAppStore();

  const isLight = themeMode === 'daylight';

  // Local state for custom date/time inputs (ISO strings trimmed for datetime-local)
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  const [customStart, setCustomStart] = useState<string>(toLocalInput(timelineWindow.start));
  const [customEnd, setCustomEnd] = useState<string>(toLocalInput(timelineWindow.end));
  const [selectedSpeed, setSelectedSpeed] = useState<number>(playbackSpeed);
  const [saveTitle, setSaveTitle] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedReplays, setSavedReplays] = useState<FirebaseHistoricalReplay[]>([]);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'saved'>('presets');

  // Sync inputs when modal opens
  useEffect(() => {
    if (isReplayModalOpen) {
      setCustomStart(toLocalInput(timelineWindow.start));
      setCustomEnd(toLocalInput(timelineWindow.end));
      setSelectedSpeed(playbackSpeed);
      setSaveStatus('idle');
    }
  }, [isReplayModalOpen, timelineWindow, playbackSpeed]);

  // Subscribe to Firebase saved replays
  useEffect(() => {
    const unsubscribe = FirebaseService.subscribeHistoricalReplays(
      (replays) => setSavedReplays(replays),
      (err) => console.warn('Firebase replays subscription notice:', err)
    );
    return () => unsubscribe();
  }, []);

  if (!isReplayModalOpen) return null;

  const handleApplyPreset = (preset: PresetOption, autoplay = true) => {
    const start = new Date(preset.startDate);
    const end = new Date(preset.endDate);
    const cursor = new Date(preset.cursorDate);

    setTimelineWindow({ start, end });
    setTimelineCursor(cursor);
    setPlaybackSpeed(preset.speed);
    setActiveReplayPresetTitle(preset.title);

    if (autoplay) {
      setPlaybackState('playing');
    }
    setIsReplayModalOpen(false);
  };

  const handleApplyCustom = (autoplay = false) => {
    try {
      const start = new Date(customStart + ':00Z');
      const end = new Date(customEnd + ':00Z');

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        alert('Please enter valid UTC date and time');
        return;
      }

      if (start >= end) {
        alert('Start time must precede end time');
        return;
      }

      setTimelineWindow({ start, end });
      setTimelineCursor(start);
      setPlaybackSpeed(selectedSpeed);
      setActiveReplayPresetTitle('Custom Date Range');

      if (autoplay) {
        setPlaybackState('playing');
      }
      setIsReplayModalOpen(false);
    } catch (e) {
      console.error('Failed to parse dates', e);
    }
  };

  const handleSaveToFirebase = async () => {
    if (!saveTitle.trim()) return;
    setSaveStatus('saving');
    try {
      const replayId = 'REPLAY-' + Date.now();
      const start = new Date(customStart + ':00Z').toISOString();
      const end = new Date(customEnd + ':00Z').toISOString();

      await FirebaseService.saveHistoricalReplay({
        id: replayId,
        title: saveTitle.trim(),
        startDate: start,
        endDate: end,
        cursorDate: start,
        playbackSpeed: selectedSpeed,
        focusedIncidentId: 'OSP-2024-0047',
        createdAt: new Date().toISOString(),
      });

      setSaveStatus('saved');
      setSaveTitle('');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save replay to Firebase', err);
      setSaveStatus('error');
    }
  };

  const handleLoadSavedReplay = (replay: FirebaseHistoricalReplay, autoplay = true) => {
    const start = new Date(replay.startDate);
    const end = new Date(replay.endDate);
    const cursor = replay.cursorDate ? new Date(replay.cursorDate) : start;

    setTimelineWindow({ start, end });
    setTimelineCursor(cursor);
    if (replay.playbackSpeed) setPlaybackSpeed(replay.playbackSpeed);
    setActiveReplayPresetTitle(replay.title);

    if (autoplay) {
      setPlaybackState('playing');
    }
    setIsReplayModalOpen(false);
  };

  // Calculate duration in hours
  const startMs = new Date(customStart + ':00Z').getTime();
  const endMs = new Date(customEnd + ':00Z').getTime();
  const durationHours = !isNaN(startMs) && !isNaN(endMs) && endMs > startMs ? ((endMs - startMs) / (1000 * 60 * 60)).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div
        className={`w-full max-w-2xl rounded border shadow-2xl overflow-hidden flex flex-col font-['Space_Grotesk'] animate-in fade-in zoom-in-95 duration-150 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
            : 'bg-[#0F1318] border-white/15 text-[#C8D6E0]'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-[#141A22]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#00FF87]/15 border border-[#00FF87]/40 flex items-center justify-center text-[#00FF87]">
              <History className="w-4 h-4 text-[#00FF87]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide">HISTORICAL REPLAY CONTROL CENTER</h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/30">
                  SYNCHRONIZED C2
                </span>
              </div>
              <p className="text-xs opacity-60 font-mono">
                Select surveillance date range &amp; execute timeline-scrubbed playback of vessel trajectories and incident formations.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsReplayModalOpen(false)}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-[#6B8499] hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex border-b text-xs font-mono shrink-0 px-4 pt-2 gap-2 ${
            isLight ? 'border-slate-200 bg-slate-100/70' : 'border-white/10 bg-[#0A0C0F]'
          }`}
        >
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'border-[#00FF87] text-[#00FF87]'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>OPERATIONAL PRESETS</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-[#00FF87] text-[#00FF87]'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>CUSTOM DATE RANGE</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'border-[#00FF87] text-[#00FF87]'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>SAVED ARCHIVE ({savedReplays.length})</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
          {/* TAB 1: OPERATIONAL PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="text-xs font-mono opacity-70 mb-2">
                Select an authentic operational surveillance window to synchronize historical vessel movements with detected oil spill occurrence:
              </div>

              {PRESETS.map((preset) => {
                const isSelected = activeReplayPresetTitle === preset.title;
                return (
                  <div
                    key={preset.id}
                    className={`p-3.5 rounded border transition-all ${
                      isSelected
                        ? 'border-[#00FF87] bg-[#00FF87]/5 shadow-[0_0_12px_rgba(0,255,135,0.08)]'
                        : isLight
                        ? 'border-slate-200 hover:border-slate-300 bg-slate-50'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono tracking-wide">
                          {preset.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30">
                          {preset.badge}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleApplyPreset(preset, false)}
                          className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                            isLight
                              ? 'border-slate-300 hover:bg-slate-200 text-slate-700'
                              : 'border-white/20 hover:bg-white/10 text-[#C8D6E0]'
                          }`}
                        >
                          SET RANGE
                        </button>
                        <button
                          onClick={() => handleApplyPreset(preset, true)}
                          className="px-3 py-1 text-xs font-mono font-bold rounded bg-[#00FF87] hover:bg-[#00FF87]/90 text-black flex items-center gap-1 shadow-[0_0_8px_rgba(0,255,135,0.3)] cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-black" />
                          <span>PLAY REPLAY</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs opacity-70 mb-2 leading-relaxed">{preset.description}</p>

                    <div className="flex items-center gap-4 text-[11px] font-mono opacity-80 pt-1 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#00FF87]" />
                        <span>UTC: {preset.startDate.replace('T', ' ').replace(':00Z', '')} → {preset.endDate.replace('T', ' ').replace(':08Z', '').replace(':00Z', '')}</span>
                      </span>
                      <span className="text-[#FFB347]">SPEED: {preset.speed}x</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: CUSTOM DATE RANGE */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="p-4 rounded border bg-white/5 border-white/10 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Datetime */}
                  <div>
                    <label className="block text-xs font-mono font-semibold mb-1 opacity-80">
                      START DATE &amp; TIME (UTC):
                    </label>
                    <input
                      type="datetime-local"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className={`w-full p-2 rounded text-xs font-mono border focus:outline-none focus:border-[#00FF87] ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-[#0A0C0F] border-white/20 text-[#C8D6E0]'
                      }`}
                    />
                  </div>

                  {/* End Datetime */}
                  <div>
                    <label className="block text-xs font-mono font-semibold mb-1 opacity-80">
                      END DATE &amp; TIME (UTC):
                    </label>
                    <input
                      type="datetime-local"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className={`w-full p-2 rounded text-xs font-mono border focus:outline-none focus:border-[#00FF87] ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-[#0A0C0F] border-white/20 text-[#C8D6E0]'
                      }`}
                    />
                  </div>
                </div>

                {/* Duration & Speed */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="opacity-60">Calculated Surveillance Window:</span>
                    <span className="font-bold text-[#00FF87]">{durationHours} Hours</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="opacity-60">Playback Multiplier:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 5, 10, 30, 60].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setSelectedSpeed(spd)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                            selectedSpeed === spd
                              ? 'bg-[#00FF87] text-black border-[#00FF87] font-bold'
                              : 'bg-white/5 border-white/10 hover:border-white/30'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Custom */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => handleApplyCustom(false)}
                  className={`px-4 py-2 rounded text-xs font-mono border transition-colors cursor-pointer ${
                    isLight
                      ? 'border-slate-300 hover:bg-slate-100 text-slate-800'
                      : 'border-white/20 hover:bg-white/10 text-[#C8D6E0]'
                  }`}
                >
                  APPLY DATE RANGE ONLY
                </button>
                <button
                  onClick={() => handleApplyCustom(true)}
                  className="px-4 py-2 rounded text-xs font-mono font-bold bg-[#00FF87] hover:bg-[#00FF87]/90 text-black flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,255,135,0.4)] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>APPLY &amp; PLAY FROM START</span>
                </button>
              </div>

              {/* Firebase Save Feature */}
              <div className="mt-4 p-3.5 rounded border border-white/10 bg-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <CloudUpload className="w-3.5 h-3.5 text-[#00FF87]" />
                  <span className="text-xs font-mono font-bold text-[#00FF87]">
                    SAVE CUSTOM RANGE TO FIREBASE FIRESTORE
                  </span>
                </div>
                <p className="text-[11px] opacity-70 font-mono">
                  Persist this historical investigation replay to the cloud so command staff can review the identical time sequence later.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter Replay Scenario Title (e.g. Tanker Discharge Track Audit)..."
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    className={`flex-1 p-2 rounded text-xs font-mono border focus:outline-none focus:border-[#00FF87] ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-[#0A0C0F] border-white/20 text-[#C8D6E0]'
                    }`}
                  />
                  <button
                    onClick={handleSaveToFirebase}
                    disabled={!saveTitle.trim() || saveStatus === 'saving'}
                    className="px-3.5 py-2 rounded text-xs font-mono font-bold bg-[#00FF87] text-black hover:bg-[#00FF87]/90 disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {saveStatus === 'saving' ? (
                      'SAVING...'
                    ) : saveStatus === 'saved' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>SAVED!</span>
                      </>
                    ) : (
                      'SAVE REPLAY'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAVED REPLAYS FROM FIREBASE */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              <div className="text-xs font-mono opacity-70 mb-2">
                Replay sessions stored in Firebase Firestore (<span className="text-[#00FF87]">/historicalReplays</span>):
              </div>

              {savedReplays.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-white/10 rounded font-mono text-xs opacity-60">
                  NO SAVED REPLAYS IN FIREBASE YET.
                  <br />
                  <span className="text-[11px] opacity-75">Configure a custom range and click "Save Replay" to persist your first session.</span>
                </div>
              ) : (
                savedReplays.map((rep) => (
                  <div
                    key={rep.id}
                    className={`p-3.5 rounded border transition-all flex items-center justify-between gap-3 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono">{rep.title}</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 opacity-70">
                          {rep.id}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono opacity-70 flex items-center gap-3">
                        <span>UTC: {new Date(rep.startDate).toISOString().replace('T', ' ').slice(0, 16)} → {new Date(rep.endDate).toISOString().replace('T', ' ').slice(0, 16)}</span>
                        {rep.playbackSpeed && <span className="text-[#FFB347]">{rep.playbackSpeed}x</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => handleLoadSavedReplay(rep, true)}
                      className="px-3 py-1.5 text-xs font-mono font-bold rounded bg-[#00FF87] hover:bg-[#00FF87]/90 text-black flex items-center gap-1 shadow-[0_0_8px_rgba(0,255,135,0.3)] cursor-pointer shrink-0"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      <span>LOAD &amp; PLAY</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          className={`p-3 border-t flex items-center justify-between text-[11px] font-mono shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-white/10 bg-[#141A22] text-[#6B8499]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
            <span>ACTIVE WINDOW: {timelineWindow.start.toISOString().slice(0, 16).replace('T', ' ')} → {timelineWindow.end.toISOString().slice(0, 16).replace('T', ' ')} UTC</span>
          </div>

          <button
            onClick={() => setIsReplayModalOpen(false)}
            className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoricalReplayModal;
