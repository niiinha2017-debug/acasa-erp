#!/usr/bin/env bash
# Publica a página de ativação (código de ativação) do Ponto em ponto.acasamarcenaria.com.br.
# Envia aplicativo-site/index-ponto.html para /var/www/ponto/index.html na EC2.
# Use quando o site do ponto der 404 ou não mostrar a tela de ativação.
#
# Uso (no PC, com repositório e SSH configurado):
#   bash scripts/publicar-landing-ponto.sh

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
[[ -f "$SCRIPT_DIR/deploy.env" ]] && source "$SCRIPT_DIR/deploy.env"

ROOT_DIR="${ROOT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
KEY_PATH="${KEY_PATH:-}"
# Servidor que responde por ponto.acasamarcenaria.com.br (se diferente de EC2_HOST)
EC2_HOST="${EC2_HOST:-}"
PONTO_EC2_HOST="${PONTO_EC2_HOST:-$EC2_HOST}"
REMOTE_PONTO_DIR="${REMOTE_PONTO_DIR:-/var/www/ponto}"
# Amazon Linux usa nginx; Ubuntu usa www-data
REMOTE_WEB_USER="${REMOTE_WEB_USER:-www-data}"
PONTO_REMOTE_WEB_USER="${PONTO_REMOTE_WEB_USER:-$REMOTE_WEB_USER}"
INDEX_PONTO_SRC="$ROOT_DIR/aplicativo-site/index-ponto.html"

if [[ ! -f "$INDEX_PONTO_SRC" ]]; then
  echo "ERRO: $INDEX_PONTO_SRC nao encontrado."
  exit 1
fi

if [[ -z "$PONTO_EC2_HOST" ]]; then
  echo "Defina EC2_HOST ou PONTO_EC2_HOST (ex: ubuntu@ip-172-26-9-125) em scripts/deploy.env."
  exit 1
fi

SCP_OPTS=()
SSH_OPTS=()
# Chave para o servidor do Ponto (Ubuntu): use PONTO_KEY_PATH se for diferente de KEY_PATH
PONTO_KEY_PATH="${PONTO_KEY_PATH:-$KEY_PATH}"
if [[ -n "$PONTO_KEY_PATH" && -f "$PONTO_KEY_PATH" ]]; then
  SCP_OPTS=(-i "$PONTO_KEY_PATH")
  SSH_OPTS=(-i "$PONTO_KEY_PATH")
fi

echo "==> Enviar pagina de ativacao do Ponto para $PONTO_EC2_HOST"
scp "${SCP_OPTS[@]}" "$INDEX_PONTO_SRC" "$PONTO_EC2_HOST:/tmp/index-ponto.html"

echo "==> Colocar em $REMOTE_PONTO_DIR/index.html (pagina de codigo de ativacao)"
ssh "${SSH_OPTS[@]}" "$PONTO_EC2_HOST" "sudo mkdir -p $REMOTE_PONTO_DIR && sudo mv /tmp/index-ponto.html $REMOTE_PONTO_DIR/index.html && sudo chown -R $PONTO_REMOTE_WEB_USER:$PONTO_REMOTE_WEB_USER $REMOTE_PONTO_DIR && sudo chmod 644 $REMOTE_PONTO_DIR/index.html && rm -f /tmp/index-ponto.html"

echo "OK: Pagina de ativacao (codigo de ativacao) publicada em ponto.acasamarcenaria.com.br"
echo "    Confira: https://ponto.acasamarcenaria.com.br"
