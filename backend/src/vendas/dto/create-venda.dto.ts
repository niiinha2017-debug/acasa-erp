import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVendaPagamentoDto } from './create-venda-pagamento.dto';

/**
 * 1. Itens da Venda (Ambientes congelados do orçamento)
 */
export class CreateVendaItemDto {
  @IsString()
  nome_ambiente: string;

  @IsString()
  descricao: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantidade: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_unitario: number;

  @IsOptional()
  @IsString()
  observacao?: string;
}

/**
 * 2. Comissões (Calculadas com base no percentual vindo do Front)
 */
export class CreateVendaComissaoDto {
  @IsString()
  tipo_comissao_chave: string; // VENDEDOR | ARQUITETO | PROJETISTA

  @IsNumber()
  @Min(0)
  percentual_aplicado: number; // O campo que faltava para o seu Service

  @IsOptional()
  @IsString()
  responsavel_nome?: string;
}

/**
 * 3. DTO Principal de Criação de Venda
 */
export class CreateVendaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cliente_id?: number;

  @Type(() => Number)
  @IsInt()
  orcamento_id: number;

  @IsString()
  status: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_vendido: number; // Valor real fechado com o cliente

  @IsOptional()
  @IsDateString()
  data_venda?: string;

  @IsOptional()
  @IsDateString()
  data_entrega?: string;

  /** Representante da venda (contrato). Se preenchido, usado no PDF em vez do cadastro da empresa. */
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
  @IsString()
  observacao?: string;

  // CAMPOS DE TAXAS (Vindos das constantes do Frontend)
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxa_pagamento_percentual_aplicado?: number;

  @IsOptional()
  @IsBoolean()
  tem_nota_fiscal?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxa_nota_fiscal_percentual_aplicado?: number;

  // RELACIONAMENTOS (Arrays)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendaItemDto)
  itens?: CreateVendaItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendaComissaoDto)
  comissoes?: CreateVendaComissaoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendaPagamentoDto)
  pagamentos: CreateVendaPagamentoDto[];
}
