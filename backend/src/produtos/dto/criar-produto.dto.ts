import { Type } from 'class-transformer'
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateProdutoDto {
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
  quantidade: number

  @Type(() => Number)
  @IsNumber()
  valor_unitario: number

  @Type(() => Number)
  @IsNumber()
  valor_total: number

  @IsString()
  status: string
}
