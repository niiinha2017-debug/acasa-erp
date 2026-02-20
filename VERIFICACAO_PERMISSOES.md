# Verificação: Permissões Backend × Frontend × Seed

## Resumo

- **Backend**: usa `@Permissoes('chave')` nos controllers e `PermissionsGuard`; todas as chaves usadas nos controllers **estão no seed**. **`is_admin` libera tudo** (o guard retorna `true` antes de checar a lista de permissões).
- **Frontend**: usa `can('chave')` e `definePage({ meta: { perm: 'chave' } })`; as chaves usadas **batem com o seed**. **`is_admin` libera tudo** (em `can()`, se `user?.is_admin` retorna `true` para qualquer permissão).
- **Seed**: contém **todas** as permissões usadas no backend e no frontend, além de chaves **não usadas** (obras, projetos) que podem ser legado ou uso futuro.

---

## 1. Permissões no seed (`backend/prisma/seed.ts`)

O seed cria e vincula ao admin as seguintes chaves:

| Módulo | Chaves |
|--------|--------|
| Geral | `ADMIN`, `index.visualizar`, `dashboard.visualizar`, `pendente.visualizar`, `alterar-senha` |
| Config | `usuarios.*`, `permissoes.ver`, `permissoes.gerenciar`, `configuracoes.empresa.*`, `arquivos.*` |
| Ponto | `ponto_relatorio.ver/editar`, `ponto_convite.criar`, `ponto_convite.excluir` |
| Agenda | `agendamentos.ver/criar/editar/excluir`, `agendamentos.vendas`, `agendamentos.producao` |
| Comercial | `vendas.*`, `orcamentos.*`, `contratos.*` |
| Produção | `producao.*`, `plano_corte.*` (incl. `plano_corte.enviar_producao`) |
| Cadastros | `clientes.*`, `fornecedores.*`, `produtos.*`, `funcionarios.*` |
| Financeiro | `fechamento_fornecedor.criar`, `contas_pagar.*`, `contas_receber.*`, `despesas.*`, `compras.*` |
| Legado/futuro | `obras.ver/criar/editar`, `projetos.ver/criar/editar/excluir` |

---

## 2. Backend – Controllers e chaves usadas

Todos os controllers que usam `@Permissoes(...)` utilizam **apenas chaves que existem no seed**:

- **analytics**: `dashboard.visualizar`, `orcamentos.ver`, `vendas.criar`, `contratos.ver`, `vendas.ver`, `plano_corte.ver`
- **agenda**: `agendamentos.criar`, `agendamentos.ver`, `agendamentos.editar`, `agendamentos.excluir`
- **arquivos**: `arquivos.ver`, `arquivos.criar`, `arquivos.excluir`
- **auth**: `usuarios.editar`
- **clientes**: `clientes.*`, `clientes.select`
- **clausulas**: `orcamentos.editar`
- **compras**: `compras.*`
- **contratos**: `contratos.*`
- **contas-pagar**: `contas_pagar.*`
- **contas-receber**: `contas_receber.*`
- **despesas**: `despesas.*`
- **empresa**: `configuracoes.empresa.ver`, `configuracoes.empresa.editar`
- **fechamento**: `fechamento_fornecedor.criar`
- **funcionarios**: `funcionarios.ver`, `funcionarios.select`, `funcionarios.criar/editar/excluir`
- **fornecedores**: `fornecedores.*`
- **orcamentos**: `orcamentos.*`
- **permissoes**: `permissoes.ver`, `permissoes.gerenciar`
- **ponto-admin**: `ponto_convite.criar` (apenas criar convite; **não há endpoint de excluir convite** no backend)
- **ponto-relatorio**: `ponto_relatorio.ver`
- **ponto-registros / justificativas**: `ponto_relatorio.editar`, `ponto_relatorio.ver`
- **plano-corte**: `plano_corte.*`
- **produtos**: `produtos.*`
- **usuarios**: `usuarios.*`
- **vendas**: `vendas.*`
- **utils**: `GET /utils/cnpj/:cnpj` exige **uma de**: `clientes.ver`, `fornecedores.ver`, `configuracoes.empresa.ver` (qualquer uma libera; `is_admin` libera tudo).
- **mail**: `GET /mail/teste` exige `usuarios.ver` (e `MAIL_TEST_ENABLED=true`).

