#!/usr/bin/env bash
# Rode NO SEU PC (não na EC2). Faz build do frontend e publica na EC2 sem buildar no servidor.
# Resolve o erro "heap out of memory" na EC2 (pouca RAM).

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
[[ -f "$SCRIPT_DIR/deploy.env" ]] && source "$SCRIPT_DIR/deploy.env"

ROOT_DIR="${ROOT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
KEY_PATH="${KEY_PATH:-/c/Users/Julyana Duarte/.ssh/acasa_key}"
EC2_HOST="${EC2_HOST:-ec2-user@54.164.55.32}"
REMOTE_WEB_DIR="${REMOTE_WEB_DIR:-/var/www/aplicativo}"

cd "$ROOT_DIR" || exit 1

echo "==> Build frontend (no seu PC)"
cd "$ROOT_DIR/frontend"
npm run build

echo "==> Enviar dist para EC2"
DIST_DIR="$ROOT_DIR/frontend/dist"
if [[ ! -d "$DIST_DIR" ]]; then
  echo "ERRO: Pasta dist nao encontrada. Rode o build antes."
  exit 1
fi
ssh -i "$KEY_PATH" "$EC2_HOST" "mkdir -p /home/ec2-user/dist-upload"
# Envia o conteúdo de dist/ (evita problema com espaços no caminho no Windows)
scp -i "$KEY_PATH" -r "$DIST_DIR/." "$EC2_HOST:/home/ec2-user/dist-upload/"

echo "==> Publicar na EC2 (rsync + nginx)"
ssh -i "$KEY_PATH" "$EC2_HOST" "sudo rsync -a --delete --exclude 'erp' --exclude 'ponto' --exclude 'downloads' /home/ec2-user/dist-upload/ $REMOTE_WEB_DIR/ && sudo chown -R nginx:nginx $REMOTE_WEB_DIR && sudo systemctl reload nginx && rm -rf /home/ec2-user/dist-upload"

echo "OK: Frontend publicado (build no PC, deploy na EC2)."
