// src/services/navigation.js
/** etapaKey: chave do mapa de cores A Casa (CADASTRO, MEDICAO, ORCAMENTO, AGENDAR_APRESENTACAO, FECHAR_VENDA, AGENDAR_FECHAMENTO, MEDIDA_FINA, PRODUCAO, MONTAGEM, POS_VENDA_GARANTIA) para indicador e hover no menu. */
export const NAV_SCHEMA = {
  comercial: [
    { label: 'Orçamento', to: '/orcamentos', icon: 'pi-file-edit', perm: 'orcamentos.ver', etapaKey: 'ORCAMENTO' },
    { label: 'Fluxo de clientes', to: '/relatorios/acompanhamento-status', icon: 'pi-list-check', perm: 'relatorios.acompanhamento_status.ver', etapaKey: 'MEDICAO' },
    { label: 'Fechamento de venda', to: '/vendas/fechamento', icon: 'pi-shopping-cart', perm: ['vendas.criar', 'vendas.fechamento.ver', 'vendas.fechamento.criar'], etapaKey: 'FECHAR_VENDA' },
    { label: 'Contrato', to: '/contratos', icon: 'pi-file', perm: 'contratos.ver', etapaKey: 'FECHAR_VENDA' },
    { label: 'Cláusulas', to: '/contratos/clausulas', icon: 'pi-file-edit', perm: 'contratos.clausulas.editar', etapaKey: 'FECHAR_VENDA' },
    { label: 'Agenda de Venda', to: '/agendamentos/loja', icon: 'pi-calendar-clock', perm: 'agendamentos.vendas', etapaKey: 'AGENDAR_APRESENTACAO' },
  ],

  producao: [
    { label: 'Visão geral', to: '/producao', icon: 'pi-cogs', perm: 'posvenda.ver', etapaKey: 'PRODUCAO' },
    { label: 'Contratos em obra', to: '/producao/contratos', icon: 'pi-file-edit', perm: 'contratos.ver', etapaKey: 'PRODUCAO' },
    { label: 'Pós-venda', to: '/vendas', icon: 'pi-cart-plus', perm: 'posvenda.ver', etapaKey: 'POS_VENDA_GARANTIA' },
    { label: 'Agenda de Produção', to: '/agendamentos/fabrica', icon: 'pi-calendar-clock', perm: 'agendamentos.producao', etapaKey: 'PRODUCAO' },
    { label: 'Timeline de Projetos', to: '/producao/apontamento', icon: 'pi-stopwatch', perm: ['agendamentos.producao', 'agendamentos.vendas'], etapaKey: 'PRODUCAO' },
    { divider: true },
    { label: 'Plano de corte', to: '/plano-corte', icon: 'pi-sitemap', perm: 'plano_corte.ver', etapaKey: 'PRODUCAO' },
    { label: 'Produtos plano de corte', to: '/plano-corte/itens', icon: 'pi-box', perm: 'plano_corte.ver', etapaKey: 'PRODUCAO' },
    { label: 'Venda plano de corte', to: '/plano-corte/venda', icon: 'pi-dollar', perm: 'plano_corte.criar', etapaKey: 'PRODUCAO' },
  ],

  financeiro: [
    { label: 'Administração Financeira', to: '/financeiro/administracao', icon: 'pi-wallet', perm: 'contas_pagar.ver' },
    { label: 'Contas a Pagar', to: '/financeiro/contas-pagar', icon: 'pi-arrow-down-right', perm: 'contas_pagar.ver' },
    { label: 'Contas a Receber', to: '/financeiro/contas-receber', icon: 'pi-arrow-up-right', perm: 'contas_receber.ver' },
    { divider: true },
    { label: 'Despesas Gerais', to: '/despesas', icon: 'pi-wallet', perm: 'despesas.ver' },
    { label: 'Compras', to: '/compras', icon: 'pi-shopping-cart', perm: 'compras.ver' },
  ],

  cadastros: [
    { label: 'Clientes', to: '/clientes', icon: 'pi-users', perm: 'clientes.ver' },
    { label: 'Fornecedores', to: '/fornecedor', icon: 'pi-truck', perm: 'fornecedores.ver' },
    { label: 'Produtos', to: '/produtos', icon: 'pi-tag', perm: 'produtos.ver' },
    { label: 'Funcionarios', to: '/funcionarios', icon: 'pi-id-card', perm: 'funcionarios.ver' },
  ],

  configuracoes: [
    { label: 'Página modelo (layout)', to: '/modelo', icon: 'pi-palette' },
    { label: 'Usuarios', to: '/configuracoes/usuarios', icon: 'pi-user', perm: 'usuarios.ver' },
    { label: 'Permissoes', to: '/configuracoes/permissoes', icon: 'pi-lock', perm: 'permissoes.ver' },
    { divider: true },
    {
      label: 'RH (Gestão)',
      icon: 'pi-users',
      perm: 'ponto_relatorio.ver',
      children: [
        { label: 'Relatório de Ponto', to: '/rh/ponto/relatorio', icon: 'pi-stopwatch', perm: 'ponto_relatorio.ver' },
        { label: 'Convites do Ponto', to: '/rh/ponto/convites', icon: 'pi-link', perm: 'ponto_convite.criar' },
        { label: 'Feriados', to: '/rh/ponto/horas-extras', icon: 'pi-calendar', perm: 'ponto_relatorio.ver' },
        { label: 'Fechamento de Folha', to: '/rh/folha-operacional', icon: 'pi-wallet', perm: 'ponto_relatorio.ver' },
      ],
    },
    { divider: true },
    { label: 'Cadastro da Empresa', to: '/configuracoes/configuracoes', icon: 'pi-sliders-h', perm: 'configuracoes.empresa.ver' },
  ],

  relatorios: [
    {
      label: 'DRE',
      icon: 'pi-chart-bar',
      perm: 'dashboard.visualizar',
      children: [
        { label: 'DRE Mensal', to: '/relatorios/dre-mensal', icon: 'pi-calculator', perm: 'dashboard.visualizar' },
        { label: 'DRE de cliente', to: '/relatorios/dre-mensal?aba=cliente', icon: 'pi-user', perm: 'dashboard.visualizar' },
        { label: 'DRE plano de corte', to: '/relatorios/dre-plano-corte', icon: 'pi-sitemap', perm: 'dashboard.visualizar' },
      ],
    },
    {
      label: 'DASHBOARD',
      icon: 'pi-chart-line',
      perm: 'dashboard.visualizar',
      children: [
        { label: 'Dashboard Resumo', to: '/relatorios/dashboard-resumo', icon: 'pi-chart-line', perm: 'dashboard.visualizar' },
      ],
    },
  ],
}
