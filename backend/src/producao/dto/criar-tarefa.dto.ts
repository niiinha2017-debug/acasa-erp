import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class CriarTarefaDto {
  @IsString()
  origem_tipo: string // 'VENDA_ITEM' | 'PLANO_CORTE'

  @IsInt()
  @Min(1)
  origem_id: number // se VENDA_ITEM -> vendas_itens.id ; se PLANO_CORTE -> plano_corte.id

  @IsOptional()
  @IsInt()
  @Min(1)
  funcionario_id?: number

  @IsString()
  titulo: string // fase do pipeline

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  observacao?: string

  @IsString()
  inicio_em: string // ISO

  @IsString()
  fim_em: string // ISO
}
