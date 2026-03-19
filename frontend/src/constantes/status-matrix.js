const SUBETAPA_LABELS = {
  CADASTRO: 'Cadastro',
  MEDIDA: 'Medida',
  ORCAMENTO: 'Orçamento',
  APRESENTACAO: 'Apresentação',
  FECHAMENTO: 'Fechamento',
  MEDIDA_FINA: 'Medida fina',
  PROJETO_TECNICO: 'Projeto técnico',
  PRODUCAO: 'Produção',
  SERVICO_CORTE_FITA_BORDA: 'Serviço de Corte e Fita de Borda',
  ENTREGA: 'Material carregado',
  MONTAGEM: 'Montagem',
  GARANTIA: 'Garantia',
  ASSISTENCIA: 'Assistência',
  MANUTENCAO: 'Manutenção',
}

const EXECUCAO_LABELS = {
  PENDENTE: 'Pendente',
  AGENDADO: 'Agendado',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
}

const CATEGORIA_PROCESSO_LABELS = {
  MEDIDA: 'Medida',
  AGENDAR_MEDIDA: 'Medida',
  MEDIDA_AGENDADA: 'Medida',
  AGENDAR_MEDIDA_FINA: 'Medida fina',
  MEDIDA_FINA: 'Medida fina',
  PRODUCAO_RECEBIDA: 'Produção recebida',
  CORTE: 'Corte',
  PREPARACAO_TECNICA: 'Preparação técnica',
  MONTAGEM_INTERNA: 'Montagem interna',
  ACABAMENTO: 'Acabamento',
  CONFERENCIA_QUALIDADE: 'Conferência / Qualidade',
  MONTAGEM_CLIENTE_AGENDADA: 'Montagem cliente (agendada)',
  EM_MONTAGEM_CLIENTE: 'Em montagem no cliente',
  MONTAGEM_CLIENTE_FINALIZADA: 'Montagem cliente finalizada',
  PRODUCAO_FINALIZADA: 'Produção finalizada',
}

const AGENDA_LOJA_ALIAS_TO_SUBETAPA = {
  CADASTRO: 'CADASTRO',
  CLIENTE_CADASTRADO: 'CADASTRO',
  MEDIDA: 'MEDIDA',
  AGENDAR_MEDIDA: 'MEDIDA',
  AGENDAR_MEDIDA_VENDA: 'MEDIDA',
  ORCAMENTO: 'ORCAMENTO',
  CRIAR_ORCAMENTO: 'ORCAMENTO',
  AGENDAR_ORCAMENTO: 'ORCAMENTO',
  APRESENTACAO: 'APRESENTACAO',
  AGENDAR_APRESENTACAO: 'APRESENTACAO',
  CONTRATO: 'FECHAMENTO',
  CONTRATO_GERADO: 'FECHAMENTO',
  CONTRATO_ASSINADO: 'FECHAMENTO',
  VENDA_FECHADA: 'FECHAMENTO',
  AGENDAR_MEDIDA_FINA: 'MEDIDA_FINA',
  MEDIDA_FINA: 'MEDIDA_FINA',
  AGUARDANDO_PROJETO_TECNICO: 'PROJETO_TECNICO',
  PROJETO_TECNICO_EM_ANDAMENTO: 'PROJETO_TECNICO',
  PRODUCAO_RECEBIDA: 'PRODUCAO',
  PRODUCAO_EM_ANDAMENTO: 'PRODUCAO',
  MONTAGEM_CLIENTE_AGENDADA: 'MONTAGEM',
  EM_MONTAGEM_CLIENTE: 'MONTAGEM',
  MONTAGEM_CLIENTE_FINALIZADA: 'MONTAGEM',
  GARANTIA: 'GARANTIA',
  ASSISTENCIA: 'ASSISTENCIA',
  MANUTENCAO: 'MANUTENCAO',
}

const SUBETAPA_TO_AGENDA_LOJA_CATEGORIA = {
  CADASTRO: 'CADASTRO',
  MEDIDA: 'MEDIDA',
  ORCAMENTO: 'ORCAMENTO',
  APRESENTACAO: 'APRESENTACAO',
  FECHAMENTO: 'CONTRATO',
}

