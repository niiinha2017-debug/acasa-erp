// src/constantes/index.js
export { PIPELINE_CLIENTE, normalizarStatusCliente } from './pipeline-cliente'
export { FINANCEIRO_CATEGORIAS } from './financeiro'
export { FORMAS_PAGAMENTO } from './formas-pagamento'
export { TAXAS_CARTAO } from './taxas-cartao'
export { ANTECIPACAO, getTaxaAntecipacaoPercentual } from './antecipacao'
export { STATUS_FINANCEIRO, STATUS_FINANCEIRO_KEYS } from './status-financeiro'
export { UNIDADES } from './unidades'
export { UNIDADES_OPERACIONAIS } from './unidades-operacionais'
export { RECEITA_OPERACIONAL } from './receita'
export { PIPELINE_PLANO_CORTE } from './pipeline-plano-corte'
export { TAXA_NOTA_FISCAL } from './taxa-nota-fiscal'
export { COMISSOES } from './comissoes'
export { FUNCIONARIOS_LOCAL_SETOR_CARGO } from './funcionarios'
export { CONTAS_BANCARIAS, CARTOES_CREDITO, TIPOS_CONTAS_BANCARIAS } from './banco'
export { INDICACAO_ORIGENS } from './indicacao'
export { VENDA_FECHAMENTO_REGRAS } from './venda-fechamento'

// Módulo único de cores/etapas (fonte: backend GET /utils/status-colors)
export {
  loadStatusColorsConfig,
  normalizarStatusSaturacao,
  normalizarStatusTarefa,
  getEtapaKeyByCategoria,
  getEtapaByCategoria,
  getStatusColor,
  getStatusBorderLeftClass,
  getStatusBadgeTimeClass,
  getStatusDotClass,
  getStatusHoverBgClass,
  getStatusBorderBottomClass,
  getStatusLineBgClass,
  getStatusStepperDotClass,
  getPrazoTextClass,
  getStatusEtapaKey,
  getProcessColorByStatus,
  getProcessColorByStatusVendas,
  getProcessColorByStatusProducao,
  getTimelineConcluidoClass,
  getCalendarioEventClassVendas,
  getCalendarioEventClassProducao,
  getCardBorderClassVendas,
  getCardBorderClassProducao,
  getBadgeClassVendas,
  getBadgeClassProducao,
  getBadgeClassEtapa,
  getCardBorderClassEtapa,
  getTituloCardClassEtapa,
  getCalendarioEventClass,
  getDotClassEtapa,
  getStepTextClassEtapa,
  getEtapasOficial,
  ETAPAS_OFICIAL_10,
  ETAPA_KEYS,
} from './status-colors'
