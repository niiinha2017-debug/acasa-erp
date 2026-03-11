# Evolution API (WhatsApp)

Instalação da Evolution API v2 com Redis e PostgreSQL no Ubuntu via Docker Compose.  
A v2 exige banco (PostgreSQL ou MySQL); este compose sobe PostgreSQL automaticamente.

## Pré-requisitos

- Docker e Docker Compose instalados no servidor.

## Uso

1. Entre na pasta e crie o `.env`:

   ```bash
   cd evolution-api
   cp .env.example .env
   ```

2. Edite o `.env` e defina:

   - `AUTHENTICATION_API_KEY`: chave forte (ex.: gerada com `openssl rand -hex 16`)
   - `SERVER_URL`: URL pública do servidor (ex.: `https://evolution.seudominio.com.br` ou `http://IP:8080`)

3. Suba os containers:

   ```bash
   docker compose up -d
   ```

4. Verifique os logs:

   ```bash
   docker logs evolution_api
   ```

5. A API estará em `http://localhost:8080` (ou na porta configurada). No backend do ERP use a mesma URL e a mesma `AUTHENTICATION_API_KEY` em `EVOLUTION_API_KEY`.

## Porta

A porta **8080** é exposta. Se precisar de outra, altere em `docker-compose.yml` (ex.: `"8081:8080"`).

## Redis

O Redis está incluído e é usado pela Evolution API para cache (recomendado para performance). Dados persistem no volume `redis_data`.
