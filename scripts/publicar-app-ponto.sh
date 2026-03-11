#!/usr/bin/env bash
# Faz build do frontend-ponto (Vue SPA) e publica no subdomínio (receptor do convite).
# Assim ponto.acasamarcenaria.com.br/ativar?code=XXX abre o app que ativa o dispositivo.
#
# Pré-requisitos: PONTO_EC2_HOST e (se outro servidor) PONTO_KEY_PATH em scripts/deploy.env
# Uso: bash scripts/publicar-app-ponto.sh

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
[[ -f "$SCRIPT_DIR/deploy.env" ]] && source "$SCRIPT_DIR/deploy.env"

ROOT_DIR="${ROOT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
PONTO_EC2_HOST="${PONTO_EC2_HOST:-$EC2_HOST}"
REMOTE_PONTO_DIR="${REMOTE_PONTO_DIR:-/var/www/ponto}"
PONTO_REMOTE_WEB_USER="${PONTO_REMOTE_WEB_USER:-$REMOTE_WEB_USER}"
PONTO_KEY_PATH="${PONTO_KEY_PATH:-$KEY_PATH}"
FRONTEND_PONTO="$ROOT_DIR/frontend-ponto"
DIST_DIR="$FRONTEND_PONTO/dist"

if [[ -z "$PONTO_EC2_HOST" ]]; then
  echo "Defina PONTO_EC2_HOST (ou EC2_HOST) em scripts/deploy.env."
  exit 1
fi

SSH_OPTS=()
[[ -n "$PONTO_KEY_PATH" && -f "$PONTO_KEY_PATH" ]] && SSH_OPTS=(-i "$PONTO_KEY_PATH")

# Testa SSH antes do deploy (evita Broken pipe do tar quando a chave falha)
if ! ssh "${SSH_OPTS[@]}" -o ConnectTimeout=10 -o BatchMode=yes "$PONTO_EC2_HOST" "true" 2>/dev/null; then
  echo ""
  echo "ERRO: Nao foi possivel conectar em $PONTO_EC2_HOST (Permission denied = chave nao autorizada no servidor)."
  echo "  Opcao 1: No servidor Ubuntu, adicione a chave publica. No seu PC rode: cat \"\${KEY_PATH}.pub\" ou \"\${PONTO_KEY_PATH}.pub\""
  echo "          Depois no Ubuntu: mkdir -p ~/.ssh && echo 'COLE_A_CHAVE_AQUI' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
  echo "  Opcao 2: Use o mesmo servidor do ERP: em deploy.env comente PONTO_EC2_HOST e aponte o DNS de ponto para o IP do EC2 (54.164.55.32)."
  exit 1
fi

echo "==> Build do app Ponto (frontend-ponto)"
cd "$FRONTEND_PONTO"
if [[ ! -f package.json ]]; then
  echo "ERRO: $FRONTEND_PONTO nao encontrado."
  exit 1
fi
npm ci --no-audit --no-fund 2>/dev/null || true
npm run build
cd "$ROOT_DIR"

if [[ ! -d "$DIST_DIR" ]] || [[ ! -f "$DIST_DIR/index.html" ]]; then
  echo "ERRO: Build nao gerou $DIST_DIR/index.html"
  exit 1
fi

echo "==> Enviar app para $PONTO_EC2_HOST (receptor do convite em /ativar)"
# Envia conteúdo do dist; no servidor preservamos ponto.apk e version.json
if command -v rsync >/dev/null 2>&1; then
  rsync -avz --delete \
    -e "ssh ${SSH_OPTS[*]}" \
    "$DIST_DIR/" \
    "$PONTO_EC2_HOST:/tmp/ponto-app/"
else
  (cd "$DIST_DIR" && tar czf - .) | ssh "${SSH_OPTS[@]}" "$PONTO_EC2_HOST" "mkdir -p /tmp/ponto-app && tar xzf - -C /tmp/ponto-app"
fi

echo "==> Aplicar no servidor ($REMOTE_PONTO_DIR) preservando ponto.apk e version.json"
ssh "${SSH_OPTS[@]}" "$PONTO_EC2_HOST" "set -e
  sudo mkdir -p $REMOTE_PONTO_DIR
  for f in ponto.apk version.json; do
    if [ -f $REMOTE_PONTO_DIR/\$f ]; then
      sudo cp -a $REMOTE_PONTO_DIR/\$f /tmp/\$f.bak 2>/dev/null || true
    fi
  done
  sudo rsync -a /tmp/ponto-app/ $REMOTE_PONTO_DIR/
  for f in ponto.apk version.json; do
    if [ -f /tmp/\$f.bak ]; then
      sudo mv /tmp/\$f.bak $REMOTE_PONTO_DIR/\$f
    fi
  done
  sudo chown -R $PONTO_REMOTE_WEB_USER:$PONTO_REMOTE_WEB_USER $REMOTE_PONTO_DIR
  sudo chmod -R a+r $REMOTE_PONTO_DIR
  rm -rf /tmp/ponto-app
"

echo "OK: App Ponto (receptor do convite) publicado em ponto.acasamarcenaria.com.br"
echo "    Teste: https://ponto.acasamarcenaria.com.br/ativar?code=SEU_CODIGO"
