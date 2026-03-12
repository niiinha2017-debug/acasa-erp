// src/services/navigation.js
/** etapaKey: chave do mapa de cores A Casa (CADASTRO, MEDICAO, ORCAMENTO, AGENDAR_APRESENTACAO, FECHAR_VENDA, AGENDAR_FECHAMENTO, MEDIDA_FINA, PRODUCAO, MONTAGEM, POS_VENDA_GARANTIA) para indicador e hover no menu. */
export const NAV_SCHEMA = {
  comercial: [
    { label: 'Agenda de Venda', to: '/agendamentos/loja', icon: 'pi-calendar-clock', perm: 'agendamentos.vendas', etapaKey: 'AGENDAR_APRESENTACAO' },
    { label: 'Fluxo de Clientes', to: '/relatorios/acompanhamento-status', icon: 'pi-list-check', perm: 'relatorios.acompanhamento_status.ver', etapaKey: 'MEDICAO' },
    { label: 'Orçamento', to: '/orcamentos', icon: 'pi-file-edit', perm: 'orcamentos.ver', etapaKey: 'ORCAMENTO' },
    { label: 'Orçamento Técnico', to: '/orcamento-tecnico', icon: 'pi-file-edit', perm: 'agendamentos.producao', etapaKey: 'ORCAMENTO' },
    { label: 'Fechamento de Venda', to: '/vendas/fechamento', icon: 'pi-shopping-cart', perm: ['vendas.criar', 'vendas.fechamento.ver', 'vendas.fechamento.criar'], etapaKey: 'FECHAR_VENDA' },
    { label: 'Contrato', to: '/contratos', icon: 'pi-file', perm: 'contratos.ver', etapaKey: 'FECHAR_VENDA' },
    { label: 'Cláusulas', to: '/contratos/clausulas', icon: 'pi-file-edit', perm: 'contratos.clausulas.editar', etapaKey: 'FECHAR_VENDA' },
  ],

  producao: [
    { heading: 'PLANEJAMENTO' },
    { label: 'Medição Fina', to: '/producao/medicao-fina', icon: 'pi-ruler', perm: ['agendamentos.vendas', 'agendamentos.producao'], etapaKey: 'MEDIDA_FINA' },
    { label: 'Agenda de Produção', to: '/agendamentos/fabrica', icon: 'pi-calendar', perm: 'agendamentos.producao', etapaKey: 'PRODUCAO' },
    { label: 'Timeline de Projetos', to: '/producao/apontamento', icon: 'pi-history', perm: ['agendamentos.producao', 'agendamentos.vendas'], etapaKey: 'PRODUCAO' },
    { divider: true },
    { heading: 'EXECUÇÃO' },
    { label: 'Totem Fábrica', to: '/totem-fabrica', icon: 'pi-building', perm: 'agendamentos.producao', etapaKey: 'PRODUCAO' },
    { label: 'Contratos em obra', to: '/producao/contratos', icon: 'pi-truck', perm: 'contratos.ver', etapaKey: 'PRODUCAO' },
    { label: 'Pós-venda', to: '/vendas', icon: 'pi-heart', perm: 'posvenda.ver', etapaKey: 'POS_VENDA_GARANTIA' },
  ],

  servico_corte: [
    { label: 'Produtos Serviço de Corte', to: '/plano-corte/itens', icon: 'pi-box', perm: 'plano_corte.ver', etapaKey: 'PRODUCAO' },
    { label: 'Serviço de Corte', to: '/plano-corte', icon: 'pi-cog', perm: 'plano_corte.ver', etapaKey: 'PRODUCAO' },
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
        { label: 'Pagamento Funcionários', to: '/rh/ponto/fechamento', icon: 'pi-wallet', perm: 'despesas.ver' },
      ],
    },
    { divider: true },
    { label: 'Cadastro da Empresa', to: '/configuracoes/configuracoes', icon: 'pi-sliders-h', perm: 'configuracoes.empresa.ver' },
  ],

  relatorios: [
    { label: 'Custos de Estrutura', to: '/financeiro/custos-estrutura', icon: 'pi-chart-bar', perm: 'custos_estrutura.ver' },
    { label: 'DRE Mensal', to: '/relatorios/dre-mensal', icon: 'pi-chart-line', perm: 'relatorios.dre_mensal.ver' },
    { label: 'DRE Detalhada', to: '/relatorios/dre-detalhada', icon: 'pi-chart-pie', perm: 'relatorios.dre_detalhada.ver' },
    { label: 'Comissão de Produção', to: '/comissao-producao', icon: 'pi-percentage', perm: 'comissao_producao.ver' },
  ],

}
