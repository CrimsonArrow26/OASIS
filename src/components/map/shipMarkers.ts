import L from 'leaflet';

export interface ShipMarkerOptions {
  vesselName: string;
  vesselType: string;
  course: number;
  speed: number;
  trackColor?: string;
  isSelected?: boolean;
  isDarkGap?: boolean;
  isDark?: boolean;
  matchPct?: number;
  mmsi?: string;
}

/**
 * Generates an authentic top-down naval vessel silhouette SVG.
 * Bow points straight UP (0° North), so CSS rotation matches Course Over Ground (COG).
 */
export function generateShipSvg(options: ShipMarkerOptions): string {
  const {
    vesselName,
    vesselType,
    course,
    speed,
    trackColor = '#00FF87',
    isSelected = false,
    isDarkGap = false,
    isDark = true,
  } = options;

  const isTanker = vesselType.toUpperCase().includes('TANKER') || vesselName.includes('TITAN') || vesselName.includes('PIONEER');
  const isContainer = vesselType.toUpperCase().includes('CONTAINER') || vesselType.toUpperCase().includes('CARGO') || vesselType.toUpperCase().includes('BULK');

  // Colors
  const hullFill = isDarkGap ? '#EF4444' : isSelected ? '#00FF87' : trackColor;
  const deckFill = isDark ? '#141A22' : '#E2E8F0';
  const detailColor = isDark ? '#94A3B8' : '#475569';
  const strokeColor = isDarkGap ? '#FF3B3B' : isSelected ? '#FFFFFF' : hullFill;

  // Proportional speed vector (max 28px)
  const vectorLength = Math.min(30, Math.max(12, speed * 1.6));

  // Ship SVG centered in a 70x70 bounding box
  // Ship hull center is at (35, 35)
  return `
    <div class="ship-container" style="position: relative; width: 70px; height: 70px; pointer-events: auto; cursor: pointer;">
      ${isDarkGap ? `
        <div class="ais-gap-pulse" style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 44px;
          height: 44px;
          margin-top: -22px;
          margin-left: -22px;
          border-radius: 50%;
          border: 2px solid #FF3B3B;
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          pointer-events: none;
        "></div>
      ` : ''}

      <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg"
           style="transform: rotate(${course}deg); transform-origin: 35px 35px; transition: transform 0.3s ease-out; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
        
        <!-- Stern Wake (trailing behind ship) -->
        <path d="M30 52 L24 64 M40 52 L46 64" stroke="${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,100,200,0.35)'}" stroke-width="1.5" stroke-dasharray="2 2" stroke-linecap="round"/>
        <path d="M35 53 L35 62" stroke="${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,100,200,0.25)'}" stroke-width="1" stroke-linecap="round"/>

        <!-- Forward Course & Speed Vector Line (from Bow tip) -->
        <line x1="35" y1="16" x2="35" y2="${16 - vectorLength}" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round"/>
        <polygon points="35,${16 - vectorLength - 3} 32,${16 - vectorLength + 3} 38,${16 - vectorLength + 3}" fill="${strokeColor}"/>

        <!-- Outer Vessel Hull Silhouette (Pointed Bow, Tapered Beam, Transom Stern) -->
        <path d="
          M 35 16
          C 38 18, 43 23, 44 29
          L 44 45
          C 44 49, 42 52, 39 53
          L 31 53
          C 28 52, 26 49, 26 45
          L 26 29
          C 27 23, 32 18, 35 16
          Z
        " fill="${hullFill}" stroke="${strokeColor}" stroke-width="1.2" />

        <!-- Inner Main Deck Plating -->
        <path d="
          M 35 18
          C 37 20, 41 24, 42 29
          L 42 44
          C 42 47, 40 50, 38 51
          L 32 51
          C 30 50, 28 47, 28 44
          L 28 29
          C 29 24, 33 20, 35 18
          Z
        " fill="${deckFill}" />

        ${isTanker ? `
          <!-- TANKER DECK: Manifold, piping, and oil tank hatches -->
          <rect x="30" y="22" width="10" height="4" rx="1" fill="${detailColor}" fill-opacity="0.6"/>
          <rect x="30" y="28" width="10" height="4" rx="1" fill="${detailColor}" fill-opacity="0.6"/>
          <rect x="30" y="34" width="10" height="4" rx="1" fill="${detailColor}" fill-opacity="0.6"/>
          <!-- Center catwalk & cargo manifold -->
          <line x1="35" y1="21" x2="35" y2="42" stroke="${detailColor}" stroke-width="0.8"/>
          <line x1="28" y1="31" x2="42" y2="31" stroke="${strokeColor}" stroke-width="1.2"/>
          <circle cx="35" cy="31" r="1.5" fill="${strokeColor}"/>
        ` : isContainer ? `
          <!-- CONTAINER / CARGO DECK: Cargo cell holds -->
          <rect x="30" y="22" width="10" height="5" rx="0.5" fill="${detailColor}" fill-opacity="0.7"/>
          <rect x="30" y="29" width="10" height="5" rx="0.5" fill="${detailColor}" fill-opacity="0.7"/>
          <rect x="30" y="36" width="10" height="5" rx="0.5" fill="${detailColor}" fill-opacity="0.7"/>
          <line x1="35" y1="22" x2="35" y2="41" stroke="${deckFill}" stroke-width="0.6"/>
        ` : `
          <!-- GENERAL CARGO / PATROL DECK -->
          <rect x="31" y="24" width="8" height="6" rx="1" fill="${detailColor}" fill-opacity="0.6"/>
          <rect x="31" y="32" width="8" height="6" rx="1" fill="${detailColor}" fill-opacity="0.6"/>
        `}

        <!-- Aft Navigation Bridge & Superstructure (Wheelhouse with Bridge Wings) -->
        <rect x="27" y="42" width="16" height="5" rx="1" fill="${hullFill}" stroke="${strokeColor}" stroke-width="0.8"/>
        <!-- Bridge windows -->
        <line x1="29" y1="43.5" x2="41" y2="43.5" stroke="#FFFFFF" stroke-width="0.8" stroke-opacity="0.8"/>
        <!-- Radar Mast & Exhaust Funnel -->
        <circle cx="35" cy="44.5" r="1.2" fill="#FFFFFF"/>
        <rect x="33" y="47.5" width="4" height="2.5" rx="0.5" fill="${detailColor}"/>

        <!-- Bow Anchor Windlass indicators -->
        <circle cx="33" cy="20" r="0.7" fill="${detailColor}"/>
        <circle cx="37" cy="20" r="0.7" fill="${detailColor}"/>
      </svg>

      <!-- Vessel Label Pill below icon -->
      <div class="vessel-tactical-label" style="
        position: absolute;
        bottom: -2px;
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        background: ${isDark ? 'rgba(10, 15, 22, 0.92)' : 'rgba(255, 255, 255, 0.95)'};
        border: 1px solid ${isDarkGap ? '#FF3B3B' : isSelected ? '#00FF87' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
        padding: 1px 4px;
        border-radius: 3px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 8px;
        font-weight: 700;
        color: ${isDarkGap ? '#FF3B3B' : isSelected ? '#00FF87' : isDark ? '#C8D6E0' : '#0F172A'};
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        pointer-events: none;
      ">
        ${vesselName.replace('MV ', '')}
      </div>
    </div>
  `;
}

