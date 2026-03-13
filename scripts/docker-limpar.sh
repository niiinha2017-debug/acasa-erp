#!/usr/bin/env bash
# Limpa containers, redes e (opcional) volumes/imagens para liberar portas.
# Uso: bash scripts/docker-limpar.sh
# Agressivo (remove imagens/volumes não usados): bash scripts/docker-limpar.sh --agressivo

set -e
cd "$(dirname "$0")/.."

AGROSSIVO=false
[[ "${1:-}" == "--agressivo" ]] && AGROSSIVO=true

echo "Parando e removendo containers/redes do projeto..."
docker compose down -v

echo "Removendo containers parados e redes não utilizadas..."
docker container prune -f
docker network prune -f

if "$AGROSSIVO"; then
  echo "Removendo volumes e imagens não utilizados..."
  docker volume prune -f
  docker image prune -a -f
fi

echo "Limpeza concluída. Portas 3000, 3307, 5173, 5174, 8080 devem estar livres."