const SUBETAPA_TO_STATUS_VENDA_AGENDADO = {
  CADASTRO: 'CLIENTE_CADASTRADO',
  MEDIDA: 'MEDIDA_AGENDADA',
  ORCAMENTO: 'ORCAMENTO_EM_ANDAMENTO',
  APRESENTACAO: 'APRESENTACAO_AGENDADA',
  FECHAMENTO: 'CONTRATO_ASSINADO',
  MEDIDA_FINA: 'MEDIDA_FINA_AGENDADA',
  PROJETO_TECNICO: 'AGUARDANDO_PROJETO_TECNICO',
  PRODUCAO: 'PRODUCAO_AGENDADA',
  MONTAGEM: 'MONTAGEM_AGENDADA',
  GARANTIA: 'GARANTIA',
  ASSISTENCIA: 'ASSISTENCIA',
  MANUTENCAO: 'MANUTENCAO',
}

const SUBETAPA_TO_CATEGORIA_VISUAL_COMERCIAL = {
  CADASTRO: 'CLIENTE_CADASTRADO',
  MEDIDA: 'MEDIDA',
  ORCAMENTO: 'ORCAMENTO',
  APRESENTACAO: 'APRESENTACAO',
  FECHAMENTO: 'CONTRATO',
  MEDIDA_FINA: 'MEDIDA_FINA',
  PROJETO_TECNICO: 'MEDIDA_FINA',
  PRODUCAO: 'VENDA_FECHADA',
  SERVICO_CORTE_FITA_BORDA: 'VENDA_FECHADA',
  ENTREGA: 'VENDA_FECHADA',
  MONTAGEM: 'VENDA_FECHADA',
  GARANTIA: 'GARANTIA',
  ASSISTENCIA: 'ASSISTENCIA',
  MANUTENCAO: 'MANUTENCAO',
}

const SUBETAPA_TO_CATEGORIA_VISUAL_OPERACIONAL = {
  CADASTRO: 'CLIENTE_CADASTRADO',
  MEDIDA: 'MEDIDA',
  ORCAMENTO: 'ORCAMENTO',
  APRESENTACAO: 'APRESENTACAO',
  FECHAMENTO: 'CONTRATO',
  MEDIDA_FINA: 'MEDIDA_FINA',
  PROJETO_TECNICO: 'PROJETO_TECNICO_EM_ANDAMENTO',
  PRODUCAO: 'PRODUCAO_EM_ANDAMENTO',
  SERVICO_CORTE_FITA_BORDA: 'PRODUCAO_EM_ANDAMENTO',
  ENTREGA: 'MONTAGEM_CLIENTE_AGENDADA',
  MONTAGEM: 'EM_MONTAGEM_CLIENTE',
  GARANTIA: 'GARANTIA',
  ASSISTENCIA: 'ASSISTENCIA',
  MANUTENCAO: 'MANUTENCAO',
}

