# Rotas do frontend e permissões

Referência para conferir cada página: rota, permissão exigida e se está no seed.

| # | Rota (path) | Arquivo (página) | Permissão (meta.perm) | No seed? |
|---|-------------|------------------|------------------------|----------|
| 1 | `/` | index.vue | index.visualizar | ✅ |
| 2 | `/login` | login.vue | public | - |
| 3 | `/pendente` | pendente.vue | (nenhuma – só token) | - |
| 4 | `/alterar-senha` | alterar-senha.vue | alterar-senha | ✅ |
| 5 | `/relatorios` | relatorios/index.vue | dashboard.visualizar | ✅ |
| 6 | `/relatorios/acompanhamento-status` | relatorios/acompanhamento-status.vue | relatorios.acompanhamento_status.ver | ✅ |
| 7 | `/relatorios/feriados` | relatorios/feriados.vue | dashboard.visualizar | ✅ |
| 8 | `/relatorios/status-obras` | relatorios/status-obras.vue | dashboard.visualizar | ✅ |
| 9 | `/relatorios/status-projetos` | relatorios/status-projetos.vue | dashboard.visualizar | ✅ |
| 10 | `/relatorios/dashboard-resumo` | relatorios/dashboard-resumo.vue | dashboard.visualizar | ✅ |
| 11 | `/relatorios/horas-trabalhadas` | relatorios/horas-trabalhadas.vue | dashboard.visualizar | ✅ |
| 12 | `/relatorios/despesas-categoria` | relatorios/despesas-categoria.vue | dashboard.visualizar | ✅ |
| 13 | `/relatorios/dre-mensal` | relatorios/dre-mensal.vue | dashboard.visualizar | ✅ |
| 14 | `/comercial` | comercial/index.vue | orcamentos.ver | ✅ |
| 15 | `/orcamentos` | orcamentos/index.vue | orcamentos.ver | ✅ |
| 16 | `/orcamentos/lista` | orcamentos/lista.vue | orcamentos.ver | ✅ |
| 17 | `/orcamentos/processo` | orcamentos/processo.vue | orcamentos.ver | ✅ |
| 18 | `/orcamentos/[id]` | orcamentos/[id].vue | orcamentos.ver | ✅ |
| 19 | `/orcamentos/cliente/[id]` | orcamentos/cliente/[id].vue | orcamentos.ver | ✅ |
| 20 | `/vendas/fechamento` | vendas/fechamento.vue | vendas.fechamento.ver | ✅ |
| 21 | `/vendas` | vendas/index.vue | posvenda.ver | ✅ |
| 22 | `/vendas/kanban` | vendas/kanban.vue | posvenda.ver | ✅ |
| 23 | `/vendas/[id]` | vendas/[id].vue | posvenda.ver | ✅ |
| 24 | `/vendas/nova-venda` | vendas/nova-venda.vue | vendas.criar | ✅ |
| 25 | `/vendas/cliente/[id]` | vendas/cliente/[id].vue | vendas.ver | ✅ |
| 26 | `/vendas/venda/[id]` | vendas/venda/[id].vue | vendas.criar | ✅ |
| 27 | `/vendas/venda/[id]/editar` | vendas/venda/[id]/editar.vue | vendas.editar | ✅ |
| 28 | `/contratos` | contratos/index.vue | contratos.ver | ✅ |
| 29 | `/contratos/clausulas` | contratos/clausulas.vue | contratos.clausulas.editar | ✅ |
| 30 | `/contratos/[id]` | contratos/[id].vue | contratos.ver | ✅ |
| 31 | `/contratos/cliente/[id]` | contratos/cliente/[id].vue | contratos.ver | ✅ |
| 32 | `/agendamentos` | agendamentos/index.vue | agendamentos.vendas | ✅ |
| 33 | `/agendamentos/loja` | agendamentos/loja.vue | agendamentos.vendas | ✅ |
| 34 | `/agendamentos/fabrica` | agendamentos/fabrica.vue | agendamentos.producao | ✅ |
| 35 | `/agendamentos/agenda-fabrica` | agendamentos/agenda-fabrica.vue | agendamentos.producao | ✅ |
| 36 | `/producao` | producao/index.vue | posvenda.ver | ✅ |
| 37 | `/plano-corte` | plano-corte/index.vue | plano_corte.ver | ✅ |
| 38 | `/plano-corte/kanban` | plano-corte/kanban.vue | plano_corte.ver | ✅ |
| 39 | `/plano-corte/itens` | plano-corte/itens/index.vue | plano_corte.ver | ✅ |
| 40 | `/plano-corte/itens/[id]` | plano-corte/itens/[id].vue | plano_corte.ver | ✅ |
| 41 | `/plano-corte/venda` | plano-corte/venda.vue | plano_corte.criar | ✅ |
| 42 | `/plano-corte/[id]` | plano-corte/[id].vue | plano_corte.ver | ✅ |
| 43 | `/clientes` | clientes/index.vue | clientes.ver | ✅ |
| 44 | `/clientes/[id]` | clientes/[id].vue | clientes.ver | ✅ |
| 45 | `/fornecedor` | fornecedor/index.vue | fornecedores.ver | ✅ |
| 46 | `/fornecedor/[id]` | fornecedor/[id].vue | fornecedores.ver | ✅ |
| 47 | `/produtos` | produtos/index.vue | produtos.ver | ✅ |
| 48 | `/produtos/[id]` | produtos/[id].vue | produtos.ver | ✅ |
| 49 | `/funcionarios` | funcionarios/index.vue | funcionarios.ver | ✅ |
| 50 | `/funcionarios/[id]` | funcionarios/[id].vue | funcionarios.ver | ✅ |
| 51 | `/financeiro/contas-pagar` | financeiro/contas-pagar/index.vue | contas_pagar.ver | ✅ |
| 52 | `/financeiro/contas-receber` | financeiro/contas-receber/index.vue | contas_receber.ver | ✅ |
| 53 | `/despesas` | despesas/index.vue | despesas.ver | ✅ |
| 54 | `/despesas/[id]` | despesas/[id].vue | despesas.ver | ✅ |
| 55 | `/compras` | compras/index.vue | compras.ver | ✅ |
| 56 | `/compras/[id]` | compras/[id].vue | compras.ver | ✅ |
| 57 | `/configuracoes/usuarios` | configuracoes/usuarios.vue | usuarios.ver | ✅ |
| 58 | `/configuracoes/permissoes` | configuracoes/permissoes.vue | permissoes.ver | ✅ |
| 59 | `/configuracoes/configuracoes` | configuracoes/configuracoes.vue | configuracoes.empresa.ver | ✅ |
| 60 | `/rh` | rh/index.vue | ponto_relatorio.ver | ✅ |
| 61 | `/rh/ponto/relatorio` | rh/ponto/relatorio/index.vue | ponto_relatorio.ver | ✅ |
| 62 | `/rh/ponto/fechamento` | rh/ponto/fechamento.vue | ponto_relatorio.ver | ✅ |
| 63 | `/rh/ponto/horas-extras` | rh/ponto/horas-extras.vue | ponto_relatorio.ver | ✅ |
| 64 | `/rh/ponto/convites` | rh/ponto/convites.vue | ponto_convite.criar | ✅ |
| 65 | `/arquivos/[id]` | arquivos/[id].vue | arquivos.ver | ✅ |
| 66 | `/arquivos/pdf/[id]` | arquivos/pdf/[id].vue | arquivos.ver | ✅ |
| 67 | `/debug/update` | debug/update.vue | dashboard.visualizar | ✅ |
| 68 | `/aceitar/[token]` | aceitar/[token].vue | public | - |
| 69 | `/aceitar/obrigado` | aceitar/obrigado.vue | public | - |

**Como usar:** Para cada página, conferir: (1) `definePage({ meta: { perm: '...' } })` está correto; (2) a permissão existe no seed do backend; (3) as APIs que a página chama estão protegidas no backend com a mesma permissão quando fizer sentido.
