# pknspace Dash

Personal dashboard for every app on the VPS, live at https://dash.pknspace.com. Apps are
edited in the browser (no config files), and each card shows whether the app is up and how
fast it answered, under a strip of live CPU, memory, disk and uptime.

## Features

- App cards grouped by section, with the app's own favicon (falls back to its first letter).
- Platform links on each card: web, Android, desktop and source, any of them. The card opens the
  web app, or the Android or desktop download when there is no web app.
- Private apps (niji, pralekh) are only listed for signed-in editors, marked with a lock.
- Live status: green/red dot and response time for each app with a web link, checked every minute.
- Server stats: CPU %, memory, disk and uptime of the VPS.
- Search: `/` to focus, Enter opens the first match, Esc clears.
- Edit mode at `/edit`: sign in with an email on `ALLOWED_EMAILS` to add, edit, delete and
  reorder apps. `/` is the read-only dashboard for everyone; nothing on it links to `/edit`.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui (Base UI) · Framer Motion · Convex + `@convex-dev/auth` (Password) · Vitest, plus a
standard-library Python script on the VPS for monitoring.

## Development

Requires Node 22.18+ (`.nvmrc` pins 22).

```bash
cd backend && npm install
npx convex deployment select local   # first time only: dev runs on a local backend
npm run dev                          # starts the local backend (127.0.0.1:3210) and pushes convex/
npm run setup:auth && npx convex env set SITE_URL http://localhost:5173 && npx convex env set ALLOWED_EMAILS you@example.com   # first time only
cd ../web && npm install && npm run dev   # in a second terminal
```

`web/public/live/stats.json` is a sample file, so the stats strip works locally without the VPS.
`status.json` is keyed by app id, so its sample entries don't match local apps and the dots stay grey.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` (`web/`) | Dev server at http://localhost:5173 |
| `npm run build` (`web/`) | Typecheck and production build into `web/dist/` |
| `npm run check` (`web/`) | Typecheck, lint and tests (Vitest: URL, icon, uptime and grouping helpers) |
| `npm run dev` (`backend/`) | Local Convex backend and function hot-reload |
| `npm run setup:auth` (`backend/`) | Generate and set `JWT_PRIVATE_KEY` + `JWKS` |
| `npm run check` (`backend/`) | Typecheck and lint |
| `scripts/check.sh` | Every part's `check`; run before committing |
| `scripts/deploy.sh` | Checks, deploys Convex to production, builds and uploads the site and `live.py` to the VPS |
| `DRY_RUN=1 scripts/deploy.sh` | Same, but only previews: nothing is deployed or uploaded |

## Deployment

`scripts/deploy.sh` deploys `backend/convex/` to the production deployment, builds the site with
that deployment's URL, syncs `web/dist/` to the VPS and uploads `server/live.py`. Settings live
in each part's `.env.prod.local` (git-ignored, see the `.env.example` next to each): `CONVEX_DEPLOY_KEY` in
`backend/`, `DEPLOY_HOST` / `DEPLOY_PORT` / `DEPLOY_DIR` in `web/`, and `SERVER_DIR` / `LIVE_DIR`
in `server/`. Set up auth on the production deployment once, in `backend/`:
`node scripts/setup-auth-keys.ts --apply --prod`, `npx convex env set --prod SITE_URL https://dash.pknspace.com`
and `npx convex env set --prod ALLOWED_EMAILS you@example.com`.

One-time VPS setup (already done):

```bash
rsync -az -e "ssh -p 20044" server/ pkn@37.187.139.100:dash-server/
ssh -p 20044 pkn@37.187.139.100 'bash ~/dash-server/setup.sh'   # folders + Caddy site, no sudo
# crontab -e (as pkn):
# openssl rand -hex 32 > ~/dash-server/.live-token; chmod 600 ~/dash-server/.live-token
# (and on Convex: npx convex env set --prod LIVE_TOKEN <same value>)
# * * * * * /usr/bin/python3 /home/pkn/dash-server/live.py /var/www/dash-live https://whimsical-guineapig-290.convex.cloud >/dev/null 2>&1
```

The Caddy site (`server/Caddyfile.snippet`) serves `/var/www/dash` with an SPA fallback and
`/var/www/dash-live` at `/live/*` with `Cache-Control: no-store`. The Cloudflare Tunnel
routes `dash.pknspace.com` to `http://localhost:8080`, like the other apps.

## How it works

- `backend/convex/` holds one `apps` table (name, web / android / desktop / repo links, private,
  group, description, icon, order). Reads are public except private apps, which `apps.list`
  returns only to editors; every write checks that the caller is signed in and their email is in
  `ALLOWED_EMAILS` (at sign-in and again on every write). For Android links, use a GitHub
  Release (`releases/latest`): Actions artifacts expire after 90 days and need a login.
- Status and stats never touch Convex, to stay well inside the free plan. `server/live.py`
  runs from cron every minute: it checks each app's URL, samples CPU, memory and disk, and
  writes `status.json` / `stats.json` atomically. HTTP 200–399 counts as up, and so does 401,
  since a password-protected app is running even though the check can't log in. It gets the web links to check from
  `apps:monitorTargets`, which needs `LIVE_TOKEN` (in `~/dash-server/.live-token` on the VPS and
  in the Convex env), at most once an hour (cached in `targets.json`), about 720 calls a month.
  `status.json` is keyed by app id, so it never names a private app.
- The page polls `/live/*.json` every 30 s while the tab is visible, so numbers are at most
  about 90 s old. Response time is measured from the VPS through Cloudflare, so it is the
  public round trip, not your browser's load time.
- There is no load average: the VPS is an LXC container, where `/proc/loadavg` reports the
  whole host.
- `web/public/sw.js` is a kill switch for the service worker the old Homer dashboard registered;
  it clears Homer's caches and unregisters itself.
