#!/usr/bin/env bash
# One-time VPS setup (needs sudo): web folders owned by pkn and the Caddy site.
#   scp -P 20044 server/setup.sh server/Caddyfile.snippet pkn@37.187.139.100:dash-server/
#   ssh -t -p 20044 pkn@37.187.139.100 'sudo bash ~/dash-server/setup.sh'
set -euo pipefail
cd "$(dirname "$0")"

install -d -o pkn -g pkn -m 755 /var/www/dash /var/www/dash-live

if grep -q 'dash.pknspace.com' /etc/caddy/Caddyfile; then
  echo "Caddyfile already has a dash block; leaving it alone."
else
  cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak.$(date +%Y%m%d%H%M%S)"
  { echo; grep -v '^#' Caddyfile.snippet; } >> /etc/caddy/Caddyfile
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
  systemctl reload caddy
fi
echo "Done."
