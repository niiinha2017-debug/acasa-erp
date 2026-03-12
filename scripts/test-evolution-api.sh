#!/usr/bin/env bash
# Testa a Evolution API no servidor (ou local).
# Uso no servidor Ubuntu:
#   cd /home/ubuntu/acasa-erp && bash scripts/test-evolution-api.sh
# Ou com variáveis na mão:
#   EVOLUTION_API_URL=http://127.0.0.1:8080 EVOLUTION_API_KEY=sua-key EVOLUTION_INSTANCE_NAME=acasa-erp bash scripts/test-evolution-api.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/backend/.env"

if [[ -z "$EVOLUTION_API_URL" || -z "$EVOLUTION_API_KEY" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    echo "Carregando backend/.env..."
    export $(grep -E '^EVOLUTION_API_URL=|^EVOLUTION_API_KEY=|^EVOLUTION_INSTANCE_NAME=' "$ENV_FILE" | xargs)
  fi
fi

EVOLUTION_API_URL="${EVOLUTION_API_URL:-}"
EVOLUTION_API_KEY="${EVOLUTION_API_KEY:-}"
INSTANCE="${EVOLUTION_INSTANCE_NAME:-acasa-erp}"
INSTANCE="${INSTANCE// /}"

if [[ -z "$EVOLUTION_API_URL" || -z "$EVOLUTION_API_KEY" ]]; then
  echo "Uso: defina EVOLUTION_API_URL e EVOLUTION_API_KEY (ou preencha em backend/.env)"
  echo "Ex.: EVOLUTION_API_URL=http://127.0.0.1:8080 EVOLUTION_API_KEY=sua-key $0"
  exit 1
fi

BASE="${EVOLUTION_API_URL%/}"
URL="${BASE}/instance/connectionState/${INSTANCE}"
echo "Testando: GET $URL"
echo "Instância: $INSTANCE"
echo ""

res=$(curl -s -w "\n%{http_code}" --max-time 10 \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Authorization: Bearer $EVOLUTION_API_KEY" \
  "$URL") || true

body=$(echo "$res" | head -n -1)
code=$(echo "$res" | tail -n 1)

echo "HTTP $code"
if command -v jq &>/dev/null; then
  echo "$body" | jq . 2>/dev/null || echo "$body"
else
  echo "$body"
fi
echo ""

if [[ "$code" == "200" ]]; then
  state=$(echo "$body" | grep -o '"state"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)".*/\1/')
  if [[ "$state" == "open" ]]; then
    echo "OK: Evolution API conectada. Instância '$INSTANCE' está conectada ao WhatsApp."
  else
    echo "Instância não está conectada (estado: ${state:-?}). Escaneie o QR Code na Evolution API."
  fi
else
  echo "Falha: verifique URL, API Key e se a instância existe."
  exit 1
fi
