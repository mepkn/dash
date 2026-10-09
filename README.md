# dash

Personal dashboard for everything on pknspace, served at https://dash.pknspace.com.
Vite + React + Tailwind + Convex, deployed as static files behind Caddy (same setup as picki).

- **App list** lives in Convex and is edited in the UI. Writes need the
  `EDIT_TOKEN` env var on the deployment; unlock with the lock button.
- **Status and server stats** don't touch Convex: `server/live.py` runs from
  cron on the VPS every minute and writes `status.json` / `stats.json` into
  `/var/www/dash-live`, which Caddy serves at `/live/*`. It refreshes the app
  list from Convex at most once an hour.

## Develop

```sh
npm install
npx convex dev                    # local backend, writes .env.local
npx convex env set EDIT_TOKEN dev-token
npm run dev
```

`public/live/*.json` are sample files so the status dots and stats work locally.

## Deploy

1. `cp .env.example .env.prod.local` and fill in the production values.
2. `npx convex env set --prod EDIT_TOKEN <long random string>`
3. `npm run deploy` (or `npm run deploy:dry`).

Production: Convex project `dash` (team praveen-nirmalkar), prod deployment
`whimsical-guineapig-290`. The deploy key and the prod `EDIT_TOKEN` are in
`.env.prod.local`.

One-time VPS setup (already done once; kept for rebuilds):

```sh
rsync -az -e "ssh -p 20044" server/ pkn@37.187.139.100:dash-server/
ssh -t -p 20044 pkn@37.187.139.100 'sudo bash ~/dash-server/setup.sh'   # folders + Caddy site
# crontab for pkn:
# * * * * * /usr/bin/python3 /home/pkn/dash-server/live.py /var/www/dash-live https://whimsical-guineapig-290.convex.cloud
```

Routing: the Cloudflare Tunnel (managed in the Cloudflare dashboard) sends
`dash.pknspace.com` to `http://localhost:8080`, like the other apps.
