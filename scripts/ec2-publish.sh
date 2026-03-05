#!/usr/bin/env bash
# Rode ESTE SCRIPT NA EC2 depois de dar git pull.
# Publica o frontend (dist) em /var/www/aplicativo (ERP web).

set -euo pipefail

REMOTE_WEB_DIR="${REMOTE_WEB_DIR:-/var/www/aplicativo}"
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

cd "$REPO_DIR" || exit 1

echo "==> git pull"
git pull

echo "==> Build frontend"
cd "$REPO_DIR/frontend"
npm ci
npm run build

echo "==> Publicar em $REMOTE_WEB_DIR"
sudo rsync -a --delete \
  --exclude 'erp' \
  --exclude 'ponto' \
  --exclude 'downloads' \
  --exclude 'index.html' \
  dist/ "$REMOTE_WEB_DIR/"
sudo chown -R nginx:nginx "$REMOTE_WEB_DIR"
sudo nginx -t && sudo systemctl reload nginx

echo "OK: ERP web publicado."
