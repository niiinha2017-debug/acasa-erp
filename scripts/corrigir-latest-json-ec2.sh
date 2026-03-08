#!/usr/bin/env bash
# Rode NA EC2 para remover BOM do latest.json (corrige "error decoding response body").
# Uso: ssh ec2-user@<IP> 'bash -s' < scripts/corrigir-latest-json-ec2.sh
#  ou: copie e execute na EC2 com sudo.

set -euo pipefail

JSON_FILE="/var/www/aplicativo/updates/tauri/latest.json"

if [ ! -f "$JSON_FILE" ]; then
  echo "Arquivo não encontrado: $JSON_FILE"
  exit 1
fi

# Verifica BOM (EF BB BF)
FIRST3=$(xxd -l 3 -p "$JSON_FILE" 2>/dev/null || true)
if [ "$FIRST3" = "efbbbf" ]; then
  echo "Removendo BOM UTF-8 do latest.json..."
  sudo sed -i '1s/^\xef\xbb\xbf//' "$JSON_FILE"
  sudo chown nginx:nginx "$JSON_FILE"
  echo "Feito. Teste: curl -sI https://aplicativo.acasamarcenaria.com.br/updates/tauri/latest.json"
else
  echo "Nenhum BOM detectado (primeiros bytes: $FIRST3). Arquivo já deve estar OK."
  echo "Se o erro persistir, confira: scripts/verificar-tauri-updater-ec2.sh"
fi
