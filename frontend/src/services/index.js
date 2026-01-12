import api from './api'

export const AuthService = {
  login: (credentials) => api.post('/auth/login', credentials),
  me: () => api.get('/auth/me'),
}

export const ClienteService = {
  listar: () => api.get('/clientes'),
  buscar: (id) => api.get(`/clientes/${id}`),
  salvar: (id, dados) => id ? api.put(`/clientes/${id}`, dados) : api.post('/clientes', dados),
  remover: (id) => api.delete(`/clientes/${id}`),
  getAniversariantes: (data) => api.get('/clientes/relatorios/aniversariantes', { params: { data } })
}
export const CompraService = {
  // Passamos os filtros como objeto que o Axios transforma em Query Params
  listar: (filtros = {}) => api.get('/compras', { params: filtros }),
  buscar: (id) => api.get(`/compras/${id}`),
  salvar: (id, dados) => id ? api.put(`/compras/${id}`, dados) : api.post('/compras', dados),
  remover: (id) => api.delete(`/compras/${id}`)
}

// --- SERVIÇO DE CONSTANTES (CONFIGURAÇÕES DO SISTEMA) ---
export const ConstanteService = {
  listar: (filtros = {}) => {
    return api.get('/constantes', { params: filtros })
  },
  buscar: (id) => api.get(`/constantes/${id}`),
  salvar: (id, dados) => {
    return id ? api.patch(`/constantes/${id}`, dados) : api.post('/constantes', dados)
  },
  remover: (id) => api.delete(`/constantes/${id}`)
}


// --- SERVIÇO DE DESPESAS (FINANCEIRO) ---
export const DespesaService = {
  listar: () => api.get('/despesas'),
  buscar: (id) => api.get(`/despesas/${id}`),
  salvar: (id, dados) => {
    return id ? api.put(`/despesas/${id}`, dados) : api.post('/despesas', dados)
  },
  remover: (id) => api.delete(`/despesas/${id}`)
}


// --- SERVIÇO DE FORNECEDORES ---
export const FornecedorService = {
  listar: () => api.get('/fornecedores'),
  buscar: (id) => api.get(`/fornecedores/${id}`),
  salvar: (id, dados) => id ? api.put(`/fornecedores/${id}`, dados) : api.post('/fornecedores', dados),
  remover: (id) => api.delete(`/fornecedores/${id}`)
}

// --- SERVIÇO DE FUNCIONÁRIOS (SOMENTE ADMIN) ---
export const FuncionarioService = {
  listar: () => api.get('/funcionarios'),
  
  buscar: (id) => {
    // Se o ID for null ou undefined, nem tenta a requisição
    if (!id) return Promise.reject('ID não fornecido');
    const cleanId = String(id).replace(/\D/g, ''); 
    return api.get(`/funcionarios/${cleanId}`);
  },

  salvar: (id, dados) => {
    // Se existir ID, é edição (PUT), se não, é criação (POST)
    if (id && id !== 'novo') {
      const cleanId = String(id).replace(/\D/g, '');
      return api.put(`/funcionarios/${cleanId}`, dados);
    }
    return api.post('/funcionarios', dados);
  },

  remover: (id) => {
    const cleanId = String(id).replace(/\D/g, '');
    return api.delete(`/funcionarios/${cleanId}`);
  }
}

// --- SERVIÇO DE E-MAIL (TESTES E NOTIFICAÇÕES) ---
export const MailService = {
  enviarTeste: (email) => api.get('/mail/teste', { params: { para: email } })
}

