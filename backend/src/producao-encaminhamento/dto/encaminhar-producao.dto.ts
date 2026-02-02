import { IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

export class EncaminharProducaoDto {
  @IsString()
  @IsNotEmpty()
  origem_tipo: string // 'VENDA' | 'PLANO_CORTE' | ...

  @IsInt()
  @Min(1)
  origem_id: number

  @IsDateString()
  inicio_em: string // ISO

  @IsDateString()
  fim_em: string // ISO

  @IsArray()
  funcionario_ids: number[] // 1+ (vamos criar 1 tarefa por funcionário)

  @IsString()
  @IsNotEmpty()
  titulo: string

  @IsOptional()
  @IsString()
  observacao?: string
}
