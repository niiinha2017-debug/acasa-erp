export class CriarContaPagarDto {
  fornecedor_id: number
  fornecedor_cobrador_id?: number

  origem_tipo?: string
  origem_id?: number

  descricao?: string
  observacao?: string

  valor_original: number

  status: string
  forma_pagamento_chave?: string

  parcelas_total?: number
  parcela_numero?: number

  vencimento_em: string // ISO
}