const STATUS_VENDA_META = {
  ATIVO: { subetapa: 'CADASTRO', phase5: 1, phase11: 1, label: 'Cadastro' },
  CADASTRO: { subetapa: 'CADASTRO', phase5: 1, phase11: 1, label: 'Cadastro' },
  CLIENTE_CADASTRADO: { subetapa: 'CADASTRO', phase5: 1, phase11: 1, label: 'Cadastro' },

  MEDICAO_VENDA: { subetapa: 'MEDIDA', phase5: 2, phase11: 2, label: 'Medida' },
  MEDICAO: { subetapa: 'MEDIDA', phase5: 2, phase11: 2, label: 'Medida' },
  AGENDAR_MEDIDA: { subetapa: 'MEDIDA', phase5: 2, phase11: 2, label: 'Medida' },
  AGENDAR_MEDIDA_VENDA: { subetapa: 'MEDIDA', phase5: 2, phase11: 2, label: 'Medida' },
  MEDIDA_AGENDADA: { subetapa: 'MEDIDA', phase5: 2, phase11: 2, label: 'Medida' },
  MEDIDA_EM_ANDAMENTO: { subetapa: 'MEDIDA', phase5: 2, phase11: 2, label: 'Medida' },
  MEDIDA_REALIZADA: { subetapa: 'MEDIDA', phase5: 2, phase11: 2, label: 'Medida' },

  ORCAMENTO: { subetapa: 'ORCAMENTO', phase5: 3, phase11: 3, label: 'Orçamento' },
  AGENDAR_ORCAMENTO: { subetapa: 'ORCAMENTO', phase5: 3, phase11: 3, label: 'Orçamento' },
  CRIAR_ORCAMENTO: { subetapa: 'ORCAMENTO', phase5: 3, phase11: 3, label: 'Orçamento' },
  ORCAMENTO_EM_ANDAMENTO: { subetapa: 'ORCAMENTO', phase5: 3, phase11: 3, label: 'Orçamento' },
  ORCAMENTO_ENVIADO: { subetapa: 'ORCAMENTO', phase5: 3, phase11: 3, label: 'Orçamento' },
  ORCAMENTO_EM_NEGOCIACAO: { subetapa: 'ORCAMENTO', phase5: 3, phase11: 3, label: 'Orçamento' },
  ORCAMENTO_APROVADO: { subetapa: 'ORCAMENTO', phase5: 3, phase11: 3, label: 'Orçamento' },
  ORCAMENTO_REPROVADO: { subetapa: 'ORCAMENTO', phase5: 3, phase11: 3, label: 'Orçamento' },

  AGENDAR_APRESENTACAO: { subetapa: 'APRESENTACAO', phase5: 3, phase11: 4, label: 'Apresentação' },
  APRESENTACAO: { subetapa: 'APRESENTACAO', phase5: 3, phase11: 4, label: 'Apresentação' },
  APRESENTACAO_AGENDADA: { subetapa: 'APRESENTACAO', phase5: 3, phase11: 4, label: 'Apresentação' },
  ORCAMENTO_APRESENTADO: { subetapa: 'APRESENTACAO', phase5: 3, phase11: 4, label: 'Apresentação' },

  CONTRATO: { subetapa: 'FECHAMENTO', phase5: 4, phase11: 5, label: 'Fechamento' },
  VENDA_FECHADA: { subetapa: 'FECHAMENTO', phase5: 4, phase11: 5, label: 'Fechamento' },
  CONTRATO_GERADO: { subetapa: 'FECHAMENTO', phase5: 4, phase11: 5, label: 'Fechamento' },
  CONTRATO_ASSINADO: { subetapa: 'FECHAMENTO', phase5: 4, phase11: 5, label: 'Fechamento' },
  FECHAR_VENDA: { subetapa: 'FECHAMENTO', phase5: 4, phase11: 5, label: 'Fechamento' },
  AGENDAR_FECHAMENTO: { subetapa: 'FECHAMENTO', phase5: 4, phase11: 6, label: 'Agendar fechamento' },

  AGENDAR_MEDIDA_FINA: { subetapa: 'MEDIDA_FINA', phase5: 4, phase11: 7, label: 'Medida fina' },
  MEDIDA_FINA: { subetapa: 'MEDIDA_FINA', phase5: 4, phase11: 7, label: 'Medida fina' },
  MEDIDA_FINA_AGENDADA: { subetapa: 'MEDIDA_FINA', phase5: 4, phase11: 7, label: 'Medida fina' },
  MEDIDA_FINA_REALIZADA: { subetapa: 'MEDIDA_FINA', phase5: 5, phase11: 7, label: 'Medida fina' },

  AGUARDANDO_PRECIFICACAO: { subetapa: 'PROJETO_TECNICO', phase5: 5, phase11: 8, label: 'Projeto técnico' },
  AGUARDANDO_PROJETO_TECNICO: { subetapa: 'PROJETO_TECNICO', phase5: 5, phase11: 8, label: 'Projeto técnico' },
  PROJETO_TECNICO_EM_ANDAMENTO: { subetapa: 'PROJETO_TECNICO', phase5: 5, phase11: 8, label: 'Projeto técnico' },
  PROJETO_TECNICO_CONCLUIDO: { subetapa: 'PROJETO_TECNICO', phase5: 5, phase11: 8, label: 'Projeto técnico' },
  PROJETO_TECNICO_APROVADO: { subetapa: 'PROJETO_TECNICO', phase5: 5, phase11: 8, label: 'Projeto técnico' },

  PRODUCAO_RECEBIDA: { subetapa: 'PRODUCAO', phase5: 5, phase11: 9, label: 'Produção' },
  PRODUCAO_AGENDADA: { subetapa: 'PRODUCAO', phase5: 5, phase11: 9, label: 'Produção' },
  EM_PRODUCAO: { subetapa: 'PRODUCAO', phase5: 5, phase11: 9, label: 'Produção' },
  PRODUCAO_FINALIZADA: { subetapa: 'PRODUCAO', phase5: 5, phase11: 9, label: 'Produção' },
  CORTE: { subetapa: 'PRODUCAO', phase5: 5, phase11: 9, label: 'Produção' },
  PREPARACAO_TECNICA: { subetapa: 'PRODUCAO', phase5: 5, phase11: 9, label: 'Produção' },
  MONTAGEM_INTERNA: { subetapa: 'PRODUCAO', phase5: 5, phase11: 9, label: 'Produção' },
  ACABAMENTO: { subetapa: 'PRODUCAO', phase5: 5, phase11: 9, label: 'Produção' },
  CONFERENCIA_QUALIDADE: { subetapa: 'PRODUCAO', phase5: 5, phase11: 9, label: 'Produção' },
  PRODUCAO_MONTAGEM: { subetapa: 'PRODUCAO', phase5: 5, phase11: 9, label: 'Produção' },

  AGENDAR_MONTAGEM: { subetapa: 'MONTAGEM', phase5: 5, phase11: 10, label: 'Montagem' },
  MONTAGEM_AGENDADA: { subetapa: 'MONTAGEM', phase5: 5, phase11: 10, label: 'Montagem' },
  MONTAGEM_CLIENTE_AGENDADA: { subetapa: 'MONTAGEM', phase5: 5, phase11: 10, label: 'Montagem' },
  EM_MONTAGEM: { subetapa: 'MONTAGEM', phase5: 5, phase11: 10, label: 'Montagem' },
  EM_MONTAGEM_CLIENTE: { subetapa: 'MONTAGEM', phase5: 5, phase11: 10, label: 'Montagem' },
  MONTAGEM_FINALIZADA: { subetapa: 'MONTAGEM', phase5: 5, phase11: 10, label: 'Montagem' },
  MONTAGEM_CLIENTE_FINALIZADA: { subetapa: 'MONTAGEM', phase5: 5, phase11: 10, label: 'Montagem' },

  GARANTIA: { subetapa: 'GARANTIA', phase5: 5, phase11: 11, label: 'Garantia' },
  ASSISTENCIA: { subetapa: 'ASSISTENCIA', phase5: 5, phase11: 11, label: 'Assistência' },
  MANUTENCAO: { subetapa: 'MANUTENCAO', phase5: 5, phase11: 11, label: 'Manutenção' },
  ENCERRADO: { subetapa: '', phase5: 5, phase11: 11, label: 'Encerrado' },
}

