import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Code, Globe, Lock, Monitor, Pencil, Smartphone, type LucideIcon } from "lucide-react";
import { useState } from "react";
import type { Doc } from "@convex/_generated/dataModel";
import { IconButton } from "@/components/IconButton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AppStatus } from "@/lib/live";
import { cn, hostname, iconCandidates, primaryLink } from "@/lib/utils";

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

const PLATFORMS: { key: "web" | "android" | "desktop" | "repo"; label: string; icon: LucideIcon }[] = [
  { key: "web", label: "Web", icon: Globe },
  { key: "android", label: "Android", icon: Smartphone },
  { key: "desktop", label: "Desktop", icon: Monitor },
  { key: "repo", label: "Source", icon: Code },
];

export function AppCard({ app, status, stale, editing, onEdit, onMove }: Props) {
  const [iconIndex, setIconIndex] = useState(0);
  // Wait for the status check before fetching favicons, and skip them on 401
  // (Basic Auth) sites, where the request would trigger the browser's sign-in prompt.
  const links = PLATFORMS.filter((p) => app[p.key]);
  const icon = iconCandidates(app.web, app.icon, status !== undefined && status.code !== 401)[iconIndex];

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="group relative min-w-0">
      <a
        href={primaryLink(app)}
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
            {app.web && <StatusDot status={status} stale={stale} />}
            {app.private && (
              <Tooltip>
                <TooltipTrigger render={<span role="img" aria-label="Private" />} className="text-muted-foreground">
                  <Lock className="size-3" />
                </TooltipTrigger>
                <TooltipContent>Private: only editors see it</TooltipContent>
              </Tooltip>
            )}
            {app.web && status?.up && !stale && (
              <Badge variant="outline" className="ml-auto font-mono tabular-nums text-muted-foreground">{status.ms}ms</Badge>
            )}
          </span>
          <span className="block truncate text-xs text-muted-foreground" style={{ paddingRight: links.length * 24 }}>{app.description || (app.web ? hostname(app.web) : "")}</span>
        </span>
      </a>

      {/* Platform links sit outside the card's <a>, since links can't nest. */}
      <div className="absolute right-3 bottom-2 flex gap-0.5">
        {links.map(({ key, label, icon: Icon }) => (
          <a
            key={key}
            href={app[key]}
            target="_blank"
            rel="noreferrer"
            aria-label={`${app.name}: ${label}`}
            title={label}
            className="grid size-6 place-items-center rounded-md text-muted-foreground/70 transition hover:bg-white/10 hover:text-foreground"
          >
            <Icon className="size-3.5" />
          </a>
        ))}
      </div>

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
