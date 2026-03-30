# Validacao de Relatorios do ERP

## Objetivo

Centralizar a validacao dos relatorios do ERP, separando:

- o que ja foi validado por analise estatica
- o que depende de dados reais e permissao/autenticacao
- os fluxos que geram PDF e exigem verificacao manual

## Resultado atual

- Relatorios e telas mapeados no backend e frontend
- Validacao estatica concluida sem erros de editor nos arquivos centrais
- Nao existem testes automatizados dedicados para relatorios no workspace atual
- A validacao funcional completa ainda depende de backend ativo, banco com dados e usuario com permissoes

## Inventario de relatorios

### Area Relatorios

| Relatorio | Frontend | Backend | Permissao principal | PDF |
| --- | --- | --- | --- | --- |
| Dashboard de relatorios | `frontend/src/pages/relatorios/index.vue` | `GET /relatorios/dre-detalhada/graficos-validacao` | `dashboard.visualizar` | Nao |
| DRE mensal | `frontend/src/pages/relatorios/dre-mensal.vue` | `GET /relatorios/dre-mensal` | `relatorios.dre_mensal.ver` | Nao |
| DRE detalhada | `frontend/src/pages/relatorios/dre-detalhada.vue` | `GET /relatorios/dre-detalhada/*` | `relatorios.dre_detalhada.ver` | Nao |
| Fluxo de caixa | `frontend/src/pages/relatorios/fluxo-caixa.vue` | `GET /relatorios/fluxo-caixa` | `relatorios.fluxo_caixa.ver` | Nao |
| Servico de corte | `frontend/src/pages/relatorios/servico-corte.vue` | `GET /relatorios/servico-corte` | `plano_corte.ver` | Sim |
| Totem producao | `frontend/src/pages/relatorios/totem-producao.vue` | `GET /relatorios/totem-producao` | `agendamentos.producao` | Nao |
| Custo de rota | `frontend/src/pages/relatorios/custo-rota/index.vue` | `GET /rota-custo-viagem/relatorio` | `relatorios.custo_rota` | Nao identificado |
| Contas a pagar | `frontend/src/pages/relatorios/contas-pagar.vue` | `GET /financeiro/contas-pagar/relatorio` | `contas_pagar.ver` | Sim |
| Contas a receber | `frontend/src/pages/relatorios/contas-receber.vue` | `GET /financeiro/contas-receber/relatorio` | `contas_receber.ver` | Sim |
| Folha trabalhista | `frontend/src/pages/relatorios/folha-trabalhista.vue` | Consome dados de ponto/financeiro | `funcionarios.ver` | Possivel recibo/PDF operacional |

### RH / Ponto

| Relatorio | Frontend | Backend | Permissao principal | PDF |
| --- | --- | --- | --- | --- |
| Relatorio de ponto | `frontend/src/pages/rh/ponto/relatorio/index.vue` | `backend/src/ponto/relatorio/ponto-relatorio.controller.ts` | `ponto_relatorio.ver` | Sim |
| Fechamento de folha | `frontend/src/pages/rh/ponto/fechamento.vue` | `GET /ponto/relatorio/fechamento` | `ponto_relatorio.ver` | Sim, recibo |

## Validacao estatica executada

Arquivos verificados com analise de erros do editor:

