#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
[[ -f "$SCRIPT_DIR/deploy.env" ]] && source "$SCRIPT_DIR/deploy.env"

KEY_PATH="${KEY_PATH:-$HOME/.ssh/acasa_key}"
EC2_HOST="${EC2_HOST:-ec2-user@54.164.55.32}"
REMOTE_ERP_DIR="/var/www/aplicativo/erp"
REMOTE_UPDATES_ANDROID="/var/www/aplicativo/updates/android"
# Relógio de ponto será servido em um vhost/subdomínio próprio (ponto.acasamarcenaria.com.br).
REMOTE_PONTO_DIR="/var/www/ponto"

ROOT_DIR="${ROOT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
ERP_DIR="$ROOT_DIR/frontend"
PONTO_DIR="$ROOT_DIR/frontend-ponto"

cd "$ROOT_DIR" || exit 1

ERP_APK_LOCAL="$ERP_DIR/android/app/build/outputs/apk/release/app-release.apk"
PONTO_APK_LOCAL="$PONTO_DIR/android/app/build/outputs/apk/release/app-release.apk"

ERP_APK_REMOTE="Acasa.apk"
PONTO_APK_REMOTE="ponto.apk"

START_TOTAL=$(date +%s)
echo "[$(date +%H:%M:%S)] Início do deploy Android (ERP + Ponto)"

echo "[$(date +%H:%M:%S)] ==> Bump Android versionCode (ERP + Ponto)"
node scripts/bump-android-version.mjs

echo "[$(date +%H:%M:%S)] ==> Build ERP (Capacitor) — npm install + build + Gradle..."
cd "$ERP_DIR"
npm install --prefer-offline --no-audit
npm run build
npx cap sync android
cd android
./gradlew assembleRelease

ERP_VERSION=$(node -e "const j=require('../../package.json'); process.stdout.write(j.version||'')")
echo "[$(date +%H:%M:%S)]     ERP APK version: $ERP_VERSION"

echo "[$(date +%H:%M:%S)] ==> Build Ponto (Capacitor) — npm install + build + Gradle..."
cd "$PONTO_DIR"
npm install --prefer-offline --no-audit
npm run build
npx cap sync android
cd android
./gradlew assembleRelease

echo "[$(date +%H:%M:%S)] ==> version.json (Android: Verificar atualização)"
mkdir -p "$ROOT_DIR/aplicativo-site/updates/android" "$ROOT_DIR/aplicativo-site/updates/ponto"
(cd "$ROOT_DIR" && node -e "
const p = require('./frontend/package.json');
const o = { version: p.version, url: 'https://aplicativo.acasamarcenaria.com.br/erp/Acasa.apk' };
require('fs').writeFileSync('./aplicativo-site/updates/android/version.json', JSON.stringify(o, null, 2));
")
(cd "$ROOT_DIR" && node -e "
const p = require('./frontend-ponto/package.json');
const o = { version: p.version, url: 'https://ponto.acasamarcenaria.com.br/ponto.apk' };
require('fs').writeFileSync('./aplicativo-site/updates/ponto/version.json', JSON.stringify(o, null, 2));
")
scp -i "$KEY_PATH" "$ROOT_DIR/aplicativo-site/updates/android/version.json" "$EC2_HOST:/home/ec2-user/version.json"
scp -i "$KEY_PATH" "$ROOT_DIR/aplicativo-site/updates/ponto/version.json" "$EC2_HOST:/home/ec2-user/version-ponto.json"

echo "[$(date +%H:%M:%S)] ==> Upload APKs"
scp -i "$KEY_PATH" "$ERP_APK_LOCAL" "$EC2_HOST:/home/ec2-user/$ERP_APK_REMOTE"
scp -i "$KEY_PATH" "$PONTO_APK_LOCAL" "$EC2_HOST:/home/ec2-user/$PONTO_APK_REMOTE"

ssh -i "$KEY_PATH" "$EC2_HOST" \
  "sudo mkdir -p $REMOTE_ERP_DIR $REMOTE_UPDATES_ANDROID $REMOTE_PONTO_DIR && \
   sudo mv /home/ec2-user/version.json $REMOTE_UPDATES_ANDROID/ && \
   sudo mv /home/ec2-user/version-ponto.json $REMOTE_PONTO_DIR/version.json && \
   sudo mv /home/ec2-user/$ERP_APK_REMOTE $REMOTE_ERP_DIR/ && \
   sudo mv /home/ec2-user/$PONTO_APK_REMOTE $REMOTE_PONTO_DIR/ && \
   sudo chown -R nginx:nginx $REMOTE_ERP_DIR $REMOTE_UPDATES_ANDROID $REMOTE_PONTO_DIR"

ELAPSED=$(($(date +%s) - START_TOTAL))
echo "[$(date +%H:%M:%S)] OK: APKs enviados em ${ELAPSED}s. ERP: https://aplicativo.acasamarcenaria.com.br/erp/Acasa.apk"
