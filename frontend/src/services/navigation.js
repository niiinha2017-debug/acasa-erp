// src/services/navigation.js
export const NAV_SCHEMA = {
  comercial: [
    { label: 'Orçamento', to: '/orcamentos', icon: 'pi-file-edit', perm: 'orcamentos.ver' },
    { label: 'Venda', to: '/vendas', icon: 'pi-cart-plus', perm: 'vendas.ver' },
    { label: 'Contrato', to: '/contratos', icon: 'pi-file', perm: 'contratos.ver' },
    { label: 'Cláusulas (Orç./Contrato)', to: '/contratos/clausulas', icon: 'pi-file-edit', perm: 'orcamentos.editar' },
  ],

  producao: [
    { label: 'Plano de corte', to: '/plano-corte', icon: 'pi-sitemap', perm: 'plano_corte.ver' },
    { label: 'Produtos plano de corte', to: '/plano-corte/itens', icon: 'pi-box', perm: 'plano_corte.ver' },
    { label: 'Venda plano de corte', to: '/plano-corte/venda', icon: 'pi-dollar', perm: 'plano_corte.criar' },
  ],

  financeiro: [
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
    { label: 'Usuarios', to: '/configuracoes/usuarios', icon: 'pi-user', perm: 'usuarios.ver' },
    { label: 'Permissoes', to: '/configuracoes/permissoes', icon: 'pi-lock', perm: 'permissoes.gerenciar' },
    { divider: true },
    { label: 'Ponto (Registros)', to: '/rh/ponto/relatorio', icon: 'pi-stopwatch', perm: 'ponto_relatorio.ver' },
    { label: 'Convites de Ponto', to: '/rh/ponto/convites', icon: 'pi-link', perm: 'ponto_convite.criar' },
    { divider: true },
    { label: 'Cadastro da Empresa', to: '/configuracoes/configuracoes', icon: 'pi-sliders-h', perm: 'configuracoes.empresa.ver' },
  ],

  relatorios: [
    { label: 'Relatórios', to: '/relatorios', icon: 'pi-chart-bar', perm: 'dashboard.visualizar' },
  ],
}
