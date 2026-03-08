#!/usr/bin/env bash
# Rode NA EC2 para diagnosticar "Tauri updater: error decoding response body".
# Uso: ssh ec2-user@<IP> 'bash -s' < scripts/verificar-tauri-updater-ec2.sh
#  ou: copie o script para a EC2 e execute lá.

set -euo pipefail

JSON_FILE="/var/www/aplicativo/updates/tauri/latest.json"
URL="https://aplicativo.acasamarcenaria.com.br/updates/tauri/latest.json"

echo "=== 1. Arquivo latest.json existe?"
if [ -f "$JSON_FILE" ]; then
  ls -la "$JSON_FILE"
  echo "Tamanho em bytes: $(stat -c%s "$JSON_FILE" 2>/dev/null || stat -f%z "$JSON_FILE" 2>/dev/null)"
else
  echo "FALTA: $JSON_FILE"
  echo "Crie o diretório e suba o arquivo pelo pipeline deploy:tauri ou scripts/deploy-tauri.sh"
  exit 1
fi

echo ""
echo "=== 2. Primeiros bytes (hex) – BOM UTF-8 = EF BB BF"
xxd -l 32 "$JSON_FILE" 2>/dev/null || hexdump -C -n 32 "$JSON_FILE" 2>/dev/null || true

echo ""
echo "=== 3. Conteúdo (primeiras linhas)"
head -20 "$JSON_FILE"

echo ""
echo "=== 4. JSON válido? (python -m json.tool)"
if command -v python3 &>/dev/null; then
  if python3 -m json.tool "$JSON_FILE" >/dev/null 2>&1; then
    echo "Sim, JSON válido."
  else
    echo "NÃO – erro ao parsear:"
    python3 -m json.tool "$JSON_FILE" 2>&1 || true
  fi
else
  echo "(python3 não disponível, pulando validação)"
fi

echo ""
echo "=== 5. Content-Type que o nginx envia para .json"
# Verifica se existe tipo application/json no nginx
if grep -r "application/json" /etc/nginx/ 2>/dev/null | head -3; then
  echo "Encontrado tipo application/json no nginx."
else
  echo "AVISO: nginx pode estar servindo .json como text/plain ou default."
  echo "Sugestão: adicionar no server do aplicativo:"
  echo '  location ~ \.json$ { add_header Content-Type "application/json; charset=utf-8"; }'
fi

echo ""
echo "=== 6. Teste com curl (o que o cliente recebe)"
curl -sI "$URL" 2>/dev/null | head -10 || echo "curl falhou (pode ser DNS/SSL/local)"

echo ""
echo "=== 7. Dono e permissões"
ls -la "$JSON_FILE"
# Se tiver BOM, sugerir correção
if [ "$(xxd -l 3 -p "$JSON_FILE" 2>/dev/null)" = "efbbbf" ]; then
  echo ""
  echo ">>> BOM UTF-8 DETECTADO (EF BB BF). O Tauri updater falha ao decodificar."
  echo "    Corrija: suba um latest.json gerado sem BOM (pipeline já usa UTF-8 sem BOM)."
  echo "    Para corrigir agora na EC2 (remove BOM):"
  echo "    sudo sed -i '1s/^\xef\xbb\xbf//' $JSON_FILE"
fi
