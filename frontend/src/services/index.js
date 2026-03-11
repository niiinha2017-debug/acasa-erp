import api from './api'

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
  /** Cliente_ids com AGENDAR_MEDIDA_FINA e parcela vencida (Fluxo de Clientes: alerta e bloqueio de agendamento). */
  pendenciasAgendamento: () => api.get('/clientes/relatorios/pendencias-agendamento'),
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
  listarComFuncionario: (filtros = {}) =>
    api.get('/despesas/funcionarios', { params: filtros }),
  pagar: (id) => api.post(`/despesas/${id}/pagar`),
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

  select: (qOrParams) => {
    if (typeof qOrParams === 'string') {
      return api.get('/funcionarios/select', { params: qOrParams ? { q: qOrParams } : {} })
    }
    if (qOrParams && typeof qOrParams === 'object') {
      return api.get('/funcionarios/select', { params: qOrParams })
    }
    return api.get('/funcionarios/select')
  },

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
  aguardandoApresentacao: () => api.get('/orcamentos/aguardando-apresentacao'),
  detalhar: (id) => api.get(`/orcamentos/${id}`),
  criar: (dados) => api.post('/orcamentos', dados),
  atualizar: (id, dados) => api.put(`/orcamentos/${id}`, dados),
  remover: (id) => api.delete(`/orcamentos/${id}`),
  salvar: (id, dados) => (id ? api.put(`/orcamentos/${id}`, dados) : api.post('/orcamentos', dados)),

  adicionarItem: (id, item) => api.post(`/orcamentos/${id}/itens`, item),
  atualizarItem: (id, itemId, item) => api.put(`/orcamentos/${id}/itens/${itemId}`, item),
  removerItem: (id, itemId) => api.delete(`/orcamentos/${id}/itens/${itemId}`),

  // PDF (opts.incluirTermos = true para incluir termos e condições no PDF)
  abrirPdf: (id, opts = {}) => {
    const cleanId = String(id || '').replace(/\D/g, '')
    return api.post(`/orcamentos/${cleanId}/pdf`, opts) // retorna { arquivoId }
  },

  enviarPorWhatsapp: (id) => {
    const cleanId = String(id || '').replace(/\D/g, '')
    return api.post(`/orcamentos/${cleanId}/enviar-whatsapp`)
  },

  salvarClausulas: (id, dados) => {
    const cleanId = String(id || '').replace(/\D/g, '')
    return api.put(`/orcamentos/${cleanId}/clausulas`, dados)
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
  listarAbaixoEstoqueMinimo: () => api.get('/produtos/abaixo-estoque-minimo'),
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
  /** Vendas com contrato vigente – usado no módulo Compras (só clientes com contrato vigente). */
  listarComContratoVigente: () => api.get('/vendas/com-contrato-vigente'),
  aguardandoAgendamento: () => api.get('/vendas/aguardando-agendamento'),
  aguardandoContrato: () => api.get('/vendas/aguardando-contrato'),
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
  listar: (params) => api.get('/contratos', { params: params || {} }),
  buscar: (id) => api.get(`/contratos/${id}`),
  salvar: (id, dados) => (id ? api.put(`/contratos/${id}`, dados) : api.post('/contratos', dados)),
  remover: (id) => api.delete(`/contratos/${id}`),
  assinar: (id, dados) => api.post(`/contratos/${id}/assinar`, dados),
  abrirPdf: (id) => {
    const cleanId = String(id || '').replace(/\D/g, '')
    return api.post(`/contratos/${cleanId}/pdf`)
  },
  /** Visualizar PDF do contrato (assinado, se já tiver sido assinado) – retorna blob para abrir em nova aba */
  verPdf: (id) => api.get(`/contratos/${String(id || '').replace(/\D/g, '')}/pdf`, { responseType: 'blob' }),
  /** Link público temporário (24h) para download do PDF – envio grátis por WhatsApp/e-mail */
  linkPublicoPdf: (id) => api.get(`/contratos/${id}/link-publico`),
  /** Envia o link do contrato por e-mail automaticamente (SMTP do backend) */
  enviarContratoPorEmail: (id) => api.post(`/contratos/${id}/enviar-email`),
  /** Marcar como vigente por assinatura presencial na loja (opcional: arquivo PDF escaneado) */
  vigenteAssinaturaPresencial: (id, file) => {
    const form = new FormData()
    if (file && file instanceof File) form.append('file', file)
    return api.post(`/contratos/${String(id || '').replace(/\D/g, '')}/vigente-assinatura-presencial`, form)
  },
  /** Excluir o PDF do contrato assinado (upload) – permite enviar outro depois */
  excluirPdfAssinado: (id) =>
    api.delete(`/contratos/${String(id || '').replace(/\D/g, '')}/pdf-assinado`),
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
  getContasPagarDashboard: (filtros = {}) =>
    api.get('/financeiro/contas-pagar/dashboard', { params: filtros }),

  buscarContaPagar: (id) => api.get(`/financeiro/contas-pagar/${id}`),
  criarContaPagar: (dados) => api.post('/financeiro/contas-pagar', dados),
  atualizarContaPagar: (id, dados) => api.put(`/financeiro/contas-pagar/${id}`, dados),

  pagarContaPagar: (id, dados) => api.post(`/financeiro/contas-pagar/${id}/pagar`, dados),
  pagarTitulo: (tituloId, dados = {}) => api.post(`/financeiro/contas-pagar/titulo/${tituloId}/pagar`, dados),
  pagarDespesa: (despesaId, dados = {}) => api.post(`/financeiro/contas-pagar/despesa/${despesaId}/pagar`, dados),

  // ✅ NOVO: etapa 1 do modal (preview)
  previewFechamentoFornecedor: (params) =>
    api.get('/financeiro/contas-pagar/preview-fechamento', { params }),

  // ✅ NOVO: etapa 2 do modal (fecha mês + cria títulos)
  fecharMesFornecedor: (dados) =>
    api.post('/financeiro/contas-pagar/fechar-mes', dados),

  // Painel de Obras Vigentes (apenas obras em medição, produção ou montagem)
  painelObrasVigentes: () => api.get('/financeiro/contas-pagar/painel-obras-vigentes'),

  // --- RECEBER (mantém) ---
  listarReceber: (filtros = {}) => api.get('/financeiro/contas-receber', { params: filtros }),
  buscarReceber: (id) => api.get(`/financeiro/contas-receber/${id}`),
  criarReceber: (dados) => api.post('/financeiro/contas-receber', dados),
  atualizarReceber: (id, dados) => api.put(`/financeiro/contas-receber/${id}`, dados),
  receber: (id, dados) => api.post(`/financeiro/contas-receber/${id}/receber`, dados),

  /** DRE Mensal: receita, CPV (materiais + mão de obra), margem e lucro */
  getDreMensal: (params = {}) =>
    api.get('/relatorios/dre-mensal', { params }),
}

