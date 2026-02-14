import api from './api'
import { getBaseOriginFromApi } from '@/utils/url'


const base = getBaseOriginFromApi(api)


// ✅ GLOBAL: ARQUIVOS
export { ArquivosService } from './arquivos.service'

// --- AUTH ---
export const AuthService = {
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  esqueciSenha: (email) => api.post('/auth/esqueci-senha', { email }),
  reenviarSenhaProvisoria: (email) =>
    api.post('/auth/reenviar-senha-provisoria', { email }),
  alterarSenha: (senha_atual, senha_nova) =>
    api.post('/auth/alterar-senha', { senha_atual, senha_nova }),
}

// --- SERVIÇO DE E-MAIL (TESTES E NOTIFICAÇÕES) ---
export const MailService = {
  enviarTeste: (email) => api.get('/mail/teste', { params: { para: email } }),
}

// --- SERVIÇO DE CLIENTES ---
export const ClienteService = {
  listar: () => api.get('/clientes'),
  buscar: (id) => api.get(`/clientes/${id}`),
  salvar: (id, dados) => (id ? api.put(`/clientes/${id}`, dados) : api.post('/clientes', dados)),
  remover: (id) => api.delete(`/clientes/${id}`),
  select: (q) => api.get('/clientes/select', { params: q ? { q } : {} }),
  getAniversariantes: (data, enviar) =>
    api.get('/clientes/relatorios/aniversariantes', { params: { data, enviar } }),
  getPipeline: () => api.get('/clientes/pipeline'),
}

// --- SERVIÇO DE COMPRAS ---
export const CompraService = {
  listar: (filtros = {}) => api.get('/compras', { params: filtros }),
  buscar: (id) => api.get(`/compras/${id}`),
  salvar: (id, dados) => (id ? api.put(`/compras/${id}`, dados) : api.post('/compras', dados)),
  remover: (id) => api.delete(`/compras/${id}`),
}

// --- SERVIÇO DE DESPESAS ---
export const DespesaService = {
  listar: (filtros = {}) => api.get('/despesas', { params: filtros }),
  buscar: (id) => api.get(`/despesas/${id}`),
  salvar: (id, dados) => (id ? api.put(`/despesas/${id}`, dados) : api.post('/despesas', dados)),
  atualizarRecorrencia: (recorrenciaId, dados) =>
    api.put(`/despesas/recorrencia/${recorrenciaId}`, dados),
  remover: (id) => api.delete(`/despesas/${id}`),
  removerRecorrencia: (recorrenciaId) => api.delete(`/despesas/recorrencia/${recorrenciaId}`),
}

// --- SERVIÇO DE FORNECEDOR ---
export const FornecedorService = {
  listar: () => api.get('/fornecedor'),
  buscar: (id) => api.get(`/fornecedor/${id}`),
  salvar: (id, dados) => (id ? api.put(`/fornecedor/${id}`, dados) : api.post('/fornecedor', dados)),
  remover: (id) => api.delete(`/fornecedor/${id}`),
  select: (q) => api.get('/fornecedor/select', { params: q ? { q } : {} }),

}

// --- SERVIÇO DE FUNCIONÁRIOS (SOMENTE ADMIN) ---
const sanitizeFuncionarioId = (id) => {
  const clean = String(id ?? '').replace(/\D/g, '')
  return clean || null
}

