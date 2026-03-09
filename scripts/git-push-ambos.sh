#!/bin/bash
# Envia a branch atual para GitLab (origin) e GitHub.
# Uso: ./scripts/git-push-ambos.sh   ou   bash scripts/git-push-ambos.sh
set -e
BRANCH=$(git branch --show-current)
echo "Enviando branch '$BRANCH' para GitLab e GitHub..."
git push origin "$BRANCH"
git push github "$BRANCH"
echo "Concluído: GitLab e GitHub atualizados."