// --- Custos de Estrutura (Taxa de Máquina / Custo Hora Estrutura) ---
export const CustosEstruturaService = {
  getResumo: (params = {}) => api.get('/financeiro/custos-estrutura/resumo', { params }),
  getConstantes: () => api.get('/financeiro/custos-estrutura/constantes'),
  getGrafico: (params = {}) => api.get('/financeiro/custos-estrutura/grafico', { params }),
  getByMesAno: (mes, ano) => api.get('/financeiro/custos-estrutura', { params: { mes, ano } }),
  getFromDespesas: (mes, ano) => api.get('/financeiro/custos-estrutura/from-despesas', { params: { mes, ano } }),
  upsert: (dados) => api.put('/financeiro/custos-estrutura', dados),
}

// --- DRE Detalhada (por Cliente / Ambiente) ---
export const DreDetalhadaService = {
  buscarClientes: (q) =>
    api.get('/relatorios/dre-detalhada/clientes', { params: q ? { q } : {} }),
  listarAmbientes: (clienteId) =>
    api.get('/relatorios/dre-detalhada/ambientes', { params: { cliente_id: clienteId } }),
  getDre: (params) =>
    api.get('/relatorios/dre-detalhada/dre', { params }),

  /** Resumo de prazos do mês: média dias negociação e fábrica (visão geral) */
  getResumoPrazos: (params = {}) =>
    api.get('/relatorios/dre-detalhada/resumo-prazos', { params }),

  /** Dashboard consumo do projeto: área peças, retalhos, perda real (gráfico pizza + validação perda padrão) */
  getDashboardProjeto: (projetoId) =>
    api.get('/relatorios/dre-detalhada/dashboard-projeto', { params: { projeto_id: projetoId } }),

  /** Gráficos de validação: composição custo, lucro por ambiente, meta produção */
  getGraficosValidacao: (params = {}) =>
    api.get('/relatorios/dre-detalhada/graficos-validacao', { params }),
}

