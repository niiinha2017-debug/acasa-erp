export class AtualizarTarefaDto {
  // pode mudar vínculo se precisar (opcional)
  origem_tipo?: string
  origem_id?: number

  funcionario_id?: number
  titulo?: string
  status?: string
  observacao?: string

  inicio_em?: string // ISO
  fim_em?: string // ISO
}
