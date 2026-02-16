#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/d/Sistema ERP/acasa-erp"
KEY_PATH="/c/Users/Julyana Duarte/.ssh/acasa_key"
EC2_HOST="ec2-user@54.164.55.32"

REMOTE_WEB_DIR="/var/www/aplicativo"

echo "==> Atualizando APKs (ERP + Ponto)"
bash "$ROOT_DIR/scripts/deploy-android.sh"

echo "==> Atualizando Desktop (Tauri)"
bash "$ROOT_DIR/scripts/deploy-tauri.sh"

echo "==> Publicando pagina de downloads (index.html)"
scp -i "$KEY_PATH" "$ROOT_DIR/aplicativo-site/index.html" "$EC2_HOST:/home/ec2-user/index.html"
ssh -i "$KEY_PATH" "$EC2_HOST" \
  "sudo mkdir -p $REMOTE_WEB_DIR/downloads $REMOTE_WEB_DIR && sudo cp /home/ec2-user/index.html $REMOTE_WEB_DIR/downloads/index.html && sudo cp /home/ec2-user/index.html $REMOTE_WEB_DIR/index.html && sudo rm -f /home/ec2-user/index.html && sudo chown -R nginx:nginx $REMOTE_WEB_DIR/downloads $REMOTE_WEB_DIR/index.html && sudo chmod 644 $REMOTE_WEB_DIR/index.html"

echo "==> Atualizando ERP Web (frontend dist)"
ssh -i "$KEY_PATH" "$EC2_HOST" \
  "cd ~/acasa-erp/frontend && git pull && npm ci && npm run build && sudo rsync -a --delete --exclude 'erp' --exclude 'ponto' --exclude 'downloads' --exclude 'index.html' dist/ $REMOTE_WEB_DIR/ && sudo chown -R nginx:nginx $REMOTE_WEB_DIR && sudo nginx -t && sudo systemctl reload nginx"

echo "OK: Android + Desktop (Tauri) + Web atualizados."
