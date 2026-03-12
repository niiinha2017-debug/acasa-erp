# Configuração Docker - ACASA ERP

Guia rápido para usar Docker com o projeto (MySQL + Evolution API para WhatsApp).

## Pré-requisitos

- **Docker Desktop** instalado e **em execução** (ícone na bandeja do sistema).
- No Windows: se usar WSL2, ative a integração no Docker Desktop (Settings > Resources > WSL Integration).

## 0. Variáveis para Evolution API (WhatsApp)

O container da Evolution API precisa da **API Key**. Use a **mesma** que está no `backend/.env` em `EVOLUTION_API_KEY`.

**Opção A** – Criar `.env` na raiz do projeto (pasta `acasa-erp`):

```bash
# Conteúdo mínimo (use a mesma chave do backend/.env):
EVOLUTION_API_KEY=15215bde60b7f098918f740b1abe0423
EVOLUTION_SERVER_URL=http://localhost:8080
```

**Opção B** – Copiar o exemplo e editar:

```bash
cp docker.env.example .env
# Edite .env e coloque sua EVOLUTION_API_KEY (igual à do backend/.env).
```

## 1. Subir MySQL + Evolution API (WhatsApp)

Na pasta do projeto (`acasa-erp`):

```bash
docker-compose up -d
```

Isso sobe:

- **MySQL** (acasa-erp-mysql) na porta **3307**
- **Evolution API** (acasa-erp-evolution-api) na porta **8080**
- **PostgreSQL** e **Redis** usados apenas pela Evolution API (sem porta exposta)

**Importante:** no `backend/.env` use `DB_PORT=3307` e `EVOLUTION_API_URL=http://127.0.0.1:8080` com a mesma `EVOLUTION_API_KEY` que você colocou no `.env` da raiz (ou em `docker.env`).

## 2. Verificar se está rodando

```bash
docker ps
```

Deve aparecer os containers **mysql**, **evolution-api**, **evolution-postgres** e **evolution-redis** (portas 3307 e 8080 em uso).

## 3. Aplicar migrações do Prisma

Com o MySQL já no ar:

```bash
cd backend
npm run db:atualizacao
# ou, se precisar rodar o seed também:
npm run db:deploy
```

## 4. Backend e frontend

- **Backend**: rode na sua máquina como sempre (`npm run start:dev` no `backend`). Com Docker, o `.env` deve usar `DB_PORT=3307` e `DATABASE_URL` com `:3307` (veja seção abaixo).
- **Frontend**: rode normalmente (ex.: `npm run dev` no `frontend`).

## Comandos úteis

| Ação              | Comando                    |
|-------------------|----------------------------|
| Parar os containers | `docker-compose down`    |
| Parar e apagar dados | `docker-compose down -v` |
| Ver logs do MySQL | `docker-compose logs -f mysql` |
| Ver logs do WhatsApp (Evolution) | `docker-compose logs -f evolution-api` |
| Entrar no MySQL   | `docker exec -it acasa-erp-mysql mysql -u acasa_user -p acasa_erp` (senha: do .env) |

## Usar MySQL do Docker (porta 3307)

O `docker-compose` já está configurado para usar a porta **3307** (evita conflito com MySQL instalado na máquina). No `backend/.env` use:

```
DB_HOST=127.0.0.1
DB_PORT=3307
DATABASE_URL="mysql://acasa_user:gmgt33APCS%21@127.0.0.1:3307/acasa_erp"
```

(Os outros campos podem permanecer iguais.)

Se quiser usar a porta 3306 no Docker (e não tiver MySQL local), altere no `docker-compose.yml` para `"3306:3306"` e no `.env` use `DB_PORT=3306` e `:3306` na `DATABASE_URL`.

## WhatsApp (Evolution API) – como criar e conectar

1. **Backend e frontend rodando** (MySQL e Evolution API já no Docker).
2. No ERP, vá em **Configurações** (menu) e abra a aba **Contato**.
3. Preencha:
   - **Evolution API – URL:** `http://127.0.0.1:8080`
   - **Evolution API – Chave (API Key):** a mesma do `backend/.env` (e do `.env` da raiz do projeto)
   - **Evolution API – Nome da instância:** `acasa-erp` (ou outro nome, em minúsculas)
4. Clique em **Salvar** (para gravar as configurações da empresa).
5. Clique em **Conectar meu WhatsApp (QR)**.  
   O sistema **cria a instância** na Evolution API (se ainda não existir) e abre um modal com o **QR Code** (ou código de vinculação).
6. No celular: **WhatsApp → Ajustes → Aparelhos conectados → Conectar um aparelho** e escaneie o QR ou use o código de vinculação.
7. Quando conectar, o estado da instância fica **open**. Use **Testar Evolution API** para conferir.

Logs da Evolution: `docker-compose logs -f evolution-api`.

## Resumo

1. Docker Desktop aberto.
2. Criar `.env` na raiz com `EVOLUTION_API_KEY` (mesma do `backend/.env`).
3. `docker-compose up -d` na pasta `acasa-erp`.
4. `cd backend` e `npm run db:atualizacao` (ou `db:deploy`).
5. Subir backend e frontend normalmente.

MySQL: porta 3307, usuário `acasa_user`, banco `acasa_erp`. Evolution API: porta 8080.
