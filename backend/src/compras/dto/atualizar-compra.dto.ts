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
  @Type(() => Number)
  @IsInt()
  id?: number

  // aceita number ou null
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  produto_id?: number | null

  @IsOptional()
  @IsString()
  unidade?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantidade?: number

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

export class AtualizarCompraRateioDto {
  @IsString()
  nome_ambiente: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_alocado: number
}

export class AtualizarCompraDto {
  @IsOptional()
  @IsString()
  tipo_compra?: string

  // aceita number ou null
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  venda_id?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fornecedor_id?: number

  // aceita number ou null
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  venda_item_id?: number | null

  @IsOptional()
  @IsString()
  status?: string

  // se você estiver calculando no service, pode até remover do DTO
  @IsOptional()
  @Type(() => Number)
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
  @IsInt({ each: true })
  itens_remover_ids?: number[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtualizarCompraRateioDto)
  rateios?: AtualizarCompraRateioDto[]
}