export const FuncionariosService = {
  listar: () => api.get('/funcionarios'),

  buscarPorId(id) {
    const cleanId = sanitizeFuncionarioId(id)
    if (!cleanId) return Promise.reject(new Error('ID não fornecido'))
    return api.get(`/funcionarios/${cleanId}`)
  },

  buscar(id) {
    return FuncionariosService.buscarPorId(id)
  },

  criar(dados) {
    if (!dados || typeof dados !== 'object') {
      return Promise.reject(new Error('Dados não informados'))
    }
    return api.post('/funcionarios', dados)
  },

  atualizar(id, dados) {
    if (!dados || typeof dados !== 'object') {
      return Promise.reject(new Error('Dados não informados'))
    }
    const cleanId = sanitizeFuncionarioId(id)
    if (!cleanId) return Promise.reject(new Error('ID inválido'))
    return api.put(`/funcionarios/${cleanId}`, dados)
  },

  salvar(id, dados) {
    return id && id !== 'novo'
      ? FuncionariosService.atualizar(id, dados)
      : FuncionariosService.criar(dados)
  },

  remover(id) {
    const cleanId = sanitizeFuncionarioId(id)
    if (!cleanId) return Promise.reject(new Error('ID inválido'))
    return api.delete(`/funcionarios/${cleanId}`)
  },

  gerarPdf(ids) {
    if (!Array.isArray(ids) || !ids.length) {
      return Promise.reject(new Error('IDs não informados'))
    }
    return api.post('/funcionarios/pdf', { ids })
  },

  gerarPdfESalvar(ids) {
    return FuncionariosService.gerarPdf(ids)
  },

  select: (q) => api.get('/funcionarios/select', { params: q ? { q } : {} }),

  async reenviarSenhaProvisoria(alvo) {
    const candidate =
      typeof alvo === 'object' && alvo !== null ? alvo.email ?? alvo?.usuario?.email : alvo

    if (typeof candidate === 'string' && candidate.includes('@')) {
      return AuthService.reenviarSenhaProvisoria(candidate)
    }

    const cleanId = sanitizeFuncionarioId(alvo)
    if (!cleanId) {
      return Promise.reject(new Error('Identificador inválido para reenviar senha provisória'))
    }

    const resposta = await FuncionariosService.buscarPorId(cleanId)
    const dados = resposta?.data ?? resposta
    const email = dados?.email ?? dados?.usuario?.email

    if (!email) {
      return Promise.reject(new Error('E-mail do funcionário não encontrado'))
    }

    return AuthService.reenviarSenhaProvisoria(email)
  },

  renviarSenhaProvisoria(alvo) {
    return FuncionariosService.reenviarSenhaProvisoria(alvo)
  },
}

export const FuncionarioService = FuncionariosService












// --- ORÇAMENTOS ---
export const OrcamentosService = {
  listar: () => api.get('/orcamentos'),
  detalhar: (id) => api.get(`/orcamentos/${id}`),
  criar: (dados) => api.post('/orcamentos', dados),
  atualizar: (id, dados) => api.put(`/orcamentos/${id}`, dados),
  remover: (id) => api.delete(`/orcamentos/${id}`),
  salvar: (id, dados) => (id ? api.put(`/orcamentos/${id}`, dados) : api.post('/orcamentos', dados)),

  adicionarItem: (id, item) => api.post(`/orcamentos/${id}/itens`, item),
  atualizarItem: (id, itemId, item) => api.put(`/orcamentos/${id}/itens/${itemId}`, item),
  removerItem: (id, itemId) => api.delete(`/orcamentos/${id}/itens/${itemId}`),

  // PDF (continua existindo)
abrirPdf: (id) => {
  const cleanId = String(id || '').replace(/\D/g, '')
  return api.post(`/orcamentos/${cleanId}/pdf`) // retorna { arquivoId }
},


}

