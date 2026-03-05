#!/usr/bin/env bash
# Rode NA EC2 (com sudo). Corrige o nginx para o frontend SPA não dar 404 em rotas como /login.
# Garante: root /var/www/aplicativo e try_files $uri $uri/ /index.html

set -euo pipefail

CONF_DIR="/etc/nginx/conf.d"
ROOT_DIR="/var/www/aplicativo"
BACKUP_SUFFIX=".bak.$(date +%Y%m%d%H%M%S)"

echo "=== Verificando configs que usam aplicativo..."
grep -l "aplicativo.acasamarcenaria\|$ROOT_DIR" "$CONF_DIR"/*.conf 2>/dev/null || true

for conf in "$CONF_DIR"/*.conf; do
  [[ -f "$conf" ]] || continue
  if grep -q "aplicativo.acasamarcenaria\|server_name.*aplicativo\|root.*aplicativo" "$conf" 2>/dev/null; then
    echo ""
    echo ">>> Ajustando: $conf"
    sudo cp -a "$conf" "${conf}${BACKUP_SUFFIX}"
    # Se não tiver try_files no location /, adicionar
    if ! grep -q "try_files.*index.html" "$conf"; then
      # Inserir try_files no bloco location / (linha após "location / {")
      sudo sed -i '/location \/ {/a\        try_files $uri $uri/ /index.html;' "$conf"
      echo "    Adicionado: try_files \$uri \$uri/ /index.html;"
    else
      echo "    try_files já existe."
    fi
    # Garantir root
    if grep -q "root " "$conf"; then
      echo "    root já definido."
    else
      echo "    AVISO: confira se tem 'root $ROOT_DIR;' no server block."
    fi
  fi
done

echo ""
echo "=== Teste do nginx"
sudo nginx -t && sudo systemctl reload nginx
echo "OK: nginx recarregado. Teste o site."
