export class CriarTarefaDto {
  // vínculo do projeto
  origem_tipo: string // "VENDA_CLIENTE" | "PLANO_CORTE"
  origem_id: number

  // tarefa
  funcionario_id: number
  titulo: string
  status?: string
  observacao?: string

  inicio_em: string // ISO
  fim_em: string // ISO
}
