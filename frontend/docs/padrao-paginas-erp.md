# Padrão Único de Páginas do ERP

Este documento define o padrão obrigatório para novas páginas do ERP.

Objetivo: evitar retrabalho visual e estrutural. Novas telas devem nascer no mesmo formato das páginas de clientes, compras e outras páginas estáveis do sistema.

## Referência principal

Use estas páginas como base antes de criar novas telas:

- `frontend/src/pages/clientes/index.vue`
- `frontend/src/pages/clientes/[id].vue`
- `frontend/src/pages/compras/index.vue`

## Regra geral

Cada módulo deve ter um único fluxo principal de entrada e um padrão previsível de cadastro.

Observação de semântica de negócio:

- cadastro de produto é a tela de entrada de itens comprados para uso no ERP;
- controle de estoque pode ser uma tela operacional separada quando a contagem vier de reaproveitamento, sobras ou retalhos;
- não usar o nome `Estoque` para a tela de cadastro se a função real for cadastrar produtos.

- O menu deve apontar apenas para a página principal do módulo.
- Não criar um segundo item de menu para cadastro, edição, resumo ou apoio operacional.
- A listagem é a porta de entrada do módulo.
- Cadastro e edição devem acontecer em página dedicada por rota.
- Não usar modal como fluxo principal de CRUD em páginas novas.

## Estrutura obrigatória por módulo

### 1. Página principal de listagem

Arquivo esperado:

- `frontend/src/pages/<modulo>/index.vue`

Responsabilidades:

- mostrar título e subtítulo do módulo;
- mostrar busca, filtros e ações principais no cabeçalho;
- exibir tabela ou cards de listagem;
- centralizar ações de editar, excluir, abrir detalhe e criar novo registro.

Padrão visual:

- usar `PageShell :padded="false"`;
- usar `section` com `ds-page-context ds-page-context--list animate-page-in`;
- usar `PageHeader` no topo;
- busca e ações dentro de `ds-page-context__actions`;
- conteúdo principal dentro de `ds-page-context__content`.

### 2. Página de criação

Arquivo preferencial:

- `frontend/src/pages/<modulo>/novo.vue`

Responsabilidades:

- criar um novo registro em página própria;
- manter foco em formulário, sem tabela da listagem misturada;
- salvar e retornar para a listagem.

### 3. Página de edição

Arquivo preferencial:

- `frontend/src/pages/<modulo>/[id].vue`

Responsabilidades:

- carregar um único registro;
- editar em página própria;
- salvar e retornar para a listagem.

Observação:

- Se houver restrição técnica ou legado, pode existir uma página única de formulário como `cadastro.vue`, desde que continue sendo uma rota dedicada e não apareça como item separado no menu.
- Quando isso acontecer, criação e edição podem ser controladas por rota ou query param, mas ainda assim o fluxo deve se comportar como uma página de formulário independente.

## Convenção de rotas

Preferir sempre este padrão:

- listagem: `/modulo`
- criação: `/modulo/novo`
- edição: `/modulo/:id`

Evitar:

- `/modulo/resumo`
- `/modulo/cadastro` como item de menu separado
- duas páginas diferentes com responsabilidades duplicadas
- formulário dentro de modal quando o módulo já possui listagem própria

## Convenção de navegação

- O menu lateral deve conter apenas a entrada principal do módulo.
- Botão primário da listagem deve navegar para a rota de criação.
- A edição deve sair da tabela por ação contextual.
- O retorno da criação ou edição deve voltar para a listagem do módulo.

## Convenção de layout

### Listagem

- título simples do módulo, sem sufixos como `Resumo`, `Painel`, `Área`, `Gestão` quando isso não for necessário;
- botão principal com verbo claro: `Novo Cliente`, `Nova Compra`, `Cadastrar Veículo`;
- busca no cabeçalho, não espalhada no corpo;
- ações por linha com padrão do sistema.

### Formulário

- formulário em tela dedicada;
- sem misturar tabela, resumo e modal na mesma página;
- usar largura ampla da página, sem card central estreito quando o formulário for o foco principal;
- separar blocos grandes com seções claras quando necessário;
- manter ações de `Cancelar` e `Salvar` no rodapé do formulário.

## O que não fazer

- não criar duas páginas do mesmo módulo com a mesma função;
- não criar uma listagem e outra página quase idêntica só para abrir modal;
- não colocar cadastro como segundo item permanente da navegação;
- não usar nomenclaturas temporárias como `Resumo` se a página já é a principal;
- não fugir do padrão de clientes sem necessidade real de produto.

## Checklist obrigatório antes de finalizar uma nova página

- existe apenas uma entrada do módulo no menu;
- a listagem está em `index.vue`;
- criar e editar acontecem em rota dedicada;
- não existe modal como fluxo principal;
- o título do módulo está simples e direto;
- o botão principal abre a rota de criação;
- a edição sai da linha da tabela;
- salvar retorna para a listagem;
- a página usa classes do design system já adotadas no ERP.

## Regra de decisão

Se houver dúvida sobre estrutura, seguir a página de clientes.

Se uma nova implementação divergir desse padrão, a divergência precisa ter motivo funcional claro, não apenas preferência de implementação.