#!/usr/bin/env bash
# Rode NA EC2 (com o repositório em ~/acasa-erp ou ajuste REPO_DIR).
# Cria/atualiza o vhost nginx para ponto.acasamarcenaria.com.br (evita "página padrão do nginx").
# Uso: bash scripts/corrigir-nginx-ponto-ec2.sh

set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/acasa-erp}"
CONF_SRC="$REPO_DIR/scripts/nginx-ponto.conf.example"
CONF_DEST="/etc/nginx/conf.d/ponto.conf"

if [[ ! -f "$CONF_SRC" ]]; then
  echo "Arquivo não encontrado: $CONF_SRC"
  echo "Certifique-se de estar no repositório acasa-erp ou defina REPO_DIR."
  exit 1
fi

echo "=== Aplicando config do Ponto em $CONF_DEST"
sudo cp "$CONF_SRC" "$CONF_DEST"
sudo nginx -t && sudo systemctl reload nginx
echo "OK: nginx recarregado. Teste https://ponto.acasamarcenaria.com.br"
echo "Se ainda der erro, confira: DNS A para o IP desta máquina e conteúdo em /var/www/ponto (index.html, ponto.apk, version.json)."
