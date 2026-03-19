#!/usr/bin/env bash
# Sobe os serviços de infraestrutura com Podman.
# Uso:
#   bash scripts/containers-up.sh
#   bash scripts/containers-up.sh --build
#   bash scripts/containers-up.sh --logs

set -euo pipefail
cd "$(dirname "$0")/.."

PODMAN_BIN=""
if command -v podman >/dev/null 2>&1; then
  PODMAN_BIN="podman"
elif [[ -x "/c/Program Files/RedHat/Podman/podman.exe" ]]; then
  PODMAN_BIN="/c/Program Files/RedHat/Podman/podman.exe"
else
  echo "Podman não encontrado. Instale o Podman Desktop ou ajuste o PATH."
  exit 1
fi

BUILD=false
LOGS=false
for arg in "$@"; do
  case "$arg" in
    --build) BUILD=true ;;
    --logs) LOGS=true ;;
  esac
done

echo "Subindo stack com Podman compose..."
if [[ "$BUILD" == true ]]; then
  "$PODMAN_BIN" compose up -d --build
else
  "$PODMAN_BIN" compose up -d
fi

if [[ "$LOGS" == true ]]; then
  echo "Mostrando logs (CTRL+C para sair)..."
  "$PODMAN_BIN" compose logs -f
else
  echo "Stack ativa com Podman."
fi
