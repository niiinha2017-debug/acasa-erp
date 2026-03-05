#!/usr/bin/env bash
# Rode ESTE SCRIPT NA EC2 para publicar o frontend (ERP web).
#
# Equivalente manual:
#   cd ~/acasa-erp/frontend
#   git pull
#   npm ci
#   npm run build
#   sudo rsync -a --delete --exclude 'erp' --exclude 'ponto' --exclude 'downloads' dist/ /var/www/aplicativo/  # inclui index.html
#   sudo chown -R nginx:nginx /var/www/aplicativo
#   sudo nginx -t && sudo systemctl reload nginx

set -euo pipefail

REMOTE_WEB_DIR="${REMOTE_WEB_DIR:-/var/www/aplicativo}"
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

cd "$REPO_DIR" || exit 1

echo "==> git pull"
git pull

echo "==> Build frontend"
cd "$REPO_DIR/frontend"
npm ci
# Aumenta memória do Node para evitar "heap out of memory" na EC2
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
npm run build

echo "==> Publicar em $REMOTE_WEB_DIR"
sudo rsync -a --delete \
  --exclude 'erp' \
  --exclude 'ponto' \
  --exclude 'downloads' \
  dist/ "$REMOTE_WEB_DIR/"
sudo chown -R nginx:nginx "$REMOTE_WEB_DIR"
sudo nginx -t && sudo systemctl reload nginx

echo "OK: ERP web publicado."
