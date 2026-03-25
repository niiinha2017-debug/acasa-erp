export const ANTECIPACAO = {
  habilitado: true,

  // Forma padrão para antecipação de recebíveis.
  modalidade_padrao: 'CREDITO',

  // Taxa percentual padrão por forma de recebimento.
  // Ajuste aqui para refletir a política financeira da empresa.
  taxas_percentuais: {
    CREDITO: 3.5,
    DEBITO: 0,
    PIX: 0,
    DINHEIRO: 0,
    TRANSFERENCIA: 0,
    BOLETO: 0,
    CHEQUE: 0,
    CARTAO: 3.5,
  },
}

export function getTaxaAntecipacaoPercentual(formaPagamento?: string): number {
  const key = String(formaPagamento || '')
    .trim()
    .toUpperCase()
  const taxas = ANTECIPACAO.taxas_percentuais as Record<string, number>
  const taxa = taxas[key]
  return Number.isFinite(taxa) ? Number(taxa) : 0
}

