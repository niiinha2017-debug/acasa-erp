#!/usr/bin/env bash
set -euo pipefail

# Atualiza apenas os apps:
# - ERP Android + Ponto Android
# - Desktop (Tauri)
#
# Não mexe em ERP Web (frontend em acasamarcenaria.com.br).

ROOT_DIR="/d/Sistema ERP/acasa-erp"
KEY_PATH="/c/Users/Julyana Duarte/.ssh/acasa_key"
EC2_HOST="ec2-user@54.164.55.32"
REMOTE_WEB_DIR="/var/www/aplicativo"
REMOTE_PONTO_DIR="/var/www/ponto"

cd "$ROOT_DIR" || exit 1

echo "==> Bump versão (mesma para Android e Tauri)"
node "$ROOT_DIR/scripts/bump-desktop-version.mjs"

echo "==> Atualizando APKs (ERP + Ponto)"
bash "$ROOT_DIR/scripts/deploy-android.sh"

echo "==> Atualizando Desktop (Tauri)"
SKIP_BUMP=1 bash "$ROOT_DIR/scripts/deploy-tauri.sh"

echo "==> Publicando version.json (Android: verificar atualização)"
mkdir -p "$ROOT_DIR/aplicativo-site/updates/android"
(cd "$ROOT_DIR" && node -e "
const p = require('./frontend/package.json');
const o = { version: p.version, url: 'https://aplicativo.acasamarcenaria.com.br/erp/Acasa.apk' };
require('fs').writeFileSync('./aplicativo-site/updates/android/version.json', JSON.stringify(o, null, 2));
")
scp -i "$KEY_PATH" "$ROOT_DIR/aplicativo-site/updates/android/version.json" "$EC2_HOST:/home/ec2-user/version.json"
ssh -i "$KEY_PATH" "$EC2_HOST" \
  "sudo mkdir -p $REMOTE_WEB_DIR/updates/android && sudo mv /home/ec2-user/version.json $REMOTE_WEB_DIR/updates/android/ && sudo chown -R nginx:nginx $REMOTE_WEB_DIR/updates"

echo "==> Publicando landing do Ponto (ponto.acasamarcenaria.com.br)"
scp -i "$KEY_PATH" "$ROOT_DIR/aplicativo-site/index-ponto.html" "$EC2_HOST:/home/ec2-user/index-ponto.html"
ssh -i "$KEY_PATH" "$EC2_HOST" \
  "sudo mkdir -p $REMOTE_PONTO_DIR && sudo find $REMOTE_PONTO_DIR -mindepth 1 -maxdepth 1 ! -name 'ponto.apk' -exec rm -rf {} \; 2>/dev/null || true && sudo mv /home/ec2-user/index-ponto.html $REMOTE_PONTO_DIR/index.html && sudo chown nginx:nginx $REMOTE_PONTO_DIR && sudo chmod 644 $REMOTE_PONTO_DIR/index.html"

echo "OK: Android (ERP + Ponto) + Desktop (Tauri) + version.json + landing Ponto atualizados."

