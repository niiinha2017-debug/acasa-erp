# Plano de Corte + Movimentação de Estoque

## Objetivo

Criar um fluxo único e auditável para:

- planejar corte de chapas e insumos;
- dar baixa no estoque no momento certo;
- registrar sobra e retalho de forma justa;
- gerar etiqueta para máquina de corte;
- refletir isso na timeline e no status operacional sem fluxo paralelo.

Este documento parte do que já existe no ERP e define a regra alvo.

## Problema atual

Hoje o sistema já possui partes importantes do fluxo, mas ainda separadas:

- `plano-corte` já existe;
- baixa de estoque já existe em consumo de plano de corte;
- `estoque_retalho` já existe como estoque separado de sobra;
- geração de etiqueta de sobra já existe;
- timeline e totem de fábrica já existem.

O que falta é unificar a lógica para que corte, baixa, sobra, etiqueta e status sejam um único processo operacional.

## Princípio central

Não misturar três naturezas diferentes de material:

1. estoque principal;
2. consumo em produção;
3. sobra reaproveitável.

Cada evento precisa gerar movimentação explícita.

## Regra justa de movimentação

### 1. Estoque principal

O estoque principal representa itens comprados ou regularizados para uso padrão.

Exemplos:

- chapa inteira;
- fita de borda;
- ferragem;
- insumo padrão;
- item retornado formalmente ao estoque.

### 2. Sobra / retalho

Sobra é um reaproveitamento derivado de um consumo produtivo já ocorrido.

Ela:

- não deve somar automaticamente na quantidade do produto pai;
- deve ficar em estoque separado;
- deve carregar rastreabilidade do material original;
- deve ter status operacional próprio.

### 3. Retorno ao estoque principal

Se um item realmente voltar a ser estoque padrão, isso precisa ocorrer por um evento explícito de retorno.

Não pode acontecer implicitamente ao cadastrar uma sobra.

## Eventos de movimentação que o ERP deve ter

Criar uma trilha única de movimentação, idealmente em tabela própria, por exemplo `estoque_movimentacao`.

Cada evento deve registrar:

- tipo do item: `PRODUTO` ou `RETALHO`;
- item_id;
- tipo de movimento;
- quantidade antes;
- quantidade movimentada;
- quantidade depois;
- unidade;
- origem do movimento;
- origem_id;
- usuário;
- data/hora;
- observação.

## Tipos de movimento recomendados

- `ENTRADA_COMPRA`
- `AJUSTE_MANUAL`
- `RESERVA_PLANO_CORTE`
- `BAIXA_CORTE`
- `ESTORNO_CORTE`
- `GERACAO_RETALHO`
- `RESERVA_RETALHO`
- `CONSUMO_RETALHO`
- `RETORNO_ESTOQUE`
- `DESCARTE`

## Regra operacional recomendada

### Etapa 1. Projeto gera necessidade de corte

Origem:

- venda;
- contrato;
- produção;
- serviço de corte.

Saída esperada:

- lista de peças;
- material por peça;
- espessura;
- orientação;
- possibilidade de rotação;
- perdas técnicas.

### Etapa 2. Plano de corte calcula a alocação

O plano de corte deve produzir:

- quais chapas serão usadas;
- quais peças saem de cada chapa;
- qual sobra será gerada;
- quanto é perda técnica;
- quanto pode virar retalho aproveitável.

O otimizador atual em `frontend/src/utils/plano-corte-optimizer.js` já é uma base inicial, mas precisa virar parte oficial do fluxo do ERP, não só utilitário isolado.

### Etapa 3. Reserva de material

Antes do corte real, o sistema deve reservar estoque.

Regra:

- reserva reduz saldo disponível;
- não reduz saldo físico ainda;
- evita que outra ordem consuma a mesma chapa.

Campos recomendados no produto:

- `quantidade_fisica`
- `quantidade_reservada`
- `quantidade_disponivel` calculada

Se não quiser alterar toda a modelagem agora, a reserva pode existir primeiro em tabela de movimentação ou alocação por plano de corte.

### Etapa 4. Baixa real no momento do corte

A baixa não deve acontecer no cadastro da intenção.

A baixa deve acontecer quando a máquina ou operador confirmar o corte.

Evento:

- `BAIXA_CORTE`

Origem:

- plano de corte;
- tarefa da timeline;
- totem fábrica.

Essa é a hora certa de transformar reserva em consumo real.

### Etapa 5. Geração de sobra/retalho

Ao concluir o corte, o operador informa se houve reaproveitamento.

Se houver sobra útil:

- criar item em `estoque_retalho`;
- gerar movimento `GERACAO_RETALHO`;
- vincular ao material original, ordem, plano e tarefa;
- gerar etiqueta imediatamente.

