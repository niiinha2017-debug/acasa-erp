import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateVendaItemDto {
  @IsString()
  nome_ambiente: string

  @IsString()
  descricao: string

  @IsNumber()
  quantidade: number

  @IsNumber()
  valor_unitario: number
}

export class CreateVendaComissaoDto {
  @IsString()
  tipo_comissao_chave: string // VENDEDOR | ARQUITETO | PROJETISTA

  @IsNumber()
  percentual_aplicado: number // 3 / 5 / 10

  @IsOptional()
  @IsString()
  responsavel_nome?: string
}

export class CreateVendaDto {
  @IsInt()
  cliente_id: number

  @IsOptional()
  @IsInt()
  orcamento_id?: number

  @IsString()
  status: string

  @IsOptional()
  @IsDateString()
  data_venda?: string

  @IsOptional()
  @IsString()
  observacao?: string

  @IsOptional()
  @IsString()
  forma_pagamento_chave?: string

  // percentuais aplicados (snapshot)
  @IsOptional()
  @IsNumber()
  taxa_pagamento_percentual_aplicado?: number

  @IsOptional()
  @IsNumber()
  taxa_nota_fiscal_percentual_aplicado?: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendaItemDto)
  itens: CreateVendaItemDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendaComissaoDto)
  comissoes?: CreateVendaComissaoDto[]
}
