export class AtualizarContaReceberDto {
  fornecedor_id?: number

  origem_tipo?: string
  origem_id?: number

  descricao?: string
  observacao?: string

  valor_original?: number
  status?: string
  forma_recebimento_chave?: string

  vencimento_em?: string // ISO
  recebido_em?: string // ISO
}
