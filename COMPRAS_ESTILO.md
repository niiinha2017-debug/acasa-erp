# Estilo da página Compras (igual Clientes / Fornecedores)

Resumo do que foi aplicado para não perder as alterações.

## Arquivos alterados

- `frontend/src/pages/compras/index.vue` — listagem
- `frontend/src/pages/compras/[id].vue` — formulário nova/editar

## Listagem (index.vue)

- Container: `login-font clientes-line-list`, `max-w-[1700px]`, card `rounded-3xl border border-border-ui bg-bg-card shadow-2xl`
- Faixa azul no topo: `<div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]">`
- PageHeader com `:showBack="false"`, busca + botão "Nova Compra" no `#actions`
- Botão: `class="flex-shrink-0 h-11 rounded-xl font-black uppercase tracking-[0.16em] text-[11px]"`
- Conteúdo: `px-4 md:px-6 pb-5 md:pb-6 pt-4`
- Table com `:boxed="true"` (sem wrapper extra)
- TableActions: `class="!justify-center !px-0"`, `:show-label="false"` (botões só ícone)
- Imports explícitos: PageHeader, SearchInput, Table, TableActions, Button, StatusBadge, MetricCard
- Estilo scoped: Manrope + `.clientes-line-list` para o campo de busca

## Formulário ([id].vue)

- Card: `login-font`, `rounded-3xl border border-border-ui bg-bg-card shadow-2xl`
- Faixa azul: `<div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]">`
- PageHeader com `:backTo="'/compras'"`
- Imports explícitos dos componentes de UI

## Para não perder de novo

```bash
cd "d:\Sistema ERP\acasa-erp"
git add frontend/src/pages/compras/
git add COMPRAS_ESTILO.md
git commit -m "Estilo Compras igual Clientes/Fornecedores - card, gradiente, tabela, botões minimalistas"
```

Depois: rodar o frontend sempre de `acasa-erp\frontend` e dar Ctrl+Shift+R no navegador ao testar.
