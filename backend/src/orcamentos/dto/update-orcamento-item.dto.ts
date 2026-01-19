import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class UpdateOrcamentoItemDto {
  @IsOptional()
  @IsString()
  nome_ambiente?: string

  @IsOptional()
  @IsString()
  descricao?: string

  @IsOptional()
  @IsString()
  observacao?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_unitario?: number

  @IsOptional()
@Type(() => Number)
@IsNumber()
@Min(0)
valor_total?: number

}