function normalizeMatrixKey(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '_')
}

function getStatusVendaMeta(statusKey) {
  return STATUS_VENDA_META[normalizeMatrixKey(statusKey)] || null
}

function resolveAgendaLojaSubetapa(value) {
  const key = normalizeMatrixKey(value)
  if (!key) return ''
  if (SUBETAPA_LABELS[key]) return key
  if (AGENDA_LOJA_ALIAS_TO_SUBETAPA[key]) return AGENDA_LOJA_ALIAS_TO_SUBETAPA[key]
  return getStatusVendaSubetapa(key)
}

export function getSubetapaProcessoPorCategoria(value) {
  return resolveAgendaLojaSubetapa(value)
}

export function getSubetapaLabel(subetapa) {
  const key = String(subetapa || '').toUpperCase()
  return SUBETAPA_LABELS[key] || ''
}

export function getExecucaoEtapaLabel(execucao) {
  const key = String(execucao || '').toUpperCase()
  return EXECUCAO_LABELS[key] || ''
}

export function getCategoriaProcessoLabel(categoria) {
  const key = normalizeMatrixKey(categoria)
  return CATEGORIA_PROCESSO_LABELS[key] || ''
}

export function getStatusVendaSubetapa(statusKey) {
  return getStatusVendaMeta(statusKey)?.subetapa || ''
}

export function getStatusVendaOperacionalLabel(statusKey) {
  const meta = getStatusVendaMeta(statusKey)
  if (!meta) return normalizeMatrixKey(statusKey).replace(/_/g, ' ')
  if (meta.subetapa) return getSubetapaLabel(meta.subetapa) || meta.label || ''
  return meta.label || ''
}

export function getStatusVendaFase5(statusKey) {
  return getStatusVendaMeta(statusKey)?.phase5 ?? null
}

export function getStatusVendaFase11(statusKey) {
  return getStatusVendaMeta(statusKey)?.phase11 ?? null
}

export function getCategoriaAgendaLojaPorSubetapa(value) {
  const subetapa = resolveAgendaLojaSubetapa(value)
  return SUBETAPA_TO_AGENDA_LOJA_CATEGORIA[subetapa] || ''
}

export function getCategoriaAgendaLojaPorStatusVenda(statusKey) {
  return getCategoriaAgendaLojaPorSubetapa(getStatusVendaSubetapa(statusKey)) || ''
}

export function getStatusVendaAoAgendarAgendaLoja(value) {
  const subetapa = resolveAgendaLojaSubetapa(value)
  return SUBETAPA_TO_STATUS_VENDA_AGENDADO[subetapa] || ''
}

export function getCategoriaVisualOperacionalPorSubetapa(value) {
  const subetapa = normalizeMatrixKey(value)
  return SUBETAPA_TO_CATEGORIA_VISUAL_OPERACIONAL[subetapa] || ''
}

