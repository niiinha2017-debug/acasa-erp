import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateOrcamentoItemDto {
  @IsNotEmpty()
  @IsString()
  nome_ambiente: string

  @IsNotEmpty()
  @IsString()
  descricao: string

  @IsOptional()
  @IsString()
  observacao?: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_unitario: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_total: number
}
