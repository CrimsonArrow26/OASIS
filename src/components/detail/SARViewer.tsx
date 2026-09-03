import React, { useRef, useEffect, useState } from 'react';
import { SARMetadata } from '../../types.ts';
import useAppStore from '../../store/useAppStore.ts';
import {
  Waves,
  Compass,
  Wind,
  Clock,
  ExternalLink,
  Navigation,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';

interface SARViewerProps {
  metadata: SARMetadata | null;
}

export const SARViewer: React.FC<SARViewerProps> = ({ metadata }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { themeMode, windyData, toggleWindyRadar } = useAppStore();
  const isLight = themeMode === 'daylight';
  
  const [showMask, setShowMask] = useState(false);

  const sc = windyData?.surfaceCurrent;
  const tc = windyData?.tidalCurrent;
  const cd = windyData?.combinedHydrodynamicDrift;
  const isFlood = tc?.isFlood ?? true;
  const minutesToSlack = tc?.minutesToNextSlack ?? 135;
  const slackHrs = Math.floor(minutesToSlack / 60);
  const slackMins = minutesToSlack % 60;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw SAR backscatter background texture (ocean Bragg scattering)
    ctx.fillStyle = '#10161D';
    ctx.fillRect(0, 0, width, height);

    // Subtle radar swell wave noise pattern
    ctx.save();
    for (let y = 0; y < height; y += 4) {
      const alpha = 0.08 + Math.sin(y * 0.15) * 0.04;
      ctx.fillStyle = `rgba(180, 210, 230, ${alpha})`;
      ctx.fillRect(0, y, width, 2);
    }

    // Add high-frequency SAR speckle noise
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 22;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw dark attenuated slick anomaly (oil dampens capillary waves -> low radar backscatter)
    ctx.save();
    ctx.beginPath();
    // Curved slick shape centered diagonally
    ctx.moveTo(80, 80);
    ctx.bezierCurveTo(120, 110, 180, 95, 230, 120);
    ctx.bezierCurveTo(270, 140, 290, 150, 310, 145);
    ctx.bezierCurveTo(280, 165, 200, 160, 150, 145);
    ctx.bezierCurveTo(90, 130, 70, 100, 80, 80);
    ctx.closePath();

    // Dark core fill (attenuated radar return)
    ctx.fillStyle = 'rgba(5, 7, 10, 0.92)';
    ctx.fill();

    // Glowing green edge contour (#00FF87)
    ctx.strokeStyle = '#00FF87';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.restore();

    // Draw metallic target bright spot (Vessel Nordic Titan metallic corner reflector return)
    const vesselX = 265;
    const vesselY = 65;

    // Metallic halo / bloom
    const radGlow = ctx.createRadialGradient(vesselX, vesselY, 1, vesselX, vesselY, 14);
    radGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    radGlow.addColorStop(0.3, 'rgba(0, 255, 135, 0.6)');
    radGlow.addColorStop(1, 'rgba(0, 255, 135, 0)');
    ctx.fillStyle = radGlow;
    ctx.beginPath();
    ctx.arc(vesselX, vesselY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Metallic core bright spot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(vesselX, vesselY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Concentric detection ring around ship
    ctx.strokeStyle = '#00FF87';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(vesselX, vesselY, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Target crosshair reticle at slick centroid (185, 125)
    const cx = 185;
    const cy = 125;
    ctx.setLineDash([]);
    ctx.strokeStyle = '#00FF87';
    ctx.lineWidth = 1;

    // Reticle circle
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy);
    ctx.lineTo(cx - 8, cy);
    ctx.moveTo(cx + 8, cy);
    ctx.lineTo(cx + 26, cy);
    ctx.moveTo(cx, cy - 26);
    ctx.lineTo(cx, cy - 8);
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx, cy + 26);
    ctx.stroke();

    // Center point
    ctx.fillStyle = '#00FF87';
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();

    // Corner brackets on display
    const bLen = 14;
    ctx.strokeStyle = '#6B8499';
    ctx.lineWidth = 1.5;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(10, 10 + bLen);
    ctx.lineTo(10, 10);
    ctx.lineTo(10 + bLen, 10);
    // Top-right
    ctx.moveTo(width - 10 - bLen, 10);
    ctx.lineTo(width - 10, 10);
    ctx.lineTo(width - 10, 10 + bLen);
    // Bottom-left
    ctx.moveTo(10, height - 10 - bLen);
    ctx.lineTo(10, height - 10);
    ctx.lineTo(10 + bLen, height - 10);
    // Bottom-right
    ctx.moveTo(width - 10 - bLen, height - 10);
    ctx.lineTo(width - 10, height - 10);
    ctx.lineTo(width - 10, height - 10 - bLen);
    ctx.stroke();

  }, [metadata]);

  return (
    <div>
      {/* SAR Radar Canvas with Telemetry Badges matching Bento Grid */}
      <div className="aspect-video bg-[#0A0C0F] border border-white/10 rounded flex items-center justify-center overflow-hidden relative group">
        <canvas
          ref={canvasRef}
          width={340}
          height={195}
          className="w-full h-full object-cover block"
        />

        {/* Real SAR Image overlay if available */}
        {metadata?.imageUrl && (
          <img 
            src={showMask && metadata?.maskUrl ? metadata.maskUrl : metadata.imageUrl}
            alt="SAR Satellite Imagery"
            className="absolute inset-0 w-full h-full object-cover z-10"
          />
        )}

        {/* Tactical badges positioned on image */}
        <div className="absolute top-2 left-2.5 flex gap-1.5 pointer-events-none z-20">
          <span className="text-[10px] font-mono bg-black/80 text-[#00FF87] px-1.5 py-0.5 rounded border border-[#00FF87]/30">
            {metadata?.polarization || 'POL: VV+VH'}
          </span>
          <span className="text-[10px] font-mono bg-black/80 text-[#C8D6E0] px-1.5 py-0.5 rounded border border-white/10">
            INC: {metadata?.incidenceAngleDeg || 34.2}°
          </span>
        </div>

        <div className="absolute top-2 right-2.5 pointer-events-none z-20">
          <span className="text-[9px] font-mono bg-[#FF3B3B]/20 text-[#FF3B3B] px-1.5 py-0.5 rounded border border-[#FF3B3B]/40 animate-pulse font-bold">
            {metadata?.anomalyDesc || '[ANOMALY: ATTENUATED-VV]'}
          </span>
        </div>

        <div className="absolute bottom-2 left-2.5 pointer-events-none z-20">
          <span className="text-[9px] font-mono bg-black/80 text-[#6B8499] px-1.5 py-0.5 rounded border border-white/10">
            SCALE: {metadata?.resolutionM ? `${metadata.resolutionM}m/px` : '10m/px'}
          </span>
        </div>

        <div className="absolute bottom-2 right-2.5 flex items-center gap-2 z-20">
          {metadata?.maskUrl && (
            <button 
              onClick={() => setShowMask(!showMask)}
              className="text-[9px] font-mono bg-black/80 text-[#00FF87] hover:bg-black px-1.5 py-0.5 rounded border border-[#00FF87]/30 flex items-center gap-1 cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
              title="Toggle Ground Truth Oil Spill Mask"
            >
              {showMask ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showMask ? 'HIDE MASK' : 'SHOW MASK'}
            </button>
          )}
          <span className="text-[9px] font-mono bg-black/80 text-[#00FF87] px-1.5 py-0.5 rounded border border-[#00FF87]/30 flex items-center gap-1 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87] inline-block animate-ping"></span>
            RADAR C-BAND
          </span>
        </div>
      </div>

      {/* Telemetry metadata in Bento Grid 2x2 cards */}
      <div className={`grid grid-cols-2 gap-2.5 p-3 rounded mt-3 border transition-colors duration-200 ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
      }`}>
        <div>
          <div className="text-[9px] opacity-50 uppercase tracking-wider">ACQUISITION</div>
          <div className={`text-[11px] font-mono font-medium truncate mt-0.5 ${
            isLight ? 'text-slate-800' : 'text-[#C8D6E0]'
          }`}>
            {metadata?.acquisitionDate || '2024-05-25 00:14:22 UTC'}
          </div>
        </div>

        <div>
          <div className="text-[9px] opacity-50 uppercase tracking-wider">SATELLITE PASS</div>
          <div className={`text-[11px] font-mono font-medium truncate mt-0.5 ${
            isLight ? 'text-emerald-700' : 'text-[#00FF87]'
          }`}>
            {metadata?.satellite || 'SENTINEL-1A / ORB 142'}
          </div>
        </div>

        <div>
          <div className="text-[9px] opacity-50 uppercase tracking-wider">POLARIZATION</div>
          <div className={`text-[11px] font-mono font-medium truncate mt-0.5 ${
            isLight ? 'text-slate-800' : 'text-[#C8D6E0]'
          }`}>
            {metadata?.polarization || 'VV + VH (DUAL CROSS)'}
          </div>
        </div>

        <div>
          <div className="text-[9px] opacity-50 uppercase tracking-wider">BACKSCATTER</div>
          <div className="text-[11px] font-mono text-[#FFB347] font-medium truncate mt-0.5">
            {metadata?.backscatterDb || '-21.4 dB (ATTENUATED)'}
          </div>
        </div>
      </div>

      {/* Windy Hydrodynamic & Metocean Telemetry during SAR Pass */}
      <div
        className={`p-3 rounded mt-2.5 border transition-colors select-none font-mono ${
          isLight
            ? 'bg-slate-50/90 border-slate-200 text-slate-800'
            : 'bg-[#080E17]/95 border-cyan-500/30 text-slate-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              WINDY METOCEAN AT SAR PASS
            </span>
          </div>
          <button
            onClick={toggleWindyRadar}
            className="flex items-center gap-1 text-[9px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Open Detached Interactive Windy Radar Modal"
          >
            <span>LIVE RADAR</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* 2x2 Hydrodynamic Conditions */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {/* Ocean Surface Current */}
          <div
            className={`p-2 rounded border ${
              isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-[9px] text-cyan-400 font-bold uppercase mb-0.5">
              <span className="flex items-center gap-1">
                <Waves className="w-2.5 h-2.5" />
                <span>CURRENT</span>
              </span>
              <span className="text-slate-500 text-[8px]">ECMWF</span>
            </div>
            <div className="text-xs font-bold text-cyan-300">
              {sc?.speedKts ?? 1.8}{' '}
              <span className="text-[9px] font-normal text-slate-400">KTS</span>
            </div>
            <div className="text-[9px] text-slate-400 truncate">
              {String(sc?.directionDeg ?? 68).padStart(3, '0')}° ({sc?.directionCardinal ?? 'ENE'})
            </div>
          </div>

          {/* Astronomical Tidal Stream */}
          <div
            className={`p-2 rounded border ${
              isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-[9px] font-bold uppercase mb-0.5">
              <span
                className={`flex items-center gap-1 ${
                  isFlood ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                <Activity className="w-2.5 h-2.5" />
                <span>TIDAL FLUX</span>
              </span>
              <span className="text-slate-500 text-[8px]">M2 SEMI</span>
            </div>
            <div
              className={`text-xs font-bold ${
                isFlood ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {tc?.speedKts ?? 1.4}{' '}
              <span className="text-[9px] font-normal text-slate-400">KTS</span>
            </div>
            <div className="text-[9px] text-slate-400 truncate">
              {tc?.phase ?? (isFlood ? 'FLOOD STREAM' : 'EBB STREAM')}
            </div>
          </div>

          {/* Combined Net Slick Drift Vector */}
          <div
            className={`p-2 rounded border ${
              isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-[9px] text-emerald-400 font-bold uppercase mb-0.5">
              <span className="flex items-center gap-1">
                <Navigation className="w-2.5 h-2.5" />
                <span>NET DRIFT</span>
              </span>
              <span className="text-slate-500 text-[8px]">COMBINED</span>
            </div>
            <div className="text-xs font-bold text-emerald-300">
              {cd?.netSpeedKts ?? 3.96}{' '}
              <span className="text-[9px] font-normal text-slate-400">KTS</span>
            </div>
            <div className="text-[9px] text-slate-400 truncate">
              @ {String(cd?.netDirectionDeg ?? 58).padStart(3, '0')}° BEARING
            </div>
          </div>

          {/* Tidal Slack Time / Phase */}
          <div
            className={`p-2 rounded border ${
              isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-[9px] text-amber-400 font-bold uppercase mb-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>SLACK WATER</span>
              </span>
              <span className="text-slate-500 text-[8px]">TURNING</span>
            </div>
            <div className="text-xs font-bold text-amber-300">
              {slackHrs}h {slackMins}m
            </div>
            <div className="text-[9px] text-slate-400 truncate">
              NEXT HIGH / SLACK
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SARViewer;
