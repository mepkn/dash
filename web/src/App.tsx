import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { LockOpen, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { AppCard } from "@/components/AppCard";
import { AppDialog } from "@/components/AppDialog";
import { IconButton } from "@/components/IconButton";
import { StatsStrip } from "@/components/StatsStrip";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { EditGate } from "@/components/EditGate";
import { isEditRoute } from "@/lib/route";
import { useLive, type Stats, type Status } from "@/lib/live";
import { groupBy, hostname } from "@/lib/utils";

// live.py runs every minute; older than this means the cron stopped.
const STALE_AFTER_SEC = 5 * 60;

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function App() {
  return isEditRoute ? (
    <EditGate>
      <Dashboard canEdit />
    </EditGate>
  ) : (
    <Dashboard canEdit={false} />
  );
}

/** The dashboard. Editing controls only on /edit (EditGate has checked the allowlist). */
function Dashboard({ canEdit }: { canEdit: boolean }) {
  const apps = useQuery(api.apps.list);
  const status = useLive<Status>("status.json");
  const stats = useLive<Stats>("stats.json");
  const { signOut } = useAuthActions();
  const reorder = useMutation(api.apps.reorder);
  const now = useClock();

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Doc<"apps"> | null | undefined>(undefined); // undefined = closed
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses search, Enter opens the first match.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!apps || !q) return apps ?? [];
    return apps.filter((a) => [a.name, a.group, a.description ?? "", hostname(a.url)].some((s) => s.toLowerCase().includes(q)));
  }, [apps, query]);

  const groups = useMemo(() => groupBy(filtered, (a) => a.group), [filtered]);
  const stale = !status || (!import.meta.env.DEV && now.getTime() / 1000 - status.checkedAt > STALE_AFTER_SEC);
  const upCount = apps?.filter((a) => status?.apps[a.url]?.up).length ?? 0;

  const move = (id: Id<"apps">, dir: -1 | 1) => {
    if (!apps) return;
    const ids = apps.map((a) => a._id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorder({ ids });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="backdrop" />

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary/80">pknspace</p>
          <h1 className="mt-1 bg-gradient-to-r from-white via-slate-200 to-violet bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            {apps && !stale && (
              <span className="ml-2 font-mono text-xs text-muted-foreground/70">· {upCount}/{apps.length} up</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InputGroup className="glass h-10 w-52 rounded-xl sm:w-64">
            <InputGroupAddon><Search /></InputGroupAddon>
            <InputGroupInput
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered[0]) window.open(filtered[0].url, "_blank", "noreferrer");
                if (e.key === "Escape") setQuery("");
              }}
              placeholder="Search apps"
              aria-label="Search apps"
            />
            <InputGroupAddon align="inline-end"><Kbd>/</Kbd></InputGroupAddon>
          </InputGroup>
          {canEdit && (
            <>
              <IconButton label="Add app" variant="outline" size="icon-lg" className="glass size-10 rounded-xl text-primary" onClick={() => setEditing(null)}>
                <Plus />
              </IconButton>
              <IconButton
                label="Sign out of edit mode"
                variant="outline"
                size="icon-lg"
                className="glass size-10 rounded-xl text-muted-foreground"
                onClick={() => void signOut().then(() => location.assign("/"))}
              >
                <LockOpen className="text-primary" />
              </IconButton>
            </>
          )}
        </div>
      </header>

      <StatsStrip stats={stats} />

      <main className="mt-10 space-y-10">
        {apps === undefined && <p className="text-sm text-muted-foreground/70">Loading…</p>}
        {apps?.length === 0 && (
          <p className="text-sm text-muted-foreground">No apps yet. {canEdit && "Add one with +."}</p>
        )}
        {apps && apps.length > 0 && filtered.length === 0 && <p className="text-sm text-muted-foreground">Nothing matches “{query}”.</p>}
        {groups.map(([group, items]) => (
          <section key={group}>
            <h2 className="mb-3 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {group}
              <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((app) => (
                <AppCard
                  key={app._id}
                  app={app}
                  status={status?.apps[app.url]}
                  stale={stale}
                  editing={canEdit}
                  onEdit={() => setEditing(app)}
                  onMove={(dir) => move(app._id, dir)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <AppDialog
        open={editing !== undefined}
        app={editing ?? null}
        groups={[...new Set(apps?.map((a) => a.group))]}
        onClose={() => setEditing(undefined)}
      />
    </div>
  );
}
