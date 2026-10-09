#!/usr/bin/env python3
"""Writes status.json and stats.json for the dashboard. Run every minute by cron:

    * * * * * /usr/bin/python3 /home/pkn/dash-server/live.py /var/www/dash-live https://<deployment>.convex.cloud

The app list is fetched from Convex at most once an hour (cached in apps.json
next to this script), so monitoring costs ~720 Convex calls a month. Standard
library only: the VPS has no jq or pip packages.
"""
import json
import os
import shutil
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

APPS_CACHE = Path(__file__).with_name("apps.json")
APPS_MAX_AGE = 3600
TIMEOUT = 10


def write_json(path: Path, data) -> None:
    # Write then rename so the browser never reads a half-written file.
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data))
    os.replace(tmp, path)


def load_apps(convex_url: str) -> list[str]:
    fresh = APPS_CACHE.exists() and time.time() - APPS_CACHE.stat().st_mtime < APPS_MAX_AGE
    if not fresh:
        try:
            req = urllib.request.Request(
                f"{convex_url}/api/query",
                data=json.dumps({"path": "apps:list", "args": {}, "format": "json"}).encode(),
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
                body = json.load(res)
            if body.get("status") == "success":
                write_json(APPS_CACHE, [a["url"] for a in body["value"]])
        except Exception as e:  # keep using the stale cache
            print(f"apps fetch failed: {e}", file=sys.stderr)
    return json.loads(APPS_CACHE.read_text()) if APPS_CACHE.exists() else []


def check(url: str) -> tuple[str, dict]:
    start = time.monotonic()
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": "pknspace-dash/1"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
            code = res.status
    except urllib.error.HTTPError as e:
        code = e.code
    except Exception:
        code = 0
    ms = round((time.monotonic() - start) * 1000)
    return url, {"up": 200 <= code < 400, "code": code, "ms": ms}


def cpu_percent() -> float:
    def sample():
        fields = list(map(int, Path("/proc/stat").read_text().split("\n")[0].split()[1:]))
        return fields[3] + fields[4], sum(fields)  # idle + iowait, total

    idle1, total1 = sample()
    time.sleep(1)
    idle2, total2 = sample()
    return round(100 * (1 - (idle2 - idle1) / max(total2 - total1, 1)), 1)


def stats() -> dict:
    mem = {}
    for line in Path("/proc/meminfo").read_text().splitlines():
        key, value = line.split(":")
        mem[key] = int(value.split()[0])  # kB
    total_mb = mem["MemTotal"] // 1024
    used_mb = (mem["MemTotal"] - mem["MemAvailable"]) // 1024
    disk = shutil.disk_usage("/")
    return {
        "checkedAt": int(time.time()),
        # No load average: the VPS is an LXC container, where /proc/loadavg
        # reports the whole host (other tenants included), not this machine.
        "cpu": {
            "cores": os.cpu_count(),
            "percent": cpu_percent(),
        },
        "memory": {"usedMb": used_mb, "totalMb": total_mb, "percent": round(100 * used_mb / total_mb)},
        "disk": {
            "usedGb": round(disk.used / 1e9, 1),
            "totalGb": round(disk.total / 1e9, 1),
            "percent": round(100 * disk.used / disk.total),
        },
        "uptimeSec": int(float(Path("/proc/uptime").read_text().split()[0])),
    }


def main() -> None:
    out_dir, convex_url = Path(sys.argv[1]), sys.argv[2].rstrip("/")
    out_dir.mkdir(parents=True, exist_ok=True)
    apps = load_apps(convex_url)
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = dict(pool.map(check, apps))
    write_json(out_dir / "status.json", {"checkedAt": int(time.time()), "apps": results})
    write_json(out_dir / "stats.json", stats())


if __name__ == "__main__":
    main()