**Rotas sem guard (intencional)**: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/cadastro`, `POST /auth/esqueci-senha`, `POST /auth/alterar-senha`, `GET /auth/me`, `POST /auth/logout` (auth usa guards por rota). Ponto-app usa `PontoAuthGuard` (fluxo próprio).

**Conclusão backend**: Implementado e alinhado ao seed. `is_admin` no backend libera todas as rotas protegidas. A única chave do seed não usada no backend é `ponto_convite.excluir` (não existe rota de exclusão de convite).

---

## 3. Frontend – Páginas e meta.perm

Todas as páginas que definem `definePage({ meta: { perm: '...' } })` usam chaves que **existem no seed**:

| Rota / Página | meta.perm |
|----------------|-----------|
| `/agendamentos` | `agendamentos.ver` |
| `/alterar-senha` | `alterar-senha` |
| `/arquivos/[id]`, `/arquivos/pdf/[id]` | `arquivos.ver` |
| `/clientes`, `/clientes/[id]` | `clientes.ver` |
| `/comercial` | `orcamentos.ver` |
| `/compras`, `/compras/[id]` | `compras.ver` |
| `/configuracoes/configuracoes` | `configuracoes.empresa.ver` |
| `/configuracoes/permissoes` | `permissoes.ver` |
| `/configuracoes/usuarios` | `usuarios.ver` |
| `/contratos`, `/contratos/[id]`, `/contratos/cliente/[id]`, `/contratos/clausulas` | `contratos.ver` ou `orcamentos.editar` |
| `/despesas`, `/despesas/[id]` | `despesas.ver` |
| `/financeiro/contas-pagar` | `contas_pagar.ver` |
| `/financeiro/contas-receber` | `contas_receber.ver` |
| `/fornecedor`, `/fornecedor/[id]` | `fornecedores.ver` |
| `/funcionarios`, `/funcionarios/[id]` | `funcionarios.ver` |
| `/orcamentos/*`, `/orcamentos/processo` | `orcamentos.ver` |
| `/plano-corte/*`, `/plano-corte/kanban` | `plano_corte.ver` ou `plano_corte.criar` |
| `/producao` | `vendas.ver` |
| `/produtos`, `/produtos/[id]` | `produtos.ver` |
| `/relatorios/*` | `dashboard.visualizar` |
| `/rh/ponto/relatorio`, `/rh/ponto/fechamento` | `ponto_relatorio.ver` |
| `/rh/ponto/convites` | `ponto_convite.criar` |
| `/vendas/*`, `/vendas/kanban`, fechamento, nova-venda | `vendas.ver` ou `vendas.criar` ou `vendas.editar` |
| `/` (index/redirect) | `index.visualizar` |
| `/debug/update` | `dashboard.visualizar` |

**Páginas sem meta.perm** (intencional): `/login` (pública), `/pendente` (primeiro acesso / troca de senha; só usuário logado não-ATIVO).

**Router**: Se o usuário não tem a permissão da rota, redireciona: `agendamentos.ver` → `/agendamentos`; senão `index.visualizar` → `/`; senão `/alterar-senha`. **`is_admin` no frontend libera todas as rotas** (can() retorna true).

**Conclusão frontend**: Todas as rotas internas mapeadas com meta.perm. is_admin libera tudo.

---

## 4. Menu (frontend e backend)

- **Frontend**: `frontend/src/services/navigation.js` (NAV_SCHEMA) e menu filtrado por `can(item.perm)`.
- **Backend**: `backend/src/permissoes/menu.schema.ts` (MENU_SECTIONS) usado pelo endpoint de menu.

Os itens do menu usam as mesmas chaves do seed; não há chave de menu fora do seed.

---

## 5. Mapeamento completo de rotas (frontend)

Para garantir que **páginas e rotas novas** estejam cobertas, conferir que toda rota de página tenha `definePage({ meta: { perm: '...' } })` exceto login e pendente:

| Rota | meta.perm |
|------|-----------|
| `/` | `index.visualizar` |
| `/login` | (pública) |
| `/pendente` | (sem perm; primeiro acesso) |
| `/alterar-senha` | `alterar-senha` |
| `/agendamentos` | `agendamentos.ver` |
| `/comercial` | `orcamentos.ver` |
| `/producao` | `vendas.ver` |
| `/orcamentos` | `orcamentos.ver` |
| `/orcamentos/lista` | `orcamentos.ver` |
| `/orcamentos/processo` | `orcamentos.ver` |
| `/orcamentos/cliente/[id]` | `orcamentos.ver` |
| `/orcamentos/[id]` | `orcamentos.ver` |
| `/vendas` | `vendas.ver` |
| `/vendas/fechamento` | `vendas.criar` |
| `/vendas/nova-venda` | `vendas.criar` |
| `/vendas/kanban` | `vendas.ver` |
| `/vendas/cliente/[id]` | `vendas.criar` |
| `/vendas/venda/[id]` | `vendas.criar` |
| `/vendas/venda/[id]/editar` | `vendas.editar` |
| `/vendas/[id]` | `vendas.ver` |
| `/contratos` | `contratos.ver` |
| `/contratos/[id]` | `contratos.ver` |
| `/contratos/cliente/[id]` | `contratos.ver` |
| `/contratos/clausulas` | `orcamentos.editar` |
| `/plano-corte` | `plano_corte.ver` |
| `/plano-corte/kanban` | `plano_corte.ver` |
| `/plano-corte/venda` | `plano_corte.criar` |
| `/plano-corte/itens` | `plano_corte.ver` |
| `/plano-corte/itens/[id]` | `plano_corte.ver` |
| `/plano-corte/[id]` | `plano_corte.ver` |
| `/clientes` | `clientes.ver` |
| `/clientes/[id]` | `clientes.ver` |
| `/fornecedor` | `fornecedores.ver` |
| `/fornecedor/[id]` | `fornecedores.ver` |
| `/produtos` | `produtos.ver` |
| `/produtos/[id]` | `produtos.ver` |
| `/compras` | `compras.ver` |
| `/compras/[id]` | `compras.ver` |
| `/despesas` | `despesas.ver` |
| `/despesas/[id]` | `despesas.ver` |
| `/financeiro/contas-pagar` | `contas_pagar.ver` |
| `/financeiro/contas-receber` | `contas_receber.ver` |
| `/funcionarios` | `funcionarios.ver` |
| `/funcionarios/[id]` | `funcionarios.ver` |
| `/configuracoes/usuarios` | `usuarios.ver` |
| `/configuracoes/permissoes` | `permissoes.ver` |
| `/configuracoes/configuracoes` | `configuracoes.empresa.ver` |
| `/rh/ponto/relatorio` | `ponto_relatorio.ver` |
| `/rh/ponto/convites` | `ponto_convite.criar` |
| `/rh/ponto/fechamento` | `ponto_relatorio.ver` |
| `/relatorios` | `dashboard.visualizar` |
| `/relatorios/dashboard-resumo` | `dashboard.visualizar` |
| `/relatorios/despesas-categoria` | `dashboard.visualizar` |
| `/relatorios/status-obras` | `dashboard.visualizar` |
| `/arquivos/[id]` | `arquivos.ver` |
| `/arquivos/pdf/[id]` | `arquivos.ver` |
| `/debug/update` | `dashboard.visualizar` |

**Ao criar página/rota nova**: adicionar `definePage({ meta: { perm: 'chave' } })` com uma chave que exista no seed e, se for item de menu, incluir a mesma chave em `navigation.js` e em `menu.schema.ts`.

---

## 6. Pontos de atenção (legado / futuro)

### 6.1 Chave `ponto_convite.excluir` no seed

- **Situação**: Existe no seed, mas **não há endpoint de exclusão de convite** no backend nem uso no frontend.
- **Recomendação**: Ou implementar exclusão de convite (backend + frontend) e usar `ponto_convite.excluir`, ou remover essa chave do seed até existir a funcionalidade.

### 6.2 Chaves `obras.*` e `projetos.*` no seed

- **Situação**: Estão no seed; não há controllers específicos de “obras” ou “projetos” com `@Permissoes`. O analytics usa tabela `projetos` e rotas como status-obras com permissões como `dashboard.visualizar`.
- **Recomendação**: Manter no seed como legado/futuro ou remover se não forem mais usadas em nenhum lugar.

---

## 7. Conclusão geral

| Item | Status |
|------|--------|
| Permissões do backend usadas no seed | ✅ Todas implementadas |
| Permissões do frontend (can/meta) no seed | ✅ Todas implementadas |
| Seed com chaves usadas no backend | ✅ Completo |
| Seed com chaves usadas no frontend | ✅ Completo |
| Guard de rotas (router beforeEach) | ✅ Usa `getRequiredPerm` + `can()` |
| Menu filtrado por permissão | ✅ Frontend e backend alinhados |
| is_admin libera tudo (frontend) | ✅ can() retorna true se user?.is_admin |
| is_admin libera tudo (backend) | ✅ PermissionsGuard retorna true se user?.is_admin |
| Rotas novas mapeadas | ✅ / e /debug/update com meta.perm; utils e mail com guard |

**Resposta direta**: As permissões estão **implementadas** e alinhadas. **is_admin** libera tudo no frontend e no backend. Páginas e rotas novas estão mapeadas (index com `index.visualizar`, debug com `dashboard.visualizar`; backend utils e mail protegidos). As únicas ressalvas são as chaves de seed não usadas (`ponto_convite.excluir`, `obras.*`, `projetos.*`), que podem ser ajustadas conforme a seção 6.
