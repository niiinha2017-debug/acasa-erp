# Instruções do Workspace

## Padrão obrigatório para novas páginas do ERP

Ao criar ou refatorar páginas no frontend deste ERP, siga obrigatoriamente o padrão descrito em `frontend/docs/padrao-paginas-erp.md`.

Resumo operacional:

- usar a página de clientes como referência principal de estrutura;
- cada módulo deve ter uma única entrada principal no menu;
- a listagem deve ficar em `index.vue`;
- criação e edição devem acontecer em página dedicada por rota;
- não criar modal como fluxo principal de CRUD em páginas novas;
- não criar item de navegação separado para cadastro;
- preferir rotas `/modulo`, `/modulo/novo` e `/modulo/[id]`;
- manter títulos simples, sem sufixos desnecessários como `Resumo` quando a página já é a principal;
- para formulários, preferir layout de tela inteira ou largura ampla, evitando card central estreito sem necessidade.

## Quando houver dúvida

Antes de propor estrutura nova para um módulo, comparar com:

- `frontend/src/pages/clientes/index.vue`
- `frontend/src/pages/clientes/[id].vue`

Se a nova página divergir desse padrão, explicar no código ou na resposta o motivo funcional da exceção.