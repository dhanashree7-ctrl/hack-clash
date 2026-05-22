"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import type { CviDataPoint } from "./CviGauge";

interface CviTimelineProps {
  cviHistory: CviDataPoint[];
}

const THREAT_COLORS = {
  Low: "#22c55e",
  Watch: "#eab308",
  Medium: "#f97316",
  High: "#ef4444",
};

// Custom dot that colors itself by threat level
function CustomDot(props: {
  cx?: number;
  cy?: number;
  payload?: CviDataPoint;
}) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  const color = THREAT_COLORS[payload.level] ?? "#8b5cf6";
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={color}
      stroke="#0a0e1a"
      strokeWidth={2}
    />
  );
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: CviDataPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const { value, payload: data } = payload[0];
  const color = THREAT_COLORS[data.level] ?? "#8b5cf6";

  return (
    <div className="bg-[#0f172a]/90 backdrop-blur border border-white/10 rounded-xl px-3 py-2.5 shadow-2xl text-xs">
      <div className="text-slate-400 mb-1">{data.time}</div>
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-bold text-white text-sm">CVI {value}</span>
        <span className="font-semibold" style={{ color }}>
          {data.level}
        </span>
      </div>
    </div>
  );
}

export default function CviTimeline({ cviHistory }: CviTimelineProps) {
  const isEmpty = cviHistory.length === 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">CVI Timeline</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Live score history · updates every 3 s
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-violet-300 uppercase tracking-wider">
            LIVE
          </span>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
          Collecting data…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={cviHistory}
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="cviGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />

            {/* Threat zone reference lines */}
            <ReferenceLine
              y={75}
              stroke="rgba(239,68,68,0.3)"
              strokeDasharray="4 4"
              label={{ value: "High", position: "right", fill: "#ef4444", fontSize: 9 }}
            />
            <ReferenceLine
              y={60}
              stroke="rgba(249,115,22,0.3)"
              strokeDasharray="4 4"
              label={{ value: "Med", position: "right", fill: "#f97316", fontSize: 9 }}
            />
            <ReferenceLine
              y={40}
              stroke="rgba(234,179,8,0.3)"
              strokeDasharray="4 4"
              label={{ value: "Watch", position: "right", fill: "#eab308", fontSize: 9 }}
            />

            <XAxis
              dataKey="time"
              tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#475569", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="cvi"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#cviGrad)"
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#0a0e1a", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
