#!/usr/bin/env bash
# EC2: APENAS LISTA - NÃO APAGA NADA.
# Mostra tamanhos e conteúdo para você decidir o que limpar manualmente.
# Uso: bash scripts/clean-ec2.sh

set -euo pipefail

KEY_PATH="${KEY_PATH:-/c/Users/Julyana Duarte/.ssh/acasa_key}"
EC2_HOST="${EC2_HOST:-ec2-user@54.164.55.32}"

echo "==> Conectando na EC2 (só listagem, nada é apagado)..."
ssh -i "$KEY_PATH" "$EC2_HOST" "
set -euo pipefail

echo ''
echo '========== DISCO =========='
df -h /
echo ''

echo '========== [1] ~/.pm2/logs =========='
du -sh ~/.pm2/logs 2>/dev/null || true
ls -lah ~/.pm2/logs 2>/dev/null || true
echo ''

echo '========== [2] Cache npm =========='
du -sh ~/.npm 2>/dev/null || true
echo ''

echo '========== [3] ~/acasa-erp/backend/node_modules/.cache =========='
du -sh ~/acasa-erp/backend/node_modules/.cache 2>/dev/null || echo '  (não existe)'
echo ''

echo '========== [4] /tmp =========='
sudo du -sh /tmp 2>/dev/null || true
sudo ls -lah /tmp 2>/dev/null || true
echo ''

echo '========== [5] Journal (systemd) =========='
sudo du -sh /var/log/journal 2>/dev/null || true
echo ''

echo '========== [6] Home ~/ - tamanho das pastas =========='
for d in ~/.cache ~/.npm ~/.pm2 ~/.nvm ~/acasa-erp ~/acasa-analytics ~/acasa-data ~/backups ~/backups-extra ~/backups-historico ~/upload-aplicativo ~/venv-ponto ~/scripts; do
  [ -d \"\$d\" ] && echo -n \"  \" && du -sh \"\$d\" 2>/dev/null || true
done
echo ''

echo '========== [7] Arquivos soltos na home =========='
ls -la ~/*.html ~/*.json ~/*.exe ~/*.log ~/package-lock.json 2>/dev/null || true
echo ''

echo '========== [8] Pastas do projeto (acasa-erp, nginx) =========='
for d in ~/acasa-erp ~/acasa-erp/backend ~/acasa-erp/frontend /var/www/aplicativo /var/www/ponto; do
  [ -d \"\$d\" ] && echo -n \"  \" && du -sh \"\$d\" 2>/dev/null || true
done
echo ''

echo '========== FIM (nada foi apagado) =========='
"
