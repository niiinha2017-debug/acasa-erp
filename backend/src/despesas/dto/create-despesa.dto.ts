import { Type } from 'class-transformer'
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export class CreateDespesaDto {
  @IsString()
  @IsNotEmpty()
  tipo_movimento: string // ENTRADA | SAIDA (constantes)

  @IsString()
  @IsNotEmpty()
  unidade: string // (constantes) FABRICA | LOJA

  @IsString()
  @IsNotEmpty()
  categoria: string // (constantes)

  @IsString()
  @IsNotEmpty()
  classificacao: string // (constantes)

  @IsString()
  @IsNotEmpty()
  local: string // (constantes)

  // aceitar como string pra manter decimal certinho (ex: "123.45")
  @IsString()
  @IsNotEmpty()
  valor_total: string

  @IsString()
  @IsNotEmpty()
  forma_pagamento: string // (constantes)

  @IsOptional()
@IsString()
recorrencia_id?: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade_parcelas: number

  @IsOptional()
  @IsDateString()
  data_registro?: string // opcional (se não mandar, Prisma usa now())

  @IsDateString()
  data_vencimento: string

  @IsOptional()
  @IsDateString()
  data_pagamento?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  funcionario_id?: number

  @IsString()
  @IsNotEmpty()
  status: string // (constantes do financeiro)
}

export class UpdateDespesaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tipo_movimento?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unidade?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoria?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  classificacao?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  local?: string

  // manter como string (decimal)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  valor_total?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  forma_pagamento?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade_parcelas?: number

  @IsOptional()
  @IsDateString()
  data_registro?: string

  @IsOptional()
  @IsDateString()
  data_vencimento?: string

  @IsOptional()
  @IsDateString()
  data_pagamento?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  funcionario_id?: number

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  status?: string
}