// --- Comissão de Produtividade da Fábrica ---
export const ComissaoProducaoService = {
  getResumo: (params = {}) =>
    api.get('/comissao-producao/resumo', { params }),
}

// --- Medição Fina (dados reais do ambiente antes da produção) ---
export const MedicaoFinaService = {
  resolverProjeto: (q) =>
    api.get('/medicao-fina/projeto/resolver', { params: { q } }),
  getProjetoDados: (projetoId) =>
    api.get(`/medicao-fina/projeto/${projetoId}/dados`),
  validarMedicao: (projetoId) =>
    api.post(`/medicao-fina/projeto/${projetoId}/validar`),
  listarAmbientes: (projetoId) =>
    api.get(`/medicao-fina/projeto/${projetoId}/ambientes`),
  /** Projetos do cliente (para buscar por cliente e depois escolher projeto) */
  projetosPorCliente: (clienteId) =>
    api.get(`/medicao-fina/projetos-por-cliente/${clienteId}`),
  listarPorProjeto: (projetoId) =>
    api.get(`/medicao-fina/projeto/${projetoId}`),
  buscarPorProjetoAmbiente: (projetoId, ambiente) =>
    api.get(`/medicao-fina/projeto/${projetoId}/ambiente`, { params: { ambiente } }),
  salvar: (dados) => api.post('/medicao-fina', dados),
  atualizar: (id, dados) => api.put(`/medicao-fina/${id}`, dados),
  /** Totem: finalizar medição e enviar para engenharia (status Medido - Aguardando Técnico) */
  finalizarTotem: (dados) => api.post('/medicao-fina/finalizar-totem', dados),
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
  /** Testa a conexão com a Evolution API (configuração em Configurações > Contato) */
  async whatsappTest() {
    const { data } = await api.get('/configuracoes/empresa/whatsapp-test')
    return data
  },
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

  fechamentoFolha: (params = {}) =>
    api.get('/ponto/relatorio/fechamento', { params }),

  /** Efetua pagamento de folha: cria despesa (SAÍDA, FOLHA) já paga. */
  efetuarPagamentoFolha: (body) =>
    api.post('/ponto/relatorio/fechamento/efetuar-pagamento', body),

  listarFeriadosConfig: (params = {}) =>
    api.get('/ponto/relatorio/feriados-config', { params }),

  listarFeriadosNacionais: (params = {}) =>
    api.get('/ponto/relatorio/feriados', { params }),

  salvarFeriadosConfig: (itens = []) =>
    api.put('/ponto/relatorio/feriados-config', { itens }),

  /** Comprovante de um registro de ponto (PDF com cadastro da empresa) */
  comprovantePdf: (registroId) =>
    api.get(`/ponto/relatorio/comprovante/${registroId}`, { responseType: 'blob' }),

  /** Comprovante em imagem (PNG ou JPEG) para compartilhar */
  comprovanteImagem: (registroId, formato = 'png') =>
    api.get(`/ponto/relatorio/comprovante/${registroId}`, { params: { formato }, responseType: 'blob' }),

  /** Gera recibo de folha operacional em PDF (logo A Casa). Body: nome_funcionario, data_ini, data_fim, ganhos_totais, total_vales, saldo_a_pagar, itens_auditoria */
  reciboFolhaPdf: (payload) =>
    api.post('/ponto/relatorio/recibo-folha', payload, { responseType: 'blob' }),
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

// Pipeline produção (compartilhado entre loja e fábrica)
function getPipelineProducao() {
  return api.get('/agenda/pipeline/producao');
}

/** Agenda unificada (legado). Preferir AgendaLojaService / AgendaFabricaService. */
export const AgendaService = {
  listarTodos(inicio, fim, filtros = {}) {
    return api.get('/agenda', { params: { inicio, fim, ...filtros } });
  },
  getPipelineProducao,
  criar(dados) {
    return api.post('/agenda', dados);
  },
  atualizar(id, dados) {
    return api.patch(`/agenda/${id}`, dados);
  },
  buscarPorFuncionario(id) {
    return api.get(`/agenda/funcionario/${id}`);
  },
  atualizarStatus(id, status, categoria) {
    const body = { status };
    if (categoria) body.categoria = categoria;
    return api.patch(`/agenda/${id}/status`, body);
  },
  enviarParaProducao(id) {
    return api.patch(`/agenda/${id}/enviar-producao`);
  },
  excluir(id) {
    return api.delete(`/agenda/${id}`);
  }
};

/** Agenda Loja: apenas eventos da loja (setor LOJA). */
export const AgendaLojaService = {
  listarTodos(inicio, fim, filtros = {}) {
    return api.get('/agenda-loja', { params: { inicio, fim, ...filtros } });
  },
  getPipelineProducao,
  criar(dados) {
    return api.post('/agenda-loja', dados);
  },
  atualizar(id, dados) {
    return api.patch(`/agenda-loja/${id}`, dados);
  },
  buscarPorFuncionario(id) {
    return api.get(`/agenda-loja/funcionario/${id}`);
  },
  atualizarStatus(id, status, categoria) {
    const body = { status };
    if (categoria) body.categoria = categoria;
    return api.patch(`/agenda-loja/${id}/status`, body);
  },
  enviarParaProducao(id) {
    return api.patch(`/agenda-loja/${id}/enviar-producao`);
  },
  excluir(id) {
    return api.delete(`/agenda-loja/${id}`);
  },
  /** Apaga do banco todos os agendamentos com status CANCELADO (limpeza). */
  purgeCancelados() {
    return api.post('/agenda-loja/purge-cancelados');
  }
};

/** Agenda Fábrica: apenas eventos da fábrica (setor FABRICA/PRODUCAO). */
export const AgendaFabricaService = {
  listarTodos(inicio, fim, filtros = {}) {
    return api.get('/agenda-fabrica', { params: { inicio, fim, ...filtros } });
  },
  /** Lista de eventos "Agendar medida fina" ainda pendentes (recebidos da venda). */
  pendentesMedidaFina() {
    return api.get('/agenda-fabrica/pendentes-medida-fina');
  },
  /** Lista clientes/vendas com montagem concluída (para criar pós-venda como tarefa avulsa). */
  montagemConcluida() {
    return api.get('/agenda-fabrica/montagem-concluida');
  },
  getPipelineProducao,
  criar(dados) {
    return api.post('/agenda-fabrica', dados);
  },
  atualizar(id, dados) {
    return api.patch(`/agenda-fabrica/${id}`, dados);
  },
  buscarPorFuncionario(id) {
    return api.get(`/agenda-fabrica/funcionario/${id}`);
  },
  atualizarStatus(id, status, categoria, alteradoEm, dataConclusao) {
    const body = { status };
    if (categoria) body.categoria = categoria;
    if (alteradoEm) body.alterado_em = alteradoEm;
    if (dataConclusao) body.data_conclusao = dataConclusao;
    return api.patch(`/agenda-fabrica/${id}/status`, body);
  },
  excluir(id) {
    return api.delete(`/agenda-fabrica/${id}`);
  },
  /** Apaga do banco todos os agendamentos com status CANCELADO (limpeza). */
  purgeCancelados() {
    return api.post('/agenda-fabrica/purge-cancelados');
  }
};

/** Totem Fábrica: tela para usuário Fábrica — tarefas Pendente/Em Produção, botões Play e Check. Inclui medições externas (agenda_loja) e ordens produção (agenda_fabrica). */
export const TotemFabricaService = {
  getTarefas(params = {}) {
    return api.get('/totem-fabrica/tarefas', { params });
  },
  /** Uma tarefa por id (para páginas dedicadas de medição). tipo: 'agenda_loja' | 'agenda_fabrica' */
  getTarefa(id, tipo = 'agenda_fabrica') {
    return api.get(`/totem-fabrica/tarefa/${id}`, { params: { tipo } });
  },
  getConsumos(agendaFabricaId) {
    return api.get(`/totem-fabrica/${agendaFabricaId}/consumos`);
  },
  /** tipo: 'agenda_fabrica' | 'agenda_loja' — agenda_loja = medição externa. */
  play(idParaPlay, body = {}) {
    return api.post(`/totem-fabrica/${idParaPlay}/play`, body);
  },
  /** tipo: 'agenda_fabrica' | 'agenda_loja'; sobras só para agenda_fabrica. */
  check(idParaPlay, body = {}) {
    return api.post(`/totem-fabrica/${idParaPlay}/check`, body);
  },
  /** Concluir Medição para Orçamento: body { medidas_gerais?, observacoes? } ou { observacoes?, ambientes: [{ nome_ambiente, largura_m?, pe_direito_m?, profundidade_m? }] }. Retorna medicao_orcamento_id e ambientes: [{ id, nome_ambiente }]. */
  concluirMedicaoOrcamento(id, body = {}) {
    return api.post(`/totem-fabrica/${id}/concluir-medicao-orcamento`, body);
  }
};

/** Retalhos (sobras de material) — gestão e listagem por produto. */
export const EstoqueRetalhoService = {
  listar(produtoId) {
    return api.get('/estoque/retalhos', { params: produtoId != null ? { produto_id: produtoId } : {} });
  },
  listarPorProduto(produtoId) {
    return api.get(`/estoque/retalhos/por-produto/${produtoId}`);
  },
  criar(dto) {
    return api.post('/estoque/retalhos', dto);
  }
};

/** Apontamento de produção: horas reais por funcionário/etapa (rateio de custo). Cronômetro: 1 tarefa, vários funcionários, cada um com seu cronômetro. */
export const ApontamentoProducaoService = {
  listar(filtros = {}) {
    return api.get('/apontamento-producao', { params: filtros });
  },
  /** Retorna { apontamentos, pendentes } — pendentes = tarefas da agenda de venda ainda sem registro de horas. */
  getTimeline(params = {}) {
    return api.get('/apontamento-producao/timeline', { params });
  },
  /** Timeline por tarefas: { tarefas, tipo }. Cada tarefa tem apontamentos_producao (início/fim de cada funcionário). */
  getTimelinePorTarefas(params = {}) {
    return api.get('/apontamento-producao/timeline/tarefas', { params });
  },
  /** Cronômetros em andamento (abertos) do funcionário — para exibir Iniciar/Pausar/Concluir na agenda. */
  getCronometrosAbertos(funcionarioId) {
    return api.get('/apontamento-producao/cronometro/abertos', { params: { funcionario_id: funcionarioId } });
  },
  /** Medições em andamento por cliente (Fluxo de Clientes: responsável + tempo decorrido). */
  getMedicaoEmAndamento() {
    return api.get('/apontamento-producao/medicao-em-andamento');
  },
  startCronometro(payload) {
    return api.post('/apontamento-producao/cronometro/iniciar', payload);
  },
  pauseCronometro(id) {
    return api.post(`/apontamento-producao/cronometro/${id}/pausar`);
  },
  resumeCronometro(id) {
    return api.post(`/apontamento-producao/cronometro/${id}/retomar`);
  },
  finishCronometro(id) {
    return api.post(`/apontamento-producao/cronometro/${id}/concluir`);
  },
  /** Finalizar etapa: encerra cronômetros abertos, marca agenda como CONCLUIDO e avança cliente (ex.: Medição → ORÇAMENTO). */
  finalizarEtapa(payload) {
    return api.post('/apontamento-producao/finalizar-etapa', payload);
  },
  resumoPorAgenda(agendaFabricaIds) {
    const ids = Array.isArray(agendaFabricaIds) ? agendaFabricaIds.join(',') : String(agendaFabricaIds || '');
    return api.get('/apontamento-producao/resumo-por-agenda', { params: { ids } });
  },
  criar(dados) {
    return api.post('/apontamento-producao', dados);
  },
  atualizar(id, dados) {
    return api.patch(`/apontamento-producao/${id}`, dados);
  },
  excluir(id) {
    return api.delete(`/apontamento-producao/${id}`);
  }
};
