import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** DTO para o endpoint legado POST /financeiro/fechamento/fornecedor */
export class FecharMesFornecedorDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fornecedor_id: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  ano: number;

  @IsString()
  forma_pagamento_chave: string;

  @IsOptional()
  @IsString()
  vencimento_em?: string;
}
