#!/usr/bin/env bash
# Rode NA EC2 para diagnosticar 404 do aplicativo.
# Uso: bash scripts/verificar-nginx-ec2.sh

set -euo pipefail

echo "=== 1. index.html existe?"
ls -la /var/www/aplicativo/index.html 2>/dev/null || echo "FALTA: /var/www/aplicativo/index.html"

echo ""
echo "=== 2. Conteúdo do index (primeiras linhas)"
head -3 /var/www/aplicativo/index.html 2>/dev/null || true

echo ""
echo "=== 3. Nginx: server_name e root para aplicativo"
sudo grep -E "server_name|root " /etc/nginx/nginx.conf /etc/nginx/conf.d/*.conf 2>/dev/null | grep -v "#" || true

echo ""
echo "=== 4. Location / no server do aplicativo?"
sudo grep -A2 "location /" /etc/nginx/conf.d/*.conf 2>/dev/null || true

echo ""
echo "=== 5. Arquivos em /var/www/aplicativo"
ls /var/www/aplicativo/ | head -20