// --- PLANO DE CORTE ---
export const PlanoCorteService = {
  listar: () => api.get('/plano-corte'),
  buscar: (id) => api.get(`/plano-corte/${id}`),
  salvar: (id, dados) => (id ? api.put(`/plano-corte/${id}`, dados) : api.post('/plano-corte', dados)),
  remover: (id) => api.delete(`/plano-corte/${id}`),
  abrirPdf: (id) => api.post(`/plano-corte/${id}/pdf`),

  itens: {
    listar: (fornecedorId) =>
      api.get('/plano-corte-itens', {
        params: fornecedorId != null ? { fornecedor_id: fornecedorId } : {},
      }),
    buscar: (id) => api.get(`/plano-corte-itens/${id}`),
    salvar: (id, dados) => (id ? api.put(`/plano-corte-itens/${id}`, dados) : api.post('/plano-corte-itens', dados)),
    remover: (id) => api.delete(`/plano-corte-itens/${id}`),
  },

  consumos: {
    listar: () => api.get('/plano-corte-consumos'),
    buscar: (id) => api.get(`/plano-corte-consumos/${id}`),
    registrar: (dados) => api.post('/plano-corte-consumos', dados),
    remover: (id) => api.delete(`/plano-corte-consumos/${id}`),
  },
}

// --- PRODUTOS ---
export const ProdutosService = {
  listar: (filtros = {}) => api.get('/produtos', { params: filtros }),
  buscar: (id) => api.get(`/produtos/${id}`),
  salvar: (id, dados) => (id ? api.put(`/produtos/${id}`, dados) : api.post('/produtos', dados)),
  remover: (id) => api.delete(`/produtos/${id}`),
}

// --- USUÁRIOS ---
export const UsuariosService = {
  listar: () => api.get('/usuarios'),
  buscar: (id) => api.get(`/usuarios/${id}`),
  salvar: (id, dados) => (id ? api.put(`/usuarios/${id}`, dados) : api.post('/usuarios', dados)),
  remover: (id) => api.delete(`/usuarios/${id}`),
  atualizarStatus: (id, status) => api.put(`/usuarios/${id}/status`, { status }),
}

// --- VENDAS ---
export const VendaService = {
  listar: () => api.get('/vendas'),
  buscar: (id) => api.get(`/vendas/${id}`),
  salvar: (id, dados) => (id ? api.put(`/vendas/${id}`, dados) : api.post('/vendas', dados)),
  remover: (id) => api.delete(`/vendas/${id}`),
  atualizarStatus: (id, status) => api.put(`/vendas/${id}/status`, { status }),

  enviarParaProducao: (id) => api.post(`/vendas/${id}/enviar-producao`),

  atualizarItem: (vendaId, itemId, dados) => api.put(`/vendas/${vendaId}/itens/${itemId}`, dados),

  listarAmbientes: (id) => api.get(`/vendas/${id}/ambientes`),
}

// --- CONTRATOS ---
export const ContratosService = {
  listar: () => api.get('/contratos'),
  buscar: (id) => api.get(`/contratos/${id}`),
  salvar: (id, dados) => (id ? api.put(`/contratos/${id}`, dados) : api.post('/contratos', dados)),
  remover: (id) => api.delete(`/contratos/${id}`),
}

// --- PERMISSÕES ---
export const PermissoesService = {
  listar: () => api.get('/permissoes'),
  listarDoUsuario: (id) => api.get(`/usuarios/${id}/permissoes`),
  definirParaUsuario: (id, permissoesIds = []) => api.put(`/usuarios/${id}/permissoes`, { permissoes: permissoesIds }),
  menu: () => api.get('/permissoes/menu'),
}

