import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateContaPagarDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fornecedor_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fornecedor_cobrador_id?: number;

  @IsOptional()
  @IsString()
  origem_tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  origem_id?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes_referencia: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  ano_referencia: number;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_original: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_compensado?: number;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  forma_pagamento_chave?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parcelas_total?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parcela_numero?: number;

  @IsString()
  vencimento_em: string;

  @IsOptional()
  @IsString()
  pago_em?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  despesa_id?: number;
}
