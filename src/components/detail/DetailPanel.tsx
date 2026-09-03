import React, { useEffect, useState } from 'react';
import useAppStore from '../../store/useAppStore.ts';
import DataService from '../../services/DataService.ts';
import { SARMetadata, Incident } from '../../types.ts';
import SARViewer from './SARViewer.tsx';
import SpillAnalysis from './SpillAnalysis.tsx';
import DriftPrediction from './DriftPrediction.tsx';
import WindyCurrentsStation from './WindyCurrentsStation.tsx';
import { X, Lock, ChevronRight, ChevronLeft } from 'lucide-react';

interface DetailPanelProps {
  selectedIncident: Incident | null;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ selectedIncident }) => {
  const { isDetailPanelOpen, toggleDetailPanel, selectIncident, themeMode } = useAppStore();
  const [sarMetadata, setSarMetadata] = useState<SARMetadata | null>(null);
  const isLight = themeMode === 'daylight';

  useEffect(() => {
    if (!selectedIncident) return;
    let mounted = true;
    DataService.getSARMetadata(selectedIncident.id).then((meta) => {
      if (mounted) setSarMetadata(meta);
    });
    return () => {
      mounted = false;
    };
  }, [selectedIncident]);

  if (!isDetailPanelOpen) {
    return (
      <button
        onClick={toggleDetailPanel}
        className={`absolute top-16 right-3 z-30 border px-2.5 py-1.5 rounded flex items-center gap-1.5 shadow-lg font-mono text-xs cursor-pointer transition-colors ${
          isLight
            ? 'bg-white hover:bg-slate-50 border-slate-200 text-emerald-700'
            : 'bg-[#0F1318] hover:bg-[#141A22] border-[#1E293B] text-[#00FF87]'
        }`}
        title="Open SAR Analysis Drawer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>SAR ANALYSIS</span>
      </button>
    );
  }

  return (
    <aside className={`w-[320px] lg:w-[380px] h-full shrink-0 border-l flex flex-col z-20 overflow-y-auto transition-colors duration-200 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#0F1318] border-white/10'
    }`}>
      {/* Drawer Header matching Bento Grid Design */}
      <div className={`p-3 border-b flex items-center justify-between sticky top-0 z-10 ${
        isLight ? 'bg-white/95 border-slate-200' : 'bg-[#0F1318] border-white/10'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">
            SAR Analysis
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
            isLight
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
              : 'bg-white/5 border-white/10 text-[#00FF87]'
          }`}>
            #{selectedIncident?.id || 'OSP-0047'}
          </span>
        </div>

        <button
          onClick={toggleDetailPanel}
          className={`p-1 rounded transition-colors cursor-pointer ${
            isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-[#6B8499] hover:text-white hover:bg-white/5'
          }`}
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="p-3 space-y-3.5 flex-1">
        {/* Section A: SAR Imagery */}
        <section>
          <SARViewer metadata={sarMetadata} />
        </section>

        {/* Section B: Spill Morphology & Detection Geometry */}
        <section>
          <SpillAnalysis incident={selectedIncident} />
        </section>

        {/* Section C: Drift Modeling */}
        <section>
          <DriftPrediction incident={selectedIncident} />
        </section>

        {/* Section D: Windy.com Marine Currents & Tidal Flux */}
        <section>
          <WindyCurrentsStation incident={selectedIncident} />
        </section>
      </div>
    </aside>
  );
};

export default DetailPanel;
