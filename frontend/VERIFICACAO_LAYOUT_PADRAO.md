# Verificação – Layout padronizado nas telas

Padrão aplicado: **um card** (`rounded-2xl border border-border-ui bg-bg-card`), **sem sombra**, **faixa superior** `h-1 w-full bg-brand-primary rounded-t-2xl`, **PageHeader** com `:show-back="false"`, área de conteúdo com `border-t border-border-ui`. Tabelas **sem card interno**; coluna Ações com **align: 'center'** e botões com **ícone + nome**.

---

## Telas com layout padronizado (salvas)

| Página | Status | Observação |
|--------|--------|------------|
| **clientes/index.vue** | OK | Listagem: faixa brand, sem sombra, tabela sem card interno, Ações centralizadas |
| **clientes/[id].vue** | OK | Formulário: div + faixa brand, sem sombra (checklist mantido) |
| **produtos/index.vue** | OK | Listagem padronizada |
| **produtos/[id].vue** | OK | Formulário: div + faixa brand, loading no tema |
| **fornecedor/index.vue** | OK | Listagem padronizada |
| **fornecedor/[id].vue** | OK | Formulário: div + faixa brand |
| **funcionarios/index.vue** | OK | Listagem + ações com nome (Documentos, Reenviar, Editar, Excluir) |
| **funcionarios/[id].vue** | OK | Formulário: div + faixa brand |
| **despesas/index.vue** | OK | Listagem padronizada |
| **despesas/[id].vue** | OK | Formulário: div + faixa brand |
| **compras/index.vue** | OK | Listagem padronizada |
| **compras/[id].vue** | OK | Formulário: div + faixa brand |
| **vendas/index.vue** | Outro | Layout com métricas + tabela (sem card único) |
| **configuracoes/usuarios.vue** | OK | Lista + modal e loading com tema (claro/escuro) |
| **configuracoes/permissoes.vue** | OK | Um card, faixa brand, sem sombra |
| **configuracoes/configuracoes.vue** | OK | Cadastro da empresa: div + faixa brand, conteúdo com tema |
| **rh/ponto/relatorio/index.vue** | OK | Padrão aplicado |
| **rh/ponto/convites.vue** | OK | Ajustado: w-full h-full, faixa brand, border-t (conteúdo interno ainda com cores antigas em parte) |

---

## Componentes globais padronizados

- **TableActions.vue**: Botões ícone + nome (Editar, Excluir), estilo único, `perm-edit` / `perm-delete`, centralizado.
- **Menu.vue / NavMenu.vue**: Estilo atual mantido.
- **PageHeader**: Uso de `:show-back` onde aplicável.
- **Coluna Ações**: Nas listagens, `align: 'center'` e label "Ações"; células com `flex justify-center`.

---

## Formulários padronizados (fev/2025)

Todos os formulários abaixo foram atualizados para **div** com `rounded-2xl border border-border-ui bg-bg-card`, faixa `h-1 w-full bg-brand-primary rounded-t-2xl`, sem sombra:

- clientes/[id].vue, produtos/[id].vue, fornecedor/[id].vue, funcionarios/[id].vue  
- compras/[id].vue, despesas/[id].vue, configuracoes/configuracoes.vue  

---

## Como confirmar que está tudo salvo

1. Rodar o app em modo dev: `cd frontend && npm run tauri:dev` (ou `npm run tauri:dev` na raiz do acasa-erp).
2. Navegar por: Clientes (lista e novo), Produtos (lista e novo), Equipe (usuários), Convites do Ponto, Permissões, Relatório Ponto.
3. Conferir se não há **shadow-2xl** no card principal, se a **faixa azul** (brand) aparece no topo e se a **coluna Ações** está centralizada com nomes nos botões.

Última verificação: fevereiro 2025.
