// src/services/config.js
export const AppConfig = {
  TIMEOUT: 10000,
  STORAGE_KEYS: {
    TOKEN: 'ACASA_TOKEN',
    USER: 'ACASA_USER',
  },

  // ✅ Fonte única para a tela de Permissões (igual seed)
  PERMISSIONS_MAP: {
    // Operacional
    agendamentos: [
      { nome: 'Visualizar', chave: 'agendamentos.ver' },
      { nome: 'Criar', chave: 'agendamentos.criar' },
      { nome: 'Editar', chave: 'agendamentos.editar' },
      { nome: 'Excluir', chave: 'agendamentos.excluir' },
    ],

vendas: [
  { nome: 'Visualizar', chave: 'vendas.ver' },
  { nome: 'Criar', chave: 'vendas.criar' },
  { nome: 'Editar', chave: 'vendas.editar' },
  { nome: 'Excluir', chave: 'vendas.excluir' },
],


    orcamentos: [
      { nome: 'Visualizar', chave: 'orcamentos.ver' },
      { nome: 'Criar', chave: 'orcamentos.criar' },
      { nome: 'Editar', chave: 'orcamentos.editar' },
      { nome: 'Excluir', chave: 'orcamentos.excluir' },
    ],

    producao: [
      { nome: 'Visualizar', chave: 'producao.ver' },
      { nome: 'Criar', chave: 'producao.criar' },
      { nome: 'Editar', chave: 'producao.editar' },
      { nome: 'Excluir', chave: 'producao.excluir' },
    ],

    plano_corte: [
      { nome: 'Visualizar', chave: 'plano_corte.ver' },
      { nome: 'Criar', chave: 'plano_corte.criar' },
      { nome: 'Editar', chave: 'plano_corte.editar' },
      { nome: 'Excluir', chave: 'plano_corte.excluir' },      
    ],

    // Financeiro
    cheques: [
      { nome: 'Visualizar', chave: 'cheques.ver' },
      { nome: 'Criar', chave: 'cheques.criar' },
      { nome: 'Editar', chave: 'cheques.editar' },
      { nome: 'Excluir', chave: 'cheques.excluir' },
    ],

    fechamento_fornecedor: [
  { nome: 'Criar', chave: 'fechamento_fornecedor.criar' },
],


    contas_pagar: [
      { nome: 'Visualizar', chave: 'contas_pagar.ver' },
      { nome: 'Criar', chave: 'contas_pagar.criar' },
      { nome: 'Editar', chave: 'contas_pagar.editar' },
      { nome: 'Excluir', chave: 'contas_pagar.excluir' },
    ],

    contas_receber: [
      { nome: 'Visualizar', chave: 'contas_receber.ver' },
      { nome: 'Criar', chave: 'contas_receber.criar' },
      { nome: 'Editar', chave: 'contas_receber.editar' },
      { nome: 'Excluir', chave: 'contas_receber.excluir' },
    ],

    despesas: [
      { nome: 'Visualizar', chave: 'despesas.ver' },
      { nome: 'Criar', chave: 'despesas.criar' },
      { nome: 'Editar', chave: 'despesas.editar' },
      { nome: 'Excluir', chave: 'despesas.excluir' },
    ],

    compras: [
      { nome: 'Visualizar', chave: 'compras.ver' },
      { nome: 'Criar', chave: 'compras.criar' },
      { nome: 'Editar', chave: 'compras.editar' },
      { nome: 'Excluir', chave: 'compras.excluir' },
    ],

    // Cadastros
    clientes: [
      { nome: 'Visualizar', chave: 'clientes.ver' },
      { nome: 'Criar', chave: 'clientes.criar' },
      { nome: 'Editar', chave: 'clientes.editar' },
      { nome: 'Excluir', chave: 'clientes.excluir' },
    ],

    fornecedores: [
      { nome: 'Visualizar', chave: 'fornecedores.ver' },
      { nome: 'Criar', chave: 'fornecedores.criar' },
      { nome: 'Editar', chave: 'fornecedores.editar' },
      { nome: 'Excluir', chave: 'fornecedores.excluir' },
    ],

    produtos: [
      { nome: 'Visualizar', chave: 'produtos.ver' },
      { nome: 'Criar', chave: 'produtos.criar' },
      { nome: 'Editar', chave: 'produtos.editar' },
      { nome: 'Excluir', chave: 'produtos.excluir' },
    ],

    funcionarios: [
      { nome: 'Visualizar', chave: 'funcionarios.ver' },
      { nome: 'Criar', chave: 'funcionarios.criar' },
      { nome: 'Editar', chave: 'funcionarios.editar' },
      { nome: 'Excluir', chave: 'funcionarios.excluir' },
    ],

    // Configurações
    usuarios: [
      { nome: 'Visualizar', chave: 'usuarios.ver' },
      { nome: 'Criar', chave: 'usuarios.criar' },
      { nome: 'Editar', chave: 'usuarios.editar' },
      { nome: 'Excluir', chave: 'usuarios.excluir' },
    ],

    permissoes: [
      { nome: 'Visualizar', chave: 'permissoes.ver' },
      { nome: 'Gerenciar', chave: 'permissoes.gerenciar' },
    ],

    configuracoes: [
      { nome: 'Visualizar', chave: 'configuracoes.ver' },
      { nome: 'Editar', chave: 'configuracoes.editar' },
    ],

    // RH / Ponto
    ponto_relatorio: [
      { nome: 'Visualizar', chave: 'ponto_relatorio.ver' },
      { nome: 'Editar', chave: 'ponto_relatorio.editar' },
    ],
    ponto_convite: [
      { nome: 'Criar', chave: 'ponto_convite.criar' },
      { nome: 'Excluir', chave: 'ponto_convite.excluir' },
    ],
  },
}
