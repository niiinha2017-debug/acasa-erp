#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/d/Sistema ERP/acasa-erp/frontend"

cd "$PROJECT_DIR"

npm install
npm run build
npx cap sync android
npx cap open android

echo "OK: Projeto Android do ERP aberto no Android Studio."
