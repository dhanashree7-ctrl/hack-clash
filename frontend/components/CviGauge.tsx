"use client";

import React from "react";

export type ThreatLevel = "Low" | "Watch" | "Medium" | "High";

export interface CviDataPoint {
  time: string;
  cvi: number;
  level: ThreatLevel;
}

export function getCviMeta(score: number): {
  level: ThreatLevel;
  color: string;
  glow: string;
  label: string;
  bgGradient: string;
} {
  if (score < 40) {
    return {
      level: "Low",
      color: "#22c55e",
      glow: "0 0 24px 4px rgba(34,197,94,0.35)",
      label: "Low Threat",
      bgGradient: "from-emerald-500/10 to-emerald-900/5",
    };
  } else if (score < 60) {
    return {
      level: "Watch",
      color: "#eab308",
      glow: "0 0 24px 4px rgba(234,179,8,0.35)",
      label: "Watch",
      bgGradient: "from-yellow-500/10 to-yellow-900/5",
    };
  } else if (score < 75) {
    return {
      level: "Medium",
      color: "#f97316",
      glow: "0 0 24px 4px rgba(249,115,22,0.35)",
      label: "Medium Threat",
      bgGradient: "from-orange-500/10 to-orange-900/5",
    };
  } else {
    return {
      level: "High",
      color: "#ef4444",
      glow: "0 0 28px 6px rgba(239,68,68,0.45)",
      label: "High Threat",
      bgGradient: "from-red-500/10 to-red-900/5",
    };
  }
}

interface CviGaugeProps {
  currentCvi: number;
}

export default function CviGauge({ currentCvi }: CviGaugeProps) {
  const meta = getCviMeta(currentCvi);

  // SVG geometry constants for a half-circle gauge
  const cx = 160;
  const cy = 160;
  const r = 120;
  const strokeW = 18;

  // The arc spans from 180° to 0° (left to right), i.e. π to 0 radians
  // Map cvi (0–100) to angle (180° to 0°), i.e. (π to 0)
  const clampedCvi = Math.min(100, Math.max(0, currentCvi));
  const angleRad = Math.PI - (clampedCvi / 100) * Math.PI;

  // Needle tip coords
  const needleLength = r - strokeW / 2 - 4;
  const needleX = cx + needleLength * Math.cos(angleRad);
  const needleY = cy - needleLength * Math.sin(angleRad);

  // Arc path helper (half circle)
  function arcPath(radius: number, from: number, to: number) {
    const x1 = cx + radius * Math.cos(from);
    const y1 = cy - radius * Math.sin(from);
    const x2 = cx + radius * Math.cos(to);
    const y2 = cy - radius * Math.sin(to);
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  }

  // Active arc: from π (left) to current angle
  const activeStartAngle = Math.PI;
  const activeEndAngle = angleRad;

  // Make sure arc never has zero length (would be invisible)
  const showActiveArc = clampedCvi > 0.5;

  // Tick marks at 0, 25, 50, 75, 100
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center">
      {/* Gauge SVG */}
      <div
        className="relative"
        style={{ filter: `drop-shadow(${meta.glow})` }}
      >
        <svg
          viewBox="0 0 320 180"
          width="320"
          height="180"
          aria-label={`CVI Gauge: ${clampedCvi} — ${meta.label}`}
        >
          <defs>
            <linearGradient id="gaugeTrackGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1e2a3a" />
              <stop offset="100%" stopColor="#162033" />
            </linearGradient>
            <linearGradient id="activeArcGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={meta.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={meta.color} />
            </linearGradient>
          </defs>

          {/* Background track arc */}
          <path
            d={arcPath(r, Math.PI, 0)}
            fill="none"
            stroke="url(#gaugeTrackGrad)"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />

          {/* Active arc fill */}
          {showActiveArc && (
            <path
              d={arcPath(r, activeStartAngle, activeEndAngle)}
              fill="none"
              stroke="url(#activeArcGrad)"
              strokeWidth={strokeW}
              strokeLinecap="round"
              style={{ transition: "d 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          )}

          {/* Tick marks */}
          {ticks.map((tick) => {
            const tickAngle = Math.PI - (tick / 100) * Math.PI;
            const innerR = r - strokeW / 2 - 4;
            const outerR = r + strokeW / 2 + 4;
            return (
              <line
                key={tick}
                x1={cx + innerR * Math.cos(tickAngle)}
                y1={cy - innerR * Math.sin(tickAngle)}
                x2={cx + outerR * Math.cos(tickAngle)}
                y2={cy - outerR * Math.sin(tickAngle)}
                stroke="#334155"
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}

          {/* Tick labels */}
          {ticks.map((tick) => {
            const labelAngle = Math.PI - (tick / 100) * Math.PI;
            const labelR = r + strokeW / 2 + 18;
            const lx = cx + labelR * Math.cos(labelAngle);
            const ly = cy - labelR * Math.sin(labelAngle);
            return (
              <text
                key={tick}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="#475569"
                fontFamily="monospace"
              >
                {tick}
              </text>
            );
          })}

          {/* Needle line */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke={meta.color}
            strokeWidth={3}
            strokeLinecap="round"
            style={{ transition: "x2 0.6s cubic-bezier(0.4, 0, 0.2, 1), y2 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />

          {/* Needle pivot */}
          <circle cx={cx} cy={cy} r={8} fill={meta.color} opacity={0.9} />
          <circle cx={cx} cy={cy} r={3} fill="white" />

          {/* Score text */}
          <text
            x={cx}
            y={cy - 38}
            textAnchor="middle"
            fontSize="44"
            fontWeight="700"
            fill="white"
            fontFamily="system-ui, sans-serif"
            style={{ transition: "fill 0.4s" }}
          >
            {clampedCvi}
          </text>

          {/* Level badge */}
          <text
            x={cx}
            y={cy - 18}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill={meta.color}
            fontFamily="system-ui, sans-serif"
            letterSpacing="2"
            style={{ transition: "fill 0.4s" }}
          >
            {meta.label.toUpperCase()}
          </text>
        </svg>
      </div>

      {/* Legend pills */}
      <div className="flex gap-2 mt-3 flex-wrap justify-center">
        {[
          { label: "Low", color: "#22c55e", range: "0–39" },
          { label: "Watch", color: "#eab308", range: "40–59" },
          { label: "Medium", color: "#f97316", range: "60–74" },
          { label: "High", color: "#ef4444", range: "75–100" },
        ].map(({ label, color, range }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/[0.04] border border-white/[0.06] text-slate-300"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            {label}
            <span className="text-slate-500">{range}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
