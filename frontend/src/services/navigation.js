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
    { label: 'Serviço de Corte', to: '/plano-corte', icon: 'pi-sitemap', perm: 'plano_corte.ver', etapaKey: 'PRODUCAO' },
    { label: 'Produtos Serviço de Corte', to: '/plano-corte/itens', icon: 'pi-box', perm: 'plano_corte.ver', etapaKey: 'PRODUCAO' },
    { label: 'Venda Serviço de Corte', to: '/plano-corte/venda', icon: 'pi-dollar', perm: 'plano_corte.criar', etapaKey: 'PRODUCAO' },
  ],

  financeiro: [
    { label: 'Contas a Pagar', to: '/financeiro/contas-pagar', icon: 'pi-arrow-down-right', perm: 'contas_pagar.ver' },
    { label: 'Contas a Receber', to: '/financeiro/contas-receber', icon: 'pi-arrow-up-right', perm: 'contas_receber.ver' },
    { divider: true },
    { label: 'Compras', to: '/compras', icon: 'pi-shopping-cart', perm: 'compras.ver' },
    { label: 'Despesas Gerais', to: '/despesas', icon: 'pi-wallet', perm: 'despesas.ver' },
  ],

  cadastros: [
    { label: 'Clientes', to: '/clientes', icon: 'pi-users', perm: 'clientes.ver' },
    { label: 'Fornecedores', to: '/fornecedor', icon: 'pi-truck', perm: 'fornecedores.ver' },
    { label: 'Funcionários', to: '/funcionarios', icon: 'pi-id-card', perm: 'funcionarios.ver' },
    { label: 'Produtos', to: '/produtos', icon: 'pi-tag', perm: 'produtos.ver' },
  ],

  configuracoes: [
    { label: 'Usuários', to: '/configuracoes/usuarios', icon: 'pi-user', perm: 'usuarios.ver' },
    { label: 'Permissões', to: '/configuracoes/permissoes', icon: 'pi-lock', perm: 'permissoes.ver' },
    { divider: true },
    {
      label: 'RH (Gestão)',
      icon: 'pi-users',
      perm: 'ponto_relatorio.ver',
      children: [
        { label: 'Relatório de Ponto', to: '/rh/ponto/relatorio', icon: 'pi-stopwatch', perm: 'ponto_relatorio.ver' },
        { label: 'Convites do Ponto', to: '/rh/ponto/convites', icon: 'pi-link', perm: 'ponto_convite.criar' },
        { label: 'Feriados', to: '/rh/ponto/horas-extras', icon: 'pi-calendar', perm: 'ponto_relatorio.ver' },
        { label: 'Pagamento Funcionários', to: '/rh/pagamento-funcionarios', icon: 'pi-wallet', perm: 'despesas.ver' },
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
        { label: 'DRE por cliente', to: '/relatorios/dre-mensal?aba=cliente', icon: 'pi-user', perm: 'dashboard.visualizar' },
        { label: 'DRE Serviço de Corte', to: '/relatorios/dre-plano-corte', icon: 'pi-sitemap', perm: 'dashboard.visualizar' },
      ],
    },
    {
      label: 'Dashboard',
      icon: 'pi-chart-line',
      perm: 'dashboard.visualizar',
      children: [
        { label: 'Dashboard Resumo', to: '/relatorios/dashboard-resumo', icon: 'pi-chart-line', perm: 'dashboard.visualizar' },
      ],
    },
    {
      label: 'Projetos e obra',
      icon: 'pi-briefcase',
      perm: 'dashboard.visualizar',
      children: [
        { label: 'Status de Projetos', to: '/relatorios/status-projetos', icon: 'pi-list', perm: 'dashboard.visualizar' },
        { label: 'Status de Obras', to: '/relatorios/status-obras', icon: 'pi-building', perm: 'dashboard.visualizar' },
        { label: 'Horas Trabalhadas', to: '/relatorios/horas-trabalhadas', icon: 'pi-clock', perm: 'dashboard.visualizar' },
      ],
    },
    {
      label: 'Outros relatórios',
      icon: 'pi-file',
      perm: 'dashboard.visualizar',
      children: [
        { label: 'Despesas por Categoria', to: '/relatorios/despesas-categoria', icon: 'pi-chart-pie', perm: 'dashboard.visualizar' },
        { label: 'Feriados', to: '/relatorios/feriados', icon: 'pi-calendar', perm: 'ponto_relatorio.ver' },
      ],
    },
  ],
}