/**
 * Creates a Leaflet DivIcon for a vessel with realistic ship aesthetics.
 */
export function createShipLeafletIcon(options: ShipMarkerOptions): L.DivIcon {
  const html = generateShipSvg(options);
  return L.divIcon({
    html,
    className: 'leaflet-ship-marker',
    iconSize: [70, 70],
    iconAnchor: [35, 35],
    popupAnchor: [0, -28],
  });
}

/**
 * Creates a rich tactical HUD popup content string for vessel inspection.
 */
export function createVesselPopupHtml(options: {
  vesselName: string;
  vesselType: string;
  mmsi: string;
  speed: number;
  course: number;
  flag?: string;
  imo?: string;
  matchPct?: number;
  isDarkGap?: boolean;
  isDark?: boolean;
}): string {
  const {
    vesselName,
    vesselType,
    mmsi,
    speed,
    course,
    flag = 'Liberia',
    imo = '9425124',
    matchPct,
    isDarkGap,
    isDark = true,
  } = options;

  const bg = isDark ? '#0F1318' : '#FFFFFF';
  const textPrimary = isDark ? '#C8D6E0' : '#0F172A';
  const textSecondary = isDark ? '#6B8499' : '#64748B';
  const border = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  return `
    <div style="
      font-family: 'JetBrains Mono', monospace;
      background: ${bg};
      color: ${textPrimary};
      padding: 10px;
      border-radius: 6px;
      border: 1px solid ${isDarkGap ? '#FF3B3B' : border};
      min-width: 220px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px solid ${border}; padding-bottom: 4px;">
        <span style="font-weight: 700; font-size: 11px; color: ${isDarkGap ? '#FF3B3B' : '#00FF87'};">
          🚢 ${vesselName}
        </span>
        ${matchPct ? `
          <span style="background: rgba(255, 59, 59, 0.15); border: 1px solid #FF3B3B; color: #FF3B3B; font-size: 9px; padding: 1px 4px; border-radius: 2px; font-weight: 700;">
            ${matchPct}% MATCH
          </span>
        ` : ''}
      </div>

      <div style="font-size: 9px; color: ${textSecondary}; margin-bottom: 6px;">
        TYPE: <strong style="color: ${textPrimary};">${vesselType}</strong> | FLAG: <strong style="color: ${textPrimary};">${flag}</strong>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 9px; margin-bottom: 6px;">
        <div>MMSI: <span style="color: ${textPrimary};">${mmsi}</span></div>
        <div>IMO: <span style="color: ${textPrimary};">${imo}</span></div>
        <div>SOG: <span style="color: #00FF87; font-weight: 600;">${speed.toFixed(1)} KTS</span></div>
        <div>COG: <span style="color: #FFB347; font-weight: 600;">${String(Math.round(course)).padStart(3, '0')}°</span></div>
      </div>

      ${isDarkGap ? `
        <div style="
          background: rgba(255, 59, 59, 0.12);
          border: 1px solid #FF3B3B;
          color: #FF3B3B;
          padding: 4px 6px;
          border-radius: 3px;
          font-size: 8px;
          font-weight: 700;
          margin-top: 4px;
          text-align: center;
        ">
          ⚠️ AIS TRANSMISSION GAP (135m) DETECTED
        </div>
      ` : ''}
    </div>
  `;
}
