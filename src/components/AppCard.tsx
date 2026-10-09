import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import { useState } from "react";
import type { Doc } from "../../convex/_generated/dataModel";
import type { AppStatus } from "@/lib/live";
import { cn, hostname, iconCandidates } from "@/lib/utils";

type Props = {
  app: Doc<"apps">;
  status: AppStatus | undefined;
  stale: boolean;
  editing: boolean;
  onEdit: () => void;
  onMove: (dir: -1 | 1) => void;
};

function StatusDot({ status, stale }: { status: AppStatus | undefined; stale: boolean }) {
  if (!status || stale) {
    return <span className="size-2 rounded-full bg-slate-600" title="No recent check" />;
  }
  return (
    <span
      className={cn("pulse-dot size-2 rounded-full", status.up ? "bg-ok text-ok/60" : "bg-pink text-pink/60")}
      title={status.up ? `Up · HTTP ${status.code}` : `Down · ${status.code || "no response"}`}
    />
  );
}

export function AppCard({ app, status, stale, editing, onEdit, onMove }: Props) {
  const [iconIndex, setIconIndex] = useState(0);
  const accent = app.accent || "#00f0ff";
  const icon = iconCandidates(app.url, app.icon)[iconIndex];

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="group relative">
      <a
        href={app.url}
        target="_blank"
        rel="noreferrer"
        className="glass relative flex items-center gap-3.5 rounded-2xl p-4 overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-white/15 focus-visible:outline-2 focus-visible:outline-cyan"
        style={{ ["--accent" as string]: accent }}
      >
        {/* Accent glow that wakes up on hover. */}
        <span className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100 [background:radial-gradient(18rem_8rem_at_0%_0%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent)]" />
        <span className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
          {icon ? (
            <img src={icon} alt="" className="size-6 object-contain" onError={() => setIconIndex((i) => i + 1)} />
          ) : (
            <span className="text-lg font-semibold" style={{ color: accent }}>{app.name.charAt(0).toUpperCase()}</span>
          )}
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium text-slate-100">{app.name}</span>
            <StatusDot status={status} stale={stale} />
          </span>
          <span className="block truncate text-xs text-slate-400">{app.description || hostname(app.url)}</span>
        </span>
        {status?.up && !stale && (
          <span className="relative font-mono text-[11px] tabular-nums text-slate-500">{status.ms}ms</span>
        )}
      </a>

      {editing && (
        <div className="absolute -top-2 right-2 flex gap-1">
          {[
            { label: "Move up", icon: <ArrowUp size={12} />, run: () => onMove(-1) },
            { label: "Move down", icon: <ArrowDown size={12} />, run: () => onMove(1) },
            { label: "Edit", icon: <Pencil size={12} />, run: onEdit },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              aria-label={`${b.label}: ${app.name}`}
              onClick={b.run}
              className="grid size-6 place-items-center rounded-md bg-slate-900 ring-1 ring-white/15 text-slate-300 hover:text-cyan hover:ring-cyan/50"
            >
              {b.icon}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
