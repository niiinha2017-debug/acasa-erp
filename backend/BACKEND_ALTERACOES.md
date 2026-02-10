# Alterações Backend ACASA-ERP

## 1. Arquivos alterados/criados

| Arquivo | Alteração |
|---------|-----------|
| `prisma/schema.prisma` | `agenda_global`: `cliente_id` opcional, `fornecedor_id` adicionado; `Fornecedor`: relação `agendamentos` |
| `prisma/seed.ts` | Permissões `projetos.*`; descrição `plano_corte.enviar_producao` |
| `prisma/migrations/20260210120000_agenda_fornecedor_plano_corte/migration.sql` | **NOVO** – Migration para `agenda_global` |
| `shared/constantes/pipeline-plano-corte.ts` | Export `PIPELINE_PLANO_CORTE_KEYS` para validação |
| `src/agenda/dto/create-agenda.dto.ts` | `cliente_id` opcional quando `plano_corte_id` informado; `fornecedor_id` opcional |
| `src/agenda/agenda.service.ts` | Lógica plano de corte (fornecedor), regras cliente/fornecedor, includes |
| `src/agenda/agenda.controller.ts` | Permissões: POST `agendamentos.criar`, DELETE `agendamentos.excluir` |
| `src/plano-corte/service/plano-corte.service.ts` | Validação de status com `PIPELINE_PLANO_CORTE_KEYS` |
| `src/plano-corte/controllers/plano-corte.controller.ts` | Endpoint `GET /plano-corte/pipeline` |

---

## 2. Rotas/endpoints

### Agenda (`/agenda`)

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| **POST** | `/agenda` | `agendamentos.criar` | Criar agendamento (venda, orçamento ou plano de corte) |
| **GET** | `/agenda?inicio=&fim=` | `agendamentos.ver` + (`agendamentos.vendas` OU `agendamentos.producao`) | Listar agendamentos |
| **GET** | `/agenda/funcionario/:id` | `agendamentos.ver` | Listar por funcionário |
| **PATCH** | `/agenda/:id/status` | `agendamentos.editar` | Atualizar status (CONCLUIDO → plano_corte FINALIZADO) |
| **DELETE** | `/agenda/:id` | `agendamentos.excluir` | Remover agendamento |

### Plano de Corte (`/plano-corte`)

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| **POST** | `/plano-corte` | `plano_corte.criar` | Criar plano de corte |
| **GET** | `/plano-corte` | `plano_corte.ver` | Listar planos |
| **GET** | `/plano-corte/pipeline` | `plano_corte.ver` | Retornar constantes do pipeline (EM_ABERTO, EM_PRODUCAO, FINALIZADO, COMPENSADO) |
| **GET** | `/plano-corte/:id` | `plano_corte.ver` | Buscar por ID |
| **PUT** | `/plano-corte/:id` | `plano_corte.editar` | Atualizar plano |
| **POST** | `/plano-corte/:id/pdf` | `plano_corte.ver` | Gerar PDF |
| **DELETE** | `/plano-corte/:id` | `plano_corte.excluir` | Excluir plano |

---

## 3. Fluxo: Plano de Corte → Agenda Geral

1. **Plano de Corte** (venda de metros de corte ao fornecedor):
   - Status: `EM_ABERTO` → `EM_PRODUCAO` → `FINALIZADO` → `COMPENSADO`

2. **Criar agendamento** com `plano_corte_id`:
   - `cliente_id` não é obrigatório
   - `fornecedor_id` preenchido pelo fornecedor do plano
   - Status do plano: `EM_ABERTO` → `EM_PRODUCAO`
   - Permissão recomendada: `plano_corte.enviar_producao` (frontend `v-can`)

3. **Marcar agenda como CONCLUIDO**:
   - Status do plano: `EM_PRODUCAO` → `FINALIZADO`

4. **Constantes**:
   - Pipeline Cliente: `backend/shared/constantes/pipeline-cliente.ts`
   - Pipeline Plano Corte: `backend/shared/constantes/pipeline-plano-corte.ts`
   - Status Financeiro: `backend/shared/constantes/status-financeiro.ts`
   - Formas de Pagamento: `backend/shared/constantes/formas-pagamento.ts`

---

## 4. Comandos

```bash
# Aplicar migration
cd backend && npx prisma migrate deploy

# Rodar seed
npx prisma db seed

# Gerar cliente Prisma
npx prisma generate
```
