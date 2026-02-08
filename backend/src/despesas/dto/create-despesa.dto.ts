import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsOptional, IsString, Min, Matches } from 'class-validator'

export class CreateDespesaDto {
  @IsString() @IsNotEmpty() tipo_movimento: string
  @IsString() @IsNotEmpty() unidade: string
  @IsString() @IsNotEmpty() categoria: string
  @IsString() @IsNotEmpty() classificacao: string

  @IsString() @IsNotEmpty()
  local: string

  // aceita "193,60" ou "193.60" ou "R$ 193,60"
  @IsString() @IsNotEmpty()
  valor_total: string

  @IsString() @IsNotEmpty()
  forma_pagamento: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade_parcelas?: number

  // ✅ aceita dd/mm/aaaa (ou você pode aceitar ISO também)
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'data_registro deve ser dd/mm/aaaa' })
  data_registro?: string

  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'data_vencimento deve ser dd/mm/aaaa' })
  data_vencimento: string

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'data_pagamento deve ser dd/mm/aaaa' })
  data_pagamento?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  funcionario_id?: number

  @IsOptional() @IsString() conta_bancaria_key?: string
  @IsOptional() @IsString() conta_bancaria_tipo_key?: string
  @IsOptional() @IsString() cartao_credito_key?: string
  @IsOptional() @IsString() status?: string
}
