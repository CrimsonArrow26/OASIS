import React, { useEffect } from 'react';
import useAppStore from '../../store/useAppStore.ts';
import useIncidents from '../../hooks/useIncidents.ts';
import useVesselTracks from '../../hooks/useVesselTracks.ts';
import TopBar from './TopBar.tsx';
import IncidentPanel from '../incidents/IncidentPanel.tsx';
import MapView from '../map/MapView.tsx';
import DetailPanel from '../detail/DetailPanel.tsx';
import TimelineBar from '../timeline/TimelineBar.tsx';
import HistoricalReplayModal from '../timeline/HistoricalReplayModal.tsx';

export const AppShell: React.FC = () => {
  const { selectedIncidentId, themeMode } = useAppStore();
  const { selectedIncident } = useIncidents();
  const { vesselSuspects, vesselTracks } = useVesselTracks(selectedIncidentId);

  // Synchronize documentElement theme class for global light/dark mode
  useEffect(() => {
    if (themeMode === 'daylight') {
      document.documentElement.classList.add('daylight');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('bg-[#F1F5F9]', 'text-[#0F172A]');
      document.body.classList.remove('bg-[#0A0C0F]', 'text-[#C8D6E0]');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('daylight');
      document.body.classList.add('bg-[#0A0C0F]', 'text-[#C8D6E0]');
      document.body.classList.remove('bg-[#F1F5F9]', 'text-[#0F172A]');
    }
  }, [themeMode]);

  return (
    <div
      data-theme={themeMode}
      className={`w-screen h-screen flex flex-col overflow-hidden font-['Space_Grotesk'] transition-colors duration-200 ${
        themeMode === 'daylight' ? 'bg-[#F1F5F9] text-[#0F172A]' : 'bg-[#0A0C0F] text-[#C8D6E0]'
      }`}
    >
      {/* 1. Fixed TopBar (48px) */}
      <TopBar />

      {/* 2. Main 3-Column Surveillance Workstation */}
      <main className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Column: Active Incidents & Vessel Suspects (320px) */}
        <IncidentPanel />

        {/* Center Column: Tactical Radar Map with Windy Metocean Overlay */}
        <MapView
          selectedIncident={selectedIncident}
          vesselSuspects={vesselSuspects}
          vesselTracks={vesselTracks}
        />

        {/* Right Column: SAR Analysis Drawer (380px) */}
        <DetailPanel selectedIncident={selectedIncident} />
      </main>

      {/* 3. Fixed Timeline Scrubber Bar (88px) */}
      <TimelineBar selectedIncident={selectedIncident} />

      {/* 4. Historical Replay & Date Range Selection Modal */}
      <HistoricalReplayModal />
    </div>
  );
};

export default AppShell;
