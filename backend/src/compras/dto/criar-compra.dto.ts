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
  // Prisma: produto_id Int?
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

export class CriarCompraRateioDto {
  @IsString()
  nome_ambiente: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_alocado: number
}

export class CriarCompraDto {
  @IsString()
  tipo_compra: string // INSUMOS | CLIENTE_AMBIENTE

  // Prisma: venda_id Int?
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  venda_id?: number | null

  @Type(() => Number)
  @IsInt()
  fornecedor_id: number

  // Prisma: venda_item_id Int?
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  venda_item_id?: number | null

  // ✅ se você colocou @default("ATIVO") no Prisma, NÃO precisa obrigar no DTO
  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @Type(() => Number)
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
