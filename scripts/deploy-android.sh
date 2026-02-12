#!/usr/bin/env bash
set -euo pipefail

KEY_PATH="/c/Users/Julyana Duarte/.ssh/acasa_key"
EC2_HOST="ec2-user@54.164.55.32"
REMOTE_ERP_DIR="/var/www/aplicativo/erp"
REMOTE_PONTO_DIR="/var/www/ponto"

ERP_DIR="/d/Sistema ERP/acasa-erp/frontend"
PONTO_DIR="/d/Sistema ERP/acasa-erp/frontend-ponto"

ERP_APK_LOCAL="$ERP_DIR/android/app/build/outputs/apk/release/app-release.apk"
PONTO_APK_LOCAL="$PONTO_DIR/android/app/build/outputs/apk/release/app-release.apk"

ERP_APK_REMOTE="Acasa.apk"
PONTO_APK_REMOTE="ponto.apk"

echo "==> Bump Android versionCode + cache buster"
python scripts/bump-android-version.py

echo "==> Build ERP (Capacitor)"
cd "$ERP_DIR"
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleRelease

echo "==> Build Ponto (Capacitor)"
cd "$PONTO_DIR"
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleRelease

echo "==> Upload APKs"
scp -i "$KEY_PATH" "$ERP_APK_LOCAL" "$EC2_HOST:/home/ec2-user/$ERP_APK_REMOTE"
scp -i "$KEY_PATH" "$PONTO_APK_LOCAL" "$EC2_HOST:/home/ec2-user/$PONTO_APK_REMOTE"

ssh -i "$KEY_PATH" "$EC2_HOST" \
  "sudo mkdir -p $REMOTE_ERP_DIR $REMOTE_PONTO_DIR && sudo mv /home/ec2-user/$ERP_APK_REMOTE $REMOTE_ERP_DIR/ && sudo mv /home/ec2-user/$PONTO_APK_REMOTE $REMOTE_PONTO_DIR/ && sudo chown -R nginx:nginx $REMOTE_ERP_DIR $REMOTE_PONTO_DIR"

echo "OK: APKs enviados para $REMOTE_ERP_DIR e $REMOTE_PONTO_DIR"
echo "Ponto APK: https://ponto.acasamarcenaria.com.br/ponto.apk"
