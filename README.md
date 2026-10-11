# pknspace Dash

Personal dashboard for every app on the VPS, live at https://dash.pknspace.com. Apps are
edited in the browser (no config files), and each card shows whether the app is up and how
fast it answered, under a strip of live CPU, memory, disk and uptime.

## Features

- App cards grouped by section, with the app's own favicon (falls back to its first letter)
  and an accent glow per app.
- Live status: green/red dot and response time for each app, checked every minute.
- Server stats: CPU %, memory, disk and uptime of the VPS.
- Search: `/` to focus, Enter opens the first match, Esc clears.
- Edit mode at `/edit`: sign in with an email on `EDITOR_EMAILS` to add, edit, delete and
  reorder apps. `/` is the read-only dashboard for everyone (the lock button links to `/edit`).

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui (Base UI) · Framer Motion · Convex + `@convex-dev/auth` (Password) · Vitest, plus a
standard-library Python script on the VPS for monitoring.

## Development

Requires Node 22.18+ (`.nvmrc` pins 22).

```bash
npm install
npx convex deployment select local   # first time only: dev runs on a local backend
npm run convex:dev                   # starts the local backend (127.0.0.1:3210) and pushes convex/
npm run setup:auth && npx convex env set SITE_URL http://localhost:5173 && npx convex env set EDITOR_EMAILS you@example.com   # first time only
npm run dev
```

`public/live/status.json` and `stats.json` are sample files, so the status dots and stats
strip work locally without the VPS.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run build` | Typecheck and production build into `dist/` |
| `npm run convex:dev` / `convex:deploy` | Push backend functions to Convex |
| `npm run setup:auth` | Generate and set `JWT_PRIVATE_KEY` + `JWKS` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest): URL, icon, uptime and grouping helpers |
| `npm run check` | Typecheck, lint and tests |
| `npm run deploy` | Checks, deploys Convex to production, builds and uploads the site and `live.py` to the VPS |
| `npm run deploy:dry` | Same, but only previews: nothing is deployed or uploaded |

## Deployment

`scripts/deploy.sh` deploys `convex/` to the production deployment, builds the site with
that deployment's URL, syncs `dist/` to the VPS and uploads `server/live.py`. Settings live
in `.env.prod.local` (git-ignored, see `.env.example`): `CONVEX_DEPLOY_KEY` and `DEPLOY_HOST` / `DEPLOY_PORT` / `DEPLOY_DIR` /
`SERVER_DIR`. Set up auth on the production deployment once:
`node scripts/setup-auth-keys.ts --apply --prod`, `npx convex env set --prod SITE_URL https://dash.pknspace.com`
and `npx convex env set --prod EDITOR_EMAILS you@example.com`.

One-time VPS setup (already done):

```bash
rsync -az -e "ssh -p 20044" server/ pkn@37.187.139.100:dash-server/
ssh -t -p 20044 pkn@37.187.139.100 'sudo bash ~/dash-server/setup.sh'   # folders + Caddy site
# crontab -e (as pkn):
# * * * * * /usr/bin/python3 /home/pkn/dash-server/live.py /var/www/dash-live https://whimsical-guineapig-290.convex.cloud >/dev/null 2>&1
```

The Caddy site (`server/Caddyfile.snippet`) serves `/var/www/dash` with an SPA fallback and
`/var/www/dash-live` at `/live/*` with `Cache-Control: no-store`. The Cloudflare Tunnel
routes `dash.pknspace.com` to `http://localhost:8080`, like the other apps.

## How it works

- `convex/` holds one `apps` table (name, URL, group, description, icon, accent, order).
  Reads are public; every write checks that the caller is signed in and their email is in
  `EDITOR_EMAILS` (at sign-in and again on every write).
- Status and stats never touch Convex, to stay well inside the free plan. `server/live.py`
  runs from cron every minute: it checks each app's URL, samples CPU, memory and disk, and
  writes `status.json` / `stats.json` atomically. HTTP 200–399 counts as up, and so does 401,
  since a password-protected app is running even though the check can't log in. It refreshes the app list from Convex at
  most once an hour (cached in `apps.json`), about 720 calls a month.
- The page polls `/live/*.json` every 30 s while the tab is visible, so numbers are at most
  about 90 s old. Response time is measured from the VPS through Cloudflare, so it is the
  public round trip, not your browser's load time.
- There is no load average: the VPS is an LXC container, where `/proc/loadavg` reports the
  whole host.
- `public/sw.js` is a kill switch for the service worker the old Homer dashboard registered;
  it clears Homer's caches and unregisters itself.
