#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/d/Sistema ERP/acasa-erp"
KEY_PATH="/c/Users/Julyana Duarte/.ssh/acasa_key"
EC2_HOST="ec2-user@54.164.55.32"

REMOTE_WEB_DIR="/var/www/aplicativo"
REMOTE_PONTO_DIR="/var/www/ponto"

cd "$ROOT_DIR" || exit 1

# Um bump só: Android e Tauri saem com a mesma versão (0.1.x)
echo "==> Bump versão (package.json + tauri) — mesma versão para os 3"
node "$ROOT_DIR/scripts/bump-desktop-version.mjs"

echo "==> Atualizando APKs (ERP + Ponto)"
bash "$ROOT_DIR/scripts/deploy-android.sh"

echo "==> Atualizando Desktop (Tauri)"
SKIP_BUMP=1 bash "$ROOT_DIR/scripts/deploy-tauri.sh"

echo "==> Publicando landing do Ponto (index no subdominio ponto)"
scp -i "$KEY_PATH" "$ROOT_DIR/aplicativo-site/index-ponto.html" "$EC2_HOST:/home/ec2-user/index-ponto.html"
ssh -i "$KEY_PATH" "$EC2_HOST" \
  "sudo mkdir -p $REMOTE_PONTO_DIR && sudo mv /home/ec2-user/index-ponto.html $REMOTE_PONTO_DIR/index.html && sudo chown nginx:nginx $REMOTE_PONTO_DIR/index.html && sudo chmod 644 $REMOTE_PONTO_DIR/index.html"

echo "==> Publicando version.json (Android: botão 'Verificar atualização')"
mkdir -p "$ROOT_DIR/aplicativo-site/updates/android"
(cd "$ROOT_DIR" && node -e "
const p = require('./frontend/package.json');
const o = { version: p.version, url: 'https://aplicativo.acasamarcenaria.com.br/erp/Acasa.apk' };
require('fs').writeFileSync('./aplicativo-site/updates/android/version.json', JSON.stringify(o, null, 2));
")
scp -i "$KEY_PATH" "$ROOT_DIR/aplicativo-site/updates/android/version.json" "$EC2_HOST:/home/ec2-user/version.json"
ssh -i "$KEY_PATH" "$EC2_HOST" \
  "sudo mkdir -p $REMOTE_WEB_DIR/updates/android && sudo mv /home/ec2-user/version.json $REMOTE_WEB_DIR/updates/android/ && sudo chown -R nginx:nginx $REMOTE_WEB_DIR/updates"

echo "==> Publicando pagina de downloads (index.html)"
scp -i "$KEY_PATH" "$ROOT_DIR/aplicativo-site/index.html" "$EC2_HOST:/home/ec2-user/index.html"
ssh -i "$KEY_PATH" "$EC2_HOST" \
  "sudo mkdir -p $REMOTE_WEB_DIR/downloads $REMOTE_WEB_DIR && sudo cp /home/ec2-user/index.html $REMOTE_WEB_DIR/downloads/index.html && sudo cp /home/ec2-user/index.html $REMOTE_WEB_DIR/index.html && sudo rm -f /home/ec2-user/index.html && sudo chown -R nginx:nginx $REMOTE_WEB_DIR/downloads $REMOTE_WEB_DIR/index.html && sudo chmod 644 $REMOTE_WEB_DIR/index.html"

echo "==> Atualizando ERP Web (frontend dist)"
ssh -i "$KEY_PATH" "$EC2_HOST" \
  "cd ~/acasa-erp/frontend && git pull && npm ci && npm run build && sudo rsync -a --delete --exclude 'erp' --exclude 'ponto' --exclude 'downloads' --exclude 'index.html' dist/ $REMOTE_WEB_DIR/ && sudo chown -R nginx:nginx $REMOTE_WEB_DIR && sudo nginx -t && sudo systemctl reload nginx"

echo "OK: Android + Desktop (Tauri) + Web atualizados."
