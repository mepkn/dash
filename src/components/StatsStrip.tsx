import { Clock, Cpu, HardDrive, MemoryStick } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Stats } from "@/lib/live";
import { cn, formatUptime } from "@/lib/utils";

function Meter({ icon, label, percent, detail }: { icon: ReactNode; label: string; percent: number; detail: string }) {
  const hot = percent >= 85;
  return (
    <Card size="sm" className="glass gap-2 px-4">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <span className={cn("font-mono tabular-nums", hot ? "text-pink" : "text-foreground")}>{Math.round(percent)}%</span>
      </div>
      <Progress
        value={Math.min(percent, 100)}
        aria-label={`${label} ${Math.round(percent)}%`}
        className="[&_[data-slot=progress-indicator]]:duration-700"
        // Gradient bar, or pink when nearly full.
        style={{ ["--bar" as string]: hot ? "var(--color-pink)" : "linear-gradient(90deg, var(--color-cyan), var(--color-violet))" }}
      />
      <div className="font-mono text-[11px] text-muted-foreground/70 truncate">{detail}</div>
    </Card>
  );
}

export function StatsStrip({ stats }: { stats: Stats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Meter icon={<Cpu size={13} />} label="CPU" percent={stats.cpu.percent} detail={`${stats.cpu.cores} core${stats.cpu.cores === 1 ? "" : "s"}`} />
      <Meter icon={<MemoryStick size={13} />} label="Memory" percent={stats.memory.percent} detail={`${(stats.memory.usedMb / 1024).toFixed(1)} / ${(stats.memory.totalMb / 1024).toFixed(1)} GB`} />
      <Meter icon={<HardDrive size={13} />} label="Disk" percent={stats.disk.percent} detail={`${stats.disk.usedGb} / ${stats.disk.totalGb} GB`} />
      <Card size="sm" className="glass gap-1.5 px-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock size={13} />Uptime</div>
        <div className="font-mono text-lg">{formatUptime(stats.uptimeSec)}</div>
      </Card>
    </div>
  );
}
