# Varredura de arquivos redundantes – acasa-erp

Relatório de arquivos que não têm necessidade de existir ou são redundantes com o resto do projeto.

---

## 1. Arquivos removidos (redundantes)

| Arquivo | Motivo |
|---------|--------|
| `backend/README.md` | README padrão do template NestJS; não descreve o projeto acasa-erp. |
| `frontend/README.md` | README padrão do template Vue 3 + Vite (poucas linhas); não descreve o frontend do projeto. |
| `backend/migrations-manual.sql` | Migration manual usuario–funcionario (fev/2026). Já coberta pela migration Prisma `20260208234153_add_funcionario_id_to_usuarios`. |
| `.gitlab-ci.yml` | Pipeline GitLab; o deploy atual é feito pelo **GitHub Actions** (`.github/workflows/deploy.yml`). Duplicidade de CI. |
| `scripts/GITLAB-ONLY.md` | Documentação “usar só GitLab”; o CI em uso é o GitHub. Mantida referência em `scripts/CHAVES.md` se precisar de GitLab no futuro. |

---

## 2. Arquivos mantidos (não redundantes)

- **Vários `.env.example` / `.env.production.example`**  
  Cada um é por contexto (backend, frontend, frontend-ponto, scripts/deploy). Dev vs produção são propósitos diferentes.

- **`scripts/nginx-ponto.conf.example` e `scripts/nginx-aplicativo.conf.example`**  
  Dois vhosts diferentes (ponto vs aplicativo).

- **`aplicativo-site/updates/android/version.json` e `aplicativo-site/updates/ponto/version.json`**  
  O CI gera e envia esses arquivos para o servidor a cada deploy. Os versionados no repo servem de referência/local; opcionalmente podem ser gerados só no CI e colocados no `.gitignore` se quiser evitar commit de artefato.

- **Scripts `corrigir-*` e `verificar-*`**  
  Cada um tem função específica (nginx SPA, nginx ponto, latest.json, Tauri). Úteis para manutenção.

---

## 3. Sugestões opcioniais

- **README na raiz**  
  Não existe. Pode ser útil um `README.md` na raiz explicando o monorepo (backend, frontend, frontend-ponto, scripts, CI).

- **`docs/`**  
  Só há `VARREDURA-PONTA-A-PONTA.md` e este arquivo. Estrutura ok; pode ir adicionando documentação aqui.

- **Versões dos `version.json`**  
  Se quiser que apenas o CI “dono” da versão seja o repositório, pode adicionar `aplicativo-site/updates/` ao `.gitignore` e gerar esses JSON só no pipeline.

---

*Varredura feita em mar/2026.*
