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

export class CriarCompraItemDto {
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

export class CriarCompraRateioDto {
  @IsString()
  nome_ambiente: string

  @IsNumber()
  @Min(0)
  valor_alocado: number
}

export class CriarCompraDto {
  @IsString()
  tipo_compra: string // INSUMOS | CLIENTE_AMBIENTE

  @IsOptional()
  @IsInt()
  venda_id?: number

  @IsInt()
  fornecedor_id: number

  // opcional: se quiser amarrar compra em 1 item específico da venda
  @IsOptional()
  @IsInt()
  venda_item_id?: number | null

  @IsString()
  status: string

  @IsOptional()
  @IsString()
  observacao?: string

  // opcional: se você quiser permitir mandar o total manual
  // (o service pode ignorar e recalcular pelos itens)
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_total?: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriarCompraItemDto)
  itens?: CriarCompraItemDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriarCompraRateioDto)
  rateios?: CriarCompraRateioDto[]
}
