#!/bin/bash
# Rode na raiz do projeto no servidor Ubuntu (ex: ~/acasa-erp).
# Cria os arquivos .env a partir dos .example para você editar com os valores reais.
set -e
RAIZ="${1:-.}"
cd "$RAIZ"

if [ -f backend/.env.example ] && [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "Criado backend/.env — edite com: nano backend/.env"
else
  [ -f backend/.env ] && echo "backend/.env já existe."
fi

if [ -f frontend/.env.production.example ] && [ ! -f frontend/.env.production ]; then
  cp frontend/.env.production.example frontend/.env.production
  echo "Criado frontend/.env.production — edite com: nano frontend/.env.production"
else
  [ -f frontend/.env.production ] && echo "frontend/.env.production já existe."
fi

if [ -f frontend-ponto/.env.production.example ] && [ ! -f frontend-ponto/.env.production ]; then
  cp frontend-ponto/.env.production.example frontend-ponto/.env.production
  echo "Criado frontend-ponto/.env.production — edite com: nano frontend-ponto/.env.production"
else
  [ -f frontend-ponto/.env.production ] && echo "frontend-ponto/.env.production já existe."
fi

echo ""
echo "Próximo passo: editar os .env com as senhas e URLs reais (DB, JWT, MAIL, etc.)."
