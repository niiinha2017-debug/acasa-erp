import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator'

export class CriarCompraItemDto {
  // ✅ Prisma: produto_id Int?
  // Aceita number ou null
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
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

  // ✅ Prisma: venda_id Int?
  // Aceita number ou null
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  venda_id?: number | null

  @Type(() => Number)
  @IsInt()
  fornecedor_id: number

  // ✅ Prisma: venda_item_id Int?
  // Aceita number ou null
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  venda_item_id?: number | null

  @IsString()
  status: string

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
