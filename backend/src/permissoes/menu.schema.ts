export type MenuItem = {
  label: string;
  to: string;
  icon?: string;
  perm?: string;
  divider?: boolean;
};

export type MenuSection = {
  key: string;
  label: string;
  items: MenuItem[];
};

export const MENU_SECTIONS: MenuSection[] = [
  {
    key: 'comercial',
    label: 'Comercial',
    items: [
      {
        label: 'Acompanhamento de status',
        to: '/relatorios/acompanhamento-status',
        icon: 'pi-list-check',
        perm: 'relatorios.acompanhamento_status.ver',
      },
      {
        label: 'Orçamento',
        to: '/orcamentos',
        icon: 'pi-file-edit',
        perm: 'orcamentos.ver',
      },
      {
        label: 'Fechamento de venda',
        to: '/vendas/fechamento',
        icon: 'pi-shopping-cart',
        perm: 'vendas.criar',
      },
      {
        label: 'Contrato',
        to: '/contratos',
        icon: 'pi-file',
        perm: 'contratos.ver',
      },
      {
        label: 'Histórico de Contratos',
        to: '/contratos/historico',
        icon: 'pi-history',
        perm: 'contratos.ver',
      },
      {
        label: 'Cláusulas (Orç./Contrato)',
        to: '/contratos/clausulas',
        icon: 'pi-file-edit',
        perm: 'contratos.clausulas.editar',
      },
      {
        label: 'Agenda de Venda',
        to: '/agendamentos/loja',
        icon: 'pi-calendar-clock',
        perm: 'agendamentos.vendas',
      },
      {
        label: 'Medição Fina',
        to: '/producao/medicao-fina',
        icon: 'pi-ruler',
        perm: 'agendamentos.vendas',
      },
    ],
  },
  {
    key: 'producao',
    label: 'Produção',
    items: [
      {
        label: 'Visão geral',
        to: '/producao',
        icon: 'pi-cogs',
        perm: 'posvenda.ver',
      },
      {
        label: 'Contratos em obra',
        to: '/producao/contratos',
        icon: 'pi-file-edit',
        perm: 'contratos.ver',
      },
      {
        label: 'Pós-venda',
        to: '/vendas',
        icon: 'pi-cart-plus',
        perm: 'posvenda.ver',
      },
      {
        label: 'Agenda de Produção',
        to: '/agendamentos/fabrica',
        icon: 'pi-calendar-clock',
        perm: 'agendamentos.producao',
      },
      {
        label: 'Plano de corte',
        to: '/plano-corte',
        icon: 'pi-sitemap',
        perm: 'plano_corte.ver',
      },
      {
        label: 'Produtos Serviço de Corte',
        to: '/plano-corte/itens',
        icon: 'pi-box',
        perm: 'plano_corte.ver',
      },
      {
        label: 'Venda Serviço de Corte',
        to: '/plano-corte/venda',
        icon: 'pi-ruler',
        perm: 'plano_corte.criar',
      },
    ],
  },
  {
    key: 'financeiro',
    label: 'Financeiro',
    items: [
      {
        label: 'Administração Financeira',
        to: '/financeiro/administracao',
        icon: 'pi-wallet',
        perm: 'contas_pagar.ver',
      },
      {
        label: 'Contas a Pagar',
        to: '/financeiro/contas-pagar',
        icon: 'pi-arrow-down-right',
        perm: 'contas_pagar.ver',
      },
      {
        label: 'Contas a Receber',
        to: '/financeiro/contas-receber',
        icon: 'pi-arrow-up-right',
        perm: 'contas_receber.ver',
      },
      {
        label: 'Custos de Estrutura',
        to: '/financeiro/custos-estrutura',
        icon: 'pi-building',
        perm: 'custos_estrutura.ver',
      },
      { divider: true, label: '', to: '' },
      {
        label: 'Despesas Gerais',
        to: '/despesas',
        icon: 'pi-wallet',
        perm: 'despesas.ver',
      },
      {
        label: 'Compras',
        to: '/compras',
        icon: 'pi-shopping-cart',
        perm: 'compras.ver',
      },
    ],
  },
  {
    key: 'cadastros',
    label: 'Cadastros',
    items: [
      {
        label: 'Clientes',
        to: '/clientes',
        icon: 'pi-users',
        perm: 'clientes.ver',
      },
      {
        label: 'Fornecedores',
        to: '/fornecedor',
        icon: 'pi-truck',
        perm: 'fornecedores.ver',
      },
      {
        label: 'Produtos',
        to: '/produtos',
        icon: 'pi-tag',
        perm: 'produtos.ver',
      },
      {
        label: 'Funcionarios',
        to: '/funcionarios',
        icon: 'pi-id-card',
        perm: 'funcionarios.ver',
      },
    ],
  },
  {
    key: 'configuracoes',
    label: 'Configuracoes',
    items: [
      {
        label: 'Usuarios',
        to: '/configuracoes/usuarios',
        icon: 'pi-user',
        perm: 'usuarios.ver',
      },
      {
        label: 'Permissoes',
        to: '/configuracoes/permissoes',
        icon: 'pi-lock',
        perm: 'permissoes.ver',
      },
      { divider: true, label: '', to: '' },
      {
        label: 'Ponto (Relatorio)',
        to: '/rh/ponto/relatorio',
        icon: 'pi-stopwatch',
        perm: 'ponto_relatorio.ver',
      },
      {
        label: 'Convites do Ponto',
        to: '/rh/ponto/convites',
        icon: 'pi-link',
        perm: 'ponto_convite.criar',
      },
      { divider: true, label: '', to: '' },
      {
        label: 'Cadastro da Empresa',
        to: '/configuracoes/configuracoes',
        icon: 'pi-sliders-h',
        perm: 'configuracoes.empresa.ver',
      },
    ],
  },
  {
    key: 'relatorios',
    label: 'Relatórios',
    items: [
      {
        label: 'Relatórios',
        to: '/relatorios',
        icon: 'pi-chart-bar',
        perm: 'dashboard.visualizar',
      },
      {
        label: 'DRE Mensal',
        to: '/relatorios/dre-mensal',
        icon: 'pi-chart-line',
        perm: 'relatorios.dre_mensal.ver',
      },
      {
        label: 'DRE Detalhada',
        to: '/relatorios/dre-detalhada',
        icon: 'pi-chart-pie',
        perm: 'relatorios.dre_detalhada.ver',
      },
      {
        label: 'Comissão de Produção',
        to: '/comissao-producao',
        icon: 'pi-percentage',
        perm: 'comissao_producao.ver',
      },
    ],
  },
];
