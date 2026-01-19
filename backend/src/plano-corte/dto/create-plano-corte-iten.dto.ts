import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreatePlanoCorteItemDto {
  @Type(() => Number)
  @IsInt()
  fornecedor_id: number

  @IsString()
  nome_produto: string

  @IsOptional()
  @IsString()
  marca?: string

  @IsOptional()
  @IsString()
  cor?: string

  @IsOptional()
  @IsString()
  medida?: string

  @IsOptional()
  @IsString()
  unidade?: string

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantidade: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_unitario: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_total: number

  @IsString()
  status: string
}
