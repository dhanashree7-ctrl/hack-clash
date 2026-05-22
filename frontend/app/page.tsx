"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  Target,
  Clock,
  Activity,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import CviGauge, { getCviMeta } from "@/components/CviGauge";
import CviTimeline from "@/components/CviTimeline";
import type { CviDataPoint, ThreatLevel } from "@/components/CviGauge";

// ─── helpers ──────────────────────────────────────────────────────────────────

function randomCvi(): number {
  return Math.floor(Math.random() * (95 - 20 + 1)) + 20;
}

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

const MAX_HISTORY = 20;

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] transition-colors">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
        style={{ backgroundColor: accent ? `${accent}18` : "rgba(139,92,246,0.12)" }}
      >
        <Icon
          size={18}
          style={{ color: accent ?? "#8b5cf6" }}
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
        <p className="text-lg font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── alert feed ───────────────────────────────────────────────────────────────

interface AlertEntry {
  id: number;
  time: string;
  cvi: number;
  level: ThreatLevel;
  message: string;
}

const ALERT_MESSAGES: Record<ThreatLevel, string[]> = {
  Low: [
    "System nominal. No active threats detected.",
    "Low-level probe detected and filtered.",
    "Routine traffic spike — within baseline.",
  ],
  Watch: [
    "Anomalous traffic pattern observed.",
    "Credential stuffing attempt logged.",
    "Unusual login activity from new region.",
  ],
  Medium: [
    "Potential data exfiltration attempt flagged.",
    "Lateral movement detected in network.",
    "Elevated API abuse rate — throttling applied.",
  ],
  High: [
    "CRITICAL: Active intrusion attempt detected!",
    "CRITICAL: Ransomware signature matched.",
    "CRITICAL: Command & control beacon identified.",
  ],
};

function pickMessage(level: ThreatLevel): string {
  const pool = ALERT_MESSAGES[level];
  return pool[Math.floor(Math.random() * pool.length)];
}

const LEVEL_BADGE: Record<ThreatLevel, string> = {
  Low: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  Watch: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25",
  Medium: "bg-orange-500/15 text-orange-400 border border-orange-500/25",
  High: "bg-red-500/15 text-red-400 border border-red-500/25",
};

// ─── page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [currentCvi, setCurrentCvi] = useState<number>(42);
  const [cviHistory, setCviHistory] = useState<CviDataPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [alertIdCounter, setAlertIdCounter] = useState(0);
  const [tickCount, setTickCount] = useState(0);

  const tick = useCallback(() => {
    const score = randomCvi();
    const meta = getCviMeta(score);
    const now = timestamp();

    const point: CviDataPoint = {
      time: now,
      cvi: score,
      level: meta.level,
    };

    setCurrentCvi(score);
    setCviHistory((prev) => {
      const next = [...prev, point];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
    setTickCount((c) => c + 1);

    // Only add an alert entry for Medium/High threats (or randomly for lower)
    if (meta.level === "High" || meta.level === "Medium" || Math.random() < 0.4) {
      const alert: AlertEntry = {
        id: Date.now(),
        time: now,
        cvi: score,
        level: meta.level,
        message: pickMessage(meta.level),
      };
      setAlerts((prev) => [alert, ...prev].slice(0, 10));
      setAlertIdCounter((c) => c + 1);
    }
  }, []);

  useEffect(() => {
    // seed with initial value
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [tick]);

  const meta = getCviMeta(currentCvi);
  const prevCvi = cviHistory.length >= 2 ? cviHistory[cviHistory.length - 2]?.cvi : null;
  const delta = prevCvi !== null ? currentCvi - prevCvi : null;
  const DeltaIcon =
    delta === null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  const highCount = cviHistory.filter((p) => p.level === "High").length;
  const avgCvi =
    cviHistory.length > 0
      ? Math.round(cviHistory.reduce((s, p) => s + p.cvi, 0) / cviHistory.length)
      : 0;

  return (
    <div className="flex min-h-screen bg-[#060b16] text-white font-sans">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        {/* ── Top Header ── */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.06] bg-[#060b16]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/15">
              <Target size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-widest">
                Targeting
              </p>
              <h1 className="text-base font-bold text-white leading-none">
                Acme Corp
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* live pulse */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE · {tickCount} ticks
            </div>

            {/* alert count badge */}
            <div className="relative">
              <Bell size={18} className="text-slate-400" />
              {alerts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {alerts.length}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 px-8 py-6 space-y-6 overflow-auto">
          {/* Stat row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={Shield}
              label="Current CVI"
              value={currentCvi}
              sub={meta.label}
              accent={meta.color}
            />
            <StatCard
              icon={DeltaIcon}
              label="Score Delta"
              value={delta !== null ? (delta > 0 ? `+${delta}` : `${delta}`) : "—"}
              sub="vs previous tick"
              accent={
                delta === null ? "#8b5cf6"
                  : delta > 0 ? "#ef4444"
                  : delta < 0 ? "#22c55e"
                  : "#8b5cf6"
              }
            />
            <StatCard
              icon={Activity}
              label="Session Avg CVI"
              value={avgCvi || "—"}
              sub={`over ${cviHistory.length} readings`}
            />
            <StatCard
              icon={Clock}
              label="High-Threat Ticks"
              value={highCount}
              sub="in current session"
              accent="#ef4444"
            />
          </div>

          {/* Gauge + Timeline row */}
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
            {/* Gauge card */}
            <div className="rounded-2xl bg-[#0a1120] border border-white/[0.07] p-6 flex flex-col items-center gap-2">
              <div className="w-full flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-white">
                  Crisis Vulnerability Index
                </h2>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${LEVEL_BADGE[meta.level]}`}
                >
                  {meta.level}
                </span>
              </div>
              <CviGauge currentCvi={currentCvi} />
            </div>

            {/* Timeline card */}
            <div className="rounded-2xl bg-[#0a1120] border border-white/[0.07] p-6">
              <CviTimeline cviHistory={cviHistory} />
            </div>
          </div>

          {/* Alert feed */}
          <div className="rounded-2xl bg-[#0a1120] border border-white/[0.07] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">
                Live Alert Feed
              </h2>
              <span className="text-[10px] text-slate-500 font-medium">
                Last {alerts.length} events
              </span>
            </div>

            {alerts.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-6">
                Waiting for events…
              </p>
            ) : (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                  >
                    <span
                      className={`mt-0.5 shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${LEVEL_BADGE[a.level]}`}
                    >
                      {a.level}
                    </span>
                    <p className="text-xs text-slate-300 flex-1">{a.message}</p>
                    <span className="text-[10px] text-slate-600 font-mono shrink-0">
                      {a.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
