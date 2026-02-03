import { IsArray, IsInt, IsOptional, IsString, Min, ArrayUnique } from 'class-validator'

export class CriarTarefaDto {
  @IsString()
  origem_tipo: string // 'VENDA_ITEM' | 'PLANO_CORTE'

  @IsInt()
  @Min(1)
  origem_id: number

  // ✅ multi-funcionários (opcional)
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  funcionario_ids?: number[]

  // ✅ pipeline (obrigatório)
  @IsString()
  etapa: string // ex: FABRICACAO | GARANTIA | MANUTENCAO ...

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  observacao?: string

  // ✅ datas opcionais
  @IsOptional()
  @IsString()
  inicio_em?: string // ISO

  @IsOptional()
  @IsString()
  fim_em?: string // ISO
}
