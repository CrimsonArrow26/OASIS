import React from 'react';
import useAppStore from '../../store/useAppStore.ts';
import useIncidents from '../../hooks/useIncidents.ts';
import useVesselTracks from '../../hooks/useVesselTracks.ts';
import IncidentRow from './IncidentRow.tsx';
import VesselSuspectCard from './VesselSuspectCard.tsx';
import { Radio, AlertCircle } from 'lucide-react';

export const IncidentPanel: React.FC = () => {
  const {
    selectedIncidentId,
    selectIncident,
    msgRatePerSec,
    wsStatus,
    themeMode,
    selectedVesselMmsi,
    setSelectedVesselMmsi,
  } = useAppStore();
  const { incidents, loading: incLoading } = useIncidents();
  const { vesselSuspects } = useVesselTracks(selectedIncidentId);
  const isLight = themeMode === 'daylight';

  return (
    <aside className={`w-[300px] lg:w-[320px] h-full shrink-0 border-r flex flex-col z-20 transition-colors duration-200 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#0F1318] border-white/10'
    }`}>
      {/* 1. Active Incidents Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className={`p-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}>
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">
            Active Incidents
          </span>
          <span className="bg-[#FF3B3B]/20 text-[#FF3B3B] text-[10px] px-1.5 py-0.5 rounded border border-[#FF3B3B]/30 font-mono font-bold">
            {String(incidents.length).padStart(2, '0')}
          </span>
        </div>

        {/* Incidents List (Scrollable Bento Container) */}
        <div className="p-2 flex-1 overflow-y-auto min-h-0">
          {incLoading ? (
            <div className="text-center py-6 text-xs font-mono opacity-50">
              QUERYING SATELLITE RADAR REGISTRY...
            </div>
          ) : (
            <div className="space-y-2">
              {incidents.map((incident) => (
                <IncidentRow
                  key={incident.id}
                  incident={incident}
                  isSelected={selectedIncidentId === incident.id}
                  onSelect={selectIncident}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thick Divider between sections */}
      <div className={`h-2 shrink-0 ${isLight ? 'bg-slate-100 border-y border-slate-200' : 'bg-[#0A0C0F] border-y border-white/5'}`} />

      {/* 2. Vessel Suspects Section */}
      <div className={`flex-1 flex flex-col min-h-0 transition-colors duration-200 ${
        isLight ? 'bg-slate-50' : 'bg-[#141A22]'
      }`}>
        <div className={`p-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}>
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 block">
            Vessel Suspects
          </span>
          <span className="text-[10px] font-mono text-[#00FF87] bg-[#00FF87]/10 px-1.5 py-0.5 rounded border border-[#00FF87]/20">
            HINDCAST
          </span>
        </div>

        {/* Suspects Bento List */}
        <div className="p-2 space-y-2.5 overflow-y-auto flex-1 min-h-0">
          {vesselSuspects.length === 0 ? (
            <div className="text-center py-6 text-xs font-mono opacity-50">
              COMPUTING VESSEL SPATIAL TRAJECTORIES...
            </div>
          ) : (
            vesselSuspects.map((suspect) => (
              <VesselSuspectCard
                key={suspect.mmsi}
                suspect={suspect}
                isSelected={selectedVesselMmsi === suspect.mmsi}
                onSelect={(mmsi) => setSelectedVesselMmsi(selectedVesselMmsi === mmsi ? null : mmsi)}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer Ingest Telemetry in Bento styling */}
      <div className={`h-9 border-t px-3 flex items-center justify-between shrink-0 text-[10px] font-mono transition-colors duration-200 ${
        isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#0F1318]'
      }`}>
        <div className="flex items-center gap-1.5 opacity-60">
          <Radio className="w-3.5 h-3.5 text-[#00FF87] animate-pulse" />
          <span>AIS STREAM INGEST</span>
        </div>
        <div className="text-[#00FF87] font-medium flex items-center gap-1">
          <span>{msgRatePerSec.toLocaleString()} MSG/SEC</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87]"></span>
        </div>
      </div>
    </aside>
  );
};

export default IncidentPanel;
