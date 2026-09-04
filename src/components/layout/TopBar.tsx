import React, { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore.ts';
import DataService from '../../services/DataService.ts';
import {
  ShieldAlert,
  Radio,
  Satellite,
  Cpu,
  Sun,
  Moon,
  Database,
  Sliders,
  User,
  History,
  Cloud,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    satelliteStatus,
    modelStatus,
    wsStatus,
    themeMode,
    toggleThemeMode,
    setIsReplayModalOpen,
    activeReplayPresetTitle,
  } = useAppStore();

  const isLight = themeMode === 'daylight';

  const [timeUtc, setTimeUtc] = useState<string>('');
  const [isLiveActive, setIsLiveActive] = useState<boolean>(DataService.getIsLive());
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // UTC clock update interval
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setTimeUtc(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleLiveMode = () => {
    const next = !isLiveActive;
    DataService.setLiveMode(next);
    setIsLiveActive(next);
  };

  return (
    <header
      className={`h-12 border-b px-4 flex items-center justify-between z-50 select-none shrink-0 transition-colors duration-200 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
          : 'bg-[#0F1318] border-white/10 text-[#C8D6E0]'
      }`}
    >
      {/* Left: Branding & Node identification */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#FFB347]/15 border border-[#FFB347]/40 flex items-center justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-[#FFB347]" />
          </div>
          <span className={`text-[13px] font-bold tracking-[0.08em] ${isLight ? 'text-slate-900' : 'text-[#C8D6E0]'}`}>
            OASIS
          </span>
          <span className={`text-[10px] font-mono px-1 rounded ${isLight ? 'bg-slate-100 text-slate-600' : 'opacity-50 bg-white/5'}`}>
            v2.1
          </span>
        </div>

        <span className={`font-mono hidden sm:inline ${isLight ? 'text-slate-300' : 'text-white/10'}`}>|</span>

        <span className={`text-[11px] font-mono tracking-wider hidden sm:inline-block ${isLight ? 'text-slate-500' : 'opacity-60'}`}>
          SYS_NODE: <span className={`font-semibold ${isLight ? 'text-slate-800' : 'opacity-100 text-[#C8D6E0]'}`}>ALPHA-7</span>
        </span>

        {/* Historical Replay Button directly in header */}
        <button
          onClick={() => setIsReplayModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border transition-all cursor-pointer shadow-sm ${
            isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : 'bg-[#00FF87]/10 border-[#00FF87]/40 text-[#00FF87] hover:bg-[#00FF87]/20 shadow-[0_0_8px_rgba(0,255,135,0.15)]'
          }`}
          title="Open Historical Data Replay & Date Range Picker"
        >
          <History className="w-3 h-3 text-[#00FF87]" />
          <span className="font-bold">HISTORICAL REPLAY</span>
          <span className="hidden xl:inline opacity-75 font-normal">[{activeReplayPresetTitle}]</span>
        </button>
      </div>

      {/* Center: Real-time Status Pills in Bento Grid style */}
      <div className="hidden lg:flex items-center gap-2.5">
        {/* Satellite Uplink */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1 border rounded-sm ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
          <span className="text-[10px] font-medium tracking-wide">SATELLITE</span>
          <span className="text-[10px] font-mono text-[#00FF87] font-bold">{satelliteStatus}</span>
        </div>

        {/* AIS Feed */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1 border rounded-sm ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
          <span className="text-[10px] font-medium tracking-wide">AIS FEED</span>
          <span className="text-[10px] font-mono text-[#00FF87] font-bold">
            {isLiveActive ? 'LIVE' : 'SIMULATED'}
          </span>
        </div>

        {/* Firebase Cloud Sync Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-sm ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-[#C8D6E0]'
          }`}
          title="Firebase Firestore Cloud Persistence active"
        >
          <Cloud className="w-3 h-3 text-[#00FF87]" />
          <span className="text-[10px] font-mono font-bold text-[#00FF87]">FIREBASE SYNC</span>
        </div>
      </div>

      {/* Right: Master Clock & C2 Controls */}
      <div className="flex items-center gap-2.5">
        {/* UTC Master Clock */}
        <div
          className={`px-2.5 py-1 border rounded-sm font-mono text-[11px] font-medium tracking-wide ${
            isLight
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : 'bg-white/5 border-white/10 text-[#00FF87]'
          }`}
        >
          {timeUtc || '13:42:09 UTC'}
        </div>

        {/* Watchstander Operator Tag */}
        <span className={`text-[11px] font-mono hidden xl:inline-block ${isLight ? 'text-slate-500' : 'opacity-60'}`}>
          OP-7734
        </span>

        {/* Mode Toggle: Mock vs Live REST */}
        <button
          onClick={handleToggleLiveMode}
          className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-mono border transition-colors cursor-pointer ${
            isLiveActive
              ? isLight
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-[#00FF87]/15 border-[#00FF87]/40 text-[#00FF87]'
              : isLight
              ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              : 'bg-white/5 border-white/10 text-[#6B8499] hover:text-[#C8D6E0] hover:bg-white/10'
          }`}
          title="Toggle Adapter Data Feed: Mock JSON vs Live API"
        >
          <Database className="w-3 h-3" />
          <span>{isLiveActive ? 'LIVE' : 'MOCK'}</span>
        </button>

        {/* Tactical Dark / Daylight Mode Toggle */}
        <button
          onClick={toggleThemeMode}
          className={`p-1.5 border rounded-sm transition-colors cursor-pointer ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-[#6B8499] hover:text-[#C8D6E0]'
          }`}
          title={`Switch to ${themeMode === 'dark' ? 'Daylight C2' : 'Military Dark Tactical'} Theme`}
        >
          {themeMode === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#FFB347]" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
        </button>

        {/* C2 Settings / Calibration */}
        <button
          onClick={() => setShowConfigModal(true)}
          className={`p-1.5 border rounded-sm transition-colors cursor-pointer ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-[#6B8499] hover:text-[#C8D6E0]'
          }`}
          title="Tactical Configuration & Node Diagnostics"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Watchstander Avatar */}
        <div
          className={`w-7 h-7 rounded-full border flex items-center justify-center font-mono text-[10px] font-bold ${
            isLight
              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
              : 'bg-white/5 border-white/10 text-[#00FF87]'
          }`}
        >
          MS
        </div>
      </div>

      {/* Diagnostics / Config Modal in Bento Grid styling */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div
            className={`border rounded max-w-md w-full p-5 space-y-4 font-mono text-xs shadow-2xl ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0F1318] border-white/10 text-[#C8D6E0]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-bold text-[#00FF87] text-sm tracking-wide">OASIS C2 DIAGNOSTICS</span>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-[#6B8499] hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div className={`flex justify-between p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <span className="opacity-60">SAR Pipeline:</span>
                <span className="text-[#00FF87]">Sentinel-1A (ESA SciHub)</span>
              </div>
              <div className={`flex justify-between p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <span className="opacity-60">AIS Stream Ingest:</span>
                <span className="text-[#00FF87]">AISstream WebSocket</span>
              </div>
              <div className={`flex justify-between p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <span className="opacity-60">Drift Simulation Engine:</span>
                <span className="text-[#00FF87]">NOAA GNOME 1.5.2</span>
              </div>
              <div className={`flex justify-between p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <span className="opacity-60">Weather &amp; Metocean:</span>
                <span className="text-[#00FF87]">Windy.com API</span>
              </div>
              <div className={`flex justify-between p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <span className="opacity-60">Cloud Database:</span>
                <span className="text-[#00FF87]">Firebase Firestore (Live Sync)</span>
              </div>
              <div className={`flex justify-between p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <span className="opacity-60">Data Adapter Mode:</span>
                <span className="text-[#FFB347]">{isLiveActive ? 'LIVE REST / WS' : 'MOCK ARCHIVE'}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="bg-[#00FF87] text-black font-bold px-3.5 py-1.5 rounded text-xs hover:bg-[#00FF87]/90 cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopBar;
