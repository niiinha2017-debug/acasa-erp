import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVendaPagamentoDto } from './create-venda-pagamento.dto';
import { CreateVendaComissaoDto } from './create-venda.dto'; // Importe o DTO de comissão

export class UpdateVendaDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  data_venda?: string;

  @IsOptional()
  @IsDateString()
  data_entrega?: string;

  @IsOptional()
  @IsString()
  representante_venda_nome?: string;

  @IsOptional()
  @IsString()
  representante_venda_cpf?: string;

  @IsOptional()
  @IsString()
  representante_venda_rg?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_vendido?: number;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsBoolean()
  tem_nota_fiscal?: boolean;

  // ✅ TAXAS (Adicionadas para o Service não dar erro nos cálculos)
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxa_pagamento_percentual_aplicado?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxa_nota_fiscal_percentual_aplicado?: number;

  // ✅ COMISSÕES (O campo que estava faltando e gerando o erro no build)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendaComissaoDto)
  comissoes?: CreateVendaComissaoDto[];

  // ✅ PAGAMENTOS
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendaPagamentoDto)
  pagamentos?: CreateVendaPagamentoDto[];
}
