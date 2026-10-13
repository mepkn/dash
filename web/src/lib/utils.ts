import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Icons to try in order: the custom one, then the site's own favicons.
 * `siteIcons: false` skips the favicons, e.g. for Basic Auth sites, where fetching
 * one makes the browser pop up a sign-in prompt.
 */
export function iconCandidates(url: string, custom?: string, siteIcons = true): string[] {
  const candidates = custom ? [custom] : [];
  if (!siteIcons) return candidates;
  try {
    candidates.push(new URL("/favicon.svg", url).href, new URL("/favicon.ico", url).href);
  } catch {
    // Bad URL: only the custom icon, if any.
  }
  return candidates;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Groups items in first-seen order, keeping each group's items in order. */
export function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return [...groups];
}
