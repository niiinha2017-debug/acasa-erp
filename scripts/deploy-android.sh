#!/usr/bin/env bash
set -euo pipefail

KEY_PATH="/c/Users/Julyana Duarte/.ssh/acasa_key"
EC2_HOST="ec2-user@54.164.55.32"
REMOTE_ERP_DIR="/var/www/aplicativo/erp"
# Relógio de ponto será servido em um vhost/subdomínio próprio (ponto.acasamarcenaria.com.br).
# Mantemos o APK em /var/www/ponto para ficar simples no nginx.
REMOTE_PONTO_DIR="/var/www/ponto"

ROOT_DIR="/d/Sistema ERP/acasa-erp"
ERP_DIR="$ROOT_DIR/frontend"
PONTO_DIR="$ROOT_DIR/frontend-ponto"

cd "$ROOT_DIR" || exit 1

ERP_APK_LOCAL="$ERP_DIR/android/app/build/outputs/apk/release/app-release.apk"
PONTO_APK_LOCAL="$PONTO_DIR/android/app/build/outputs/apk/release/app-release.apk"

ERP_APK_REMOTE="Acasa.apk"
PONTO_APK_REMOTE="ponto.apk"

START_TOTAL=$(date +%s)
echo "[$(date +%H:%M:%S)] Início do deploy Android (ERP + Ponto)"

echo "[$(date +%H:%M:%S)] ==> Bump Android versionCode + cache buster"
python scripts/bump-android-version.py

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

echo "[$(date +%H:%M:%S)] ==> Upload APKs"
scp -i "$KEY_PATH" "$ERP_APK_LOCAL" "$EC2_HOST:/home/ec2-user/$ERP_APK_REMOTE"
scp -i "$KEY_PATH" "$PONTO_APK_LOCAL" "$EC2_HOST:/home/ec2-user/$PONTO_APK_REMOTE"

ssh -i "$KEY_PATH" "$EC2_HOST" \
  "sudo mkdir -p $REMOTE_ERP_DIR $REMOTE_PONTO_DIR && sudo mv /home/ec2-user/$ERP_APK_REMOTE $REMOTE_ERP_DIR/ && sudo mv /home/ec2-user/$PONTO_APK_REMOTE $REMOTE_PONTO_DIR/ && sudo chown -R nginx:nginx $REMOTE_ERP_DIR $REMOTE_PONTO_DIR"

ELAPSED=$(($(date +%s) - START_TOTAL))
echo "[$(date +%H:%M:%S)] OK: APKs enviados em ${ELAPSED}s. ERP: https://aplicativo.acasamarcenaria.com.br/erp/Acasa.apk"
