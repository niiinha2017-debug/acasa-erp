#!/usr/bin/env bash
# Publica o index de download (aplicativo-site/index.html) na raiz do site na EC2.
# O site fica só com a página de download, sem Vue.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
[[ -f "$SCRIPT_DIR/deploy.env" ]] && source "$SCRIPT_DIR/deploy.env"

ROOT_DIR="${ROOT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
KEY_PATH="${KEY_PATH:-/c/Users/Julyana Duarte/.ssh/acasa_key}"
EC2_HOST="${EC2_HOST:-ec2-user@54.164.55.32}"
REMOTE_WEB_DIR="/var/www/aplicativo"
INDEX_SRC="$ROOT_DIR/aplicativo-site/index.html"

if [[ ! -f "$INDEX_SRC" ]]; then
  echo "ERRO: $INDEX_SRC nao encontrado."
  exit 1
fi

echo "==> Enviar index.html para EC2 (raiz do site)"
scp -i "$KEY_PATH" "$INDEX_SRC" "$EC2_HOST:/tmp/index-download.html"

echo "==> Colocar na raiz do site"
ssh -i "$KEY_PATH" "$EC2_HOST" "sudo cp /tmp/index-download.html $REMOTE_WEB_DIR/index.html && sudo chown nginx:nginx $REMOTE_WEB_DIR/index.html && rm -f /tmp/index-download.html"

echo "OK: Index de download publicado em $REMOTE_WEB_DIR/index.html"
