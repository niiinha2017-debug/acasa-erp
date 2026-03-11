#!/usr/bin/env bash
# Envia o APK do Ponto para o servidor do subdomínio (ativa o download em ponto.acasamarcenaria.com.br/ponto.apk).
# Use após gerar o APK: cd frontend-ponto && npm run build && npx cap sync android && cd android && ./gradlew assembleRelease
#
# Uso: bash scripts/publicar-apk-ponto.sh
#      ou: bash scripts/publicar-apk-ponto.sh /caminho/para/outro.apk

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
[[ -f "$SCRIPT_DIR/deploy.env" ]] && source "$SCRIPT_DIR/deploy.env"

ROOT_DIR="${ROOT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
PONTO_EC2_HOST="${PONTO_EC2_HOST:-$EC2_HOST}"
REMOTE_PONTO_DIR="${REMOTE_PONTO_DIR:-/var/www/ponto}"
PONTO_REMOTE_WEB_USER="${PONTO_REMOTE_WEB_USER:-$REMOTE_WEB_USER}"
PONTO_KEY_PATH="${PONTO_KEY_PATH:-$KEY_PATH}"
APK_LOCAL="${1:-$ROOT_DIR/frontend-ponto/android/app/build/outputs/apk/release/app-release.apk}"

if [[ -z "$PONTO_EC2_HOST" ]]; then
  echo "Defina PONTO_EC2_HOST (ou EC2_HOST) em scripts/deploy.env."
  exit 1
fi

if [[ ! -f "$APK_LOCAL" ]]; then
  echo "ERRO: APK nao encontrado: $APK_LOCAL"
  echo "  Gere o APK com: cd frontend-ponto && npm run build && npx cap sync android && cd android && ./gradlew assembleRelease"
  echo "  Ou informe o caminho: bash scripts/publicar-apk-ponto.sh /caminho/para/ponto.apk"
  exit 1
fi

SSH_OPTS=()
SCP_OPTS=()
[[ -n "$PONTO_KEY_PATH" && -f "$PONTO_KEY_PATH" ]] && SSH_OPTS=(-i "$PONTO_KEY_PATH") && SCP_OPTS=(-i "$PONTO_KEY_PATH")

echo "==> Enviar ponto.apk para $PONTO_EC2_HOST"
scp "${SCP_OPTS[@]}" "$APK_LOCAL" "$PONTO_EC2_HOST:/tmp/ponto.apk"

echo "==> Colocar em $REMOTE_PONTO_DIR/ponto.apk"
ssh "${SSH_OPTS[@]}" "$PONTO_EC2_HOST" "sudo mv /tmp/ponto.apk $REMOTE_PONTO_DIR/ponto.apk && sudo chown $PONTO_REMOTE_WEB_USER:$PONTO_REMOTE_WEB_USER $REMOTE_PONTO_DIR/ponto.apk && sudo chmod 644 $REMOTE_PONTO_DIR/ponto.apk"

echo "OK: Download do APK ativo em https://ponto.acasamarcenaria.com.br/ponto.apk"
