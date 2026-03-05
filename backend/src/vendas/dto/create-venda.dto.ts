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
import { CreateVendaFormaPagamentoDto } from './create-venda-forma-pagamento.dto';

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  responsavel_usuario_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  responsavel_funcionario_id?: number;
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
  valor_vendido: number; // Valor real fechado com o cliente (pode incluir taxa cartão)

  /** Valor base da venda (sem taxa de cartão). Quando informado, a soma dos pagamentos deve bater com este valor; valor_vendido pode ser maior (acréscimo de juros). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_base_venda?: number;

  /** Valor do contrato (sem juros) – o que o cliente vê no contrato. Quando há parcelamento com juros, enviar valor_base_contrato = soma dos valores base. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_base_contrato?: number;

  /** Pagamento combinado para o ato da medição: exibe alerta "RECEBER NO ATO" no Painel de Obras. */
  @IsOptional()
  @IsBoolean()
  receber_no_ato_medicao?: boolean;

  @IsOptional()
  @IsDateString()
  data_venda?: string;

  @IsOptional()
  @IsString()
  endereco_entrega?: string;

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
  @Type(() => Number)
  @IsInt()
  representante_venda_usuario_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  representante_venda_funcionario_id?: number;

  @IsOptional()
  @IsString()
  representante_venda_2_nome?: string;

  @IsOptional()
  @IsString()
  representante_venda_2_cpf?: string;

  @IsOptional()
  @IsString()
  representante_venda_2_rg?: string;

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

  /** Formas de pagamento agrupadas (valor base, com/sem juros) para o texto do contrato. Opcional; quando enviado, usado na descrição do contrato. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendaFormaPagamentoDto)
  formas_pagamento?: CreateVendaFormaPagamentoDto[];
}
