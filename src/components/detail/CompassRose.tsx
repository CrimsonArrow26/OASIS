import React from 'react';

interface CompassRoseProps {
  headingDeg: number;
  speedKts: number;
  label?: string;
  subLabel?: string;
}

export const CompassRose: React.FC<CompassRoseProps> = ({
  headingDeg = 68,
  speedKts = 1.8,
  label = '068°',
  subLabel = '1.8 KTS',
}) => {
  // 120x120 SVG tactical compass rose matching Image 2 & Image 4
  const size = 110;
  const center = size / 2;
  const radius = 46;

  // Generate tick marks for 360 degrees in increments of 30 and 10
  const ticks = [];
  for (let i = 0; i < 360; i += 10) {
    const rad = ((i - 90) * Math.PI) / 180;
    const isMajor = i % 30 === 0;
    const isCardinal = i % 90 === 0;
    const tickLen = isCardinal ? 8 : isMajor ? 5 : 3;
    const x1 = center + (radius - tickLen) * Math.cos(rad);
    const y1 = center + (radius - tickLen) * Math.sin(rad);
    const x2 = center + radius * Math.cos(rad);
    const y2 = center + radius * Math.sin(rad);

    ticks.push(
      <line
        key={`tick-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isCardinal ? '#00FF87' : isMajor ? '#6B8499' : '#2A3B4C'}
        strokeWidth={isCardinal ? 1.5 : 1}
      />
    );
  }

  // Calculate pointer arrow coordinates for heading
  const needleRad = ((headingDeg - 90) * Math.PI) / 180;
  const tipX = center + (radius - 10) * Math.cos(needleRad);
  const tipY = center + (radius - 10) * Math.sin(needleRad);

  const baseLeftRad = ((headingDeg - 90 + 150) * Math.PI) / 180;
  const baseRightRad = ((headingDeg - 90 - 150) * Math.PI) / 180;
  const baseRadius = 9;

  const bx1 = center + baseRadius * Math.cos(baseLeftRad);
  const by1 = center + baseRadius * Math.sin(baseLeftRad);
  const bx2 = center + baseRadius * Math.cos(baseRightRad);
  const by2 = center + baseRadius * Math.sin(baseRightRad);

  return (
    <div className="flex items-center gap-4 bg-black/20 border border-white/10 rounded p-2.5">
      <div className="relative w-[110px] h-[110px] flex-shrink-0 flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle cx={center} cy={center} r={radius} fill="#0A0C0F" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
          <circle cx={center} cy={center} r={radius - 12} fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 2" strokeWidth="1" />

          {/* Ticks */}
          {ticks}

          {/* Cardinal direction labels */}
          <text x={center} y={center - radius + 15} textAnchor="middle" fill="#00FF87" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
            N
          </text>
          <text x={center + radius - 15} y={center + 3} textAnchor="middle" fill="#6B8499" fontSize="8" fontFamily="JetBrains Mono">
            E
          </text>
          <text x={center} y={center + radius - 9} textAnchor="middle" fill="#6B8499" fontSize="8" fontFamily="JetBrains Mono">
            S
          </text>
          <text x={center - radius + 15} y={center + 3} textAnchor="middle" fill="#6B8499" fontSize="8" fontFamily="JetBrains Mono">
            W
          </text>

          {/* Directional arrow needle in neon green (#00FF87) */}
          <polygon
            points={`${tipX},${tipY} ${bx1},${by1} ${center},${center} ${bx2},${by2}`}
            fill="#00FF87"
            stroke="#00D26A"
            strokeWidth="0.8"
            className="drop-shadow-[0_0_6px_rgba(0,255,135,0.6)]"
          />

          {/* Center pivot */}
          <circle cx={center} cy={center} r="3.5" fill="#0A0C0F" stroke="#00FF87" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="flex flex-col justify-center space-y-0.5">
        <span className="text-[9px] font-mono uppercase tracking-wider opacity-50">
          CURRENT VECTOR
        </span>
        <div className="text-xl font-bold font-mono text-[#00FF87] tracking-wider leading-none my-0.5">
          {label}
        </div>
        <div className="text-xs font-mono text-[#C8D6E0]">
          {subLabel}
        </div>
        <div className="text-[10px] font-mono opacity-50">
          SET &amp; DRIFT AT ORIGIN
        </div>
      </div>
    </div>
  );
};

export default CompassRose;
