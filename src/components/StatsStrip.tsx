import { Clock, Cpu, HardDrive, MemoryStick } from "lucide-react";
import type { ReactNode } from "react";
import type { Stats } from "@/lib/live";
import { cn, formatUptime } from "@/lib/utils";

function Meter({ icon, label, percent, detail }: { icon: ReactNode; label: string; percent: number; detail: string }) {
  const hot = percent >= 85;
  return (
    <div className="glass rounded-xl px-4 py-3 min-w-0">
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <span className={cn("font-mono tabular-nums", hot ? "text-pink" : "text-slate-200")}>{Math.round(percent)}%</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", hot ? "bg-pink" : "bg-gradient-to-r from-cyan to-violet")}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="mt-1.5 text-[11px] font-mono text-slate-500 truncate">{detail}</div>
    </div>
  );
}

export function StatsStrip({ stats }: { stats: Stats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Meter icon={<Cpu size={13} />} label="CPU" percent={stats.cpu.percent} detail={`${stats.cpu.cores} core${stats.cpu.cores === 1 ? "" : "s"}`} />
      <Meter icon={<MemoryStick size={13} />} label="Memory" percent={stats.memory.percent} detail={`${(stats.memory.usedMb / 1024).toFixed(1)} / ${(stats.memory.totalMb / 1024).toFixed(1)} GB`} />
      <Meter icon={<HardDrive size={13} />} label="Disk" percent={stats.disk.percent} detail={`${stats.disk.usedGb} / ${stats.disk.totalGb} GB`} />
      <div className="glass rounded-xl px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400"><Clock size={13} />Uptime</div>
        <div className="mt-1.5 text-lg font-mono text-slate-100">{formatUptime(stats.uptimeSec)}</div>
      </div>
    </div>
  );
}