// --- FINANCEIRO ---
export const FinanceiroService = {
  listarPagar: (filtros = {}) =>
    api.get('/financeiro/contas-pagar/fechamentos', { params: filtros }),

  listarPagarConsolidado: (filtros = {}) =>
    api.get('/financeiro/contas-pagar', { params: filtros }),
  listarContasPagarConsolidado: (filtros = {}) =>
    api.get('/financeiro/contas-pagar', { params: filtros }),

  buscarContaPagar: (id) => api.get(`/financeiro/contas-pagar/${id}`),
  criarContaPagar: (dados) => api.post('/financeiro/contas-pagar', dados),
  atualizarContaPagar: (id, dados) => api.put(`/financeiro/contas-pagar/${id}`, dados),

  pagarContaPagar: (id, dados) => api.post(`/financeiro/contas-pagar/${id}/pagar`, dados),
  pagarTitulo: (tituloId) => api.post(`/financeiro/contas-pagar/titulo/${tituloId}/pagar`),
  pagarDespesa: (despesaId) => api.post(`/financeiro/contas-pagar/despesa/${despesaId}/pagar`),

  // ✅ NOVO: etapa 1 do modal (preview)
  previewFechamentoFornecedor: (params) =>
    api.get('/financeiro/contas-pagar/preview-fechamento', { params }),

  // ✅ NOVO: etapa 2 do modal (fecha mês + cria títulos)
  fecharMesFornecedor: (dados) =>
    api.post('/financeiro/contas-pagar/fechar-mes', dados),

  // --- RECEBER (mantém) ---
  listarReceber: (filtros = {}) => api.get('/financeiro/contas-receber', { params: filtros }),
  buscarReceber: (id) => api.get(`/financeiro/contas-receber/${id}`),
  criarReceber: (dados) => api.post('/financeiro/contas-receber', dados),
  atualizarReceber: (id, dados) => api.put(`/financeiro/contas-receber/${id}`, dados),
  receber: (id, dados) => api.post(`/financeiro/contas-receber/${id}/receber`, dados),
}



// --- CONFIGURAÇÃO ---
export const ConfiguracaoService = {
  async carregar() {
    const { data } = await api.get('/configuracoes/empresa')
    return data
  },
  async salvar(dados) {
    const { data } = await api.put('/configuracoes/empresa', dados)
    return data
  },
}

// --- OBRAS ---
export const ObrasService = {
  criar: (dados) => api.post('/obras', dados),
  buscar: (id) => api.get(`/obras/${id}`),
  listarPorCliente: (clienteId) => api.get(`/obras/cliente/${clienteId}`),
  salvar: (id, dados) => (id ? api.put(`/obras/${id}`, dados) : api.post('/obras', dados)),
}

// --- PONTO ---
export const PontoRelatorioService = {
  listarFuncionariosAtivos: () =>
    api.get('/ponto/relatorio/funcionarios'),

  listarRegistros: (filtros = {}) =>
    api.get('/ponto/relatorio/registros', { params: filtros }),

  pdfMensal: (params) =>
    api.get('/ponto/relatorio/pdf', { params, responseType: 'blob' }),

  // ✅ padrão do sistema: gera+salva e retorna { arquivoId }
  pdfMensalSalvar: (payload) =>
    api.post('/ponto/relatorio/pdf', payload),
}



export const PontoService = { gerarConvite: (funcionario_id) => 
  api.post('/ponto/convites', { funcionario_id }),
 }

export const PontoRegistrosService = {
  salvar: (payload) =>
    api.post('/ponto/registros', payload),

  atualizar: (id, payload) =>
    api.put(`/ponto/registros/${id}`, payload),

  remover: (id) =>
    api.delete(`/ponto/registros/${id}`),
}

export const PontoJustificativasService = {
  listar: (params = {}) =>
    api.get('/ponto/justificativas', { params }),

  salvar: (payload) =>
    api.put('/ponto/justificativas', payload),

  remover: (id) =>
    api.delete(`/ponto/justificativas/${id}`),
}

export const AgendaService = {
  // Buscar todos (com filtro opcional de data)
  listarTodos(inicio, fim) {
    return api.get('/agenda', { params: { inicio, fim } });
  },

  // Criar novo agendamento
  criar(dados) {
    return api.post('/agenda', dados);
  },

  // Buscar agenda do marceneiro
  buscarPorFuncionario(id) {
    return api.get(`/agenda/funcionario/${id}`);
  },

  // Atualizar status (Finalizar)
  atualizarStatus(id, status) {
    return api.patch(`/agenda/${id}/status`, { status });
  },

  // Deletar
  excluir(id) {
    return api.delete(`/agenda/${id}`);
  }
};
