# Fluxo de Contas a Pagar: Pagamentos e Baixas

## Objetivo
Padronizar o contas a pagar para operar por `titulos_financeiros` no momento da baixa, mantendo `contas_pagar` como entidade de agrupamento (fechamento mensal por fornecedor).

## Estado atual (AS-IS)
1. O backend ja possui fluxo novo por titulos:
- `GET /financeiro/contas-pagar/preview-fechamento`
- `POST /financeiro/contas-pagar/fechar-mes`
- `GET /financeiro/contas-pagar/:id/titulos`
- `POST /financeiro/contas-pagar/:id/titulos/:tituloId/pagar`

2. Ainda existe endpoint legado:
- `POST /financeiro/contas-pagar/:id/pagar`
- Esse endpoint marca a conta inteira como `PAGO` e gera despesa unica (sem granularidade por parcela/titulo).

3. Regra de status ja implementada:
- Ao pagar um titulo, se nao houver mais titulos pendentes (`EM_ABERTO`/`VENCIDO`), a `contas_pagar` vira `PAGO`.
- Se ainda houver pendentes, a `contas_pagar` volta para `VENCIDO` (se existir algum vencido) ou `EM_ABERTO`.

## Modelo funcional recomendado (TO-BE)
1. Fechamento mensal
- Usuario seleciona fornecedor, mes e ano.
- Sistema calcula:
  - `total_compras`
  - `total_planos` (credito por plano de corte)
  - ajustes manuais (`valor_dever`, `valor_creditar`, `percentual_liberado`, `desconto_percentual`)
  - `total_final`
- Sistema cria:
  - 1 registro em `contas_pagar` (cabecalho do fechamento)
  - N registros em `titulos_financeiros` (parcelas para baixa)

2. Baixa financeira
- Baixa deve ocorrer exclusivamente por `titulo_financeiro`.
- Cada baixa registra:
  - `status = PAGO`
  - `pago_em`
  - `meta.baixa_manual_em`
  - `meta.baixa_manual_obs`
- `contas_pagar` e recalculada automaticamente apos cada baixa.

3. Status operacionais
- `EM_ABERTO`: existe saldo e ainda nao venceu.
- `VENCIDO`: existe saldo e passou do vencimento.
- `PAGO`: todos os titulos vinculados pagos (ou `total_final = 0` no fechamento).
- `CANCELADO`: somente para titulos/contas invalidados por regra de negocio.

4. Regras de ouro
- Nunca permitir baixa em `titulo` com status `PAGO` ou `CANCELADO`.
- Nao permitir fechamento duplicado para mesmo `fornecedor_id + mes + ano`.
- Soma das parcelas deve bater exatamente com `total_final`.
- Se `total_final > 0`, parcelas sao obrigatorias.

## Fluxo de tela recomendado
1. Lista consolidada (`/financeiro/contas-pagar`)
- Exibe `DESPESA`, `COMPRA`, `FECHAMENTO`.
- Botao "Pagar/Baixar" habilitado apenas para `origem = FECHAMENTO`.

2. Baixa de fechamento
- Ao clicar "Pagar":
  - abrir modal/lista de titulos da conta.
  - permitir selecionar qual parcela baixar (ou sugerir proxima em aberto por vencimento/parcela).
  - confirmar baixa.
  - atualizar lista e status da conta.

3. Novo fechamento
- Etapa 1: preview com memoria de calculo.
- Etapa 2: confirmar, informar parcelas e vencimentos.
- Ao confirmar, criar `contas_pagar` + `titulos_financeiros`.

## Plano de implementacao (curto)
1. Backend
- Manter endpoint de baixa por titulo como oficial.
- Marcar endpoint legado `/:id/pagar` como deprecated e remover uso em tela.
- (Opcional) criar endpoint de estorno de titulo pago.

2. Frontend
- Fechamento: confirmar payload completo no modal.
- Baixa: usar somente `listarTitulosContaPagar` + `pagarTituloContaPagar`.
- Exibir progresso da conta: `titulos pagos / total`.

3. Governanca
- Adicionar auditoria minima em `meta` (usuario, data/hora, observacao).
- Adicionar testes de integracao para:
  - fechamento com parcelas
  - baixa parcial
  - baixa final mudando conta para `PAGO`
  - bloqueio de baixa em titulo cancelado/pago

## Referencias de codigo
- Backend controller: `backend/src/financeiro/contas-pagar.controller.ts`
- Backend service: `backend/src/financeiro/financeiro.service.ts`
- Schema: `backend/prisma/schema.prisma`
- Frontend pagina: `frontend/src/pages/financeiro/contas-pagar/index.vue`
- Frontend service: `frontend/src/services/index.js`
