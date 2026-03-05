/**
 * Regras de prazo do pipeline (fonte: backend/shared/constantes/pipeline-regras).
 * Usar mesma constante e addDiasUteis para exibir prazos em dias úteis.
 */

export const PRAZO_CLIENTE_CADASTRADO_DIAS_UTEIS = 10

/** Validade do orçamento: 7 dias úteis (conta da conclusão da medida, início do orçamento ou agendamento da apresentação). */
export const PRAZO_ORCAMENTO_VALIDADE_DIAS_UTEIS = 7

/** Agendar fechar venda: 7 dias úteis a partir da data em que agenda para fechar a venda. */
export const PRAZO_FECHAR_VENDA_DIAS_UTEIS = 7

/** Após concluir a medida fina: 45 dias corridos para projeto técnico + produção + montagem. */
export const PRAZO_APOS_MEDIDA_FINA_DIAS_CORRIDOS = 45

/** Dias corridos antes do fim da vigência para exibir alerta "CONTRATO PERTO DE EXPIRAR". */
export const PRAZO_ALERTA_VIGENCIA_DIAS = 30

export const PRAZO_POR_FASE = {
  CADASTRO: 10,
  ORCAMENTO: 7,
  FECHAR_VENDA: 7,
}

/**
 * Soma N dias úteis à data (ignora sábado e domingo).
 */
export function addDiasUteis(base, dias) {
  const d = new Date(base)
  let restantes = dias
  while (restantes > 0) {
    d.setDate(d.getDate() + 1)
    const dia = d.getDay()
    if (dia !== 0 && dia !== 6) restantes -= 1
  }
  return d
}

/** Soma N dias corridos (inclui sábado e domingo). */
export function addDiasCorridos(base, dias) {
  const d = new Date(base)
  d.setDate(d.getDate() + dias)
  return d
}

/** Prazo após conclusão da medida fina: projeto técnico + produção + montagem em 45 dias corridos. */
export function getPrazoAposMedidaFina(dataConclusaoMedidaFina) {
  return addDiasCorridos(dataConclusaoMedidaFina, PRAZO_APOS_MEDIDA_FINA_DIAS_CORRIDOS)
}

/**
 * Retorna a data limite (prazo) para a fase, a partir da data base.
 * Só retorna data quando a fase tem prazo definido em PRAZO_POR_FASE.
 */
export function getPrazoAte(dataBase, fase) {
  const dias = PRAZO_POR_FASE[fase]
  if (dias == null || dias <= 0) return null
  return addDiasUteis(dataBase, dias)
}

/**
 * Retorna diferença em dias (inteiro) entre hoje e a data limite.
 * Positivo = faltam X dias; negativo = atrasado X dias; 0 = vence hoje.
 * Datas só-dia (YYYY-MM-DD) são tratadas em UTC meio-dia para o dia correto no fuso do usuário.
 */
export function diasParaLimite(dataLimite) {
  if (!dataLimite) return null
  const str = String(dataLimite).trim()
  const d = /^\d{4}-\d{2}-\d{2}$/.test(str)
    ? new Date(str + 'T12:00:00.000Z')
    : new Date(dataLimite)
  d.setHours(0, 0, 0, 0)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}
