import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'

export class AtualizarCompraItemDto {
  @IsOptional()
  @IsInt()
  id?: number

  // ✅ FALTAVA
  @IsOptional()
  @IsInt()
  produto_id?: number | null

  @IsString()
  descricao: string

  @IsOptional()
  @IsString()
  unidade?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidade?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_unitario?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_total?: number
}

export class AtualizarCompraRateioDto {
  @IsString()
  nome_ambiente: string

  @IsNumber()
  @Min(0)
  valor_alocado: number
}

export class AtualizarCompraDto {
  @IsOptional()
  @IsString()
  tipo_compra?: string

  @IsOptional()
  @IsInt()
  venda_id?: number | null

  @IsOptional()
  @IsInt()
  fornecedor_id?: number

  @IsOptional()
  @IsInt()
  venda_item_id?: number | null

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  observacao?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_total?: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtualizarCompraItemDto)
  itens?: AtualizarCompraItemDto[]

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  itens_remover_ids?: number[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtualizarCompraRateioDto)
  rateios?: AtualizarCompraRateioDto[]
}
