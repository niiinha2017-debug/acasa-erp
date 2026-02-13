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
    key: 'operacional',
    label: 'Operacional',
    items: [
      {
        label: 'Agendamentos',
        to: '/agendamentos',
        icon: 'pi-calendar',
        perm: 'agendamentos.ver',
      },
      { divider: true, label: '', to: '' },
      {
        label: 'Vendas',
        to: '/vendas',
        icon: 'pi-cart-plus',
        perm: 'vendas.ver',
      },
      {
        label: 'Orcamentos',
        to: '/orcamentos',
        icon: 'pi-file-edit',
        perm: 'orcamentos.ver',
      },
      { divider: true, label: '', to: '' },
      {
        label: 'Producao',
        to: '/producao',
        icon: 'pi-cogs',
        perm: 'producao.ver',
      },
      {
        label: 'Plano de Corte',
        to: '/plano-corte',
        icon: 'pi-sitemap',
        perm: 'plano_corte.ver',
      },
      {
        label: 'Itens do Plano de Corte',
        to: '/plano-corte/itens',
        icon: 'pi-box',
        perm: 'plano_corte.ver',
      },
      {
        label: 'Plano de Corte (Metragem)',
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
        perm: 'permissoes.gerenciar',
      },
      { divider: true, label: '', to: '' },
      {
        label: 'Ponto (Relatorio)',
        to: '/rh/ponto/relatorio',
        icon: 'pi-clock',
        perm: 'ponto_relatorio.ver',
      },
      {
        label: 'Convites de Ponto',
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
    key: 'dashboard',
    label: 'Dashboard',
    items: [
      {
        label: 'Dashboard',
        to: '/analytics/fluxocaixa',
        icon: 'pi-chart-bar',
        perm: 'dashboard.visualizar',
      },
    ],
  },
];