Se não houver reaproveitamento:

- registrar perda real;
- opcionalmente gerar evento `DESCARTE`.

### Etapa 6. Uso futuro do retalho

Quando um retalho for usado:

- reservar retalho para ordem específica;
- consumir retalho na execução;
- se houver nova sobra do retalho, gerar novo retalho filho ou atualizar reaproveitamento.

## Regra de status concreta

Para não virar um fluxo solto, o plano de corte precisa ser parte da matriz operacional.

Sugestão de subetapas concretas para corte:

1. `PROJETO_TECNICO`
2. `PLANO_CORTE_PENDENTE`
3. `PLANO_CORTE_RESERVADO`
4. `NA_MAQUINA`
5. `CORTE_CONCLUIDO`
6. `ETIQUETADO`
7. `FITA_BORDA`
8. `PRODUCAO`

Se não quiser expandir a matriz agora, usar o que já existe de `SERVICO_CORTE_FITA_BORDA` e enriquecer a timeline com eventos internos.

## Fluxo recomendado de timeline

### Antes do corte

- ordem liberada para corte;
- plano calculado;
- material reservado.

### Durante o corte

- operador inicia tarefa no totem;
- sistema mostra plano da chapa;
- sistema imprime etiqueta da ordem/peça;
- ao concluir, baixa estoque.

### Após o corte

- operador informa sobras úteis;
- sistema cria retalhos;
- sistema imprime etiqueta dos retalhos;
- timeline registra conclusão do corte.

## Etiquetas recomendadas

### Etiqueta de peça para máquina de corte

Cada peça precisa de identificação de produção.

Campos sugeridos:

- número da ordem;
- cliente;
- ambiente;
- peça;
- material;
- espessura;
- dimensões;
- lado/observação;
- QR Code ou código interno.

### Etiqueta de retalho

Já existe base implementada.

Melhorias recomendadas:

- incluir material de origem;
- incluir espessura;
- incluir ordem/plano de origem;
- incluir código escaneável.

## Regra de baixa correta

Para evitar injustiça no estoque, separar três momentos:

1. `planejado`
2. `reservado`
3. `consumido`

Nunca baixar estoque apenas porque o plano foi criado.

Baixar apenas quando o operador confirmar corte real.

## O que já existe e deve ser aproveitado

- `backend/src/plano-corte/service/plano-corte.service.ts`
- `backend/src/plano-corte/service/plano-corte-consumos.service.ts`
- `backend/src/estoque-retalho/estoque-retalho.service.ts`
- `backend/src/apontamento-producao/apontamento-producao.service.ts`
- `backend/src/shared/constantes/status-matrix.ts`
- `frontend/src/utils/plano-corte-optimizer.js`
- `frontend/src/pages/totem-fabrica.vue`

## Implementação recomendada em fases

### Fase 1. Auditoria de estoque

Criar tabela de movimentação de estoque.

Resultado:

- todo consumo e retorno passa a ser rastreável;
- deixa de depender apenas do número final em `produtos.quantidade`.

### Fase 2. Reserva de material por plano de corte

Criar reserva antes da baixa.

Resultado:

- evita dupla utilização do mesmo estoque;
- melhora previsibilidade operacional.

### Fase 3. Baixa real no totem

Mover a baixa definitiva para o momento de conclusão da tarefa de corte.

Resultado:

- estoque refletindo operação real;
- timeline com significado concreto.

### Fase 4. Etiqueta de peça e etiqueta de retalho

Gerar duas saídas:

- etiqueta da peça para corte;
- etiqueta do retalho aproveitável.

### Fase 5. Reaproveitamento de retalho no próprio plano de corte

Antes de consumir chapa inteira, o plano deve tentar encaixar em retalhos compatíveis.

Resultado:

- perda real menor;
- reaproveitamento rastreável.

## Decisão de produto recomendada

Se o objetivo é ficar próximo de Mobcloud/Promob, o ERP deve tratar plano de corte como etapa operacional central, não como utilitário lateral.

Ou seja:

- pedido gera plano;
- plano reserva material;
- totem executa;
- execução baixa estoque;
- sobra gera retalho;
- retalho volta para disponibilidade operacional;
- timeline e status refletem isso automaticamente.

## Próximo passo mais seguro

Implementar primeiro a base de movimentação, antes de tentar reinventar toda a tela visual do plano de corte.

Sequência sugerida:

1. tabela de movimentação;
2. reserva de estoque por plano;
3. baixa real no check do totem;
4. geração de retalho + etiqueta automática;
5. uso de retalho no otimizador.

Sem isso, qualquer plano de corte visual bonito ainda vai continuar com estoque frágil.