export function getCategoriaVisualComercialPorSubetapa(value) {
  const subetapa = normalizeMatrixKey(value)
  return SUBETAPA_TO_CATEGORIA_VISUAL_COMERCIAL[subetapa] || ''
}

export function getCategoriaAgendaFabricaPorSubetapa(value, execucao) {
  const subetapa = normalizeMatrixKey(value)
  const execucaoKey = normalizeMatrixKey(execucao)

  if (subetapa === 'MEDIDA_FINA') {
    return execucaoKey === 'PENDENTE' ? 'AGENDAR_MEDIDA_FINA' : 'MEDIDA_FINA'
  }
  if (subetapa === 'PROJETO_TECNICO') return 'PROJETO_TECNICO_EM_ANDAMENTO'
  if (subetapa === 'PRODUCAO' || subetapa === 'SERVICO_CORTE_FITA_BORDA') return 'PRODUCAO_EM_ANDAMENTO'
  if (subetapa === 'ENTREGA' || subetapa === 'MONTAGEM') return 'MONTAGEM_CLIENTE_AGENDADA'
  if (subetapa === 'GARANTIA' || subetapa === 'ASSISTENCIA' || subetapa === 'MANUTENCAO') return subetapa
  if (subetapa === 'APRESENTACAO') return 'APRESENTACAO'
  if (subetapa === 'FECHAMENTO') return 'CONTRATO'
  if (subetapa === 'ORCAMENTO') return 'ORCAMENTO'
  if (subetapa === 'MEDIDA') return 'MEDIDA'
  if (subetapa === 'CADASTRO') return 'CADASTRO'
  return ''
}

export function statusVendaEhOrcamento(statusKey) {
  const subetapa = getStatusVendaSubetapa(statusKey)
  return subetapa === 'ORCAMENTO' || subetapa === 'APRESENTACAO'
}

export function statusVendaEhVenda(statusKey) {
  return getStatusVendaSubetapa(statusKey) === 'FECHAMENTO' && normalizeMatrixKey(statusKey) !== 'AGENDAR_FECHAMENTO'
}

export function statusVendaEhAgenda(statusKey) {
  return [
    'AGENDAR_MEDIDA',
    'MEDIDA_AGENDADA',
    'MEDIDA_REALIZADA',
    'AGENDAR_MEDIDA_FINA',
    'MEDIDA_FINA_AGENDADA',
    'MEDIDA_FINA_REALIZADA',
    'PRODUCAO_AGENDADA',
    'AGENDAR_MONTAGEM',
    'MONTAGEM_AGENDADA',
  ].includes(normalizeMatrixKey(statusKey))
}

export function statusVendaEhProducaoPosVenda(statusKey) {
  return [
    'PROJETO_TECNICO_EM_ANDAMENTO',
    'PROJETO_TECNICO_APROVADO',
    'EM_PRODUCAO',
    'PRODUCAO_FINALIZADA',
    'EM_MONTAGEM',
    'MONTAGEM_FINALIZADA',
    'GARANTIA',
    'ASSISTENCIA',
    'MANUTENCAO',
    'ENCERRADO',
  ].includes(normalizeMatrixKey(statusKey))
}

export function statusVendaUsa45DiasAposMedidaFina(statusKey) {
  return [
    'AGUARDANDO_PRECIFICACAO',
    'AGUARDANDO_PROJETO_TECNICO',
    'PROJETO_TECNICO_EM_ANDAMENTO',
    'PROJETO_TECNICO_CONCLUIDO',
    'PROJETO_TECNICO_APROVADO',
    'PRODUCAO_AGENDADA',
    'EM_PRODUCAO',
    'PRODUCAO_FINALIZADA',
    'AGENDAR_MONTAGEM',
    'MONTAGEM_AGENDADA',
    'EM_MONTAGEM',
  ].includes(normalizeMatrixKey(statusKey))
}

export function statusVendaEhMedidaFina(statusKey) {
  return [
    'AGENDAR_MEDIDA_FINA',
    'MEDIDA_FINA',
    'MEDIDA_FINA_AGENDADA',
    'MEDIDA_FINA_REALIZADA',
    'AGUARDANDO_PRECIFICACAO',
  ].includes(normalizeMatrixKey(statusKey))
}

export function statusVendaEhEmProducao(statusKey) {
  return getStatusVendaSubetapa(statusKey) === 'PRODUCAO'
}

export function statusVendaEhFinalizada(statusKey) {
  return ['MONTAGEM_FINALIZADA', 'MONTAGEM_CLIENTE_FINALIZADA', 'ENCERRADO'].includes(normalizeMatrixKey(statusKey))
}
