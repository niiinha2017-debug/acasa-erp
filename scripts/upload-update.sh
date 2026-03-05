#!/usr/bin/env bash
# Upload da atualização para o Git (sem deploy na EC2).
# Padrão: push para GitLab (remote "gitlab").
# Para usar GitHub: PUSH_REMOTE=origin bash scripts/upload-update.sh
# Depois rode na EC2: bash scripts/ec2-publish.sh

set -euo pipefail

# Remote para push: gitlab (padrão) ou origin (GitHub)
PUSH_REMOTE="${PUSH_REMOTE:-gitlab}"

ROOT_DIR="${ROOT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT_DIR" || exit 1

echo "==> Bump versão (package.json + Tauri + Android versionCode)"
node "$ROOT_DIR/scripts/bump-desktop-version.mjs"

echo "==> Build frontend (Vite)"
cd "$ROOT_DIR/frontend"
npm install --prefer-offline --no-audit
npm run build

echo "==> Sync Capacitor (Android/iOS)"
npx cap sync

echo "==> version.json para atualização Android"
mkdir -p "$ROOT_DIR/aplicativo-site/updates/android"
(cd "$ROOT_DIR" && node -e "
const p = require('./frontend/package.json');
const o = { version: p.version, url: 'https://aplicativo.acasamarcenaria.com.br/erp/Acasa.apk' };
require('fs').writeFileSync('./aplicativo-site/updates/android/version.json', JSON.stringify(o, null, 2));
")
echo "    aplicativo-site/updates/android/version.json gerado."

echo "==> Git: add, commit, push"
cd "$ROOT_DIR"
git add -A
if git diff --staged --quiet; then
  echo "    Nenhuma alteração para commitar."
else
  MSG="${1:-Update: bump + build + cap sync}"
  git commit -m "$MSG"
  if git remote get-url "$PUSH_REMOTE" &>/dev/null; then
    git push "$PUSH_REMOTE" main
    echo "    Push concluído (branch: main, remote: $PUSH_REMOTE)."
  else
    echo "    ERRO: remote '$PUSH_REMOTE' não existe. Adicione com: git remote add $PUSH_REMOTE <url>"
    echo "    Exemplo GitLab: git remote add gitlab git@gitlab.com:niiinha.2017-group/niiinha.2017-project.git"
    exit 1
  fi
fi

echo ""
echo "OK: Atualização enviada para o repositório."
echo ""
echo "--- Publicar na EC2 (ir lá e rodar) ---"
echo "  ssh -i ~/.ssh/acasa_key ec2-user@54.164.55.32"
echo "  cd ~/acasa-erp && bash scripts/ec2-publish.sh"
