export const AppConfig = {
  TIMEOUT: 10000,
  STORAGE_KEYS: {
    TOKEN: 'ACASA_TOKEN',
    USER: 'ACASA_USER',
  },
  PERMISSIONS_MAP: {
    clientes: [
      { nome: 'Visualizar', chave: 'clientes.ver' },
      { nome: 'Criar', chave: 'clientes.criar' },
      { nome: 'Editar', chave: 'clientes.editar' },
      { nome: 'Excluir', chave: 'clientes.excluir' },
    ],
    producao: [
      { nome: 'Visualizar', chave: 'producao.ver' },
      { nome: 'Criar', chave: 'producao.criar' },
      { nome: 'Editar', chave: 'producao.editar' },
      { nome: 'Excluir', chave: 'producao.excluir' },
    ]
  },
}
