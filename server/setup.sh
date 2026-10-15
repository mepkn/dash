#!/usr/bin/env bash
# One-time VPS setup (no sudo; run as pkn): web folders and the Caddy site in
# /etc/caddy/sites/, which the main Caddyfile imports.
#   rsync -az -e "ssh -p 20044" server/ pkn@37.187.139.100:dash-server/
#   ssh -p 20044 pkn@37.187.139.100 'bash ~/dash-server/setup.sh'
set -euo pipefail
cd "$(dirname "$0")"

mkdir -p /var/www/dash /var/www/dash-live

SITE=/etc/caddy/sites/dash.caddy
if [ -f "$SITE" ]; then
  echo "$SITE already exists; leaving it alone."
else
  grep -v '^#' Caddyfile.snippet > "$SITE"
  if caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile; then
    caddy reload --config /etc/caddy/Caddyfile
  else
    rm "$SITE"
    echo "Caddy config invalid; removed $SITE." >&2
    exit 1
  fi
fi
echo "Done."