// --- SERVIÇO DE ORÇAMENTOS (ITENS, ARQUIVOS E PDF) ---
export const OrcamentosService = {
  listar: () => api.get('/orcamentos'),
  detalhar: (id) => api.get(`/orcamentos/${id}`),
  salvar: (id, dados) => id ? api.put(`/orcamentos/${id}`, dados) : api.post('/orcamentos', dados),
  remover: (id) => api.delete(`/orcamentos/${id}`),

  // Gestão de Itens dentro do Orçamento
  adicionarItem: (id, item) => api.post(`/orcamentos/${id}/itens`, item),
  atualizarItem: (id, itemId, item) => api.put(`/orcamentos/${id}/itens/${itemId}`, item),
  removerItem: (id, itemId) => api.delete(`/orcamentos/${id}/itens/${itemId}`),

  // Upload de Arquivos (Usa FormData para o FileInterceptor)
  anexarArquivo: (id, arquivo) => {
    const fd = new FormData();
    fd.append('arquivo', arquivo);
    return api.post(`/orcamentos/${id}/arquivos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  // Abertura do PDF Blindado
  abrirPdf: (id) => window.open(`${api.defaults.baseURL}/orcamentos/${id}/pdf`, '_blank')
}

// --- SERVIÇO DE PLANO DE CORTE (PRODUÇÃO / ENGENHARIA) ---
export const PlanoCortesService = {
  listar: () => api.get('/plano-corte'),
  buscar: (id) => api.get(`/plano-corte/${id}`),
  salvar: (id, dados) => id ? api.put(`/plano-corte/${id}`, dados) : api.post('/plano-corte', dados),
  remover: (id) => api.delete(`/plano-corte/${id}`)
}

// --- SERVIÇO DE CONSUMO DE MATERIAIS (BAIXA DE ESTOQUE) ---
export const ConsumoService = {
  listar: () => api.get('/plano-corte-consumos'),
  buscar: (id) => api.get(`/plano-corte-consumos/${id}`),
  registrar: (dados) => api.post('/plano-corte-consumos', dados),
  remover: (id) => api.delete(`/plano-corte-consumos/${id}`)
}

// --- SERVIÇO DE ITENS DO PLANO DE CORTE (PEÇAS E MATERIAIS) ---
export const PlanoCorteItemService = {
  listar: (fornecedorId) => api.get('/plano-corte-itens', { params: { fornecedor_id: fornecedorId } }),
  salvar: (id, dados) => id ? api.put(`/plano-corte-itens/${id}`, dados) : api.post('/plano-corte-itens', dados),
  remover: (id) => api.delete(`/plano-corte-itens/${id}`)
}

// --- SERVIÇO DE PRODUÇÃO E TAREFAS (CHÃO DE FÁBRICA) ---
export const ProducaosService = {
  // Agenda e Fluxo
  getAgenda: (inicio, fim) => api.get('/producao/agenda', { params: { inicio, fim } }),
  encaminhar: (dados) => api.post('/producao/encaminhar', dados),

  // Gestão de Tarefas (CRUD)
  tarefas: {
    criar: (dados) => api.post('/producao/tarefas', dados),
    atualizar: (id, dados) => api.put(`/producao/tarefas/${id}`, dados),
    remover: (id) => api.delete(`/producao/tarefas/${id}`)
  }
}

// --- SERVIÇO DE PRODUTOS (ESTOQUE E MATERIAIS) ---
export const ProdutosService = {
  listar: () => api.get('/produtos'),
  buscar: (id) => api.get(`/produtos/${id}`),
  salvar: (id, dados) => id ? api.put(`/produtos/${id}`, dados) : api.post('/produtos', dados),
  remover: (id) => api.delete(`/produtos/${id}`)
}

// --- SERVIÇO DE RECUPERAÇÃO DE SENHA ---
export const RecuperacaoService = {
  solicitar: (email) => api.post('/recuperacao-senha/solicitar', { email }),
  confirmar: (token, senhaNova) => api.post('/recuperacao-senha/confirmar', { token, senha_nova: senhaNova })
}
// --- SERVIÇO DE USUÁRIOS DO SISTEMA (CONTROLE DE ACESSO ADMIN) ---
export const UsuariosService = {
  listar: () => api.get('/usuarios'),
  buscar: (id) => api.get(`/usuarios/${id}`),
  salvar: (id, dados) => id ? api.put(`/usuarios/${id}`, dados) : api.post('/usuarios', dados),
  remover: (id) => api.delete(`/usuarios/${id}`),
  
  // Ações específicas de status (Ativar/Desativar)
  atualizarStatus: (id, status) => api.put(`/usuarios/${id}/status`, { status })
}

// --- SERVIÇO DE VENDAS (PEDIDOS E STATUS) ---
export const VendaService = {
  listar: () => api.get('/vendas'),
  buscar: (id) => api.get(`/vendas/${id}`),
  salvar: (id, dados) => id ? api.put(`/vendas/${id}`, dados) : api.post('/vendas', dados),
  remover: (id) => api.delete(`/vendas/${id}`),
  
  // Alteração rápida de status (Ex: Aprovar Venda, Cancelar, Finalizar)
  atualizarStatus: (id, status) => api.put(`/vendas/${id}/status`, { status })
}

// --- SERVIÇO DE PERMISSÕES (RBAC) ---
export const PermissoesService = {
  // Lista todas as permissões genéricas cadastradas no sistema
  listar: () => api.get('/permissoes'),

  // Busca as permissões específicas de um usuário selecionado
  listarDoUsuario: (id) => api.get(`/usuarios/${id}/permissoes`),

  // Define/Salva o array de chaves de permissão para o usuário
  definirParaUsuario: (id, permissoes) => 
    api.put(`/usuarios/${id}/permissoes`, { permissoes })
}

export const FinanceiroService = {
  listarPagar: (filtros = {}) => api.get('/financeiro/contas-pagar', { params: filtros }),

  buscarContaPagar: (id) => api.get(`/financeiro/contas-pagar/${id}`),
  criarContaPagar: (dados) => api.post('/financeiro/contas-pagar', dados),
  atualizarContaPagar: (id, dados) => api.put(`/financeiro/contas-pagar/${id}`, dados),
  pagarContaPagar: (id, dados) => api.post(`/financeiro/contas-pagar/${id}/pagar`, dados),

  fecharMesFornecedor: (dados) => api.post('/financeiro/fechamento/fornecedor', dados),

  listarReceber: (filtros = {}) => api.get('/financeiro/contas-receber', { params: filtros }),
  buscarReceber: (id) => api.get(`/financeiro/contas-receber/${id}`),
  criarReceber: (dados) => api.post('/financeiro/contas-receber', dados),
  atualizarReceber: (id, dados) => api.put(`/financeiro/contas-receber/${id}`, dados),
  receber: (id, dados) => api.post(`/financeiro/contas-receber/${id}/receber`, dados),

  listarCheques: (filtros = {}) => api.get('/financeiro/cheques', { params: filtros }),
  buscarCheque: (id) => api.get(`/financeiro/cheques/${id}`),
  atualizarStatusCheque: (id, dados) => api.put(`/financeiro/cheques/${id}/status`, dados),
}


export const ConfiguracaoService = {
  async carregar() {
    const { data } = await api.get('/configuracoes/1')
    return data
  },
  async salvar(dados) {
    const { data } = await api.put('/configuracoes/1', dados)
    return data
  }
}
// DELETE aquele bloco "export const financeiroService" que está no final do arquivo!