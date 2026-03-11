# Varredura ponta a ponta – acasa-erp

Relatório consolidado da análise do sistema para identificar erros e falhas não óbvias.

---

## 1. Estrutura do sistema

| Parte | Tecnologia | Observação |
|-------|------------|------------|
| **Backend** | NestJS + Prisma | Prefixo global `api`, `ValidationPipe` e `HttpExceptionFilter` globais |
| **Frontend ERP** | Vue 3 + vue-router + axios | Serviços em `frontend/src/services/` |
| **Frontend Ponto** | Vue 3 + axios | PWA/Android, consome `/api/ponto` |
| **Scripts** | Bash | Deploy EC2, APK, nginx, bump de versão |
| **CI/CD** | GitHub Actions | Deploy backend, frontend web, APKs, instalador Windows |

---

## 2. Problemas identificados (por prioridade)

### Alta prioridade

#### 2.1 Rotas de financeiro com `@Body() any` (sem validação)

O `ValidationPipe` do NestJS **não** valida corpo quando o tipo é `any`. Qualquer payload malformado pode chegar ao serviço.

**Arquivos:**

- `backend/src/financeiro/contas-pagar.controller.ts`
  - `fecharMes(@Body() body: any)` (linha 139)
  - `criar(@Body() dto: any)` (linha 178)
  - `atualizar(..., @Body() dto: any)` (linha 184)
  - `pagar(..., @Body() dto: any)` (linha 191)
- `backend/src/financeiro/contas-receber.controller.ts`: `criar`, `atualizar`, `receber` com `dto: any`
- `backend/src/financeiro/fechamento.controller.ts`: `fecharMesFornecedor(@Body() body: any)`

**Ação:** Criar DTOs com `class-validator` (ex.: `FecharMesDto`, `CreateContaPagarDto`, `UpdateContaPagarDto`) e trocar `any` por esses DTOs nos controllers.

---

#### 2.2 Erros do Prisma viram 500 genérico

O `HttpExceptionFilter` captura qualquer exceção e devolve 500 com mensagem genérica em produção. Erros do Prisma (ex.: `P2025` – registro não encontrado) não são mapeados para 404/400.

**Arquivos com muitas chamadas diretas ao Prisma sem try/catch:**

- `backend/src/financeiro/financeiro.service.ts`
- `backend/src/agenda/agenda.service.ts`
- `backend/src/vendas/vendas.service.ts`
- `backend/src/contratos/contratos.service.ts`
- `backend/src/clientes/clientes.service.ts`
- `backend/src/compras/compras.service.ts`
- `backend/src/apontamento-producao/apontamento-producao.service.ts`

**Ação:** Em operações críticas (busca por id, atualização, exclusão), usar try/catch e mapear `P2025` para `NotFoundException` e outros códigos Prisma para respostas HTTP adequadas.

---

### Média prioridade

#### 2.3 Chamadas de API no frontend sem try/catch

Os serviços em `frontend/src/services/index.js` apenas repassam `api.get/post/...`. Se a página não usar try/catch (ou `.catch()`), erros de rede ou 4xx/5xx podem ficar como rejeição não tratada (sem toast ou feedback).

**Padrão seguro:** Sempre que uma página chamar um método do serviço (ex.: `ClientesService.listar()`, `FornecedorService.listar()`), envolver em try/catch e exibir `notify.error` em caso de falha.

**Recomendação:** Revisar páginas que usam esses serviços e garantir tratamento de erro + feedback ao usuário.

---

#### 2.4 Workflow: branch main vs master

Em `.github/workflows/deploy.yml`, o deploy do backend usa `git reset --hard origin/main`. Se o repositório usar apenas `master`, o reset pode falhar ou não refletir o branch correto.

**Ação:** Alinhar o workflow ao branch principal usado no repositório (ou suportar ambos).

---

#### 2.5 Permissões por rota (routePermMap)

Se `buildRoutePermMap()` ou o `routePermMap` estiver incompleto, rotas sensíveis podem ficar sem permissão exigida ou com permissão errada. Vale conferir se todas as rotas que exigem permissão estão em `routePermMap` / meta.

---

### Baixa prioridade

#### 2.6 URL de updates Tauri hardcoded

Em `frontend/src/layouts/Menu.vue`, a URL de updates do Tauri está fixa:  
`'https://aplicativo.acasamarcenaria.com.br/updates/tauri/latest.json'`.  
Se o domínio mudar, é preciso alterar no código (ou externalizar para env).

---

#### 2.7 CORS e novos domínios

Em `backend/src/main.ts`, as origens CORS estão fixas (localhost, acasamarcenaria.com.br, etc.). Staging ou novo domínio precisam ser adicionados.

---

#### 2.8 Variáveis de ambiente

Não há documentação centralizada das variáveis obrigatórias por ambiente (backend: DATABASE_URL, JWT, etc.; frontend: VITE_API_URL). Recomendação: documentar em `README` ou `docs/ENV.md` e checar em cada ambiente.

---

#### 2.9 QuickChart (gráficos)

`backend/src/analytics/quickchart.service.ts` usa `baseUrl = 'https://quickchart.io/chart'` hardcoded. Dependência externa; se o serviço cair ou mudar, gráficos que dependem dele quebram.

---

## 3. Pontos verificados e OK

- **GET /despesas/funcionarios:** Backend expõe a rota em `despesas.controller.ts` (linhas 46–67). Frontend chama via `listarComFuncionario`; integração alinhada.
- **Contas a pagar / relatório ponto / ponto app:** Endpoints usados pelo frontend existem no backend e estão consistentes.
- **Filtro global de exceção:** `HttpExceptionFilter` está ativo; exceções não tratadas viram resposta HTTP (evitando 500 sem informação no nginx).
- **Frontend-ponto:** Fluxos principais (ativar, bater ponto, carregar dados, auth) tratam erro com try/catch e mensagens ao usuário.

---

## 4. Checklist de ações sugeridas

- [x] Criar DTOs para rotas de financeiro (contas-pagar, contas-receber, fechamento) e remover `@Body() any`
- [x] Mapear erros Prisma (ex.: P2025) para 404/400 em serviços críticos (financeiro.service)
- [ ] Revisar páginas do frontend que chamam API sem try/catch e adicionar tratamento + notify
- [x] Ajustar workflow de deploy para o branch correto (main/master)
- [ ] Revisar `routePermMap` e meta das rotas sensíveis
- [ ] (Opcional) Externalizar URL de updates Tauri para env
- [ ] (Opcional) Documentar variáveis de ambiente obrigatórias
- [ ] (Opcional) Incluir origens de staging/novos domínios no CORS

---

*Gerado a partir da varredura ponta a ponta do repositório acasa-erp.*
