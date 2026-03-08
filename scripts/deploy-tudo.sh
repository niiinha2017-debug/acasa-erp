#!/usr/bin/env bash
# Uso: bash scripts/deploy-tudo.sh [mensagem de commit]
#
# Faz em um comando só:
#  1. Bump da versão (tauri + frontend + Android versionCode) — a menos que SKIP_BUMP=1
#  2. git add, commit, push → dispara o pipeline (Android + EC2 + site/backend)
#  3. Na sua máquina Windows: build e deploy do Tauri para a EC2
#
# Assim o push já atualiza Android, site e backend na nuvem; o instalador .exe
# é gerado e publicado na sua máquina (o pipeline não tem runner Windows).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="${ROOT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
cd "$ROOT_DIR"

COMMIT_MSG="${1:-}"

# 1) Bump de versão (uma única fonte para todos os artefatos)
if [[ -z "${SKIP_BUMP:-}" ]]; then
  echo "==> Bump versão (Desktop + Android versionCode)"
  node scripts/bump-desktop-version.mjs
  VERSION=$(node -p "require('./frontend/package.json').version")
  [[ -z "$COMMIT_MSG" ]] && COMMIT_MSG="release v$VERSION"
else
  VERSION=$(node -p "require('./frontend/package.json').version")
  [[ -z "$COMMIT_MSG" ]] && COMMIT_MSG="chore: deploy"
fi

# 2) Commit e push (dispara o pipeline)
echo "==> git add / commit / push"
git add -A
if git diff --staged --quiet 2>/dev/null; then
  echo "Nenhuma alteração para commit. Pulando push."
else
  git commit -m "$COMMIT_MSG"
  git push
  echo "Push concluído. Pipeline em andamento (Android + EC2 + site/backend)."
fi

# 3) Deploy Tauri na sua máquina (Windows) — o pipeline não tem runner Windows
RUN_TAURI="${RUN_TAURI:-auto}"
if [[ "$RUN_TAURI" == "1" ]] || [[ "$RUN_TAURI" == "true" ]] || [[ "$RUN_TAURI" == "yes" ]]; then
  run_tauri=1
elif [[ "$RUN_TAURI" == "0" ]] || [[ "$RUN_TAURI" == "false" ]] || [[ "$RUN_TAURI" == "no" ]]; then
  run_tauri=0
else
  # auto: tenta detectar Windows (Git Bash, WSL não conta)
  run_tauri=0
  [[ -n "${MSYSTEM:-}" ]] && run_tauri=1
  [[ "${OS:-}" == "Windows_NT" ]] && run_tauri=1
  case "$(uname -s 2>/dev/null)" in
    MINGW*|MSYS*|CYGWIN*) run_tauri=1 ;;
  esac
fi
if [[ "$run_tauri" -eq 1 ]]; then
  echo "==> Deploy Tauri (Desktop) para EC2 nesta máquina"
  SKIP_BUMP=1 bash "$ROOT_DIR/scripts/deploy-tauri.sh"
  echo "OK: Tudo atualizado (push + pipeline + Tauri)."
else
  echo "==> Para publicar o instalador .exe, rode no Windows: SKIP_BUMP=1 bash scripts/deploy-tauri.sh"
  echo "    (ou use RUN_TAURI=1 para forçar deploy Tauri aqui)"
  echo "OK: Push feito; pipeline atualiza Android, site e backend."
fi
