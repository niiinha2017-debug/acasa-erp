import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class FecharMesFuncionarioItemDto {
  @IsString()
  tipo_item: string; // PROVENTO | DESCONTO

  @IsString()
  rubrica: string;

  @Type(() => Number)
  @IsNumber()
  valor: number;

  @IsOptional()
  @IsString()
  observacao?: string;
}

export class FecharMesFuncionarioDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  funcionario_id: number;

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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dia_pagamento?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salario_base?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salario_adicional?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  beneficios?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  horas_extras_valor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  descontos?: number;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FecharMesFuncionarioItemDto)
  itens?: FecharMesFuncionarioItemDto[];

  @IsOptional()
  @IsString()
  vencimento_em?: string;

  @IsOptional()
  @IsString()
  data_pagamento?: string;
}
