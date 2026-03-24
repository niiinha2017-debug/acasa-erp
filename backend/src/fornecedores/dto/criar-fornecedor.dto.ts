import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class FornecedorFormaPagamentoDto {
  @IsString()
  forma_pagamento_chave: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parcelas_padrao?: number;
}

export class CreateFornecedorDto {
  @IsString()
  razao_social: string;

  @IsString()
  nome_fantasia: string;

  @IsString()
  cnpj: string;

  @IsOptional()
  @IsString()
  ie?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsString()
  complemento?: string;

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  forma_pagamento?: string;

  @IsOptional()
  @IsString()
  regime_financeiro_padrao?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dia_fechamento_padrao?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  permite_multiplas_formas?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  data_vencimento?: number;

  @IsOptional()
  @IsString()
  ramo_atividade?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  prazo_entrega_dias?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FornecedorFormaPagamentoDto)
  formas_pagamento_habilitadas?: FornecedorFormaPagamentoDto[];
}
