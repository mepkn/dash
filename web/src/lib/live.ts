import { useEffect, useState } from "react";

export type AppStatus = { up: boolean; code: number; ms: number };
export type Status = { checkedAt: number; apps: Record<string, AppStatus> };
export type Stats = {
  checkedAt: number;
  cpu: { cores: number; percent: number };
  memory: { usedMb: number; totalMb: number; percent: number };
  disk: { usedGb: number; totalGb: number; percent: number };
  uptimeSec: number;
};

const POLL_MS = 30_000;

/** Polls a JSON file under /live (written by server/live.py) while the tab is visible. */
export function useLive<T>(file: "status.json" | "stats.json"): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/live/${file}`, { cache: "no-store" });
        if (res.ok && !cancelled) setData(await res.json());
      } catch {
        // Keep the last good value; the dot goes grey when it gets stale.
      }
    };
    const poll = () => {
      if (!document.hidden) load();
    };
    load();
    const timer = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [file]);

  return data;
}
