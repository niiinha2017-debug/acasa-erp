import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator'

export class CreateProdutoDto {
  @IsInt()
  fornecedor_id: number

  @IsString()
  nome_produto: string

  @IsOptional()
  @IsString()
  cor?: string

  @IsOptional()
  @IsString()
  medida?: string

  @IsInt()
  quantidade: number

  @IsNumber()
  valor_unitario: number

  @IsNumber()
  valor_total: number

  @IsString()
  status: string
}
