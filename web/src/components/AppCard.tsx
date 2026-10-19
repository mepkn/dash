import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import { useState } from "react";
import type { Doc } from "@convex/_generated/dataModel";
import { IconButton } from "@/components/IconButton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  const label =
    !status || stale ? "No recent check" : status.up ? `Up · HTTP ${status.code}` : `Down · ${status.code ? `HTTP ${status.code}` : "no response"}`;
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span role="img" aria-label={label} />}
        className={cn(
          "size-2 shrink-0 rounded-full",
          !status || stale ? "bg-slate-600" : status.up ? "pulse-dot bg-ok text-ok/60" : "pulse-dot bg-pink text-pink/60",
        )}
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function AppCard({ app, status, stale, editing, onEdit, onMove }: Props) {
  const [iconIndex, setIconIndex] = useState(0);
  // Wait for the status check before fetching favicons, and skip them on 401
  // (Basic Auth) sites, where the request would trigger the browser's sign-in prompt.
  const icon = iconCandidates(app.url, app.icon, status !== undefined && status.code !== 401)[iconIndex];

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="group relative">
      <a
        href={app.url}
        target="_blank"
        rel="noreferrer"
        className="glass relative flex items-center gap-3.5 rounded-2xl p-4 overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-white/15 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {/* Glow that wakes up on hover. */}
        <span className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100 [background:radial-gradient(18rem_8rem_at_0%_0%,color-mix(in_srgb,#00f0ff_22%,transparent),transparent)]" />
        <span className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
          {icon ? (
            <img src={icon} alt="" className="size-6 object-contain" onError={() => setIconIndex((i) => i + 1)} />
          ) : (
            <span className="text-lg font-semibold" style={{ color: "#00f0ff" }}>{app.name.charAt(0).toUpperCase()}</span>
          )}
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{app.name}</span>
            <StatusDot status={status} stale={stale} />
          </span>
          <span className="block truncate text-xs text-muted-foreground">{app.description || hostname(app.url)}</span>
        </span>
        {status?.up && !stale && (
          <Badge variant="outline" className="relative font-mono tabular-nums text-muted-foreground">{status.ms}ms</Badge>
        )}
      </a>

      {editing && (
        <div className="absolute -top-2.5 right-2 flex gap-1">
          <IconButton label={`Move ${app.name} up`} variant="outline" size="icon-xs" className="bg-popover" onClick={() => onMove(-1)}><ArrowUp /></IconButton>
          <IconButton label={`Move ${app.name} down`} variant="outline" size="icon-xs" className="bg-popover" onClick={() => onMove(1)}><ArrowDown /></IconButton>
          <IconButton label={`Edit ${app.name}`} variant="outline" size="icon-xs" className="bg-popover" onClick={onEdit}><Pencil /></IconButton>
        </div>
      )}
    </motion.div>
  );
}
