import { Type } from 'class-transformer'
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

export class CreateDespesaDto {
  @IsString()
  @IsNotEmpty()
  tipo_movimento: string

  @IsString()
  @IsNotEmpty()
  unidade: string

  @IsString()
  @IsNotEmpty()
  categoria: string

  @IsString()
  @IsNotEmpty()
  classificacao: string

  @IsString()
  @IsNotEmpty()
  local: string

  @IsString()
  @IsNotEmpty()
  valor_total: string // ex: "1234.56"

  @IsString()
  @IsNotEmpty()
  forma_pagamento: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade_parcelas?: number // default 1 no service

  @IsOptional()
  @IsDateString()
  data_registro?: string

  @IsDateString()
  data_vencimento: string

  @IsOptional()
  @IsDateString()
  data_pagamento?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  funcionario_id?: number

  @IsOptional()
  @IsString()
  conta_bancaria_key?: string

  @IsOptional()
  @IsString()
  conta_bancaria_tipo_key?: string

  @IsOptional()
  @IsString()
  cartao_credito_key?: string

  @IsOptional()
  @IsString()
  status?: string // backend decide quando é prazo
}
