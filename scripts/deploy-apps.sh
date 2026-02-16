#!/usr/bin/env bash
set -euo pipefail

# Atualiza apenas os apps:
# - ERP Android + Ponto Android
# - Desktop (Tauri)
#
# Não mexe em ERP Web (frontend em acasamarcenaria.com.br).

ROOT_DIR="/d/Sistema ERP/acasa-erp"
cd "$ROOT_DIR" || exit 1

echo "==> Atualizando APKs (ERP + Ponto)"
bash "$ROOT_DIR/scripts/deploy-android.sh"

echo "==> Atualizando Desktop (Tauri)"
bash "$ROOT_DIR/scripts/deploy-tauri.sh"

echo "OK: Android (ERP + Ponto) + Desktop (Tauri) atualizados."

