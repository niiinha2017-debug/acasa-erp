// src/services/navigation.js
export const NAV_SCHEMA = {
  // 🏭 Operação do dia a dia
operacional: [
  { label: '🗓️ Agendamentos', to: '/agendamentos', icon: 'pi-calendar', perm: 'agendamentos.ver' },
  { divider: true },

  { label: '🚀 Vendas', to: '/vendas', icon: 'pi-cart-plus', perm: 'vendas.ver' },
  { label: '📝 Orçamentos', to: '/orcamentos', icon: 'pi-file-edit', perm: 'orcamentos.ver' },
  { divider: true },

  { label: '⚙️ Produção', to: '/producao', icon: 'pi-cogs', perm: 'producao.ver' },
  { label: '📏 Plano de Corte', to: '/plano-corte', icon: 'pi-sitemap', perm: 'plano-corte.ver' },

  // ✅ novo
  { label: '📦 Itens do Plano de Corte', to: '/plano-corte/itens', icon: 'pi-box', perm: 'plano-corte.ver' },
],

  // 💰 Parte da grana
  financeiro: [
    { label: '📊 Cheques', to: '/financeiro/cheques', icon: 'pi-chart-line', perm: 'cheques.ver' },
    { divider: true },
    { label: '💸 Contas a Pagar', to: '/financeiro/contas-pagar', icon: 'pi-arrow-down-right', perm: 'contas-pagar.ver' },
    { label: '📈 Contas a Receber', to: '/financeiro/contas-receber', icon: 'pi-arrow-up-right', perm: 'contas-receber.ver' },
    { divider: true },
    { label: '👛 Despesas Gerais', to: '/despesas', icon: 'pi-wallet', perm: 'despesas.ver' },
    { label: '🛒 Compras', to: '/compras', icon: 'pi-shopping-cart', perm: 'compras.ver' },
  ],

  // 👥 Base do sistema
  cadastros: [
    { label: '✨ Clientes', to: '/clientes', icon: 'pi-users', perm: 'clientes.ver' },
    { label: '🚚 Fornecedores', to: '/fornecedor', icon: 'pi-truck', perm: 'fornecedor.ver' },
    { label: '📦 Produtos', to: '/produtos', icon: 'pi-tag', perm: 'produtos.ver' },
    { label: '🪪 Funcionários', to: '/funcionarios', icon: 'pi-id-card', perm: 'funcionarios.ver' },
  ],

  // ⚙️ Onde a mágica (e os bugs) acontecem kkk
  configuracoes: [
    { label: '👤 Usuários', to: '/configuracoes/usuarios', icon: 'pi-user', perm: 'usuarios.ver' },
    { label: '🔐 Permissões', to: '/configuracoes/permissoes', icon: 'pi-lock', perm: 'permissoes.gerenciar' },

    { divider: true },

    // ✅ PONTO (ERP)
    { label: '🕒 Ponto (Registros)', to: '/rh/ponto/relatorio', icon: 'pi-clock', perm: 'PONTO_RELATORIO.ver' },
    { label: '🔗 Convites de Ponto', to: '/rh/ponto/convites', icon: 'pi-link', perm: 'PONTO_CONVITE.criar' },

    { divider: true },

    { label: '🛠️ Geral', to: '/configuracoes/configuracoes', icon: 'pi-sliders-h', perm: 'configuracoes.ver' },
  ],

  //DASHBOARD
  dashboard: [
    { label: '📊 Dashboard', to: '/analytics/fluxocaixa', icon: 'pi-chart-bar', perm: 'dashboard.ver' },
  ],
}
