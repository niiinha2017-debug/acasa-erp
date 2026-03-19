#!/usr/bin/env bash
# Limpa containers, redes e (opcional) volumes/imagens para liberar portas.
# Uso: bash scripts/docker-limpar.sh
# Agressivo (remove imagens/volumes não usados): bash scripts/docker-limpar.sh --agressivo

set -e
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

AGROSSIVO=false
[[ "${1:-}" == "--agressivo" ]] && AGROSSIVO=true

echo "Parando e removendo containers/redes do projeto com Podman..."
"$PODMAN_BIN" compose down -v

echo "Removendo containers parados e redes não utilizadas..."
"$PODMAN_BIN" container prune -f
"$PODMAN_BIN" network prune -f

if "$AGROSSIVO"; then
  echo "Removendo volumes e imagens não utilizados..."
  "$PODMAN_BIN" volume prune -f
  "$PODMAN_BIN" image prune -a -f
fi

echo "Limpeza concluída. Portas 3000, 3307, 5173, 5174, 8080 devem estar livres."