- backend/src/relatorios/*.ts
- backend/src/ponto/relatorio/*.ts
- frontend/src/services/index.js
- frontend/src/pages/relatorios/*.vue
- frontend/src/pages/relatorios/custo-rota/index.vue
- frontend/src/pages/rh/ponto/relatorio/index.vue

Status:

- Nenhum erro encontrado nos arquivos analisados

## Lacunas atuais

1. Nao ha suite automatizada cobrindo regressao de relatorios.
2. Varios relatorios dependem diretamente de agregacoes Prisma e dados mensais reais.
3. Os PDFs dependem de renderizacao, headers, blob/download e dados validos; isso nao e coberto por analise estatica.
4. Parte dos relatorios usa permissao especifica. Sem um usuario de teste com perfil correto, a navegacao completa nao pode ser confirmada.

## Roteiro funcional de validacao

### Preparacao minima

1. Subir banco e backend.
2. Confirmar frontend apontando para o backend local.
3. Entrar com usuario que tenha todas as permissoes de relatorios e RH.
4. Garantir massa de dados em pelo menos tres cenarios:
   - competencia com dados completos
   - competencia sem dados
   - competencia com dados parciais/inconsistentes

### Checklist comum para todos os relatorios

1. Abrir a rota pelo menu e por URL direta.
2. Confirmar carregamento sem erro de permissao ou tela em branco.
3. Alterar filtros principais e validar refresh dos dados.
4. Testar mes/ano com dados e sem dados.
5. Validar formatacao de moeda, datas, totais e estados vazios.
6. Confirmar que o relatorio nao quebra em mobile/largura reduzida.

### Checklist por relatorio

#### Dashboard de relatorios

1. Confirmar carregamento de composicao de custo, lucro por ambiente e meta de producao.
2. Testar troca de mes, ano e meta.
3. Validar se graficos sem dados entram em fallback visual sem erro.

#### DRE mensal

1. Conferir receita bruta, impostos, CPV, despesas fixas e lucro liquido.
2. Validar mes sem movimento.
3. Comparar um mes conhecido com fechamento financeiro/manual.

#### DRE detalhada

1. Buscar cliente por autocomplete.
2. Validar cliente com venda classica.
3. Validar cliente com OS de importacao/markup.
4. Validar cliente com garantia/assistencia/manutencao.
5. Abrir ambientes/etapas diferentes e conferir troca do DRE.
6. Confirmar dashboard de consumo do projeto e resumo de prazos.

#### Fluxo de caixa

1. Validar entradas realizadas, saidas realizadas e saldos.
2. Conferir pendentes vencidos e a vencer.
3. Validar meta de vendas e vendas necessarias.
4. Trocar mes/ano e confirmar consistencia dos totais e listagens.

#### Servico de corte

1. Validar filtros de mes, ano, fornecedor e status.
2. Conferir total geral, agrupamento por status e por fornecedor.
3. Exportar PDF e validar abertura/arquivo salvo.
4. Testar competencia sem planos de corte.

#### Totem producao

1. Validar periodo customizado.
2. Conferir cards resumo, horas por funcionario e detalhamento por tarefa.
3. Expandir tarefas e conferir funcionarios internos.
4. Validar periodo sem apontamento.

#### Custo de rota

1. Validar filtros por data, funcionario e veiculo.
2. Conferir cards de viagens, km e custo total.
3. Validar tabela por funcionario e detalhamento completo.
4. Testar registros manuais e origem Totem.

#### Contas a pagar

1. Validar filtros e consolidado do relatorio.
2. Conferir PDF.
3. Comparar com os dados das abas operacionais e com fechamentos do mes.

#### Contas a receber

1. Validar filtros e consolidado do relatorio.
2. Conferir PDF.
3. Comparar com recebimentos, pendencias e estornos.

#### Folha trabalhista

1. Confirmar fonte dos dados exibidos e integracao com ponto/financeiro.
2. Validar um funcionario com saldo positivo e outro com divergencia.
3. Se houver emissao de recibo, validar geracao do PDF.

#### Relatorio de ponto

1. Listar funcionarios ativos.
2. Trocar funcionario, mes e ano.
3. Conferir linhas do espelho, saldo, faltas, extras e justificativas.
4. Gerar PDF mensal.
5. Abrir comprovante individual em PDF/imagem.
6. Validar anexo de justificativa e edicao de registro.

#### Fechamento de folha

1. Conferir calculo de fechamento por periodo.
2. Validar pagamento de folha e reflexo financeiro.
3. Gerar recibo operacional em PDF.

## Execucao recomendada

### Etapa 1: fumaca rapida

1. Dashboard de relatorios
2. DRE mensal
3. Fluxo de caixa
4. Contas a pagar
5. Contas a receber
6. Relatorio de ponto

### Etapa 2: validacao aprofundada

1. DRE detalhada
2. Totem producao
3. Servico de corte
4. Custo de rota
5. Folha trabalhista
6. Fechamento de folha

## Criterio de aprovacao

Considerar o conjunto aprovado somente quando:

- todas as rotas abrirem sem erro
- todos os filtros principais responderem corretamente
- estados vazios e estados com dados forem validados
- PDFs abrirem/baixarem corretamente
- pelo menos uma competencia conhecida bater com os numeros esperados do negocio

## Proximo passo tecnico recomendado

Criar uma suite minima de smoke tests para os endpoints de relatorios mais criticos:

1. DRE mensal
2. Fluxo de caixa
3. Relatorio de ponto
4. Servico de corte
5. Contas a pagar
6. Contas a receber