import { Type } from 'class-transformer'
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  Min,
  IsPositive,
} from 'class-validator'

export enum StatusProduto {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

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
  @Min(0)
  quantidade: number

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  valor_unitario: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_total: number

  @IsEnum(StatusProduto)
  status: StatusProduto
}
