"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Bell,
  BookOpen,
  Settings,
  Radio,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Alerts", icon: Bell, href: "/alerts" },
  { label: "Playbooks", icon: BookOpen, href: "/playbooks" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#0a0e1a] border-r border-white/[0.06] shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
          <Radio className="w-5 h-5 text-white" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0e1a] animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-wide">PulseSphere</p>
          <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest">AI · Crisis Intel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Navigation
        </p>
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? "bg-violet-500/15 text-violet-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  active ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"
                }`}
                size={18}
              />
              <span className="text-sm font-medium">{label}</span>
              {active && (
                <ChevronRight
                  size={14}
                  className="ml-auto text-violet-400 opacity-70"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer badge */}
      <div className="px-4 pb-5">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400 font-medium">Live feed active</span>
        </div>
      </div>
    </aside>
  );
}
