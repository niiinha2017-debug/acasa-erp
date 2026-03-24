import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ParcelaFechamentoDto } from './parcela-fechamento.dto';

export class FecharMesDto {
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

  @IsOptional()
  @IsString()
  forma_pagamento_chave?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  usar_multiplas_formas?: boolean;

  @IsOptional()
  @IsString()
  data_pagamento?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : value))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fornecedor_cobrador_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valor_dever?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valor_creditar?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  percentual_liberado?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  desconto_percentual?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParcelaFechamentoDto)
  parcelas: ParcelaFechamentoDto[];

  @IsOptional()
  @IsString()
  vencimento_em?: string;
}
